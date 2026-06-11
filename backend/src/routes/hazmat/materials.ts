import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Search global materials library
router.get('/search', authMiddleware, async (req: AuthRequest, res) => {
  const { q } = req.query as Record<string, any>;
  const searchQuery = String(q || '').trim();

  try {
    const materials = await prisma.hazmatMaterial.findMany({
      where: searchQuery ? {
        OR: [
          { productName: { contains: searchQuery, mode: 'insensitive' } },
          { brandName: { contains: searchQuery, mode: 'insensitive' } }
        ]
      } : undefined,
      include: {
        hazardLabels: { include: { label: true } },
        adrLabels: { include: { label: true } },
        ppes: { include: { ppe: true } },
        category: true
      },
      orderBy: { productName: 'asc' }
    });
    res.json(materials);
  } catch (error) {
    console.error('Error searching global materials:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get materials for a specific facility
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  const { facilityId } = req.query as Record<string, any>;

  if (!facilityId) {
    return res.status(400).json({ error: 'facilityId is required' });
  }

  if (!req.user?.isAdmin && !req.user?.isManagement && !req.user?.facilities.includes(String(facilityId))) {
    return res.status(403).json({ error: 'Access denied to this facility' });
  }

  try {
    const facilityItems = await prisma.facilityHazmatItem.findMany({
      where: { facilityId: String(facilityId) },
      include: {
        unit: true,
        material: {
          include: {
            hazardLabels: { include: { label: true } },
            adrLabels: { include: { label: true } },
            ppes: { include: { ppe: true } },
            category: true
          }
        }
      },
      orderBy: { material: { productName: 'asc' } }
    });

    res.json(facilityItems);
  } catch (error) {
    console.error('Error fetching facility materials:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add an existing global material to a facility
router.post('/facility', authMiddleware, async (req: AuthRequest, res) => {
  const { facilityId, materialId, amountValue, unitId } = req.body;

  if (!facilityId || !materialId) {
    return res.status(400).json({ error: 'facilityId and materialId are required' });
  }

  if (!req.user?.isAdmin && !req.user?.isManagement && !req.user?.facilities.includes(facilityId)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    const newItem = await prisma.facilityHazmatItem.upsert({
      where: {
        facilityId_materialId: { facilityId, materialId }
      },
      update: {
        amountValue: amountValue ? Number(amountValue) : null,
        unitId: unitId || null
      },
      create: {
        facilityId,
        materialId,
        amountValue: amountValue ? Number(amountValue) : null,
        unitId: unitId || null
      },
      include: {
        unit: true,
        material: {
          include: {
            hazardLabels: { include: { label: true } },
            adrLabels: { include: { label: true } },
            ppes: { include: { ppe: true } }
          }
        }
      }
    });

    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error adding material to facility:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new global material AND add it to the facility
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  const data = req.body;

  if (!data.facilityId || !data.productName) {
    return res.status(400).json({ error: 'facilityId and productName are required' });
  }

  if (!req.user?.isAdmin && !req.user?.isManagement && !req.user?.facilities.includes(data.facilityId)) {
    return res.status(403).json({ error: 'Access denied to this facility' });
  }

  try {
    const { facilityId, amountValue, unitId, hazardLabels, adrLabels, ppes, ...materialData } = data;

    // Create the global material
    const newMaterial = await prisma.hazmatMaterial.create({
      data: {
        productName: materialData.productName,
        brandName: materialData.brandName,
        usageMethod: materialData.usageMethod,
        composition: materialData.composition,
        hazardDescription: materialData.hazardDescription,
        firstAid: materialData.firstAid,
        fireFightingMeasures: materialData.fireFightingMeasures,
        accidentalReleaseMeasures: materialData.accidentalReleaseMeasures,
        handlingAndStorage: materialData.handlingAndStorage,
        exposureControlsPpe: materialData.exposureControls,
        physicalAndChemicalProperties: materialData.physicalProperties,
        stabilityAndReactivity: materialData.stabilityAndReactivity,
        toxicologicalInformation: materialData.toxicologicalInfo,
        ecologicalInformation: materialData.ecologicalInfo,
        disposalConsiderations: materialData.disposalConsiderations,
        transportInfo: materialData.transportInfo,
        regulatoryInfo: materialData.regulatoryInfo,
        categoryId: materialData.categoryId || null,
        imageUrl: materialData.imageUrl || null,
        sdsUrl: materialData.sdsUrl || null,
        sdsExpiryDate: materialData.sdsExpiryDate ? new Date(materialData.sdsExpiryDate) : null,
        hazardLabels: {
          create: (hazardLabels || []).map((labelId: string) => ({
            label: { connect: { id: labelId } }
          }))
        },
        adrLabels: {
          create: (adrLabels || []).map((labelId: string) => ({
            label: { connect: { id: labelId } }
          }))
        },
        ppes: {
          create: (ppes || []).map((ppeId: string) => ({
            ppe: { connect: { id: ppeId } }
          }))
        }
      }
    });

    // Create Audit Log
    const username = req.user?.username || 'System';
    await prisma.hazmatAuditLog.create({
      data: {
        materialId: newMaterial.id,
        action: 'CREATE',
        details: 'Kullanıcı yeni bir tehlikeli madde oluşturdu.',
        username
      }
    });

    // Create the facility item
    const newItem = await prisma.facilityHazmatItem.create({
      data: {
        facilityId,
        materialId: newMaterial.id,
        amountValue: amountValue ? Number(amountValue) : null,
        unitId: unitId || null
      },
      include: {
        unit: true,
        material: {
          include: {
            hazardLabels: { include: { label: true } },
            adrLabels: { include: { label: true } },
            ppes: { include: { ppe: true } }
          }
        }
      }
    });

    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error creating global material and facility item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove a material from a facility (does not delete the global material)
router.delete('/facility/:facilityId/:materialId', authMiddleware, async (req: AuthRequest, res) => {
  const { facilityId, materialId } = (req.params as Record<string, string>);

  if (!req.user?.isAdmin && !req.user?.isManagement && !req.user?.facilities.includes(facilityId)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    await prisma.facilityHazmatItem.delete({
      where: {
        facilityId_materialId: { facilityId, materialId }
      }
    });
    res.json({ message: 'Material removed from facility successfully' });
  } catch (error) {
    console.error('Error removing material from facility:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get global material details by ID
router.get('/:materialId', authMiddleware, async (req: AuthRequest, res) => {
  const { materialId } = (req.params as Record<string, string>);
  const { facilityId } = req.query as Record<string, any>; // to also get facility item details

  try {
    const material = await prisma.hazmatMaterial.findUnique({
      where: { id: materialId },
      include: {
        hazardLabels: { include: { label: true } },
        adrLabels: { include: { label: true } },
        ppes: { include: { ppe: true } },
        category: true,
        auditLogs: { orderBy: { createdAt: 'desc' } }
      }
    });

    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }

    let facilityItem = null;
    if (facilityId) {
      facilityItem = await prisma.facilityHazmatItem.findUnique({
        where: { facilityId_materialId: { facilityId: String(facilityId), materialId } },
        include: { unit: true }
      });
    }

    res.json({ material, facilityItem });
  } catch (error) {
    console.error('Error fetching material details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update global material
router.put('/:materialId', authMiddleware, async (req: AuthRequest, res) => {
  const { materialId } = (req.params as Record<string, string>);
  const data = req.body;
  const username = req.user?.username || 'System';

  if (!data.facilityId) {
    return res.status(400).json({ error: 'facilityId is required to verify permissions' });
  }

  if (!req.user?.isAdmin && !req.user?.isManagement && !req.user?.facilities.includes(data.facilityId)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    const { facilityId, amountValue, unitId, hazardLabels, adrLabels, ppes, ...materialData } = data;

    // Delete existing relations to recreate them
    await prisma.hazmatMaterialHazardLabel.deleteMany({ where: { materialId } });
    await prisma.hazmatMaterialAdrLabel.deleteMany({ where: { materialId } });
    await prisma.hazmatMaterialPpe.deleteMany({ where: { materialId } });

    // Update the global material
    const updatedMaterial = await prisma.hazmatMaterial.update({
      where: { id: materialId },
      data: {
        productName: materialData.productName,
        brandName: materialData.brandName,
        usageMethod: materialData.usageMethod,
        composition: materialData.composition,
        hazardDescription: materialData.hazardDescription,
        firstAid: materialData.firstAid,
        fireFightingMeasures: materialData.fireFightingMeasures,
        accidentalReleaseMeasures: materialData.accidentalReleaseMeasures,
        handlingAndStorage: materialData.handlingAndStorage,
        exposureControlsPpe: materialData.exposureControls,
        physicalAndChemicalProperties: materialData.physicalProperties,
        stabilityAndReactivity: materialData.stabilityAndReactivity,
        toxicologicalInformation: materialData.toxicologicalInfo,
        ecologicalInformation: materialData.ecologicalInfo,
        disposalConsiderations: materialData.disposalConsiderations,
        transportInfo: materialData.transportInfo,
        regulatoryInfo: materialData.regulatoryInfo,
        categoryId: materialData.categoryId || null,
        imageUrl: materialData.imageUrl || null,
        sdsUrl: materialData.sdsUrl || null,
        sdsExpiryDate: materialData.sdsExpiryDate ? new Date(materialData.sdsExpiryDate) : null,
        hazardLabels: {
          create: (hazardLabels || []).map((labelId: string) => ({
            label: { connect: { id: labelId } }
          }))
        },
        adrLabels: {
          create: (adrLabels || []).map((labelId: string) => ({
            label: { connect: { id: labelId } }
          }))
        },
        ppes: {
          create: (ppes || []).map((ppeId: string) => ({
            ppe: { connect: { id: ppeId } }
          }))
        }
      }
    });

    // Upsert the facility item to update amount
    await prisma.facilityHazmatItem.upsert({
      where: { facilityId_materialId: { facilityId, materialId } },
      update: {
        amountValue: amountValue ? Number(amountValue) : null,
        unitId: unitId || null
      },
      create: {
        facilityId,
        materialId,
        amountValue: amountValue ? Number(amountValue) : null,
        unitId: unitId || null
      }
    });

    // Create Audit Log
    await prisma.hazmatAuditLog.create({
      data: {
        materialId,
        action: 'UPDATE',
        details: 'Kullanıcı ürün içeriğini veya miktarını güncelledi.',
        username
      }
    });

    res.json(updatedMaterial);
  } catch (error) {
    console.error('Error updating material:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
