import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authMiddleware } from '../../middleware/auth';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(process.cwd(), 'uploads', 'hazmat');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|svg|pdf/;
    const ok = allowed.test(path.extname(file.originalname).toLowerCase()) &&
      (allowed.test(file.mimetype.split('/')[1]) || file.mimetype === 'image/svg+xml' || file.mimetype === 'application/pdf');
    if (ok) cb(null, true);
    else cb(new Error('Sadece resim dosyaları (jpg, png vb.) veya PDF dosyaları yüklenebilir.'));
  },
});

// POST /api/hazmat/upload
router.post('/', authMiddleware, upload.single('file'), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Dosya bulunamadı.' });
  }
  const filePath = `/uploads/hazmat/${req.file.filename}`;
  res.json({ url: filePath });
});

export default router;
