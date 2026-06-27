const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const equipment = await prisma.fireEquipment.findFirst({
    where: { brand: "Güner Yangın" }
  });
  console.log("Before:", equipment.brand);
  
  await prisma.fireEquipment.update({
    where: { id: equipment.id },
    data: { brand: "Test Brand 123" }
  });
  
  const updated = await prisma.fireEquipment.findFirst({
    where: { id: equipment.id }
  });
  console.log("After:", updated.brand);
}

main().catch(console.error).finally(() => prisma.$disconnect());
