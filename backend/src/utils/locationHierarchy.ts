import { PrismaClient } from '@prisma/client';

export interface NormalizedLocationParts {
  buildingName: string;
  block: string;
  floor: string;
  department: string;
  description: string;
}

const cleanStr = (val?: string | null): string => (val ? String(val).trim() : '');
const toNullable = (val?: string | null): string | null => {
  const s = cleanStr(val);
  return s.length > 0 ? s : null;
};

/**
 * Normalizes legacy and 5-level FacilityLocation rows into
 * Bina Adi > Blok > Kat > Birim > Mahal parts.
 */
export function extractLocationParts(loc: any): NormalizedLocationParts {
  const rawBuildingName = cleanStr(loc.buildingName) || cleanStr(loc.facilityBuilding?.name);
  const rawBuilding = cleanStr(loc.building);
  const rawFloor = cleanStr(loc.floor);
  const rawDepartment = cleanStr(loc.department);
  let rawDescription = cleanStr(loc.description);

  let buildingName = rawBuildingName;
  let block = '';

  if (buildingName) {
    // New structured row or linked to FacilityBuilding
    if (rawBuilding && rawBuilding.toLowerCase() !== buildingName.toLowerCase()) {
      const parenMatch = rawBuilding.match(/^(.+?)\s*\((.+?)\)$/);
      if (parenMatch && parenMatch[1].trim().toLowerCase() === buildingName.toLowerCase()) {
        block = parenMatch[2].trim();
      } else {
        block = rawBuilding;
      }
    }
  } else if (rawBuilding) {
    // Legacy row without buildingName
    const parenMatch = rawBuilding.match(/^(.+?)\s*\((.+?)\)$/);
    if (parenMatch) {
      buildingName = parenMatch[1].trim();
      block = parenMatch[2].trim();
    } else {
      buildingName = rawBuilding;
    }
  }

  // Strip bogus description written by older KAT creation flow (where block/building was duplicated into description)
  if (
    loc.type === 'KAT' &&
    !rawDepartment &&
    rawDescription &&
    (rawDescription === rawBuilding || rawDescription === block || rawDescription === buildingName)
  ) {
    rawDescription = '';
  }

  return {
    buildingName,
    block,
    floor: rawFloor,
    department: rawDepartment,
    description: rawDescription,
  };
}

export function buildCanonicalLocationName(parts: {
  buildingName?: string | null;
  building?: string | null;
  floor?: string | null;
  department?: string | null;
  description?: string | null;
  name?: string | null;
}): string {
  const segments = [
    cleanStr(parts.buildingName),
    cleanStr(parts.building),
    cleanStr(parts.floor),
    cleanStr(parts.department),
    cleanStr(parts.description),
  ].filter(Boolean);

  if (segments.length > 0) {
    return segments.join(' - ');
  }
  return cleanStr(parts.name) || 'Yeni Lokasyon';
}

export function inferLocationType(parts: {
  buildingName?: string | null;
  building?: string | null;
  floor?: string | null;
  department?: string | null;
  description?: string | null;
  type?: string | null;
}): string {
  if (parts.type === 'TEMIZLIK_ARABASI') return 'TEMIZLIK_ARABASI';
  if (cleanStr(parts.description)) return 'MAHAL';
  if (cleanStr(parts.department)) return 'BIRIM';
  if (cleanStr(parts.floor)) return 'KAT';
  if (cleanStr(parts.building)) return 'BLOK';
  if (cleanStr(parts.buildingName)) return 'BINA';
  return cleanStr(parts.type) || 'DEPARTMAN';
}

export async function ensureFacilityBuilding(
  prisma: PrismaClient,
  facilityId: string,
  buildingName?: string | null
): Promise<number | null> {
  const bName = cleanStr(buildingName);
  if (!bName) return null;

  const existing = await prisma.facilityBuilding.findFirst({
    where: {
      facilityId,
      name: { equals: bName, mode: 'insensitive' },
    },
  });
  if (existing) return existing.id;

  const created = await prisma.facilityBuilding.create({
    data: { facilityId, name: bName },
  });
  return created.id;
}

