"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const multer_1 = __importDefault(require("multer"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path_1.default.join(process.cwd(), 'uploads/isg_kurul');
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});
const upload = (0, multer_1.default)({ storage });
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
router.use(auth_1.authMiddleware);
// Get User helper
function getUser(req) {
    return req.user;
}
// GET /api/operations/board - List Board Meetings
router.get('/', async (req, res) => {
    try {
        const { facilityId } = req.query;
        // Facility check
        if (!facilityId) {
            return res.status(400).json({ error: 'Facility ID required' });
        }
        const whereClause = {};
        if (facilityId !== 'all') {
            whereClause.facilityId = facilityId;
        }
        const meetings = await prisma.ohsBoardMeeting.findMany({
            where: whereClause,
            orderBy: {
                meetingDate: 'desc'
            },
            include: {
                decisions: {
                    include: {
                        actions: {
                            orderBy: { createdAt: 'desc' }
                        }
                    }
                }
            }
        });
        res.json(meetings);
    }
    catch (error) {
        console.error('Error listing board meetings:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /api/operations/board/export - Export decisions as CSV
router.get('/export', async (req, res) => {
    try {
        const decisions = await prisma.ohsBoardDecision.findMany({
            include: {
                meeting: { include: { facility: true } },
                category: true,
                subCategory: true,
                department: true,
                actions: true
            }
        });
        const csvRows = [];
        const headers = [
            "ID (decisionId)", "MeetingID", "FacilityID", "FacilityName", "MeetingDate", "MeetingNo",
            "DecisionNumber", "DecisionText", "CategoryID", "CategoryName", "SubCategoryID",
            "SubCategoryName", "DepartmentID", "DepartmentName", "Priority", "Status", "DueDateType",
            "DueDate", "Periodicity", "Remarks", "ActionsCount", "ActionsText"
        ];
        csvRows.push(headers.join(";"));
        for (const d of decisions) {
            const escapeCsv = (str) => {
                if (!str)
                    return "";
                return `"${str.replace(/"/g, '""')}"`;
            };
            const actionsText = d.actions.map(a => `[${a.createdAt.toISOString()}] ${a.createdBy || 'Unknown'}: ${a.actionText}`).join(" | ");
            const row = [
                d.id, d.meetingId, d.meeting?.facilityId || "", escapeCsv(d.meeting?.facility?.name),
                d.meeting?.meetingDate ? d.meeting.meetingDate.toISOString() : "", escapeCsv(d.meeting?.meetingNo),
                escapeCsv(d.decisionNumber), escapeCsv(d.decisionText), d.categoryId, escapeCsv(d.category?.name),
                d.subCategoryId || "", escapeCsv(d.subCategory?.name), d.departmentId, escapeCsv(d.department?.name),
                escapeCsv(d.priority), escapeCsv(d.status), escapeCsv(d.dueDateType),
                d.dueDate ? d.dueDate.toISOString() : "", escapeCsv(d.periodicity), escapeCsv(d.remarks),
                d.actions?.length || 0, escapeCsv(actionsText)
            ];
            csvRows.push(row.join(";"));
        }
        const bom = "\uFEFF";
        const csvString = bom + csvRows.join("\n");
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="isg_kurul_kararlari.csv"');
        res.send(csvString);
    }
    catch (error) {
        console.error('Error exporting decisions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /api/operations/board/bulk-import - Import decisions
router.post('/bulk-import', async (req, res) => {
    try {
        const { data, targetFacilityId } = req.body;
        if (!Array.isArray(data)) {
            return res.status(400).json({ error: 'Data must be an array' });
        }
        let globalFacility = null;
        if (targetFacilityId) {
            globalFacility = await prisma.facility.findUnique({ where: { id: targetFacilityId } });
        }
        // Helper to parse Excel dates (which can be numbers or strings)
        const parseExcelDate = (val) => {
            if (!val)
                return null;
            if (typeof val === 'number') {
                // Excel serial date (days since Dec 30, 1899)
                const date = new Date(Math.round((val - 25569) * 86400 * 1000));
                return isNaN(date.getTime()) ? null : date;
            }
            const parsed = new Date(val);
            return isNaN(parsed.getTime()) ? null : parsed;
        };
        let createdCount = 0;
        // Process sequentially or batch
        for (const item of data) {
            if (!item.meetingNo || !item.decisionText)
                continue;
            try {
                // 1. Find Facility
                let facility = globalFacility;
                if (!facility && item.facilityName) {
                    facility = await prisma.facility.findFirst({
                        where: {
                            OR: [
                                { name: { contains: item.facilityName, mode: 'insensitive' } },
                                { shortName: { contains: item.facilityName, mode: 'insensitive' } }
                            ]
                        }
                    });
                }
                if (!facility)
                    continue; // Skip if facility not found
                // 2. Find or Create Meeting
                const parsedMeetingDate = parseExcelDate(item.meetingDate) || new Date();
                let meeting = await prisma.ohsBoardMeeting.findFirst({
                    where: { facilityId: facility.id, meetingNo: String(item.meetingNo) }
                });
                if (!meeting) {
                    meeting = await prisma.ohsBoardMeeting.create({
                        data: {
                            facilityId: facility.id,
                            meetingNo: String(item.meetingNo),
                            meetingDate: parsedMeetingDate
                        }
                    });
                }
                // 3. Find or Create Category
                const catName = item.categoryName || 'Diğer';
                let category = await prisma.category.findFirst({
                    where: { name: { equals: catName, mode: 'insensitive' } }
                });
                if (!category) {
                    category = await prisma.category.create({ data: { name: catName } });
                }
                // 4. Find or Create Department
                const deptName = item.departmentName || 'Belirtilmedi';
                let department = await prisma.ohsBoardDepartment.findFirst({
                    where: { name: { equals: deptName, mode: 'insensitive' }, facilityId: facility?.id || '' }
                });
                if (!department && facility?.id) {
                    department = await prisma.ohsBoardDepartment.create({ data: { name: deptName, facilityId: facility.id } });
                }
                else if (!department && !facility?.id) {
                    continue; // Cannot create department without facility
                }
                // 5. Check if decision already exists
                const existingDecision = await prisma.ohsBoardDecision.findFirst({
                    where: {
                        meetingId: meeting.id,
                        decisionText: item.decisionText
                    }
                });
                if (existingDecision) {
                    continue; // Skip if already exists
                }
                // Generate a decision number based on existing count
                const existingCount = await prisma.ohsBoardDecision.count({
                    where: { meetingId: meeting.id }
                });
                const decisionNumber = `${meeting.meetingNo}-${String(existingCount + 1).padStart(3, '0')}`;
                const parsedDueDate = parseExcelDate(item.dueDate);
                let status = item.status || 'Başlamadı';
                if (!['Başlamadı', 'Devam Ediyor', 'Tamamlandı', 'İptal Edildi', 'Sürekli Takip', 'Belirsiz'].includes(status)) {
                    status = 'Başlamadı';
                }
                let priority = item.priority || 'Düşük';
                if (!['Kritik', 'Yüksek Riskli', 'Riskli', 'Orta', 'Düşük'].includes(priority)) {
                    priority = 'Düşük';
                }
                let dueDateType = 'DATE';
                if (!parsedDueDate)
                    dueDateType = 'PERIOD';
                await prisma.ohsBoardDecision.create({
                    data: {
                        meetingId: meeting.id,
                        decisionNumber,
                        decisionText: item.decisionText,
                        categoryId: category.id,
                        departmentId: String(department.id),
                        status,
                        priority,
                        dueDateType,
                        dueDate: parsedDueDate,
                        remarks: item.remarks ? String(item.remarks) : null
                    }
                });
                createdCount++;
            }
            catch (err) {
                console.error(`Error importing row for meeting ${item.meetingNo}:`, err);
                // Continue with the next item
            }
        }
        res.json({ message: 'Success', imported: createdCount });
    }
    catch (error) {
        console.error('Error in bulk import:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// DELETE /api/operations/board/bulk-delete - Delete all decisions and meetings
router.delete('/bulk-delete', async (req, res) => {
    try {
        const { facilityId } = req.query;
        if (facilityId) {
            const meetings = await prisma.ohsBoardMeeting.findMany({
                where: { facilityId: String(facilityId) },
                select: { id: true }
            });
            const meetingIds = meetings.map((m) => m.id);
            await prisma.ohsBoardDecision.deleteMany({
                where: { meetingId: { in: meetingIds } }
            });
            await prisma.ohsBoardMeeting.deleteMany({
                where: { facilityId: String(facilityId) }
            });
            res.json({ message: 'Seçili tesise ait kurul toplantıları ve kararları başarıyla silindi.' });
        }
        else {
            await prisma.ohsBoardDecision.deleteMany({});
            await prisma.ohsBoardMeeting.deleteMany({});
            res.json({ message: 'Tüm kurul toplantıları ve kararları başarıyla silindi.' });
        }
    }
    catch (error) {
        console.error('Error bulk deleting:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /api/operations/board/departments
router.get('/departments', async (req, res) => {
    try {
        const facilityId = req.query.facilityId;
        if (!facilityId) {
            return res.status(400).json({ error: 'facilityId is required' });
        }
        const departments = await prisma.ohsBoardDepartment.findMany({
            where: { facilityId: String(facilityId) },
            orderBy: { name: 'asc' }
        });
        res.json(departments);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /api/operations/board/departments
router.post('/departments', auth_1.managementMiddleware, async (req, res) => {
    try {
        const { facilityId, name } = req.body;
        if (!facilityId || !name) {
            return res.status(400).json({ error: 'facilityId and name are required' });
        }
        const newDept = await prisma.ohsBoardDepartment.create({
            data: { facilityId, name }
        });
        res.json(newDept);
    }
    catch (error) {
        if (error.code === 'P2002')
            return res.status(400).json({ error: 'Bu departman zaten ekli.' });
        res.status(500).json({ error: 'Internal server error' });
    }
});
// PUT /api/operations/board/departments/:id
router.put('/departments/:id', auth_1.managementMiddleware, async (req, res) => {
    try {
        const { name } = req.body;
        const updated = await prisma.ohsBoardDepartment.update({
            where: { id: req.params.id },
            data: { name }
        });
        res.json(updated);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
// DELETE /api/operations/board/departments/:id
router.delete('/departments/:id', auth_1.managementMiddleware, async (req, res) => {
    try {
        await prisma.ohsBoardDepartment.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /api/operations/board/members - List members
router.get('/members', async (req, res) => {
    try {
        const { facilityId, year } = req.query;
        if (!facilityId) {
            return res.status(400).json({ error: 'Facility ID required' });
        }
        const whereClause = { facilityId: String(facilityId) };
        if (year) {
            whereClause.year = parseInt(String(year));
        }
        const members = await prisma.ohsBoardMember.findMany({
            where: whereClause,
            include: { department: true },
            orderBy: [{ year: 'desc' }, { id: 'asc' }]
        });
        res.json(members);
    }
    catch (error) {
        console.error('Error fetching members:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /api/operations/board/members - Create member
router.post('/members', async (req, res) => {
    try {
        const { facilityId, year, boardRole, jobTitle, name, departmentId } = req.body;
        if (!facilityId || !year || !boardRole || !jobTitle || !name || !departmentId) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        const member = await prisma.ohsBoardMember.create({
            data: {
                facilityId,
                year: parseInt(String(year)),
                boardRole,
                jobTitle,
                name,
                departmentId: String(departmentId)
            },
            include: { department: true }
        });
        res.status(201).json(member);
    }
    catch (error) {
        console.error('Error creating member:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// PUT /api/operations/board/members/:id - Update member
router.put('/members/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { boardRole, jobTitle, name, departmentId } = req.body;
        const member = await prisma.ohsBoardMember.update({
            where: { id: Number(id) },
            data: {
                boardRole: boardRole,
                jobTitle: jobTitle,
                name: name,
                departmentId: String(departmentId)
            }
        });
        res.json(member);
    }
    catch (error) {
        console.error('Error updating member:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /api/operations/board/members/:memberId/document - Upload member appointment document
router.post('/members/:memberId/document', upload.single('file'), async (req, res) => {
    try {
        const { memberId } = req.params;
        if (!req.file) {
            return res.status(400).json({ error: 'Dosya yüklenmedi.' });
        }
        const documentUrl = `/uploads/isg_kurul/${req.file.filename}`;
        const updatedMember = await prisma.ohsBoardMember.update({
            where: { id: Number(memberId) },
            data: {
                isDocumentUploaded: true,
                documentUrl
            }
        });
        res.json(updatedMember);
    }
    catch (error) {
        console.error('Error uploading member document:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// DELETE /api/operations/board/members/:id - Delete member
router.delete('/members/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        await prisma.ohsBoardMember.delete({ where: { id } });
        res.json({ message: 'Member deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting member:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /api/operations/board/meetings/generate-plan
router.post('/meetings/generate-plan', auth_1.managementMiddleware, async (req, res) => {
    try {
        const { facilityId, year } = req.body;
        if (!facilityId || !year) {
            return res.status(400).json({ error: 'facilityId and year are required' });
        }
        const facility = await prisma.facility.findUnique({ where: { id: facilityId } });
        if (!facility)
            return res.status(404).json({ error: 'Facility not found' });
        const dangerClass = facility.dangerClass || 'Az Tehlikeli';
        let monthsToSchedule = [];
        if (dangerClass === 'Çok Tehlikeli') {
            monthsToSchedule = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        }
        else if (dangerClass === 'Tehlikeli') {
            monthsToSchedule = [2, 4, 6, 8, 10, 12]; // Every 2 months
        }
        else {
            monthsToSchedule = [3, 6, 9, 12]; // Every 3 months
        }
        // Check existing meetings for this year
        const existing = await prisma.ohsBoardMeeting.findMany({
            where: { facilityId }
        });
        const existingMonths = new Set(existing.map(m => {
            const d = new Date(m.meetingDate);
            if (d.getFullYear() === Number(year))
                return d.getMonth() + 1;
            return -1;
        }).filter(m => m !== -1));
        let createdCount = 0;
        for (const month of monthsToSchedule) {
            if (!existingMonths.has(month)) {
                const meetingDate = new Date(Number(year), month - 1, 15, 10, 0, 0);
                await prisma.ohsBoardMeeting.create({
                    data: {
                        facilityId,
                        meetingDate,
                        meetingNo: `${year}-${month.toString().padStart(2, '0')}`,
                        status: 'Taslak'
                    }
                });
                createdCount++;
            }
        }
        res.json({ message: `${createdCount} adet toplantı başarıyla planlandı.`, createdCount });
    }
    catch (error) {
        console.error('Error generating plan:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /api/operations/board/:id - Get specific meeting with decisions
// GET /api/operations/board/meetings/:id/rollover-decisions - Get rollover decisions for a meeting's facility
router.get('/meetings/:id/rollover-decisions', async (req, res) => {
    try {
        const { id } = req.params;
        // First find the meeting to get its facilityId
        const meeting = await prisma.ohsBoardMeeting.findUnique({
            where: { id }
        });
        if (!meeting) {
            return res.status(404).json({ error: 'Meeting not found' });
        }
        // Now find all decisions from OTHER meetings in the same facility 
        // that are NOT completed/cancelled (i.e., 'Başlamadı', 'Devam Ediyor', 'Sürekli Takip', 'Belirsiz')
        const rolloverDecisions = await prisma.ohsBoardDecision.findMany({
            where: {
                meeting: {
                    facilityId: meeting.facilityId,
                    id: { not: id } // Exclude current meeting
                },
                status: {
                    in: ['Başlamadı', 'Devam Ediyor', 'Sürekli Takip', 'Belirsiz']
                }
            },
            include: {
                meeting: true,
                category: true,
                subCategory: true,
                department: true,
                actions: {
                    orderBy: { createdAt: 'desc' }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(rolloverDecisions);
    }
    catch (error) {
        console.error('Error fetching rollover decisions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const meeting = await prisma.ohsBoardMeeting.findUnique({
            where: { id },
            include: {
                decisions: {
                    include: {
                        category: true,
                        subCategory: true,
                        department: true,
                        actions: {
                            orderBy: { createdAt: 'desc' }
                        }
                    }
                }
            }
        });
        if (!meeting) {
            return res.status(404).json({ error: 'Meeting not found' });
        }
        res.json(meeting);
    }
    catch (error) {
        console.error('Error fetching meeting:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /api/operations/board - Create Meeting & Decisions
router.post('/', async (req, res) => {
    try {
        const { facilityId, meetingDate, meetingNo, decisions } = req.body;
        const newMeeting = await prisma.ohsBoardMeeting.create({
            data: {
                facilityId,
                meetingDate: new Date(meetingDate),
                meetingNo,
                decisions: {
                    create: decisions.map((d, index) => ({
                        decisionNumber: d.decisionNumber || `${meetingNo}-${index + 1}`,
                        decisionText: d.decisionText,
                        categoryId: Number(d.categoryId),
                        subCategoryId: d.subCategoryId ? Number(d.subCategoryId) : null,
                        departmentId: String(d.departmentId),
                        priority: d.priority || 'Orta',
                        status: d.status || 'Başlamadı',
                        dueDateType: d.dueDateType || 'DATE',
                        dueDate: d.dueDate ? new Date(d.dueDate) : null,
                        periodicity: d.dueDateType === 'PERIOD' ? (d.periodicity || 'Aylık') : (d.periodicity || null),
                        remarks: d.remarks || null
                    }))
                }
            },
            include: {
                decisions: true
            }
        });
        res.status(201).json(newMeeting);
    }
    catch (error) {
        console.error('Error creating meeting:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// PUT /api/operations/board/:id - Update Meeting
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { meetingDate, meetingNo } = req.body;
        const updatedMeeting = await prisma.ohsBoardMeeting.update({
            where: { id },
            data: {
                meetingDate: new Date(meetingDate),
                meetingNo
            },
            include: {
                decisions: true
            }
        });
        res.json(updatedMeeting);
    }
    catch (error) {
        console.error('Error updating meeting:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /api/operations/board/:id/decisions - Add Decision to Meeting
router.post('/:id/decisions', async (req, res) => {
    try {
        const { id } = req.params;
        const d = req.body;
        // Validate due date
        let meeting = await prisma.ohsBoardMeeting.findUnique({
            where: { id },
            include: { decisions: true }
        });
        if (!meeting)
            return res.status(404).json({ error: 'Meeting not found' });
        if (d.dueDate) {
            const dueDate = new Date(d.dueDate);
            const meetingDate = new Date(meeting.meetingDate);
            dueDate.setHours(0, 0, 0, 0);
            meetingDate.setHours(0, 0, 0, 0);
            if (dueDate < meetingDate) {
                return res.status(400).json({ error: 'Termin tarihi toplantı tarihinden önce olamaz.' });
            }
        }
        // Auto-generate decision number if not provided
        let decisionNumber = d.decisionNumber;
        if (!decisionNumber) {
            decisionNumber = `${meeting.meetingNo}-${meeting.decisions.length + 1}`;
        }
        const decision = await prisma.ohsBoardDecision.create({
            data: {
                meetingId: id,
                decisionNumber,
                decisionText: d.decisionText,
                categoryId: Number(d.categoryId),
                subCategoryId: d.subCategoryId ? Number(d.subCategoryId) : null,
                departmentId: String(d.departmentId),
                priority: d.priority || 'Orta',
                status: d.status || 'Başlamadı',
                dueDateType: d.dueDateType || 'DATE',
                dueDate: d.dueDate ? new Date(d.dueDate) : null,
                periodicity: d.dueDateType === 'PERIOD' ? (d.periodicity || 'Aylık') : (d.periodicity || null),
                remarks: d.remarks || null
            }
        });
        res.status(201).json(decision);
    }
    catch (error) {
        console.error('Error creating decision:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// PUT /api/operations/board/decisions/:decisionId - Update Decision
router.put('/decisions/:decisionId', async (req, res) => {
    try {
        const { decisionId } = req.params;
        const d = req.body;
        const existingDecision = await prisma.ohsBoardDecision.findUnique({
            where: { id: decisionId },
            include: { meeting: true }
        });
        if (!existingDecision) {
            return res.status(404).json({ error: 'Karar bulunamadı.' });
        }
        if (existingDecision.sentForApprovalAt || existingDecision.approvalStatus === 'Onaylandı') {
            return res.status(403).json({ error: 'Bu karar onaya gönderildiği veya onaylandığı için düzenlenemez.' });
        }
        if (existingDecision.meeting?.status === 'Gerçekleşti') {
            const fortyEightHours = 48 * 60 * 60 * 1000;
            if (Date.now() - new Date(existingDecision.meeting.updatedAt).getTime() > fortyEightHours) {
                return res.status(403).json({ error: 'Toplantı gerçekleşeli 48 saatten fazla olduğu için karar düzenlenemez.' });
            }
        }
        // Validate due date
        if (d.dueDate && existingDecision.meeting) {
            const dueDate = new Date(d.dueDate);
            const meetingDate = new Date(existingDecision.meeting.meetingDate);
            dueDate.setHours(0, 0, 0, 0);
            meetingDate.setHours(0, 0, 0, 0);
            if (dueDate < meetingDate) {
                return res.status(400).json({ error: 'Termin tarihi toplantı tarihinden önce olamaz.' });
            }
        }
        const decision = await prisma.ohsBoardDecision.update({
            where: { id: decisionId },
            data: {
                decisionText: d.decisionText,
                categoryId: Number(d.categoryId),
                subCategoryId: d.subCategoryId ? Number(d.subCategoryId) : null,
                departmentId: String(d.departmentId),
                priority: d.priority,
                status: d.status,
                dueDateType: d.dueDateType,
                dueDate: d.dueDate ? new Date(d.dueDate) : null,
                periodicity: d.dueDateType === 'PERIOD' ? (d.periodicity || 'Aylık') : d.periodicity,
                remarks: d.remarks
            }
        });
        res.json(decision);
    }
    catch (error) {
        console.error('Error updating decision:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// DELETE /api/operations/board/decisions/:decisionId
router.delete('/decisions/:decisionId', async (req, res) => {
    try {
        const { decisionId } = req.params;
        await prisma.ohsBoardDecision.delete({
            where: { id: decisionId }
        });
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting decision:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// DELETE /api/operations/board/:id
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.ohsBoardMeeting.delete({
            where: { id }
        });
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting meeting:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /api/operations/board/decisions/:decisionId/actions - Create action
router.post('/decisions/:decisionId/actions', async (req, res) => {
    try {
        const { decisionId } = req.params;
        const { actionText, newStatus, newDueDate, newDueDateType, newPriority } = req.body;
        const user = getUser(req);
        // Validate due date
        if (newDueDate) {
            const existingDecision = await prisma.ohsBoardDecision.findUnique({
                where: { id: decisionId },
                include: { meeting: true }
            });
            if (existingDecision?.meeting) {
                const dueDate = new Date(newDueDate);
                const meetingDate = new Date(existingDecision.meeting.meetingDate);
                dueDate.setHours(0, 0, 0, 0);
                meetingDate.setHours(0, 0, 0, 0);
                if (dueDate < meetingDate) {
                    return res.status(400).json({ error: 'Termin tarihi toplantı tarihinden önce olamaz.' });
                }
            }
        }
        // 1. Check if we are reopening a closed decision
        let isReopening = false;
        let userToNotify = null;
        let decisionBeforeUpdate = null;
        if (newStatus && newStatus !== 'Tamamlandı') {
            decisionBeforeUpdate = await prisma.ohsBoardDecision.findUnique({
                where: { id: decisionId },
                include: { actions: { orderBy: { createdAt: 'desc' }, take: 1 } }
            });
            if (decisionBeforeUpdate?.status === 'Tamamlandı') {
                isReopening = true;
                const lastAction = decisionBeforeUpdate.actions[0];
                if (lastAction && lastAction.createdBy) {
                    const closingUser = await prisma.user.findFirst({
                        where: {
                            OR: [
                                { fullName: lastAction.createdBy },
                                { username: lastAction.createdBy }
                            ]
                        }
                    });
                    if (closingUser) {
                        userToNotify = closingUser.username;
                    }
                }
            }
        }
        // 2. Create the action
        const action = await prisma.ohsBoardDecisionAction.create({
            data: {
                decisionId,
                actionText,
                createdBy: user.fullName || user.username
            }
        });
        // 3. Update the decision if requested
        if (newStatus || newDueDate || newDueDateType || newPriority) {
            const updateData = {};
            if (newStatus)
                updateData.status = newStatus;
            if (newPriority)
                updateData.priority = newPriority;
            if (newDueDateType)
                updateData.dueDateType = newDueDateType;
            if (newDueDate)
                updateData.dueDate = new Date(newDueDate);
            await prisma.ohsBoardDecision.update({
                where: { id: decisionId },
                data: updateData
            });
        }
        // 4. Create Notification if reopened
        if (isReopening && userToNotify) {
            await prisma.notification.create({
                data: {
                    title: "Karar Yeniden Açıldı",
                    message: `${decisionBeforeUpdate.decisionNumber} numaralı karar, ${user.fullName || user.username} tarafından yeniden açıldı. Gerekçe: ${actionText}`,
                    type: "WARNING",
                    module: "ISG_KURUL",
                    username: userToNotify,
                    link: `/isg-kurul/meetings/${decisionBeforeUpdate.meetingId}/decisions/${decisionId}`
                }
            });
        }
        res.status(201).json(action);
    }
    catch (error) {
        console.error('Error creating action:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// PUT /api/operations/board/actions/:actionId - Update action
router.put('/actions/:actionId', async (req, res) => {
    try {
        const { actionId } = req.params;
        const { actionText, newStatus, newPriority, newDueDate, newDueDateType } = req.body;
        if (!actionText) {
            return res.status(400).json({ error: 'Action text is required' });
        }
        const updatedAction = await prisma.$transaction(async (tx) => {
            const action = await tx.ohsBoardDecisionAction.findUnique({
                where: { id: actionId },
                include: { decision: { include: { meeting: true } } }
            });
            if (!action) {
                throw new Error('Action not found');
            }
            const oneHour = 60 * 60 * 1000;
            if (Date.now() - new Date(action.createdAt).getTime() > oneHour) {
                throw new Error('Aksiyon ekleneli 1 saatten fazla olduğu için düzenlenemez.');
            }
            // Validate due date
            if (newDueDate && action.decision?.meeting) {
                const dueDate = new Date(newDueDate);
                const meetingDate = new Date(action.decision.meeting.meetingDate);
                dueDate.setHours(0, 0, 0, 0);
                meetingDate.setHours(0, 0, 0, 0);
                if (dueDate < meetingDate) {
                    throw new Error('Termin tarihi toplantı tarihinden önce olamaz.');
                }
            }
            // 1. Update the action text
            const updated = await tx.ohsBoardDecisionAction.update({
                where: { id: actionId },
                data: { actionText }
            });
            // 2. Update the decision if requested
            if (newStatus || newDueDate || newDueDateType || newPriority) {
                const updateData = {};
                if (newStatus)
                    updateData.status = newStatus;
                if (newPriority)
                    updateData.priority = newPriority;
                if (newDueDateType)
                    updateData.dueDateType = newDueDateType;
                if (newDueDate)
                    updateData.dueDate = new Date(newDueDate);
                await tx.ohsBoardDecision.update({
                    where: { id: action.decisionId },
                    data: updateData
                });
            }
            return updated;
        });
        res.json(updatedAction);
    }
    catch (error) {
        console.error('Error updating action:', error);
        if (error.message === 'Termin tarihi toplantı tarihinden önce olamaz.' || error.message.includes('1 saat')) {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});
// DELETE /api/operations/board/actions/:actionId - Delete action
router.delete('/actions/:actionId', async (req, res) => {
    try {
        const { actionId } = req.params;
        const action = await prisma.ohsBoardDecisionAction.findUnique({
            where: { id: actionId }
        });
        if (!action) {
            return res.status(404).json({ error: 'Action not found' });
        }
        const oneHour = 60 * 60 * 1000;
        if (Date.now() - new Date(action.createdAt).getTime() > oneHour) {
            return res.status(403).json({ error: 'Aksiyon ekleneli 1 saatten fazla olduğu için silinemez.' });
        }
        await prisma.ohsBoardDecisionAction.delete({
            where: { id: actionId }
        });
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting action:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /api/operations/board/facility/:facilityId/previous-uncompleted - Helper for auto-copy
router.get('/facility/:facilityId/previous-uncompleted', async (req, res) => {
    try {
        const { facilityId } = req.params;
        const lastMeeting = await prisma.ohsBoardMeeting.findFirst({
            where: { facilityId },
            orderBy: { meetingDate: 'desc' },
            include: {
                decisions: {
                    where: {
                        status: {
                            notIn: ['Tamamlandı', 'İptal Edildi']
                        }
                    }
                }
            }
        });
        if (!lastMeeting) {
            return res.json([]);
        }
        res.json(lastMeeting.decisions);
    }
    catch (error) {
        console.error('Error fetching uncompleted decisions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /api/operations/board/meetings/:meetingId/send-approval
router.post('/meetings/:meetingId/send-approval', async (req, res) => {
    try {
        const { meetingId } = req.params;
        const meeting = await prisma.ohsBoardMeeting.update({
            where: { id: meetingId },
            data: { status: 'Onaya Gönderildi' }
        });
        await prisma.ohsBoardDecision.updateMany({
            where: { meetingId },
            data: {
                sentForApprovalAt: new Date(),
                approvalStatus: 'Bekliyor'
            }
        });
        res.json({ message: 'Kurul kararları onaya gönderildi.', meeting });
    }
    catch (error) {
        console.error('Error sending meeting for approval:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /api/operations/board/meetings/:meetingId/approve
router.post('/meetings/:meetingId/approve', async (req, res) => {
    try {
        const { meetingId } = req.params;
        const decisions = await prisma.ohsBoardDecision.findMany({
            where: { meetingId, approvalStatus: 'Bekliyor' }
        });
        if (decisions.length === 0) {
            return res.status(400).json({ error: 'Onay bekleyen karar bulunmuyor.' });
        }
        await prisma.ohsBoardDecision.updateMany({
            where: { meetingId, approvalStatus: 'Bekliyor' },
            data: { approvalStatus: 'Onaylandı' }
        });
        const meeting = await prisma.ohsBoardMeeting.update({
            where: { id: meetingId },
            data: { status: 'Tamamlandı' }
        });
        const auditLogs = decisions.map(d => ({
            decisionId: d.id,
            action: 'APPROVED',
            changedBy: req.user?.username || 'SYSTEM',
            remarks: 'Toplantı kararları onaylandı'
        }));
        if (auditLogs.length > 0) {
            await prisma.ohsBoardAuditLog.createMany({ data: auditLogs });
        }
        res.json({ message: 'Kurul kararları onaylandı.', meeting });
    }
    catch (error) {
        console.error('Error approving meeting decisions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
