const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const risks = await prisma.riskLifecycle.findMany({
    take: 5
  });
  console.log(JSON.stringify(risks, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
