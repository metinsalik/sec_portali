const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.fireEquipmentCategory.findMany();
  
  for (const cat of categories) {
    if (cat.name === 'Yangın Tüpü') {
      let invParams = cat.inventoryParameters || [];
      if (Array.isArray(invParams)) {
        const exists = invParams.find(p => p.name === 'Basınç Durumu');
        if (!exists) {
          invParams.splice(3, 0, {
            name: 'Basınç Durumu',
            options: ['Basınçlı', 'Kartuşlu']
          });
          
          await prisma.fireEquipmentCategory.update({
            where: { id: cat.id },
            data: { inventoryParameters: invParams }
          });
          console.log('Added Basınç Durumu to Yangın Tüpü');
        } else {
          console.log('Basınç Durumu already exists');
        }
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
