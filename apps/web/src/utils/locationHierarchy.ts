export interface NormalizedLocationParts {
  buildingName: string; // Bina Adı
  block: string;        // Blok
  floor: string;        // Kat
  department: string;   // Birim
  description: string;  // Mahal
}

const cleanStr = (val?: string | null): string => (val ? String(val).trim() : '');

/**
 * Extracts normalized 5-level hierarchy (Bina Adı > Blok > Kat > Birim > Mahal)
 * from both new structured rows and legacy FacilityLocation rows.
 */
export function extractLocationParts(loc: any): NormalizedLocationParts {
  if (!loc) {
    return { buildingName: '', block: '', floor: '', department: '', description: '' };
  }

  const rawBuildingName = cleanStr(loc.buildingName) || cleanStr(loc.facilityBuilding?.name);
  const rawBuilding = cleanStr(loc.building);
  const rawFloor = cleanStr(loc.floor);
  const rawDepartment = cleanStr(loc.department);
  let rawDescription = cleanStr(loc.description);

  let buildingName = rawBuildingName;
  let block = '';

  if (buildingName) {
    if (rawBuilding && rawBuilding.toLowerCase() !== buildingName.toLowerCase()) {
      const parenMatch = rawBuilding.match(/^(.+?)\s*\((.+?)\)$/);
      if (parenMatch && parenMatch[1].trim().toLowerCase() === buildingName.toLowerCase()) {
        block = parenMatch[2].trim();
      } else {
        block = rawBuilding;
      }
    }
  } else if (rawBuilding) {
    const parenMatch = rawBuilding.match(/^(.+?)\s*\((.+?)\)$/);
    if (parenMatch) {
      buildingName = parenMatch[1].trim();
      block = parenMatch[2].trim();
    } else {
      buildingName = rawBuilding;
    }
  }

  // Strip legacy bogus description where block/building name was duplicated into KAT rows
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

export function getLocationPathSegments(loc: any): string[] {
  const parts = extractLocationParts(loc);
  const segments = [
    parts.buildingName,
    parts.block,
    parts.floor,
    parts.department,
    parts.description,
  ].filter(Boolean);

  if (segments.length === 0 && loc?.name) {
    return [cleanStr(loc.name)];
  }
  return segments;
}

export function formatLocationBreadcrumb(loc: any, separator = ' › '): string {
  const segments = getLocationPathSegments(loc);
  return segments.length > 0 ? segments.join(separator) : (cleanStr(loc?.name) || 'İsimsiz Lokasyon');
}

export function encodeGroup5LocationId(parts: Partial<NormalizedLocationParts>): string {
  const enc = (v?: string) => encodeURIComponent(cleanStr(v));
  return `group5:${enc(parts.buildingName)}|${enc(parts.block)}|${enc(parts.floor)}|${enc(parts.department)}|${enc(parts.description)}`;
}

export function decodeGroup5LocationId(id: string): NormalizedLocationParts | null {
  if (!id || !id.startsWith('group5:')) return null;
  const raw = id.slice('group5:'.length);
  const [buildingName = '', block = '', floor = '', department = '', description = ''] = raw
    .split('|')
    .map((s) => {
      try {
        return decodeURIComponent(s || '');
      } catch {
        return s || '';
      }
    });
  return { buildingName, block, floor, department, description };
}

export function formatGroup5Breadcrumb(id: string, separator = ' › '): string {
  const p = decodeGroup5LocationId(id);
  if (!p) return id;
  return [p.buildingName, p.block, p.floor, p.department, p.description].filter(Boolean).join(separator) || id;
}


