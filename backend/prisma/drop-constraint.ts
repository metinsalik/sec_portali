import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning up orphaned foreign key references before schema push...');
  try {
    // Clean up any orphaned references in NotebookItem that would break schema push FK constraints
    await prisma.$executeRawUnsafe(`
      UPDATE "NotebookItem" 
      SET "subCategoryId" = NULL 
      WHERE "subCategoryId" IS NOT NULL 
        AND "subCategoryId" NOT IN (SELECT id FROM "Category");
    `);
    await prisma.$executeRawUnsafe(`
      UPDATE "NotebookItem" 
      SET "categoryId" = NULL 
      WHERE "categoryId" IS NOT NULL 
        AND "categoryId" NOT IN (SELECT id FROM "Category");
    `);
    await prisma.$executeRawUnsafe(`
      UPDATE "NotebookItem" 
      SET "mainCategoryId" = NULL 
      WHERE "mainCategoryId" IS NOT NULL 
        AND "mainCategoryId" NOT IN (SELECT id FROM "Category");
    `);
    console.log('Successfully cleaned orphaned references in NotebookItem.');
  } catch (err) {
    console.warn('Notice during constraint/orphan cleanup (tables might not exist yet):', (err as any)?.message || err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
