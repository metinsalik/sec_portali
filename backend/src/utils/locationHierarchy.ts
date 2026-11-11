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
  }
) {
  if (params.id) {
    await prisma.facilityLocation.update({
      where: { id: params.id },
      data: { isActive: false },
    });
    return { deletedCount: 1 };
  }

  const allLocs = await prisma.facilityLocation.findMany({
    where: {
      facilityId: params.facilityId,
      isActive: true,
      OR: [{ type: null }, { type: { not: 'TEMIZLIK_ARABASI' } }],
    },
    include: { facilityBuilding: true },
  });

  const targetVal = isPlaceholder(params.value) ? '' : cleanStr(params.value);

  const idsToDeactivate = allLocs
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

  if (idsToDeactivate.length > 0) {
    await prisma.facilityLocation.updateMany({
      where: { id: { in: idsToDeactivate } },
      data: { isActive: false },
    });
  }

  return { deletedCount: idsToDeactivate.length };
}

