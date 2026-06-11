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
    destination: (_req, _file, cb) => {
        const dir = path_1.default.join(process.cwd(), 'uploads', 'hazmat');
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
    limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
    fileFilter: (_req, file, cb) => {
        const allowed = /jpeg|jpg|png|gif|webp|svg|pdf/;
        const ok = allowed.test(path_1.default.extname(file.originalname).toLowerCase()) &&
            (allowed.test(file.mimetype.split('/')[1]) || file.mimetype === 'image/svg+xml' || file.mimetype === 'application/pdf');
        if (ok)
            cb(null, true);
        else
            cb(new Error('Sadece resim dosyaları (jpg, png vb.) veya PDF dosyaları yüklenebilir.'));
    },
});
// POST /api/hazmat/upload
router.post('/', auth_1.authMiddleware, upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Dosya bulunamadı.' });
    }
    const filePath = `/uploads/hazmat/${req.file.filename}`;
    res.json({ url: filePath });
});
exports.default = router;
