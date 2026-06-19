const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const all = await prisma.hazmatMaterial.findMany({ take: 1 });
  if (all.length > 0) {
    const mat = all[0];
    const updated = await prisma.hazmatMaterial.update({
      where: { id: mat.id },
      data: { firstAid: "Test First Aid content" }
    });
    console.log("Updated firstAid to:", updated.firstAid);
  } else {
    console.log("No hazmat material found");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
