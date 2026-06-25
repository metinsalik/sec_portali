import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Yardımcı Fonksiyonlar
const handleError = (res: Response, error: unknown) => {
  console.error(error);
  res.status(500).json({ error: 'Bir hata oluştu' });
};

// --- ANA GRUP ---
router.get('/ana-grup', async (req: Request, res: Response) => {
  const facilityId = req.query.facilityId as string;
  try {
    const data = await prisma.bTAnaGrup.findMany({ where: { facilityId } });
    res.json(data);
  } catch (err) { handleError(res, err); }
});

router.post('/ana-grup', async (req: Request, res: Response) => {
  const { facilityId, ad } = req.body;
  try {
    const data = await prisma.bTAnaGrup.create({ data: { facilityId, ad } });
    res.status(201).json(data);
  } catch (err) { handleError(res, err); }
});

router.put('/ana-grup/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { ad } = req.body;
  try {
    const data = await prisma.bTAnaGrup.update({ where: { id: Number(id) }, data: { ad } });
    res.json(data);
  } catch (err) { handleError(res, err); }
});

router.delete('/ana-grup/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.bTAnaGrup.delete({ where: { id: Number(id) } });
    res.status(204).send();
  } catch (err) { handleError(res, err); }
});

// --- DENETLENEN ALAN ---
router.get('/denetlenen-alan', async (req: Request, res: Response) => {
  const facilityId = req.query.facilityId as string;
  try {
    const data = await prisma.bTDenetlenenAlan.findMany({ where: { facilityId } });
    res.json(data);
  } catch (err) { handleError(res, err); }
});

router.post('/denetlenen-alan', async (req: Request, res: Response) => {
  const { facilityId, ad } = req.body;
  try {
    const data = await prisma.bTDenetlenenAlan.create({ data: { facilityId, ad } });
    res.status(201).json(data);
  } catch (err) { handleError(res, err); }
});

router.put('/denetlenen-alan/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { ad } = req.body;
  try {
    const data = await prisma.bTDenetlenenAlan.update({ where: { id: Number(id) }, data: { ad } });
    res.json(data);
  } catch (err) { handleError(res, err); }
});

router.delete('/denetlenen-alan/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.bTDenetlenenAlan.delete({ where: { id: Number(id) } });
    res.status(204).send();
  } catch (err) { handleError(res, err); }
});

// --- KATEGORİ ---
router.get('/kategori', async (req: Request, res: Response) => {
  const facilityId = req.query.facilityId as string;
  try {
    const data = await prisma.bTKategori.findMany({ where: { facilityId } });
    res.json(data);
  } catch (err) { handleError(res, err); }
});

router.post('/kategori', async (req: Request, res: Response) => {
  const { facilityId, ad } = req.body;
  try {
    const data = await prisma.bTKategori.create({ data: { facilityId, ad } });
    res.status(201).json(data);
  } catch (err) { handleError(res, err); }
});

router.put('/kategori/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { ad } = req.body;
  try {
    const data = await prisma.bTKategori.update({ where: { id: Number(id) }, data: { ad } });
    res.json(data);
  } catch (err) { handleError(res, err); }
});

router.delete('/kategori/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.bTKategori.delete({ where: { id: Number(id) } });
    res.status(204).send();
  } catch (err) { handleError(res, err); }
});

// --- SORUMLU BİRİM ---
router.get('/sorumlu-birim', async (req: Request, res: Response) => {
  const facilityId = req.query.facilityId as string;
  try {
    const data = await prisma.bTSorumluBirim.findMany({ where: { facilityId } });
    res.json(data);
  } catch (err) { handleError(res, err); }
});

router.post('/sorumlu-birim', async (req: Request, res: Response) => {
  const { facilityId, ad } = req.body;
  try {
    const data = await prisma.bTSorumluBirim.create({ data: { facilityId, ad } });
    res.status(201).json(data);
  } catch (err) { handleError(res, err); }
});

router.put('/sorumlu-birim/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { ad } = req.body;
  try {
    const data = await prisma.bTSorumluBirim.update({ where: { id: Number(id) }, data: { ad } });
    res.json(data);
  } catch (err) { handleError(res, err); }
});

router.delete('/sorumlu-birim/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.bTSorumluBirim.delete({ where: { id: Number(id) } });
    res.status(204).send();
  } catch (err) { handleError(res, err); }
});

// --- SORUMLU KİŞİ ---
router.get('/sorumlu-kisi', async (req: Request, res: Response) => {
  const facilityId = req.query.facilityId as string;
  try {
    const data = await prisma.bTSorumluKisi.findMany({
      where: { facilityId },
      include: { birim: true }
    });
    res.json(data);
  } catch (err) { handleError(res, err); }
});

router.post('/sorumlu-kisi', async (req: Request, res: Response) => {
  const { facilityId, ad, birimId } = req.body;
  try {
    const data = await prisma.bTSorumluKisi.create({ data: { facilityId, ad, birimId: Number(birimId) } });
    res.status(201).json(data);
  } catch (err) { handleError(res, err); }
});

router.put('/sorumlu-kisi/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { ad, birimId } = req.body;
  try {
    const data = await prisma.bTSorumluKisi.update({ where: { id: Number(id) }, data: { ad, birimId: Number(birimId) } });
    res.json(data);
  } catch (err) { handleError(res, err); }
});

router.delete('/sorumlu-kisi/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.bTSorumluKisi.delete({ where: { id: Number(id) } });
    res.status(204).send();
  } catch (err) { handleError(res, err); }
});

export default router;
