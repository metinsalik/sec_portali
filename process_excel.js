const xlsx = require('xlsx');
const fs = require('fs');

const filePath = '/Users/metinsalik/Desktop/Projelerim/sec_portali/Kurul Kararları 2024-2025-2026.xlsx';
const outputPath = '/Users/metinsalik/Desktop/Projelerim/sec_portali/Kurul_Kararlari_Duzenlenmis.xlsx';
const csvOutputPath = '/Users/metinsalik/Desktop/Projelerim/sec_portali/Kurul_Kararlari_Duzenlenmis.csv';

const workbook = xlsx.readFile(filePath, { cellDates: true });
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

let data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

const headers = data[0];
headers.push('Öncelik Seviyesi'); 

const kritikKeywords = ['acil', 'ölüm', 'yangın', 'patlama', 'tehlike', 'hemen', 'kanama', 'yanık', 'düşme', 'kopma', 'zehirlenme', 'kaza'];
const yuksekKeywords = ['risk', 'güvenlik', 'elektrik', 'kimyasal', 'uygunsuzluk', 'makine', 'periyodik', 'kaçak', 'gaz'];
const riskliKeywords = ['bakım', 'onarım', 'kontrol', 'denetim', 'ramak kala', 'iş ekipmanı', 'tesisat', 'düzeltici'];
const ortaKeywords = ['eğitim', 'sağlık', 'muayene', 'aşı', 'tatbikat', 'kurul', 'toplantı', 'oryantasyon', 'rapor', 'isg', 'doktor', 'hemşire'];

function determinePriority(text, category) {
    if (!text) return 'Düşük';
    text = text.toLowerCase();
    category = (category || '').toLowerCase();
    
    // Explicit checks for some critical scenarios
    if (category.includes('yangın') || category.includes('acil durum') || text.includes('itfaiye') || text.includes('tahliye')) return 'Kritik';

    for(let k of kritikKeywords) if(text.includes(k)) return 'Kritik';
    for(let k of yuksekKeywords) if(text.includes(k)) return 'Yüksek Riskli';
    for(let k of riskliKeywords) if(text.includes(k)) return 'Riskli';
    for(let k of ortaKeywords) if(text.includes(k)) return 'Orta';
    
    return 'Düşük'; // Default to Düşük for general informative decisions
}

let changedCount = 0;

for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row.length === 0) continue; // skip empty rows

    // Clean strings (trim whitespaces, newlines)
    for (let j = 0; j < row.length; j++) {
        if (typeof row[j] === 'string') {
            // Fix weird new lines and extra spaces
            row[j] = row[j].replace(/[\r\n]+/g, ' ').trim();
            row[j] = row[j].replace(/\s{2,}/g, ' '); 
        }
    }
    
    let decisionText = row[3]; // 'Alınan Kararlar'
    let category = row[4] || '';     // 'İlgili Kategori'
    let department = row[5] || '';   // 'Sorumlu Birim'
    
    // NORMALIZE CATEGORY
    if (typeof category === 'string') {
        let catLower = category.toLowerCase();
        if (catLower.includes('alt yapı') || catLower.includes('altyapı')) category = 'Altyapı';
        else if (catLower.includes('eğitim')) category = 'Eğitim';
        else if (catLower.includes('yangın')) category = 'Yangın Güvenliği';
        else if (catLower.includes('tatbikat')) category = 'Tatbikat';
        else if (catLower.includes('sağlık')) category = 'Sağlık';
        else if (catLower.includes('çevre') || catLower.includes('atik') || catLower.includes('atık')) category = 'Çevre Yönetimi';
        else if (catLower.includes('kkd') || catLower.includes('kisisel koruyucu') || catLower.includes('kişisel koruyucu')) category = 'Kişisel Koruyucu Donanım';
        else category = category.trim();
    }

    // NORMALIZE DEPARTMENT
    if (typeof department === 'string') {
        let deptLower = department.toLowerCase();
        if (deptLower.includes('teknik') || deptLower.includes('biyomedikal')) {
            department = 'Teknik Hizmetler';
        } else if (deptLower.includes('insan kaynakları') || deptLower.includes('ik') || deptLower.includes('i̇k')) {
            department = 'İnsan Kaynakları';
        } else if (deptLower.includes('idari') || deptLower.includes('destek')) {
            department = 'İdari İşler ve Destek Hizmetleri';
        } else if (deptLower.includes('isg') || deptLower.includes('iş güvenliği') || deptLower.includes('i̇sgb')) {
            department = 'İSG Birimi';
        } else if (deptLower.includes('hekim') || deptLower.includes('hemşire') || deptLower.includes('sağlık')) {
            department = 'İşyeri Sağlık Birimi';
        } else if (deptLower.includes('üst yönetim') || deptLower.includes('işveren') || deptLower.includes('yönetici')) {
            department = 'Üst Yönetim';
        } else if (deptLower.includes('kalite')) {
            department = 'Kalite Yönetimi';
        } else if (deptLower.includes('hasta bakım')) {
            department = 'Hasta Bakım Hizmetleri';
        } else {
            department = 'Tüm Birimler'; // Fallback for very mixed like "All departments"
        }
    }

    row[4] = category;
    row[5] = department;

    const priority = determinePriority(decisionText, category);
    
    // Assign to the new column
    row[headers.length - 1] = priority;
    changedCount++;
}

// Write the transformed data
const newWorksheet = xlsx.utils.aoa_to_sheet(data);

// Format date columns so they display nicely instead of ugly numbers
// Usually column 2 (Toplantı Tarihi), 7 (Termin), 8 (Tamamlanma Tarihi)
// The cellDates:true option handles this automatically for JSON output but not necessarily for excel write unless we specify date1904 or keep dates.

const newWorkbook = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(newWorkbook, newWorksheet, 'Kararlar');

xlsx.writeFile(newWorkbook, outputPath);

// CSV output as well
const csv = xlsx.utils.sheet_to_csv(newWorksheet);
fs.writeFileSync(csvOutputPath, csv);

console.log("Processing complete!");
console.log("Total rows processed:", changedCount);
console.log("Generated Excel:", outputPath);
console.log("Generated CSV:", csvOutputPath);
