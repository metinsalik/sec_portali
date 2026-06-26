import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Fixing orphaned location IDs in FireEquipment and FireEquipmentMovement...");

    // Set locationId to NULL in FireEquipment if it doesn't exist in HazmatDepartment
    await prisma.$executeRawUnsafe(`
      UPDATE "FireEquipment"
      SET "locationId" = NULL
      WHERE "locationId" IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM "HazmatDepartment" WHERE "HazmatDepartment"."id" = "FireEquipment"."locationId"
      );
    `);

    // Set oldLocationId to NULL in FireEquipmentMovement
    await prisma.$executeRawUnsafe(`
      UPDATE "FireEquipmentMovement"
      SET "oldLocationId" = NULL
      WHERE "oldLocationId" IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM "HazmatDepartment" WHERE "HazmatDepartment"."id" = "FireEquipmentMovement"."oldLocationId"
      );
    `);

    // Set newLocationId to NULL in FireEquipmentMovement
    await prisma.$executeRawUnsafe(`
      UPDATE "FireEquipmentMovement"
      SET "newLocationId" = NULL
      WHERE "newLocationId" IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM "HazmatDepartment" WHERE "HazmatDepartment"."id" = "FireEquipmentMovement"."newLocationId"
      );
    `);

    console.log("Successfully fixed orphaned locations.");

  } catch (error) {
    console.error("Error fixing orphaned locations:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
