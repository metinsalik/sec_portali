import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const dbFacilities = await prisma.facility.findMany({ select: { name: true }});
  console.log(dbFacilities.map(f => f.name).sort().join('\n'));
}
main().catch(console.error).finally(() => prisma.$disconnect());
