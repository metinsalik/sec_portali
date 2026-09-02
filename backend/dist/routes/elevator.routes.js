"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const elevator_service_1 = require("../services/elevator.service");
const router = express_1.default.Router();
// Setup Multer for file uploads
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const dir = path_1.default.join(process.cwd(), 'uploads', 'elevator-reports');
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({ storage });
// Get elevators by facility
router.get('/facility/:facilityId', async (req, res) => {
    try {
        const { facilityId } = req.params;
        const { brand, maintenanceCompany, label, status } = req.query;
        const filters = {
            ...(brand ? { brand: String(brand) } : {}),
            ...(maintenanceCompany ? { maintenanceCompany: String(maintenanceCompany) } : {}),
            ...(label ? { label: String(label) } : {}),
            ...(status ? { status: String(status) } : {})
        };
        const elevators = await elevator_service_1.elevatorService.getElevators(facilityId, filters);
        res.json(elevators);
    }
    catch (error) {
        console.error('Error fetching elevators:', error);
        res.status(500).json({ error: error.message });
    }
});
// Get single elevator
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const elevator = await elevator_service_1.elevatorService.getElevatorById(id);
        if (!elevator) {
            return res.status(404).json({ error: 'Elevator not found' });
        }
        res.json(elevator);
    }
    catch (error) {
        console.error('Error fetching elevator:', error);
        res.status(500).json({ error: error.message });
    }
});
// Create a new elevator
router.post('/', async (req, res) => {
    try {
        const elevator = await elevator_service_1.elevatorService.createElevator(req.body);
        res.status(201).json(elevator);
    }
    catch (error) {
        console.error('Error creating elevator:', error);
        res.status(500).json({ error: error.message });
    }
});
// Add an inspection
router.post('/:id/inspections', async (req, res) => {
    try {
        const { id } = req.params;
        const inspection = await elevator_service_1.elevatorService.addInspection(id, req.body);
        res.status(201).json(inspection);
    }
    catch (error) {
        console.error('Error adding inspection:', error);
        res.status(500).json({ error: error.message });
    }
});
// Update an elevator
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const elevator = await elevator_service_1.elevatorService.updateElevator(id, req.body);
        res.json(elevator);
    }
    catch (error) {
        console.error('Error updating elevator:', error);
        res.status(500).json({ error: error.message });
    }
});
// Delete elevator
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await elevator_service_1.elevatorService.deleteElevator(id);
        res.json({ success: true });
    }
    catch (error) {
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
    }
    catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
