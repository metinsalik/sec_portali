import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding HazMat Defaults...');

  // 1. Miktar Cinsleri (Units)
  const units = [
    { name: 'Miligram', symbol: 'mg' },
    { name: 'Gram', symbol: 'g' },
    { name: 'Kilogram', symbol: 'kg' },
    { name: 'Litre', symbol: 'L' },
    { name: 'Mililitre', symbol: 'mL' },
    { name: 'Metreküp', symbol: 'm³' },
    { name: 'Adet', symbol: 'adet' }
  ];

  for (const u of units) {
    const exists = await prisma.hazmatUnit.findFirst({ where: { symbol: u.symbol } });
    if (!exists) {
      await prisma.hazmatUnit.create({ data: u });
    }
  }

  // 2. Default Departmanlar (for all existing facilities)
  const defaultDepts = ['Ameliyathane', 'Acil Servis', 'Radyoloji', 'Laboratuvar', 'Yoğun Bakım', 'Sterilizasyon'];
  
  const facilities = await prisma.facility.findMany();
  for (const f of facilities) {
    for (const d of defaultDepts) {
      const exists = await prisma.hazmatDepartment.findFirst({
        where: { facilityId: f.id, name: d }
      });
      if (!exists) {
        await prisma.hazmatDepartment.create({
          data: { facilityId: f.id, name: d }
        });
      }
    }
  }

  console.log('HazMat Defaults seeded successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
