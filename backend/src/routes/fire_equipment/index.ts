import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Tüm route'lar auth gerektirir
router.use(authMiddleware);

// --- CATEGORIES ---
router.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.fireEquipmentCategory.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      include: { subcategories: true }
    });
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Kategoriler alınamadı.' });
  }
});

router.post('/categories', async (req, res) => {
  try {
    const { name, description, parentId, maintenanceFrequency } = req.body;
    const category = await prisma.fireEquipmentCategory.create({
      data: { name, description, parentId, maintenanceFrequency }
    });
    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Kategori oluşturulamadı.' });
  }
});

router.put('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, parentId, maintenanceFrequency } = req.body;
    const category = await prisma.fireEquipmentCategory.update({
      where: { id },
      data: { name, description, parentId, maintenanceFrequency }
    });
    res.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Kategori güncellenemedi.' });
  }
});

router.delete('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.fireEquipmentCategory.update({
      where: { id },
      data: { isActive: false }
    });
    res.json({ message: 'Kategori silindi.' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Kategori silinemedi.' });
  }
});

// --- RESPONSIBLES ---
router.get('/responsibles/:facilityId', async (req, res) => {
  try {
    const { facilityId } = req.params;
    const responsibles = await prisma.fireEquipmentResponsible.findMany({
      where: { facilityId, isActive: true },
      orderBy: { name: 'asc' }
    });
    res.json(responsibles);
  } catch (error) {
    console.error('Error fetching responsibles:', error);
    res.status(500).json({ error: 'Sorumlular alınamadı.' });
  }
});

router.post('/responsibles/:facilityId', async (req, res) => {
  try {
    const { facilityId } = req.params;
    const { name, department } = req.body;
    const responsible = await prisma.fireEquipmentResponsible.create({
      data: { facilityId, name, department }
    });
    res.status(201).json(responsible);
  } catch (error) {
    console.error('Error creating responsible:', error);
    res.status(500).json({ error: 'Sorumlu oluşturulamadı.' });
  }
});

router.put('/responsibles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, department } = req.body;
    const responsible = await prisma.fireEquipmentResponsible.update({
      where: { id },
      data: { name, department }
    });
    res.json(responsible);
  } catch (error) {
    console.error('Error updating responsible:', error);
    res.status(500).json({ error: 'Sorumlu güncellenemedi.' });
  }
});

router.delete('/responsibles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.fireEquipmentResponsible.update({
      where: { id },
      data: { isActive: false }
    });
    res.json({ message: 'Sorumlu silindi.' });
  } catch (error) {
    console.error('Error deleting responsible:', error);
    res.status(500).json({ error: 'Sorumlu silinemedi.' });
  }
});

// --- LOCATIONS ---
router.get('/locations/:facilityId', async (req, res) => {
  try {
    const { facilityId } = req.params;
    const locations = await prisma.fireEquipmentLocation.findMany({
      where: { facilityId, isActive: true },
      orderBy: { building: 'asc' }
    });
    res.json(locations);
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ error: 'Lokasyonlar alınamadı.' });
  }
});

router.post('/locations/:facilityId', async (req, res) => {
  try {
    const { facilityId } = req.params;
    const { building, block, floor, department, description } = req.body;
    
    // Check if facility exists
    const facility = await prisma.facility.findUnique({ where: { id: facilityId }});
    if (!facility) {
      return res.status(404).json({ error: 'Tesis bulunamadı.' });
    }

    const location = await prisma.fireEquipmentLocation.create({
      data: {
        facilityId,
        building,
        block,
        floor,
        department,
        description
      }
    });
    res.status(201).json(location);
  } catch (error) {
    console.error('Error creating location:', error);
    res.status(500).json({ error: 'Lokasyon oluşturulamadı.' });
  }
});

router.put('/locations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { building, block, floor, department, description } = req.body;
    const location = await prisma.fireEquipmentLocation.update({
      where: { id },
      data: { building, block, floor, department, description }
    });
    res.json(location);
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ error: 'Lokasyon güncellenemedi.' });
  }
});

router.delete('/locations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.fireEquipmentLocation.update({
      where: { id },
      data: { isActive: false }
    });
    res.json({ message: 'Lokasyon silindi.' });
  } catch (error) {
    console.error('Error deleting location:', error);
    res.status(500).json({ error: 'Lokasyon silinemedi.' });
  }
});

// --- EQUIPMENT ---
router.get('/equipment/:facilityId', async (req, res) => {
  try {
    const { facilityId } = req.params;
    const equipment = await prisma.fireEquipment.findMany({
      where: { facilityId },
      include: {
        category: {
          include: { parent: true }
        },
        location: true,
        responsible: true,
        movements: { orderBy: { movementDate: 'desc' }, take: 1 },
        maintenances: { orderBy: { maintenanceDate: 'desc' }, take: 1 }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(equipment);
  } catch (error) {
    console.error('Error fetching equipment:', error);
    res.status(500).json({ error: 'Ekipmanlar alınamadı.' });
  }
});

router.get('/equipment/detail/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const equipment = await prisma.fireEquipment.findUnique({
      where: { id },
      include: {
        category: {
          include: { parent: true }
        },
        location: true,
        responsible: true,
        movements: { orderBy: { movementDate: 'desc' } },
        maintenances: { orderBy: { maintenanceDate: 'desc' } }
      }
    });
    
    if (!equipment) {
      return res.status(404).json({ error: 'Ekipman bulunamadı.' });
    }
    
    res.json(equipment);
  } catch (error) {
    console.error('Error fetching equipment details:', error);
    res.status(500).json({ error: 'Ekipman detayları alınamadı.' });
  }
});

