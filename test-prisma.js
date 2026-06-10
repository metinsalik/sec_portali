const { PrismaClient } = require('./backend/node_modules/@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const m = await prisma.hazmatMaterial.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: { productName: true, imageUrl: true, sdsUrl: true }
  });
  console.log(m);
}
main().catch(console.error).finally(() => prisma.$disconnect());
