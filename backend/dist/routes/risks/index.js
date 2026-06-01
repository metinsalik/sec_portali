"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const facilities_1 = __importDefault(require("./facilities"));
const departments_1 = __importDefault(require("./departments"));
const lifecycle_1 = __importDefault(require("./lifecycle"));
const upload_1 = __importDefault(require("./upload"));
const settings_1 = __importDefault(require("./settings"));
const router = express_1.default.Router();
router.get('/health', (_req, res) => {
    res.json({ status: 'Risk Lifecycle module is running' });
});
// /api/risks/facilities  → uzmanın tesis listesi + yönetim
router.use('/facilities', facilities_1.default);
// /api/risks/departments → departman (bölüm) yönetimi
router.use('/departments', departments_1.default);
// /api/risks/lifecycle   → risk yaşam döngüsü CRUD + Excel import
router.use('/lifecycle', lifecycle_1.default);
// /api/risks/upload      → fotoğraf yükleme
router.use('/upload', upload_1.default);
// /api/risks/settings    → tesis bazlı risk ayarları (departmanlar, kategoriler, vb.)
router.use('/settings', settings_1.default);
exports.default = router;
