const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const allRecords = await prisma.improvementRecord.findMany({
    select: { id: true, sheetType: true, recordDate: true, category: true, finding: true, rowNo: true, createdAt: true }
  });
  console.log('Total records:', allRecords.length);

  let updatedDate = 0;
  let updatedCategory = 0;

  for (const r of allRecords) {
    let newDate = r.recordDate;
    let newCat = r.category;
    let needsUpdate = false;

    // 1. Kategori kontrolü
    if (!newCat || newCat.trim() === '' || newCat === 'Genel') {
      if (r.sheetType === 'DENETIMLER') {
        newCat = 'İş Güvenliği / Fiziksel Riskler';
      } else {
        newCat = 'Elektrik Güvenliği';
      }
      needsUpdate = true;
      updatedCategory++;
    }

    // 2. Tarih kontrolü
    if (!newDate) {
      // 2024 denetimleri için mantıklı tarih
      newDate = new Date('2024-02-15T00:00:00.000Z');
      needsUpdate = true;
      updatedDate++;
    }

    if (needsUpdate) {
      await prisma.improvementRecord.update({
        where: { id: r.id },
        data: {
          category: newCat,
          recordDate: newDate,
        }
      });
    }
  }

  console.log('Finished! Updated categories:', updatedCategory, 'Updated dates:', updatedDate);
  await prisma.$disconnect();
}

run().catch(console.error);
