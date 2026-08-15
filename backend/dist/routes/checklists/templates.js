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
                group: true,
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
                group: true,
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
        const { title, description, scaleSetId, groupId, sections } = req.body;
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
                groupId: groupId || null,
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
// Update an existing template
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, scaleSetId, groupId, sections } = req.body;
        const template = await prisma.checklistTemplate.update({
            where: { id },
            data: {
                title,
                description,
                scaleSetId: scaleSetId || null,
                groupId: groupId || null,
            },
        });
        // Handle sections and items: delete missing ones first, then update/create
        const existingTemplate = await prisma.checklistTemplate.findUnique({
            where: { id },
            include: {
                sections: {
                    include: { items: true }
                }
            }
        });
        if (existingTemplate && sections && Array.isArray(sections)) {
            const incomingSectionIds = sections.map((s) => s.id).filter(Boolean);
            const existingSectionIds = existingTemplate.sections.map((s) => s.id);
            const sectionsToDelete = existingSectionIds.filter((id) => !incomingSectionIds.includes(id));
            if (sectionsToDelete.length > 0) {
                await prisma.checklistSection.deleteMany({
                    where: { id: { in: sectionsToDelete } }
                });
            }
            for (const existingSection of existingTemplate.sections) {
                if (sectionsToDelete.includes(existingSection.id))
                    continue;
                const incomingSection = sections.find((s) => s.id === existingSection.id);
                if (incomingSection && incomingSection.items && Array.isArray(incomingSection.items)) {
                    const incomingItemIds = incomingSection.items.map((i) => i.id).filter(Boolean);
                    const existingItemIds = existingSection.items.map((i) => i.id);
                    const itemsToDelete = existingItemIds.filter((id) => !incomingItemIds.includes(id));
                    if (itemsToDelete.length > 0) {
                        await prisma.checklistItem.deleteMany({
                            where: { id: { in: itemsToDelete } }
                        });
                    }
                }
            }
        }
        if (sections && Array.isArray(sections)) {
            for (let sIdx = 0; sIdx < sections.length; sIdx++) {
                const sec = sections[sIdx];
                let sectionId = sec.id;
                if (sectionId) {
                    await prisma.checklistSection.update({
                        where: { id: sectionId },
                        data: { title: sec.title, sortOrder: sIdx }
                    });
                }
                else {
                    const newSec = await prisma.checklistSection.create({
                        data: { templateId: id, title: sec.title, sortOrder: sIdx }
                    });
                    sectionId = newSec.id;
                }
                if (sec.items && Array.isArray(sec.items)) {
                    for (let iIdx = 0; iIdx < sec.items.length; iIdx++) {
                        const item = sec.items[iIdx];
                        if (item.id) {
                            await prisma.checklistItem.update({
                                where: { id: item.id },
                                data: {
                                    itemNo: item.itemNo || (iIdx + 1),
                                    questionText: item.questionText,
                                    questionType: item.questionType || 'SCALE',
                                    weight: item.weight || 1,
                                    isRequired: item.isRequired ?? true,
                                    sortOrder: iIdx,
                                    categoryId: item.categoryId || null,
                                    config: item.config || null
                                }
                            });
                        }
                        else {
                            await prisma.checklistItem.create({
                                data: {
                                    sectionId: sectionId,
                                    itemNo: item.itemNo || (iIdx + 1),
                                    questionText: item.questionText,
                                    questionType: item.questionType || 'SCALE',
                                    weight: item.weight || 1,
                                    isRequired: item.isRequired ?? true,
                                    sortOrder: iIdx,
                                    categoryId: item.categoryId || null,
                                    config: item.config || null
                                }
                            });
                        }
                    }
                }
            }
        }
        res.json({ success: true, template });
    }
    catch (error) {
        console.error('Error updating template:', error);
        res.status(500).json({ error: 'Failed to update template' });
    }
});
// Delete template (Hard delete for admins, cascades to submissions)
router.delete('/:id', async (req, res) => {
    try {
        const isAdmin = req.user?.isAdmin || req.user?.roles?.includes('admin');
        if (!isAdmin) {
            return res.status(403).json({ error: 'Sadece yöneticiler şablon silebilir.' });
        }
        const { id } = req.params;
        // Perform a hard delete. Due to onDelete: Cascade in Prisma schema, 
        // all related ChecklistSubmission and their answers will be deleted automatically.
        await prisma.checklistTemplate.delete({
            where: { id }
        });
        res.json({ success: true, message: 'Şablon ve bağlı tüm denetimler başarıyla silindi.' });
    }
    catch (error) {
        console.error('Error deleting template:', error);
        res.status(500).json({ error: 'Failed to delete template' });
    }
});
exports.default = router;
