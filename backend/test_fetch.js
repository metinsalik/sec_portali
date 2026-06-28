const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const eq = await prisma.fireEquipment.findFirst({ where: { status: 'AKTIF' } });
  console.log(eq);
}
run().finally(() => prisma.$disconnect());
