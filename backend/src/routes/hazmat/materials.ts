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

// GET all global materials, and check if they exist in a specific facility
router.get('/global', authMiddleware, async (req: AuthRequest, res) => {
  const { facilityId } = req.query as Record<string, any>;

  try {
    const allMaterials = await prisma.hazmatMaterial.findMany({
      include: {
        category: true,
        hazardLabels: { include: { label: true } },
        adrLabels: { include: { label: true } },
        ppes: { include: { ppe: true } },
        facilityItems: {
          orderBy: { updatedAt: 'desc' },
          take: 1,
          include: { unit: true }
        },
        auditLogs: {
          where: { action: 'UPDATE' },
          select: { id: true, createdAt: true },
          take: 1
        }
      },
      orderBy: { productName: 'asc' }
    });

    if (!facilityId) {
      return res.json(allMaterials.map(m => {
        const latestFac = m.facilityItems?.[0];
        return {
          material: m,
          isInFacility: false,
          facilityAmount: latestFac?.amountValue ?? null,
          facilityUnit: latestFac?.unit?.symbol || latestFac?.unit?.name || null
        };
      }));
    }

    // If facilityId is provided, check which ones are in the facility
    const facilityItems = await prisma.facilityHazmatItem.findMany({
      where: { facilityId: String(facilityId) },
      include: { unit: true }
    });

    const result = allMaterials.map(m => {
      const fItem = facilityItems.find(f => f.materialId === m.id);
      const fallbackItem = fItem || m.facilityItems?.[0];
      return {
        material: m,
        isInFacility: !!fItem,
        facilityAmount: fallbackItem?.amountValue ?? null,
        facilityUnit: fallbackItem?.unit?.symbol || fallbackItem?.unit?.name || null
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching global materials:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST add a global material to a facility
router.post('/add-to-facility', authMiddleware, async (req: AuthRequest, res) => {
  const { facilityId, materialId, amountValue, unitId } = req.body;
  if (!facilityId || !materialId) {
    return res.status(400).json({ error: 'facilityId and materialId are required' });
  }

  if (!req.user?.isAdmin && !req.user?.isManagement && !req.user?.facilities?.includes(facilityId)) {
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
  } catch (error) {
    console.error('Error adding material to facility:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Bulk add existing global materials to a facility
router.post('/bulk-add-to-facility', authMiddleware, async (req: AuthRequest, res) => {
  const { facilityId, materialIds } = req.body;
  if (!facilityId || !Array.isArray(materialIds) || materialIds.length === 0) {
    return res.status(400).json({ error: 'facilityId and an array of materialIds are required' });
  }

  if (!req.user?.isAdmin && !req.user?.isManagement && !req.user?.facilities?.includes(facilityId)) {
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
  } catch (error) {
    console.error('Error bulk adding materials to facility:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get materials for a specific facility
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  const { facilityId } = req.query as Record<string, any>;

  if (!facilityId) {
    return res.status(400).json({ error: 'facilityId is required' });
  }

  if (!req.user?.isAdmin && !req.user?.isManagement && !req.user?.facilities?.includes(String(facilityId))) {
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
            category: true,
            auditLogs: {
              where: { action: 'UPDATE' },
              select: { id: true, createdAt: true },
              take: 1
            }
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

  if (!req.user?.isAdmin && !req.user?.isManagement && !req.user?.facilities?.includes(facilityId)) {
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

// Create a new global material (and optionally link to facility if valid facilityId provided)
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  const data = req.body;

  if (!data.productName || !String(data.productName).trim()) {
    return res.status(400).json({ error: 'Ürün Adı zorunludur' });
  }

  const hasValidFacility = Boolean(
    data.facilityId &&
    String(data.facilityId).toLowerCase() !== 'all' &&
    String(data.facilityId).trim() !== ''
  );

  if (hasValidFacility) {
    if (!req.user?.isAdmin && !req.user?.isManagement && !req.user?.facilities?.includes(data.facilityId)) {
      return res.status(403).json({ error: 'Access denied to this facility' });
    }
  }

  try {
    const { facilityId, amountValue, unitId, hazardLabels, adrLabels, ppes, ...materialData } = data;

    let parsedExpiryDate: Date | null = null;
    if (materialData.sdsExpiryDate && String(materialData.sdsExpiryDate).trim() !== '') {
      const d = new Date(materialData.sdsExpiryDate);
      if (!isNaN(d.getTime())) {
        parsedExpiryDate = d;
      }
    }

    let parsedSdsDate: Date | null = null;
    if (materialData.sdsDate && String(materialData.sdsDate).trim() !== '') {
      const d = new Date(materialData.sdsDate);
      if (!isNaN(d.getTime())) {
        parsedSdsDate = d;
      }
    }

    let parsedSdsRevisionDate: Date | null = null;
    if (materialData.sdsRevisionDate && String(materialData.sdsRevisionDate).trim() !== '') {
      const d = new Date(materialData.sdsRevisionDate);
      if (!isNaN(d.getTime())) {
        parsedSdsRevisionDate = d;
      }
    }

    // Create the global material
    const newMaterial = await prisma.hazmatMaterial.create({
      data: {
        productName: materialData.productName.trim(),
        brandName: materialData.brandName?.trim() || null,
        usageMethod: materialData.usageMethod || null,
        composition: materialData.composition || null,
        hazardDescription: materialData.hazardDescription || null,
        firstAid: materialData.firstAid || null,
        fireFightingMeasures: materialData.fireFightingMeasures || null,
        accidentalReleaseMeasures: materialData.accidentalReleaseMeasures || null,
        handlingAndStorage: materialData.handlingAndStorage || null,
        exposureControlsPpe: materialData.exposureControls || null,
        physicalAndChemicalProperties: materialData.physicalProperties || null,
        stabilityAndReactivity: materialData.stabilityAndReactivity || null,
        toxicologicalInformation: materialData.toxicologicalInfo || null,
        ecologicalInformation: materialData.ecologicalInfo || null,
        disposalConsiderations: materialData.disposalConsiderations || null,
        transportInfo: materialData.transportInfo || null,
        regulatoryInfo: materialData.regulatoryInfo || null,
        otherInfo: materialData.otherInfo || null,
        sdsNumber: materialData.sdsNumber?.trim() || null,
        sdsRevision: materialData.sdsRevision?.trim() || null,
        sdsDate: parsedSdsDate,
        sdsRevisionDate: parsedSdsRevisionDate,
        sdsRegime: materialData.sdsRegime || null,
        productKind: materialData.productKind || null,
        sdsStructuredData: materialData.sdsStructuredData ?? undefined,
        categoryId: materialData.categoryId || null,
        imageUrl: materialData.imageUrl || null,
        sdsUrl: materialData.sdsUrl || null,
        sdsExpiryDate: parsedExpiryDate,
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
      },
      include: {
        category: true,
        hazardLabels: { include: { label: true } },
        adrLabels: { include: { label: true } },
        ppes: { include: { ppe: true } }
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

    // If amountValue or unitId is provided, make sure we link a facilityItem even if facilityId wasn't passed or was 'all'
    let facilityItem = null;
    let actualFacilityId = hasValidFacility ? facilityId : null;
    if (!actualFacilityId) {
      if (req.user?.facilities && req.user.facilities.length > 0) {
        actualFacilityId = req.user.facilities[0];
      } else {
        const firstFac = await prisma.facility.findFirst({ select: { id: true } });
        if (firstFac) actualFacilityId = firstFac.id;
      }
    }

    if (actualFacilityId && (amountValue !== undefined || unitId)) {
      facilityItem = await prisma.facilityHazmatItem.create({
        data: {
          facilityId: actualFacilityId,
          materialId: newMaterial.id,
          amountValue: amountValue !== undefined && amountValue !== '' && amountValue !== null ? Number(amountValue) : null,
          unitId: unitId || null
        },
        include: {
          unit: true
        }
      });
    }

    res.status(201).json({ material: newMaterial, facilityItem });
  } catch (error) {
    console.error('Error creating global material and facility item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper: parse YYYY-MM-DD, DD.MM.YYYY, DD/MM/YYYY or Excel serial date safely
function parseImportDate(raw: any): Date | null {
  if (raw === null || raw === undefined || raw === '') return null;
  if (raw instanceof Date && !Number.isNaN(raw.getTime())) return raw;
  if (typeof raw === 'number' && raw > 20000 && raw < 80000) {
    // Excel serial date (days since 1899-12-30)
    const utcDays = Math.floor(raw - 25569);
    const d = new Date(utcDays * 86400 * 1000);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const str = String(raw).trim();
  if (!str) return null;
  // DD.MM.YYYY or DD/MM/YYYY
  const trMatch = str.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (trMatch) {
    const [, dd, mm, yyyy] = trMatch;
    const d = new Date(`${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}T00:00:00.000Z`);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const parsed = new Date(str);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

// Bulk import materials from Excel / CSV (Global or Facility-scoped, all 28 text/date/select fields — excludes visuals/pictograms)
router.post('/import', authMiddleware, async (req: AuthRequest, res) => {
  const { facilityId, materials, updateExisting = true } = req.body;

  if (!Array.isArray(materials) || materials.length === 0) {
    return res.status(400).json({ error: 'Yüklenecek madde listesi boş olamaz.' });
  }

  const isManager = !!(
    req.user?.isAdmin ||
    req.user?.isManagement ||
    req.user?.roles?.includes('admin') ||
    req.user?.roles?.includes('management') ||
    req.user?.roles?.includes('safety')
  );

  if (!isManager) {
    return res.status(403).json({ error: 'Toplu kimyasal madde yükleme yetkisi yalnızca yöneticilere aittir.' });
  }

  try {
    const username = req.user?.username || 'System';
    const normalizeText = (t: string | null | undefined) => (t || '').toLocaleLowerCase('tr-TR').trim().replace(/\s+/g, ' ');
    const cleanStr = (v: any): string | null => {
      if (v === null || v === undefined) return null;
      const s = String(v).trim();
      return s.length > 0 ? s : null;
    };

    const [allGlobalMaterials, allCategories, allUnits] = await Promise.all([
      prisma.hazmatMaterial.findMany(),
      prisma.hazmatCategory.findMany({ where: { isActive: true } }),
      prisma.hazmatUnit.findMany({ where: { isActive: true } }),
    ]);

    const categoryMap = new Map<string, string>();
    allCategories.forEach((c) => categoryMap.set(normalizeText(c.name), c.id));

    const unitMap = new Map<string, string>();
    allUnits.forEach((u) => {
      unitMap.set(normalizeText(u.name), u.id);
      if (u.symbol) unitMap.set(normalizeText(u.symbol), u.id);
    });

    const defaultUnitId =
      allUnits.find((u) => normalizeText(u.name).includes('adet'))?.id || allUnits[0]?.id || null;

    const results = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      errorDetails: [] as { row: number; productName: string; reason: string }[],
    };

    for (let idx = 0; idx < materials.length; idx++) {
      const data = materials[idx];
      const productName = cleanStr(data.productName);
      if (!productName) {
        results.errors++;
        results.errorDetails.push({ row: idx + 2, productName: '-', reason: 'Ürün / Madde Adı zorunludur.' });
        continue;
      }

      try {
        const normalizedProductName = normalizeText(productName);
        const categoryName = cleanStr(data.categoryName || data.category);
        const resolvedCategoryId =
          cleanStr(data.categoryId) ||
          (categoryName ? categoryMap.get(normalizeText(categoryName)) || null : null);

        const rawSdsNo = cleanStr(data.sdsNumber);
        const normalizedSdsNumber = rawSdsNo
          ? rawSdsNo.toUpperCase().startsWith('SDS-')
            ? rawSdsNo
            : `SDS-${rawSdsNo}`
          : null;

        const rawRev = cleanStr(data.sdsRevision);
        const normalizedSdsRevision = rawRev
          ? rawRev.toLowerCase().startsWith('rev-')
            ? rawRev
            : `Rev-${rawRev}`
          : null;

        const rawKind = cleanStr(data.productKind);
        const normalizedKind =
          rawKind && normalizeText(rawKind) === 'madde'
            ? 'madde'
            : rawKind && normalizeText(rawKind).includes('kar')
              ? 'karışım'
              : rawKind || null;

        const incomingStructured =
          data.sdsStructuredData && typeof data.sdsStructuredData === 'object'
            ? data.sdsStructuredData
            : undefined;

        const payload = {
          brandName: cleanStr(data.brandName),
          categoryId: resolvedCategoryId,
          sdsNumber: normalizedSdsNumber,
          sdsRevision: normalizedSdsRevision,
          sdsDate: parseImportDate(data.sdsDate),
          sdsRevisionDate: parseImportDate(data.sdsRevisionDate),
          sdsExpiryDate: parseImportDate(data.sdsExpiryDate),
          productKind: normalizedKind,
          sdsRegime: cleanStr(data.sdsRegime),
          usageMethod: cleanStr(data.usageMethod),
          hazardDescription: cleanStr(data.hazardDescription),
          composition: cleanStr(data.composition),
          firstAid: cleanStr(data.firstAid),
          fireFightingMeasures: cleanStr(data.fireFightingMeasures),
          accidentalReleaseMeasures: cleanStr(data.accidentalReleaseMeasures),
          handlingAndStorage: cleanStr(data.handlingAndStorage),
          exposureControlsPpe: cleanStr(data.exposureControlsPpe || data.exposureControls),
          physicalAndChemicalProperties: cleanStr(data.physicalAndChemicalProperties || data.physicalProperties),
          stabilityAndReactivity: cleanStr(data.stabilityAndReactivity),
          toxicologicalInformation: cleanStr(data.toxicologicalInformation || data.toxicologicalInfo),
          ecologicalInformation: cleanStr(data.ecologicalInformation || data.ecologicalInfo),
          disposalConsiderations: cleanStr(data.disposalConsiderations),
          transportInfo: cleanStr(data.transportInfo),
          regulatoryInfo: cleanStr(data.regulatoryInfo),
          otherInfo: cleanStr(data.otherInfo),
          ...(incomingStructured ? { sdsStructuredData: incomingStructured } : {}),
        };

        let material = allGlobalMaterials.find((m) => normalizeText(m.productName) === normalizedProductName);

        if (!material) {
          material = await prisma.hazmatMaterial.create({
            data: {
              productName,
              ...payload,
            },
          });

          await prisma.hazmatAuditLog.create({
            data: {
              materialId: material.id,
              action: 'CREATE',
              details: 'Excel / CSV toplu yapısal GBF şablonu ile oluşturuldu.',
              username,
            },
          });

          allGlobalMaterials.push(material);
          results.created++;
        } else if (updateExisting) {
          // Eğer Excel'den doğrudan yapısal GBF (sdsStructuredData) geldiyse onu kullan;
          // aksi halde mevcut kayıtta sdsStructuredData varsa düz GBF sütunlarını içine yansıt
          let nextStructuredData: any = incomingStructured;
          if (!nextStructuredData && material.sdsStructuredData && typeof material.sdsStructuredData === 'object') {
            const cloned: any = JSON.parse(JSON.stringify(material.sdsStructuredData));
            if (payload.productKind === 'madde' || payload.productKind === 'karışım') cloned.kind = payload.productKind;
            if (payload.sdsRegime) cloned.regime = payload.sdsRegime;
            if (!cloned.sections) cloned.sections = {};
            const gbfMap: Array<[number, string | null]> = [
              [1, payload.usageMethod], [2, payload.hazardDescription], [3, payload.composition],
              [4, payload.firstAid], [5, payload.fireFightingMeasures], [6, payload.accidentalReleaseMeasures],
              [7, payload.handlingAndStorage], [8, payload.exposureControlsPpe], [9, payload.physicalAndChemicalProperties],
              [10, payload.stabilityAndReactivity], [11, payload.toxicologicalInformation], [12, payload.ecologicalInformation],
              [13, payload.disposalConsiderations], [14, payload.transportInfo], [15, payload.regulatoryInfo],
              [16, payload.otherInfo],
            ];
            for (const [secNo, val] of gbfMap) {
              if (val) {
                cloned.sections[secNo] = { ...(cloned.sections[secNo] || { sub: {}, custom: [] }), raw: val };
              }
            }
            nextStructuredData = cloned;
          }

          material = await prisma.hazmatMaterial.update({
            where: { id: material.id },
            data: {
              brandName: payload.brandName ?? material.brandName,
              categoryId: payload.categoryId ?? material.categoryId,
              sdsNumber: payload.sdsNumber ?? material.sdsNumber,
              sdsRevision: payload.sdsRevision ?? material.sdsRevision,
              sdsDate: payload.sdsDate ?? material.sdsDate,
              sdsRevisionDate: payload.sdsRevisionDate ?? material.sdsRevisionDate,
              sdsExpiryDate: payload.sdsExpiryDate ?? material.sdsExpiryDate,
              productKind: payload.productKind ?? material.productKind,
              sdsRegime: payload.sdsRegime ?? material.sdsRegime,
              usageMethod: payload.usageMethod ?? material.usageMethod,
              hazardDescription: payload.hazardDescription ?? material.hazardDescription,
              composition: payload.composition ?? material.composition,
              firstAid: payload.firstAid ?? material.firstAid,
              fireFightingMeasures: payload.fireFightingMeasures ?? material.fireFightingMeasures,
              accidentalReleaseMeasures: payload.accidentalReleaseMeasures ?? material.accidentalReleaseMeasures,
              handlingAndStorage: payload.handlingAndStorage ?? material.handlingAndStorage,
              exposureControlsPpe: payload.exposureControlsPpe ?? material.exposureControlsPpe,
              physicalAndChemicalProperties: payload.physicalAndChemicalProperties ?? material.physicalAndChemicalProperties,
              stabilityAndReactivity: payload.stabilityAndReactivity ?? material.stabilityAndReactivity,
              toxicologicalInformation: payload.toxicologicalInformation ?? material.toxicologicalInformation,
              ecologicalInformation: payload.ecologicalInformation ?? material.ecologicalInformation,
              disposalConsiderations: payload.disposalConsiderations ?? material.disposalConsiderations,
              transportInfo: payload.transportInfo ?? material.transportInfo,
              regulatoryInfo: payload.regulatoryInfo ?? material.regulatoryInfo,
              otherInfo: payload.otherInfo ?? material.otherInfo,
              ...(nextStructuredData ? { sdsStructuredData: nextStructuredData } : {}),
            },
          });

          await prisma.hazmatAuditLog.create({
            data: {
              materialId: material.id,
              action: 'UPDATE',
              details: 'Excel / CSV toplu yüklemesi ile mevcut metin alanları güncellendi.',
              username,
            },
          });
          results.updated++;
        } else {
          results.skipped++;
        }

        // Optional facility link if facilityId is supplied
        if (facilityId && material) {
          const parsedAmount =
            data.amountValue !== undefined && data.amountValue !== null && data.amountValue !== ''
              ? Number(String(data.amountValue).replace(',', '.'))
              : null;
          const unitName = cleanStr(data.unitName || data.unit);
          const resolvedUnitId =
            cleanStr(data.unitId) ||
            (unitName ? unitMap.get(normalizeText(unitName)) || null : null) ||
            defaultUnitId;

          await prisma.facilityHazmatItem.upsert({
            where: {
              facilityId_materialId: { facilityId, materialId: material.id },
            },
            update: {
              ...(parsedAmount !== null && !Number.isNaN(parsedAmount) ? { amountValue: parsedAmount } : {}),
              ...(resolvedUnitId ? { unitId: resolvedUnitId } : {}),
            },
            create: {
              facilityId,
              materialId: material.id,
              amountValue: parsedAmount !== null && !Number.isNaN(parsedAmount) ? parsedAmount : 1,
              unitId: resolvedUnitId,
            },
          });
        }
      } catch (rowErr: any) {
        results.errors++;
        results.errorDetails.push({
          row: idx + 2,
          productName,
          reason: rowErr?.message || 'Kayıt sırasında hata oluştu.',
        });
      }
    }

    res.json({
      message: `${results.created} yeni eklendi, ${results.updated} güncellendi${results.skipped ? `, ${results.skipped} atlandı` : ''}.`,
      results,
    });
  } catch (error) {
    console.error('Error during bulk import:', error);
    res.status(500).json({ error: 'Toplu içe aktarım sırasında sunucu hatası oluştu.' });
  }
});

// Remove a material from a facility (does not delete the global material)
router.delete('/facility/:facilityId/:materialId', authMiddleware, async (req: AuthRequest, res) => {
  const { facilityId, materialId } = (req.params as Record<string, string>);

  if (!req.user?.isAdmin && !req.user?.isManagement && !req.user?.facilities?.includes(facilityId)) {
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
    if (facilityId && facilityId !== 'all') {
      facilityItem = await prisma.facilityHazmatItem.findUnique({
        where: { facilityId_materialId: { facilityId: String(facilityId), materialId } },
        include: { unit: true }
      });
    }

    if (!facilityItem) {
      facilityItem = await prisma.facilityHazmatItem.findFirst({
        where: { materialId },
        orderBy: { updatedAt: 'desc' },
        include: { unit: true }
      });
    }

    // Resolve user full names for audit logs
    const auditLogs = material.auditLogs || [];
    const usernames = Array.from(new Set(auditLogs.map((l: any) => l.username).filter(Boolean)));
    const userMap = new Map<string, string>();

    if (usernames.length > 0) {
      const users = await prisma.user.findMany({
        where: { username: { in: usernames } },
        select: { username: true, fullName: true }
      });
      users.forEach((u: any) => {
        if (u.fullName) {
          userMap.set(u.username, u.fullName);
        }
      });
    }

    const enrichedAuditLogs = auditLogs.map((log: any) => ({
      ...log,
      userFullName: userMap.get(log.username) || log.username
    }));

    res.json({
      material: {
        ...material,
        auditLogs: enrichedAuditLogs
      },
      facilityItem
    });
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

  // facilityId can be explicitly provided, or taken from user facilities if user is admin or general
  let targetFacilityId = data.facilityId;
  if (!targetFacilityId || targetFacilityId === 'all') {
    if (req.user?.facilities && req.user.facilities.length > 0) {
      targetFacilityId = req.user.facilities[0];
    }
  }

  if (targetFacilityId && targetFacilityId !== 'all') {
    if (!req.user?.isAdmin && !req.user?.isManagement && !req.user?.facilities?.includes(targetFacilityId)) {
      return res.status(403).json({ error: 'Access denied to this facility' });
    }
  }

  try {
    const { facilityId, amountValue, unitId, hazardLabels, adrLabels, ppes, ...materialData } = data;

    // Safely parse sdsExpiryDate & sdsDate
    let parsedExpiryDate: Date | null = null;
    if (materialData.sdsExpiryDate && String(materialData.sdsExpiryDate).trim() !== '') {
      const d = new Date(materialData.sdsExpiryDate);
      if (!isNaN(d.getTime())) {
        parsedExpiryDate = d;
      }
    }

    let parsedSdsDate: Date | null = null;
    if (materialData.sdsDate && String(materialData.sdsDate).trim() !== '') {
      const d = new Date(materialData.sdsDate);
      if (!isNaN(d.getTime())) {
        parsedSdsDate = d;
      }
    }

    let parsedSdsRevisionDate: Date | null = null;
    if (materialData.sdsRevisionDate && String(materialData.sdsRevisionDate).trim() !== '') {
      const d = new Date(materialData.sdsRevisionDate);
      if (!isNaN(d.getTime())) {
        parsedSdsRevisionDate = d;
      }
    }

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
        otherInfo: materialData.otherInfo ?? undefined,
        sdsNumber: materialData.sdsNumber !== undefined ? (materialData.sdsNumber?.trim() || null) : undefined,
        sdsRevision: materialData.sdsRevision !== undefined ? (materialData.sdsRevision?.trim() || null) : undefined,
        sdsDate: materialData.sdsDate !== undefined ? parsedSdsDate : undefined,
        sdsRevisionDate: materialData.sdsRevisionDate !== undefined ? parsedSdsRevisionDate : undefined,
        sdsRegime: materialData.sdsRegime !== undefined ? (materialData.sdsRegime || null) : undefined,
        productKind: materialData.productKind !== undefined ? (materialData.productKind || null) : undefined,
        sdsStructuredData: materialData.sdsStructuredData !== undefined ? materialData.sdsStructuredData : undefined,
        categoryId: materialData.categoryId || null,
        imageUrl: materialData.imageUrl || null,
        sdsUrl: materialData.sdsUrl || null,
        sdsExpiryDate: parsedExpiryDate,
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

    // Upsert facility item to update amount & unit
    let actualFacilityId = (targetFacilityId && targetFacilityId !== 'all') ? targetFacilityId : null;
    if (!actualFacilityId) {
      const existingItem = await prisma.facilityHazmatItem.findFirst({
        where: { materialId },
        orderBy: { updatedAt: 'desc' }
      });
      if (existingItem) {
        actualFacilityId = existingItem.facilityId;
      } else {
        const firstFac = await prisma.facility.findFirst({ select: { id: true } });
        if (firstFac) actualFacilityId = firstFac.id;
      }
    }

    if (actualFacilityId) {
      await prisma.facilityHazmatItem.upsert({
        where: { facilityId_materialId: { facilityId: actualFacilityId, materialId } },
        update: {
          amountValue: amountValue !== undefined && amountValue !== '' && amountValue !== null ? Number(amountValue) : null,
          unitId: unitId || null
        },
        create: {
          facilityId: actualFacilityId,
          materialId,
          amountValue: amountValue !== undefined && amountValue !== '' && amountValue !== null ? Number(amountValue) : null,
          unitId: unitId || null
        }
      });
    }

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

// DELETE a specific material globally (Admin only)
router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
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
  } catch (error) {
    console.error('Error deleting material:', error);
    res.status(500).json({ error: 'Malzeme silinirken bir hata oluştu.' });
  }
});

// BULK DELETE materials globally (Admin only)
router.post('/bulk-delete', authMiddleware, async (req: AuthRequest, res) => {
  if (!req.user?.isAdmin && !req.user?.isManagement) {
    return res.status(403).json({ error: 'Bu işlemi sadece yöneticiler yapabilir.' });
  }

  try {
    const { ids, confirmUsername } = req.body;
    if (!confirmUsername || confirmUsername.trim().toLowerCase() !== req.user?.username?.trim().toLowerCase()) {
      return res.status(400).json({ error: 'Toplu silme onayı için kullanıcı adınızı doğru girmelisiniz.' });
    }

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Silinecek materyaller belirtilmedi.' });
    }

    await prisma.hazmatMaterial.deleteMany({
      where: { id: { in: ids } }
    });

    res.json({ success: true, message: `${ids.length} malzeme başarıyla silindi.` });
  } catch (error) {
    console.error('Error bulk deleting materials:', error);
    res.status(500).json({ error: 'Malzemeler silinirken bir hata oluştu.' });
  }
});

export default router;
