"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireWorkflowRole = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const ROLE_HIERARCHY = {
    ADMIN: 4,
    MANAGER: 3,
    MEMBER: 2,
    VIEWER: 1
};
const requireWorkflowRole = (allowedRoles) => {
    return async (req, res, next) => {
        try {
            const username = req.user?.username;
            if (!username) {
                return res.status(401).json({ error: 'Yetkisiz erişim' });
            }
            // Sistem adminleri her türlü yetkiye sahiptir
            if (req.user?.isAdmin) {
                if (req.user)
                    req.user.workflowRole = 'ADMIN';
                return next();
            }
            const userRole = await prisma.workflowUserRole.findUnique({
                where: { userId: username },
            });
            const role = userRole?.moduleRole || 'VIEWER';
            if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
                return res.status(403).json({ error: 'Bu işlem için modül yetkiniz yetersiz.' });
            }
            if (req.user)
                req.user.workflowRole = role;
            next();
        }
        catch (error) {
            console.error('Workflow Auth Error:', error);
            res.status(500).json({ error: 'Yetki kontrolü sırasında bir hata oluştu.' });
        }
    };
};
exports.requireWorkflowRole = requireWorkflowRole;
