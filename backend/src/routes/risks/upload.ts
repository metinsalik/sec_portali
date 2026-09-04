import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authMiddleware } from '../../middleware/auth';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    // Tesis bazlı klasörleme: facilityId sorgu veya body'den alınır
    const facilityId = (req.query.facilityId as string) || (req.body?.facilityId as string) || 'common';
    // Güvenli klasör adı (özel karakterleri temizle)
    const sanitizedFacility = facilityId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const dir = path.join(process.cwd(), 'uploads', 'risks', sanitizedFacility);
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
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB (Görsel ve Dokümanlar için)
  fileFilter: (_req, file, cb) => {
    // Resim ve yaygın doküman türlerine (PDF, DOCX, XLSX, TXT) izin ver
    const allowed = /jpeg|jpg|png|gif|webp|pdf|docx|doc|xlsx|xls|txt/;
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    if (allowed.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Desteklenmeyen dosya formatı.'));
    }
  },
});

// POST /api/risks/upload?facilityId=XYZ
router.post('/', authMiddleware, upload.single('file'), (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'Dosya bulunamadı.' });
  
  const facilityId = (req.query.facilityId as string) || (req.body?.facilityId as string) || 'common';
  const sanitizedFacility = facilityId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filePath = `/uploads/risks/${sanitizedFacility}/${req.file.filename}`;
  
  res.json({ 
    url: filePath,
    filename: req.file.originalname,
    size: req.file.size
  });
});

export default router;
