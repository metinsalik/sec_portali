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
// Search global materials library
router.get('/search', auth_1.authMiddleware, async (req, res) => {
    const { q } = req.query;
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
    }
    catch (error) {
        console.error('Error searching global materials:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// GET all global materials, and check if they exist in a specific facility
router.get('/global', auth_1.authMiddleware, async (req, res) => {
    const { facilityId } = req.query;
    try {
        const allMaterials = await prisma.hazmatMaterial.findMany({
            include: {
                category: true,
                hazardLabels: { include: { label: true } },
                adrLabels: { include: { label: true } },
                ppes: { include: { ppe: true } }
            },
            orderBy: { productName: 'asc' }
        });
        if (!facilityId) {
            return res.json(allMaterials.map(m => ({ material: m, isInFacility: false })));
        }
        // If facilityId is provided, check which ones are in the facility
        const facilityItems = await prisma.facilityHazmatItem.findMany({
            where: { facilityId: String(facilityId) },
            include: { unit: true }
        });
        const result = allMaterials.map(m => {
            const fItem = facilityItems.find(f => f.materialId === m.id);
            return { material: m, isInFacility: !!fItem, facilityAmount: fItem?.amountValue || null, facilityUnit: fItem?.unit?.name || null };
        });
        res.json(result);
    }
    catch (error) {
        console.error('Error fetching global materials:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST add a global material to a facility
router.post('/add-to-facility', auth_1.authMiddleware, async (req, res) => {
    const { facilityId, materialId, amountValue, unitId } = req.body;
    if (!facilityId || !materialId) {
        return res.status(400).json({ error: 'facilityId and materialId are required' });
    }
    if (!req.user?.isAdmin && !req.user?.isManagement && !req.user?.facilities.includes(facilityId)) {
        return res.status(403).json({ error: 'Access denied' });
    }
    try {
        const existing = await prisma.facilityHazmatItem.findFirst({
            where: { facilityId, materialId }
        });
        if (existing) {
            return res.status(400).json({ error: 'Bu madde zaten tesiste mevcut' });
        }
        const newItem = await prisma.facilityHazmatItem.create({
            data: {
                facilityId,
                materialId,
                amountValue: amountValue || 0,
                unitId: unitId || null
            }
        });
        res.json(newItem);
    }
    catch (error) {
        console.error('Error adding material to facility:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Bulk add existing global materials to a facility
router.post('/bulk-add-to-facility', auth_1.authMiddleware, async (req, res) => {
    const { facilityId, materialIds } = req.body;
    if (!facilityId || !Array.isArray(materialIds) || materialIds.length === 0) {
        return res.status(400).json({ error: 'facilityId and an array of materialIds are required' });
    }
    if (!req.user?.isAdmin && !req.user?.isManagement && !req.user?.facilities.includes(facilityId)) {
        return res.status(403).json({ error: 'Access denied' });
    }
    try {
        const existingLinks = await prisma.facilityHazmatItem.findMany({
            where: {
                facilityId,
                materialId: { in: materialIds }
            },
            select: { materialId: true }
        });
        const existingMaterialIds = existingLinks.map(l => l.materialId);
        const newMaterialIds = materialIds.filter(id => !existingMaterialIds.includes(id));
        if (newMaterialIds.length === 0) {
            return res.status(400).json({ error: 'Seçilen tüm maddeler zaten tesiste mevcut' });
        }
        await prisma.facilityHazmatItem.createMany({
            data: newMaterialIds.map(materialId => ({
                facilityId,
                materialId,
                amountValue: 0,
                unitId: null
            }))
        });
        res.json({ message: `${newMaterialIds.length} madde başarıyla tesise eklendi` });
    }
    catch (error) {
        console.error('Error bulk adding materials to facility:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get materials for a specific facility
router.get('/', auth_1.authMiddleware, async (req, res) => {
    const { facilityId } = req.query;
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
    }
    catch (error) {
        console.error('Error fetching facility materials:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Add an existing global material to a facility
router.post('/facility', auth_1.authMiddleware, async (req, res) => {
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
    }
    catch (error) {
        console.error('Error adding material to facility:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Create a new global material AND add it to the facility
router.post('/', auth_1.authMiddleware, async (req, res) => {
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
                    create: (hazardLabels || []).map((labelId) => ({
                        label: { connect: { id: labelId } }
                    }))
                },
                adrLabels: {
                    create: (adrLabels || []).map((labelId) => ({
                        label: { connect: { id: labelId } }
                    }))
                },
                ppes: {
                    create: (ppes || []).map((ppeId) => ({
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
    }
    catch (error) {
        console.error('Error creating global material and facility item:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Bulk import materials from Excel
router.post('/import', auth_1.authMiddleware, async (req, res) => {
    const { facilityId, materials } = req.body;
    if (!facilityId || !Array.isArray(materials) || materials.length === 0) {
        return res.status(400).json({ error: 'facilityId and a non-empty materials array are required' });
    }
    if (!req.user?.isAdmin && !req.user?.isManagement && !req.user?.facilities.includes(facilityId)) {
        return res.status(403).json({ error: 'Access denied to this facility' });
    }
    try {
        const username = req.user?.username || 'System';
        let adetUnit = await prisma.hazmatUnit.findFirst({
            where: { name: { contains: 'adet', mode: 'insensitive' } }
        });
        if (!adetUnit) {
            adetUnit = await prisma.hazmatUnit.create({ data: { name: 'Adet', symbol: 'ad' } });
        }
        const results = { created: 0, updated: 0, errors: 0 };
        // Fetch all existing materials once to do robust in-memory case-insensitive matching
        const allGlobalMaterials = await prisma.hazmatMaterial.findMany();
        const normalizeText = (t) => (t || '').toLocaleLowerCase('tr-TR').trim();
        for (const data of materials) {
            if (!data.productName) {
                results.errors++;
                continue;
            }
            const normalizedProductName = normalizeText(data.productName);
            // Check if global material exists robustly using Turkish locale lowercasing
            let material = allGlobalMaterials.find(m => normalizeText(m.productName) === normalizedProductName);
            if (!material) {
                // Create new global material
                material = await prisma.hazmatMaterial.create({
                    data: {
                        productName: data.productName,
                        brandName: data.brandName || null,
                        usageMethod: data.usageMethod || null,
                        composition: data.composition || null,
                        hazardDescription: data.hazardDescription || null,
                        firstAid: data.firstAid || null,
                        fireFightingMeasures: data.fireFightingMeasures || null,
                        accidentalReleaseMeasures: data.accidentalReleaseMeasures || null,
                        handlingAndStorage: data.handlingAndStorage || null,
                        exposureControlsPpe: data.exposureControlsPpe || data.exposureControls || null,
                        physicalAndChemicalProperties: data.physicalAndChemicalProperties || data.physicalProperties || null,
                        stabilityAndReactivity: data.stabilityAndReactivity || null,
                        toxicologicalInformation: data.toxicologicalInfo || null,
                        disposalConsiderations: data.disposalConsiderations || null,
                        transportInfo: data.transportInfo || null,
                    }
                });
                await prisma.hazmatAuditLog.create({
                    data: {
                        materialId: material.id,
                        action: 'CREATE',
                        details: 'Excel içe aktarımı ile oluşturuldu.',
                        username
                    }
                });
                allGlobalMaterials.push(material);
                results.created++;
            }
            else {
                // Update existing material with any new info provided in Excel
                await prisma.hazmatMaterial.update({
                    where: { id: material.id },
                    data: {
                        brandName: data.brandName || material.brandName,
                        usageMethod: data.usageMethod || material.usageMethod,
                        composition: data.composition || material.composition,
                        hazardDescription: data.hazardDescription || material.hazardDescription,
                        firstAid: data.firstAid || material.firstAid,
                        fireFightingMeasures: data.fireFightingMeasures || material.fireFightingMeasures,
                        accidentalReleaseMeasures: data.accidentalReleaseMeasures || material.accidentalReleaseMeasures,
                        handlingAndStorage: data.handlingAndStorage || material.handlingAndStorage,
                        exposureControlsPpe: data.exposureControlsPpe || data.exposureControls || material.exposureControlsPpe,
                        physicalAndChemicalProperties: data.physicalAndChemicalProperties || data.physicalProperties || material.physicalAndChemicalProperties,
                        stabilityAndReactivity: data.stabilityAndReactivity || material.stabilityAndReactivity,
                        toxicologicalInformation: data.toxicologicalInfo || material.toxicologicalInformation,
                        disposalConsiderations: data.disposalConsiderations || material.disposalConsiderations,
                        transportInfo: data.transportInfo || material.transportInfo,
                    }
                });
                await prisma.hazmatAuditLog.create({
                    data: {
                        materialId: material.id,
                        action: 'UPDATE',
                        details: 'Excel içe aktarımı ile mevcut bilgiler güncellendi.',
                        username
                    }
                });
                results.updated++;
            }
            // Add to facility
            await prisma.facilityHazmatItem.upsert({
                where: {
                    facilityId_materialId: { facilityId, materialId: material.id }
                },
                update: {
                    amountValue: data.amountValue || 1,
                    unitId: adetUnit.id
                },
                create: {
                    facilityId,
                    materialId: material.id,
                    amountValue: data.amountValue || 1,
                    unitId: adetUnit.id
                }
            });
        }
        res.json({ message: 'Import completed', results });
    }
    catch (error) {
        console.error('Error during bulk import:', error);
        res.status(500).json({ error: 'Internal server error during import' });
    }
});
// Remove a material from a facility (does not delete the global material)
router.delete('/facility/:facilityId/:materialId', auth_1.authMiddleware, async (req, res) => {
    const { facilityId, materialId } = req.params;
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
    }
    catch (error) {
        console.error('Error removing material from facility:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get global material details by ID
router.get('/:materialId', auth_1.authMiddleware, async (req, res) => {
    const { materialId } = req.params;
    const { facilityId } = req.query; // to also get facility item details
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
    }
    catch (error) {
        console.error('Error fetching material details:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Update global material
router.put('/:materialId', auth_1.authMiddleware, async (req, res) => {
    const { materialId } = req.params;
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
                    create: (hazardLabels || []).map((labelId) => ({
                        label: { connect: { id: labelId } }
                    }))
                },
                adrLabels: {
                    create: (adrLabels || []).map((labelId) => ({
                        label: { connect: { id: labelId } }
                    }))
                },
                ppes: {
                    create: (ppes || []).map((ppeId) => ({
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
    }
    catch (error) {
        console.error('Error updating material:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// DELETE a specific material globally (Admin only)
router.delete('/:id', auth_1.authMiddleware, async (req, res) => {
    if (!req.user?.isAdmin && !req.user?.isManagement) {
        return res.status(403).json({ error: 'Bu işlemi sadece yöneticiler yapabilir.' });
    }
    try {
        const { id } = req.params;
        // Check if material exists
        const material = await prisma.hazmatMaterial.findUnique({ where: { id } });
        if (!material) {
            return res.status(404).json({ error: 'Malzeme bulunamadı.' });
        }
        // Material silinince inventory vs. cascade silinmeli (schema.prisma'da ayarli ise). 
        // Ayarli degilse once inventory silmek gerekebilir. Prisma'daki cascade kurallarina gore:
        await prisma.hazmatMaterial.delete({
            where: { id }
        });
        res.json({ success: true, message: 'Malzeme başarıyla silindi.' });
    }
    catch (error) {
        console.error('Error deleting material:', error);
        res.status(500).json({ error: 'Malzeme silinirken bir hata oluştu.' });
    }
});
// BULK DELETE materials globally (Admin only)
router.post('/bulk-delete', auth_1.authMiddleware, async (req, res) => {
    if (!req.user?.isAdmin && !req.user?.isManagement) {
        return res.status(403).json({ error: 'Bu işlemi sadece yöneticiler yapabilir.' });
    }
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'Silinecek materyaller belirtilmedi.' });
        }
        await prisma.hazmatMaterial.deleteMany({
            where: { id: { in: ids } }
        });
        res.json({ success: true, message: `${ids.length} malzeme başarıyla silindi.` });
    }
    catch (error) {
        console.error('Error bulk deleting materials:', error);
        res.status(500).json({ error: 'Malzemeler silinirken bir hata oluştu.' });
    }
});
exports.default = router;
