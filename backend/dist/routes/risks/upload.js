"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const auth_1 = require("../../middleware/auth");
const router = express_1.default.Router();
const storage = multer_1.default.diskStorage({
    destination: (req, _file, cb) => {
        // Tesis bazlı klasörleme: facilityId sorgu veya body'den alınır
        const facilityId = req.query.facilityId || req.body?.facilityId || 'common';
        // Güvenli klasör adı (özel karakterleri temizle)
        const sanitizedFacility = facilityId.replace(/[^a-zA-Z0-9_-]/g, '_');
        const dir = path_1.default.join(process.cwd(), 'uploads', 'risks', sanitizedFacility);
        fs_1.default.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (_req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${unique}${path_1.default.extname(file.originalname)}`);
    },
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB (Görsel ve Dokümanlar için)
    fileFilter: (_req, file, cb) => {
        // Resim ve yaygın doküman türlerine (PDF, DOCX, XLSX, TXT) izin ver
        const allowed = /jpeg|jpg|png|gif|webp|pdf|docx|doc|xlsx|xls|txt/;
        const ext = path_1.default.extname(file.originalname).toLowerCase().replace('.', '');
        if (allowed.test(ext)) {
            cb(null, true);
        }
        else {
            cb(new Error('Desteklenmeyen dosya formatı.'));
        }
    },
});
// POST /api/risks/upload?facilityId=XYZ
router.post('/', auth_1.authMiddleware, upload.single('file'), (req, res) => {
    if (!req.file)
        return res.status(400).json({ error: 'Dosya bulunamadı.' });
    const facilityId = req.query.facilityId || req.body?.facilityId || 'common';
    const sanitizedFacility = facilityId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filePath = `/uploads/risks/${sanitizedFacility}/${req.file.filename}`;
    res.json({
        url: filePath,
        filename: req.file.originalname,
        size: req.file.size
    });
});
exports.default = router;
