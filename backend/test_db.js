const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const isgCats = await prisma.isgDefterCategory.findMany();
  console.log("IsgDefterCategories:", isgCats);
}
main().finally(() => prisma.$disconnect());