router.post('/equipment/:facilityId', async (req, res) => {
  try {
    const { facilityId } = req.params;
    const { 
      equipmentNo, qrCode, serialNo, brand, model, productionYear, 
      categoryId, locationId, capacity, standard, criticality, responsibleId, responsibleUnit, status 
    } = req.body;
    
    // @ts-ignore - Assuming req.user is set by authMiddleware
    const username = req.user?.username || 'System';

    // Calculate initial nextMaintenanceDate based on category
    let nextMaintenanceDate = null;
    const category = await prisma.fireEquipmentCategory.findUnique({ where: { id: categoryId } });
    if (category && category.maintenanceFrequency) {
      const freq = category.maintenanceFrequency;
      const date = new Date();
      if (freq === 'AYLIK') date.setMonth(date.getMonth() + 1);
      else if (freq === '3_AYLIK') date.setMonth(date.getMonth() + 3);
      else if (freq === '6_AYLIK') date.setMonth(date.getMonth() + 6);
      else if (freq === 'YILLIK') date.setFullYear(date.getFullYear() + 1);
      nextMaintenanceDate = date;
    }

    const equipment = await prisma.fireEquipment.create({
      data: {
        facilityId,
        equipmentNo,
        qrCode,
        serialNo,
        brand,
        model,
        productionYear: productionYear ? parseInt(productionYear) : null,
        categoryId,
        locationId,
        capacity,
        standard,
        criticality,
        responsibleId,
        responsibleUnit,
        status: status || 'AKTIF',
        nextMaintenanceDate,
        movements: locationId ? {
          create: {
            newLocationId: locationId,
            reason: 'İlk Kayıt',
            movedBy: username,
            description: 'Ekipman sisteme eklendi ve ilk konumu belirlendi.'
          }
        } : undefined
      }
    });
    
    res.status(201).json(equipment);
  } catch (error) {
    console.error('Error creating equipment:', error);
    res.status(500).json({ error: 'Ekipman oluşturulamadı. Aynı Ekipman No veya QR kod kullanılıyor olabilir.' });
  }
});

router.put('/equipment/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    
    const equipment = await prisma.fireEquipment.update({
      where: { id },
      data
    });
    
    res.json(equipment);
  } catch (error) {
    console.error('Error updating equipment:', error);
    res.status(500).json({ error: 'Ekipman güncellenemedi.' });
  }
});

// --- MAINTENANCE ---
router.post('/equipment/:id/maintenance', async (req, res) => {
  try {
    const { id } = req.params;
    const { maintenanceDate, company, technician, result, description, nextMaintenanceDate } = req.body;

    const maintenance = await prisma.$transaction(async (tx) => {
      // Create maintenance record
      const record = await tx.fireEquipmentMaintenance.create({
        data: {
          equipmentId: id,
          maintenanceDate: new Date(maintenanceDate),
          company,
          technician,
          result,
          description
        }
      });

      // Calculate nextMaintenanceDate if not provided explicitly, based on frequency
      let calculatedNextDate = nextMaintenanceDate ? new Date(nextMaintenanceDate) : null;
      if (!calculatedNextDate) {
        const eq = await tx.fireEquipment.findUnique({ 
          where: { id },
          include: { category: true }
        });
        if (eq?.category?.maintenanceFrequency) {
          const freq = eq.category.maintenanceFrequency;
          const date = new Date(maintenanceDate);
          if (freq === 'AYLIK') date.setMonth(date.getMonth() + 1);
          else if (freq === '3_AYLIK') date.setMonth(date.getMonth() + 3);
          else if (freq === '6_AYLIK') date.setMonth(date.getMonth() + 6);
          else if (freq === 'YILLIK') date.setFullYear(date.getFullYear() + 1);
          calculatedNextDate = date;
        }
      }

      // Update equipment next maintenance date
      if (calculatedNextDate) {
        await tx.fireEquipment.update({
          where: { id },
          data: { nextMaintenanceDate: calculatedNextDate }
        });
      }

      return record;
    });

    res.status(201).json(maintenance);
  } catch (error) {
    console.error('Error creating maintenance:', error);
    res.status(500).json({ error: 'Bakım kaydı oluşturulamadı.' });
  }
});

// --- MOVEMENTS ---
router.post('/equipment/:id/movement', async (req, res) => {
  try {
    const { id } = req.params;
    const { newLocationId, reason, description } = req.body;
    
    // @ts-ignore
    const username = req.user?.username || 'System';

    // Get current equipment to find old location
    const currentEquipment = await prisma.fireEquipment.findUnique({ where: { id }});
    if (!currentEquipment) {
      return res.status(404).json({ error: 'Ekipman bulunamadı.' });
    }

    const movement = await prisma.$transaction(async (tx) => {
      // Create movement record
      const record = await tx.fireEquipmentMovement.create({
        data: {
          equipmentId: id,
          oldLocationId: currentEquipment.locationId,
          newLocationId,
          reason,
          movedBy: username,
          description
        }
      });

      // Update equipment location
      await tx.fireEquipment.update({
        where: { id },
        data: { locationId: newLocationId }
      });

      return record;
    });

    res.status(201).json(movement);
  } catch (error) {
    console.error('Error creating movement:', error);
    res.status(500).json({ error: 'Hareket kaydı oluşturulamadı.' });
  }
});

export default router;
