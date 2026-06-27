import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const mainCat = await prisma.fireEquipmentCategory.findFirst({
    where: { name: 'Yangın Tüpü', parentId: null }
  });
  if (mainCat) {
    const validSubcategories = ["AFFF Köpük", "HFC-227", "Karbondioksit", "Kuru Kimyevi Tozlu"];
    await prisma.fireEquipmentCategory.deleteMany({
      where: {
        parentId: mainCat.id,
        name: { notIn: validSubcategories }
      }
    });
    console.log("Deleted old subcategories for Yangın Tüpü.");
  }
}
run().then(() => process.exit(0)).catch(console.error);
