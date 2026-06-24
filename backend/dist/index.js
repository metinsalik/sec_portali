"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
// Routes
const auth_1 = __importDefault(require("./routes/auth"));
const settings_1 = __importDefault(require("./routes/settings"));
const hazmat_kit_items_1 = __importDefault(require("./routes/settings/hazmat-kit-items"));
const panel_1 = __importDefault(require("./routes/panel"));
const operations_1 = __importDefault(require("./routes/operations"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const notebooks_1 = __importDefault(require("./routes/notebooks"));
const incidents_1 = __importDefault(require("./routes/incidents"));
const workflow_1 = __importDefault(require("./routes/workflow"));
const risks_1 = __importDefault(require("./routes/risks"));
const hazmat_1 = __importDefault(require("./routes/hazmat"));
const fire_equipment_1 = __importDefault(require("./routes/fire_equipment"));
const build_management_1 = __importDefault(require("./routes/build_management"));
// Middleware
const errorHandler_1 = require("./middleware/errorHandler");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3005;
app.use(express_1.default.json({ limit: '500mb' }));
app.use(express_1.default.urlencoded({ limit: '500mb', extended: true }));
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
}));
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
const build_settings_1 = __importDefault(require("./routes/build_settings"));
// Servis statik dosyalar (Yüklemeler için)
app.use('/uploads', express_1.default.static('uploads'));
// Route Entegrasyonu
app.use('/api/auth', auth_1.default);
app.use('/api/settings', settings_1.default);
app.use('/api/settings/hazmat-kit-items', hazmat_kit_items_1.default);
app.use('/api/panel', panel_1.default);
app.use('/api/operations', operations_1.default);
app.use('/api/notifications', notifications_1.default);
app.use('/api/notebooks', notebooks_1.default);
app.use('/api/incidents', incidents_1.default);
app.use('/api/workflow', workflow_1.default);
app.use('/api/risks', risks_1.default);
app.use('/api/hazmat', hazmat_1.default);
app.use('/api/fire-equipment', fire_equipment_1.default);
app.use('/api/build-management', build_management_1.default);
app.use('/api/build-management/settings', build_settings_1.default);
// Sağlık kontrolü
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// 404 handler - tüm route'ların sonunda
app.use(errorHandler_1.notFoundHandler);
// Global error handler - en son middleware
app.use(errorHandler_1.errorHandler);
// Start Server
app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Backend server running on http://0.0.0.0:${PORT}`);
});
