"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Get all active templates
router.get('/', async (req, res) => {
    try {
        const templates = await prisma.checklistTemplate.findMany({
            where: { isActive: true },
            include: {
                scaleSet: {
                    include: {
                        options: { orderBy: { sortOrder: 'asc' } }
                    }
                },
                _count: {
                    select: { submissions: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(templates);
    }
    catch (error) {
        console.error('Error fetching templates:', error);
        res.status(500).json({ error: 'Failed to fetch templates' });
    }
});
// Get a single template details
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const template = await prisma.checklistTemplate.findUnique({
            where: { id },
            include: {
                scaleSet: {
                    include: {
                        options: { orderBy: { sortOrder: 'asc' } }
                    }
                },
                sections: {
                    orderBy: { sortOrder: 'asc' },
                    include: {
                        items: {
                            orderBy: { sortOrder: 'asc' },
                            include: { category: true }
                        }
                    }
                }
            }
        });
        if (!template) {
            return res.status(404).json({ error: 'Template not found' });
        }
        res.json(template);
    }
    catch (error) {
        console.error('Error fetching template:', error);
        res.status(500).json({ error: 'Failed to fetch template' });
    }
});
// Create a new template
router.post('/', async (req, res) => {
    try {
        const { title, description, scaleSetId, sections } = req.body;
        const username = req.user?.username;
        if (!username) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const template = await prisma.checklistTemplate.create({
            data: {
                title,
                description,
                createdById: username,
                scaleSetId: scaleSetId || null,
                sections: {
                    create: sections.map((sec, sIdx) => ({
                        title: sec.title,
                        sortOrder: sIdx,
                        items: {
                            create: sec.items.map((item, iIdx) => ({
                                itemNo: item.itemNo || (iIdx + 1),
                                questionText: item.questionText,
                                questionType: item.questionType || 'SCALE',
                                weight: item.weight || 1,
                                isRequired: item.isRequired ?? true,
                                sortOrder: iIdx,
                                categoryId: item.categoryId || null,
                                config: item.config || null
                            }))
                        }
                    }))
                }
            },
            include: {
                scaleSet: {
                    include: { options: true }
                },
                sections: {
                    include: { items: true }
                }
            }
        });
        res.status(201).json(template);
    }
    catch (error) {
        console.error('Error creating template:', error);
        res.status(500).json({ error: 'Failed to create template' });
    }
});
// Soft delete template
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.checklistTemplate.update({
            where: { id },
            data: { isActive: false }
        });
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error deleting template:', error);
        res.status(500).json({ error: 'Failed to delete template' });
    }
});
exports.default = router;
