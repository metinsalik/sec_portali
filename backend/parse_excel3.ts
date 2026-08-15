import * as xlsx from 'xlsx';

const workbook = xlsx.readFile('/Users/metinsalik/Desktop/Projelerim/sec_portali/Yangın Denetimleri/yangin-haziran-2026.xlsx');
const sheetName = 'Konsolide Denetim Sonuçları';
const worksheet = workbook.Sheets[sheetName];

const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
for (let i = 4; i < 9; i++) {
  console.log(`Row ${i}:`, JSON.stringify(data[i]));
}
