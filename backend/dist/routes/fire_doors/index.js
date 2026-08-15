"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const settings_1 = __importDefault(require("./settings"));
const doors_1 = __importDefault(require("./doors"));
const inspections_1 = __importDefault(require("./inspections"));
const router = (0, express_1.Router)();
router.use('/settings', settings_1.default);
router.use('/doors', doors_1.default);
router.use('/', inspections_1.default); // since inspections are mapped under /doors/:doorId/inspections
exports.default = router;
