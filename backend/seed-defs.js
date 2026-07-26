const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const categories = [
  'Acil Durum Yönetimi',
  'Altyapı Sistemleri',
  'Cihaz-Ekipman-Malzeme Yönetimi',
  'Emniyet',
  'Güvenlik',
  'Inşaat-Renovasyon',
  'Tehlikeli Madde ve Atık Yönetimi',
  'Tıbbi Cihazlar',
  'Yangın Güvenliği',
  'Diğer'
];

const departments = [
  'Teknik Hizmetler Müdürlüğü',
  'İdari ve Otelcilik Hizmetleri Müdürlüğü',
  'Üst Yönetim'
];

async function main() {
  console.log('Seeding categories...');
  for (const c of categories) {
    const existing = await prisma.category.findFirst({ where: { name: c } });
    if (!existing) {
      await prisma.category.create({ data: { name: c } });
    }
  }

  console.log('Seeding departments...');
  for (const d of departments) {
    const existing = await prisma.department.findFirst({ where: { name: d } });
    if (!existing) {
      await prisma.department.create({ data: { name: d } });
    }
  }
}

main()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
