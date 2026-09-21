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

// Bulk update inventory for a specific department (assign multiple materials)
router.post('/department-bulk', authMiddleware, async (req: AuthRequest, res) => {
  const { facilityId, locationId, items } = req.body;

  if (!facilityId || !locationId || !Array.isArray(items)) {
    return res.status(400).json({ error: 'facilityId, locationId and items array are required' });
  }

  if (!req.user?.isAdmin && !req.user?.isManagement && !req.user?.facilities.includes(facilityId)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    let actualLocationId = locationId;
    if (locationId.startsWith('group:')) {
      const parts = locationId.split(':');
      let b = '', f = '', d = '';
      if (['building', 'floor', 'department'].includes(parts[1])) {
        const level = parts[1];
        const pathParts = parts.slice(3).join(':').split('|');
        if (level === 'building') { b = pathParts[0] || ''; }
        else if (level === 'floor') { b = pathParts[0] || ''; f = pathParts[1] || ''; }
        else { b = pathParts[0] || ''; f = pathParts[1] || ''; d = pathParts[2] || ''; }
      }
      
      let groupLoc = await prisma.facilityLocation.findFirst({
        where: { facilityId, building: b || null, floor: f || null, department: d || null, description: null }
      });
      
      if (!groupLoc) {
        groupLoc = await prisma.facilityLocation.create({
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
      actualLocationId = groupLoc.id;
    }

    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        const { materialId, minQuantity, maxQuantity } = item;
        if (!materialId) continue;

        if (!minQuantity && !maxQuantity) {
          // Both null/empty, don't remove existing unless explicitly needed, or delete:
          // If min and max are empty string, remove it
          if (minQuantity === '' && maxQuantity === '') {
            await tx.hazmatInventoryItem.deleteMany({
              where: { facilityId, locationId: actualLocationId, materialId }
            });
          }
          continue;
        }

        const existing = await tx.hazmatInventoryItem.findFirst({
          where: { facilityId, locationId: actualLocationId, materialId }
        });

        if (existing) {
          await tx.hazmatInventoryItem.update({
            where: { id: existing.id },
            data: {
              minQuantity: minQuantity ? Number(minQuantity) : null,
              maxQuantity: maxQuantity ? Number(maxQuantity) : null
            }
          });
        } else {
          await tx.hazmatInventoryItem.create({
            data: {
              facilityId,
              locationId: actualLocationId,
              materialId,
              minQuantity: minQuantity ? Number(minQuantity) : null,
              maxQuantity: maxQuantity ? Number(maxQuantity) : null
            }
          });
        }
      }
    });

    res.json({ message: 'Departman envanteri başarıyla güncellendi' });
  } catch (error: any) {
    console.error('Error bulk updating department inventory:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
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

// Bulk import inventory matrix with location mapping and deduplication
router.post('/bulk-import-matrix', authMiddleware, async (req: AuthRequest, res) => {
  const { facilityId, rows, locationMappings } = req.body;

  if (!facilityId || !Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: 'facilityId and a non-empty rows array are required' });
  }

  if (!req.user?.isAdmin && !req.user?.isManagement && !req.user?.facilities.includes(facilityId)) {
    return res.status(403).json({ error: 'Access denied to this facility' });
  }

  try {
    const username = req.user?.username || 'System';

    // 1. Fetch or create default 'Adet' unit
    let adetUnit = await prisma.hazmatUnit.findFirst({
      where: { name: { contains: 'adet', mode: 'insensitive' } }
    });
    if (!adetUnit) {
      adetUnit = await prisma.hazmatUnit.create({ data: { name: 'Adet', symbol: 'ad' } });
    }

    // 2. Fetch all existing global materials for robust matching
    const allGlobalMaterials = await prisma.hazmatMaterial.findMany();
    const normalize = (t: string) => (t || '').toLocaleLowerCase('tr-TR').trim();

    // 3. Resolve location mapping (maps raw department name to locationId)
    // locationMappings: Record<string, { action: 'existing' | 'new', locationId?: string, newName?: string, building?: string, floor?: string, department?: string, description?: string }>
    const resolvedLocations: Record<string, string> = {};

    if (locationMappings && typeof locationMappings === 'object') {
      for (const [rawDept, mapInfo] of Object.entries(locationMappings as Record<string, any>)) {
        if (!mapInfo) continue;
        if (mapInfo.action === 'existing' && mapInfo.locationId) {
          resolvedLocations[rawDept] = mapInfo.locationId;
        } else if (mapInfo.action === 'new') {
          const b = (mapInfo.building || 'Ana Bina').trim();
          const f = (mapInfo.floor || '').trim();
          const d = (mapInfo.department || mapInfo.newName || rawDept).trim();
          const desc = (mapInfo.description || '').trim();

          // Standard formatted name: e.g. "Ana Bina - Zemin Kat - Acil Servis - Kırmızı Alan" or "Ana Bina - Ameliyathane"
          const nameParts = [b, f, d, desc].filter(Boolean);
          const fullName = (mapInfo.newName || nameParts.join(' - ')).trim();

          let createdLoc = await prisma.facilityLocation.findFirst({
            where: { facilityId, name: fullName }
          });
          if (!createdLoc) {
            createdLoc = await prisma.facilityLocation.create({
              data: {
                facilityId,
                name: fullName,
                building: b || null,
                floor: f || null,
                department: d || null,
                description: desc || null,
                isActive: true
              }
            });
          }
          resolvedLocations[rawDept] = createdLoc.id;
        }
      }
    }

    const results = {
      materialsCreated: 0,
      materialsReused: 0,
      inventoryItemsCreated: 0,
      inventoryItemsUpdated: 0,
      errors: 0
    };

    // Keep cache of created materials during this batch
    const materialCache = new Map<string, any>();
    allGlobalMaterials.forEach(m => materialCache.set(normalize(m.productName), m));

    for (const row of rows) {
      const productName = (row.productName || '').trim();
      if (!productName) {
        results.errors++;
        continue;
      }

      const normName = normalize(productName);
      let material = materialCache.get(normName);

      // Create material in global pool if not exists
      if (!material) {
        material = await prisma.hazmatMaterial.create({
          data: {
            productName,
            brandName: row.brandName || null,
            usageMethod: row.usageMethod || null,
            composition: row.composition || null,
            hazardDescription: row.hazardDescription || null,
            firstAid: row.firstAid || null,
            fireFightingMeasures: row.fireFightingMeasures || null,
            accidentalReleaseMeasures: row.accidentalReleaseMeasures || null,
            handlingAndStorage: row.handlingAndStorage || null,
            exposureControlsPpe: row.exposureControlsPpe || null,
            physicalAndChemicalProperties: row.physicalAndChemicalProperties || null,
            stabilityAndReactivity: row.stabilityAndReactivity || null,
            toxicologicalInformation: row.toxicologicalInformation || null,
            disposalConsiderations: row.disposalConsiderations || null,
            transportInfo: row.transportInfo || null
          }
        });

        await prisma.hazmatAuditLog.create({
          data: {
            materialId: material.id,
            action: 'CREATE',
            details: 'Excel birim envanteri içe aktarımı ile havuza eklendi.',
            username
          }
        });

        materialCache.set(normName, material);
        results.materialsCreated++;
      } else {
        // Update existing material if it lacks technical details
        const updateData: any = {};
        if (!material.brandName && row.brandName) updateData.brandName = row.brandName;
        if (!material.usageMethod && row.usageMethod) updateData.usageMethod = row.usageMethod;
        if (!material.composition && row.composition) updateData.composition = row.composition;
        if (!material.hazardDescription && row.hazardDescription) updateData.hazardDescription = row.hazardDescription;
        if (!material.firstAid && row.firstAid) updateData.firstAid = row.firstAid;
        if (!material.fireFightingMeasures && row.fireFightingMeasures) updateData.fireFightingMeasures = row.fireFightingMeasures;
        if (!material.accidentalReleaseMeasures && row.accidentalReleaseMeasures) updateData.accidentalReleaseMeasures = row.accidentalReleaseMeasures;
        if (!material.handlingAndStorage && row.handlingAndStorage) updateData.handlingAndStorage = row.handlingAndStorage;
        if (!material.exposureControlsPpe && row.exposureControlsPpe) updateData.exposureControlsPpe = row.exposureControlsPpe;
        if (!material.physicalAndChemicalProperties && row.physicalAndChemicalProperties) updateData.physicalAndChemicalProperties = row.physicalAndChemicalProperties;
        if (!material.stabilityAndReactivity && row.stabilityAndReactivity) updateData.stabilityAndReactivity = row.stabilityAndReactivity;
        if (!material.toxicologicalInformation && row.toxicologicalInformation) updateData.toxicologicalInformation = row.toxicologicalInformation;
        if (!material.disposalConsiderations && row.disposalConsiderations) updateData.disposalConsiderations = row.disposalConsiderations;
        if (!material.transportInfo && row.transportInfo) updateData.transportInfo = row.transportInfo;

        if (Object.keys(updateData).length > 0) {
          material = await prisma.hazmatMaterial.update({
            where: { id: material.id },
            data: updateData
          });
          materialCache.set(normName, material);
        }
        results.materialsReused++;
      }

      // Ensure material is linked to facility (FacilityHazmatItem)
      await prisma.facilityHazmatItem.upsert({
        where: {
          facilityId_materialId: { facilityId, materialId: material.id }
        },
        update: {},
        create: {
          facilityId,
          materialId: material.id,
          amountValue: row.maxQuantity || row.minQuantity || 1,
          unitId: adetUnit.id
        }
      });

      // Find target location for this row
      const rawDept = (row.department || '').trim();
      const targetLocationId = resolvedLocations[rawDept];

      if (targetLocationId) {
        const minQ = row.minQuantity !== undefined && row.minQuantity !== null ? Number(row.minQuantity) : null;
        const maxQ = row.maxQuantity !== undefined && row.maxQuantity !== null ? Number(row.maxQuantity) : null;

        const existingItem = await prisma.hazmatInventoryItem.findFirst({
          where: {
            facilityId,
            locationId: targetLocationId,
            materialId: material.id
          }
        });

        if (existingItem) {
          await prisma.hazmatInventoryItem.update({
            where: { id: existingItem.id },
            data: {
              minQuantity: minQ !== null ? minQ : existingItem.minQuantity,
              maxQuantity: maxQ !== null ? maxQ : existingItem.maxQuantity
            }
          });
          results.inventoryItemsUpdated++;
        } else {
          await prisma.hazmatInventoryItem.create({
            data: {
              facilityId,
              locationId: targetLocationId,
              materialId: material.id,
              minQuantity: minQ,
              maxQuantity: maxQ
            }
          });
          results.inventoryItemsCreated++;
        }
      }
    }

    res.json({
      message: 'Envanter ve malzeme aktarımı tamamlandı.',
      results
    });
  } catch (error: any) {
    console.error('Error during bulk inventory matrix import:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

export default router;
