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
// Units
router.get('/units', auth_1.authMiddleware, async (req, res) => {
    try {
        const units = await prisma.hazmatUnit.findMany({
            orderBy: { name: 'asc' }
        });
        res.json(units);
    }
    catch (error) {
        console.error('Error fetching units:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/units', auth_1.authMiddleware, async (req, res) => {
    const { name, symbol } = req.body;
    if (!name || !symbol)
        return res.status(400).json({ error: 'name and symbol are required' });
    try {
        const unit = await prisma.hazmatUnit.create({
            data: { name, symbol }
        });
        res.status(201).json(unit);
    }
    catch (error) {
        console.error('Error creating unit:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.delete('/units/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        await prisma.hazmatUnit.delete({ where: { id: req.params.id } });
        res.json({ message: 'Unit deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting unit:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Departments
router.get('/departments', auth_1.authMiddleware, async (req, res) => {
    const { facilityId } = req.query;
    if (!facilityId)
        return res.status(400).json({ error: 'facilityId is required' });
    try {
        const departments = await prisma.hazmatDepartment.findMany({
            where: { facilityId: String(facilityId) },
            orderBy: { name: 'asc' }
        });
        res.json(departments);
    }
    catch (error) {
        console.error('Error fetching departments:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/departments', auth_1.authMiddleware, async (req, res) => {
    const { facilityId, name } = req.body;
    if (!facilityId || !name)
        return res.status(400).json({ error: 'facilityId and name are required' });
    try {
        const department = await prisma.hazmatDepartment.create({
            data: { facilityId, name }
        });
        res.status(201).json(department);
    }
    catch (error) {
        console.error('Error creating department:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.delete('/departments/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        await prisma.hazmatDepartment.delete({ where: { id: req.params.id } });
        res.json({ message: 'Department deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting department:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Hazard Labels
router.get('/hazard-labels', auth_1.authMiddleware, async (req, res) => {
    try {
        const labels = await prisma.hazmatHazardLabel.findMany({
            orderBy: { code: 'asc' }
        });
        res.json(labels);
    }
    catch (error) {
        console.error('Error fetching hazard labels:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/hazard-labels', auth_1.authMiddleware, async (req, res) => {
    const { code, name, description, imageUrl } = req.body;
    if (!code || !name)
        return res.status(400).json({ error: 'code and name are required' });
    try {
        const label = await prisma.hazmatHazardLabel.create({
            data: { code, name, description, imageUrl }
        });
        res.status(201).json(label);
    }
    catch (error) {
        console.error('Error creating hazard label:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.put('/hazard-labels/:id', auth_1.authMiddleware, async (req, res) => {
    const { code, name, description, imageUrl } = req.body;
    try {
        const label = await prisma.hazmatHazardLabel.update({
            where: { id: req.params.id },
            data: { code, name, description, imageUrl }
        });
        res.json(label);
    }
    catch (error) {
        console.error('Error updating hazard label:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.delete('/hazard-labels/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        await prisma.hazmatHazardLabel.delete({ where: { id: req.params.id } });
        res.json({ message: 'Label deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting hazard label:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// ADR Labels
router.get('/adr-labels', auth_1.authMiddleware, async (req, res) => {
    try {
        const labels = await prisma.hazmatAdrLabel.findMany({
            orderBy: { code: 'asc' }
        });
        res.json(labels);
    }
    catch (error) {
        console.error('Error fetching ADR labels:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/adr-labels', auth_1.authMiddleware, async (req, res) => {
    const { code, name, description, imageUrl } = req.body;
    if (!code || !name)
        return res.status(400).json({ error: 'code and name are required' });
    try {
        const label = await prisma.hazmatAdrLabel.create({
            data: { code, name, description, imageUrl }
        });
        res.status(201).json(label);
    }
    catch (error) {
        console.error('Error creating ADR label:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.put('/adr-labels/:id', auth_1.authMiddleware, async (req, res) => {
    const { code, name, description, imageUrl } = req.body;
    try {
        const label = await prisma.hazmatAdrLabel.update({
            where: { id: req.params.id },
            data: { code, name, description, imageUrl }
        });
        res.json(label);
    }
    catch (error) {
        console.error('Error updating ADR label:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.delete('/adr-labels/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        await prisma.hazmatAdrLabel.delete({ where: { id: req.params.id } });
        res.json({ message: 'ADR Label deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting ADR label:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// PPEs
router.get('/ppes', auth_1.authMiddleware, async (req, res) => {
    try {
        const ppes = await prisma.hazmatPpe.findMany({
            orderBy: { name: 'asc' }
        });
        res.json(ppes);
    }
    catch (error) {
        console.error('Error fetching ppes:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/ppes', auth_1.authMiddleware, async (req, res) => {
    const { name, description, imageUrl } = req.body;
    if (!name)
        return res.status(400).json({ error: 'name is required' });
    try {
        const ppe = await prisma.hazmatPpe.create({
            data: { name, description, imageUrl }
        });
        res.status(201).json(ppe);
    }
    catch (error) {
        console.error('Error creating ppe:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.put('/ppes/:id', auth_1.authMiddleware, async (req, res) => {
    const { name, description, imageUrl } = req.body;
    try {
        const ppe = await prisma.hazmatPpe.update({
            where: { id: req.params.id },
            data: { name, description, imageUrl }
        });
        res.json(ppe);
    }
    catch (error) {
        console.error('Error updating ppe:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.delete('/ppes/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        await prisma.hazmatPpe.delete({ where: { id: req.params.id } });
        res.json({ message: 'PPE deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting ppe:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Categories
router.get('/categories', auth_1.authMiddleware, async (req, res) => {
    try {
        const categories = await prisma.hazmatCategory.findMany({
            orderBy: { name: 'asc' }
        });
        res.json(categories);
    }
    catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/categories', auth_1.authMiddleware, async (req, res) => {
    const { name, scope, examples } = req.body;
    if (!name)
        return res.status(400).json({ error: 'name is required' });
    try {
        const category = await prisma.hazmatCategory.create({
            data: { name, scope, examples }
        });
        res.status(201).json(category);
    }
    catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.put('/categories/:id', auth_1.authMiddleware, async (req, res) => {
    const { name, scope, examples } = req.body;
    try {
        const category = await prisma.hazmatCategory.update({
            where: { id: req.params.id },
            data: { name, scope, examples }
        });
        res.json(category);
    }
    catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.delete('/categories/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        await prisma.hazmatCategory.delete({ where: { id: req.params.id } });
        res.json({ message: 'Category deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
