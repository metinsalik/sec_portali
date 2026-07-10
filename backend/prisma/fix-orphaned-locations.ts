import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Fixing orphaned locations across all models...');

  try {
    // We will find all FireEquipments that have a locationId but it doesn't exist in FacilityLocation
    const fireEquipments = await prisma.fireEquipment.findMany({
      where: { locationId: { not: null } },
      select: { id: true, locationId: true }
    });

    const locations = await prisma.facilityLocation.findMany({ select: { id: true } });
    const locationIds = new Set(locations.map(l => l.id));

    let fixedCount = 0;
    for (const eq of fireEquipments) {
      if (eq.locationId && !locationIds.has(eq.locationId)) {
        await prisma.fireEquipment.update({
          where: { id: eq.id },
          data: { locationId: null }
        });
        fixedCount++;
      }
    }
    console.log(`Fixed ${fixedCount} orphaned FireEquipment records.`);
  } catch (error) {
    console.error('Error fixing orphaned locations:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
