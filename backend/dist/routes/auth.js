"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
// @ts-ignore
const express_ntlm_1 = __importDefault(require("express-ntlm"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Password-less Login Endpoint (POST)
router.post('/login', async (req, res) => {
    try {
        const { username: inputUsername } = req.body;
        if (!inputUsername) {
            return res.status(400).json({ error: 'Kullanıcı adı gereklidir.' });
        }
        if (process.env.NODE_ENV !== 'development') {
            return res.status(403).json({ error: 'Bu sisteme yalnızca NTLM (Tek Tıkla Giriş) ile erişilebilir. Manuel giriş devre dışıdır.' });
        }
        const username = inputUsername.toLowerCase();
        let user = await prisma.user.findUnique({
            where: { username },
            include: {
                roles: { include: { role: true } },
                facilities: true,
            }
        });
        // Development auto-registration
        if (!user && process.env.NODE_ENV === 'development') {
            console.log(`Development mode: Auto-creating user ${username}`);
            // Ensure 'admin' and 'user' roles exist
            await prisma.role.upsert({ where: { name: 'admin' }, update: {}, create: { name: 'admin' } });
            await prisma.role.upsert({ where: { name: 'user' }, update: {}, create: { name: 'user' } });
            const adminRole = await prisma.role.findUnique({ where: { name: 'admin' } });
            user = await prisma.user.create({
                data: {
                    username,
                    fullName: username.split('.').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
                    roles: {
                        create: {
                            roleId: adminRole.id
                        }
                    }
                },
                include: {
                    roles: { include: { role: true } },
                    facilities: true,
                }
            });
        }
        if (!user) {
            return res.status(401).json({ error: 'Kullanıcı bulunamadı. Lütfen sistem yöneticinizle iletişime geçin.' });
        }
        if (!user.isActive) {
            return res.status(401).json({ error: 'Kullanıcı hesabı pasif durumda.' });
        }
        const payload = {
            username: user.username,
            fullName: user.fullName,
            roles: user.roles.map((r) => r.role.name),
            facilities: user.facilities.map((f) => f.facilityId),
            isAdmin: user.roles.some((r) => r.role.name === 'admin'),
            isManagement: user.roles.some((r) => r.role.name === 'management'),
        };
        const token = jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET || 'secret', {
            expiresIn: (process.env.JWT_EXPIRES_IN || '8h'),
        });
        return res.json({ token, user: payload });
    }
    catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: 'Sunucu hatası.' });
    }
});
// NTLM Login Endpoint (Keep as fallback)
router.get('/login', (0, express_ntlm_1.default)({
    domain: '',
    domaincontroller: ''
}), async (req, res) => {
    try {
        let username = req.ntlm?.UserName;
        if (process.env.NODE_ENV === 'development' && process.env.DEV_USER) {
            username = process.env.DEV_USER;
        }
        if (!username) {
            return res.status(401).json({ error: 'NTLM authentication failed' });
        }
        username = username.toLowerCase();
        const user = await prisma.user.findUnique({
            where: { username },
            include: {
                roles: { include: { role: true } },
                facilities: true,
            }
        });
        if (!user || (!user.isActive && username !== process.env.DEV_USER)) {
            return res.status(401).json({ error: 'Kullanıcı bulunamadı veya pasif durumda.' });
        }
        const payload = {
            username: user.username,
            fullName: user.fullName,
            roles: user.roles.map((r) => r.role.name),
            facilities: user.facilities.map((f) => f.facilityId),
            isAdmin: user.roles.some((r) => r.role.name === 'admin'),
            isManagement: user.roles.some((r) => r.role.name === 'management'),
        };
        const token = jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET || 'secret', {
            expiresIn: (process.env.JWT_EXPIRES_IN || '8h'),
        });
        return res.json({ token, user: payload });
    }
    catch (error) {
        console.error('Auth error:', error);
        return res.status(500).json({ error: 'Sunucu hatası.' });
    }
});
// Profile / Me Endpoint
router.get('/me', auth_1.authMiddleware, (req, res) => {
    res.json({ user: req.user });
});
// Active user count endpoint (authenticated)
router.get('/active-count', auth_1.authMiddleware, async (req, res) => {
    try {
        const count = await prisma.user.count({
            where: { isActive: true }
        });
        res.json({ count });
    }
    catch (error) {
        console.error('Active count error:', error);
        res.status(500).json({ error: 'Kullanıcı sayısı alınamadı.' });
    }
});
exports.default = router;
