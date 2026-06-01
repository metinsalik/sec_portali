const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const COL_MAP = {
  'no': 'riskNo', 'sıra no': 'riskNo', 'risk no': 'riskNo',
  'kategori': 'riskCategory', 'risk kategorisi': 'riskCategory',
  'alt kategori': 'subCategory',
  'bölüm': 'department', 'departman': 'department',
  'alan': 'area',
  'faaliyet': 'activity',
  'tehlike': 'hazard', 'tehlike kaynağı': 'hazard',
  'risk': 'riskDescription', 'risk açıklaması': 'riskDescription',
  'mevcut durum': 'initialCondition',
  'mevcut durum açıklaması (tespit edilen riske ilişkin mevcut önlemler)': 'initialCondition',
  'mevcut durum görseli (varsa tespit edilen riske ilişkin görsel)': 'initialImage',
  'olasılık': 'initialProb', 'p': 'initialProb',
  'frekans': 'initialFreq', 'f': 'initialFreq', 'frekans (f)': 'initialFreq',
  'şiddet': 'initialSev', 's': 'initialSev',
  'risk skoru': 'initialScore', 'skor': 'initialScore', 'r=p*f*s': 'initialScore',
  'mevcut risk skoru olasılık': 'initialProb',
  'mevcut risk skoru frekans': 'initialFreq',
  'mevcut risk skoru şiddet': 'initialSev',
  'mevcut risk skoru risk puanı': 'initialScore',
  'iyileştirme planı alınacak önlemler / iyileştirici faaliyet': 'firstActionPlan',
  'iyileştirme planı iyileştirme sorumlusu': 'improvementResponsible',
  'iyileştirme planı termin': 'dueDate',
  'iyileştirme açıklaması (tespit edilen riske ilişkin yapılan iyileştirmeler)': 'actionsTaken',
  'iyileştirme tamamlanma tarihi': 'actionDate',
  'iyileştirme sonrası görseli (yapılan iyileştirme sonrasını gösteren görsel)': 'actionImage',
  'iyileştirme sonrası risk skoru olasılık': 'finalProb',
  'iyileştirme sonrası risk skoru frekans': 'finalFreq',
  'iyileştirme sonrası risk skoru şiddet': 'finalSev',
  'iyileştirme sonrası risk skoru risk puanı': 'finalScore',
  'iyileştirme etkinlik ölçümü etkinlik ölçüm yöntemi': 'effectivenessMethod',
  'iyileştirme etkinlik ölçümü iyileştirme kontrol sorumlusu': 'controlResponsible',
  'iyileştirme etkinlik ölçümü sonuç': 'controlResult',
  'müdahale planı': 'firstActionPlan', 'aksiyon planı': 'firstActionPlan',
  'alınacak önlemler / iyileştirici faaliyet': 'firstActionPlan',
  'yapılan işlemler': 'actionsTaken', 'alınan önlemler': 'actionsTaken',
  'sorumlu': 'actionBy', 'sorumlu birim': 'actionBy',
  'tarih': 'actionDate', 'uygulama tarihi': 'actionDate',
  'takip': 'followUpMeasure', 'etkinlik ölçümü': 'followUpMeasure',
  'ek iyileştirme': 'extraImprovement',
  'son olasılık': 'finalProb', 'son şiddet': 'finalSev',
  'son skor': 'finalScore', 'son risk skoru': 'finalScore',
  'tespit tarihi': 'detectionDate',
  'sonuç / olası etki zarar': 'impactDamage', 'sonuç/ olası etki zarar': 'impactDamage',
  'riskten etkilenecek kişiler': 'affectedPeople', 'etkilenecek kişiler': 'affectedPeople',
  'iyileştirme sorumlusu': 'improvementResponsible',
  'termin': 'dueDate', 'termin tarihi': 'dueDate',
  'iyileştirme sonrası sorumlu': 'postImprovementResponsible', 'iyileştirme sonrası iyileştirme sorumlusu': 'postImprovementResponsible',
  'iyileştirme sonrası termin': 'postImprovementDueDate', 'iyileştirme sonrası termin tarihi': 'postImprovementDueDate',
  'etkinlik ölçüm yöntemi': 'effectivenessMethod', 'ölçüm yöntemi': 'effectivenessMethod',
  'kontrol sorumlusu': 'controlResponsible', 'iyileştirme kontrol sorumlusu': 'controlResponsible',
  'etkinlik ölçümü sonuç': 'controlResult',
  'ilgili mevzuat': 'legislation', 'mevzuat': 'legislation',
  'açıklama / ilgili mevzuat-doküman': 'legislation',
  'sonuç': 'controlResult',
};

