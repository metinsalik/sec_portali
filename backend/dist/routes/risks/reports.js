"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../../middleware/auth");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const router = express_1.default.Router();
// Helper to check facility access
async function checkFacilityAccess(req, facilityId) {
    const user = req.user;
    if (!user)
        return false;
    if (user.isAdmin || user.isManagement)
        return true;
    const access = await prisma.userFacility.findUnique({
        where: {
            username_facilityId: {
                username: user.username,
                facilityId: facilityId
            }
        }
    });
    return !!access;
}
// GET /api/risks/reports
router.get('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const { facilityId, startDate, endDate, statuses } = req.query;
        if (!facilityId) {
            return res.status(400).json({ error: 'facilityId zorunludur.' });
        }
        const hasAccess = await checkFacilityAccess(req, facilityId);
        if (!hasAccess) {
            return res.status(403).json({ error: 'Bu tesis için yetkiniz yok.' });
        }
        const whereClause = {
            department: { facilityId },
        };
        if (startDate || endDate) {
            const dateFilter = {};
            if (startDate)
                dateFilter.gte = new Date(startDate);
            if (endDate)
                dateFilter.lte = new Date(endDate);
            whereClause.detectionDate = dateFilter;
        }
        if (statuses) {
            const statusList = statuses.split(',');
            if (statusList.length > 0) {
                whereClause.status = { in: statusList };
            }
        }
        const risks = await prisma.riskLifecycle.findMany({
            where: whereClause,
            include: {
                department: true,
            },
            orderBy: { detectionDate: 'desc' }
        });
        // Analiz için gruplama
        const byStatus = risks.reduce((acc, risk) => {
            acc[risk.status] = (acc[risk.status] || 0) + 1;
            return acc;
        }, {});
        const byLevel = risks.reduce((acc, risk) => {
            const level = risk.finalLevel || risk.initialLevel || 'Bilinmiyor';
            acc[level] = (acc[level] || 0) + 1;
            return acc;
        }, {});
        const byDepartment = risks.reduce((acc, risk) => {
            const deptName = risk.department?.name || 'Bilinmiyor';
            acc[deptName] = (acc[deptName] || 0) + 1;
            return acc;
        }, {});
        res.json({
            risks,
            analysis: {
                byStatus: Object.keys(byStatus).map(name => ({ name, value: byStatus[name] })),
                byLevel: Object.keys(byLevel).map(name => ({ name, value: byLevel[name] })),
                byDepartment: Object.keys(byDepartment).map(name => ({ name, value: byDepartment[name] }))
            }
        });
    }
    catch (error) {
        console.error('Risk reports fetch error:', error);
        res.status(500).json({ error: 'Rapor alınırken hata oluştu.' });
    }
});
exports.default = router;