export interface UpsertLocationInput {
  facilityId: string;
  buildingName?: string | null;
  building?: string | null;
  block?: string | null;
  floor?: string | null;
  department?: string | null;
  description?: string | null;
  name?: string | null;
  type?: string | null;
  returnExistingOnDuplicate?: boolean;
}

export async function upsertFacilityLocation(prisma: PrismaClient, input: UpsertLocationInput) {
  let bName = toNullable(input.buildingName);
  let blk = toNullable(input.block ?? input.building);

  // Backwards compatibility: if caller only sends building="Ana Bina (A Blok)" or building="Ana Bina" without buildingName
  if (!bName && blk) {
    const parenMatch = blk.match(/^(.+?)\s*\((.+?)\)$/);
    if (parenMatch) {
      bName = parenMatch[1].trim();
      blk = parenMatch[2].trim();
    } else {
      bName = blk;
      blk = null;
    }
  }

  const flr = toNullable(input.floor);
  const dept = toNullable(input.department);
  const desc = toNullable(input.description);

  const buildingId = await ensureFacilityBuilding(prisma, input.facilityId, bName);
  const canonicalName = buildCanonicalLocationName({
    buildingName: bName,
    building: blk,
    floor: flr,
    department: dept,
    description: desc,
    name: input.name,
  });
  const locType = inferLocationType({
    buildingName: bName,
    building: blk,
    floor: flr,
    department: dept,
    description: desc,
    type: input.type,
  });

  const existing = await prisma.facilityLocation.findUnique({
    where: {
      facilityId_name: {
        facilityId: input.facilityId,
        name: canonicalName,
      },
    },
    include: { facilityBuilding: true },
  });

  if (existing) {
    if (existing.isActive) {
      if (input.returnExistingOnDuplicate) {
        return { location: existing, created: false };
      }
      const err: any = new Error('Bu lokasyon bu tesiste zaten mevcut.');
      err.statusCode = 400;
      throw err;
    }

    const reactivated = await prisma.facilityLocation.update({
      where: { id: existing.id },
      data: {
        buildingId,
        buildingName: bName,
        building: blk,
        floor: flr,
        department: dept,
        description: desc,
        type: locType,
        isActive: true,
      },
      include: { facilityBuilding: true },
    });
    return { location: reactivated, created: true };
  }

  const created = await prisma.facilityLocation.create({
    data: {
      facilityId: input.facilityId,
      buildingId,
      buildingName: bName,
      building: blk,
      floor: flr,
      department: dept,
      description: desc,
      name: canonicalName,
      type: locType,
    },
    include: { facilityBuilding: true },
  });

  return { location: created, created: true };
}

const isPlaceholder = (v?: string | null) =>
  !v ||
  v.startsWith('Belirtilmemiş') ||
  v === 'Blok Belirtilmemiş' ||
  v === 'Genel Alan';

const matchesField = (actual: string, expected?: string | null): boolean => {
  if (expected === undefined) return true;
  const cleanExp = isPlaceholder(expected) ? '' : cleanStr(expected);
  return actual.toLowerCase() === cleanExp.toLowerCase();
};

