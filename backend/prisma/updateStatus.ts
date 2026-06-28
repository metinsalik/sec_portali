import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.hazmatSpillKitDepartment.updateMany({
    where: { status: 'Kurulumda' },
    data: { status: 'Aktif' },
  });
  console.log(`Updated ${result.count} records from Kurulumda to Aktif.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
