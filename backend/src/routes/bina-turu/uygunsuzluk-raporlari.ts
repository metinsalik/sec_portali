import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

const handleError = (res: Response, error: unknown) => {
  console.error(error);
  res.status(500).json({ error: 'Bir hata oluştu' });
};

// 1. TUR BAZLI UYGUNSUZLUK RAPORU
router.get('/tur/:turId', async (req: Request, res: Response): Promise<void> => {
  const { turId } = req.params;

  try {
    const tur = await prisma.bTTur.findUnique({
      where: { id: parseInt(turId as string) },
      include: {
        facility: true,
        turSorulari: {
          include: {
            soru: { include: { denetlenenAlan: true, anaGrup: true } },
            cevap: {
              include: {
                uygunsuzluk: {
                  include: { sorumluBirimler: true }
                }
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

    const uygunsuzluklar = tur.turSorulari
      .filter((ts: any) => ts.cevap?.sonuc === 'UYGUN_DEGIL' && ts.cevap?.uygunsuzluk)
      .map((ts: any) => ({
        alan: ts.soru.denetlenenAlan?.ad || 'Belirtilmemiş',
        soruMetni: ts.soru.metin,
        cevap: ts.cevap,
        uygunsuzluk: ts.cevap.uygunsuzluk
      }));

    const stats = {
      toplam: uygunsuzluklar.length,
      atanmadi: uygunsuzluklar.filter((u: any) => u.uygunsuzluk?.durum === 'ATANMADI').length,
      devamEdiyor: uygunsuzluklar.filter((u: any) => u.uygunsuzluk?.durum === 'DEVAM_EDIYOR').length,
      tamamlandi: uygunsuzluklar.filter((u: any) => u.uygunsuzluk?.durum === 'KAPALI').length,
    };

    const cozumOrani = stats.toplam > 0 ? (stats.tamamlandi / stats.toplam) * 100 : 100;

    res.json({
      turBilgisi: {
        id: tur.id,
        ad: tur.ad,
        baslangicTarihi: tur.baslangicTarihi,
        tesisLogosu: tur.facility?.logoUrl || '/mlpcare.jpg',
        tesisAdi: tur.facility?.name || 'Tesis'
      },
      istatistikler: { ...stats, cozumOrani },
      uygunsuzluklar
    });

  } catch (err) {
    handleError(res, err);
  }
});

// 2. YILLIK UYGUNSUZLUK RAPORU
router.get('/yillik/:year', async (req: Request, res: Response): Promise<void> => {
  const facilityId = req.query.facilityId as string;
  const { year } = req.params;

  if (!facilityId) {
    res.status(400).json({ error: 'facilityId zorunludur' });
    return;
  }

  try {
    const parsedYear = parseInt(year as string);

    const turlar = await prisma.bTTur.findMany({
      where: { facilityId },
      include: {
        facility: true,
        turSorulari: {
          include: {
            soru: { include: { denetlenenAlan: true } },
            cevap: {
              include: {
                uygunsuzluk: { include: { sorumluBirimler: true } }
              }
            }
          }
        }
      }
    });

    const yearTours = turlar.filter((t: any) => new Date(t.baslangicTarihi).getFullYear() === parsedYear);

    let tesisLogosu = '/mlpcare.jpg';
    let tesisAdi = 'Tesis';
    if (yearTours.length > 0 && yearTours[0].facility) {
      tesisLogosu = yearTours[0].facility.logoUrl || '/mlpcare.jpg';
      tesisAdi = yearTours[0].facility.name || 'Tesis';
    } else {
      const fac = await prisma.facility.findUnique({ where: { id: facilityId }});
      if (fac) {
        tesisLogosu = fac.logoUrl || '/mlpcare.jpg';
        tesisAdi = fac.name;
      }
    }

    const tumUygunsuzluklar: any[] = [];
    const birimMap = new Map();

    yearTours.forEach((tur: any) => {
      tur.turSorulari.forEach((ts: any) => {
        if (ts.cevap?.sonuc === 'UYGUN_DEGIL' && ts.cevap.uygunsuzluk) {
          
          const u = ts.cevap.uygunsuzluk;
          
          tumUygunsuzluklar.push({
            turAdi: tur.ad,
            turTarihi: tur.baslangicTarihi,
            alan: ts.soru.denetlenenAlan?.ad || 'Belirtilmemiş',
            soruMetni: ts.soru.metin,
            cevap: ts.cevap,
            uygunsuzluk: u
          });

          const bName = u.sorumluBirimler?.[0]?.ad || 'Atanmamış';
          if (!birimMap.has(bName)) {
            birimMap.set(bName, { ad: bName, toplam: 0, kapali: 0, acik: 0 });
          }
          const bData = birimMap.get(bName);
          bData.toplam++;
          if (u.durum === 'KAPALI') bData.kapali++;
          else bData.acik++;
        }
      });
    });

    const stats = {
      toplam: tumUygunsuzluklar.length,
      atanmadi: tumUygunsuzluklar.filter(u => u.uygunsuzluk.durum === 'ATANMADI').length,
      devamEdiyor: tumUygunsuzluklar.filter(u => u.uygunsuzluk.durum === 'DEVAM_EDIYOR').length,
      tamamlandi: tumUygunsuzluklar.filter(u => u.uygunsuzluk.durum === 'KAPALI').length,
    };

    const cozumOrani = stats.toplam > 0 ? (stats.tamamlandi / stats.toplam) * 100 : 100;

    const birimPerformans = Array.from(birimMap.values()).map(b => ({
      ...b,
      orani: b.toplam > 0 ? (b.kapali / b.toplam) * 100 : 0
    })).sort((a,b) => b.toplam - a.toplam);

    res.json({
      yilBilgisi: {
        yil: parsedYear,
        tesisLogosu,
        tesisAdi
      },
      istatistikler: { ...stats, cozumOrani },
      birimPerformans,
      tumUygunsuzluklar: tumUygunsuzluklar.sort((a,b) => new Date(a.turTarihi).getTime() - new Date(b.turTarihi).getTime())
    });

  } catch (err) {
    handleError(res, err);
  }
});

export default router;
