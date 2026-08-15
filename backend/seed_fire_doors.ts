import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://isguser:secretpassword@localhost:5432/isgdb'
    }
  }
});

async function main() {
  console.log('Seeding Fire Doors Module...');

  // 1. Add Module
  const moduleData = {
    code: 'FIRE_DOORS',
    name: 'Yangın Kapıları',
    description: 'Tesis yangın kapıları takip ve denetim modülü',
    isActive: true,
  };

  const moduleObj = await prisma.module.upsert({
    where: { code: moduleData.code },
    update: moduleData,
    create: moduleData,
  });
  console.log('Module seeded:', moduleObj.name);

  // 2. Assign module to users
  // Get all active users
  const users = await prisma.user.findMany({ where: { isActive: true } });
  for (const user of users) {
    await prisma.userModule.upsert({
      where: {
        username_moduleId: {
          username: user.username,
          moduleId: moduleObj.id
        }
      },
      update: {},
      create: {
        username: user.username,
        moduleId: moduleObj.id
      }
    });
  }
  console.log('Module assigned to active users.');

  // 3. Properties
  const properties = [
    { name: 'Alt Kategori', options: ['Tek Kapı', 'Çift Kapı', 'Kayar Kapı'] },
    { name: 'Manyetik Tutucu', options: ['Var', 'Yok'] },
    { name: 'Kapatma Sistemi', options: ['Kendiliğinden Kapanır', 'Harici Hidrolik Kapatıcı Sistem'] },
    { name: 'Yangın Sistemi Entegrasyonu', options: ['Var', 'Yok'] },
  ];

  for (const prop of properties) {
    const existing = await prisma.fireDoorProperty.findFirst({ where: { name: prop.name } });
    if (!existing) {
        await prisma.fireDoorProperty.create({ data: prop });
    }
  }
  console.log('Properties seeded.');

  // 4. Question Groups & Questions
  const groups = [
    {
      name: 'Fiziksel Uygunluk ve Montaj',
      order: 1,
      questions: [
        'Kapının montajı düzgün yapılmış olmalı, şaşılık veya eğrilik bulunmamalıdır.',
        'Kapı düzgün bir şekilde duvar boşluğuna yerleştirilmiş olmalı, kapı kasası ile duvar arasında açıklıklar bulunmamalıdır.',
        'Kapı zemine tam oturacak şekilde monte edilmiş olmalı, kapı altı boşluk 8 mm den fazla olmamalıdır.',
        'Montaj için kullanılan dolgu malzemeleri alanın özellikleri göz önüne alınarak en az duvarlarda aynı ölçüde yangına dayanımlı olmalıdır.',
        'Kapılarda eşik ve kaçışı zorlaştıran engel bulunmamalıdır.'
      ]
    },
    {
      name: 'Açılma ve Kapanma Mekanizması',
      order: 2,
      questions: [
        'Kapı insan müdahalesi olmaksızın kendiliğinden kapanabilir özellikte olmalıdır.',
        'Kapı herhangi bir takılma veya sürtünme olmadan kendiliğinden tam kapanabilir olmalıdır.',
        'Panik bar düzgün çalışıyor olmalıdır.'
      ]
    },
    {
      name: 'Yangın Senaryosuna Uygunluk',
      order: 3,
      questions: [
        'Kapının yeri, yangın zonlama planı, duman tahliye ve yönlendirme senaryosuna uygun konumlandırılmış olmalıdır.',
        'Kapı, yangın senaryosuna göre elektrikle mıknatısla açık kalması gereken bir modelse, yangın algılama sistemine entegre edilmiş olmalıdır.',
        'Yangın sırasında kapanması gereken kapılar, sistem tetiklenince otomatik kapanabilir olmalıdır.'
      ]
    },
    {
      name: 'Sertifikasyon ve Etiketleme',
      order: 4,
      questions: [
        'Kapı üzerinde üretici etiketi, yangın dayanım sınıfı (EI1 60, EI2 120 vb.) net şekilde belirtilmiş olmalıdır.',
        'Kapı seti (kanat, kasa, menteşe, kilit, contalar vs.) sertifika kapsamında bir bütün olarak yer almalıdır.',
        'Yangın kapısı sertifikasyon kuruluşu akredite bir firma olmalıdır.'
      ]
    },
    {
      name: 'Sızdırmazlık Özellikleri ve Donanımlar',
      order: 5,
      questions: [
        'Kapıda duman sızdırmazlık contaları (intumescent veya silikon bazlı) mevcut mu?',
        'Sızdırmazlık contaları, üretici beyanı ve test raporları ile uyumlu mu?'
      ]
    }
  ];

  for (const g of groups) {
    let group = await prisma.fireDoorQuestionGroup.findFirst({ where: { name: g.name } });
    if (!group) {
        group = await prisma.fireDoorQuestionGroup.create({
            data: { name: g.name, order: g.order }
        });
    }

    let qOrder = 1;
    for (const qText of g.questions) {
        const qExists = await prisma.fireDoorQuestion.findFirst({
            where: { groupId: group.id, text: qText }
        });
        if (!qExists) {
            await prisma.fireDoorQuestion.create({
                data: {
                    groupId: group.id,
                    text: qText,
                    order: qOrder,
                    weightPass: 1.0,
                    weightPartial: 0.5,
                    weightFail: -1.0
                }
            });
        }
        qOrder++;
    }
  }
  console.log('Questions seeded.');
}

main()
  .catch(e => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
