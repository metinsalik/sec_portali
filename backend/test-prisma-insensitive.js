const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const m1 = await prisma.hazmatMaterial.findFirst({
    where: { productName: { equals: "%96 ALKOL BAZLI", mode: 'insensitive' } }
  });
  console.log("Found:", m1);
}
main().catch(console.error).finally(() => prisma.$disconnect());
