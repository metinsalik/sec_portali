const XLSX = require('xlsx');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const depts = await prisma.riskDepartment.findMany();
    console.log('Database Departments:', depts);
  } catch (err) {
    console.error('Error querying DB:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();

const filePath = '/app/Tehlike Belirleme ve Risk Değerlendirme Tablosu_Yeni.xlsx';

try {
  // Check if file exists by reading it
  const wb = XLSX.readFile('/app/Tehlike.xlsx');
  console.log('Available Sheets:', wb.SheetNames);

  const sheetName = 'RD Fine Kinney (Birim Bazlı)';
  const ws = wb.Sheets[sheetName];
  if (!ws) {
    console.error(`Sheet "${sheetName}" not found!`);
    process.exit(1);
  }

  // Read raw lines as JSON
  const raw = XLSX.utils.sheet_to_json(ws, { header: 1 });
  console.log('Total Raw Rows:', raw.length);
  
  console.log('\n--- Row-by-row structure ---');
  for (let i = 0; i < Math.min(raw.length, 9); i++) {
    console.log(`Row ${i}:`, raw[i]);
  }

} catch (err) {
  console.error('Error reading Excel:', err);
}