export async function renameLocationNode(
  prisma: PrismaClient,
  params: {
    facilityId: string;
    level: string;
    oldValue: string;
    newValue: string;
    parentBuildingName?: string;
    parentBuilding?: string;
    parentFloor?: string;
    parentDepartment?: string;
  }
) {
  const newVal = cleanStr(params.newValue);
  if (!newVal) {
    const err: any = new Error('Yeni isim boş olamaz.');
    err.statusCode = 400;
    throw err;
  }

  const allLocs = await prisma.facilityLocation.findMany({
    where: { facilityId: params.facilityId, isActive: true },
    include: { facilityBuilding: true },
  });

  const targetOld = isPlaceholder(params.oldValue) ? '' : cleanStr(params.oldValue);

  const matchingLocs = allLocs.filter((loc) => {
    const p = extractLocationParts(loc);
    if (params.level === 'buildingName') {
      return p.buildingName.toLowerCase() === targetOld.toLowerCase();
    }
    if (params.level === 'building') {
      return (
        matchesField(p.buildingName, params.parentBuildingName) &&
        p.block.toLowerCase() === targetOld.toLowerCase()
      );
    }
    if (params.level === 'floor') {
      return (
        matchesField(p.buildingName, params.parentBuildingName) &&
        matchesField(p.block, params.parentBuilding) &&
        p.floor.toLowerCase() === targetOld.toLowerCase()
      );
    }
    if (params.level === 'department') {
      return (
        matchesField(p.buildingName, params.parentBuildingName) &&
        matchesField(p.block, params.parentBuilding) &&
        matchesField(p.floor, params.parentFloor) &&
        p.department.toLowerCase() === targetOld.toLowerCase()
      );
    }
    if (params.level === 'description') {
      return (
        matchesField(p.buildingName, params.parentBuildingName) &&
        matchesField(p.block, params.parentBuilding) &&
        matchesField(p.floor, params.parentFloor) &&
        matchesField(p.department, params.parentDepartment) &&
        p.description.toLowerCase() === targetOld.toLowerCase()
      );
    }
    if (params.level === 'name') {
      return cleanStr(loc.name).toLowerCase() === targetOld.toLowerCase();
    }
    return false;
  });

  let updatedBuildingId: number | null = null;
  if (params.level === 'buildingName') {
    updatedBuildingId = await ensureFacilityBuilding(prisma, params.facilityId, newVal);
  }

  await prisma.$transaction(async (tx) => {
    for (const loc of matchingLocs) {
      const p = extractLocationParts(loc);
      const updated = {
        buildingName: params.level === 'buildingName' ? newVal : p.buildingName,
        building: params.level === 'building' ? newVal : p.block,
        floor: params.level === 'floor' ? newVal : p.floor,
        department: params.level === 'department' ? newVal : p.department,
        description: params.level === 'description' ? newVal : p.description,
      };
      const nextName =
        params.level === 'name'
          ? newVal
          : buildCanonicalLocationName({ ...updated, name: loc.name });

      await tx.facilityLocation.update({
        where: { id: loc.id },
        data: {
          buildingName: toNullable(updated.buildingName),
          building: toNullable(updated.building),
          floor: toNullable(updated.floor),
          department: toNullable(updated.department),
          description: toNullable(updated.description),
          name: nextName,
          ...(updatedBuildingId !== null ? { buildingId: updatedBuildingId } : {}),
        },
      });
    }
  });

  return { updatedCount: matchingLocs.length };
}

export function findMatchingLocationIds(
  allLocs: any[],
  params: {
    level: string;
    value: string;
    parentBuildingName?: string;
    parentBuilding?: string;
    parentFloor?: string;
    parentDepartment?: string;
    id?: string;
  }
): string[] {
  if (params.id) return [params.id];
  const targetVal = isPlaceholder(params.value) ? '' : cleanStr(params.value);

  return allLocs
    .filter((loc) => {
      const p = extractLocationParts(loc);
      if (params.level === 'buildingName') {
        return p.buildingName.toLowerCase() === targetVal.toLowerCase();
      }
      if (params.level === 'building') {
        return (
          matchesField(p.buildingName, params.parentBuildingName) &&
          p.block.toLowerCase() === targetVal.toLowerCase()
        );
      }
      if (params.level === 'floor') {
        return (
          matchesField(p.buildingName, params.parentBuildingName) &&
          matchesField(p.block, params.parentBuilding) &&
          p.floor.toLowerCase() === targetVal.toLowerCase()
        );
      }
      if (params.level === 'department') {
        return (
          matchesField(p.buildingName, params.parentBuildingName) &&
          matchesField(p.block, params.parentBuilding) &&
          matchesField(p.floor, params.parentFloor) &&
          p.department.toLowerCase() === targetVal.toLowerCase()
        );
      }
      if (params.level === 'description') {
        return (
          matchesField(p.buildingName, params.parentBuildingName) &&
          matchesField(p.block, params.parentBuilding) &&
          matchesField(p.floor, params.parentFloor) &&
          matchesField(p.department, params.parentDepartment) &&
          p.description.toLowerCase() === targetVal.toLowerCase()
        );
      }
      return false;
    })
    .map((l) => l.id);
}

