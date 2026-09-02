import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Only Admins can manage elevator settings
router.use(authMiddleware);

// ----- Elevator Brand -----
router.get('/brands', async (req, res) => {
  const { facilityId } = req.query;
  try {
    const brands = await prisma.elevatorBrand.findMany({
      where: facilityId && facilityId !== 'all' ? {
        OR: [
          { facilityId: String(facilityId) },
          { facilityId: 'all' }
        ]
      } : {},
      orderBy: { name: 'asc' }
    });
    res.json(brands);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch brands' });
  }
});

router.post('/brands', adminMiddleware, async (req, res) => {
  try {
    const { facilityId, name } = req.body;
    const brand = await prisma.elevatorBrand.create({
      data: { facilityId, name }
    });
    res.json(brand);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create brand' });
  }
});

router.put('/brands/:id/toggle', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const brand = await prisma.elevatorBrand.update({
      where: { id },
      data: { isActive }
    });
    res.json(brand);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update brand' });
  }
});

router.delete('/brands/:id', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.elevatorBrand.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete brand' });
  }
});

// ----- Elevator Maintenance Company -----
router.get('/maintenance-companies', async (req, res) => {
  const { facilityId } = req.query;
  try {
    const companies = await prisma.elevatorMaintenanceCompany.findMany({
      where: facilityId && facilityId !== 'all' ? {
        OR: [
          { facilityId: String(facilityId) },
          { facilityId: 'all' }
        ]
      } : {},
      orderBy: { name: 'asc' }
    });
    res.json(companies);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch maintenance companies' });
  }
});

router.post('/maintenance-companies', adminMiddleware, async (req, res) => {
  try {
    const { facilityId, name } = req.body;
    const company = await prisma.elevatorMaintenanceCompany.create({
      data: { facilityId, name }
    });
    res.json(company);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create company' });
  }
});

router.put('/maintenance-companies/:id/toggle', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const company = await prisma.elevatorMaintenanceCompany.update({
      where: { id },
      data: { isActive }
    });
    res.json(company);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update company' });
  }
});

router.delete('/maintenance-companies/:id', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.elevatorMaintenanceCompany.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete company' });
  }
});

// ----- Elevator Type -----
router.get('/types', async (req, res) => {
  const { facilityId } = req.query;
  try {
    const types = await prisma.elevatorType.findMany({
      where: facilityId && facilityId !== 'all' ? {
        OR: [
          { facilityId: String(facilityId) },
          { facilityId: 'all' }
        ]
      } : {},
      orderBy: { name: 'asc' }
    });
    res.json(types);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch types' });
  }
});

router.post('/types', adminMiddleware, async (req, res) => {
  try {
    const { facilityId, name } = req.body;
    const type = await prisma.elevatorType.create({
      data: { facilityId, name }
    });
    res.json(type);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create type' });
  }
});

router.put('/types/:id/toggle', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const type = await prisma.elevatorType.update({
      where: { id },
      data: { isActive }
    });
    res.json(type);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update type' });
  }
});

router.delete('/types/:id', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.elevatorType.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete type' });
  }
});

// ----- Elevator Status -----
router.get('/statuses', async (req, res) => {
  const { facilityId } = req.query;
  try {
    const statuses = await prisma.elevatorStatus.findMany({
      where: facilityId && facilityId !== 'all' ? {
        OR: [
          { facilityId: String(facilityId) },
          { facilityId: 'all' }
        ]
      } : {},
      orderBy: { name: 'asc' }
    });
    res.json(statuses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch statuses' });
  }
});

router.post('/statuses', adminMiddleware, async (req, res) => {
  try {
    const { facilityId, name } = req.body;
    const status = await prisma.elevatorStatus.create({
      data: { facilityId, name }
    });
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create status' });
  }
});

router.put('/statuses/:id/toggle', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const status = await prisma.elevatorStatus.update({
      where: { id },
      data: { isActive }
    });
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

router.delete('/statuses/:id', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.elevatorStatus.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete status' });
  }
});

// ----- Elevator Label -----
router.get('/labels', async (req, res) => {
  const { facilityId } = req.query;
  try {
    const labels = await prisma.elevatorLabel.findMany({
      where: facilityId && facilityId !== 'all' ? {
        OR: [
          { facilityId: String(facilityId) },
          { facilityId: 'all' }
        ]
      } : {},
      orderBy: { name: 'asc' }
    });
    res.json(labels);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch labels' });
  }
});

router.post('/labels', adminMiddleware, async (req, res) => {
  try {
    const { facilityId, name, color } = req.body;
    const label = await prisma.elevatorLabel.create({
      data: { facilityId, name, color }
    });
    res.json(label);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create label' });
  }
});

router.put('/labels/:id/toggle', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const label = await prisma.elevatorLabel.update({
      where: { id },
      data: { isActive }
    });
    res.json(label);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update label' });
  }
});

router.delete('/labels/:id', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.elevatorLabel.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete label' });
  }
});

export default router;
