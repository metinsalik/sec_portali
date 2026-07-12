import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get inventory matrix for a specific facility and material
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  const { facilityId, materialId } = req.query as Record<string, any>;

  if (!facilityId || !materialId) {
    return res.status(400).json({ error: 'facilityId and materialId are required' });
  }

  if (!req.user?.isAdmin && !req.user?.isManagement && !req.user?.facilities.includes(String(facilityId))) {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    // 1. Get all active departments for the facility
    const departments = await prisma.facilityLocation.findMany({
      where: { facilityId: String(facilityId), isActive: true },
      orderBy: { name: 'asc' }
    });

    // 2. Get existing inventory items for this material
    const inventoryItems = await prisma.hazmatInventoryItem.findMany({
      where: {
        facilityId: String(facilityId),
        materialId: String(materialId)
      }
    });

    res.json({ departments, inventoryItems });
  } catch (error) {
    console.error('Error fetching inventory matrix:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get summary of all allocated materials in a facility
router.get('/summary', authMiddleware, async (req: AuthRequest, res) => {
  const { facilityId } = req.query as Record<string, any>;

  if (!facilityId) {
    return res.status(400).json({ error: 'facilityId is required' });
  }

  if (!req.user?.isAdmin && !req.user?.isManagement && !req.user?.facilities.includes(String(facilityId))) {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    const facilityItems = await prisma.facilityHazmatItem.findMany({
      where: { facilityId: String(facilityId) },
      include: {
        unit: true,
        material: {
          include: {
            category: true,
            hazardLabels: { include: { label: true } },
            adrLabels: { include: { label: true } },
            ppes: { include: { ppe: true } },
            inventory: {
              where: { facilityId: String(facilityId) },
              include: { location: true }
            }
          }
        }
      }
    });

    res.json({ facilityItems });
  } catch (error) {
    console.error('Error fetching inventory summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get departments with inventory count for a facility
router.get('/departments', authMiddleware, async (req: AuthRequest, res) => {
  const { facilityId } = req.query as Record<string, any>;

  if (!facilityId) {
    return res.status(400).json({ error: 'facilityId is required' });
  }

  if (!req.user?.isAdmin && !req.user?.isManagement && !req.user?.facilities.includes(String(facilityId))) {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    const departments = await prisma.facilityLocation.findMany({
      where: { facilityId: String(facilityId), isActive: true },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          // @ts-ignore
          select: { inventory: true }
        }
      }
    });

    res.json(departments);
  } catch (error) {
    console.error('Error fetching departments with count:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get materials for a specific department
router.get('/department/:id', authMiddleware, async (req: AuthRequest, res) => {
  const { id } = (req.params as Record<string, string>);
  const { facilityId } = req.query as Record<string, any>;

  if (!facilityId) {
    return res.status(400).json({ error: 'facilityId is required' });
  }

  if (!req.user?.isAdmin && !req.user?.isManagement && !req.user?.facilities.includes(String(facilityId))) {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    let actualLocationId = id;
    if (id.startsWith('group:')) {
      const parts = id.split(':');
      let b = '', f = '', d = '';
      if (['building', 'floor', 'department'].includes(parts[1])) {
        const level = parts[1];
        const pathParts = parts.slice(3).join(':').split('|');
        if (level === 'building') { b = pathParts[0] || ''; }
        else if (level === 'floor') { b = pathParts[0] || ''; f = pathParts[1] || ''; }
        else { b = pathParts[0] || ''; f = pathParts[1] || ''; d = pathParts[2] || ''; }
      }
      
      let groupLoc = await prisma.facilityLocation.findFirst({
        where: { facilityId: String(facilityId), building: b || null, floor: f || null, department: d || null, description: null }
      });
      
      if (!groupLoc) {
        groupLoc = await prisma.facilityLocation.create({
          data: {
            facilityId: String(facilityId),
            name: d || f || b || 'Bilinmeyen',
            building: b || null,
            floor: f || null,
            department: d || null,
            description: null
          }
        });
      }
      actualLocationId = groupLoc.id;
    }

    const department = await prisma.facilityLocation.findUnique({
      where: { id: actualLocationId }
    });

    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }

    const inventoryItems = await prisma.hazmatInventoryItem.findMany({
      where: { locationId: actualLocationId, facilityId: String(facilityId) },
      include: {
        material: {
          include: {
            hazardLabels: { include: { label: true } },
            adrLabels: { include: { label: true } },
            ppes: { include: { ppe: true } },
            facilityItems: {
              where: { facilityId: String(facilityId) },
              include: { unit: true }
            }
          }
        }
      }
    });

    res.json({ department, inventoryItems });
  } catch (error) {
    console.error('Error fetching department materials:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update inventory matrix (upsert/delete)
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  const { facilityId, materialId, matrix } = req.body;

  if (!facilityId || !materialId || !Array.isArray(matrix)) {
    return res.status(400).json({ error: 'Invalid data' });
  }

  if (!req.user?.isAdmin && !req.user?.isManagement && !req.user?.facilities.includes(facilityId)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    // We will do this in a transaction
    await prisma.$transaction(async (tx) => {
      for (const item of matrix) {
        let { locationId, minQuantity, maxQuantity } = item;
        
        if (locationId && locationId.startsWith('group:')) {
          const parts = locationId.split(':');
          let b = '', f = '', d = '';
          if (['building', 'floor', 'department'].includes(parts[1])) {
            const level = parts[1];
            const pathParts = parts.slice(3).join(':').split('|');
            if (level === 'building') { b = pathParts[0] || ''; }
            else if (level === 'floor') { b = pathParts[0] || ''; f = pathParts[1] || ''; }
            else { b = pathParts[0] || ''; f = pathParts[1] || ''; d = pathParts[2] || ''; }
          }
          
          let groupLoc = await tx.facilityLocation.findFirst({
            where: { facilityId, building: b || null, floor: f || null, department: d || null, description: null }
          });
          
          if (!groupLoc) {
            groupLoc = await tx.facilityLocation.create({
              data: {
                facilityId,
                name: d || f || b || 'Bilinmeyen',
                building: b || null,
                floor: f || null,
                department: d || null,
                description: null
              }
            });
          }
          locationId = groupLoc.id;
        }
        
        // If both are empty/null/0, we can delete the entry or just store null
        if (!minQuantity && !maxQuantity) {
          // Attempt to delete if exists
          await tx.hazmatInventoryItem.deleteMany({
            where: { facilityId, materialId, locationId }
          });
        } else {
          const locId = locationId || null;
          const existingItem = await tx.hazmatInventoryItem.findFirst({
            where: {
              facilityId,
              locationId: locId,
              vehicleId: null,
              materialId
            }
          });

          if (existingItem) {
            await tx.hazmatInventoryItem.update({
              where: { id: existingItem.id },
              data: {
                minQuantity: minQuantity ? Number(minQuantity) : null,
                maxQuantity: maxQuantity ? Number(maxQuantity) : null
              }
            });
          } else {
            await tx.hazmatInventoryItem.create({
              data: {
                facilityId,
                locationId: locId,
                materialId,
                minQuantity: minQuantity ? Number(minQuantity) : null,
                maxQuantity: maxQuantity ? Number(maxQuantity) : null
              }
            });
          }
        }
      }
    });

    res.json({ message: 'Inventory updated successfully' });
  } catch (error: any) {
    console.error('Error updating inventory:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message, stack: error.stack });
  }
});

// Delete specific inventory item
router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
  const { id } = req.params;

  try {
    const item = await prisma.hazmatInventoryItem.findUnique({
      where: { id },
      include: { facility: true }
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    if (!req.user?.isAdmin && !req.user?.isManagement && !req.user?.facilities.includes(item.facilityId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.hazmatInventoryItem.delete({
      where: { id }
    });

    res.json({ message: 'Inventory item removed successfully' });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