export async function checkLocationDependencies(
  prisma: PrismaClient,
  params: {
    facilityId: string;
    level: string;
    value: string;
    parentBuildingName?: string;
    parentBuilding?: string;
    parentFloor?: string;
    parentDepartment?: string;
    id?: string;
  }
) {
  const allLocs = await prisma.facilityLocation.findMany({
    where: {
      facilityId: params.facilityId,
      isActive: true,
      OR: [{ type: null }, { type: { not: 'TEMIZLIK_ARABASI' } }],
    },
    include: { facilityBuilding: true },
  });

  const targetIds = findMatchingLocationIds(allLocs, params);
  if (targetIds.length === 0) {
    return {
      hasDependencies: false,
      totalCount: 0,
      breakdown: {
        risks: 0,
        fireEquipments: 0,
        hazmatMaterials: 0,
        incidents: 0,
        extraordinaryIncidents: 0,
        buildProjects: 0,
        btSoruBankasi: 0,
        btUygunsuzluklar: 0,
        fireDoors: 0,
      },
      targetLocationCount: 0,
    };
  }

  const [
    risks,
    fireEquipments,
    hazmatMaterials,
    incidents,
    extraordinaryIncidents,
    buildProjects,
    btSoruBankasi,
    btUygunsuzluklar,
    fireDoors,
  ] = await Promise.all([
    prisma.riskLifecycle.count({ where: { locationId: { in: targetIds } } }),
    prisma.fireEquipment.count({ where: { locationId: { in: targetIds } } }),
    prisma.hazmatInventoryItem.count({ where: { locationId: { in: targetIds } } }),
    prisma.hazmatIncident.count({ where: { locationId: { in: targetIds } } }),
    prisma.extraordinaryIncident.count({ where: { locationId: { in: targetIds } } }),
    prisma.buildProject.count({ where: { locationId: { in: targetIds } } }),
    prisma.bTSoruBankasi.count({ where: { locationId: { in: targetIds } } }),
    prisma.bTUygunsuzluk.count({ where: { locationId: { in: targetIds } } }),
    prisma.fireDoor.count({ where: { locationId: { in: targetIds } } }),
  ]);

  const totalCount =
    risks +
    fireEquipments +
    hazmatMaterials +
    incidents +
    extraordinaryIncidents +
    buildProjects +
    btSoruBankasi +
    btUygunsuzluklar +
    fireDoors;

  return {
    hasDependencies: totalCount > 0,
    totalCount,
    breakdown: {
      risks,
      fireEquipments,
      hazmatMaterials,
      incidents,
      extraordinaryIncidents,
      buildProjects,
      btSoruBankasi,
      btUygunsuzluklar,
      fireDoors,
    },
    targetLocationCount: targetIds.length,
    locationIds: targetIds,
  };
}

