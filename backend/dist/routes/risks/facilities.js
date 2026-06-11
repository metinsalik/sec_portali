"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const auth_1 = require("../../middleware/auth");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
// GET /api/risks/facilities
// Admin/Management → tüm tesisler; Specialist → atandığı tesisler
router.get('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const user = req.user;
        const isAdminOrMgmt = user?.isAdmin || user?.isManagement;
        let facilities;
        if (isAdminOrMgmt) {
            facilities = await prisma.facility.findMany({
                where: { isActive: true },
                select: {
                    id: true,
                    name: true,
                    shortName: true,
                    city: true,
                    dangerClass: true,
                    riskDepartments: {
                        select: {
                            id: true,
                            name: true,
                            _count: { select: { risks: true } },
                        },
                    },
                },
                orderBy: { name: 'asc' },
            });
        }
        else {
            // Uzman: sadece atandığı tesisler
            const userFacilities = await prisma.userFacility.findMany({
                where: { username: user.username },
                select: { facilityId: true },
            });
            const facilityIds = userFacilities.map((f) => f.facilityId);
            facilities = await prisma.facility.findMany({
                where: { id: { in: facilityIds }, isActive: true },
                select: {
                    id: true,
                    name: true,
                    shortName: true,
                    city: true,
                    dangerClass: true,
                    riskDepartments: {
                        select: {
                            id: true,
                            name: true,
                            _count: { select: { risks: true } },
                        },
                    },
                },
                orderBy: { name: 'asc' },
            });
        }
        // Her tesis için risk özeti hesapla
        const withStats = await Promise.all(facilities.map(async (f) => {
            const stats = await prisma.riskLifecycle.groupBy({
                by: ['status'],
                where: {
                    department: { facilityId: f.id },
                },
                _count: { id: true },
            });
            const statusMap = {};
            stats.forEach((s) => {
                statusMap[s.status] = s._count.id;
            });
            return {
                ...f,
                riskStats: {
                    total: Object.values(statusMap).reduce((a, b) => a + b, 0),
                    acik: statusMap['ACIK_TEHLIKE'] || 0,
                    mudahale: statusMap['ILK_MUDAHALE_EDILDI'] || 0,
                    takip: statusMap['TAKIP_SURECINDE'] || 0,
                    kapali: statusMap['KAPATILDI_GUVENLI'] || 0,
                },
            };
        }));
        res.json(withStats);
    }
    catch (error) {
        console.error('Risk facilities error:', error);
        res.status(500).json({ error: 'Tesisler alınamadı.' });
    }
});
exports.default = router;
