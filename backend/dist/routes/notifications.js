"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Get user notifications
router.get('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const notifications = await prisma.notification.findMany({
            where: {
                OR: [
                    { username: req.user?.username },
                    {
                        targetRole: {
                            in: req.user?.roles || []
                        }
                    },
                    {
                        AND: [
                            { username: null },
                            { targetRole: null }
                        ]
                    }
                ]
            },
            orderBy: { createdAt: 'desc' },
            take: 50
        });
        res.json(notifications);
    }
    catch (error) {
        res.status(500).json({ error: 'Bildirimler alınamadı' });
    }
});
// Mark notification as read
router.put('/:id/read', auth_1.authMiddleware, async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        await prisma.notification.update({
            where: { id },
            data: { isRead: true }
        });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Bildirim güncellenemedi' });
    }
});
// Mark all as read
router.put('/read-all', auth_1.authMiddleware, async (req, res) => {
    try {
        await prisma.notification.updateMany({
            where: {
                OR: [
                    { username: req.user?.username },
                    {
                        targetRole: {
                            in: req.user?.roles.map(r => r.role.name) || []
                        }
                    }
                ],
                isRead: false
            },
            data: { isRead: true }
        });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Bildirimler güncellenemedi' });
    }
});
exports.default = router;
