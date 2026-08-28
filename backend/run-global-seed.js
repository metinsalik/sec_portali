const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const mainCategories = [
  {
    name: 'Tesis Güvenliği',
    categories: [
      'Acil Durum ve Afet Yönetimi ile ilgili riskler',
      'Altyapı Sistemleri ile ilgili riskler',
      'Atık yönetimi sürecindeki riskler',
      'Diğer cihaz ve malzemelerin yönetim süreci riskleri',
      'Emniyet ile ilgili riskler',
      'Tıbbi cihaz ve malzeme yönetimi süreci riskleri',
      'Yangın Güvenliği ile ilgili riskler',
      'İnşaat ve Renovasyon ile ilgili riskler'
    ]
  },
  {
    name: 'Tıbbi Hizmetler',
    categories: [
      'Hasta kabul süreci ile ilgili riskler',
      'Hizmete erişim ile ilgili riskler',
      'Takip ve taburculuk süreci ile ilgili riskler',
      'Tanı süreci ile ilgili riskler',
      'Tedavi ve rehabilitasyon süreci ile ilgili riskler',
      'Tıbbi kayıt ve arşiv süreci ile ilgili riskler'
    ]
  },
  {
    name: 'Yönetsel Hizmetler',
    categories: [
      'Bilgi yönetimi süreçleri ile ilgili riskler',
      'Finansal süreçler ile ilgili riskler',
      'Paydaşlarla iletişim süreçlerine yönelik riskler',
      'İdari süreçler ile ilgili riskler',
      'İtibar yönetimi'
    ]
  },
  {
    name: 'Çevre Güvenliği',
    categories: [
      'Atıkların çevreye zarar vermesi',
      'Hava kirliliği oluşturabilecek unsurlar',
      'Tehlikeli atıklardan oluşabilecek zararlar',
      'Çevreden hastaneye gelecek zararlar'
    ]
  },
  {
    name: 'İş Sağlığı ve Güvenliği',
    categories: [
      'Güvenlik - Biyolojik Risk Etmenleri',
      'Güvenlik - Fiziksel Risk Etmenleri',
      'Güvenlik - Psikososyal Risk Etmenleri',
      'Güvenlik- Ergonomik Risk Etmenleri',
      'Tehlikeli Madde Yönetimi / Kimyasal Risk Etmenleri'
    ]
  }
];

async function seedCategories() {
  console.log('Seeding default GLOBAL categories...');
  for (const main of mainCategories) {
    let mainCat = await prisma.category.findFirst({
      where: { name: main.name, parentId: null }
    });
    
    if (!mainCat) {
      mainCat = await prisma.category.create({
        data: { name: main.name, parentId: null }
      });
      console.log(`Created Main Category: ${main.name}`);
    }
    
    for (const sub of main.categories) {
      let subCat = await prisma.category.findFirst({
        where: { name: sub, parentId: mainCat.id }
      });
      
      if (!subCat) {
        await prisma.category.create({
          data: { name: sub, parentId: mainCat.id }
        });
        console.log(`  Created Category: ${sub}`);
      }
    }
  }
  console.log('Finished seeding GLOBAL categories.');
}

seedCategories().catch(console.error).finally(() => prisma.$disconnect());
