import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get all active templates
router.get('/', async (req: AuthRequest, res: Response) => {
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
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// Get a single template details
router.get('/:id', async (req: AuthRequest, res: Response) => {
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
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

// Create a new template
router.post('/', async (req: AuthRequest, res: Response) => {
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
          create: sections.map((sec: any, sIdx: number) => ({
            title: sec.title,
            sortOrder: sIdx,
            items: {
              create: sec.items.map((item: any, iIdx: number) => ({
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
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

// Update an existing template
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, scaleSetId, sections } = req.body;

    const template = await prisma.checklistTemplate.update({
      where: { id },
      data: {
        title,
        description,
        scaleSetId: scaleSetId || null,
      },
    });

    // Handle sections and items manually to avoid deleting old ones and losing answers
    // For simplicity, we just update existing sections/items or create new ones if they don't have an id
    if (sections && Array.isArray(sections)) {
      for (let sIdx = 0; sIdx < sections.length; sIdx++) {
        const sec = sections[sIdx];
        let sectionId = sec.id;
        
        if (sectionId) {
          await prisma.checklistSection.update({
            where: { id: sectionId },
            data: { title: sec.title, sortOrder: sIdx }
          });
        } else {
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
            } else {
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
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

// Soft delete template
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.checklistTemplate.update({
      where: { id },
      data: { isActive: false }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

export default router;
