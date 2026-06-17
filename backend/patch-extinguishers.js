const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.fireEquipmentCategory.findMany();
  
  for (const cat of categories) {
    if (cat.name === 'Yangın Tüpü') {
      let invParams = cat.inventoryParameters;
      if (invParams && Array.isArray(invParams)) {
        
        // Find 6 and 7
        const toMove = invParams.filter(p => 
          p.name === 'Periyodik Kontrol Durumu' || 
          p.name === 'Dolum / Hidrostatik Test Tarihi'
        );

        // Remove 6 and 7 from inventory
        const newInvParams = invParams.filter(p => 
          p.name !== 'Periyodik Kontrol Durumu' && 
          p.name !== 'Dolum / Hidrostatik Test Tarihi'
        );

        // Get current maintenance params or create new array
        let maintParams = cat.maintenanceParameters || [];
        if (!Array.isArray(maintParams)) maintParams = [];

        // Add to maintenance params if not already there
        for (const p of toMove) {
          const exists = maintParams.find(mp => mp.name === p.name);
          if (!exists) {
            maintParams.push(p);
          }
        }

        await prisma.fireEquipmentCategory.update({
          where: { id: cat.id },
          data: { 
            inventoryParameters: newInvParams,
            maintenanceParameters: maintParams
          }
        });
        console.log('Updated Yangın Tüpü parameters');
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
