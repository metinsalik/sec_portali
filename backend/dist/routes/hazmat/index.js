"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const materials_1 = __importDefault(require("./materials"));
const settings_1 = __importDefault(require("./settings"));
const upload_1 = __importDefault(require("./upload"));
const inventory_1 = __importDefault(require("./inventory"));
const spill_kits_1 = __importDefault(require("./spill-kits"));
const router = express_1.default.Router();
router.use('/materials', materials_1.default);
router.use('/settings', settings_1.default);
router.use('/upload', upload_1.default);
router.use('/inventory', inventory_1.default);
router.use('/spill-kits', spill_kits_1.default);
exports.default = router;
