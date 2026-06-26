import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import ExcelJS from 'exceljs';

const router = Router();
const prisma = new PrismaClient();
const upload = multer({ storage: multer.memoryStorage() });

const handleError = (res: Response, error: unknown) => {
  console.error(error);
  res.status(500).json({ error: 'Bir hata oluştu' });
};

router.get('/', async (req: Request, res: Response) => {
  const facilityId = req.query.facilityId as string;
  try {
    const data = await prisma.bTSoruBankasi.findMany({
      where: { facilityId },
      include: {
        anaGrup: true,
        denetlenenAlan: true,
        kategori: true
      }
    });
    res.json(data);
  } catch (err) { handleError(res, err); }
});

router.post('/', async (req: Request, res: Response) => {
  const { facilityId, anaGrupId, denetlenenAlanId, kategoriId, kriter } = req.body;
  try {
    const data = await prisma.bTSoruBankasi.create({
      data: {
        facilityId,
        anaGrupId: Number(anaGrupId),
        denetlenenAlanId: Number(denetlenenAlanId),
        kategoriId: Number(kategoriId),
        kriter
      }
    });
    res.status(201).json(data);
  } catch (err) { handleError(res, err); }
});

router.put('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { anaGrupId, denetlenenAlanId, kategoriId, kriter } = req.body;
  try {
    const data = await prisma.bTSoruBankasi.update({
      where: { id: Number(id) },
      data: {
        anaGrupId: Number(anaGrupId),
        denetlenenAlanId: Number(denetlenenAlanId),
        kategoriId: Number(kategoriId),
        kriter
      }
    });
    res.json(data);
  } catch (err) { handleError(res, err); }
});

router.delete('/bulk', async (req: Request, res: Response): Promise<void> => {
  try {
    const { ids, facilityId, deleteAll } = req.body;
    
    if (!facilityId) {
      res.status(400).json({ error: 'FacilityId eksik.' });
      return;
    }

    if (deleteAll) {
      await prisma.bTSoruBankasi.deleteMany({
        where: { facilityId }
      });
      res.json({ message: 'Tüm sorular silindi.' });
    } else if (ids && Array.isArray(ids) && ids.length > 0) {
      await prisma.bTSoruBankasi.deleteMany({
        where: { facilityId, id: { in: ids } }
      });
      res.json({ message: 'Seçili sorular silindi.' });
    } else {
      res.status(400).json({ error: 'Silinecek soru seçilmedi.' });
    }
  } catch (err) {
    console.error(err);
    if ((err as any).code === 'P2003') {
      res.status(400).json({ error: 'Bu sorular bir denetimde kullanıldığı için silinemez.' });
    } else {
      res.status(500).json({ error: 'Toplu silme işleminde hata oluştu.' });
    }
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.bTSoruBankasi.delete({ where: { id: Number(id) } });
    res.status(204).send();
  } catch (err) { handleError(res, err); }
});

router.post('/excel-yukle', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  const facilityId = req.body.facilityId as string;
  const file = req.file;

  if (!file || !facilityId) {
    res.status(400).json({ error: 'Dosya veya facilityId eksik.' });
    return;
  }

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file.buffer as any);
    const worksheet = workbook.worksheets[0];

    const questions: any[] = [];
    let isHeader = true;

    worksheet.eachRow(async (row, rowNumber) => {
      if (isHeader) { isHeader = false; return; }

      const anaGrupAd = row.getCell(1).text?.trim();
      const denetlenenAlanAd = row.getCell(2).text?.trim();
      const kriter = row.getCell(3).text?.trim();
      const kategoriAd = row.getCell(4).text?.trim();

      if (anaGrupAd && denetlenenAlanAd && kriter && kategoriAd) {
        questions.push({ anaGrupAd, denetlenenAlanAd, kriter, kategoriAd });
      }
    });

    for (const q of questions) {
      // Find or create Ana Grup
      let anaGrup = await prisma.bTAnaGrup.findFirst({ where: { facilityId, ad: q.anaGrupAd } });
      if (!anaGrup) {
        anaGrup = await prisma.bTAnaGrup.create({ data: { facilityId, ad: q.anaGrupAd } });
      }

      // Find or create Denetlenen Alan
      let denetlenenAlan = await prisma.bTDenetlenenAlan.findFirst({ where: { facilityId, ad: q.denetlenenAlanAd } });
      if (!denetlenenAlan) {
        denetlenenAlan = await prisma.bTDenetlenenAlan.create({ data: { facilityId, ad: q.denetlenenAlanAd } });
      }

      // Find or create Kategori
      let kategori = await prisma.bTKategori.findFirst({ where: { facilityId, ad: q.kategoriAd } });
      if (!kategori) {
        kategori = await prisma.bTKategori.create({ data: { facilityId, ad: q.kategoriAd } });
      }

      // Find or create Soru
      const mevcutSoru = await prisma.bTSoruBankasi.findFirst({
        where: {
          facilityId,
          anaGrupId: anaGrup.id,
          denetlenenAlanId: denetlenenAlan.id,
          kategoriId: kategori.id,
          kriter: q.kriter
        }
      });

      if (!mevcutSoru) {
        await prisma.bTSoruBankasi.create({
          data: {
            facilityId,
            anaGrupId: anaGrup.id,
            denetlenenAlanId: denetlenenAlan.id,
            kategoriId: kategori.id,
            kriter: q.kriter
          }
        });
      }
    }

    res.json({ message: 'Excel başarıyla yüklendi ve sorular eklendi.', count: questions.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Excel dosyası işlenirken hata oluştu.' });
  }
});

export default router;
