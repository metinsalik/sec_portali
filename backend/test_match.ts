import { PrismaClient } from '@prisma/client';
import * as xlsx from 'xlsx';

const prisma = new PrismaClient();

async function main() {
  const workbook = xlsx.readFile('/Users/metinsalik/Desktop/Projelerim/sec_portali/Yangın Denetimleri/yangin-haziran-2026.xlsx');
  const worksheet = workbook.Sheets['Konsolide Denetim Sonuçları'];
  const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
  
  const scaleSet = await prisma.checklistScaleSet.findFirst({
    where: { name: 'Standart Uygunluk Ölçeği (10, 5, -10)' },
    include: { options: true }
  });
  
  const evalLabel = (data[7] as any[])[13];
  console.log("Excel Label:", `"${evalLabel}"`);
  console.log("Options:", scaleSet?.options.map(o => o.label));
  
  const matchingOption = scaleSet?.options.find(o => o.label.toLowerCase() === evalLabel.trim().toLowerCase());
  console.log("Matched?", matchingOption ? matchingOption.id : "No");
}
main().catch(console.error).finally(() => prisma.$disconnect());
