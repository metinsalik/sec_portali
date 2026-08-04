const xlsx = require('xlsx');

const filePath = '/Users/metinsalik/Desktop/Projelerim/sec_portali/Kurul Kararları 2024-2025-2026.xlsx';
const workbook = xlsx.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

console.log("Headers:", data[0]);
console.log("Row 1:", data[1]);
console.log("Row 2:", data[2]);
console.log("Total rows:", data.length);
