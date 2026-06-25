import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

const handleError = (res: Response, error: unknown) => {
  console.error(error);
  res.status(500).json({ error: 'Bir hata oluştu' });
};

router.get('/:turId', async (req: Request, res: Response): Promise<void> => {
  const { turId } = req.params;

  try {
    const tur = await prisma.bTTur.findUnique({
      where: { id: parseInt(turId as string) },
      include: {
        sorumluBirimler: true,
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

    if (!tur) {
      res.status(404).json({ error: 'Tur bulunamadı' });
      return;
    }

    const gostergeler = {
      toplamSoru: 0,
      uygun: 0,
      uygunDegil: 0,
      dfVar: 0,
      uygunlukOrani: 0,
      uygunsuzlukOrani: 0
    };

    const anaGrupMap = new Map();
    const alanMap = new Map();

    const alanlaraGoreSorular: Record<string, any[]> = {};

    tur.turSorulari.forEach(ts => {
      // Soruları gruplama (cevaplanmamış olsa bile raporda boş kutu olarak görünmesi için listeye ekliyoruz)
      const aAd = ts.soru.denetlenenAlan?.ad || 'Belirtilmemiş';
      if (!alanlaraGoreSorular[aAd]) {
        alanlaraGoreSorular[aAd] = [];
      }
      alanlaraGoreSorular[aAd].push(ts);

      // Analiz hesaplamaları sadece cevaplanmış sorular için
      if (!ts.cevap) return; 

      gostergeler.toplamSoru++;

      // Ana Grup Map
      const gAd = ts.soru.anaGrup?.ad || 'Belirtilmemiş';
      if (!anaGrupMap.has(gAd)) anaGrupMap.set(gAd, { ad: gAd, toplam: 0, uygun: 0, uygunDegil: 0 });
      const gData = anaGrupMap.get(gAd);
      gData.toplam++;

      // Alan Map
      if (!alanMap.has(aAd)) alanMap.set(aAd, { ad: aAd, toplam: 0, uygun: 0, uygunDegil: 0 });
      const aData = alanMap.get(aAd);
      aData.toplam++;

      if (ts.cevap.sonuc === 'UYGUN') {
        gostergeler.uygun++;
        gData.uygun++;
        aData.uygun++;
      } else if (ts.cevap.sonuc === 'UYGUN_DEGIL') {
        gostergeler.uygunDegil++;
        gData.uygunDegil++;
        aData.uygunDegil++;
        
        if (ts.cevap.uygunsuzluk) {
          gostergeler.dfVar++;
        }
      }
    });

    if (gostergeler.toplamSoru > 0) {
      gostergeler.uygunlukOrani = (gostergeler.uygun / gostergeler.toplamSoru) * 100;
      gostergeler.uygunsuzlukOrani = (gostergeler.uygunDegil / gostergeler.toplamSoru) * 100;
    }

    const calcYuzde = (uygun: number, toplam: number) => toplam > 0 ? (uygun / toplam) * 100 : 0;

    const anaGrupTablosu = Array.from(anaGrupMap.values()).map(g => ({ ...g, uygunlukYuzdesi: calcYuzde(g.uygun, g.toplam) }));
    const alanTablosu = Array.from(alanMap.values()).map(a => ({ ...a, uygunlukYuzdesi: calcYuzde(a.uygun, a.toplam) }));

    res.json({
      turBilgisi: {
        ad: tur.ad,
        baslangicTarihi: tur.baslangicTarihi,
        tesisLogosu: tur.facility?.logoUrl || '/mlpcare.jpg', // Schema'da default /mlpcare.jpg
        tesisAdi: tur.facility?.name || 'Tesis',
        katilanBirimler: tur.sorumluBirimler
      },
      analiz: {
        gostergeler,
        anaGrupTablosu: anaGrupTablosu.sort((a,b) => b.toplam - a.toplam),
        alanTablosu: alanTablosu.sort((a,b) => b.toplam - a.toplam)
      },
      sorular: Object.keys(alanlaraGoreSorular).sort().map(alan => ({
        alanAdi: alan,
        soruListesi: alanlaraGoreSorular[alan]
      }))
    });

  } catch (err) {
    handleError(res, err);
  }
});

export default router;
