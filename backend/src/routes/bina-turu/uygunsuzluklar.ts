import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';

const router = Router();
const prisma = new PrismaClient();
const upload = multer({ dest: 'uploads/' });

const handleError = (res: Response, error: unknown) => {
  console.error(error);
  res.status(500).json({ error: 'Bir hata oluştu' });
};

// Uygunsuzluk Listesi
router.get('/', async (req: Request, res: Response) => {
  const facilityId = req.query.facilityId as string;
  try {
    const uygunsuzluklar = await prisma.bTUygunsuzluk.findMany({
      where: { facilityId },
      include: {
        tur: true,
        cevap: {
          include: {
            turSorusu: {
              include: {
                soru: {
                  include: { anaGrup: true, denetlenenAlan: true, kategori: true }
                }
              }
            }
          }
        },
        sorumluBirimler: true,
        sorumluKisiler: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(uygunsuzluklar);
  } catch (err) {
    handleError(res, err);
  }
});

// Atama Yap (Devam Ediyor)
router.put('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { sorumluBirimIds } = req.body;

  try {
    const uygunsuzluk = await prisma.bTUygunsuzluk.update({
      where: { id: Number(id) },
      data: {
        sorumluBirimler: {
          set: (sorumluBirimIds || []).map((bId: number) => ({ id: bId }))
        },
        durum: 'DEVAM_EDIYOR'
      }
    });
    res.json(uygunsuzluk);
  } catch (err) {
    handleError(res, err);
  }
});

// Uygunsuzluk Kapat
router.put('/:id/kapat', upload.array('kanitDosyalari'), async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { kapatmaKaniti, dofTakipNo } = req.body;
  const files = req.files as Express.Multer.File[];

  try {
    const filePaths = files ? files.map(f => f.filename) : [];
    const combinedKanit = [kapatmaKaniti, ...filePaths].filter(Boolean).join('\nDosya: ');

    const existing = await prisma.bTUygunsuzluk.findUnique({
      where: { id: Number(id) },
      include: { tur: true }
    });

    if (!existing) {
      res.status(404).json({ error: 'Uygunsuzluk bulunamadı.' });
      return;
    }

    const uygunsuzluk = await prisma.bTUygunsuzluk.update({
      where: { id: Number(id) },
      data: {
        durum: 'KAPALI',
        kapatmaKaniti: combinedKanit,
        dofTakipNo,
        kapatmaTarihi: existing.tur.baslangicTarihi
      }
    });
    res.json(uygunsuzluk);
  } catch (err) {
    handleError(res, err);
  }
});

export default router;
