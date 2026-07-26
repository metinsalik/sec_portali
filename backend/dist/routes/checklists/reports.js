"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Get basic report for a facility
router.get('/facility/:facilityId', async (req, res) => {
    try {
        const { facilityId } = req.params;
        const submissions = await prisma.checklistSubmission.findMany({
            where: { facilityId, status: 'TAMAMLANDI' },
            include: {
                template: { select: { title: true } }
            },
            orderBy: { auditDate: 'desc' }
        });
        res.json(submissions);
    }
    catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({ error: 'Failed to fetch reports' });
    }
});
exports.default = router;
