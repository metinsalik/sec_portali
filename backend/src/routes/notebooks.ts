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

// Tesis ve Yıla göre sayfaları ve maddelerini getir
router.get('/:facilityId', async (req: AuthRequest, res: Response) => {
  const { facilityId } = req.params;
  const year = parseInt(req.query.year as string) || new Date().getFullYear();
  const includeArchived = req.query.includeArchived === 'true';

  try {
    const pages = await prisma.notebookPage.findMany({
      where: { 
        facilityId, 
        year,
        ...(includeArchived ? {} : { isArchived: false })
      },
      include: {
        items: {
          include: {
            category: true,
            subCategory: true,
            department: true,
          }
        }
      },
      orderBy: { date: 'desc' },
    });
    res.json(pages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Kayıtlar getirilemedi.' });
  }
});

// Yeni sayfa ve maddeler ekle
router.post('/:facilityId', upload.single('document'), async (req: AuthRequest, res: Response) => {
  const { facilityId } = req.params;
  const { date, items } = req.body;

  try {
    const documentUrl = req.file ? `/${req.file.path}` : null;
    const year = new Date(date).getFullYear();
    const parsedItems = JSON.parse(items || '[]');

    const page = await prisma.notebookPage.create({
      data: {
        facilityId,
        year,
        date: new Date(date),
        documentUrl,
        documentUploadedAt: documentUrl ? new Date() : null,
        status: documentUrl ? 'Tamamlandı' : 'Eksik',
        createdBy: req.user!.username,
        items: {
          create: parsedItems.map((item: any) => ({
            authorType: item.authorType,
            authorName: item.authorName,
            content: item.content,
            categoryId: parseInt(item.categoryId),
            subCategoryId: item.subCategoryId ? parseInt(item.subCategoryId) : null,
            departmentId: parseInt(item.departmentId),
          }))
        }
      },
      include: {
        items: true
      }
    });

    await prisma.activityLog.create({
      data: {
        facilityId,
        username: req.user!.username,
        action: 'Yeni Defter Sayfası Eklendi',
        details: `${new Date(date).toLocaleDateString('tr-TR')} tarihli sayfaya ${parsedItems.length} madde eklendi.`
      }
    });

    res.status(201).json(page);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Kayıt oluşturulamadı: ' + error.message });
  }
});

// Sayfayı ve maddeleri güncelle
router.put('/:facilityId/:pageId', upload.single('document'), async (req: AuthRequest, res: Response) => {
  const { facilityId, pageId } = req.params;
  const { date, items } = req.body;

  try {
    const existingPage = await prisma.notebookPage.findUnique({
      where: { id: parseInt(pageId) }
    });

    if (!existingPage) return res.status(404).json({ error: 'Kayıt bulunamadı.' });

    // Kısıtlama Kontrolleri (Admin değilse)
    if (req.user!.role !== 'ADMIN') {
      if (existingPage.isLocked) return res.status(403).json({ error: 'Bu kayıt kilitlenmiştir.' });
      
      const now = new Date();
      // 15 gün kontrolü (Doküman yüklenmemişse) - Giriş tarihinden itibaren sayılır
      if (!existingPage.documentUrl) {
         const diffTime = Math.abs(now.getTime() - new Date(existingPage.createdAt).getTime());
         const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
         if (diffDays > 15) {
            return res.status(403).json({ error: 'Sisteme giriş tarihinden itibaren 15 günlük yükleme süresi dolduğu için kayıt kilitlenmiştir.' });
         }
      }

      // 24 saat kontrolü (Doküman yüklendikten sonra)
      if (existingPage.documentUploadedAt) {
         const diffTime = Math.abs(now.getTime() - new Date(existingPage.documentUploadedAt).getTime());
         const diffHours = diffTime / (1000 * 60 * 60);
         if (diffHours > 24) {
            return res.status(403).json({ error: 'Doküman yüklendikten sonra 24 saat geçtiği için düzenleme yapılamaz.' });
         }
      }
    }

    const documentUrl = req.file ? `/${req.file.path}` : undefined;
    const parsedItems = JSON.parse(items || '[]');

    const result = await prisma.$transaction(async (tx) => {
      await tx.notebookItem.deleteMany({
        where: { pageId: parseInt(pageId) }
      });

      return await tx.notebookPage.update({
        where: { id: parseInt(pageId) },
        data: {
          date: date ? new Date(date) : undefined,
          year: date ? new Date(date).getFullYear() : undefined,
          documentUrl,
          documentUploadedAt: (documentUrl && !existingPage.documentUploadedAt) ? new Date() : undefined,
          status: documentUrl ? 'Tamamlandı' : undefined,
          items: {
            create: parsedItems.map((item: any) => ({
              authorType: item.authorType,
              authorName: item.authorName,
              content: item.content,
              categoryId: parseInt(item.categoryId),
              subCategoryId: item.subCategoryId ? parseInt(item.subCategoryId) : null,
              departmentId: parseInt(item.departmentId),
            }))
          }
        },
        include: { items: true }
      });
    });

    await prisma.activityLog.create({
      data: {
        facilityId,
        username: req.user!.username,
        action: 'Defter Sayfası Güncellendi',
        details: `${existingPage.date.toLocaleDateString('tr-TR')} tarihli sayfa güncellendi.`
      }
    });

    res.json(result);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Kayıt güncellenemedi: ' + error.message });
  }
});

// Silme işlemi (Soft Delete)
router.delete('/:facilityId/:pageId', async (req: AuthRequest, res: Response) => {
  const { facilityId, pageId } = req.params;

  try {
    const existingPage = await prisma.notebookPage.findUnique({
      where: { id: parseInt(pageId) }
    });

    if (!existingPage) return res.status(404).json({ error: 'Kayıt bulunamadı.' });

    // Kısıtlama Kontrolleri
    if (req.user!.role !== 'ADMIN') {
      if (existingPage.isLocked) return res.status(403).json({ error: 'Kilitli kayıt silinemez.' });
      
      if (existingPage.documentUploadedAt) {
         const now = new Date();
         const diffTime = Math.abs(now.getTime() - new Date(existingPage.documentUploadedAt).getTime());
         const diffHours = diffTime / (1000 * 60 * 60);
         if (diffHours > 24) {
            return res.status(403).json({ error: 'Doküman yüklendikten sonra 24 saat geçtiği için silinemez.' });
         }
      }
    }

    await prisma.notebookPage.update({
      where: { id: parseInt(pageId) },
      data: { isArchived: true }
    });

    await prisma.activityLog.create({
      data: {
        facilityId,
        username: req.user!.username,
        action: 'Defter Sayfası Silindi',
        details: `${existingPage.date.toLocaleDateString('tr-TR')} tarihli kayıt arşive taşındı.`
      }
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Kayıt silinemedi.' });
  }
});

// Kilidi aç/kapat (Sadece Admin)
router.patch('/:facilityId/:pageId/toggle-lock', async (req: AuthRequest, res: Response) => {
  const { pageId } = req.params;
  if (req.user!.role !== 'ADMIN') return res.status(403).json({ error: 'Yetkiniz yok.' });

  try {
    const page = await prisma.notebookPage.findUnique({ where: { id: parseInt(pageId) } });
    if (!page) return res.status(404).json({ error: 'Kayıt bulunamadı.' });

    const updated = await prisma.notebookPage.update({
      where: { id: parseInt(pageId) },
      data: { isLocked: !page.isLocked }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'İşlem başarısız.' });
  }
});

// Profesyonelleri getir (TitleClass bazlı filtreleme için frontend'e data sağlar)
router.get('/:facilityId/professionals', async (req: AuthRequest, res: Response) => {
  const { facilityId } = req.params;
  try {
    const assignments = await prisma.assignment.findMany({
      where: { facilityId, status: 'Aktif', professionalId: { not: null } },
      include: { professional: true }
    });
    res.json(assignments.map(a => a.professional));
  } catch (error) {
    res.status(500).json({ error: 'Profesyoneller getirilemedi.' });
  }
});

export default router;
