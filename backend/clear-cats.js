const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRaw`UPDATE "NotebookItem" SET "mainCategoryId" = NULL, "categoryId" = NULL, "subCategoryId" = NULL;`;
  console.log('Cleared category references');
}
main().catch(console.error).finally(() => prisma.$disconnect());