export async function deleteLocationNode(
  prisma: PrismaClient,
  params: {
    facilityId: string;
    level: string;
    value: string;
    parentBuildingName?: string;
    parentBuilding?: string;
    parentFloor?: string;
    parentDepartment?: string;
    id?: string;
    transferTargetId?: string;
    transferTargetValue?: string;
  }
) {
  const allLocs = await prisma.facilityLocation.findMany({
    where: {
      facilityId: params.facilityId,
      isActive: true,
      OR: [{ type: null }, { type: { not: 'TEMIZLIK_ARABASI' } }],
    },
    include: { facilityBuilding: true },
  });

  const idsToDeactivate = findMatchingLocationIds(allLocs, params);

  if (idsToDeactivate.length === 0) {
    return { deletedCount: 0, transferredCount: 0 };
  }

  let transferredCount = 0;

  // Determine targetId if transferTargetValue is provided
  let finalTargetId = params.transferTargetId || null;
  if (!finalTargetId && params.transferTargetValue) {
    const cleanTVal = cleanStr(params.transferTargetValue).toLowerCase();
    const targetLoc = allLocs.find(
      (l) =>
        !idsToDeactivate.includes(l.id) &&
        (cleanStr(l.name).toLowerCase() === cleanTVal ||
          (params.level === 'floor' && cleanStr(l.floor).toLowerCase() === cleanTVal) ||
          (params.level === 'building' && cleanStr(l.building).toLowerCase() === cleanTVal) ||
          (params.level === 'department' && cleanStr(l.department).toLowerCase() === cleanTVal) ||
          (params.level === 'description' && cleanStr(l.description).toLowerCase() === cleanTVal))
    );
    if (targetLoc) {
      finalTargetId = targetLoc.id;
    }
  }

  await prisma.$transaction(async (tx) => {
    if (finalTargetId) {
      // Re-point all relations from idsToDeactivate to finalTargetId
      const [r1, r2, r3, r4, r5, r6, r7, r8, r9] = await Promise.all([
        tx.riskLifecycle.updateMany({
          where: { locationId: { in: idsToDeactivate } },
          data: { locationId: finalTargetId },
        }),
        tx.fireEquipment.updateMany({
          where: { locationId: { in: idsToDeactivate } },
          data: { locationId: finalTargetId },
        }),
        tx.hazmatInventoryItem.updateMany({
          where: { locationId: { in: idsToDeactivate } },
          data: { locationId: finalTargetId },
        }),
        tx.hazmatIncident.updateMany({
          where: { locationId: { in: idsToDeactivate } },
          data: { locationId: finalTargetId },
        }),
        tx.extraordinaryIncident.updateMany({
          where: { locationId: { in: idsToDeactivate } },
          data: { locationId: finalTargetId },
        }),
        tx.buildProject.updateMany({
          where: { locationId: { in: idsToDeactivate } },
          data: { locationId: finalTargetId },
        }),
        tx.bTSoruBankasi.updateMany({
          where: { locationId: { in: idsToDeactivate } },
          data: { locationId: finalTargetId },
        }),
        tx.bTUygunsuzluk.updateMany({
          where: { locationId: { in: idsToDeactivate } },
          data: { locationId: finalTargetId },
        }),
        tx.fireDoor.updateMany({
          where: { locationId: { in: idsToDeactivate } },
          data: { locationId: finalTargetId },
        }),
      ]);
      transferredCount =
        r1.count + r2.count + r3.count + r4.count + r5.count + r6.count + r7.count + r8.count + r9.count;
    }

    // Deactivate and rename to prevent unique key conflict
    for (const locId of idsToDeactivate) {
      const loc = allLocs.find((l) => l.id === locId);
      await tx.facilityLocation.update({
        where: { id: locId },
        data: {
          isActive: false,
          name: `${loc?.name || 'Lokasyon'}_deleted_${Date.now()}_${locId.slice(0, 6)}`,
        },
      });
    }
  });

  return {
    deletedCount: idsToDeactivate.length,
    transferredCount,
    message:
      transferredCount > 0
        ? `Lokasyon silindi ve ${transferredCount} bağlı kayıt hedef lokasyona aktarıldı.`
        : 'Lokasyon silindi.',
  };
}

export interface MergeLocationNodesParams {
  facilityId: string;
  level: 'buildingName' | 'building' | 'floor' | 'department' | 'description' | 'id';
  sourceValue?: string;
  targetValue?: string;
  sourceId?: string;
  targetId?: string;
  parentBuildingName?: string;
  parentBuilding?: string;
  parentFloor?: string;
  parentDepartment?: string;
}

