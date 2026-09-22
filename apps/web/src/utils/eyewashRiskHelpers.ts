/**
 * Location and chemical calculation helpers for Hazmat Eyewash Risk Analysis
 */

export function formatLocationName(departmentValue: string | null | undefined, locations: any[] = []): string {
  if (!departmentValue) return '-';

  // If department is already a human-readable formatted string (contains ' - ' or ' / ' and not a UUID/group code)
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(departmentValue);
  const isGroup = departmentValue.startsWith('group:');

  if (!isUuid && !isGroup) {
    return departmentValue;
  }

  // If it's a UUID, look up directly in locations
  if (isUuid && locations?.length > 0) {
    const loc = locations.find((l: any) => l.id === departmentValue);
    if (loc) {
      return buildLocationDisplayName(loc);
    }
  }

  // If it's a group: {level}:{facId}:{building}|{floor}|{department}
  if (isGroup) {
    const parts = departmentValue.split(':');
    const path = parts.slice(3).join(':');
    if (path) {
      const pathParts = path.split('|').filter(Boolean);
      return pathParts.join(' / ');
    }
  }

  return departmentValue;
}

export function buildLocationDisplayName(loc: any): string {
  if (!loc) return '-';
  const parts: string[] = [];
  if (loc.building) parts.push(loc.building);
  if (loc.floor) parts.push(loc.floor);
  if (loc.department) parts.push(loc.department);
  if (loc.description) parts.push(loc.description);
  
  if (parts.length > 0) {
    return parts.join(' / ');
  }
  return loc.name || loc.id;
}

export function convertToLiters(boxes: number | null | undefined, amountPerBox: number | null | undefined, unitName: string | null | undefined): number {
  const count = boxes !== null && boxes !== undefined ? boxes : 1;
  const perBox = amountPerBox !== null && amountPerBox !== undefined ? amountPerBox : 1;
  const u = (unitName || '').toLowerCase().trim();

  // If unit is Litre:
  if (u === 'litre' || u === 'l') {
    return count * perBox;
  }
  // If unit is Mililitre:
  if (u === 'mililitre' || u === 'ml') {
    return (count * perBox) / 1000;
  }
  // If unit is Kilogram: assume water/solution density 1 kg ~ 1 L
  if (u === 'kilogram' || u === 'kg') {
    return count * perBox;
  }
  // If unit is Gram:
  if (u === 'gram' || u === 'g') {
    return (count * perBox) / 1000;
  }
  // If unit is Miligram:
  if (u === 'miligram' || u === 'mg') {
    return (count * perBox) / 1000000;
  }
  // If unit is Metreküp:
  if (u === 'metreküp' || u === 'm³' || u === 'm3') {
    return count * perBox * 1000;
  }
  // If unit is Adet:
  if (u === 'adet') {
    // If perBox is very large like wipe count (e.g., 3500), each pack/box is approx 1L
    if (perBox > 50) return count * 1;
    return count * perBox;
  }

  return count * perBox;
}

export interface ClassifiedChemicals {
  yanici: boolean;
  asindirici: boolean;
  tahrisEdici: boolean;
  oksitleyici: boolean;
  toksik: boolean;
  kanserojen: boolean;
  bulasici: boolean;
}

export function classifyChemical(hazardDesc?: string | null, composition?: string | null, prodName?: string | null): ClassifiedChemicals {
  const text = `${hazardDesc || ''} ${composition || ''} ${prodName || ''}`.toLowerCase();
  return {
    yanici: /yanıcı|alevlenir|parlayıcı|tutuş|h220|h221|h222|h224|h225|h226|h228|alkol|etanol|izopropil|aseton|tiner/i.test(text),
    asindirici: /aşındırıcı|asindirici|aşınma|korozif|corrosive|h314|h290|asit|hidroklorik|sülfürik|kostik|hidroksit/i.test(text),
    tahrisEdici: /tahriş|tahris|irritan|h315|h319|h335|göz hasarı|ciddi göz/i.test(text),
    oksitleyici: /oksitleyici|oksidan|h270|h271|h272|peroksit|oksijen/i.test(text),
    toksik: /toksik|zehirli|toxic|h300|h301|h302|h310|h311|h312|h330|h331|h332|euh032/i.test(text),
    kanserojen: /kanser|kanserojen|carcinogen|h350|h351|mutajen|h340|h341|üreme|h360|h361|formaldehit/i.test(text),
    bulasici: /bulaşıcı|bulasici|biyolojik|enfeksiyon|kan|serum|plazma|tıbbi atık|h399/i.test(text)
  };
}
