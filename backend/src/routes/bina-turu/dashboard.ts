import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

const handleError = (res: Response, error: unknown) => {
  console.error(error);
  res.status(500).json({ error: 'Bir hata oluştu' });
};

// Dashboard Analizleri
router.get('/', async (req: Request, res: Response) => {
  const facilityId = req.query.facilityId as string;
  try {
    // 1. Ana Gruplara göre uygunsuzluk/uygun oranları
    const cevaplar = await prisma.bTCevap.findMany({
      where: {
        turSorusu: {
          tur: { facilityId }
        }
      },
      include: {
        turSorusu: {
          include: {
            soru: {
              include: {
                anaGrup: true,
                denetlenenAlan: true
              }
            }
          }
        }
      }
    });

    // 2. Uygunsuzluk (DÖF) Verileri
    const uygunsuzluklar = await prisma.bTUygunsuzluk.findMany({
      where: { facilityId },
      include: {
        sorumluBirimler: true
      }
    });

    const toplamTur = await prisma.bTTur.count({
      where: { facilityId }
    });

    const analiz = {
      genelDurum: {
        toplamTur,
        toplamSoru: cevaplar.length,
        uygun: cevaplar.filter(c => c.sonuc === 'UYGUN').length,
        uygunDegil: cevaplar.filter(c => c.sonuc === 'UYGUN_DEGIL').length
      },
      anaGrupBazli: [] as any[],
      alanBazli: [] as any[],
      birimBazli: [] as any[]
    };

    // Ana Grup ve Alan bazlı gruplama
    const grupMap = new Map();
    const alanMap = new Map();

    cevaplar.forEach(c => {
      const gId = c.turSorusu.soru.anaGrupId || 0;
      const gAd = c.turSorusu.soru.anaGrup?.ad || 'Genel';
      const aId = c.turSorusu.soru.denetlenenAlanId || 0;
      const aAd = c.turSorusu.soru.denetlenenAlan?.ad || 'Genel Alan';

      if (!grupMap.has(gId)) grupMap.set(gId, { ad: gAd, uygun: 0, uygunDegil: 0, toplam: 0 });
      if (!alanMap.has(aId)) alanMap.set(aId, { ad: aAd, uygun: 0, uygunDegil: 0, toplam: 0 });

      const gData = grupMap.get(gId);
      const aData = alanMap.get(aId);

      gData.toplam++;
      aData.toplam++;

      if (c.sonuc === 'UYGUN') {
        gData.uygun++;
        aData.uygun++;
      } else if (c.sonuc === 'UYGUN_DEGIL') {
        gData.uygunDegil++;
        aData.uygunDegil++;
      }
    });

    analiz.anaGrupBazli = Array.from(grupMap.values());
    analiz.alanBazli = Array.from(alanMap.values());

    // Birim bazlı DÖF Analizi
    const birimMap = new Map();
    uygunsuzluklar.forEach(u => {
      if (u.sorumluBirimler && u.sorumluBirimler.length > 0) {
        u.sorumluBirimler.forEach(b => {
          if (!birimMap.has(b.id)) {
            birimMap.set(b.id, { ad: b.ad, acik: 0, devam: 0, kapali: 0, toplam: 0 });
          }
          const bData = birimMap.get(b.id);
          bData.toplam++;
          if (u.durum === 'ACIK') bData.acik++;
          else if (u.durum === 'DEVAM_EDIYOR') bData.devam++;
          else if (u.durum === 'KAPALI') bData.kapali++;
        });
      } else {
        if (!birimMap.has(0)) birimMap.set(0, { ad: 'Atanmadı', acik: 0, devam: 0, kapali: 0, toplam: 0 });
        const bData = birimMap.get(0);
        bData.toplam++;
        if (u.durum === 'ACIK') bData.acik++;
        else if (u.durum === 'DEVAM_EDIYOR') bData.devam++;
        else if (u.durum === 'KAPALI') bData.kapali++;
      }
    });

    analiz.birimBazli = Array.from(birimMap.values());

    res.json(analiz);
  } catch (err) {
    handleError(res, err);
  }
});

export default router;
