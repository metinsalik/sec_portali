import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const equipments = await prisma.fireEquipment.findMany();
  for (const eq of equipments) {
    if (eq.inventoryData) {
      const data: any = eq.inventoryData;
      let updated = false;
      
      if (data['Kapasite'] && !String(data['Kapasite']).toLowerCase().includes('kg')) {
        data['Kapasite'] = `${data['Kapasite']} kg`;
        updated = true;
      }
      if (data['Manometre']) {
        const m = String(data['Manometre']).toLowerCase().trim();
        if (m === 'var' || m === 'yok') {
          const newM = m.charAt(0).toUpperCase() + m.slice(1);
          if (data['Manometre'] !== newM) {
            data['Manometre'] = newM;
            updated = true;
          }
        }
      }
      
      // also calculate nextMaintenanceDate if it's missing but lastMaintenanceDate exists
      let nextDate = eq.nextMaintenanceDate;
      if (!nextDate && data['lastMaintenanceDate']) {
        nextDate = new Date(data['lastMaintenanceDate']);
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        updated = true;
      }

      if (updated) {
        await prisma.fireEquipment.update({
          where: { id: eq.id },
          data: { inventoryData: data, nextMaintenanceDate: nextDate }
        });
      }
    }
  }
  console.log("Fixed inventory data.");
}
run().then(() => process.exit(0)).catch(console.error);
