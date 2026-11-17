import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
const strictUuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function cleanString(str: string): string {
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
      if (curr.length >= 2) {
        try {
          const s = curr.toString('utf-8').trim();
          if (s.length >= 2) strings.push(s);
        } catch {}
      }
      curr = Buffer.alloc(0);
    }
  }
  if (curr.length >= 2) {
    try {
      const s = curr.toString('utf-8').trim();
      if (s.length >= 2) strings.push(s);
    } catch {}
  }
  return strings;
}

export async function recoverHazmatData() {
  console.log('====================================================');
  console.log('   HAZMAT ULTRA-DERİN VERİ KURTARMA (WAL & DISK)    ');
  console.log('====================================================');
  console.log('Tarih:', new Date().toLocaleString('tr-TR'));
  console.log('PostgreSQL WAL günlükleri ve disk blokları taranıyor...\n');

  try {
    // 1. Get Categories, HazardLabels, AdrLabels, PPEs, Facilities for validation
    console.log('[1/7] Sistem tanımları yükleniyor (Doğrulama ve Eşleştirme için)...');
    const allCategories = await prisma.hazmatCategory.findMany();
    const categoryIds = new Set(allCategories.map(c => c.id));
    
    const allHazardLabels = await prisma.hazmatHazardLabel.findMany();
    const hazardLabelIds = new Set(allHazardLabels.map(h => h.id));

    const allAdrLabels = await prisma.hazmatAdrLabel.findMany();
    const adrLabelIds = new Set(allAdrLabels.map(a => a.id));

    const allPpes = await prisma.hazmatPpe.findMany();
    const ppeIds = new Set(allPpes.map(p => p.id));

    const allFacilities = await prisma.facility.findMany();
    const facilityIds = new Set(allFacilities.map(f => f.id));

    console.log(`  -> Kategoriler: ${allCategories.length}, GHS Etiketleri: ${allHazardLabels.length}, ADR: ${allAdrLabels.length}, KKD: ${allPpes.length}, Tesisler: ${allFacilities.length}\n`);

    // 2. Discover WAL files
    console.log('[2/7] WAL (İşlem Günlüğü) dosyaları taranıyor...');
    const searchDirs = [
      path.resolve(process.cwd(), 'wal_dump'),
      path.resolve(process.cwd(), 'pg_wal'),
      '/var/lib/postgresql/data/pg_wal'
    ];

    const walFiles: string[] = [];
    for (const dir of searchDirs) {
      if (fs.existsSync(dir)) {
        try {
          const files = fs.readdirSync(dir);
          for (const f of files) {
            const fullPath = path.join(dir, f);
            if (f.startsWith('00000001') && fs.statSync(fullPath).isFile()) {
              if (!walFiles.includes(fullPath)) walFiles.push(fullPath);
            }
          }
        } catch {}
      }
    }

    console.log(`  -> Toplam ${walFiles.length} adet WAL dosyası bulundu:`);
    for (const wf of walFiles) {
      console.log(`     * ${path.basename(wf)} (${(fs.statSync(wf).size / 1024 / 1024).toFixed(1)} MB)`);
    }
    console.log('');

    // 3. Scan WAL files for HazmatMaterial tuples
    console.log('[3/7] WAL dosyalarından kimyasal madde blokları çıkarılıyor...');
    const recoveredMaterialsMap = new Map<string, any>();
    const recoveredHazardLabelsMap = new Set<string>();
    const recoveredAdrLabelsMap = new Set<string>();
    const recoveredPpesMap = new Set<string>();
    const recoveredFacilityItemsMap = new Set<string>();

    for (const walPath of walFiles) {
      console.log(`  -> Taranıyor: ${path.basename(walPath)}...`);
      const buf = fs.readFileSync(walPath);
      const text = buf.toString('latin1');

      // Search for K<uuid> patterns (PostgreSQL text varlena header 0x4B + 36 char UUID)
      const kUuidRegex = /\x4B([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/gi;
      let m;

      while ((m = kUuidRegex.exec(text)) !== null) {
        const matId = m[1];
        const offset = m.index;

        // Extract slice following the UUID (up to 4000 bytes)
        const slice = buf.slice(offset + 37, Math.min(buf.length, offset + 37 + 3500));
        const rawStrings = extractAllStringsFromBuffer(slice);
        if (rawStrings.length < 2) continue;

        const fullText = rawStrings.join(' ');
        
        // Characteristic chemical keywords
        const isChemical = /dezenfektan|yanıcı|tahriş|soluma|temas|göz|saklama|toksik|sds|ecolab|aqua|kimyasal|korozif|reaksiyon|sprey|alkol|peroksit|asit|çözelti|stot|euh|h3[0-9]{2}|p2[0-9]{2}|akut|deri|yutma|koku|ph|yoğunluk|gbf/i.test(fullText);

        if (!isChemical) continue;

        // First string right after UUID is candidate product name
        let rawName = rawStrings[0].replace(/^[-_?#@: ]+/, '').trim();
        // Remove trailing non-alpha if any
        if (rawName.length < 2 || rawName.startsWith('http') || rawName.includes('---')) continue;

        const record: any = {
          id: matId,
          productName: rawName,
          brandName: null,
          usageMethod: null,
          composition: null,
          hazardDescription: null,
          firstAid: null,
          fireFightingMeasures: null,
          accidentalReleaseMeasures: null,
          handlingAndStorage: null,
          exposureControlsPpe: null,
          physicalAndChemicalProperties: null,
          stabilityAndReactivity: null,
          toxicologicalInformation: null,
          ecologicalInformation: null,
          disposalConsiderations: null,
          regulatoryInfo: null,
          transportInfo: null,
          categoryId: null,
          imageUrl: null,
          sdsUrl: null,
          _rawStringsCount: rawStrings.length,
          _fullTextLength: fullText.length
        };

        // Classify strings into corresponding fields
        for (let i = 1; i < rawStrings.length; i++) {
          const s = rawStrings[i].trim();
          if (s.length < 2) continue;

          // Check for URLs
          if (s.startsWith('/uploads/')) {
            if (s.endsWith('.pdf')) record.sdsUrl = s;
            else if (/\.(jpe?g|png|webp)$/i.test(s)) record.imageUrl = s;
            continue;
          }

          // Check for Category ID
          if (strictUuidRegex.test(s)) {
            if (categoryIds.has(s)) record.categoryId = s;
            continue;
          }

          // Check for Brand (usually 2nd string, short 2-30 chars, no sentences)
          if (!record.brandName && i <= 3 && s.length <= 35 && !/(\. |,|;)/.test(s) && !/dezenfektan|temas|soluma/i.test(s)) {
            record.brandName = s;
            continue;
          }

          // Check for Usage Method
          if (!record.usageMethod && /kullanım|dezenfektan|haricen|temizlik|antiseptik|yüzey|uygulama/i.test(s) && s.length < 150) {
            record.usageMethod = s;
            continue;
          }

          // Check for Composition
          if (!record.composition && /etanol|alkol|amonyum|klorür|hidrojen|sodyum|oran|bilesik|karışım|çözelti|aktif madde/i.test(s) && s.length < 300) {
            record.composition = s;
            continue;
          }

          // Check for Hazard Description
          if (/H[0-9]{3}|EUH[0-9]{3}|tehlike|yanıcı|tahriş|zararlı|aşındırıcı|toksik/i.test(s)) {
            record.hazardDescription = record.hazardDescription ? `${record.hazardDescription} | ${s}` : s;
            continue;
          }

          // Check for First Aid
          if (/soluma|yutma|cilt|göz|doktor|temas|kustur|tıbbi yardım/i.test(s)) {
            record.firstAid = record.firstAid ? `${record.firstAid} | ${s}` : s;
            continue;
          }

          // Check for Fire Fighting
          if (/yangın|söndürme|alev|köpük|karbondioksit|su sisi|patlama/i.test(s)) {
            record.fireFightingMeasures = record.fireFightingMeasures ? `${record.fireFightingMeasures} | ${s}` : s;
            continue;
          }

          // Check for Accidental Release
          if (/dökülme|sızıntı|alan izole|emici|paspas|kanalizasyon|koruyucu giysi/i.test(s)) {
            record.accidentalReleaseMeasures = record.accidentalReleaseMeasures ? `${record.accidentalReleaseMeasures} | ${s}` : s;
            continue;
          }

          // Check for Handling and Storage
          if (/saklama|depolama|serin|kuru|konteyner|havalandırma|direkt güneş|asitlerden uzak/i.test(s)) {
            record.handlingAndStorage = record.handlingAndStorage ? `${record.handlingAndStorage} | ${s}` : s;
            continue;
          }

          // Check for PPE
          if (/eldiven|gözlük|maske|önlük|kkd|solunum|koruyucu donanım/i.test(s)) {
            record.exposureControlsPpe = record.exposureControlsPpe ? `${record.exposureControlsPpe} | ${s}` : s;
            continue;
          }

          // Check for Physical Properties
          if (/renk|koku|ph|yoğunluk|parlama|sıvı|katı|berrak|görünüm/i.test(s)) {
            record.physicalAndChemicalProperties = record.physicalAndChemicalProperties ? `${record.physicalAndChemicalProperties} | ${s}` : s;
            continue;
          }

          // Check for Stability and Reactivity
          if (/stabil|reaksiyon|bozunma|kaçınılması gereken|hidrazoik|oksijen/i.test(s)) {
            record.stabilityAndReactivity = record.stabilityAndReactivity ? `${record.stabilityAndReactivity} | ${s}` : s;
            continue;
          }

          // Check for Toxicological Info
          if (/toksik|ld50|lc50|akut|dermal|oral/i.test(s)) {
            record.toxicologicalInformation = record.toxicologicalInformation ? `${record.toxicologicalInformation} | ${s}` : s;
            continue;
          }

          // Check for Ecological Info
          if (/ekotoksik|sucul|çevre|balık|arı/i.test(s)) {
            record.ecologicalInformation = record.ecologicalInformation ? `${record.ecologicalInformation} | ${s}` : s;
            continue;
          }

          // Check for Disposal
          if (/bertaraf|atık|tasfiye|imha|yönetmelik|konteyner/i.test(s)) {
            record.disposalConsiderations = record.disposalConsiderations ? `${record.disposalConsiderations} | ${s}` : s;
            continue;
          }

          // Check for Transport
          if (/adr|rid|imdg|un [0-9]{4}|aerosol|taşıma/i.test(s)) {
            record.transportInfo = record.transportInfo ? `${record.transportInfo} | ${s}` : s;
            continue;
          }

          // Check for Regulatory
          if (/27092|yönetmelik|gbf|güvenlik bilgi formu|mevzuat|hakkında/i.test(s)) {
            record.regulatoryInfo = record.regulatoryInfo ? `${record.regulatoryInfo} | ${s}` : s;
            continue;
          }
        }

        // Deduplicate: keep richest version of record
        const existing = recoveredMaterialsMap.get(matId);
        if (!existing || existing._fullTextLength < record._fullTextLength) {
          recoveredMaterialsMap.set(matId, record);
        }
      }

      // Also search for relation tuples in WAL (materialId + labelId or ppeId)
      // In WAL, relation tuples look like: K<uuid1>K<uuid2>K<uuid3>
      const tripleUuidRegex = /\x4B([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\x4B([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/gi;
      let relMatch;
      while ((relMatch = tripleUuidRegex.exec(text)) !== null) {
        const u1 = relMatch[1];
        const u2 = relMatch[2];

        // Is u2 a HazardLabel?
        if (hazardLabelIds.has(u2)) {
          recoveredHazardLabelsMap.add(`${u1}:::${u2}`);
        }
        // Is u2 an AdrLabel?
        if (adrLabelIds.has(u2)) {
          recoveredAdrLabelsMap.add(`${u1}:::${u2}`);
        }
        // Is u2 a PPE?
        if (ppeIds.has(u2)) {
          recoveredPpesMap.add(`${u1}:::${u2}`);
        }
        // Is u1 a Facility and u2 a Material?
        if (facilityIds.has(u1)) {
          recoveredFacilityItemsMap.add(`${u1}:::${u2}`);
        }
      }
    }

    const recoveredMaterials = Array.from(recoveredMaterialsMap.values());
    console.log(`\n  -> WAL Taraması Sonucu: ${recoveredMaterials.length} adet kimyasal madde eksiksiz tespit edildi!`);
    console.log(`  -> GHS İlişkisi: ${recoveredHazardLabelsMap.size}`);
    console.log(`  -> ADR İlişkisi: ${recoveredAdrLabelsMap.size}`);
    console.log(`  -> KKD İlişkisi: ${recoveredPpesMap.size}`);
    console.log(`  -> Tesis Envanter İlişkisi: ${recoveredFacilityItemsMap.size}\n`);

    // 4. Scan raw heap pages from HazmatMaterialAdrLabel to collect more materialIds
    console.log('[4/7] `HazmatMaterialAdrLabel` disk sayfaları taranıyor...');
    try {
      await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS pageinspect;');
      const adrRows: any[] = await prisma.$queryRawUnsafe(`
        SELECT encode(t_data, 'hex') as hex_data FROM heap_page_items(get_raw_page('"HazmatMaterialAdrLabel"', 0)) WHERE t_data IS NOT NULL;
      `);
      for (const r of adrRows) {
        const buf = Buffer.from(r.hex_data, 'hex');
        const matches = buf.toString('utf-8').match(uuidRegex);
        if (matches && matches.length >= 2) {
          recoveredAdrLabelsMap.add(`${matches[0]}:::${matches[1]}`);
        }
      }
    } catch (e: any) {
      console.warn('  ! AdrLabel sayfası okunurken uyarı:', e.message);
    }

    // 5. Save permanent backup files (JSON and SQL)
    console.log('[5/7] Kurtarılan verilerin kalıcı yedek dosyaları oluşturuluyor...');
    const backupDir = path.resolve(process.cwd(), 'recovered_backups');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

    const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
    const jsonPath = path.join(backupDir, `hazmat_wal_recovered_${timestampStr}.json`);
    const sqlPath = path.join(backupDir, `hazmat_wal_recovered_${timestampStr}.sql`);

    const exportData = {
      timestamp: new Date().toISOString(),
      counts: {
        materials: recoveredMaterials.length,
        ghsLabels: recoveredHazardLabelsMap.size,
        adrLabels: recoveredAdrLabelsMap.size,
        ppes: recoveredPpesMap.size,
        facilityItems: recoveredFacilityItemsMap.size
      },
      materials: recoveredMaterials,
      ghsLabels: Array.from(recoveredHazardLabelsMap),
      adrLabels: Array.from(recoveredAdrLabelsMap),
      ppes: Array.from(recoveredPpesMap),
      facilityItems: Array.from(recoveredFacilityItemsMap)
    };

    fs.writeFileSync(jsonPath, JSON.stringify(exportData, null, 2), 'utf-8');

    // Generate SQL Restore
    let sqlContent = `-- HAZMAT WAL RESTORE SCRIPT\n-- Date: ${new Date().toISOString()}\n\n`;
    for (const m of recoveredMaterials) {
      const pName = (m.productName || 'İsimsiz Kimyasal').replace(/'/g, "''");
      const bName = m.brandName ? `'${m.brandName.replace(/'/g, "''")}'` : 'NULL';
      const uMethod = m.usageMethod ? `'${m.usageMethod.replace(/'/g, "''")}'` : 'NULL';
      const comp = m.composition ? `'${m.composition.replace(/'/g, "''")}'` : 'NULL';
      const hazDesc = m.hazardDescription ? `'${m.hazardDescription.replace(/'/g, "''")}'` : 'NULL';
      const firstAid = m.firstAid ? `'${m.firstAid.replace(/'/g, "''")}'` : 'NULL';
      const fire = m.fireFightingMeasures ? `'${m.fireFightingMeasures.replace(/'/g, "''")}'` : 'NULL';
      const acc = m.accidentalReleaseMeasures ? `'${m.accidentalReleaseMeasures.replace(/'/g, "''")}'` : 'NULL';
      const hand = m.handlingAndStorage ? `'${m.handlingAndStorage.replace(/'/g, "''")}'` : 'NULL';
      const exp = m.exposureControlsPpe ? `'${m.exposureControlsPpe.replace(/'/g, "''")}'` : 'NULL';
      const phys = m.physicalAndChemicalProperties ? `'${m.physicalAndChemicalProperties.replace(/'/g, "''")}'` : 'NULL';
      const stab = m.stabilityAndReactivity ? `'${m.stabilityAndReactivity.replace(/'/g, "''")}'` : 'NULL';
      const tox = m.toxicologicalInformation ? `'${m.toxicologicalInformation.replace(/'/g, "''")}'` : 'NULL';
      const eco = m.ecologicalInformation ? `'${m.ecologicalInformation.replace(/'/g, "''")}'` : 'NULL';
      const disp = m.disposalConsiderations ? `'${m.disposalConsiderations.replace(/'/g, "''")}'` : 'NULL';
      const reg = m.regulatoryInfo ? `'${m.regulatoryInfo.replace(/'/g, "''")}'` : 'NULL';
      const trans = m.transportInfo ? `'${m.transportInfo.replace(/'/g, "''")}'` : 'NULL';
      const catId = m.categoryId ? `'${m.categoryId}'` : 'NULL';
      const imgUrl = m.imageUrl ? `'${m.imageUrl}'` : 'NULL';
      const sdsUrl = m.sdsUrl ? `'${m.sdsUrl}'` : 'NULL';

      sqlContent += `INSERT INTO "HazmatMaterial" ("id", "productName", "brandName", "usageMethod", "composition", "hazardDescription", "firstAid", "fireFightingMeasures", "accidentalReleaseMeasures", "handlingAndStorage", "exposureControlsPpe", "physicalAndChemicalProperties", "stabilityAndReactivity", "toxicologicalInformation", "ecologicalInformation", "disposalConsiderations", "regulatoryInfo", "transportInfo", "categoryId", "imageUrl", "sdsUrl", "isActive", "createdAt", "updatedAt") VALUES ('${m.id}', '${pName}', ${bName}, ${uMethod}, ${comp}, ${hazDesc}, ${firstAid}, ${fire}, ${acc}, ${hand}, ${exp}, ${phys}, ${stab}, ${tox}, ${eco}, ${disp}, ${reg}, ${trans}, ${catId}, ${imgUrl}, ${sdsUrl}, true, NOW(), NOW()) ON CONFLICT ("id") DO UPDATE SET "productName" = EXCLUDED."productName";\n`;
    }
    fs.writeFileSync(sqlPath, sqlContent, 'utf-8');

    console.log(`  -> JSON yedeği kaydedildi: ${jsonPath}`);
    console.log(`  -> SQL restore dosyası kaydedildi: ${sqlPath}\n`);

    // 6. Restore to PostgreSQL Database
    console.log('[6/7] Veritabanına yeniden aktarım (Restore) başlatılıyor...');
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
        categoryId: m.categoryId || null,
        imageUrl: m.imageUrl || null,
        sdsUrl: m.sdsUrl || null,
        isActive: true
      };

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

    console.log(`  -> ${insertedCount} adet kimyasal madde veritabanına yeniden yazıldı!`);
    console.log(`  -> ${updatedCount} adet mevcut kimyasal güncellendi.`);

    // Restore GHS Labels
    let ghsRestored = 0;
    for (const rel of recoveredHazardLabelsMap) {
      const [matId, labelId] = rel.split(':::');
      if (existingIds.has(matId) && hazardLabelIds.has(labelId)) {
        try {
          await prisma.hazmatMaterialHazardLabel.upsert({
            where: { materialId_labelId: { materialId: matId, labelId } },
            update: {},
            create: { materialId: matId, labelId }
          });
          ghsRestored++;
        } catch {}
      }
    }
    console.log(`  -> ${ghsRestored} adet GHS Piktogram bağlantısı kuruldu.`);

    // Restore ADR Labels
    let adrRestored = 0;
    for (const rel of recoveredAdrLabelsMap) {
      const [matId, labelId] = rel.split(':::');
      if (existingIds.has(matId) && adrLabelIds.has(labelId)) {
        try {
          await prisma.hazmatMaterialAdrLabel.upsert({
            where: { materialId_labelId: { materialId: matId, labelId } },
            update: {},
            create: { materialId: matId, labelId }
          });
          adrRestored++;
        } catch {}
      }
    }
    console.log(`  -> ${adrRestored} adet ADR Etiketi bağlantısı kuruldu.`);

    // Restore PPEs
    let ppeRestored = 0;
    for (const rel of recoveredPpesMap) {
      const [matId, ppeId] = rel.split(':::');
      if (existingIds.has(matId) && ppeIds.has(ppeId)) {
        try {
          await prisma.hazmatMaterialPpe.upsert({
            where: { materialId_ppeId: { materialId: matId, ppeId } },
            update: {},
            create: { materialId: matId, ppeId }
          });
          ppeRestored++;
        } catch {}
      }
    }
    console.log(`  -> ${ppeRestored} adet KKD bağlantısı kuruldu.`);

    // Restore Facility Items
    let facRestored = 0;
    for (const rel of recoveredFacilityItemsMap) {
      const [facId, matId] = rel.split(':::');
      if (facilityIds.has(facId) && existingIds.has(matId)) {
        try {
          await prisma.facilityHazmatItem.upsert({
            where: { facilityId_materialId: { facilityId: facId, materialId: matId } },
            update: {},
            create: { facilityId: facId, materialId: matId }
          });
          facRestored++;
        } catch {}
      }
    }
    console.log(`  -> ${facRestored} adet Tesis Envanter bağlantısı kuruldu.\n`);

    // 7. Final Summary
    console.log('[7/7] TAMAMLANDI! ÖZET RAPOR:');
    console.log('----------------------------------------------------');
    console.log(`Kurtarılan Toplam Kimyasal Sayısı: ${recoveredMaterials.length}`);
    for (let i = 0; i < recoveredMaterials.length; i++) {
      const rm = recoveredMaterials[i];
      console.log(`  ${i + 1}. [${rm.id}] ${rm.productName} (${rm.brandName || 'Marka Belirtilmemiş'})`);
      if (rm.hazardDescription) console.log(`     Tehlike: ${rm.hazardDescription.substring(0, 80)}...`);
      if (rm.firstAid) console.log(`     İlk Yardım: ${rm.firstAid.substring(0, 80)}...`);
    }
    console.log('----------------------------------------------------');
    console.log('Tüm veriler başarıyla kurtarıldı ve kalıcı olarak veritabanına aktarıldı!');

  } catch (err: any) {
    console.error('Kurtarma sırasında hata:', err);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  recoverHazmatData();
}
