import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

// Get all scale sets with their options
router.get('/', async (req, res) => {
  try {
    const scaleSets = await prisma.checklistScaleSet.findMany({
      include: {
        options: {
          orderBy: { sortOrder: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(scaleSets);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch scale sets' });
  }
});

// Create a new scale set
router.post('/', async (req, res) => {
  try {
    const { name, description, options } = req.body;
    if (!name || !options || !Array.isArray(options)) {
      return res.status(400).json({ error: 'Name and options are required' });
    }

    const scaleSet = await prisma.checklistScaleSet.create({
      data: {
        name,
        description,
        options: {
          create: options.map((opt: any, index: number) => ({
            label: opt.label,
            multiplier: opt.multiplier,
            sortOrder: index,
            color: opt.color,
            requiresExplanation: opt.requiresExplanation || false,
            requiresAttachment: opt.requiresAttachment || false
          }))
        }
      },
      include: { options: true }
    });
    res.status(201).json(scaleSet);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create scale set' });
  }
});

// Update a scale set
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, options } = req.body;

    // We can just delete old options and recreate them for simplicity
    await prisma.checklistScaleOption.deleteMany({
      where: { scaleSetId: id }
    });

    const scaleSet = await prisma.checklistScaleSet.update({
      where: { id },
      data: {
        name,
        description,
        options: {
          create: options.map((opt: any, index: number) => ({
            label: opt.label,
            multiplier: opt.multiplier,
            sortOrder: index,
            color: opt.color,
            requiresExplanation: opt.requiresExplanation || false,
            requiresAttachment: opt.requiresAttachment || false
          }))
        }
      },
      include: { options: true }
    });
    res.json(scaleSet);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update scale set' });
  }
});

// Delete a scale set
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.checklistScaleSet.delete({
      where: { id }
    });
    res.json({ message: 'Scale set deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete scale set' });
  }
});

export default router;
