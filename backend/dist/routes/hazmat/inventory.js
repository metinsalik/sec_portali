"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const auth_1 = require("../../middleware/auth");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
// Get inventory matrix for a specific facility and material
router.get('/', auth_1.authMiddleware, async (req, res) => {
    const { facilityId, materialId } = req.query;
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
    }
    catch (error) {
        console.error('Error fetching inventory matrix:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get summary of all allocated materials in a facility
router.get('/summary', auth_1.authMiddleware, async (req, res) => {
    const { facilityId } = req.query;
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
                        auditLogs: {
                            where: { action: 'UPDATE' },
                            select: { id: true, createdAt: true },
                            take: 1
                        },
                        inventory: {
                            where: { facilityId: String(facilityId) },
                            include: { location: true }
                        }
                    }
                }
            }
        });
        res.json({ facilityItems });
    }
    catch (error) {
        console.error('Error fetching inventory summary:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get departments with inventory count for a facility
router.get('/departments', auth_1.authMiddleware, async (req, res) => {
    const { facilityId } = req.query;
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
    }
    catch (error) {
        console.error('Error fetching departments with count:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get materials for a specific department
router.get('/department/:id', auth_1.authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { facilityId } = req.query;
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
                if (level === 'building') {
                    b = pathParts[0] || '';
                }
                else if (level === 'floor') {
                    b = pathParts[0] || '';
                    f = pathParts[1] || '';
                }
                else {
                    b = pathParts[0] || '';
                    f = pathParts[1] || '';
                    d = pathParts[2] || '';
                }
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
    }
    catch (error) {
        console.error('Error fetching department materials:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Update inventory matrix (upsert/delete)
router.post('/', auth_1.authMiddleware, async (req, res) => {
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
                        if (level === 'building') {
                            b = pathParts[0] || '';
                        }
                        else if (level === 'floor') {
                            b = pathParts[0] || '';
                            f = pathParts[1] || '';
                        }
                        else {
                            b = pathParts[0] || '';
                            f = pathParts[1] || '';
                            d = pathParts[2] || '';
                        }
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
                }
                else {
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
                    }
                    else {
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
    }
    catch (error) {
        console.error('Error updating inventory:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message, stack: error.stack });
    }
});
// Bulk update inventory for a specific department (assign multiple materials)
router.post('/department-bulk', auth_1.authMiddleware, async (req, res) => {
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
                if (level === 'building') {
                    b = pathParts[0] || '';
                }
                else if (level === 'floor') {
                    b = pathParts[0] || '';
                    f = pathParts[1] || '';
                }
                else {
                    b = pathParts[0] || '';
                    f = pathParts[1] || '';
                    d = pathParts[2] || '';
                }
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
                if (!materialId)
                    continue;
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
                }
                else {
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
    }
    catch (error) {
        console.error('Error bulk updating department inventory:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});
// Delete specific inventory item
router.delete('/:id', auth_1.authMiddleware, async (req, res) => {
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
    }
    catch (error) {
        console.error('Error deleting inventory item:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Bulk import inventory matrix with location mapping and deduplication
router.post('/bulk-import-matrix', auth_1.authMiddleware, async (req, res) => {
    const { facilityId, rows, locationMappings } = req.body;
    if (!facilityId || !Array.isArray(rows) || rows.length === 0) {
        return res.status(400).json({ error: 'facilityId and a non-empty rows array are required' });
    }
    if (!req.user?.isAdmin && !req.user?.isManagement && !req.user?.facilities.includes(facilityId)) {
        return res.status(403).json({ error: 'Access denied to this facility' });
    }
    try {
        const username = req.user?.username || 'System';
        // 1. Fetch all HazmatUnits for flexible matching
        const allUnits = await prisma.hazmatUnit.findMany();
        const findUnit = (unitStr) => {
            if (!unitStr)
                return null;
            const s = unitStr.toLowerCase().trim();
            if (s === 'ml' || s === 'mililitre' || s === 'milli litre') {
                return allUnits.find(u => u.symbol?.toLowerCase() === 'ml') ||
                    allUnits.find(u => u.name?.toLowerCase().includes('mililitre'));
            }
            if (s === 'mg' || s === 'miligram' || s === 'milli gram') {
                return allUnits.find(u => u.symbol?.toLowerCase() === 'mg') ||
                    allUnits.find(u => u.name?.toLowerCase().includes('miligram'));
            }
            if (s === 'litre' || s === 'l' || s === 'lt' || s === 'lt.') {
                return allUnits.find(u => u.symbol?.toLowerCase() === 'l' || u.name?.toLowerCase() === 'litre');
            }
            if (s === 'gr' || s === 'gram' || s === 'g') {
                return allUnits.find(u => u.symbol?.toLowerCase() === 'g' || u.name?.toLowerCase() === 'gram');
            }
            if (s === 'kg' || s === 'kilogram') {
                return allUnits.find(u => u.symbol?.toLowerCase() === 'kg' || u.name?.toLowerCase() === 'kilogram');
            }
            if (s === 'm3' || s === 'm³' || s === 'metreküp') {
                return allUnits.find(u => u.symbol?.toLowerCase() === 'm³' || u.name?.toLowerCase().includes('metreküp'));
            }
            if (s === 'adet' || s === 'ad' || s === 'kutu' || s === 'tane') {
                return allUnits.find(u => u.symbol?.toLowerCase() === 'adet' || u.name?.toLowerCase() === 'adet');
            }
            return allUnits.find(u => u.symbol?.toLowerCase() === s) ||
                allUnits.find(u => u.name?.toLowerCase() === s) ||
                allUnits.find(u => u.name?.toLowerCase().includes(s));
        };
        let adetUnit = allUnits.find(u => u.name?.toLowerCase() === 'adet' || u.symbol?.toLowerCase() === 'adet');
        if (!adetUnit) {
            adetUnit = await prisma.hazmatUnit.create({ data: { name: 'Adet', symbol: 'adet' } });
        }
        // 2. Fetch all existing global materials for robust matching
        const allGlobalMaterials = await prisma.hazmatMaterial.findMany();
        const normalize = (t) => (t || '').toLocaleLowerCase('tr-TR').trim();
        const materialAggMap = new Map();
        for (const row of rows) {
            const pName = (row.productName || '').trim();
            if (!pName)
                continue;
            const key = normalize(pName);
            const minQ = row.minQuantity !== undefined && row.minQuantity !== null && row.minQuantity !== '' ? Number(row.minQuantity) : 0;
            const maxQ = row.maxQuantity !== undefined && row.maxQuantity !== null && row.maxQuantity !== '' ? Number(row.maxQuantity) : minQ;
            if (!materialAggMap.has(key)) {
                materialAggMap.set(key, {
                    productName: pName,
                    packageQuantity: row.packageQuantity != null ? Number(row.packageQuantity) : null,
                    packageUnit: row.packageUnit ? String(row.packageUnit).trim() : null,
                    totalMaxUnits: maxQ,
                    totalMinUnits: minQ,
                    rows: [row]
                });
            }
            else {
                const agg = materialAggMap.get(key);
                agg.totalMaxUnits += maxQ;
                agg.totalMinUnits += minQ;
                agg.rows.push(row);
                if (!agg.packageQuantity && row.packageQuantity != null) {
                    agg.packageQuantity = Number(row.packageQuantity);
                }
                if (!agg.packageUnit && row.packageUnit) {
                    agg.packageUnit = String(row.packageUnit).trim();
                }
            }
        }
        // 3. Resolve location mapping (maps raw department name to locationId)
        // locationMappings: Record<string, { action: 'existing' | 'new', locationId?: string, newName?: string, building?: string, floor?: string, department?: string, description?: string }>
        const resolvedLocations = {};
        if (locationMappings && typeof locationMappings === 'object') {
            for (const [rawDept, mapInfo] of Object.entries(locationMappings)) {
                if (!mapInfo)
                    continue;
                if (mapInfo.action === 'existing' && mapInfo.locationId) {
                    resolvedLocations[rawDept] = mapInfo.locationId;
                }
                else if (mapInfo.action === 'new') {
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
        const materialCache = new Map();
        allGlobalMaterials.forEach(m => materialCache.set(normalize(m.productName), m));
        for (const [normName, agg] of materialAggMap.entries()) {
            let material = materialCache.get(normName);
            const firstRow = agg.rows[0];
            // Create material in global pool if not exists
            if (!material) {
                material = await prisma.hazmatMaterial.create({
                    data: {
                        productName: agg.productName,
                        brandName: firstRow.brandName || null,
                        usageMethod: firstRow.usageMethod || null,
                        composition: firstRow.composition || null,
                        hazardDescription: firstRow.hazardDescription || null,
                        firstAid: firstRow.firstAid || null,
                        fireFightingMeasures: firstRow.fireFightingMeasures || null,
                        accidentalReleaseMeasures: firstRow.accidentalReleaseMeasures || null,
                        handlingAndStorage: firstRow.handlingAndStorage || null,
                        exposureControlsPpe: firstRow.exposureControlsPpe || null,
                        physicalAndChemicalProperties: firstRow.physicalAndChemicalProperties || null,
                        stabilityAndReactivity: firstRow.stabilityAndReactivity || null,
                        toxicologicalInformation: firstRow.toxicologicalInformation || null,
                        disposalConsiderations: firstRow.disposalConsiderations || null,
                        transportInfo: firstRow.transportInfo || null
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
            }
            else {
                // Update existing material if it lacks technical details
                const updateData = {};
                for (const row of agg.rows) {
                    if (!material.brandName && row.brandName)
                        updateData.brandName = row.brandName;
                    if (!material.usageMethod && row.usageMethod)
                        updateData.usageMethod = row.usageMethod;
                    if (!material.composition && row.composition)
                        updateData.composition = row.composition;
                    if (!material.hazardDescription && row.hazardDescription)
                        updateData.hazardDescription = row.hazardDescription;
                    if (!material.firstAid && row.firstAid)
                        updateData.firstAid = row.firstAid;
                    if (!material.fireFightingMeasures && row.fireFightingMeasures)
                        updateData.fireFightingMeasures = row.fireFightingMeasures;
                    if (!material.accidentalReleaseMeasures && row.accidentalReleaseMeasures)
                        updateData.accidentalReleaseMeasures = row.accidentalReleaseMeasures;
                    if (!material.handlingAndStorage && row.handlingAndStorage)
                        updateData.handlingAndStorage = row.handlingAndStorage;
                    if (!material.exposureControlsPpe && row.exposureControlsPpe)
                        updateData.exposureControlsPpe = row.exposureControlsPpe;
                    if (!material.physicalAndChemicalProperties && row.physicalAndChemicalProperties)
                        updateData.physicalAndChemicalProperties = row.physicalAndChemicalProperties;
                    if (!material.stabilityAndReactivity && row.stabilityAndReactivity)
                        updateData.stabilityAndReactivity = row.stabilityAndReactivity;
                    if (!material.toxicologicalInformation && row.toxicologicalInformation)
                        updateData.toxicologicalInformation = row.toxicologicalInformation;
                    if (!material.disposalConsiderations && row.disposalConsiderations)
                        updateData.disposalConsiderations = row.disposalConsiderations;
                    if (!material.transportInfo && row.transportInfo)
                        updateData.transportInfo = row.transportInfo;
                }
                if (Object.keys(updateData).length > 0) {
                    material = await prisma.hazmatMaterial.update({
                        where: { id: material.id },
                        data: updateData
                    });
                    materialCache.set(normName, material);
                }
                results.materialsReused++;
            }
            // Calculate total facility amount and unit:
            // If packageQuantity (e.g. 400) and packageUnit (e.g. 'ml') are provided:
            // Total amount across facility = totalMaxUnits * packageQuantity
            // Unit = matched unit for packageUnit
            let facilityAmount = null;
            let facilityUnitId = null;
            const matchedUnit = findUnit(agg.packageUnit || undefined);
            if (agg.packageQuantity && agg.packageQuantity > 0) {
                facilityAmount = +(agg.totalMaxUnits * agg.packageQuantity).toFixed(2);
                facilityUnitId = matchedUnit ? matchedUnit.id : adetUnit.id;
            }
            else if (matchedUnit) {
                facilityAmount = agg.totalMaxUnits > 0 ? agg.totalMaxUnits : (agg.totalMinUnits > 0 ? agg.totalMinUnits : 1);
                facilityUnitId = matchedUnit.id;
            }
            else {
                facilityAmount = agg.totalMaxUnits > 0 ? agg.totalMaxUnits : (agg.totalMinUnits > 0 ? agg.totalMinUnits : 1);
                facilityUnitId = adetUnit.id;
            }
            // Upsert FacilityHazmatItem
            await prisma.facilityHazmatItem.upsert({
                where: {
                    facilityId_materialId: { facilityId, materialId: material.id }
                },
                update: {
                    amountValue: facilityAmount,
                    unitId: facilityUnitId
                },
                create: {
                    facilityId,
                    materialId: material.id,
                    amountValue: facilityAmount,
                    unitId: facilityUnitId
                }
            });
            // Upsert HazmatInventoryItem for each department row
            for (const row of agg.rows) {
                const rawDept = (row.department || '').trim();
                const targetLocationId = resolvedLocations[rawDept];
                if (targetLocationId) {
                    const minQ = row.minQuantity !== undefined && row.minQuantity !== null && row.minQuantity !== '' ? Number(row.minQuantity) : null;
                    const maxQ = row.maxQuantity !== undefined && row.maxQuantity !== null && row.maxQuantity !== '' ? Number(row.maxQuantity) : null;
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
                    }
                    else {
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
        }
        res.json({
            message: 'Envanter ve malzeme aktarımı tamamlandı.',
            results
        });
    }
    catch (error) {
        console.error('Error during bulk inventory matrix import:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});
exports.default = router;
