"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireWorkflowRole = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Modül rol hiyerarşisi
const ROLE_HIERARCHY = {
    DIREKTOR: 5,
    MUDUR: 4,
    SORUMLU: 3,
    UYE: 2,
    IZLEYICI: 1
};
const requireWorkflowRole = (allowedRoles) => {
    return async (req, res, next) => {
        try {
            const username = req.user?.username;
            if (!username) {
                return res.status(401).json({ error: 'Yetkisiz erişim' });
            }
            const userRole = await prisma.workflowUserRole.findUnique({
                where: { userId: username },
            });
            if (!userRole) {
                return res.status(403).json({ error: 'İş Takip modülü rolünüz bulunmamaktadır.' });
            }
            if (allowedRoles.length > 0 && !allowedRoles.includes(userRole.moduleRole)) {
                return res.status(403).json({ error: 'Bu işlem için modül yetkiniz yetersiz.' });
            }
            if (req.user)
                req.user.workflowRole = userRole.moduleRole;
            next();
        }
        catch (error) {
            console.error('Workflow Auth Error:', error);
            res.status(500).json({ error: 'Yetki kontrolü sırasında bir hata oluştu.' });
        }
    };
};
exports.requireWorkflowRole = requireWorkflowRole;
