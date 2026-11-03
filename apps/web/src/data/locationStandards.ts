// Corporate Standard Facilities, Floors, and Building Blocks with Official Abbreviations
// MLP Care / SEC Portali standardizasyon rehberi

export interface StandardFacility {
  name: string;
  code: string;
}

export interface StandardFloor {
  name: string;
  code: string;
}

export interface StandardBlock {
  name: string;
  code: string;
}

// 1. Tesisler ve Resmi 3 Harfli Kısaltmaları
export const STANDARD_FACILITY_CODES: StandardFacility[] = [
  { name: 'İSÜ Liv Bahçeşehir', code: 'BHC' },
  { name: 'İSÜ Liv Topkapı', code: 'TPK' },
  { name: 'İSÜ MP Gaziosmanpaşa', code: 'GOP' },
  { name: 'İSÜ Tıp Fakültesi', code: 'TFK' },
  { name: 'Liv Ankara', code: 'ANL' },
  { name: 'Liv Gaziantep', code: 'GZN' },
  { name: 'Liv Samsun', code: 'SML' },
  { name: 'Liv Ulus', code: 'ULS' },
  { name: 'Liv Vadi', code: 'VAD' },
  { name: 'MP Adana', code: 'ADN' },
  { name: 'MP Ankara', code: 'ANM' },
  { name: 'MP Antalya', code: 'ANT' },
  { name: 'MP Ataşehir', code: 'ATS' },
  { name: 'MP Bahçelievler', code: 'BAH' },
  { name: 'MP Gebze', code: 'GBZ' },
  { name: 'MP Göztepe', code: 'GOZ' },
  { name: 'MP İzmir', code: 'IZM' },
  { name: 'MP Ordu', code: 'ORD' },
  { name: 'MP Seyhan', code: 'SYH' },
  { name: 'MP Tem', code: 'TEM' },
  { name: 'MP Tokat', code: 'TKT' },
  { name: 'MP Karadeniz', code: 'KAR' },
  { name: 'MP Yıldızlı', code: 'TRB' },
  { name: 'MP İstanbul Onkoloji', code: 'ONK' },
  { name: 'VM MP Ankara', code: 'ANW' },
  { name: 'VM MP Bursa', code: 'BUR' },
  { name: 'VM MP Fatih', code: 'FTH' },
  { name: 'VM MP Florya', code: 'FLR' },
  { name: 'VM MP Kocaeli', code: 'KOC' },
  { name: 'VM MP Maltepe', code: 'MLT' },
  { name: 'VM MP Mersin', code: 'MRS' },
  { name: 'VM MP Pendik', code: 'PEN' },
  { name: 'VM MP Samsun', code: 'SMW' },
  { name: 'İstinye Dent', code: 'DNT' },
  { name: 'GOP Diyaliz', code: 'DYZ' },
];

// 2. Katlar ve Resmi Kısaltmaları
export const STANDARD_FLOORS: StandardFloor[] = [
  { name: 'Z.Kat', code: 'ZK' },
  { name: '1.Kat', code: '1K' },
  { name: '2.Kat', code: '2K' },
  { name: '3.Kat', code: '3K' },
  { name: '4.Kat', code: '4K' },
  { name: '5.Kat', code: '5K' },
  { name: '6.Kat', code: '6K' },
  { name: '7.Kat', code: '7K' },
  { name: '8.Kat', code: '8K' },
  { name: '9.Kat', code: '9K' },
  { name: '10.Kat', code: '10K' },
  { name: '11.Kat', code: '11K' },
  { name: '12.Kat', code: '12K' },
  { name: '13.Kat', code: '13K' },
  { name: '14.Kat', code: '14K' },
  { name: '15.Kat', code: '15K' },
  { name: 'B1.Kat', code: 'B1K' },
  { name: 'B2.Kat', code: 'B2K' },
  { name: 'B3.Kat', code: 'B3K' },
  { name: 'B4.Kat', code: 'B4K' },
  { name: 'B5.Kat', code: 'B5K' },
  { name: 'B6.Kat', code: 'B6K' },
  { name: 'B7.Kat', code: 'B7K' },
  { name: 'B8.Kat', code: 'B8K' },
  { name: 'T1.Kat', code: 'T1K' },
  { name: 'T2.Kat', code: 'T2K' },
  { name: 'T3.Kat', code: 'T3K' },
  { name: 'Ara Kat', code: 'ARK' },
  { name: 'Asma Kat', code: 'ASK' },
  { name: 'Teras Kat', code: 'TRK' },
  { name: 'Çatı Katı', code: 'CTK' },
];

