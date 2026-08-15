import * as xlsx from 'xlsx';

const workbook = xlsx.readFile('/Users/metinsalik/Desktop/Projelerim/sec_portali/Yangın Denetimleri/yangin-haziran-2026.xlsx');
const sheetName = 'Konsolide Denetim Sonuçları';
const worksheet = workbook.Sheets[sheetName];

if (!worksheet) {
  console.log(`Sheet "${sheetName}" not found. Available sheets:`, workbook.SheetNames);
} else {
  const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
  console.log('First 10 rows of the sheet:');
  console.log(JSON.stringify(data.slice(0, 10), null, 2));
}
