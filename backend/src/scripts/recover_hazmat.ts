import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const POSTGRES_EPOCH_MS = Date.UTC(2000, 0, 1);

function parseTimestamp(buf: Buffer, offset: number): Date | null {
  try {
    const alignedOffset = Math.ceil(offset / 8) * 8;
    if (alignedOffset + 8 <= buf.length) {
      const micro = buf.readBigInt64LE(alignedOffset);
      const ms = Number(micro / 1000n);
      const d = new Date(POSTGRES_EPOCH_MS + ms);
      if (!isNaN(d.getTime()) && d.getFullYear() >= 1990 && d.getFullYear() <= 2100) {
        return d;
      }
    }
  } catch {}
  return null;
}

function cleanString(str: string): string {
  // Remove non-printable control characters except newline and tab
  return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '').trim();
}

function extractAllStringsFromBuffer(buf: Buffer): string[] {
  const strings: string[] = [];
  let curr = Buffer.alloc(0);
  for (let i = 0; i < buf.length; i++) {
    const b = buf[i];
    if ((b >= 32 && b <= 126) || b >= 128) {
      curr = Buffer.concat([curr, Buffer.from([b])]);
    } else {
      if (curr.length >= 3) {
        try {
          const s = curr.toString('utf-8');
          if (s.trim().length >= 2) strings.push(s.trim());
        } catch {}
      }
      curr = Buffer.alloc(0);
    }
  }
  if (curr.length >= 3) {
    try {
      const s = curr.toString('utf-8');
      if (s.trim().length >= 2) strings.push(s.trim());
    } catch {}
  }
  return strings;
}

interface RawTuple {
  lp: number;
  t_xmin: string;
  t_xmax: string;
  t_ctid: string;
  t_infomask: number;
  t_infomask2: number;
  t_bits: string | null;
  hex_data: string;
}

