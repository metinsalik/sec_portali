"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
router.use(auth_1.authMiddleware);
// GET /api/safety-management/fire-doors/doors
router.get('/', async (req, res) => {
    try {
        const { facilityId } = req.query;
        if (!facilityId) {
            return res.status(400).json({ error: 'facilityId is required' });
        }
        const doors = await prisma.fireDoor.findMany({
            where: { facilityId: String(facilityId) },
            include: {
                location: {
                    include: {
                        facilityBuilding: true
                    }
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(doors);
    }
    catch (error) {
        console.error('Error fetching doors:', error);
        res.status(500).json({ error: 'Failed to fetch doors' });
    }
});
// GET /api/safety-management/fire-doors/doors/:id
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const door = await prisma.fireDoor.findUnique({
            where: { id },
            include: {
                location: true,
            }
        });
        if (!door) {
            return res.status(404).json({ error: 'Door not found' });
        }
        res.json(door);
    }
    catch (error) {
        console.error('Error fetching door:', error);
        res.status(500).json({ error: 'Failed to fetch door' });
    }
});
// POST /api/safety-management/fire-doors/doors
router.post('/', async (req, res) => {
    try {
        const { facilityId, qrCode, doorNo, locationId, properties, status } = req.body;
        if (!facilityId) {
            return res.status(400).json({ error: 'facilityId is required' });
        }
        const door = await prisma.fireDoor.create({
            data: {
                facilityId,
                qrCode,
                doorNo,
                locationId,
                properties: properties ?? {},
                status: status ?? 'AKTIF',
            },
        });
        res.status(201).json(door);
    }
    catch (error) {
        console.error('Error creating door:', error);
        res.status(500).json({ error: 'Failed to create door' });
    }
});
// PUT /api/safety-management/fire-doors/doors/:id
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { qrCode, doorNo, locationId, properties, status } = req.body;
        const door = await prisma.fireDoor.update({
            where: { id },
            data: {
                qrCode,
                doorNo,
                locationId,
                properties,
                status,
            },
        });
        res.json(door);
    }
    catch (error) {
        console.error('Error updating door:', error);
        res.status(500).json({ error: 'Failed to update door' });
    }
});
// DELETE /api/safety-management/fire-doors/doors/:id
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.fireDoor.delete({ where: { id } });
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting door:', error);
        res.status(500).json({ error: 'Failed to delete door' });
    }
});
exports.default = router;