// 3. Bloklar / Binalar ve Resmi Kısaltmaları
export const STANDARD_BLOCKS: StandardBlock[] = [
  { name: 'Ana Bina', code: 'ANB' },
  { name: 'Ek Bina', code: 'EKB' },
  { name: 'A Blok', code: 'ABL' },
  { name: 'B Blok', code: 'BBL' },
  { name: 'C Blok', code: 'CBL' },
  { name: 'D Blok', code: 'DBL' },
  { name: 'E Blok', code: 'EBL' },
];

// ─────────────────────────────────────────────────────────────
// Yardımcı Fonksiyonlar (Helpers)
// ─────────────────────────────────────────────────────────────

/**
 * Tesis adı veya koduna göre standart tesis bilgisini döner.
 */
export function findStandardFacility(query: string): StandardFacility | undefined {
  if (!query) return undefined;
  const clean = query.trim().toLowerCase();
  return STANDARD_FACILITY_CODES.find(
    f => f.code.toLowerCase() === clean || f.name.toLowerCase() === clean || f.name.toLowerCase().includes(clean)
  );
}

/**
 * Kat adı veya kısaltmasına göre standart kat bilgisini döner.
 */
export function findStandardFloor(query: string): StandardFloor | undefined {
  if (!query) return undefined;
  const clean = query.trim().toLowerCase();
  return STANDARD_FLOORS.find(
    f => f.code.toLowerCase() === clean || f.name.toLowerCase() === clean
  );
}

/**
 * Kat adından veya giriş metninden kat kodunu bulur.
 */
export function getFloorCode(floorName: string): string {
  if (!floorName) return '';
  const match = findStandardFloor(floorName);
  if (match) return match.code;
  
  // Basit yedek tespit (Örn: "1. Kat" -> "1K", "Zemin" -> "ZK")
  const trimmed = floorName.trim();
  const numMatch = trimmed.match(/^(\d+)/);
  if (numMatch) return `${numMatch[1]}K`;
  if (/zemin/i.test(trimmed)) return 'ZK';
  if (/bodrum\s*1|b1/i.test(trimmed)) return 'B1K';
  if (/bodrum\s*2|b2/i.test(trimmed)) return 'B2K';
  if (/bodrum\s*3|b3/i.test(trimmed)) return 'B3K';
  return trimmed.substring(0, 3).toUpperCase();
}

/**
 * Blok adı veya kısaltmasına göre standart blok bilgisini döner.
 */
export function findStandardBlock(query: string): StandardBlock | undefined {
  if (!query) return undefined;
  const clean = query.trim().toLowerCase();
  return STANDARD_BLOCKS.find(
    b => b.code.toLowerCase() === clean || b.name.toLowerCase() === clean
  );
}

/**
 * Blok adından veya giriş metninden blok kodunu bulur.
 */
export function getBlockCode(blockName: string): string {
  if (!blockName) return '';
  const match = findStandardBlock(blockName);
  if (match) return match.code;

  const trimmed = blockName.trim();
  const blockLetterMatch = trimmed.match(/^([A-E])\s*(blok)?/i);
  if (blockLetterMatch) return `${blockLetterMatch[1].toUpperCase()}BL`;
  if (/ana/i.test(trimmed)) return 'ANB';
  if (/ek/i.test(trimmed)) return 'EKB';
  return trimmed.substring(0, 3).toUpperCase();
}

/**
 * Kurumsal lokasyon kod kombinasyonu üretir (Örn: ABL-1K veya ANM-ABL-1K).
 */
export function generateLocationCode(block: string, floor: string, facilityCode?: string): string {
  const bCode = getBlockCode(block);
  const fCode = getFloorCode(floor);
  const parts = [];
  if (facilityCode) parts.push(facilityCode.toUpperCase());
  if (bCode) parts.push(bCode);
  if (fCode) parts.push(fCode);
  return parts.join('-');
}