export async function recoverHazmatData() {
  console.log('====================================================');
  console.log('   HAZMAT KRİTİK VERİ KURTARMA SİSTEMİ (MVCC SCAN)   ');
  console.log('====================================================');
  console.log('Tarih:', new Date().toLocaleString('tr-TR'));
  console.log('PostgreSQL disk sayfaları (heap pages) taranıyor...\n');

  try {
    // 1. Ensure pageinspect extension is enabled
    console.log('[1/6] PostgreSQL `pageinspect` eklentisi kontrol ediliyor...');
    await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS pageinspect;');
    console.log('  -> pageinspect hazır.\n');

    // 2. Scan HazmatMaterial pages
    console.log('[2/6] `HazmatMaterial` disk sayfaları taranıyor...');
    const sizeResult: any[] = await prisma.$queryRawUnsafe(`
      SELECT COALESCE(pg_relation_size('"HazmatMaterial"') / 8192, 0)::int as pages;
    `);
    const pageCount = Number(sizeResult[0]?.pages || 0);
    console.log(`  -> Toplam sayfa sayısı: ${pageCount}`);

    const rawMaterialsMap = new Map<string, any>();

    for (let page = 0; page < pageCount; page++) {
      const items: RawTuple[] = await prisma.$queryRawUnsafe(`
        SELECT lp, t_xmin::text as t_xmin, t_xmax::text as t_xmax, t_ctid::text, t_infomask, t_infomask2, t_bits, encode(t_data, 'hex') as hex_data
        FROM heap_page_items(get_raw_page('"HazmatMaterial"', ${page}))
        WHERE t_data IS NOT NULL;
      `);

      for (const item of items) {
        if (!item.hex_data) continue;
        const buf = Buffer.from(item.hex_data, 'hex');
        if (buf.length < 37) continue;

        // Extract ID (first field is UUID)
        const allStrings = extractAllStringsFromBuffer(buf);
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        
        let materialId: string | null = null;
        let offset = 0;

        // Try decoding first varlena field
        const b0 = buf[0];
        if ((b0 & 0x01) === 0x01) {
          const len = (b0 >> 1) - 1;
          if (len === 36) {
            const candidate = buf.slice(1, 37).toString('utf-8');
            if (uuidRegex.test(candidate)) {
              materialId = candidate;
              offset = 37;
            }
          }
        }

        if (!materialId) {
          // Fallback UUID match in buffer
          for (const s of allStrings) {
            if (uuidRegex.test(s)) {
              materialId = s;
              break;
            }
          }
        }

        if (!materialId) continue;

        // Decode fields sequentially according to PostgreSQL table schema
        // Col order: id, productName, brandName, usageMethod, composition, hazardDescription,
        // firstAid, fireFightingMeasures, accidentalReleaseMeasures, handlingAndStorage,
        // exposureControlsPpe, physicalAndChemicalProperties, stabilityAndReactivity,
        // toxicologicalInformation, ecologicalInformation, disposalConsiderations,
        // createdAt, updatedAt, isActive, regulatoryInfo, transportInfo, categoryId,
        // imageUrl, sdsExpiryDate, sdsUrl
        const tbits = item.t_bits || '1111111111111111111111111';
        
        const colNames = [
          'id', 'productName', 'brandName', 'usageMethod', 'composition', 'hazardDescription',
          'firstAid', 'fireFightingMeasures', 'accidentalReleaseMeasures', 'handlingAndStorage',
          'exposureControlsPpe', 'physicalAndChemicalProperties', 'stabilityAndReactivity',
          'toxicologicalInformation', 'ecologicalInformation', 'disposalConsiderations',
          'createdAt', 'updatedAt', 'isActive', 'regulatoryInfo', 'transportInfo',
          'categoryId', 'imageUrl', 'sdsExpiryDate', 'sdsUrl'
        ];

        const record: Record<string, any> = {
          id: materialId,
          _xmin: item.t_xmin,
          _xmax: item.t_xmax,
          _page: page,
          _lp: item.lp
        };

        let currOffset = 0;
        for (let colIdx = 0; colIdx < colNames.length; colIdx++) {
          const colName = colNames[colIdx];
          const isPresent = colIdx < tbits.length ? tbits[colIdx] === '1' : false;

          if (!isPresent) {
            record[colName] = null;
            continue;
          }

          if (colName === 'id') {
            record['id'] = materialId;
            currOffset = 37;
            continue;
          }

          if (colName === 'createdAt' || colName === 'updatedAt' || colName === 'sdsExpiryDate') {
            currOffset = Math.ceil(currOffset / 8) * 8;
            if (currOffset + 8 <= buf.length) {
              record[colName] = parseTimestamp(buf, currOffset);
              currOffset += 8;
            } else {
              record[colName] = null;
            }
          } else if (colName === 'isActive') {
            if (currOffset < buf.length) {
              record['isActive'] = buf[currOffset] !== 0;
              currOffset += 1;
            } else {
              record['isActive'] = true;
            }
          } else {
            // Text field (varlena)
            if (currOffset >= buf.length) {
              record[colName] = null;
              continue;
            }
            const byteHeader = buf[currOffset];
            if ((byteHeader & 0x01) === 0x01) {
              // 1-byte header
              const len = (byteHeader >> 1) - 1;
              if (currOffset + 1 + len <= buf.length) {
                record[colName] = cleanString(buf.slice(currOffset + 1, currOffset + 1 + len).toString('utf-8'));
                currOffset += 1 + len;
              } else {
                record[colName] = null;
              }
            } else if ((byteHeader & 0x03) === 0x00) {
              // 4-byte header
              currOffset = Math.ceil(currOffset / 4) * 4;
              if (currOffset + 4 <= buf.length) {
                const headerVal = buf.readUInt32LE(currOffset);
                const len = (headerVal >> 2) - 4;
                if (len > 0 && currOffset + 4 + len <= buf.length) {
                  record[colName] = cleanString(buf.slice(currOffset + 4, currOffset + 4 + len).toString('utf-8'));
                  currOffset += 4 + len;
                } else {
                  record[colName] = null;
                }
              } else {
                record[colName] = null;
              }
            } else {
              // Compressed or TOAST pointer: look in extracted strings or keep raw
              record[colName] = null;
              currOffset += 18;
            }
          }
        }

        // Post-validation: ensure productName exists
        if (!record.productName || record.productName.length < 2) {
          // Look for first non-UUID string
          for (const s of allStrings) {
            if (s !== materialId && !uuidRegex.test(s) && s.length >= 2) {
              record.productName = s;
              break;
            }
          }
        }

        // Search for categoryId in strings if null
        if (!record.categoryId) {
          for (const s of allStrings) {
            if (uuidRegex.test(s) && s !== materialId) {
              record.categoryId = s;
              break;
            }
          }
        }

        // Search for upload image/sds URLs in strings if null
        for (const s of allStrings) {
          if (s.startsWith('/uploads/')) {
            if (s.endsWith('.pdf')) record.sdsUrl = s;
            else if (s.endsWith('.jpg') || s.endsWith('.jpeg') || s.endsWith('.png')) record.imageUrl = s;
          }
        }

        // If duplicate versions exist in pages, keep the one with newer xmax or richer text
        const existing = rawMaterialsMap.get(materialId);
        if (!existing) {
          rawMaterialsMap.set(materialId, record);
        } else {
          // Keep version with more filled text fields
          const existingTextLen = Object.values(existing).filter(v => typeof v === 'string').join('').length;
          const currentTextLen = Object.values(record).filter(v => typeof v === 'string').join('').length;
          if (currentTextLen >= existingTextLen) {
            rawMaterialsMap.set(materialId, record);
          }
        }
      }
    }

    const recoveredMaterials = Array.from(rawMaterialsMap.values());
    console.log(`  -> Toplam ${recoveredMaterials.length} adet kimyasal madde disk bloklarında tespit edildi!\n`);

    // 3. Scan relation tables: HazardLabels, AdrLabels, Ppe, FacilityItems
    console.log('[3/6] İlişkili tabloların disk sayfaları taranıyor (GHS, ADR, KKD, Tesis Envanteri)...');

    const recoveredHazardLabels: { materialId: string; labelId: string }[] = [];
    const recoveredAdrLabels: { materialId: string; labelId: string }[] = [];
    const recoveredPpes: { materialId: string; ppeId: string }[] = [];
    const recoveredFacilityItems: { facilityId: string; materialId: string; amountValue?: number | null; unitId?: string | null }[] = [];

    const uuidExtractRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

    // GHS Hazard Labels
    try {
      const ghsSizeResult: any[] = await prisma.$queryRawUnsafe(`SELECT COALESCE(pg_relation_size('"HazmatMaterialHazardLabel"') / 8192, 0)::int as pages;`);
      const ghsPages = Number(ghsSizeResult[0]?.pages || 0);
      for (let p = 0; p < ghsPages; p++) {
        const rows: any[] = await prisma.$queryRawUnsafe(`
          SELECT encode(t_data, 'hex') as hex_data FROM heap_page_items(get_raw_page('"HazmatMaterialHazardLabel"', ${p})) WHERE t_data IS NOT NULL;
        `);
        for (const r of rows) {
          const buf = Buffer.from(r.hex_data, 'hex');
          const str = buf.toString('utf-8');
          const matches = str.match(uuidExtractRegex);
          if (matches && matches.length >= 2) {
            recoveredHazardLabels.push({ materialId: matches[0], labelId: matches[1] });
          }
        }
      }
      console.log(`  -> ${recoveredHazardLabels.length} adet GHS Tehlike Piktogram eşleşmesi bulundu.`);
    } catch (e: any) {
      console.warn('  ! GHS etiketleri taranırken uyarı:', e.message);
    }

    // ADR Labels
    try {
      const adrSizeResult: any[] = await prisma.$queryRawUnsafe(`SELECT COALESCE(pg_relation_size('"HazmatMaterialAdrLabel"') / 8192, 0)::int as pages;`);
      const adrPages = Number(adrSizeResult[0]?.pages || 0);
      for (let p = 0; p < adrPages; p++) {
        const rows: any[] = await prisma.$queryRawUnsafe(`
          SELECT encode(t_data, 'hex') as hex_data FROM heap_page_items(get_raw_page('"HazmatMaterialAdrLabel"', ${p})) WHERE t_data IS NOT NULL;
        `);
        for (const r of rows) {
          const buf = Buffer.from(r.hex_data, 'hex');
          const str = buf.toString('utf-8');
          const matches = str.match(uuidExtractRegex);
          if (matches && matches.length >= 2) {
            recoveredAdrLabels.push({ materialId: matches[0], labelId: matches[1] });
          }
        }
      }
      console.log(`  -> ${recoveredAdrLabels.length} adet ADR Taşıma Etiketi eşleşmesi bulundu.`);
    } catch (e: any) {
      console.warn('  ! ADR etiketleri taranırken uyarı:', e.message);
    }

    // PPE (KKD)
    try {
      const ppeSizeResult: any[] = await prisma.$queryRawUnsafe(`SELECT COALESCE(pg_relation_size('"HazmatMaterialPpe"') / 8192, 0)::int as pages;`);
      const ppePages = Number(ppeSizeResult[0]?.pages || 0);
      for (let p = 0; p < ppePages; p++) {
        const rows: any[] = await prisma.$queryRawUnsafe(`
          SELECT encode(t_data, 'hex') as hex_data FROM heap_page_items(get_raw_page('"HazmatMaterialPpe"', ${p})) WHERE t_data IS NOT NULL;
        `);
        for (const r of rows) {
          const buf = Buffer.from(r.hex_data, 'hex');
          const str = buf.toString('utf-8');
          const matches = str.match(uuidExtractRegex);
          if (matches && matches.length >= 2) {
            recoveredPpes.push({ materialId: matches[0], ppeId: matches[1] });
          }
        }
      }
      console.log(`  -> ${recoveredPpes.length} adet KKD eşleşmesi bulundu.`);
    } catch (e: any) {
      console.warn('  ! KKD etiketleri taranırken uyarı:', e.message);
    }

    // Facility items
    try {
      const facSizeResult: any[] = await prisma.$queryRawUnsafe(`SELECT COALESCE(pg_relation_size('"FacilityHazmatItem"') / 8192, 0)::int as pages;`);
      const facPages = Number(facSizeResult[0]?.pages || 0);
      for (let p = 0; p < facPages; p++) {
        const rows: any[] = await prisma.$queryRawUnsafe(`
          SELECT encode(t_data, 'hex') as hex_data FROM heap_page_items(get_raw_page('"FacilityHazmatItem"', ${p})) WHERE t_data IS NOT NULL;
        `);
        for (const r of rows) {
          const buf = Buffer.from(r.hex_data, 'hex');
          const str = buf.toString('utf-8');
          const matches = str.match(uuidExtractRegex);
          if (matches && matches.length >= 2) {
            recoveredFacilityItems.push({ facilityId: matches[0], materialId: matches[1], unitId: matches[2] || null });
          }
        }
      }
      console.log(`  -> ${recoveredFacilityItems.length} adet Tesis Envanter kaydı bulundu.\n`);
    } catch (e: any) {
      console.warn('  ! Tesis envanterleri taranırken uyarı:', e.message);
    }

    // 4. Export to JSON and SQL backups immediately before writing
    console.log('[4/6] Kurtarılan verilerin kalıcı yedek dosyaları oluşturuluyor...');
    const exportData = {
      timestamp: new Date().toISOString(),
      counts: {
        materials: recoveredMaterials.length,
        hazardLabels: recoveredHazardLabels.length,
        adrLabels: recoveredAdrLabels.length,
        ppes: recoveredPpes.length,
        facilityItems: recoveredFacilityItems.length
      },
      materials: recoveredMaterials,
      hazardLabels: recoveredHazardLabels,
      adrLabels: recoveredAdrLabels,
      ppes: recoveredPpes,
      facilityItems: recoveredFacilityItems
    };

    const backupDir = path.resolve(process.cwd(), 'recovered_backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
    const jsonPath = path.join(backupDir, `hazmat_recovered_${timestampStr}.json`);
    const sqlPath = path.join(backupDir, `hazmat_recovered_${timestampStr}.sql`);

    fs.writeFileSync(jsonPath, JSON.stringify(exportData, null, 2), 'utf-8');

    // Generate SQL restore script
    let sqlContent = `-- HAZMAT RECOVERY BACKUP DUMP\n-- Date: ${new Date().toISOString()}\n\n`;
    for (const m of recoveredMaterials) {
      const pName = (m.productName || 'İsimsiz Kimyasal').replace(/'/g, "''");
      const bName = m.brandName ? `'${m.brandName.replace(/'/g, "''")}'` : 'NULL';
      const uMethod = m.usageMethod ? `'${m.usageMethod.replace(/'/g, "''")}'` : 'NULL';
      const comp = m.composition ? `'${m.composition.replace(/'/g, "''")}'` : 'NULL';
      const hazDesc = m.hazardDescription ? `'${m.hazardDescription.replace(/'/g, "''")}'` : 'NULL';
      const firstAid = m.firstAid ? `'${m.firstAid.replace(/'/g, "''")}'` : 'NULL';
      const catId = m.categoryId ? `'${m.categoryId}'` : 'NULL';
      const imgUrl = m.imageUrl ? `'${m.imageUrl}'` : 'NULL';
      const sdsUrl = m.sdsUrl ? `'${m.sdsUrl}'` : 'NULL';

      sqlContent += `INSERT INTO "HazmatMaterial" ("id", "productName", "brandName", "usageMethod", "composition", "hazardDescription", "firstAid", "categoryId", "imageUrl", "sdsUrl", "isActive", "createdAt", "updatedAt") VALUES ('${m.id}', '${pName}', ${bName}, ${uMethod}, ${comp}, ${hazDesc}, ${firstAid}, ${catId}, ${imgUrl}, ${sdsUrl}, true, NOW(), NOW()) ON CONFLICT ("id") DO UPDATE SET "productName" = EXCLUDED."productName";\n`;
    }
    fs.writeFileSync(sqlPath, sqlContent, 'utf-8');

    console.log(`  -> JSON yedeği kaydedildi: ${jsonPath}`);
    console.log(`  -> SQL restore dosyası kaydedildi: ${sqlPath}\n`);

    // 5. Restore back to Database
    console.log('[5/6] Veritabanına yeniden aktarım (Restore) başlatılıyor...');
    
    // Check existing materials in DB
    const existingMaterials = await prisma.hazmatMaterial.findMany({ select: { id: true } });
    const existingIds = new Set(existingMaterials.map(m => m.id));

    let insertedCount = 0;
    let updatedCount = 0;

    for (const m of recoveredMaterials) {
      if (!m.id) continue;
      
      const payload: any = {
        productName: m.productName || 'İsimsiz Kimyasal',
        brandName: m.brandName || null,
        usageMethod: m.usageMethod || null,
        composition: m.composition || null,
        hazardDescription: m.hazardDescription || null,
        firstAid: m.firstAid || null,
        fireFightingMeasures: m.fireFightingMeasures || null,
        accidentalReleaseMeasures: m.accidentalReleaseMeasures || null,
        handlingAndStorage: m.handlingAndStorage || null,
        exposureControlsPpe: m.exposureControlsPpe || null,
        physicalAndChemicalProperties: m.physicalAndChemicalProperties || null,
        stabilityAndReactivity: m.stabilityAndReactivity || null,
        toxicologicalInformation: m.toxicologicalInformation || null,
        ecologicalInformation: m.ecologicalInformation || null,
        disposalConsiderations: m.disposalConsiderations || null,
        regulatoryInfo: m.regulatoryInfo || null,
        transportInfo: m.transportInfo || null,
        imageUrl: m.imageUrl || null,
        sdsUrl: m.sdsUrl || null,
        isActive: true
      };

      // Validate categoryId exists if provided
      if (m.categoryId) {
        const cat = await prisma.hazmatCategory.findUnique({ where: { id: m.categoryId } });
        if (cat) payload.categoryId = m.categoryId;
      }

      if (existingIds.has(m.id)) {
        await prisma.hazmatMaterial.update({
          where: { id: m.id },
          data: payload
        });
        updatedCount++;
      } else {
        await prisma.hazmatMaterial.create({
          data: {
            id: m.id,
            ...payload
          }
        });
        insertedCount++;
        existingIds.add(m.id);
      }
    }

    console.log(`  -> ${insertedCount} adet silinmiş kimyasal veritabanına yeniden eklendi!`);
    console.log(`  -> ${updatedCount} adet mevcut kimyasal güncellendi.`);

    // Restore GHS Labels
    let ghsRestored = 0;
    for (const item of recoveredHazardLabels) {
      try {
        if (!existingIds.has(item.materialId)) continue;
        const labelExists = await prisma.hazmatHazardLabel.findUnique({ where: { id: item.labelId } });
        if (!labelExists) continue;

        await prisma.hazmatMaterialHazardLabel.upsert({
          where: { materialId_labelId: { materialId: item.materialId, labelId: item.labelId } },
          update: {},
          create: { materialId: item.materialId, labelId: item.labelId }
        });
        ghsRestored++;
      } catch {}
    }
    console.log(`  -> ${ghsRestored} adet GHS Tehlike Piktogram bağlantısı onarıldı.`);

    // Restore ADR Labels
    let adrRestored = 0;
    for (const item of recoveredAdrLabels) {
      try {
        if (!existingIds.has(item.materialId)) continue;
        const labelExists = await prisma.hazmatAdrLabel.findUnique({ where: { id: item.labelId } });
        if (!labelExists) continue;

        await prisma.hazmatMaterialAdrLabel.upsert({
          where: { materialId_labelId: { materialId: item.materialId, labelId: item.labelId } },
          update: {},
          create: { materialId: item.materialId, labelId: item.labelId }
        });
        adrRestored++;
      } catch {}
    }
    console.log(`  -> ${adrRestored} adet ADR Taşıma Etiketi bağlantısı onarıldı.`);

    // Restore PPEs
    let ppeRestored = 0;
    for (const item of recoveredPpes) {
      try {
        if (!existingIds.has(item.materialId)) continue;
        const ppeExists = await prisma.hazmatPpe.findUnique({ where: { id: item.ppeId } });
        if (!ppeExists) continue;

        await prisma.hazmatMaterialPpe.upsert({
          where: { materialId_ppeId: { materialId: item.materialId, ppeId: item.ppeId } },
          update: {},
          create: { materialId: item.materialId, ppeId: item.ppeId }
        });
        ppeRestored++;
      } catch {}
    }
    console.log(`  -> ${ppeRestored} adet KKD donanım bağlantısı onarıldı.`);

    // Restore Facility Items
    let facRestored = 0;
    for (const item of recoveredFacilityItems) {
      try {
        if (!existingIds.has(item.materialId)) continue;
        const facilityExists = await prisma.facility.findUnique({ where: { id: item.facilityId } });
        if (!facilityExists) continue;

        await prisma.facilityHazmatItem.upsert({
          where: { facilityId_materialId: { facilityId: item.facilityId, materialId: item.materialId } },
          update: {},
          create: {
            facilityId: item.facilityId,
            materialId: item.materialId,
            unitId: item.unitId || null
          }
        });
        facRestored++;
      } catch {}
    }
    console.log(`  -> ${facRestored} adet Tesis Envanter bağlantısı onarıldı.\n`);

    console.log('[6/6] TAMAMLANDI! Özet:');
    console.log('----------------------------------------------------');
    console.log(`Kurtarılan ve Geri Yüklenen Kimyasal Sayısı: ${recoveredMaterials.length}`);
    for (let idx = 0; idx < recoveredMaterials.length; idx++) {
      const rm = recoveredMaterials[idx];
      console.log(`  ${idx + 1}. [${rm.id}] ${rm.productName} (${rm.brandName || 'Marka Belirtilmemiş'})`);
    }
    console.log('----------------------------------------------------');
    console.log('Kurtarma işlemi başarıyla sonuçlandı. Veritabanı ve arayüz güncellendi.');

  } catch (err: any) {
    console.error('Kurtarma işlemi sırasında hata oluştu:', err);
  } finally {
    await prisma.$disconnect();
  }
}

// Auto-run if executed directly
if (require.main === module) {
  recoverHazmatData();
}
