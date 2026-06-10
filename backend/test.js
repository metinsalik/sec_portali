const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const material = await prisma.hazmatMaterial.findUnique({
    where: { id: '60b4a2e1-5eff-422c-be2a-5fc6708d19aa' }
  });
  console.log('Material:', material);
  
  const facilityItem = await prisma.facilityHazmatItem.findFirst({
    where: { materialId: '60b4a2e1-5eff-422c-be2a-5fc6708d19aa' }
  });
  console.log('FacilityItem:', facilityItem);
}

main().catch(console.error).finally(() => prisma.$disconnect());
