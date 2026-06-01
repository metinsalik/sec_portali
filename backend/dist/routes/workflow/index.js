"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const tasks_1 = __importDefault(require("./tasks"));
// import settingsRoutes from './settings';
const router = express_1.default.Router();
router.get('/health', (req, res) => {
    res.json({ status: 'Workflow module is running' });
});
router.use('/tasks', tasks_1.default);
// router.use('/settings', settingsRoutes);
exports.default = router;
