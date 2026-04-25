import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
  try {
    console.log('Testing Notebooks query...');
    const entries = await prisma.notebookEntry.findMany({
      where: { facilityId: 'MLP-MERKEZ', year: 2026 },
      include: {
        category: true,
        subCategory: true,
        department: true,
      },
    });
    console.log('Success! Entries found:', entries.length);
  } catch (error: any) {
    console.error('FAILED:', error.message);
    if (error.stack) console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

test();
