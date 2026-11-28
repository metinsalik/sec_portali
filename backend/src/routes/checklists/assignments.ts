import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

// Get assignments for a template
router.get('/template/:templateId', async (req, res) => {
  try {
    const { templateId } = req.params;
    const assignments = await prisma.checklistAssignment.findMany({
      where: { templateId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(assignments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// Create assignment
router.post('/', async (req, res) => {
  try {
    const { templateId, facilityIds, isPeriodic, periodValue, periodType, startDate, endDate } = req.body;

    if (!templateId || !facilityIds || !Array.isArray(facilityIds) || facilityIds.length === 0) {
      return res.status(400).json({ error: 'templateId and facilityIds array are required' });
    }

    const assignment = await prisma.checklistAssignment.create({
      data: {
        templateId,
        facilityIds,
        isPeriodic: isPeriodic || false,
        periodValue,
        periodType,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      }
    });

    const template = await prisma.checklistTemplate.findUnique({
      where: { id: templateId },
      select: { title: true },
    });

    // Anlık gönderim veya başlangıç tarihi gelmiş periyodik atamalarda hemen BEKLEYEN denetim aç
    const now = new Date();
    const shouldCreateInitial = !isPeriodic || !startDate || new Date(startDate) <= now;

    if (shouldCreateInitial) {
      const submissionsToCreate = facilityIds.map((facilityId: string) => ({
        templateId,
        facilityId,
        auditDate: now,
        status: 'BEKLEYEN',
      }));

      await prisma.checklistSubmission.createMany({
        data: submissionsToCreate
      });
    }

    // İlgili tesis kullanıcılarına bildirim gönder (kokpit + zil)
    try {
      const targetUsers = await prisma.userFacility.findMany({
        where: { facilityId: { in: facilityIds } },
        select: { username: true },
        distinct: ['username'],
      });
      if (targetUsers.length > 0) {
        const modeText = isPeriodic ? 'Periyodik Kontrol Listesi' : 'Anlık Kontrol Listesi';
        await prisma.notification.createMany({
          data: targetUsers.map((u) => ({
            title: `${modeText}: ${template?.title || 'Yeni Denetim'}`,
            message: `${template?.title || 'Kontrol listesi'} tesisinize atandı. Lütfen kontrol listesini doldurup tamamlayın.`,
            type: isPeriodic ? 'INFO' : 'WARNING',
            module: 'CHECKLISTS',
            username: u.username,
            link: '/checklists/submissions?status=bekleyen',
          })),
        });
      }
    } catch (notifErr) {
      console.error('Checklist assignment notification error:', notifErr);
    }

    res.status(201).json(assignment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create assignment' });
  }
});

// Delete assignment
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.checklistAssignment.delete({
      where: { id }
    });
    res.json({ message: 'Assignment deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete assignment' });
  }
});

export default router;
