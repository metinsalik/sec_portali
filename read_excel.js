const XLSX = require('xlsx');

const workbook = XLSX.readFile('/Users/metinsalik/Desktop/sec_portali/Tesis Yönetimi ve Güvenliği RD_2026 Radyoloji.xlsx');
const sheetName = 'RD Fine Kinney (Konsolide)';
const sheet = workbook.Sheets[sheetName];

if (!sheet) {
  console.log(`Sheet "${sheetName}" not found. Available sheets:`, workbook.SheetNames);
  process.exit(1);
}

const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
for (let i = 0; i < Math.min(10, data.length); i++) {
  console.log(`ROW ${i}:`, data[i]);
}
