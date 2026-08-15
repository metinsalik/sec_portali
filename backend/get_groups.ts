import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const groups = await prisma.checklistTemplateGroup.findMany();
  console.log(groups.map(g => ({id: g.id, name: g.name})));
}
main().catch(console.error).finally(() => prisma.$disconnect());
