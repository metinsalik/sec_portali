const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const locs = await prisma.facilityLocation.findMany({
    take: 10
  });
  console.log(JSON.stringify(locs, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
