import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

const handleError = (res: Response, error: unknown) => {
  console.error(error);
  res.status(500).json({ error: 'Bir hata oluştu' });
};

router.get('/:year', async (req: Request, res: Response): Promise<void> => {
  const facilityId = req.query.facilityId as string;
  const { year } = req.params;

  if (!facilityId) {
    res.status(400).json({ error: 'facilityId zorunludur' });
    return;
  }

  try {
    const parsedYear = parseInt(year as string);

    // Tüm turları alıyoruz (sadece o yıla ait olanları veritabanı aşamasında filtreleyemiyoruz çünkü ISO format vs olabilir ama TS'de hallederiz)
    const turlar = await prisma.bTTur.findMany({
      where: { facilityId },
      include: {
        facility: true,
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

    const yearTours = turlar.filter(t => new Date(t.baslangicTarihi).getFullYear() === parsedYear);

    const gostergeler = {
      toplamSoru: 0,
      uygun: 0,
      uygunDegil: 0,
      dfVar: 0,
      uygunlukOrani: 0,
      uygunsuzlukOrani: 0
    };

    const donemMap = new Map([
      [1, { donem: 1, toplam: 0, uygun: 0, uygunDegil: 0 }],
      [2, { donem: 2, toplam: 0, uygun: 0, uygunDegil: 0 }],
      [3, { donem: 3, toplam: 0, uygun: 0, uygunDegil: 0 }],
      [4, { donem: 4, toplam: 0, uygun: 0, uygunDegil: 0 }],
    ]);

    const alanMap = new Map();
    const anaGrupMap = new Map();

    const turlarOzeti = yearTours.map(tur => {
      let turToplam = 0;
      let turUygun = 0;
      let turUygunDegil = 0;

      const month = new Date(tur.baslangicTarihi).getMonth() + 1;
      let donem = 1;
      if (month >= 4 && month <= 6) donem = 2;
      else if (month >= 7 && month <= 9) donem = 3;
      else if (month >= 10 && month <= 12) donem = 4;

      const dData = donemMap.get(donem)!;

      tur.turSorulari.forEach(ts => {
        if (!ts.cevap) return;

        gostergeler.toplamSoru++;
        turToplam++;
        dData.toplam++;

        const aAd = ts.soru.denetlenenAlan?.ad || 'Belirtilmemiş';
        if (!alanMap.has(aAd)) alanMap.set(aAd, { ad: aAd, toplam: 0, uygun: 0, uygunDegil: 0 });
        const aData = alanMap.get(aAd);
        aData.toplam++;

        const gAd = ts.soru.anaGrup?.ad || 'Belirtilmemiş';
        if (!anaGrupMap.has(gAd)) anaGrupMap.set(gAd, { ad: gAd, toplam: 0, uygun: 0, uygunDegil: 0 });
        const gData = anaGrupMap.get(gAd);
        gData.toplam++;

        if (ts.cevap.sonuc === 'UYGUN') {
          gostergeler.uygun++;
          turUygun++;
          dData.uygun++;
          aData.uygun++;
          gData.uygun++;
        } else if (ts.cevap.sonuc === 'UYGUN_DEGIL') {
          gostergeler.uygunDegil++;
          turUygunDegil++;
          dData.uygunDegil++;
          aData.uygunDegil++;
          gData.uygunDegil++;
          
          if (ts.cevap.uygunsuzluk) {
            gostergeler.dfVar++;
          }
        }
      });

      return {
        id: tur.id,
        ad: tur.ad,
        baslangicTarihi: tur.baslangicTarihi,
        donem,
        uygunlukYuzdesi: turToplam > 0 ? (turUygun / turToplam) * 100 : 0
      };
    });

    if (gostergeler.toplamSoru > 0) {
      gostergeler.uygunlukOrani = (gostergeler.uygun / gostergeler.toplamSoru) * 100;
      gostergeler.uygunsuzlukOrani = (gostergeler.uygunDegil / gostergeler.toplamSoru) * 100;
    }

    const calcYuzde = (uygun: number, toplam: number) => toplam > 0 ? (uygun / toplam) * 100 : 0;

    const donemTablosu = Array.from(donemMap.values()).map(d => ({ ...d, uygunlukYuzdesi: calcYuzde(d.uygun, d.toplam) }));
    
    // En kötü alanları bulmak için uygunsuzluk sayısına göre azalan sıralama (veya uygunluk yüzdesine göre artan)
    const alanTablosu = Array.from(alanMap.values())
      .map(a => ({ ...a, uygunlukYuzdesi: calcYuzde(a.uygun, a.toplam) }))
      .filter(a => a.uygunDegil > 0) // Sadece uygunsuzluk çıkanları al
      .sort((a,b) => b.uygunDegil - a.uygunDegil)
      .slice(0, 10); // İlk 10

    const anaGrupTablosu = Array.from(anaGrupMap.values())
      .map(a => ({ ...a, uygunlukYuzdesi: calcYuzde(a.uygun, a.toplam) }))
      .sort((a,b) => b.uygunDegil - a.uygunDegil);

    // Tesis logosunu herhangi bir turdan veya veritabanından direkt alabiliriz
    const facilityInfo = await prisma.facility.findUnique({ where: { id: facilityId } });

    res.json({
      yilBilgisi: {
        yil: parsedYear,
        tesisLogosu: facilityInfo?.logoUrl || '/mlpcare.jpg',
        tesisAdi: facilityInfo?.name || 'Tesis'
      },
      gostergeler,
      donemTablosu,
      alanTablosu, // En çok uygunsuzluk çıkan alanlar
      anaGrupTablosu,
      turlarOzeti: turlarOzeti.sort((a,b) => new Date(a.baslangicTarihi).getTime() - new Date(b.baslangicTarihi).getTime())
    });

  } catch (err) {
    handleError(res, err);
  }
});

export default router;
