import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

const handleError = (res: Response, error: unknown) => {
  console.error(error);
  res.status(500).json({ error: 'Bir hata oluştu' });
};

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const facilityId = req.query.facilityId as string;
  const yearStr = req.query.year as string;
  const periodStr = req.query.period as string;

  if (!facilityId) {
    res.status(400).json({ error: 'facilityId zorunludur' });
    return;
  }

  try {
    // Tüm turları alıyoruz ki tarih filtrelemesini JS'de rahatça yapabilelim
    const turlar = await prisma.bTTur.findMany({
      where: { facilityId },
      include: {
        turSorulari: {
          include: {
            cevap: {
              include: {
                uygunsuzluk: true
              }
            },
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

    let filteredTurlar = turlar;

    // Yıl Filtresi
    if (yearStr) {
      const year = parseInt(yearStr);
      filteredTurlar = filteredTurlar.filter(t => new Date(t.baslangicTarihi).getFullYear() === year);
    }

    // Dönem Filtresi
    if (periodStr) {
      const period = parseInt(periodStr);
      filteredTurlar = filteredTurlar.filter(t => {
        const month = new Date(t.baslangicTarihi).getMonth() + 1;
        let tPeriod = 1;
        if (month >= 4 && month <= 6) tPeriod = 2;
        else if (month >= 7 && month <= 9) tPeriod = 3;
        else if (month >= 10 && month <= 12) tPeriod = 4;
        return tPeriod === period;
      });
    }

    const gostergeler = {
      toplamSoru: 0,
      uygun: 0,
      uygunDegil: 0,
      dfVar: 0,
      uygunlukOrani: 0,
      uygunsuzlukOrani: 0
    };

    const denetimMap = new Map();
    const anaGrupMap = new Map();
    const alanMap = new Map();

    filteredTurlar.forEach(tur => {
      if (!denetimMap.has(tur.id)) {
        denetimMap.set(tur.id, { ad: tur.ad, toplam: 0, uygun: 0, uygunDegil: 0 });
      }

      tur.turSorulari.forEach(ts => {
        if (!ts.cevap) return; // Sadece cevaplanan sorular hesaba katılır

        gostergeler.toplamSoru++;

        // Denetim Map
        const dData = denetimMap.get(tur.id);
        dData.toplam++;

        // Ana Grup Map
        const gAd = ts.soru.anaGrup?.ad || 'Belirtilmemiş';
        if (!anaGrupMap.has(gAd)) anaGrupMap.set(gAd, { ad: gAd, toplam: 0, uygun: 0, uygunDegil: 0 });
        const gData = anaGrupMap.get(gAd);
        gData.toplam++;

        // Alan Map
        const aAd = ts.soru.denetlenenAlan?.ad || 'Belirtilmemiş';
        if (!alanMap.has(aAd)) alanMap.set(aAd, { ad: aAd, toplam: 0, uygun: 0, uygunDegil: 0 });
        const aData = alanMap.get(aAd);
        aData.toplam++;

        if (ts.cevap.sonuc === 'UYGUN') {
          gostergeler.uygun++;
          dData.uygun++;
          gData.uygun++;
          aData.uygun++;
        } else if (ts.cevap.sonuc === 'UYGUN_DEGIL') {
          gostergeler.uygunDegil++;
          dData.uygunDegil++;
          gData.uygunDegil++;
          aData.uygunDegil++;
          
          if (ts.cevap.uygunsuzluk) {
            gostergeler.dfVar++;
          }
        }
      });
    });

    if (gostergeler.toplamSoru > 0) {
      gostergeler.uygunlukOrani = (gostergeler.uygun / gostergeler.toplamSoru) * 100;
      gostergeler.uygunsuzlukOrani = (gostergeler.uygunDegil / gostergeler.toplamSoru) * 100;
    }

    const calcYuzde = (uygun: number, toplam: number) => toplam > 0 ? (uygun / toplam) * 100 : 0;

    const denetimTablosu = Array.from(denetimMap.values()).map(d => ({ ...d, uygunlukYuzdesi: calcYuzde(d.uygun, d.toplam) }));
    const anaGrupTablosu = Array.from(anaGrupMap.values()).map(g => ({ ...g, uygunlukYuzdesi: calcYuzde(g.uygun, g.toplam) }));
    const alanTablosu = Array.from(alanMap.values()).map(a => ({ ...a, uygunlukYuzdesi: calcYuzde(a.uygun, a.toplam) }));

    res.json({
      gostergeler,
      denetimTablosu: denetimTablosu.sort((a,b) => b.toplam - a.toplam),
      anaGrupTablosu: anaGrupTablosu.sort((a,b) => b.toplam - a.toplam),
      alanTablosu: alanTablosu.sort((a,b) => b.toplam - a.toplam)
    });

  } catch (err) {
    handleError(res, err);
  }
});

export default router;
