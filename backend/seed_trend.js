const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedTrendData() {
  const facilities = await prisma.facility.findMany();
  if (facilities.length === 0) {
    console.log("No facilities found to seed trend data.");
    return;
  }

  const months = [
    "2025-10-01", "2025-11-01", "2025-12-01",
    "2026-01-01", "2026-02-01", "2026-03-01", "2026-04-01"
  ];

  for (const f of facilities) {
    let baseCount = f.employeeCount || 50;
    for (let i = 0; i < months.length; i++) {
      const date = new Date(months[i]);
      // Rastgele bir değişim ekleyelim (+/- %10)
      const change = Math.floor(baseCount * (Math.random() * 0.2 - 0.1));
      const count = Math.max(10, baseCount + change);
      
      await prisma.employeeCountHistory.create({
        data: {
          facilityId: f.id,
          count: count,
          effectiveDate: date
        }
      });
      baseCount = count;
    }
  }
  console.log("Trend data seeded successfully.");
}

seedTrendData()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
