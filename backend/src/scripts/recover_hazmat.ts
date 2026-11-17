import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
const strictUuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function cleanString(str: string): string {
  return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\uFFFD]/g, '').trim();
}

function cleanProductName(rawName: string): string {
  let name = rawName.trim();
  // Strip non-alphanumeric leading chars
  name = name.replace(/^[^a-zA-Z0-9ÇĞİÖŞÜçğıöşü]+/, '');
  
  // If first char is a single byte artifact preceding known chemical brand or word:
  const prefixes = [
    'CLINICAL', 'Alinity', 'Albumin', 'OOSAFE', 'JOHNSON', 'MUSTELA',
    'DERHAND', 'ULTRASON', 'CRYOS', 'INCIDIN', 'HİDROJEN', 'KONIX', 'ECOLAB',
    'BİKAR', 'BIKAR', 'MERCK', 'SIGMA', 'ABBOTT', 'ROCHE', 'SIEMENS'
  ];
  for (const p of prefixes) {
    const reg = new RegExp(`^[A-Za-z0-9](${p}.*)`, 'i');
    if (reg.test(name) && !name.toLowerCase().startsWith(p.toLowerCase())) {
      name = name.replace(reg, '$1');
      break;
    }
  }
  return name.trim();
}

function isRealHazmatMaterial(name: string, fullText: string): boolean {
  // 1. Strict Exclusions (Inspections, Electrical, Elevator, Audits, Personal Names)
  const excludeRegex = /RoyalCert|DAVUT KARAGÖZ|FLUKE|PRİZ|NOLU PRİZ|UPS Odası|Jeneratör|Pano|Topraklama|Trafo|Asansör|Trafolar|Kazan Dairesi|MP-BAHCELIEVLER|ISU-MP|İSU-MP|D BLOK|A BLOK|B BLOK|C BLOK|KAT|Fine Kinney|Mevcut önlem|Alınacak önlem|Gözetim denetimi|Önemsiz|Uygundur|Belgelendirme|Müdürlüğü|Mühendisi|0530510/i;
  
  if (excludeRegex.test(name) || excludeRegex.test(fullText)) {
    return false;
  }

  const clean = cleanProductName(name);
  if (clean.length < 3 || /^[0-9]+$/.test(clean)) return false;

  // 2. High-confidence Hazmat/Chemical Keywords in Name
  const nameKeywords = /REAGENT|CALIBRATOR|BUFFER|DILUENT|CONTROL|KIT|ACID|ASİT|ALKOL|ALCOHOL|PEROKSİT|PEROXIDE|DEZENFEKTAN|DISINFECTANT|SOLÜSYON|SOLUTION|CLEANSER|CLEANSING|SHAMPOO|SABUN|SOAP|JEL|GEL|SPREY|SPRAY|HİDROJEN|SODYUM|SODIUM|ETANOL|GLİSERİN|FORMALDEHİT|FORMALIN|KSİLEN|İODİN|POVIDONE|OKSİJEN|ALINITY|ARCHITECT|ABBOTT|ECOLAB|KONIX|DERHAND|OOSAFE|CRYOS|MUSTELA|JOHNSON|BİKAR|BIKAR|MERCK|SIGMA|UREA|URIC|GGT|CHOLESTEROL|CREATINE|SUCCINIC|ALBUMIN|HAVAB|IGG|ASO|ICT|AMONYUM|KLORÜR|GLUKOZ|HEPARİN|LİDOKAİN|ANESTEZİK/i;

  if (nameKeywords.test(clean)) return true;

  // 3. High-confidence Hazmat/Chemical Codes in SDS Text
  const hasHCode = /H[0-9]{3}|EUH[0-9]{3}|STOT|Aquatic/i.test(fullText);
  const hasChemicalTerms = /reaksiyon|bozunma|tahriş|soluma|ciltle temas|gözle temas|kimyasal|toksisite/i.test(fullText);

  if (hasHCode && hasChemicalTerms) return true;

  return false;
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
          const s = cleanString(curr.toString('utf-8'));
          if (s.length >= 2) strings.push(s);
        } catch {}
      }
      curr = Buffer.alloc(0);
    }
  }
  if (curr.length >= 2) {
    try {
      const s = cleanString(curr.toString('utf-8'));
      if (s.length >= 2) strings.push(s);
    } catch {}
  }
  return strings;
}

