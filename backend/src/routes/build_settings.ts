import express, { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

// --- LOKASYON ---

router.get('/locations', async (req: AuthRequest, res: Response) => {
  try {
    const facilityId = (req.user as any)?.facilityId || req.query.facilityId as string;
    const locations = await prisma.buildLocation.findMany({
      where: facilityId ? { facilityId } : {},
      orderBy: { createdAt: 'desc' }
    });
    res.json(locations);
  } catch (error) {
    res.status(500).json({ error: 'Lokasyonlar getirilemedi' });
  }
});

router.post('/locations', async (req: AuthRequest, res: Response) => {
  try {
    const facilityId = (req.user as any)?.facilityId || req.body.facilityId;
    if (!facilityId) return res.status(400).json({ error: 'Tesis bilgisi eksik' });
    
    const { block, floor, unit, room, description } = req.body;
    const location = await prisma.buildLocation.create({
      data: { facilityId, block, floor, unit, room, description }
    });
    res.status(201).json(location);
  } catch (error) {
    res.status(500).json({ error: 'Lokasyon oluşturulamadı' });
  }
});

router.put('/locations/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { block, floor, unit, room, description, isActive } = req.body;
    const location = await prisma.buildLocation.update({
      where: { id },
      data: { block, floor, unit, room, description, isActive }
    });
    res.json(location);
  } catch (error) {
    res.status(500).json({ error: 'Lokasyon güncellenemedi' });
  }
});

router.delete('/locations/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.buildLocation.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Lokasyon silinemedi' });
  }
});

// --- YÜKLENİCİ FİRMA ---

router.get('/contractors', async (req: AuthRequest, res: Response) => {
  try {
    const facilityId = (req.user as any)?.facilityId || req.query.facilityId as string;
    const contractors = await prisma.buildContractor.findMany({
      where: facilityId ? { facilityId } : {},
      orderBy: { name: 'asc' }
    });
    res.json(contractors);
  } catch (error) {
    res.status(500).json({ error: 'Firmalar getirilemedi' });
  }
});

router.post('/contractors', async (req: AuthRequest, res: Response) => {
  try {
    const facilityId = (req.user as any)?.facilityId || req.body.facilityId;
    if (!facilityId) return res.status(400).json({ error: 'Tesis bilgisi eksik' });

    const { name, contactName, phone, email } = req.body;
    const contractor = await prisma.buildContractor.create({
      data: { facilityId, name, contactName, phone, email }
    });
    res.status(201).json(contractor);
  } catch (error) {
    res.status(500).json({ error: 'Firma oluşturulamadı' });
  }
});

router.put('/contractors/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, contactName, phone, email, isActive } = req.body;
    const contractor = await prisma.buildContractor.update({
      where: { id },
      data: { name, contactName, phone, email, isActive }
    });
    res.json(contractor);
  } catch (error) {
    res.status(500).json({ error: 'Firma güncellenemedi' });
  }
});

router.delete('/contractors/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.buildContractor.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Firma silinemedi' });
  }
});

// --- ÇALIŞMA TÜRÜ ---

router.get('/work-types', async (req: AuthRequest, res: Response) => {
  try {
    const facilityId = (req.user as any)?.facilityId || req.query.facilityId as string;
    const types = await prisma.buildWorkType.findMany({
      where: facilityId ? { facilityId } : {},
      orderBy: { name: 'asc' }
    });
    res.json(types);
  } catch (error) {
    res.status(500).json({ error: 'Çalışma türleri getirilemedi' });
  }
});

router.post('/work-types', async (req: AuthRequest, res: Response) => {
  try {
    const facilityId = (req.user as any)?.facilityId || req.body.facilityId;
    if (!facilityId) return res.status(400).json({ error: 'Tesis bilgisi eksik' });

    const { name, description } = req.body;
    const type = await prisma.buildWorkType.create({
      data: { facilityId, name, description }
    });
    res.status(201).json(type);
  } catch (error) {
    res.status(500).json({ error: 'Çalışma türü oluşturulamadı' });
  }
});

router.put('/work-types/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, isActive } = req.body;
    const type = await prisma.buildWorkType.update({
      where: { id },
      data: { name, description, isActive }
    });
    res.json(type);
  } catch (error) {
    res.status(500).json({ error: 'Çalışma türü güncellenemedi' });
  }
});

router.delete('/work-types/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.buildWorkType.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Çalışma türü silinemedi' });
  }
});

// --- DEPARTMANLAR ---

router.get('/departments', async (req: AuthRequest, res: Response) => {
  try {
    const facilityId = (req.user as any)?.facilityId || req.query.facilityId as string;
    const departments = await prisma.buildDepartmentSetting.findMany({
      where: facilityId ? { facilityId } : {},
      orderBy: { name: 'asc' }
    });
    res.json(departments);
  } catch (error) {
    res.status(500).json({ error: 'Departmanlar getirilemedi' });
  }
});

router.post('/departments', async (req: AuthRequest, res: Response) => {
  try {
    const facilityId = (req.user as any)?.facilityId || req.body.facilityId;
    if (!facilityId) return res.status(400).json({ error: 'Tesis bilgisi eksik' });

    const { name } = req.body;
    const dept = await prisma.buildDepartmentSetting.create({
      data: { facilityId, name }
    });
    res.status(201).json(dept);
  } catch (error) {
    res.status(500).json({ error: 'Departman oluşturulamadı' });
  }
});

router.delete('/departments/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.buildDepartmentSetting.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Departman silinemedi' });
  }
});

// --- SORUMLULAR ---

router.get('/persons', async (req: AuthRequest, res: Response) => {
  try {
    const facilityId = (req.user as any)?.facilityId || req.query.facilityId as string;
    const persons = await prisma.buildPersonSetting.findMany({
      where: facilityId ? { facilityId } : {},
      orderBy: { name: 'asc' }
    });
    res.json(persons);
  } catch (error) {
    res.status(500).json({ error: 'Sorumlular getirilemedi' });
  }
});

router.post('/persons', async (req: AuthRequest, res: Response) => {
  try {
    const facilityId = (req.user as any)?.facilityId || req.body.facilityId;
    if (!facilityId) return res.status(400).json({ error: 'Tesis bilgisi eksik' });

    const { name, title } = req.body;
    const person = await prisma.buildPersonSetting.create({
      data: { facilityId, name, title }
    });
    res.status(201).json(person);
  } catch (error) {
    res.status(500).json({ error: 'Sorumlu oluşturulamadı' });
  }
});

router.delete('/persons/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.buildPersonSetting.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Sorumlu silinemedi' });
  }
});

export default router;
