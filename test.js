const { PrismaClient } = require('./backend/node_modules/@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const equips = await prisma.fireEquipment.findMany({
    include: { category: true }
  });
  console.log("Total:", equips.length);
  equips.slice(-10).forEach(e => console.log(e.id, e.equipmentNo, e.category.name));
}
main().finally(() => prisma.$disconnect());
