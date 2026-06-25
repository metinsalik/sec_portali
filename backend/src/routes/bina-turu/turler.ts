import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

const handleError = (res: Response, error: unknown) => {
  console.error(error);
  res.status(500).json({ error: 'Bir hata oluştu' });
};

// Yeni Tur Oluştur
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { facilityId, ad, baslangicTarihi, bitisTarihi, sorumluBirimIds, sorumluKisiIds, soruIds } = req.body;
  if (!facilityId || !ad || !soruIds || !soruIds.length) {
    res.status(400).json({ error: 'Eksik parametreler.' });
    return;
  }

  try {
    const tur = await prisma.bTTur.create({
      data: {
        facilityId,
        ad,
        baslangicTarihi: new Date(baslangicTarihi || new Date()),
        bitisTarihi: new Date(bitisTarihi || new Date()),
        sorumluBirimler: {
          connect: (sorumluBirimIds || []).map((id: number) => ({ id }))
        },
        sorumluKisiler: {
          connect: (sorumluKisiIds || []).map((id: number) => ({ id }))
        },
        turSorulari: {
          create: soruIds.map((soruId: number) => ({
            soruId
          }))
        }
      }
    });
    res.status(201).json(tur);
  } catch (err) {
    handleError(res, err);
  }
});

// Turları Listele
router.get('/', async (req: Request, res: Response) => {
  const facilityId = req.query.facilityId as string;
  try {
    const turlar = await prisma.bTTur.findMany({
      where: { facilityId },
      include: {
        sorumluBirimler: true,
        sorumluKisiler: true,
        _count: {
          select: { turSorulari: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(turlar);
  } catch (err) {
    handleError(res, err);
  }
});

// Tur Detay ve Soruları
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const tur = await prisma.bTTur.findUnique({
      where: { id: Number(id) },
      include: {
        sorumluBirimler: true,
        sorumluKisiler: true,
        turSorulari: {
          include: {
            soru: {
              include: {
                anaGrup: true,
                denetlenenAlan: true,
                kategori: true
              }
            },
            cevap: true
          }
        }
      }
    });

    if (!tur) {
      res.status(404).json({ error: 'Tur bulunamadı.' });
      return;
    }

    res.json(tur);
  } catch (err) {
    handleError(res, err);
  }
});

// Turu Tamamla
router.put('/:id/tamamla', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const tur = await prisma.bTTur.update({
      where: { id: Number(id) },
      data: { durum: 'TAMAMLANDI' }
    });
    res.json(tur);
  } catch (err) {
    handleError(res, err);
  }
});

export default router;
