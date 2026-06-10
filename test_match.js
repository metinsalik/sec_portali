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

const headers = [
  "no", 
  "tespit tarihi", 
  "risk kategorisi", 
  "alt risk kategorisi", 
  "birim / bölüm", 
  "alan", 
  "faaliyet", 
  "tehlike", 
  "risk", 
  "sonuç/ olası etki zarar", 
  "riskten etkilenecek kişiler", 
  "mevcut durum açıklaması (tespit edilen riske ilişkin mevcut önlemler)",
  "mevcut durum görseli (varsa tespit edilen riske ilişkin görsel)",
  "mevcut risk skoru olasılık",
  "mevcut risk skoru frekans",
  "mevcut risk skoru şiddet",
  "mevcut risk skoru risk puanı",
  "mevcut risk skoru risk seviyesi",
  "iyileştirme planı alınacak önlemler / iyileştirici faaliyet",
  "iyileştirme planı iyileştirme sorumlusu",
  "iyileştirme planı termin",
  "iyileştirme açıklaması (tespit edilen riske ilişkin yapılan iyileştirmeler)",
  "iyileştirme tamamlanma tarihi",
  "iyileştirme sonrası görseli (yapılan iyileştirme sonrasını gösteren görsel)",
  "iyileştirme sonrası risk skoru olasılık",
  "iyileştirme sonrası risk skoru frekans",
  "iyileştirme sonrası risk skoru şiddet",
  "iyileştirme sonrası risk skoru risk puanı",
  "iyileştirme sonrası risk skoru risk seviyesi",
  "iyileştirme etkinlik ölçümü etkinlik ölçüm yöntemi",
  "iyileştirme etkinlik ölçümü iyileştirme kontrol sorumlusu",
  "iyileştirme etkinlik ölçümü sonuç",
  "ilgili mevzuat"
];

const sortedKeys = Object.keys(COL_MAP).sort((a, b) => b.length - a.length);

headers.forEach(h => {
  const matchedKey = sortedKeys.find(k => h.includes(k));
  if (matchedKey) {
    console.log(`[OK] "${h}" matched with -> "${matchedKey}" -> ${COL_MAP[matchedKey]}`);
  } else {
    console.log(`[FAIL] "${h}" matched with -> NOTHING`);
  }
});
