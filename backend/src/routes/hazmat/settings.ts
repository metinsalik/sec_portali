import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Units
router.get('/units', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const units = await prisma.hazmatUnit.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(units);
  } catch (error) {
    console.error('Error fetching units:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/units', authMiddleware, async (req: AuthRequest, res) => {
  const { name, symbol } = req.body;
  if (!name || !symbol) return res.status(400).json({ error: 'name and symbol are required' });

  try {
    const unit = await prisma.hazmatUnit.create({
      data: { name, symbol }
    });
    res.status(201).json(unit);
  } catch (error) {
    console.error('Error creating unit:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/units/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    await prisma.hazmatUnit.delete({ where: { id: req.params.id } });
    res.json({ message: 'Unit deleted successfully' });
  } catch (error) {
    console.error('Error deleting unit:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Locations / Departments
router.get('/departments', authMiddleware, async (req: AuthRequest, res) => {
  const { facilityId, isCleaningCart } = req.query as Record<string, any>;

  try {
    const whereClause: any = { isActive: true };
    if (facilityId && facilityId !== 'all') whereClause.facilityId = String(facilityId);
    
    if (isCleaningCart === 'true') {
      whereClause.type = 'TEMIZLIK_ARABASI';
    }

    const locations = await prisma.facilityLocation.findMany({
      where: whereClause,
      orderBy: [
        { building: 'asc' },
        { floor: 'asc' },
        { name: 'asc' },
        { description: 'asc' }
      ]
    });
    
    // For backwards compatibility on frontend
    if (isCleaningCart === 'true') {
      return res.json(locations.map((c: any) => ({ ...c, isCleaningCart: true })));
    }
    
    return res.json(locations);
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/departments', authMiddleware, async (req: AuthRequest, res) => {
  const { facilityId, name, building, floor, department, description, isCleaningCart } = req.body;
  if (!facilityId) return res.status(400).json({ error: 'facilityId is required' });

  try {
    const newLocation = await prisma.facilityLocation.create({
      data: { 
        facilityId, 
        name: name ? name.trim() : (isCleaningCart ? 'Bilinmeyen Araç' : 'Bilinmeyen Lokasyon'), 
        building,
        floor,
        department,
        description,
        type: isCleaningCart ? 'TEMIZLIK_ARABASI' : 'DEPARTMAN'
      }
    });
    
    if (isCleaningCart) {
      return res.status(201).json({ ...newLocation, isCleaningCart: true });
    }
    return res.status(201).json(newLocation);
  } catch (error) {
    console.error('Error creating department:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/departments/:id', authMiddleware, async (req: AuthRequest, res) => {
  const { name, building, floor, department, description, isCleaningCart } = req.body;
  try {
    const updatedLoc = await prisma.facilityLocation.update({
      where: { id: req.params.id },
      data: { 
        name: name ? name.trim() : undefined, 
        building,
        floor,
        department,
        description 
      }
    });
    
    if (isCleaningCart || updatedLoc.type === 'TEMIZLIK_ARABASI') {
      return res.json({ ...updatedLoc, isCleaningCart: true });
    }
    return res.json(updatedLoc);
  } catch (error) {
    console.error('Error updating department:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/departments/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    await prisma.facilityLocation.update({
      where: { id: req.params.id },
      data: { isActive: false }
    });
    res.json({ message: 'Location deleted successfully' });
  } catch (error) {
    console.error('Error deleting location:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/departments/rename-node', authMiddleware, async (req: AuthRequest, res) => {
  res.status(400).json({ error: 'Bu islem artik kullanilmiyor' });
});

// Hazard Labels
router.get('/hazard-labels', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const labels = await prisma.hazmatHazardLabel.findMany({
      orderBy: { code: 'asc' }
    });
    res.json(labels);
  } catch (error) {
    console.error('Error fetching hazard labels:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/hazard-labels', authMiddleware, async (req: AuthRequest, res) => {
  const { code, name, description, imageUrl } = req.body;
  if (!code || !name) return res.status(400).json({ error: 'code and name are required' });

  try {
    const label = await prisma.hazmatHazardLabel.create({
      data: { code, name, description, imageUrl }
    });
    res.status(201).json(label);
  } catch (error) {
    console.error('Error creating hazard label:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/hazard-labels/:id', authMiddleware, async (req: AuthRequest, res) => {
  const { code, name, description, imageUrl } = req.body;
  try {
    const label = await prisma.hazmatHazardLabel.update({
      where: { id: req.params.id },
      data: { code, name, description, imageUrl }
    });
    res.json(label);
  } catch (error) {
    console.error('Error updating hazard label:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/hazard-labels/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    await prisma.hazmatHazardLabel.delete({ where: { id: req.params.id } });
    res.json({ message: 'Label deleted successfully' });
  } catch (error) {
    console.error('Error deleting hazard label:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ADR Labels
router.get('/adr-labels', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const labels = await prisma.hazmatAdrLabel.findMany({
      orderBy: { code: 'asc' }
    });
    res.json(labels);
  } catch (error) {
    console.error('Error fetching ADR labels:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/adr-labels', authMiddleware, async (req: AuthRequest, res) => {
  const { code, name, description, imageUrl } = req.body;
  if (!code || !name) return res.status(400).json({ error: 'code and name are required' });

  try {
    const label = await prisma.hazmatAdrLabel.create({
      data: { code, name, description, imageUrl }
    });
    res.status(201).json(label);
  } catch (error) {
    console.error('Error creating ADR label:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/adr-labels/:id', authMiddleware, async (req: AuthRequest, res) => {
  const { code, name, description, imageUrl } = req.body;
  try {
    const label = await prisma.hazmatAdrLabel.update({
      where: { id: req.params.id },
      data: { code, name, description, imageUrl }
    });
    res.json(label);
  } catch (error) {
    console.error('Error updating ADR label:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/adr-labels/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    await prisma.hazmatAdrLabel.delete({ where: { id: req.params.id } });
    res.json({ message: 'ADR Label deleted successfully' });
  } catch (error) {
    console.error('Error deleting ADR label:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PPEs
router.get('/ppes', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const ppes = await prisma.hazmatPpe.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(ppes);
  } catch (error) {
    console.error('Error fetching ppes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/ppes', authMiddleware, async (req: AuthRequest, res) => {
  const { name, description, imageUrl } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  try {
    const ppe = await prisma.hazmatPpe.create({
      data: { name, description, imageUrl }
    });
    res.status(201).json(ppe);
  } catch (error) {
    console.error('Error creating ppe:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/ppes/:id', authMiddleware, async (req: AuthRequest, res) => {
  const { name, description, imageUrl } = req.body;
  try {
    const ppe = await prisma.hazmatPpe.update({
      where: { id: req.params.id },
      data: { name, description, imageUrl }
    });
    res.json(ppe);
  } catch (error) {
    console.error('Error updating ppe:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/ppes/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    await prisma.hazmatPpe.delete({ where: { id: req.params.id } });
    res.json({ message: 'PPE deleted successfully' });
  } catch (error) {
    console.error('Error deleting ppe:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Categories
router.get('/categories', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const categories = await prisma.hazmatCategory.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/categories', authMiddleware, async (req: AuthRequest, res) => {
  const { name, scope, examples } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  try {
    const category = await prisma.hazmatCategory.create({
      data: { name, scope, examples }
    });
    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/categories/:id', authMiddleware, async (req: AuthRequest, res) => {
  const { name, scope, examples } = req.body;
  try {
    const category = await prisma.hazmatCategory.update({
      where: { id: req.params.id },
      data: { name, scope, examples }
    });
    res.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/categories/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    await prisma.hazmatCategory.delete({ where: { id: req.params.id } });
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- INCIDENT TYPES ---
router.get('/incident-types', authMiddleware, async (req, res) => {
  try {
    const types = await prisma.hazmatIncidentType.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(types);
  } catch (error) {
    console.error('Error fetching incident types:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/incident-types', authMiddleware, async (req: AuthRequest, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  try {
    const type = await prisma.hazmatIncidentType.create({
      data: { name }
    });
    res.status(201).json(type);
  } catch (error) {
    console.error('Error creating incident type:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/incident-types/:id', authMiddleware, async (req: AuthRequest, res) => {
  const { name } = req.body;
  try {
    const type = await prisma.hazmatIncidentType.update({
      where: { id: req.params.id },
      data: { name }
    });
    res.json(type);
  } catch (error) {
    console.error('Error updating incident type:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/incident-types/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    await prisma.hazmatIncidentType.delete({ where: { id: req.params.id } });
    res.json({ message: 'Incident type deleted successfully' });
  } catch (error) {
    console.error('Error deleting incident type:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