function normalizeHeader(h) {
  return h.toLowerCase().trim().replace(/\s+/g, ' ');
}

function parseDate(val) {
  if (!val || val === '') return null;
  // Handle Excel date serials
  const num = Number(val);
  if (!isNaN(num) && num > 30000 && num < 100000) {
    const date = new Date((num - 25569) * 86400 * 1000);
    return isNaN(date.getTime()) ? null : date;
  }
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

function scoreToLevel(score) {
  if (score > 400) return 'Tolere Gösterilmez Risk';
  if (score > 200) return 'Yüksek Risk';
  if (score > 70)  return 'Önemli Risk';
  if (score > 20)  return 'Olası Risk';
  return 'Önemsiz Risk';
}

function deriveStatus(row) {
  if (row.finalScore && Number(row.finalScore) > 0) {
    if (row.followUpMeasure || row.extraImprovement) return 'TAKIP_SURECINDE';
    return 'ILK_MUDAHALE_EDILDI';
  }
  if (row.actionsTaken || row.firstActionPlan) return 'ILK_MUDAHALE_EDILDI';
  return 'ACIK_TEHLIKE';
}

async function main() {
  try {
    const wb = XLSX.readFile('/app/Tehlike.xlsx');
    const sheetName = 'RD Fine Kinney (Birim Bazlı)';
    const ws = wb.Sheets[sheetName];
    if (!ws) {
      console.error(`Sheet "${sheetName}" not found`);
      process.exit(1);
    }
    const raw = XLSX.utils.sheet_to_json(ws, { header: 1 });
    console.log('Sheet rows:', raw.length);

    // 1. Header row index
    let headerRowIdx = 0;
    for (let i = 0; i < Math.min(raw.length, 25); i++) {
      const row = raw[i];
      if (Array.isArray(row)) {
        const hasNo = row.some(cell => {
          const str = String(cell || '').toLowerCase().trim();
          return str === 'no' || str === 'sıra no' || str === 'risk no';
        });
        const hasTehlike = row.some(cell => String(cell || '').toLowerCase().includes('tehlike'));
        const hasRisk = row.some(cell => String(cell || '').toLowerCase().includes('risk'));
        if (hasNo && (hasTehlike || hasRisk)) {
          headerRowIdx = i;
          break;
        }
      }
    }
    console.log('Header Row Index:', headerRowIdx);

    // 2. Extract dept
    let extractedDept = '';
    for (let i = 0; i < Math.min(raw.length, 10); i++) {
      const row = raw[i];
      if (Array.isArray(row)) {
        const labelIdx = row.findIndex(cell => {
          const str = String(cell || '').toLowerCase().trim();
          return str.includes('değerlendirilen bölüm') || str.includes('değerlendirilen birim');
        });
        if (labelIdx !== -1) {
          const digerIdx = row.findIndex(cell => String(cell || '').toLowerCase().includes('diğer ise belirtiniz'));
          if (digerIdx !== -1) {
            for (let j = digerIdx + 1; j < row.length; j++) {
              if (row[j] !== undefined && row[j] !== null && String(row[j]).trim() !== '') {
                extractedDept = String(row[j]).trim();
                break;
              }
            }
          }
          if (!extractedDept) {
            for (let j = labelIdx + 1; j < row.length; j++) {
              const val = String(row[j] || '').trim();
              if (val && val !== 'Diğer') {
                extractedDept = val;
                break;
              }
            }
          }
        }
      }
    }
    console.log('Extracted Department Name:', extractedDept);

    const rawHeaders = raw[headerRowIdx] || [];
    const subHeaders = raw[headerRowIdx + 1] || [];
    const hasSubHeaders = subHeaders.some(cell => {
      const str = String(cell || '').toLowerCase().trim();
      return str === 'olasılık' || str === 'şiddet' || str === 'frekans';
    });

    let currentParent = '';
    const headers = [];
    const maxColLen = Math.max(rawHeaders.length, subHeaders.length);

    for (let colIdx = 0; colIdx < maxColLen; colIdx++) {
      const parentVal = rawHeaders[colIdx];
      if (parentVal !== undefined && parentVal !== null && String(parentVal).trim() !== '') {
        currentParent = String(parentVal).trim();
      }

      const subVal = hasSubHeaders ? subHeaders[colIdx] : null;
      let combined = currentParent;
      if (subVal !== undefined && subVal !== null && String(subVal).trim() !== '') {
        combined = `${currentParent} ${String(subVal).trim()}`;
      }
      
      headers[colIdx] = normalizeHeader(combined);
    }

    console.log('Mapped headers sample:', headers.slice(0, 15));

    const dataStartIdx = hasSubHeaders ? headerRowIdx + 2 : headerRowIdx + 1;
    const mapped = raw.slice(dataStartIdx).filter(r => r.some(Boolean)).map(row => {
      const obj = {};
      headers.forEach((h, i) => {
        const field = COL_MAP[h];
        if (field) {
          obj[field] = row[i] ?? '';
        }
      });
      obj.department = obj.department || extractedDept || 'Genel';
      return obj;
    }).filter(r => r.department || r.hazard || r.riskDescription || r.riskCategory);

    console.log(`Total parsed rows: ${mapped.length}`);
    console.log('Row 0 parsed:', mapped[0]);

    // Let's get a facilityId
    const facility = await prisma.facility.findFirst();

    if (!facility) {
      console.error('No risk facility found in DB');
      return;
    }
    console.log('Using facilityId:', facility.id);

    // Let's try inserting all rows to see what happens
    for (let i = 0; i < mapped.length; i++) {

      const row = mapped[i];
      const deptName = row.department || 'Genel';

      let dept = await prisma.riskDepartment.findUnique({
        where: { facilityId_name: { facilityId: facility.id, name: deptName } },
      });

      if (!dept) {
        dept = await prisma.riskDepartment.create({
          data: { facilityId: facility.id, name: deptName },
        });
      }

      const initialScore = Number(row.initialScore) || 0;
      const finalScore = row.finalScore ? Number(row.finalScore) : null;
      const status = deriveStatus(row);

      try {
        console.log(`Attempting insert for row ${i+1}: no=${row.riskNo}, hazard=${row.hazard}`);
        const created = await prisma.riskLifecycle.create({
          data: {
            departmentId:     dept.id,
            riskNo:           parseInt(row.riskNo) || 1,
            riskCategory:     row.riskCategory || 'Genel',
            subCategory:      row.subCategory || null,
            area:             row.area || deptName,
            method:           row.method || 'Fine Kinney',
            activity:         row.activity || '',
            hazard:           row.hazard || '',
            riskDescription:  row.riskDescription || '',
            initialCondition: row.initialCondition || null,
            initialProb:      Number(row.initialProb) || 1,
            initialFreq:      row.initialFreq ? Number(row.initialFreq) : null,
            initialSev:       Number(row.initialSev) || 1,
            initialScore,
            initialLevel:     scoreToLevel(initialScore),
            firstActionPlan:  row.firstActionPlan || null,
            actionsTaken:     row.actionsTaken || null,
            actionDate:       parseDate(row.actionDate),
            actionBy:         row.actionBy || null,
            followUpMeasure:  row.followUpMeasure || null,
            extraImprovement: row.extraImprovement || null,
            finalProb:        row.finalProb ? Number(row.finalProb) : null,
            finalFreq:        row.finalFreq ? Number(row.finalFreq) : null,
            finalSev:         row.finalSev ? Number(row.finalSev) : null,
            finalScore,
            finalLevel:       finalScore ? scoreToLevel(finalScore) : null,
            status,
            createdBy:        'test_runner',
            detectionDate:              parseDate(row.detectionDate),
            impactDamage:               row.impactDamage || null,
            affectedPeople:             row.affectedPeople || null,
            improvementResponsible:     row.improvementResponsible || null,
            dueDate:                    parseDate(row.dueDate),
            postImprovementResponsible: row.postImprovementResponsible || null,
            postImprovementDueDate:     parseDate(row.postImprovementDueDate),
            effectivenessMethod:        row.effectivenessMethod || null,
            controlResponsible:         row.controlResponsible || null,
            controlResult:              row.controlResult || null,
            legislation:                row.legislation || null,
          }
        });
        console.log(`Success! Created risk ID: ${created.id}`);
      } catch (err) {
        console.error(`Error inserting row ${i+1}:`, err);
      }
    }

  } catch (err) {
    console.error('General Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
