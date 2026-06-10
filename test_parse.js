const XLSX = require('xlsx');

const COL_MAP = {
  // 1. Bölüm Genel Bilgiler
  'tespit tarihi': 'detectionDate',
  'risk kategorisi': 'riskCategory',
  'alt risk kategorisi': 'subCategory',
  'bölüm': 'department', 'departman': 'department',
  'alan': 'area',
  'faaliyet': 'activity',

  // 2. Bölüm : Mevcut Durum Değerlendirmesi:
  'tehlike': 'hazard',
  'risk': 'riskDescription',
  'sonuç/ olası etki zarar': 'impactDamage',
  'riskten etkilenecek kişiler': 'affectedPeople',
  'mevcut durum açıklaması (tespit edilen riske ilişkin mevcut önlemler)': 'initialCondition',
  'mevcut durum açıklaması': 'initialCondition',
  'mevcut durum görseli': 'initialImage',
  'olasılık': 'initialProb',
  'frekans': 'initialFreq',
  'şiddet': 'initialSev',
  'risk puanı': 'initialScore',
  'risk seviyesi': 'initialLevel',
  'ilgili mevzuat': 'legislation',

  // 3. Bölüm İyileştirme Planı / Uygulama
  'alınacak önlemler / iyileştirici faaliyet': 'firstActionPlan',
  'iyileştirme sorumlusu': 'improvementResponsible',
  'termin tarihi': 'dueDate',
  'termin': 'dueDate',
  'iyileştirme açıklaması (tespit edilen riske ilişkin yapılan iyileştirmeler)': 'actionsTaken',
  'iyileştirme açıklaması': 'actionsTaken',
  'iyileştirme tamamlanma tarihi': 'actionDate',
  'iyileştirme sonrası görseli (yapılan iyileştirme sonrasını gösteren görsel)': 'actionImage',
  'iyileştirme sonrası görseli': 'actionImage',
  'iyileştirme sonrası risk skoru olasılık': 'finalProb',
  'iyileştirme sonrası risk skoru frekans': 'finalFreq',
  'iyileştirme sonrası risk skoru şiddet': 'finalSev',
  'iyileştirme sonrası risk skoru risk puanı': 'finalScore',
  'iyileştirme sonrası risk skoru risk seviyesi': 'finalLevel',

  // 4. Bölüm İyileştirme Etkinlik Ölçümü
  'etkinlik ölçüm yöntemi': 'effectivenessMethod',
  'iyileştirme kontrol sorumlusu': 'controlResponsible',
  'kontrol sorumlusu': 'controlResponsible',
  'sonuç': 'controlResult',
};

const workbook = XLSX.readFile('/Users/metinsalik/Desktop/sec_portali/Tesis Yönetimi ve Güvenliği RD_2026 Radyoloji.xlsx', { cellDates: true });
const sheet = workbook.Sheets['RD Fine Kinney (Konsolide)'];
const raw = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });

function normalizeHeader(h) {
  return (h || '').toLowerCase().trim().replace(/\s+/g, ' ');
}

let headerRowIdx = -1;
for (let i = 0; i < Math.min(20, raw.length); i++) {
  const rowData = raw[i];
  if (Array.isArray(rowData)) {
    const rowStr = rowData.map(c => String(c || '').toLowerCase()).join(' ');
    if (rowStr.includes('no') && rowStr.includes('tespit tarihi') && rowStr.includes('tehlike')) {
      headerRowIdx = i;
      break;
    }
  }
}

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

const dataStartIdx = hasSubHeaders ? headerRowIdx + 2 : headerRowIdx + 1;
const mapped = raw.slice(dataStartIdx).filter(r => r.some(Boolean)).map(row => {
  const obj = {};
  const sortedKeys = Object.keys(COL_MAP).sort((a, b) => b.length - a.length);

  headers.forEach((h, i) => {
    const matchedKey = sortedKeys.find(k => h.includes(k));
    if (matchedKey) {
      const field = COL_MAP[matchedKey];
      obj[field] = row[i] ?? '';
    }
  });
  return obj;
});

console.log(JSON.stringify(mapped[0], null, 2));
