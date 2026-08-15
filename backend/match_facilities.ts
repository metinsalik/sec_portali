import { PrismaClient } from '@prisma/client';
import * as xlsx from 'xlsx';

const prisma = new PrismaClient();

async function main() {
  const workbook = xlsx.readFile('/Users/metinsalik/Desktop/Projelerim/sec_portali/Yangın Denetimleri/yangin-haziran-2026.xlsx');
  const worksheet = workbook.Sheets['Konsolide Denetim Sonuçları'];
  const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
  
  // Extract hospital names from row 2 (index 2)
  const excelRow = data[2] as string[];
  const excelHospitals: string[] = [];
  for (let i = 13; i < excelRow.length; i += 12) {
    if (excelRow[i]) {
      excelHospitals.push(excelRow[i].trim());
    }
  }

  const dbFacilities = await prisma.facility.findMany({
    select: { id: true, name: true }
  });

  console.log("Excel'deki Hastaneler:", excelHospitals.length);
  console.log("DB'deki Tesisler:", dbFacilities.length);
  
  const matches = [];
  const mismatches = [];

  for (const excelName of excelHospitals) {
    // Try simple matching (case insensitive, removing spaces)
    const normalizedExcel = excelName.toLowerCase().replace(/\s+/g, '');
    const found = dbFacilities.find(dbF => {
       const normalizedDb = dbF.name.toLowerCase().replace(/\s+/g, '');
       return normalizedDb.includes(normalizedExcel) || normalizedExcel.includes(normalizedDb);
    });

    if (found) {
      matches.push(`${excelName} -> ${found.name}`);
    } else {
      mismatches.push(excelName);
    }
  }

  console.log("\nEşleşenler:", matches.length);
  console.log(matches.slice(0, 5).join('\n'));
  if (matches.length > 5) console.log("...");
  
  console.log("\nEŞLEŞMEYENLER:", mismatches.length);
  console.log(mismatches.join('\n'));

}

main().catch(console.error).finally(() => prisma.$disconnect());
