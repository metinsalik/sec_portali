import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { authMiddleware } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();
const prisma = new PrismaClient();

// Setup Multer for image uploads
const uploadDir = path.join(__dirname, '../../uploads/renovation');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `renovation-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({ storage });

// Get all reports for a facility
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { facilityId } = req.query as Record<string, string>;
  if (!facilityId) return res.status(400).json({ error: 'facilityId zorunludur' });

  try {
    const reports = await prisma.renovationReport.findMany({
      where: { facilityId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: 'Raporlar alınamadı.' });
  }
});

// Get a single report
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const report = await prisma.renovationReport.findUnique({
      where: { id: req.params.id }
    });
    if (!report) return res.status(404).json({ error: 'Rapor bulunamadı.' });
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: 'Rapor alınamadı.' });
  }
});

// Create a new report
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { facilityId, projectName, location, startDate, endDate, controlledBy, assessmentDate, reportDate, status, checks, tests, certificates, findings, evaluation } = req.body;
  if (!facilityId) return res.status(400).json({ error: 'facilityId zorunludur' });

  try {
    const report = await prisma.renovationReport.create({
      data: {
        facilityId,
        projectName: projectName || '',
        location: location || '',
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        controlledBy: controlledBy || '',
        assessmentDate: assessmentDate ? new Date(assessmentDate) : null,
        reportDate: reportDate ? new Date(reportDate) : null,
        status: status || 'DRAFT',
        checks: checks || [],
        tests: tests || [],
        certificates: certificates || [],
        findings: findings || {},
        evaluation: evaluation || {},
        createdBy: req.user?.username || 'system'
      }
    });
    res.status(201).json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Rapor oluşturulamadı.' });
  }
});

// Update a report
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { projectName, location, startDate, endDate, controlledBy, assessmentDate, reportDate, status, checks, tests, certificates, findings, evaluation } = req.body;
  try {
    const report = await prisma.renovationReport.update({
      where: { id: req.params.id },
      data: {
        projectName,
        location,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        controlledBy,
        assessmentDate: assessmentDate ? new Date(assessmentDate) : null,
        reportDate: reportDate ? new Date(reportDate) : null,
        status,
        checks: checks !== undefined ? checks : undefined,
        tests: tests !== undefined ? tests : undefined,
        certificates: certificates !== undefined ? certificates : undefined,
        findings: findings !== undefined ? findings : undefined,
        evaluation: evaluation !== undefined ? evaluation : undefined
      }
    });
    res.json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Rapor güncellenemedi.' });
  }
});

// Delete a report
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.renovationReport.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Rapor silinemedi.' });
  }
});

// Upload images for findings
router.post('/upload', authMiddleware, upload.array('files', 10), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      return res.status(400).json({ error: 'Dosya yüklenmedi.' });
    }

    const files = req.files as Express.Multer.File[];
    const urls = files.map(file => `/uploads/renovation/${file.filename}`);
    
    res.json({ urls });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Dosya yükleme başarısız.' });
  }
});

export default router;
