import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Fixing orphaned locations across all models...');

  try {
    const locations = await prisma.facilityLocation.findMany({ select: { id: true } });
    const locationIds = new Set(locations.map(l => l.id));

    const modelsToCheck = [
      'extraordinaryIncident',
      'riskLifecycle',
      'hazmatInventoryItem',
      'hazmatIncident',
      'fireEquipment',
      'buildProject',
      'bTSoruBankasi',
      'bTUygunsuzluk'
    ];

    for (const modelName of modelsToCheck) {
      console.log(`Checking model: ${modelName}`);
      const modelClient = (prisma as any)[modelName];
      
      if (!modelClient) {
        console.warn(`Model ${modelName} not found on Prisma Client. Skipping.`);
        continue;
      }

      const records = await modelClient.findMany({
        where: { locationId: { not: null } },
        select: { id: true, locationId: true }
      });

      let fixedCount = 0;
      for (const record of records) {
        if (record.locationId && !locationIds.has(record.locationId)) {
          await modelClient.update({
            where: { id: record.id },
            data: { locationId: null }
          });
          fixedCount++;
        }
      }
      if (fixedCount > 0) {
        console.log(`Fixed ${fixedCount} orphaned records in ${modelName}.`);
      }
    }

    console.log('Finished fixing orphaned locations.');
  } catch (error) {
    console.error('Error fixing orphaned locations:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
