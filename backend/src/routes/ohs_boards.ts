import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

// Get User helper
function getUser(req: AuthRequest) {
  return req.user!;
}

// GET /api/operations/board - List Board Meetings
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { facilityId } = req.query;
    
    // Facility check
    if (!facilityId) {
      return res.status(400).json({ error: 'Facility ID required' });
    }

    const whereClause: any = {};
    if (facilityId !== 'all') {
      whereClause.facilityId = facilityId as string;
    }

    const meetings = await prisma.ohsBoardMeeting.findMany({
      where: whereClause,
      orderBy: {
        meetingDate: 'desc'
      },
      include: {
        decisions: {
          include: {
            actions: {
              orderBy: { createdAt: 'desc' }
            }
          }
        }
      }
    });

    res.json(meetings);
  } catch (error) {
    console.error('Error listing board meetings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/operations/board/bulk-import - Import decisions
router.post('/bulk-import', async (req: AuthRequest, res: Response) => {
  try {
    const { data } = req.body;
    if (!Array.isArray(data)) {
      return res.status(400).json({ error: 'Data must be an array' });
    }

    // Helper to parse Excel dates (which can be numbers or strings)
    const parseExcelDate = (val: any) => {
      if (!val) return null;
      if (typeof val === 'number') {
        // Excel serial date (days since Dec 30, 1899)
        const date = new Date(Math.round((val - 25569) * 86400 * 1000));
        return isNaN(date.getTime()) ? null : date;
      }
      const parsed = new Date(val);
      return isNaN(parsed.getTime()) ? null : parsed;
    };

    let createdCount = 0;
    
    // Process sequentially or batch
    for (const item of data) {
      if (!item.facilityName || !item.meetingNo || !item.decisionText) continue;

      try {
        // 1. Find Facility
      const facility = await prisma.facility.findFirst({
        where: {
          OR: [
            { name: { contains: item.facilityName, mode: 'insensitive' } },
            { shortName: { contains: item.facilityName, mode: 'insensitive' } }
          ]
        }
      });

      if (!facility) continue; // Skip if facility not found

        // 2. Find or Create Meeting
        const parsedMeetingDate = parseExcelDate(item.meetingDate) || new Date();
        let meeting = await prisma.ohsBoardMeeting.findFirst({
        where: { facilityId: facility.id, meetingNo: String(item.meetingNo) }
      });

      if (!meeting) {
        meeting = await prisma.ohsBoardMeeting.create({
          data: {
            facilityId: facility.id,
            meetingNo: String(item.meetingNo),
              meetingDate: parsedMeetingDate
          }
        });
      }

      // 3. Find or Create Category
      const catName = item.categoryName || 'Diğer';
      let category = await prisma.category.findFirst({
        where: { name: { equals: catName, mode: 'insensitive' } }
      });

      if (!category) {
        category = await prisma.category.create({ data: { name: catName } });
      }

      // 4. Find or Create Department
      const deptName = item.departmentName || 'Belirtilmedi';
      let department = await prisma.department.findFirst({
        where: { name: { equals: deptName, mode: 'insensitive' } }
      });

      if (!department) {
        department = await prisma.department.create({ data: { name: deptName } });
      }

      // 5. Check if decision already exists
      const existingDecision = await prisma.ohsBoardDecision.findFirst({
        where: {
          meetingId: meeting.id,
          decisionText: item.decisionText
        }
      });

      if (existingDecision) {
        continue; // Skip if already exists
      }

      // Generate a decision number based on existing count
      const existingCount = await prisma.ohsBoardDecision.count({
        where: { meetingId: meeting.id }
      });
      const decisionNumber = `${meeting.meetingNo}-${String(existingCount + 1).padStart(3, '0')}`;
      
        const parsedDueDate = parseExcelDate(item.dueDate);
        let status = item.status || 'Başlamadı';
      if (!['Başlamadı', 'Devam Ediyor', 'Tamamlandı', 'İptal Edildi', 'Sürekli Takip', 'Belirsiz'].includes(status)) {
        status = 'Başlamadı';
      }
      
      let priority = item.priority || 'Düşük';
      if (!['Kritik', 'Yüksek Riskli', 'Riskli', 'Orta', 'Düşük'].includes(priority)) {
        priority = 'Düşük';
      }

        let dueDateType = 'DATE';
        if (!parsedDueDate) dueDateType = 'PERIOD';

        await prisma.ohsBoardDecision.create({
          data: {
            meetingId: meeting.id,
            decisionNumber,
            decisionText: item.decisionText,
            categoryId: category.id,
            departmentId: department.id,
            status,
            priority,
            dueDateType,
            dueDate: parsedDueDate,
            remarks: item.remarks ? String(item.remarks) : null
          }
        });
        createdCount++;
      } catch (err) {
        console.error(`Error importing row for meeting ${item.meetingNo}:`, err);
        // Continue with the next item
      }
    }

    res.json({ message: 'Success', imported: createdCount });
  } catch (error) {
    console.error('Error in bulk import:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/operations/board/bulk-delete - Delete all decisions and meetings
router.delete('/bulk-delete', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.ohsBoardDecision.deleteMany({});
    await prisma.ohsBoardMeeting.deleteMany({});
    res.json({ message: 'Tüm kurul toplantıları ve kararları başarıyla silindi.' });
  } catch (error) {
    console.error('Error bulk deleting:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/operations/board/members - List members
router.get('/members', async (req: AuthRequest, res: Response) => {
  try {
    const { facilityId, year } = req.query;
    if (!facilityId) {
      return res.status(400).json({ error: 'Facility ID required' });
    }

    const whereClause: any = { facilityId: String(facilityId) };
    if (year) {
      whereClause.year = parseInt(String(year));
    }

    const members = await prisma.ohsBoardMember.findMany({
      where: whereClause,
      include: { department: true },
      orderBy: [{ year: 'desc' }, { id: 'asc' }]
    });

    res.json(members);
  } catch (error) {
    console.error('Error fetching members:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/operations/board/members - Create member
router.post('/members', async (req: AuthRequest, res: Response) => {
  try {
    const { facilityId, year, boardRole, jobTitle, name, departmentId } = req.body;
    if (!facilityId || !year || !boardRole || !jobTitle || !name || !departmentId) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const member = await prisma.ohsBoardMember.create({
      data: {
        facilityId,
        year: parseInt(String(year)),
        boardRole,
        jobTitle,
        name,
        departmentId: parseInt(String(departmentId))
      },
      include: { department: true }
    });

    res.status(201).json(member);
  } catch (error) {
    console.error('Error creating member:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/operations/board/members/:id - Update member
router.put('/members/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { boardRole, jobTitle, name, departmentId } = req.body;

    const member = await prisma.ohsBoardMember.update({
      where: { id },
      data: {
        boardRole,
        jobTitle,
        name,
        departmentId: departmentId ? parseInt(String(departmentId)) : undefined
      },
      include: { department: true }
    });

    res.json(member);
  } catch (error) {
    console.error('Error updating member:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/operations/board/members/:id - Delete member
router.delete('/members/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.ohsBoardMember.delete({ where: { id } });
    res.json({ message: 'Member deleted successfully' });
  } catch (error) {
    console.error('Error deleting member:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/operations/board/:id - Get Single Meeting
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const meeting = await prisma.ohsBoardMeeting.findUnique({
      where: { id },
      include: {
        decisions: {
          include: {
            category: true,
            subCategory: true,
            department: true,
            actions: {
              orderBy: { createdAt: 'desc' }
            }
          }
        }
      }
    });

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    res.json(meeting);
  } catch (error) {
    console.error('Error fetching meeting:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/operations/board - Create Meeting & Decisions
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { facilityId, meetingDate, meetingNo, decisions } = req.body;

    const newMeeting = await prisma.ohsBoardMeeting.create({
      data: {
        facilityId,
        meetingDate: new Date(meetingDate),
        meetingNo,
        decisions: {
          create: decisions.map((d: any, index: number) => ({
            decisionNumber: d.decisionNumber || `${meetingNo}-${index + 1}`,
            decisionText: d.decisionText,
            categoryId: Number(d.categoryId),
            subCategoryId: d.subCategoryId ? Number(d.subCategoryId) : null,
            departmentId: Number(d.departmentId),
            priority: d.priority || 'Orta',
            status: d.status || 'Başlamadı',
            dueDateType: d.dueDateType || 'DATE',
            dueDate: d.dueDate ? new Date(d.dueDate) : null,
            periodicity: d.periodicity || null,
            remarks: d.remarks || null
          }))
        }
      },
      include: {
        decisions: true
      }
    });

    res.status(201).json(newMeeting);
  } catch (error) {
    console.error('Error creating meeting:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/operations/board/:id - Update Meeting
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { meetingDate, meetingNo, decisions } = req.body;

    // Delete existing decisions (cascade will drop actions)
    await prisma.ohsBoardDecision.deleteMany({
      where: { meetingId: id }
    });

    // Update meeting and recreate decisions
    const updatedMeeting = await prisma.ohsBoardMeeting.update({
      where: { id },
      data: {
        meetingDate: new Date(meetingDate),
        meetingNo,
        decisions: {
          create: decisions.map((d: any, index: number) => ({
            decisionNumber: d.decisionNumber || `${meetingNo}-${index + 1}`,
            decisionText: d.decisionText,
            categoryId: Number(d.categoryId),
            subCategoryId: d.subCategoryId ? Number(d.subCategoryId) : null,
            departmentId: Number(d.departmentId),
            priority: d.priority || 'Orta',
            status: d.status || 'Başlamadı',
            dueDateType: d.dueDateType || 'DATE',
            dueDate: d.dueDate ? new Date(d.dueDate) : null,
            periodicity: d.periodicity || null,
            remarks: d.remarks || null
          }))
        }
      },
      include: {
        decisions: true
      }
    });

    res.json(updatedMeeting);
  } catch (error) {
    console.error('Error updating meeting:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/operations/board/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.ohsBoardMeeting.delete({
      where: { id }
    });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting meeting:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/operations/board/decisions/:decisionId/actions - Create action
router.post('/decisions/:decisionId/actions', async (req: AuthRequest, res: Response) => {
  try {
    const { decisionId } = req.params;
    const { actionText, newStatus, newDueDate, newDueDateType, newPriority } = req.body;
    const user = getUser(req);

    // 1. Check if we are reopening a closed decision
    let isReopening = false;
    let userToNotify: string | null = null;
    let decisionBeforeUpdate: any = null;

    if (newStatus && newStatus !== 'Tamamlandı') {
      decisionBeforeUpdate = await prisma.ohsBoardDecision.findUnique({
        where: { id: decisionId },
        include: { actions: { orderBy: { createdAt: 'desc' }, take: 1 } }
      });
      
      if (decisionBeforeUpdate?.status === 'Tamamlandı') {
        isReopening = true;
        const lastAction = decisionBeforeUpdate.actions[0];
        if (lastAction && lastAction.createdBy) {
          const closingUser = await prisma.user.findFirst({
            where: {
              OR: [
                { fullName: lastAction.createdBy },
                { username: lastAction.createdBy }
              ]
            }
          });
          if (closingUser) {
            userToNotify = closingUser.username;
          }
        }
      }
    }

    // 2. Create the action
    const action = await prisma.ohsBoardDecisionAction.create({
      data: {
        decisionId,
        actionText,
        createdBy: user.fullName || user.username
      }
    });

    // 3. Update the decision if requested
    if (newStatus || newDueDate || newDueDateType || newPriority) {
      const updateData: any = {};
      if (newStatus) updateData.status = newStatus;
      if (newPriority) updateData.priority = newPriority;
      if (newDueDateType) updateData.dueDateType = newDueDateType;
      if (newDueDate) updateData.dueDate = new Date(newDueDate);

      await prisma.ohsBoardDecision.update({
        where: { id: decisionId },
        data: updateData
      });
    }

    // 4. Create Notification if reopened
    if (isReopening && userToNotify) {
      await prisma.notification.create({
        data: {
          title: "Karar Yeniden Açıldı",
          message: `${decisionBeforeUpdate.decisionNumber} numaralı karar, ${user.fullName || user.username} tarafından yeniden açıldı. Gerekçe: ${actionText}`,
          type: "WARNING",
          module: "ISG_KURUL",
          username: userToNotify,
          link: `/isg-kurul/meetings/${decisionBeforeUpdate.meetingId}/decisions/${decisionId}`
        }
      });
    }

    res.status(201).json(action);
  } catch (error) {
    console.error('Error creating action:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/operations/board/actions/:actionId - Delete action
router.delete('/actions/:actionId', async (req: AuthRequest, res: Response) => {
  try {
    const { actionId } = req.params;
    await prisma.ohsBoardDecisionAction.delete({
      where: { id: actionId }
    });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting action:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/operations/board/facility/:facilityId/previous-uncompleted - Helper for auto-copy
router.get('/facility/:facilityId/previous-uncompleted', async (req: AuthRequest, res: Response) => {
  try {
    const { facilityId } = req.params;
    const lastMeeting = await prisma.ohsBoardMeeting.findFirst({
      where: { facilityId },
      orderBy: { meetingDate: 'desc' },
      include: {
        decisions: {
          where: {
            status: {
              notIn: ['Tamamlandı', 'İptal Edildi']
            }
          }
        }
      }
    });
    
    if (!lastMeeting) {
      return res.json([]);
    }

    res.json(lastMeeting.decisions);
  } catch (error) {
    console.error('Error fetching uncompleted decisions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
