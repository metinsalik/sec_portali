import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();
const prisma = new PrismaClient();

// Multer Ayarları
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/notebooks';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) return cb(null, true);
    cb(new Error('Sadece PNG, JPEG ve PDF dosyaları yüklenebilir.'));
  }
});

router.use(authMiddleware);

// Tesis ve Yıla göre kayıtları getir
router.get('/:facilityId', async (req: AuthRequest, res: Response) => {
  const { facilityId } = req.params;
  const year = parseInt(req.query.year as string) || new Date().getFullYear();

  try {
    const entries = await prisma.notebookEntry.findMany({
      where: { facilityId, year },
      include: {
        category: true,
        subCategory: true,
        department: true,
      },
      orderBy: { date: 'desc' },
    });
    res.json(entries);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Kayıtlar getirilemedi.' });
  }
});

// Yeni kayıt ekle
router.post('/:facilityId', upload.single('document'), async (req: AuthRequest, res: Response) => {
  const { facilityId } = req.params;
  const { 
    date, authorType, authorName, content, 
    categoryId, subCategoryId, departmentId 
  } = req.body;

  try {
    const documentUrl = req.file ? `/${req.file.path}` : null;
    const year = new Date(date).getFullYear();

    const entry = await prisma.notebookEntry.create({
      data: {
        facilityId,
        year,
        date: new Date(date),
        authorType,
        authorName,
        content,
        categoryId: parseInt(categoryId),
        subCategoryId: subCategoryId ? parseInt(subCategoryId) : null,
        departmentId: parseInt(departmentId),
        documentUrl,
        status: documentUrl ? 'Tamamlandı' : 'Eksik',
        createdBy: req.user!.username,
      },
      include: {
        category: true,
        department: true
      }
    });

    // Aktivite Günlüğü
    await prisma.activityLog.create({
      data: {
        facilityId,
        username: req.user!.username,
        action: 'Yeni Defter Kaydı Eklendi',
        details: `${entry.category.name} kategorisinde yeni bir tespit/öneri eklendi.`
      }
    });

    res.status(201).json(entry);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Kayıt oluşturulamadı: ' + error.message });
  }
});

// Kaydı güncelle (Dosya yükleme dahil)
router.put('/:facilityId/:entryId', upload.single('document'), async (req: AuthRequest, res: Response) => {
  const { facilityId, entryId } = req.params;
  const { 
    date, authorType, authorName, content, 
    categoryId, subCategoryId, departmentId 
  } = req.body;

  try {
    const updateData: any = {
      authorType,
      authorName,
      content,
      categoryId: categoryId ? parseInt(categoryId) : undefined,
      subCategoryId: subCategoryId ? parseInt(subCategoryId) : undefined,
      departmentId: departmentId ? parseInt(departmentId) : undefined,
      updatedAt: new Date(),
    };

    if (date) {
      updateData.date = new Date(date);
      updateData.year = new Date(date).getFullYear();
    }

    if (req.file) {
      updateData.documentUrl = `/${req.file.path}`;
      updateData.status = 'Tamamlandı';
    }

    const entry = await prisma.notebookEntry.update({
      where: { id: parseInt(entryId) },
      data: updateData,
    });

    res.json(entry);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Kayıt güncellenemedi.' });
  }
});

export default router;
