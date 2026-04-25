import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const categories = [
    'Asansör Arızası', 'Deprem', 'Elektrik Kesintisi (Uzun Süreli)', 
    'Hastane Çevresinde olan olaylar', 'Hırsızlık', 'İnşaat/Renovasyon Kaynaklı Olaylar', 
    'İntihar', 'Kavga/Şiddet', 'Tehlikeli Madde Yayılımı', 'Medikal Gaz Kesintisi', 
    'Pandemi', 'Patlama', 'Sabotaj', 'Sel/Su Baskını', 'Silahlı Saldırı', 
    'Yangın', 'Yapısal Unsurlara Dair Olaylar', 'Diğer'
  ];

  const rootCauses = [
    'Yapısal / İnşai Nedenler', 'Farkındalık Eksikliği', 'Mekanik Ekipman Kaynaklı Nedenler', 
    'Elektronik/Elektromekanik Ekipman Kaynaklı Nedenler', 'Sigara', 'Medikal Cihaz Arızası', 
    'Personel Eksikliği', 'Elektrikli el aletleri', 'Doğal Afet', 'Gaz Kaçağı', 'Diğer'
  ];

  const supportUnits = [
    'İç destek', 'İtfaiye', 'Polis', 'AFAD', 'Belediye'
  ];

  const emergencyCodes = [
    'Kırmızı Kod (Yangın)', 'Mavi Kod (Resüsitasyon)', 'Pembe Kod (Bebek/Çocuk Kaçırma)', 
    'Beyaz Kod (Şiddet)', 'Sarı Kod (Tahliye)', 'Turuncu Kod (Kimyasal Sızıntı)'
  ];

  console.log('Seeding incident categories...');
  for (const name of categories) {
    await prisma.incidentCategory.upsert({ where: { name }, update: {}, create: { name } });
  }

  console.log('Seeding incident root causes...');
  for (const name of rootCauses) {
    await prisma.incidentRootCause.upsert({ where: { name }, update: {}, create: { name } });
  }

  console.log('Seeding incident support units...');
  for (const name of supportUnits) {
    await prisma.incidentSupportUnit.upsert({ where: { name }, update: {}, create: { name } });
  }

  console.log('Seeding emergency codes...');
  for (const name of emergencyCodes) {
    await prisma.emergencyCode.upsert({ where: { name }, update: {}, create: { name } });
  }

  console.log('Seeding completed successfully.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
