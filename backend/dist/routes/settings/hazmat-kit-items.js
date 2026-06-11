"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
router.get('/', async (req, res) => {
    try {
        const facilityId = req.query.facilityId;
        if (!facilityId) {
            return res.status(400).json({ error: 'facilityId is required' });
        }
        const items = await prisma.hazmatSpillKitMasterItem.findMany({
            where: { facilityId },
            orderBy: { name: 'asc' }
        });
        res.json(items);
    }
    catch (error) {
        console.error('Error fetching master kit items:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/', async (req, res) => {
    try {
        const { facilityId, name, type } = req.body;
        if (!facilityId || !name) {
            return res.status(400).json({ error: 'facilityId and name are required' });
        }
        const item = await prisma.hazmatSpillKitMasterItem.create({
            data: { facilityId, name, type }
        });
        res.json(item);
    }
    catch (error) {
        console.error('Error creating master kit item:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.delete('/:id', async (req, res) => {
    try {
        await prisma.hazmatSpillKitMasterItem.delete({
            where: { id: req.params.id }
        });
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error deleting master kit item:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
