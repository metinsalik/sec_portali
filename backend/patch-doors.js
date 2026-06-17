const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.fireEquipmentCategory.findMany();
  
  for (const cat of categories) {
    if (cat.name === 'Yangın Kapısı') {
      const params = cat.inventoryParameters;
      if (params && Array.isArray(params)) {
        for (let i = 0; i < params.length; i++) {
          if (params[i].name === 'Yangın Dayanımı') {
            params[i].options = ['30 dk', '60 dk', '90 dk', '120 dk'];
          }
        }
        await prisma.fireEquipmentCategory.update({
          where: { id: cat.id },
          data: { inventoryParameters: params }
        });
        console.log('Updated Yangın Kapısı inventory parameters');
      }
    }
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
