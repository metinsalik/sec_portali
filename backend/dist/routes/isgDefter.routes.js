"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const isgDefter_service_1 = require("../services/isgDefter.service");
const auth_1 = require("../middleware/auth");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Ensure uploads directory exists
const uploadDir = path_1.default.join(process.cwd(), 'uploads');
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const ext = path_1.default.extname(file.originalname);
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});
const upload = (0, multer_1.default)({ storage: storage });
const router = (0, express_1.Router)();
// Middleware to check if user has access to ISG_DEFTER module
const requireModuleAccess = (req, res, next) => {
    const user = req.user;
    const hasAccess = user?.roles?.includes('admin') ||
        user?.roles?.includes('management') ||
        user?.modules?.includes('ISG_DEFTER');
    if (!hasAccess) {
        return res.status(403).json({ error: 'Bu modüle erişim yetkiniz yok.' });
    }
    next();
};
const requireAdmin = (req, res, next) => {
    const user = req.user;
    if (!user?.roles?.includes('admin') && !user?.roles?.includes('management')) {
        return res.status(403).json({ error: 'Bu işlem için yönetici yetkisi gereklidir.' });
    }
    next();
};
router.use(auth_1.authMiddleware, requireModuleAccess);
// === DASHBOARD & PAGES ===
router.get('/facilities/:facilityId/dashboard', async (req, res) => {
    try {
        const stats = await isgDefter_service_1.isgDefterService.getDashboardStats(req.params.facilityId, req.query);
        res.json(stats);
    }
    catch (error) {
        res.status(500).json({ error: 'Dashboard verileri alınamadı.' });
    }
});
router.get('/facilities/:facilityId/pages', async (req, res) => {
    try {
        const year = req.query.year ? parseInt(req.query.year) : undefined;
        const pages = await isgDefter_service_1.isgDefterService.getPages(req.params.facilityId, year);
        res.json(pages);
    }
    catch (error) {
        res.status(500).json({ error: 'Kayıtlar alınamadı.' });
    }
});
router.post('/pages', async (req, res) => {
    try {
        const page = await isgDefter_service_1.isgDefterService.createPage(req.body);
        res.json(page);
    }
    catch (error) {
        res.status(500).json({ error: 'Defter sayfası oluşturulamadı.' });
    }
});
router.put('/facilities/:facilityId/pages/:id', upload.single('file'), async (req, res) => {
    try {
        const data = { ...req.body };
        if (req.file) {
            data.documentUrl = `/uploads/${req.file.filename}`;
        }
        const page = await isgDefter_service_1.isgDefterService.updatePage(parseInt(req.params.id), data);
        res.json(page);
    }
    catch (error) {
        res.status(500).json({ error: 'Defter sayfası güncellenemedi.' });
    }
});
router.delete('/pages/:id', requireAdmin, async (req, res) => {
    try {
        await isgDefter_service_1.isgDefterService.deletePage(parseInt(req.params.id));
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Defter sayfası silinemedi.' });
    }
});
// === ITEMS ===
router.post('/items', async (req, res) => {
    try {
        const item = await isgDefter_service_1.isgDefterService.createItem(req.body);
        res.json(item);
    }
    catch (error) {
        res.status(500).json({ error: 'Tespit/öneri oluşturulamadı.' });
    }
});
router.put('/items/:id', async (req, res) => {
    try {
        const item = await isgDefter_service_1.isgDefterService.updateItem(parseInt(req.params.id), req.body);
        res.json(item);
    }
    catch (error) {
        res.status(500).json({ error: 'Tespit/öneri güncellenemedi.' });
    }
});
router.delete('/items/:id', requireAdmin, async (req, res) => {
    try {
        await isgDefter_service_1.isgDefterService.deleteItem(parseInt(req.params.id));
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Tespit/öneri silinemedi.' });
    }
});
router.post('/actions', upload.single('file'), async (req, res) => {
    try {
        const data = { ...req.body };
        if (req.file) {
            data.proofUrl = `/uploads/${req.file.filename}`;
        }
        // Convert status to correctly format if it comes as string
        if (data.notebookItemId)
            data.notebookItemId = parseInt(data.notebookItemId);
        const action = await isgDefter_service_1.isgDefterService.createItemAction({
            ...data,
            createdBy: req.user?.fullName || req.user?.username
        });
        res.json(action);
    }
    catch (error) {
        res.status(500).json({ error: 'Aksiyon oluşturulamadı.' });
    }
});
// === COMMENTS ===
router.get('/items/:id/comments', async (req, res) => {
    try {
        const comments = await isgDefter_service_1.isgDefterService.getComments(parseInt(req.params.id));
        res.json(comments);
    }
    catch (error) {
        res.status(500).json({ error: 'Yorumlar alınamadı.' });
    }
});
router.post('/items/:id/comments', async (req, res) => {
    try {
        const comment = await isgDefter_service_1.isgDefterService.createComment({
            ...req.body,
            notebookItemId: parseInt(req.params.id),
            authorId: req.user?.id || req.user?.username,
            authorName: req.user?.fullName || req.user?.username || 'Kullanıcı'
        });
        res.json(comment);
    }
    catch (error) {
        res.status(500).json({ error: 'Yorum oluşturulamadı.' });
    }
});
// === SETTINGS ===
router.get('/facilities/:facilityId/settings', async (req, res) => {
    try {
        const settings = await isgDefter_service_1.isgDefterService.getSettings(req.params.facilityId);
        res.json(settings);
    }
    catch (error) {
        res.status(500).json({ error: 'Ayarlar alınamadı.' });
    }
});
router.put('/facilities/:facilityId/settings', requireAdmin, async (req, res) => {
    try {
        const settings = await isgDefter_service_1.isgDefterService.updateSettings(req.params.facilityId, req.body);
        res.json(settings);
    }
    catch (error) {
        res.status(500).json({ error: 'Ayarlar güncellenemedi.' });
    }
});
// === EXCEL IMPORT ===
router.post('/facilities/:facilityId/import', requireAdmin, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Dosya yüklenmedi.' });
        }
        const year = req.body.year ? parseInt(req.body.year) : new Date().getFullYear();
        const results = await isgDefter_service_1.isgDefterService.importExcel(req.params.facilityId, year, req.file.path);
        res.json({ success: true, importedCount: results.length });
    }
    catch (error) {
        console.error('Import error:', error);
        const message = error instanceof Error ? error.message : 'İçe aktarma sırasında hata oluştu.';
        res.status(500).json({ error: message });
    }
});
exports.default = router;
