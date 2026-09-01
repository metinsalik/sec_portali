"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Get all locations for a facility
router.get('/', auth_1.authMiddleware, async (req, res) => {
    const { facilityId } = req.query;
    if (!facilityId)
        return res.status(400).json({ error: 'facilityId zorunludur' });
    try {
        const locations = await prisma.facilityLocation.findMany({
            where: { facilityId, isActive: true },
            orderBy: [
                { building: 'asc' },
                { floor: 'asc' },
                { name: 'asc' },
                { description: 'asc' }
            ]
        });
        res.json(locations);
    }
    catch (err) {
        res.status(500).json({ error: 'Lokasyonlar alınamadı.' });
    }
});
// Create location
router.post('/', auth_1.authMiddleware, async (req, res) => {
    const { facilityId, building, floor, department, name, description, type } = req.body;
    if (!facilityId)
        return res.status(400).json({ error: 'facilityId zorunludur' });
    try {
        const location = await prisma.facilityLocation.create({
            data: {
                facilityId,
                building,
                floor,
                department,
                name: name || 'Yeni Lokasyon',
                description,
                type: type || 'DEPARTMAN'
            }
        });
        res.status(201).json(location);
    }
    catch (err) {
        console.error('Lokasyon ekleme hatası:', err);
        res.status(500).json({ error: err.message || 'Lokasyon eklenemedi.' });
    }
});
// Rename node (bulk update)
router.post('/rename-node', auth_1.authMiddleware, async (req, res) => {
    const { facilityId, level, oldValue, newValue, parentBuilding, parentFloor } = req.body;
    if (!facilityId)
        return res.status(400).json({ error: 'facilityId zorunludur' });
    if (!newValue || newValue.trim() === '')
        return res.status(400).json({ error: 'Yeni isim boş olamaz.' });
    try {
        let whereClause = { facilityId };
        let dataClause = {};
        const cleanOld = oldValue.startsWith('Belirtilmemiş') ? '' : oldValue;
        const cleanPB = parentBuilding && parentBuilding.startsWith('Belirtilmemiş') ? '' : parentBuilding;
        const cleanPF = parentFloor && parentFloor.startsWith('Belirtilmemiş') ? '' : parentFloor;
        if (level === 'building') {
            whereClause.building = cleanOld;
            dataClause.building = newValue;
        }
        else if (level === 'floor') {
            whereClause.building = cleanPB;
            whereClause.floor = cleanOld;
            dataClause.floor = newValue;
        }
        else if (level === 'department') {
            whereClause.building = cleanPB;
            whereClause.floor = cleanPF;
            whereClause.department = cleanOld;
            dataClause.department = newValue;
        }
        else if (level === 'name') {
            whereClause.building = cleanPB;
            whereClause.floor = cleanPF;
            whereClause.name = cleanOld;
            dataClause.name = newValue;
        }
        else {
            return res.status(400).json({ error: 'Geçersiz seviye.' });
        }
        await prisma.facilityLocation.updateMany({
            where: whereClause,
            data: dataClause
        });
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ error: 'İsim güncellenemedi.' });
    }
});
// Delete node (bulk delete / clear)
router.post('/delete-node', auth_1.authMiddleware, async (req, res) => {
    const { facilityId, level, value, parentBuilding, parentFloor } = req.body;
    if (!facilityId)
        return res.status(400).json({ error: 'facilityId zorunludur' });
    try {
        let whereClause = { facilityId };
        let dataClause = {};
        const cleanVal = value.startsWith('Belirtilmemiş') ? '' : value;
        const cleanPB = parentBuilding && parentBuilding.startsWith('Belirtilmemiş') ? '' : parentBuilding;
        const cleanPF = parentFloor && parentFloor.startsWith('Belirtilmemiş') ? '' : parentFloor;
        if (level === 'building') {
            whereClause.building = cleanVal;
            dataClause.building = '';
        }
        else if (level === 'floor') {
            whereClause.building = cleanPB;
            whereClause.floor = cleanVal;
            dataClause.floor = '';
        }
        else if (level === 'department') {
            whereClause.building = cleanPB;
            whereClause.floor = cleanPF;
            whereClause.department = cleanVal;
            dataClause.department = '';
        }
        else {
            return res.status(400).json({ error: 'Geçersiz seviye.' });
        }
        await prisma.facilityLocation.updateMany({
            where: whereClause,
            data: dataClause
        });
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ error: 'Düğüm silinemedi.' });
    }
});
// Single location ops
router.put('/:id', auth_1.authMiddleware, async (req, res) => {
    const { building, floor, department, name, description, type } = req.body;
    try {
        const location = await prisma.facilityLocation.update({
            where: { id: req.params.id },
            data: { building, floor, department, name, description, type }
        });
        res.json(location);
    }
    catch (err) {
        res.status(500).json({ error: 'Lokasyon güncellenemedi.' });
    }
});
router.delete('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        // Soft delete
        await prisma.facilityLocation.update({
            where: { id: req.params.id },
            data: { isActive: false }
        });
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ error: 'Lokasyon silinemedi.' });
    }
});
exports.default = router;
