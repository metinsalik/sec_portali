import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get all kits for a facility
router.get('/', async (req, res) => {
  try {
    const facilityId = req.query.facilityId as string;
    if (!facilityId) {
      return res.status(400).json({ error: 'facilityId is required' });
    }

    const kits = await prisma.hazmatSpillKit.findMany({
      where: { facilityId },
      include: {
        items: true,
        placements: {
          include: {
            checks: { orderBy: { createdAt: 'desc' } },
            incidents: { orderBy: { createdAt: 'desc' } },
            actions: { orderBy: { createdAt: 'desc' } },
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(kits);
  } catch (error) {
    console.error('Error fetching spill kits:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create or Update a kit template
router.post('/', async (req, res) => {
  try {
    const { id, facilityId, ...data } = req.body;
    
    if (!facilityId) {
      return res.status(400).json({ error: 'facilityId is required' });
    }

    let kit;
    if (id) {
      kit = await prisma.hazmatSpillKit.update({
        where: { id },
        data,
      });
    } else {
      kit = await prisma.hazmatSpillKit.create({
        data: {
          ...data,
          facilityId,
        },
      });
    }

    res.json(kit);
  } catch (error) {
    console.error('Error saving spill kit:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update items for a kit template
router.post('/:id/items', async (req, res) => {
  try {
    const kitId = (req.params as Record<string, string>).id;
    const items = req.body.items || [];

    // Delete existing items
    await prisma.hazmatSpillKitItem.deleteMany({
      where: { kitId }
    });

    // Create new items
    if (items.length > 0) {
      await prisma.hazmatSpillKitItem.createMany({
        data: items.map((item: any) => ({
          kitId,
          name: item.name,
          type: item.type,
          qty: parseInt(item.qty || '0'),
          min: parseInt(item.min || '0'),
          exp: item.exp,
          
        }))
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error saving items:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add a placement (Department mapping)
router.post('/:id/placements', async (req, res) => {
  try {
    const kitId = (req.params as Record<string, string>).id;
    const data = req.body;

    const placement = await prisma.hazmatSpillKitDepartment.create({
      data: {
        ...data,
        kitId
      }
    });

    res.json(placement);
  } catch (error) {
    console.error('Error adding placement:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id/placements/:placementId', async (req, res) => {
  try {
    await prisma.hazmatSpillKitDepartment.delete({
      where: { id: req.params.placementId }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add a check to a placement
router.post('/placements/:id/checks', async (req, res) => {
  try {
    const placementId = (req.params as Record<string, string>).id;
    const data = req.body;

    const check = await prisma.hazmatSpillKitCheck.create({
      data: {
        ...data,
        placementId,
        lastCheck: data.lastCheck ? new Date(data.lastCheck) : null,
        period: parseInt(data.period || '30')
      }
    });

    res.json(check);
  } catch (error) {
    console.error('Error adding check:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add an incident to a placement
router.post('/placements/:id/incidents', async (req, res) => {
  try {
    const placementId = (req.params as Record<string, string>).id;
    const data = req.body;

    const incident = await prisma.hazmatSpillKitIncident.create({
      data: {
        ...data,
        placementId,
        incidentDate: data.incidentDate ? new Date(data.incidentDate) : null
      }
    });

    // Update placement status
    if (data.kitUsed === 'Kullanıldı' || data.kitUsed === 'Kısmen Kullanıldı') {
      await prisma.hazmatSpillKitDepartment.update({
        where: { id: placementId },
        data: { status: 'Eksik (Müdahale Gerekli)' }
      });
    }

    res.json(incident);
  } catch (error) {
    console.error('Error adding incident:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add an action to a placement
router.post('/placements/:id/actions', async (req, res) => {
  try {
    const placementId = (req.params as Record<string, string>).id;
    const data = req.body;

    const action = await prisma.hazmatSpillKitAction.create({
      data: {
        ...data,
        placementId,
        dueDate: data.dueDate ? new Date(data.dueDate) : null
      }
    });

    res.json(action);
  } catch (error) {
    console.error('Error adding action:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update action status
router.put('/actions/:actionId', async (req, res) => {
  try {
    const { actionId } = (req.params as Record<string, string>);
    const { status } = req.body;

    const action = await prisma.hazmatSpillKitAction.update({
      where: { id: actionId },
      data: { status }
    });

    res.json(action);
  } catch (error) {
    console.error('Error updating action:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

// Delete a kit template
router.delete('/:id', async (req, res) => {
  try {
    await prisma.hazmatSpillKit.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting kit:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
