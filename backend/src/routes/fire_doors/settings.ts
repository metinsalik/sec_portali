import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

// --- PROPERTIES ---

// GET /api/safety-management/fire-doors/settings/properties
router.get('/properties', async (req: AuthRequest, res: Response) => {
  try {
    const properties = await prisma.fireDoorProperty.findMany({
      orderBy: { createdAt: 'asc' },
    });
    res.json(properties);
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({ error: 'Failed to fetch properties' });
  }
});

// POST /api/safety-management/fire-doors/settings/properties
router.post('/properties', async (req: AuthRequest, res: Response) => {
  try {
    const { name, options } = req.body;
    if (!name || !options) {
      return res.status(400).json({ error: 'Name and options are required' });
    }

    const property = await prisma.fireDoorProperty.create({
      data: {
        name,
        options,
      },
    });
    res.status(201).json(property);
  } catch (error) {
    console.error('Error creating property:', error);
    res.status(500).json({ error: 'Failed to create property' });
  }
});

// PUT /api/safety-management/fire-doors/settings/properties/:id
router.put('/properties/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, options, isActive } = req.body;

    const property = await prisma.fireDoorProperty.update({
      where: { id },
      data: {
        name,
        options,
        isActive,
      },
    });
    res.json(property);
  } catch (error) {
    console.error('Error updating property:', error);
    res.status(500).json({ error: 'Failed to update property' });
  }
});

// DELETE /api/safety-management/fire-doors/settings/properties/:id
router.delete('/properties/:id', async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.fireDoorProperty.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting property:', error);
        res.status(500).json({ error: 'Failed to delete property' });
    }
});

// --- QUESTION GROUPS ---

// GET /api/safety-management/fire-doors/settings/question-groups
router.get('/question-groups', async (req: AuthRequest, res: Response) => {
  try {
    const groups = await prisma.fireDoorQuestionGroup.findMany({
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    });
    res.json(groups);
  } catch (error) {
    console.error('Error fetching question groups:', error);
    res.status(500).json({ error: 'Failed to fetch question groups' });
  }
});

// POST /api/safety-management/fire-doors/settings/question-groups
router.post('/question-groups', async (req: AuthRequest, res: Response) => {
  try {
    const { name, order } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const group = await prisma.fireDoorQuestionGroup.create({
      data: {
        name,
        order: order ?? 0,
      },
    });
    res.status(201).json(group);
  } catch (error) {
    console.error('Error creating question group:', error);
    res.status(500).json({ error: 'Failed to create question group' });
  }
});

// PUT /api/safety-management/fire-doors/settings/question-groups/:id
router.put('/question-groups/:id', async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name, order, isActive } = req.body;
        const group = await prisma.fireDoorQuestionGroup.update({
            where: { id },
            data: { name, order, isActive }
        });
        res.json(group);
    } catch (error) {
        console.error('Error updating question group:', error);
        res.status(500).json({ error: 'Failed to update question group' });
    }
});

// --- QUESTIONS ---

// POST /api/safety-management/fire-doors/settings/questions
router.post('/questions', async (req: AuthRequest, res: Response) => {
  try {
    const { groupId, text, order, weightPass, weightPartial, weightFail } = req.body;
    if (!groupId || !text) {
      return res.status(400).json({ error: 'GroupId and text are required' });
    }

    const question = await prisma.fireDoorQuestion.create({
      data: {
        groupId,
        text,
        order: order ?? 0,
        weightPass: weightPass ?? 1.0,
        weightPartial: weightPartial ?? 0.5,
        weightFail: weightFail ?? -1.0,
      },
    });
    res.status(201).json(question);
  } catch (error) {
    console.error('Error creating question:', error);
    res.status(500).json({ error: 'Failed to create question' });
  }
});

// PUT /api/safety-management/fire-doors/settings/questions/:id
router.put('/questions/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { text, order, weightPass, weightPartial, weightFail, isActive } = req.body;

    const question = await prisma.fireDoorQuestion.update({
      where: { id },
      data: {
        text,
        order,
        weightPass,
        weightPartial,
        weightFail,
        isActive,
      },
    });
    res.json(question);
  } catch (error) {
    console.error('Error updating question:', error);
    res.status(500).json({ error: 'Failed to update question' });
  }
});

// DELETE /api/safety-management/fire-doors/settings/questions/:id
router.delete('/questions/:id', async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.fireDoorQuestion.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting question:', error);
        res.status(500).json({ error: 'Failed to delete question' });
    }
});

// --- NOTIFICATION ---

// GET /api/safety-management/fire-doors/settings/notify-targets
router.get('/notify-targets', async (req: AuthRequest, res: Response) => {
    try {
        const module = await prisma.module.findUnique({ where: { code: 'FIRE_DOORS' } });
        if (!module) return res.json([]);
    
        const userModules = await prisma.userModule.findMany({
            where: { moduleId: module.id },
            include: { 
                user: {
                    select: {
                        username: true,
                        firstName: true,
                        lastName: true,
                        facilities: {
                            select: { facility: true }
                        }
                    }
                }
            }
        });

        const targets = userModules.map(um => {
            const facilityNames = um.user.facilities.map((uf: any) => uf.facility.name).join(', ');
            return {
                username: um.user.username,
                fullName: `${um.user.firstName || ''} ${um.user.lastName || ''}`.trim() || um.user.username,
                facilities: facilityNames || 'Genel Yetkili'
            };
        });

        // Remove duplicates by username
        const uniqueTargets = [];
        const seen = new Set();
        for (const t of targets) {
            if (!seen.has(t.username)) {
                seen.add(t.username);
                uniqueTargets.push(t);
            }
        }
    
        res.json(uniqueTargets);
    } catch (error) {
        console.error('Error fetching targets:', error);
        res.status(500).json({ error: 'Failed to fetch targets' });
    }
});

// POST /api/safety-management/fire-doors/settings/notify
router.post('/notify', async (req: AuthRequest, res: Response) => {
  try {
    const { deadline, facilityIds } = req.body;
    
    if (!facilityIds || !Array.isArray(facilityIds) || facilityIds.length === 0) {
        return res.status(400).json({ error: 'Lütfen en az bir tesis seçiniz.' });
    }

    const module = await prisma.module.findUnique({ where: { code: 'FIRE_DOORS' } });
    if (!module) return res.status(404).json({ error: 'FIRE_DOORS module not found' });

    // Find users who have access to this module AND are assigned to the selected facilities
    const userModules = await prisma.userModule.findMany({
        where: { 
            moduleId: module.id,
            user: {
                facilities: {
                    some: {
                        facilityId: { in: facilityIds }
                    }
                }
            }
        },
        include: { user: true }
    });

    const uniqueUsernames = Array.from(new Set(userModules.map(um => um.username)));

    let msg = 'Yangın Kapıları denetimi başlamıştır. Lütfen tesisinizdeki kapıları sisteme girerek kontrol listelerini doldurunuz.';
    if (deadline) {
        msg = `Yangın Kapıları denetimi başlamıştır. Lütfen tesisinizdeki kapıları en geç ${deadline} tarihine kadar sisteme girerek kontrol listelerini doldurunuz.`;
    }

    const notifications = uniqueUsernames.map(username => ({
        title: 'Yangın Kapıları Denetimi',
        message: msg,
        type: 'INFO',
        module: 'FIRE_DOORS',
        username,
        link: '/safety-management/fire-doors/new'
    }));

    if (notifications.length > 0) {
        await prisma.notification.createMany({
            data: notifications
        });
    }

    res.json({ message: 'Bildirimler gönderildi', count: notifications.length });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

export default router;
