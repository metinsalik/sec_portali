"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.managementMiddleware = exports.adminMiddleware = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authMiddleware = (req, res, next) => {
    let authHeader = req.headers.authorization;
    let token = '';
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    }
    else if (req.query.token) {
        token = req.query.token;
    }
    if (!token) {
        return res.status(401).json({ error: 'Yetkilendirme başlığı eksik veya hatalı.' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'secret');
        req.user = decoded;
        next();
    }
    catch (error) {
        return res.status(401).json({ error: 'Geçersiz veya süresi dolmuş token.' });
    }
};
exports.authMiddleware = authMiddleware;
/** Sadece Admin erişimi */
const adminMiddleware = (req, res, next) => {
    if (!req.user || !req.user.isAdmin) {
        return res.status(403).json({ error: 'Bu işlem için yönetici yetkisi gerekiyor.' });
    }
    next();
};
exports.adminMiddleware = adminMiddleware;
/** Admin VEYA Management erişimi */
const managementMiddleware = (req, res, next) => {
    if (!req.user || (!req.user.isAdmin && !req.user.isManagement)) {
        return res.status(403).json({ error: 'Bu işlem için yönetici veya merkez yönetim yetkisi gerekiyor.' });
    }
    next();
};
exports.managementMiddleware = managementMiddleware;
