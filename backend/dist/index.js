"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const cronTasks_1 = require("./jobs/cronTasks");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
// Routes
const auth_1 = __importDefault(require("./routes/auth"));
const settings_1 = __importDefault(require("./routes/settings"));
const telegram_1 = __importDefault(require("./routes/settings/telegram"));
const hazmat_kit_items_1 = __importDefault(require("./routes/settings/hazmat-kit-items"));
const panel_1 = __importDefault(require("./routes/panel"));
const operations_1 = __importDefault(require("./routes/operations"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const notebooks_1 = __importDefault(require("./routes/notebooks"));
const incidents_1 = __importDefault(require("./routes/incidents"));
const workflow_1 = __importDefault(require("./routes/workflow"));
const risks_1 = __importDefault(require("./routes/risks"));
const reports_1 = __importDefault(require("./routes/risks/reports"));
const hazmat_1 = __importDefault(require("./routes/hazmat"));
const fire_equipment_1 = __importDefault(require("./routes/fire_equipment"));
const build_management_1 = __importDefault(require("./routes/build_management"));
const checklists_1 = __importDefault(require("./routes/checklists"));
const ohs_boards_1 = __importDefault(require("./routes/ohs_boards"));
const public_1 = __importDefault(require("./routes/public"));
const fire_doors_1 = __importDefault(require("./routes/fire_doors"));
const isgDefter_routes_1 = __importDefault(require("./routes/isgDefter.routes"));
const elevator_routes_1 = __importDefault(require("./routes/elevator.routes"));
const elevator_settings_routes_1 = __importDefault(require("./routes/elevator-settings.routes"));
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
const bina_turu_1 = __importDefault(require("./routes/bina-turu"));
const renovation_report_1 = __importDefault(require("./routes/renovation_report"));
// Servis statik dosyalar (Yüklemeler için)
app.use('/uploads', express_1.default.static(path_1.default.join(process.cwd(), 'uploads')));
// Route Entegrasyonu
app.use('/api/public', public_1.default);
app.use('/api/auth', auth_1.default);
app.use('/api/settings/telegram', telegram_1.default);
app.use('/api/settings', settings_1.default);
app.use('/api/settings/hazmat-kit-items', hazmat_kit_items_1.default);
app.use('/api/panel', panel_1.default);
app.use('/api/operations', operations_1.default);
app.use('/api/operations/board', ohs_boards_1.default);
app.use('/api/notifications', notifications_1.default);
app.use('/api/notebooks', notebooks_1.default);
app.use('/api/incidents', incidents_1.default);
app.use('/api/workflow', workflow_1.default);
app.use('/api/risks/reports', reports_1.default);
app.use('/api/risks', risks_1.default);
app.use('/api/hazmat', hazmat_1.default);
app.use('/api/fire-equipment', fire_equipment_1.default);
app.use('/api/build-management', build_management_1.default);
app.use('/api/build-management/settings', build_settings_1.default);
app.use('/api/bina-turu', bina_turu_1.default);
app.use('/api/renovation-reports', renovation_report_1.default);
app.use('/api/locations', require('./routes/locations').default);
app.use('/api/checklists', checklists_1.default);
app.use('/api/safety-management/fire-doors', fire_doors_1.default);
app.use('/api/safety-management/isg-defter', isgDefter_routes_1.default);
app.use('/api/safety-management/elevators', elevator_routes_1.default);
app.use('/api/safety-management/elevator-settings', elevator_settings_routes_1.default);
// Sağlık kontrolü
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// 404 handler - tüm route'ların sonunda
app.use(errorHandler_1.notFoundHandler);
// Global error handler - en son middleware
app.use(errorHandler_1.errorHandler);
const telegramService_1 = require("./services/telegramService");
const httpServer = (0, http_1.createServer)(app);
exports.io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: [
            process.env.FRONTEND_URL || '*',
            'http://localhost',
            'http://localhost:3005',
            'http://localhost:5173'
        ],
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
        credentials: true
    }
});
exports.io.on('connection', (socket) => {
    // Join a room specifically for a task
    socket.on('joinTask', (taskId) => {
        socket.join(`task_${taskId}`);
    });
    socket.on('leaveTask', (taskId) => {
        socket.leave(`task_${taskId}`);
    });
});
httpServer.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Backend server running on http://0.0.0.0:${PORT}`);
    (0, telegramService_1.initTelegramBot)(); // Start Telegram bot polling
    (0, cronTasks_1.startCronJobs)();
    const { startChecklistCronJobs } = require('./jobs/checklistCron');
    startChecklistCronJobs();
});
