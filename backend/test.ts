import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const tasks = await prisma.wfTask.findMany({
      include: {
        _count: { select: { chatMessages: true } }
      }
    });
    console.log("Success:", tasks.length);
  } catch (error: any) {
    console.error("Prisma Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
