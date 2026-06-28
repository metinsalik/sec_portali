import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const equipments = await prisma.fireEquipment.findMany({
    include: {
      category: true
    }
  });
  console.log(equipments.map(e => ({ id: e.id, no: e.equipmentNo, cat: e.category.name })));
}
main().catch(console.error).finally(() => prisma.$disconnect());
