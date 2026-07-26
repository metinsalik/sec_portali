import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  try {
    const facilityId = 'VM-MP-FLORYA';
    const b = 'A Blok';
    
    let groupLoc = await prisma.facilityLocation.findFirst({
      where: { facilityId, building: b || null, floor: null, department: null, description: null }
    });
    console.log("groupLoc found:", groupLoc);
    
    if (!groupLoc) {
      groupLoc = await prisma.facilityLocation.create({
        data: {
          facilityId,
          name: b,
          building: b,
          floor: null,
          department: null,
          description: null
        }
      });
      console.log("groupLoc created:", groupLoc);
    }
    console.log("Done.");
  } catch (e) {
    console.error("ERROR:", e);
  } finally {
    await prisma.$disconnect();
  }
}
run();
