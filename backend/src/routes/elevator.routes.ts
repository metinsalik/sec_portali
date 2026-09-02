import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { elevatorService } from '../services/elevator.service';

const router = express.Router();

// Setup Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), 'uploads', 'elevator-reports');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });
const uploadMemory = multer({ storage: multer.memoryStorage() });

// Get elevators by facility
router.get('/facility/:facilityId', async (req, res) => {
  try {
    const { facilityId } = req.params;
    const { brand, maintenanceCompany, label, type, inspectionStatus } = req.query;
    
    const filters = {
      ...(brand ? { brand: String(brand) } : {}),
      ...(maintenanceCompany ? { maintenanceCompany: String(maintenanceCompany) } : {}),
      ...(label ? { label: String(label) } : {}),
      ...(type ? { type: String(type) } : {}),
      ...(inspectionStatus ? { inspectionStatus: String(inspectionStatus) } : {})
    };

    const elevators = await elevatorService.getElevators(facilityId, filters);
    res.json(elevators);
  } catch (error: any) {
    console.error('Error fetching elevators:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate Excel template
router.get('/import-template', async (req, res) => {
  try {
    const buffer = await elevatorService.generateTemplate();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="asansor_sablon.xlsx"');
    res.send(buffer);
  } catch (error: any) {
    console.error('Error generating template:', error);
    res.status(500).json({ error: error.message });
  }
});

// Import Excel data
router.post('/import', uploadMemory.single('file'), async (req, res) => {
  try {
    const { facilityId } = req.body;
    if (!req.file || !facilityId) {
      return res.status(400).json({ error: 'File and facilityId are required' });
    }
    
    const result = await elevatorService.importExcel(facilityId, req.file.buffer);
    res.json(result);
  } catch (error: any) {
    console.error('Error importing excel:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single elevator
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const elevator = await elevatorService.getElevatorById(id);
    if (!elevator) {
      return res.status(404).json({ error: 'Elevator not found' });
    }
    res.json(elevator);
  } catch (error: any) {
    console.error('Error fetching elevator:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new elevator
router.post('/', async (req, res) => {
  try {
    const elevator = await elevatorService.createElevator(req.body);
    res.status(201).json(elevator);
  } catch (error: any) {
    console.error('Error creating elevator:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add an inspection
router.post('/:id/inspections', async (req, res) => {
  try {
    const { id } = req.params;
    const inspection = await elevatorService.addInspection(id, req.body);
    res.status(201).json(inspection);
  } catch (error: any) {
    console.error('Error adding inspection:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update an elevator
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const elevator = await elevatorService.updateElevator(id, req.body);
    res.json(elevator);
  } catch (error: any) {
    console.error('Error updating elevator:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete elevator
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await elevatorService.deleteElevator(id);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting elevator:', error);
    res.status(500).json({ error: error.message });
  }
});

// Upload report
router.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const fileUrl = `/uploads/elevator-reports/${req.file.filename}`;
    res.json({ url: fileUrl });
  } catch (error: any) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
