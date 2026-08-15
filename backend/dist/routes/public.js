"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const router = (0, express_1.Router)();
// GET /api/public/isg-kurul/dashboard - Get all data for the public dashboard
router.get('/isg-kurul/dashboard', async (req, res) => {
    try {
        const { facilityId } = req.query;
        const whereClause = {};
        if (facilityId && facilityId !== 'all') {
            whereClause.facilityId = String(facilityId);
        }
        const meetings = await prisma.ohsBoardMeeting.findMany({
            where: whereClause,
            include: {
                decisions: {
                    include: {
                        actions: {
                            orderBy: { createdAt: 'desc' }
                        }
                    }
                }
            },
            orderBy: { meetingDate: 'desc' }
        });
        const categories = await prisma.category.findMany();
        const departments = await prisma.department.findMany();
        const facilities = await prisma.facility.findMany();
        res.json({
            meetings,
            categories,
            departments,
            facilities
        });
    }
    catch (error) {
        console.error('Error fetching public dashboard data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
