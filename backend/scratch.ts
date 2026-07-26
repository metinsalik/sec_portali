import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const data = await prisma.buildDepartmentSetting.findMany();
  console.log("Departments in DB:", data);
}
main().catch(console.error).finally(() => prisma.$disconnect());
