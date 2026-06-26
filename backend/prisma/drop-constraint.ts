import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Checking and dropping FireEquipment_locationId_fkey if it exists...");
    
    // We try to drop the foreign keys that might prevent Prisma from dropping the FireEquipmentLocation table
    await prisma.$executeRawUnsafe(`ALTER TABLE "FireEquipment" DROP CONSTRAINT IF EXISTS "FireEquipment_locationId_fkey" CASCADE;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "FireEquipmentMovement" DROP CONSTRAINT IF EXISTS "FireEquipmentMovement_fromLocationId_fkey" CASCADE;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "FireEquipmentMovement" DROP CONSTRAINT IF EXISTS "FireEquipmentMovement_toLocationId_fkey" CASCADE;`);

    console.log("Successfully dropped constraints (or they didn't exist).");
  } catch (error) {
    console.error("Error dropping constraints (this is usually fine if they are already dropped):", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
