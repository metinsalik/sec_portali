"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Get all checklist template groups
router.get('/', async (req, res) => {
    try {
        const groups = await prisma.checklistTemplateGroup.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { templates: true }
                }
            }
        });
        res.json(groups);
    }
    catch (error) {
        console.error('Error fetching template groups:', error);
        res.status(500).json({ error: 'Failed to fetch template groups' });
    }
});
// Create a new template group
router.post('/', async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }
        const group = await prisma.checklistTemplateGroup.create({
            data: {
                name,
                description
            }
        });
        res.status(201).json(group);
    }
    catch (error) {
        console.error('Error creating template group:', error);
        res.status(500).json({ error: 'Failed to create template group' });
    }
});
// Update a template group
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        const group = await prisma.checklistTemplateGroup.update({
            where: { id },
            data: {
                name,
                description
            }
        });
        res.json(group);
    }
    catch (error) {
        console.error('Error updating template group:', error);
        res.status(500).json({ error: 'Failed to update template group' });
    }
});
// Delete a template group
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // Check if group has templates
        const templatesCount = await prisma.checklistTemplate.count({
            where: { groupId: id }
        });
        if (templatesCount > 0) {
            return res.status(400).json({ error: 'Cannot delete group because it has active templates.' });
        }
        await prisma.checklistTemplateGroup.delete({
            where: { id }
        });
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error deleting template group:', error);
        res.status(500).json({ error: 'Failed to delete template group' });
    }
});
exports.default = router;
