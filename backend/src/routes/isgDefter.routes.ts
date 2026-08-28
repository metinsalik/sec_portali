import { Router } from 'express';
import { isgDefterService } from '../services/isgDefter.service';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import multer from 'multer';

import path from 'path';
import fs from 'fs';

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ storage: storage });

const router = Router();

// Middleware to check if user has access to ISG_DEFTER module
const requireModuleAccess = (req: any, res: any, next: any) => {
  const user = req.user;
  const hasAccess = user?.roles?.includes('admin') || 
                    user?.roles?.includes('management') || 
                    user?.modules?.some((m: any) => m.code === 'ISG_DEFTER');
  
  if (!hasAccess) {
    return res.status(403).json({ error: 'Bu modüle erişim yetkiniz yok.' });
  }
  next();
};

const requireAdmin = (req: any, res: any, next: any) => {
  const user = req.user;
  if (!user?.roles?.includes('admin') && !user?.roles?.includes('management')) {
    return res.status(403).json({ error: 'Bu işlem için yönetici yetkisi gereklidir.' });
  }
  next();
};

router.use(authMiddleware, requireModuleAccess);

// === DASHBOARD & PAGES ===
router.get('/facilities/:facilityId/dashboard', async (req, res) => {
  try {
    const stats = await isgDefterService.getDashboardStats(req.params.facilityId, req.query);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Dashboard verileri alınamadı.' });
  }
});

router.get('/facilities/:facilityId/pages', async (req, res) => {
  try {
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;
    const pages = await isgDefterService.getPages(req.params.facilityId, year);
    res.json(pages);
  } catch (error) {
    res.status(500).json({ error: 'Kayıtlar alınamadı.' });
  }
});

router.post('/pages', async (req, res) => {
  try {
    const page = await isgDefterService.createPage(req.body);
    res.json(page);
  } catch (error) {
    res.status(500).json({ error: 'Defter sayfası oluşturulamadı.' });
  }
});

router.put('/facilities/:facilityId/pages/:id', requireAdmin, upload.single('file'), async (req: any, res: any) => {
  try {
    const data = { ...req.body };
    if (req.file) {
      data.documentUrl = `/uploads/${req.file.filename}`;
    }
    const page = await isgDefterService.updatePage(parseInt(req.params.id), data);
    res.json(page);
  } catch (error) {
    res.status(500).json({ error: 'Defter sayfası güncellenemedi.' });
  }
});

// === ITEMS ===
router.post('/items', async (req, res) => {
  try {
    const item = await isgDefterService.createItem(req.body);
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Tespit/öneri oluşturulamadı.' });
  }
});

router.put('/items/:id', async (req, res) => {
  try {
    const item = await isgDefterService.updateItem(parseInt(req.params.id), req.body);
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Tespit/öneri güncellenemedi.' });
  }
});

router.post('/actions', upload.single('file'), async (req: any, res: any) => {
  try {
    const data = { ...req.body };
    if (req.file) {
      data.proofUrl = `/uploads/${req.file.filename}`;
    }
    
    // Convert status to correctly format if it comes as string
    if (data.notebookItemId) data.notebookItemId = parseInt(data.notebookItemId);
    
    const action = await isgDefterService.createItemAction({
      ...data,
      createdBy: req.user?.fullName || req.user?.username
    });
    res.json(action);
  } catch (error) {
    res.status(500).json({ error: 'Aksiyon oluşturulamadı.' });
  }
});

// === COMMENTS ===
router.get('/items/:id/comments', async (req, res) => {
  try {
    const comments = await isgDefterService.getComments(parseInt(req.params.id));
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: 'Yorumlar alınamadı.' });
  }
});

router.post('/items/:id/comments', async (req: any, res: any) => {
  try {
    const comment = await isgDefterService.createComment({
      ...req.body,
      notebookItemId: parseInt(req.params.id),
      authorId: req.user?.id || req.user?.username,
      authorName: req.user?.fullName || req.user?.username || 'Kullanıcı'
    });
    res.json(comment);
  } catch (error) {
    res.status(500).json({ error: 'Yorum oluşturulamadı.' });
  }
});

// === SETTINGS ===
router.get('/facilities/:facilityId/settings', async (req, res) => {
  try {
    const settings = await isgDefterService.getSettings(req.params.facilityId);
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Ayarlar alınamadı.' });
  }
});

router.put('/facilities/:facilityId/settings', requireAdmin, async (req, res) => {
  try {
    const settings = await isgDefterService.updateSettings(req.params.facilityId, req.body);
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Ayarlar güncellenemedi.' });
  }
});

// === EXCEL IMPORT ===
router.post('/facilities/:facilityId/import', requireAdmin, upload.single('file'), async (req: any, res: any) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Dosya yüklenmedi.' });
    }
    const year = req.body.year ? parseInt(req.body.year) : new Date().getFullYear();
    const results = await isgDefterService.importExcel(req.params.facilityId, year, req.file.path);
    res.json({ success: true, importedCount: results.length });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ error: 'İçe aktarma sırasında hata oluştu.' });
  }
});

export default router;
