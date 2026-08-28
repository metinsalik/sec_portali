const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  try {
    const isgCats = await prisma.isgDefterCategory.findMany({
      where: {
        OR: [{ facilityId: 'GOP-DIYALIZ-MER' }, { facilityId: null }]
      },
      orderBy: { name: 'asc' }
    });
    console.log("Found:", isgCats);
  } catch (err) {
    console.error("Error:", err);
  }
}
main().finally(() => prisma.$disconnect());