export async function recoverHazmatData() {
  console.log('====================================================');
  console.log('  HAZMAT HASSAS VE TEMİZLENMİŞ KİMYASAL KURTARMA   ');
  console.log('====================================================');
  console.log('Tarih:', new Date().toLocaleString('tr-TR'));
  console.log('İlgili olmayan tüm denetim/bakım kayıtları elenerek');
  console.log('yalnızca GERÇEK KİMYASAL MADDELER ayıklanıyor...\n');

  try {
    // 1. Get Categories & System Settings
    console.log('[1/7] Sistem tanımları yükleniyor...');
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

    // 2. Discover WAL files
    console.log('[2/7] WAL dosyaları taranıyor...');
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
    console.log(`  -> Toplam ${walFiles.length} adet WAL dosyası bulundu.`);

    // 3. Scan & Filter: KEEP ONLY GENUINE CHEMICALS
    console.log('[3/7] Yalnızca gerçek kimyasal maddeler ayıklanıyor...');
    const recoveredMaterialsMap = new Map<string, any>();
    const recoveredHazardLabelsMap = new Set<string>();
    const recoveredAdrLabelsMap = new Set<string>();
    const recoveredPpesMap = new Set<string>();
    const recoveredFacilityItemsMap = new Set<string>();

    for (const walPath of walFiles) {
      const buf = fs.readFileSync(walPath);
      const text = buf.toString('latin1');

      const kUuidRegex = /\x4B([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/gi;
      let m;

      while ((m = kUuidRegex.exec(text)) !== null) {
        const matId = m[1];
        const offset = m.index;

        const slice = buf.slice(offset + 37, Math.min(buf.length, offset + 37 + 3500));
        const rawStrings = extractAllStringsFromBuffer(slice);
        if (rawStrings.length < 2) continue;

        const fullText = rawStrings.join(' ');
        const rawName = rawStrings[0];

        // Apply Precision Chemical Filter
        if (!isRealHazmatMaterial(rawName, fullText)) {
          continue;
        }

        const cleanName = cleanProductName(rawName);

        const record: any = {
          id: matId,
          productName: cleanName,
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

        for (let i = 1; i < rawStrings.length; i++) {
          const s = rawStrings[i].trim();
          if (s.length < 2) continue;

          if (s.startsWith('/uploads/')) {
            if (s.endsWith('.pdf')) record.sdsUrl = s;
            else if (/\.(jpe?g|png|webp)$/i.test(s)) record.imageUrl = s;
            continue;
          }

          if (strictUuidRegex.test(s)) {
            if (categoryIds.has(s)) record.categoryId = s;
            continue;
          }

          if (!record.brandName && i <= 3 && s.length <= 35 && !/(\. |,|;)/.test(s) && !/dezenfektan|temas|soluma/i.test(s)) {
            record.brandName = s;
            continue;
          }

          if (!record.usageMethod && /kullanım|dezenfektan|haricen|temizlik|antiseptik|yüzey|uygulama/i.test(s) && s.length < 150) {
            record.usageMethod = s;
            continue;
          }

          if (!record.composition && /etanol|alkol|amonyum|klorür|hidrojen|sodyum|oran|bilesik|karışım|çözelti|aktif madde/i.test(s) && s.length < 300) {
            record.composition = s;
            continue;
          }

          if (/H[0-9]{3}|EUH[0-9]{3}|tehlike|yanıcı|tahriş|zararlı|aşındırıcı|toksik/i.test(s)) {
            record.hazardDescription = record.hazardDescription ? `${record.hazardDescription} | ${s}` : s;
            continue;
          }

          if (/soluma|yutma|cilt|göz|doktor|temas|kustur|tıbbi yardım/i.test(s)) {
            record.firstAid = record.firstAid ? `${record.firstAid} | ${s}` : s;
            continue;
          }

          if (/yangın|söndürme|alev|köpük|karbondioksit|su sisi|patlama/i.test(s)) {
            record.fireFightingMeasures = record.fireFightingMeasures ? `${record.fireFightingMeasures} | ${s}` : s;
            continue;
          }

          if (/dökülme|sızıntı|alan izole|emici|paspas|kanalizasyon|koruyucu giysi/i.test(s)) {
            record.accidentalReleaseMeasures = record.accidentalReleaseMeasures ? `${record.accidentalReleaseMeasures} | ${s}` : s;
            continue;
          }

          if (/saklama|depolama|serin|kuru|konteyner|havalandırma|direkt güneş|asitlerden uzak/i.test(s)) {
            record.handlingAndStorage = record.handlingAndStorage ? `${record.handlingAndStorage} | ${s}` : s;
            continue;
          }

          if (/eldiven|gözlük|maske|önlük|kkd|solunum|koruyucu donanım/i.test(s)) {
            record.exposureControlsPpe = record.exposureControlsPpe ? `${record.exposureControlsPpe} | ${s}` : s;
            continue;
          }

          if (/renk|koku|ph|yoğunluk|parlama|sıvı|katı|berrak|görünüm/i.test(s)) {
            record.physicalAndChemicalProperties = record.physicalAndChemicalProperties ? `${record.physicalAndChemicalProperties} | ${s}` : s;
            continue;
          }

          if (/stabil|reaksiyon|bozunma|kaçınılması gereken|hidrazoik|oksijen/i.test(s)) {
            record.stabilityAndReactivity = record.stabilityAndReactivity ? `${record.stabilityAndReactivity} | ${s}` : s;
            continue;
          }

          if (/toksik|ld50|lc50|akut|dermal|oral/i.test(s)) {
            record.toxicologicalInformation = record.toxicologicalInformation ? `${record.toxicologicalInformation} | ${s}` : s;
            continue;
          }

          if (/ekotoksik|sucul|çevre|balık|arı/i.test(s)) {
            record.ecologicalInformation = record.ecologicalInformation ? `${record.ecologicalInformation} | ${s}` : s;
            continue;
          }

          if (/bertaraf|atık|tasfiye|imha|yönetmelik|konteyner/i.test(s)) {
            record.disposalConsiderations = record.disposalConsiderations ? `${record.disposalConsiderations} | ${s}` : s;
            continue;
          }

          if (/adr|rid|imdg|un [0-9]{4}|aerosol|taşıma/i.test(s)) {
            record.transportInfo = record.transportInfo ? `${record.transportInfo} | ${s}` : s;
            continue;
          }

          if (/27092|yönetmelik|gbf|güvenlik bilgi formu|mevzuat|hakkında/i.test(s)) {
            record.regulatoryInfo = record.regulatoryInfo ? `${record.regulatoryInfo} | ${s}` : s;
            continue;
          }
        }

        const existing = recoveredMaterialsMap.get(matId);
        if (!existing || existing._fullTextLength < record._fullTextLength) {
          recoveredMaterialsMap.set(matId, record);
        }
      }

      // Triple UUID relations in WAL
      const tripleUuidRegex = /\x4B([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\x4B([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/gi;
      let relMatch;
      while ((relMatch = tripleUuidRegex.exec(text)) !== null) {
        const u1 = relMatch[1];
        const u2 = relMatch[2];

        if (hazardLabelIds.has(u2)) recoveredHazardLabelsMap.add(`${u1}:::${u2}`);
        if (adrLabelIds.has(u2)) recoveredAdrLabelsMap.add(`${u1}:::${u2}`);
        if (ppeIds.has(u2)) recoveredPpesMap.add(`${u1}:::${u2}`);
        if (facilityIds.has(u1)) recoveredFacilityItemsMap.add(`${u1}:::${u2}`);
      }
    }

    const recoveredMaterials = Array.from(recoveredMaterialsMap.values());
    console.log(`\n  -> Ayıklama Başarılı: TOPLAM ${recoveredMaterials.length} ADET GERÇEK KİMYASAL MADDE TESPİT EDİLDİ!`);
    console.log(`  -> Geri yüklenecek temiz kimyasal sayısı: ${recoveredMaterials.length}\n`);

    // 4. Save permanent backup files
    console.log('[4/7] Temizlenmiş verilerin kalıcı yedek dosyaları oluşturuluyor...');
    const backupDir = path.resolve(process.cwd(), 'recovered_backups');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

    const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
    const jsonPath = path.join(backupDir, `hazmat_clean_recovered_${timestampStr}.json`);
    const sqlPath = path.join(backupDir, `hazmat_clean_recovered_${timestampStr}.sql`);

    fs.writeFileSync(jsonPath, JSON.stringify(recoveredMaterials, null, 2), 'utf-8');

    let sqlContent = `-- CLEAN HAZMAT RESTORE DUMP\n-- Date: ${new Date().toISOString()}\n\n`;
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

    // 5. PURGE FALSE POSITIVES FROM DATABASE FIRST
    console.log('[5/7] Veritabanı temizleniyor (Denetim/Asansör vb. yanlış kayıtlar siliniyor)...');
    await prisma.$executeRawUnsafe('TRUNCATE "HazmatMaterial" CASCADE;');
    console.log('  -> HazmatMaterial tablosu sıfırlandı, temiz kuruluma hazır.\n');

    // 6. INSERT ONLY REAL CHEMICALS
    console.log('[6/7] Gerçek kimyasal maddeler veritabanına yazılıyor...');
    const validMaterialIds = new Set<string>();

    for (const m of recoveredMaterials) {
      if (!m.id || !m.productName) continue;

      const payload: any = {
        id: m.id,
        productName: m.productName,
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
        categoryId: (m.categoryId && categoryIds.has(m.categoryId)) ? m.categoryId : null,
        imageUrl: m.imageUrl || null,
        sdsUrl: m.sdsUrl || null,
        isActive: true
      };

      await prisma.hazmatMaterial.create({
        data: payload
      });
      validMaterialIds.add(m.id);
    }
    console.log(`  -> ${validMaterialIds.size} adet saf kimyasal madde başarıyla veritabanına yüklendi.`);

    // Restore GHS Labels for valid materials
    let ghsCount = 0;
    for (const rel of recoveredHazardLabelsMap) {
      const [matId, labelId] = rel.split(':::');
      if (validMaterialIds.has(matId) && hazardLabelIds.has(labelId)) {
        try {
          await prisma.hazmatMaterialHazardLabel.upsert({
            where: { materialId_labelId: { materialId: matId, labelId } },
            update: {},
            create: { materialId: matId, labelId }
          });
          ghsCount++;
        } catch {}
      }
    }
    console.log(`  -> ${ghsCount} adet GHS Piktogram bağlantısı kuruldu.`);

    // Restore ADR Labels for valid materials
    let adrCount = 0;
    for (const rel of recoveredAdrLabelsMap) {
      const [matId, labelId] = rel.split(':::');
      if (validMaterialIds.has(matId) && adrLabelIds.has(labelId)) {
        try {
          await prisma.hazmatMaterialAdrLabel.upsert({
            where: { materialId_labelId: { materialId: matId, labelId } },
            update: {},
            create: { materialId: matId, labelId }
          });
          adrCount++;
        } catch {}
      }
    }
    console.log(`  -> ${adrCount} adet ADR Etiketi bağlantısı kuruldu.`);

    // Restore PPEs for valid materials
    let ppeCount = 0;
    for (const rel of recoveredPpesMap) {
      const [matId, ppeId] = rel.split(':::');
      if (validMaterialIds.has(matId) && ppeIds.has(ppeId)) {
        try {
          await prisma.hazmatMaterialPpe.upsert({
            where: { materialId_ppeId: { materialId: matId, ppeId } },
            update: {},
            create: { materialId: matId, ppeId }
          });
          ppeCount++;
        } catch {}
      }
    }
    console.log(`  -> ${ppeCount} adet KKD donanım bağlantısı kuruldu.`);

    // Restore Facility Items for valid materials
    let facCount = 0;
    for (const rel of recoveredFacilityItemsMap) {
      const [facId, matId] = rel.split(':::');
      if (facilityIds.has(facId) && validMaterialIds.has(matId)) {
        try {
          await prisma.facilityHazmatItem.upsert({
            where: { facilityId_materialId: { facilityId: facId, materialId: matId } },
            update: {},
            create: { facilityId: facId, materialId: matId }
          });
          facCount++;
        } catch {}
      }
    }
    console.log(`  -> ${facCount} adet Tesis Envanter bağlantısı kuruldu.\n`);

    // 7. Summary
    console.log('[7/7] İŞLEM BAŞARIYLA TAMAMLANDI!');
    console.log('====================================================');
    console.log(`GERİ YÜKLENEN GERÇEK KİMYASAL LİSTESİ (${recoveredMaterials.length} Madde):`);
    console.log('----------------------------------------------------');
    for (let i = 0; i < recoveredMaterials.length; i++) {
      const rm = recoveredMaterials[i];
      console.log(`  ${i + 1}. ${rm.productName} [${rm.brandName || 'Marka Belirtilmemiş'}]`);
    }
    console.log('----------------------------------------------------');
    console.log('Tüm gereksiz kayıtlar temizlendi. Yalnızca kimyasal maddeler yüklendi.');

  } catch (err: any) {
    console.error('Kurtarma hatası:', err);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  recoverHazmatData();
}
