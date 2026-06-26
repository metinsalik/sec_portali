import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Checking for old FireEquipmentLocation table data...");
    
    // Check if the old table exists
    const tableCheck: any[] = await prisma.$queryRawUnsafe(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'FireEquipmentLocation'
      );
    `);

    if (tableCheck[0] && tableCheck[0].exists) {
      console.log("Found old FireEquipmentLocation table. Starting data migration...");

      // Get all old locations
      const oldLocations: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM "FireEquipmentLocation";`);
      
      for (const loc of oldLocations) {
        // Create equivalent HazmatDepartment
        const newDept = await prisma.hazmatDepartment.create({
          data: {
            facilityId: loc.facilityId,
            name: loc.department || 'Belirtilmemiş Birim', // map department to name
            building: loc.building,
            floor: loc.floor,
            description: loc.description,
            isActive: true,
            isCleaningCart: false
          }
        });

        // Update FireEquipment
        await prisma.$executeRawUnsafe(`
          UPDATE "FireEquipment" 
          SET "locationId" = ${newDept.id} 
          WHERE "locationId" = ${loc.id};
        `);

        // Update FireEquipmentMovement fromLocationId
        await prisma.$executeRawUnsafe(`
          UPDATE "FireEquipmentMovement" 
          SET "fromLocationId" = ${newDept.id} 
          WHERE "fromLocationId" = ${loc.id};
        `);

        // Update FireEquipmentMovement toLocationId
        await prisma.$executeRawUnsafe(`
          UPDATE "FireEquipmentMovement" 
          SET "toLocationId" = ${newDept.id} 
          WHERE "toLocationId" = ${loc.id};
        `);
      }

      console.log("Migration complete. Dropping old table...");
      // Drop the old table so prisma db push doesn't try to sync it, and we avoid confusion
      // We drop cascade to ensure any lingering dependencies are removed
      await prisma.$executeRawUnsafe(`DROP TABLE "FireEquipmentLocation" CASCADE;`);
      console.log("Old table dropped.");

    } else {
      console.log("No FireEquipmentLocation table found. Migration not needed.");
    }

  } catch (error) {
    console.error("Migration error (this might be safe to ignore if already migrated):", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
