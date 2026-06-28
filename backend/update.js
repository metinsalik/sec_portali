const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.fireEquipmentCategory.findMany({
    where: { name: 'Yangın Dolabı' }
  });

  const newParams = [
    { name: "Hortum Tipi", options: ["Yarı Sert Hortum", "Yassı Hortum", "Kauçuk Hortum"] },
    { name: "Hortum Uzunluğu", options: ["20 m", "25 m", "30 m", "35 m"] },
    { name: "Hortum Çapı", options: ["1” (25 mm)", "3/4” (19 mm)"] },
    { name: "Nozzle Çapı", options: ["6 mm", "9 mm", "10 mm", "12 mm"] },
    { name: "Çalışma Basıncı", options: ["4 Bar", "6 Bar", "12 MPa"] },
    { name: "Debi", options: ["66 lt/min", "95 lt/min"] },
    { name: "Vana Tipi", options: ["Köşe Tip Yangın Vanası", "Küresel Tip Yangın Vanası", "Basınç Düşürücü Vana"] },
    { name: "Kapak Tipi", options: ["Ahşap Kapak", "Camlı Kapak"] },
    { name: "Not", type: "text" }
  ];

  for (const cat of categories) {
    await prisma.fireEquipmentCategory.update({
      where: { id: cat.id },
      data: { inventoryParameters: newParams }
    });
    console.log(`Updated category ${cat.id}`);
  }

  console.log('Update complete.');
}

main().finally(() => prisma.$disconnect());
