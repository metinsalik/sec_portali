import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const count = await prisma.notebookEntry.count();
    console.log('NotebookEntry count:', count);
  } catch (error: any) {
    console.error('Error accessing NotebookEntry:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
