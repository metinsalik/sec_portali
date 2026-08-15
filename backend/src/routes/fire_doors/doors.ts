import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

// GET /api/safety-management/fire-doors/doors
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { facilityId, grade, doorType, filters } = req.query;
    if (!facilityId) {
      return res.status(400).json({ error: 'facilityId is required' });
    }

    const facilityIdStr = String(facilityId);
    
    // Build where clause for door filtering
    const doorWhere: any = {};
    if (facilityIdStr !== 'all') {
        doorWhere.facilityId = facilityIdStr;
    }
    const andConditions: any[] = [];
    
    // Legacy support for simple filters if used
    if (grade && grade !== 'all' && grade !== 'Tümü') {
      doorWhere.lastGrade = String(grade);
    }
    
    if (doorType && doorType !== 'all' && doorType !== 'Tümü') {
      andConditions.push({
        properties: { path: ['Kapı Çeşidi'], equals: String(doorType) }
      });
    }

    // Dynamic JSON filters support
    if (filters) {
        try {
            const parsedFilters = JSON.parse(String(filters));
            for (const [key, value] of Object.entries(parsedFilters)) {
                if (!value || value === 'Tümü') continue;
                
                if (key === 'grade') {
                    doorWhere.lastGrade = String(value);
                } else {
                    andConditions.push({
                        properties: { path: [key], equals: String(value) }
                    });
                }
            }
        } catch (e) {
            console.error("Error parsing filters JSON:", e);
        }
    }

    if (andConditions.length > 0) {
        doorWhere.AND = andConditions;
    }

    const doors = await prisma.fireDoor.findMany({
      where: doorWhere,
      include: {
        facility: {
            select: {
                shortName: true,
                name: true
            }
        },
        location: {
            include: {
                facilityBuilding: true
            }
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(doors);
  } catch (error) {
    console.error('Error fetching doors:', error);
    res.status(500).json({ error: 'Failed to fetch doors' });
  }
});

// GET /api/safety-management/fire-doors/doors/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const door = await prisma.fireDoor.findUnique({
            where: { id },
            include: {
                location: true,
            }
        });
        if (!door) {
            return res.status(404).json({ error: 'Door not found' });
        }
        res.json(door);
    } catch (error) {
        console.error('Error fetching door:', error);
        res.status(500).json({ error: 'Failed to fetch door' });
    }
});

// POST /api/safety-management/fire-doors/doors
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { facilityId, qrCode, doorNo, locationId, properties, status, photoUrl } = req.body;
    if (!facilityId) {
      return res.status(400).json({ error: 'facilityId is required' });
    }

    const door = await prisma.fireDoor.create({
      data: {
        facilityId,
        qrCode,
        doorNo,
        locationId,
        properties: properties ?? {},
        status: status ?? 'AKTIF',
        photoUrl,
      },
    });
    res.status(201).json(door);
  } catch (error) {
    console.error('Error creating door:', error);
    res.status(500).json({ error: 'Failed to create door' });
  }
});

// PUT /api/safety-management/fire-doors/doors/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { qrCode, doorNo, locationId, properties, status, photoUrl } = req.body;

    const door = await prisma.fireDoor.update({
      where: { id },
      data: {
        qrCode,
        doorNo,
        locationId,
        properties,
        status,
        photoUrl,
      },
    });
    res.json(door);
  } catch (error) {
    console.error('Error updating door:', error);
    res.status(500).json({ error: 'Failed to update door' });
  }
});

// DELETE /api/safety-management/fire-doors/doors/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.fireDoor.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting door:', error);
        res.status(500).json({ error: 'Failed to delete door' });
    }
});

export default router;