export async function mergeLocationNodes(
  prisma: PrismaClient,
  params: MergeLocationNodesParams
) {
  const { facilityId, level } = params;
  if (!facilityId) {
    const err: any = new Error('facilityId zorunludur.');
    err.statusCode = 400;
    throw err;
  }

  const cleanSource = isPlaceholder(params.sourceValue) ? '' : cleanStr(params.sourceValue);
  const cleanTarget = isPlaceholder(params.targetValue) ? '' : cleanStr(params.targetValue);

  if (!params.sourceId && !cleanSource) {
    const err: any = new Error('Birleştirilecek kaynak lokasyon belirtilmelidir.');
    err.statusCode = 400;
    throw err;
  }

  if (!params.targetId && !cleanTarget) {
    const err: any = new Error('Hedef lokasyon belirtilmelidir.');
    err.statusCode = 400;
    throw err;
  }

  if (params.sourceId && params.targetId && params.sourceId === params.targetId) {
    const err: any = new Error('Kaynak ve hedef lokasyon aynı olamaz.');
    err.statusCode = 400;
    throw err;
  }

  if (!params.sourceId && !params.targetId && cleanSource.toLowerCase() === cleanTarget.toLowerCase()) {
    const err: any = new Error('Kaynak ve hedef isimleri aynı olamaz.');
    err.statusCode = 400;
    throw err;
  }

  // Load all active locations for facility
  const allLocs = await prisma.facilityLocation.findMany({
    where: {
      facilityId,
      isActive: true,
      OR: [{ type: null }, { type: { not: 'TEMIZLIK_ARABASI' } }],
    },
    include: { facilityBuilding: true },
  });

  // Identify source locations
  const sourceLocations = allLocs.filter((loc) => {
    if (params.sourceId) {
      return loc.id === params.sourceId;
    }
    const p = extractLocationParts(loc);
    if (level === 'buildingName') {
      return p.buildingName.toLowerCase() === cleanSource.toLowerCase();
    }
    if (level === 'building') {
      return (
        matchesField(p.buildingName, params.parentBuildingName) &&
        p.block.toLowerCase() === cleanSource.toLowerCase()
      );
    }
    if (level === 'floor') {
      return (
        matchesField(p.buildingName, params.parentBuildingName) &&
        matchesField(p.block, params.parentBuilding) &&
        p.floor.toLowerCase() === cleanSource.toLowerCase()
      );
    }
    if (level === 'department') {
      return (
        matchesField(p.buildingName, params.parentBuildingName) &&
        matchesField(p.block, params.parentBuilding) &&
        matchesField(p.floor, params.parentFloor) &&
        p.department.toLowerCase() === cleanSource.toLowerCase()
      );
    }
    if (level === 'description') {
      return (
        matchesField(p.buildingName, params.parentBuildingName) &&
        matchesField(p.block, params.parentBuilding) &&
        matchesField(p.floor, params.parentFloor) &&
        matchesField(p.department, params.parentDepartment) &&
        p.description.toLowerCase() === cleanSource.toLowerCase()
      );
    }
    return false;
  });

  if (sourceLocations.length === 0) {
    return {
      success: true,
      mergedCount: 0,
      transferredRelationsCount: 0,
      message: 'Birleştirilecek kaynak lokasyon kaydı bulunamadı.',
    };
  }

  let updatedBuildingId: number | null = null;
  if (level === 'buildingName' && cleanTarget) {
    updatedBuildingId = await ensureFacilityBuilding(prisma, facilityId, cleanTarget);
  }

  let transferredRelationsCount = 0;
  let mergedRecordsCount = 0;

  await prisma.$transaction(async (tx) => {
    // Current pool of active locations (excluding the ones we are merging)
    const sourceIdsSet = new Set(sourceLocations.map((l) => l.id));
    const activeTargets = allLocs.filter((l) => !sourceIdsSet.has(l.id));

    for (const sourceLoc of sourceLocations) {
      const p = extractLocationParts(sourceLoc);
      const updatedParts = {
        buildingName: level === 'buildingName' ? cleanTarget : p.buildingName,
        building: level === 'building' ? cleanTarget : p.block,
        floor: level === 'floor' ? cleanTarget : p.floor,
        department: level === 'department' ? cleanTarget : p.department,
        description: level === 'description' ? cleanTarget : p.description,
      };

      const targetCanonicalName = buildCanonicalLocationName({
        ...updatedParts,
        name: sourceLoc.name,
      });

      // Find if an active target already matches
      let targetLoc: any = null;
      if (params.targetId) {
        targetLoc = activeTargets.find((l) => l.id === params.targetId);
      } else {
        targetLoc =
          activeTargets.find((l) => {
            const tp = extractLocationParts(l);
            return (
              tp.buildingName.toLowerCase() === updatedParts.buildingName.toLowerCase() &&
              tp.block.toLowerCase() === updatedParts.block.toLowerCase() &&
              tp.floor.toLowerCase() === updatedParts.floor.toLowerCase() &&
              tp.department.toLowerCase() === updatedParts.department.toLowerCase() &&
              tp.description.toLowerCase() === updatedParts.description.toLowerCase()
            );
          }) ||
          activeTargets.find((l) => l.name?.toLowerCase() === targetCanonicalName.toLowerCase());
      }

      if (targetLoc && targetLoc.id !== sourceLoc.id) {
        // CASE A: Target exists -> transfer all foreign keys to targetLoc.id
        const tId = targetLoc.id;
        const sId = sourceLoc.id;

        const [r1, r2, r3, r4, r5, r6, r7, r8, r9] = await Promise.all([
          tx.riskLifecycle.updateMany({ where: { locationId: sId }, data: { locationId: tId } }),
          tx.fireEquipment.updateMany({ where: { locationId: sId }, data: { locationId: tId } }),
          tx.hazmatInventoryItem.updateMany({ where: { locationId: sId }, data: { locationId: tId } }),
          tx.hazmatIncident.updateMany({ where: { locationId: sId }, data: { locationId: tId } }),
          tx.extraordinaryIncident.updateMany({ where: { locationId: sId }, data: { locationId: tId } }),
          tx.buildProject.updateMany({ where: { locationId: sId }, data: { locationId: tId } }),
          tx.bTSoruBankasi.updateMany({ where: { locationId: sId }, data: { locationId: tId } }),
          tx.bTUygunsuzluk.updateMany({ where: { locationId: sId }, data: { locationId: tId } }),
          tx.fireDoor.updateMany({ where: { locationId: sId }, data: { locationId: tId } }),
        ]);

        transferredRelationsCount +=
          r1.count + r2.count + r3.count + r4.count + r5.count + r6.count + r7.count + r8.count + r9.count;

        // Soft-delete sourceLoc and suffix name to avoid unique constraint collision
        await tx.facilityLocation.update({
          where: { id: sId },
          data: {
            isActive: false,
            name: `${sourceLoc.name || 'Lokasyon'}_merged_${Date.now()}_${sId.slice(0, 6)}`,
          },
        });
        mergedRecordsCount++;
      } else {
        // CASE B: Target does not exist yet -> rename inactive collisions, then update sourceLoc to target state
        await tx.facilityLocation.updateMany({
          where: {
            facilityId,
            name: targetCanonicalName,
            isActive: false,
          },
          data: {
            name: `${targetCanonicalName}_inactive_${Date.now()}`,
          },
        });

        const updatedLoc = await tx.facilityLocation.update({
          where: { id: sourceLoc.id },
          data: {
            buildingName: toNullable(updatedParts.buildingName),
            building: toNullable(updatedParts.building),
            floor: toNullable(updatedParts.floor),
            department: toNullable(updatedParts.department),
            description: toNullable(updatedParts.description),
            name: targetCanonicalName,
            ...(updatedBuildingId !== null ? { buildingId: updatedBuildingId } : {}),
          },
          include: { facilityBuilding: true },
        });

        // Add to activeTargets so any subsequent duplicate matches it
        activeTargets.push(updatedLoc);
        mergedRecordsCount++;
      }
    }
  });

  return {
    success: true,
    mergedCount: mergedRecordsCount,
    transferredRelationsCount,
    message: `${mergedRecordsCount} lokasyon kaydı birleştirildi, ${transferredRelationsCount} bağlı kayıt (Risk, Yangın, Hazmat vb.) hedef lokasyona aktarıldı.`,
  };
}

