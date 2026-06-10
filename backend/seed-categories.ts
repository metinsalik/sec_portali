import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categories = [
  { name: 'Temizlik, Hijyen ve Dezenfeksiyon Kimyasalları', scope: 'Temizlik, yüzey dezenfeksiyonu, el/cilt antisepsisi, çamaşırhane ve mutfak kimyasalları', examples: 'Deterjan, çamaşır suyu, yüzey dezenfektanı, el antiseptiği, alkol bazlı ürünler' },
  { name: 'Laboratuvar ve Tanı Kimyasalları', scope: 'Laboratuvar testlerinde, cihaz kitlerinde, kalibrasyon ve kontrol işlemlerinde kullanılan kimyasallar', examples: 'Biyokimya kitleri, hematoloji solüsyonları, PCR kitleri, boyalar, reaktifler, kalibratörler' },
  { name: 'Patoloji, Histoloji ve Morg Kimyasalları', scope: 'Doku tespiti, boyama, takip, saklama ve morg işlemlerinde kullanılan yüksek riskli kimyasallar', examples: 'Formaldehit, formalin, ksilen, etanol, metanol, hematoksilen, eozin' },
  { name: 'Sterilizasyon ve Tıbbi Cihaz Dezenfeksiyon Kimyasalları', scope: 'Sterilizasyon, yüksek düzey dezenfeksiyon ve tıbbi cihaz işleme süreçlerinde kullanılan kimyasallar', examples: 'Etilen oksit, glutaraldehit, OPA, perasetik asit, hidrojen peroksit kartuşları' },
  { name: 'Teknik Hizmetler, Bakım ve Altyapı Kimyasalları', scope: 'Teknik bakım, su şartlandırma, kazan, HVAC, boya, solvent, akü, jeneratör ve altyapı kimyasalları', examples: 'Biyosit, korozyon inhibitörü, pH düzenleyici, tiner, boya, silikon, akü asidi' },
  { name: 'Farmasötik, Klinik ve Özel Amaçlı Kimyasallar', scope: 'Eczane, klinik uygulama, radyoloji/nükleer tıp, araştırma, eğitim ve özel riskli ürünler', examples: 'Sitotoksik ilaçlar, kontrast maddeler, radyofarmasötikler, araştırma kimyasalları' }
];

async function main() {
  for (const cat of categories) {
    const exists = await prisma.hazmatCategory.findFirst({ where: { name: cat.name } });
    if (!exists) {
      await prisma.hazmatCategory.create({ data: cat });
      console.log(`Created: ${cat.name}`);
    } else {
      console.log(`Exists: ${cat.name}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
