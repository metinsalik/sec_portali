import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import * as XLSX from 'xlsx';

const prisma = new PrismaClient();
const router = Router();

// ──────────────────────────────────────────────────────────────────────────────
// KATEGORİ VE RİSK KAVRAM EŞLEŞTİRME SİSTEMİ
// ──────────────────────────────────────────────────────────────────────────────
export const STANDARD_CATEGORIES = [
  'Sızdırmazlık & Oda Bütünlüğü',
  'Alarm & Entegrasyon',
  'Gaz Tahliyesi & Güvenlik',
  'Tüp & Gaz Depolama',
  'Periyodik Kontrol & Bakım',
  'Kontrol Paneli & Sistem Modu',
  'Nozul & Dağılım',
  'Algılama (Dedektör)',
  'Diğer'
] as const;

export const STANDARD_RISKS = [
  'Söndürme İşleminin Yapılamaması',
  'Yangından Haberdar Olamama',
  'Sistemin Güvenilir Çalışmaması',
  'Zehirlenme',
  'Tüpe Yapılan İşlemleri İzleyememe',
  'Cihaz Arızası/ Tüp Boşalması',
  'Acil Duruma Manuel Müdahalede Gecikme',
  'Diğer'
] as const;

// Excel'deki "veri" sayfası ve denetim kriterlerine dayalı varsayılan kategori -> risk eşleştirmesi
export const CATEGORY_DEFAULT_RISK: Record<string, string> = {
  'Sızdırmazlık & Oda Bütünlüğü': 'Söndürme İşleminin Yapılamaması',
  'Alarm & Entegrasyon': 'Yangından Haberdar Olamama',
  'Gaz Tahliyesi & Güvenlik': 'Sistemin Güvenilir Çalışmaması',
  'Tüp & Gaz Depolama': 'Zehirlenme',
  'Periyodik Kontrol & Bakım': 'Tüpe Yapılan İşlemleri İzleyememe',
  'Kontrol Paneli & Sistem Modu': 'Cihaz Arızası/ Tüp Boşalması',
  'Nozul & Dağılım': 'Sistemin Güvenilir Çalışmaması',
  'Algılama (Dedektör)': 'Acil Duruma Manuel Müdahalede Gecikme',
  'Diğer': 'Diğer'
};

// FM200 25 Denetim Kriteri -> Kategori ve Risk Eşleştirmesi
export const CRITERIA_MAPPING: Record<number, { category: string; risk: string }> = {
  1: { category: 'Tüp & Gaz Depolama', risk: 'Sistemin Güvenilir Çalışmaması' },
  2: { category: 'Tüp & Gaz Depolama', risk: 'Cihaz Arızası/ Tüp Boşalması' },
  3: { category: 'Kontrol Paneli & Sistem Modu', risk: 'Acil Duruma Manuel Müdahalede Gecikme' },
  4: { category: 'Sızdırmazlık & Oda Bütünlüğü', risk: 'Söndürme İşleminin Yapılamaması' },
  5: { category: 'Sızdırmazlık & Oda Bütünlüğü', risk: 'Söndürme İşleminin Yapılamaması' },
  6: { category: 'Sızdırmazlık & Oda Bütünlüğü', risk: 'Söndürme İşleminin Yapılamaması' },
  7: { category: 'Sızdırmazlık & Oda Bütünlüğü', risk: 'Diğer' },
  8: { category: 'Sızdırmazlık & Oda Bütünlüğü', risk: 'Söndürme İşleminin Yapılamaması' },
  9: { category: 'Tüp & Gaz Depolama', risk: 'Tüpe Yapılan İşlemleri İzleyememe' },
  10: { category: 'Tüp & Gaz Depolama', risk: 'Tüpe Yapılan İşlemleri İzleyememe' },
  11: { category: 'Gaz Tahliyesi & Güvenlik', risk: 'Diğer' },
  12: { category: 'Tüp & Gaz Depolama', risk: 'Sistemin Güvenilir Çalışmaması' },
  13: { category: 'Kontrol Paneli & Sistem Modu', risk: 'Sistemin Güvenilir Çalışmaması' },
  14: { category: 'Kontrol Paneli & Sistem Modu', risk: 'Cihaz Arızası/ Tüp Boşalması' },
  15: { category: 'Nozul & Dağılım', risk: 'Söndürme İşleminin Yapılamaması' },
  16: { category: 'Nozul & Dağılım', risk: 'Sistemin Güvenilir Çalışmaması' },
  17: { category: 'Algılama (Dedektör)', risk: 'Yangından Haberdar Olamama' },
  18: { category: 'Algılama (Dedektör)', risk: 'Yangından Haberdar Olamama' },
  19: { category: 'Algılama (Dedektör)', risk: 'Yangından Haberdar Olamama' },
  20: { category: 'Periyodik Kontrol & Bakım', risk: 'Sistemin Güvenilir Çalışmaması' },
  21: { category: 'Periyodik Kontrol & Bakım', risk: 'Tüpe Yapılan İşlemleri İzleyememe' },
  22: { category: 'Alarm & Entegrasyon', risk: 'Yangından Haberdar Olamama' },
  23: { category: 'Alarm & Entegrasyon', risk: 'Yangından Haberdar Olamama' },
  24: { category: 'Alarm & Entegrasyon', risk: 'Sistemin Güvenilir Çalışmaması' },
  25: { category: 'Gaz Tahliyesi & Güvenlik', risk: 'Zehirlenme' }
};

// Eski / alternatif kategori isimlerini standart kategorilere bağlama
export function mapToStandardCategory(rawCat: string | null | undefined, questionText?: string): string {
  if (!rawCat || rawCat.trim() === '-' || rawCat.trim() === '') {
    if (questionText) {
      const match = questionText.match(/\[Kriter\s*(\d+)\]/i);
      if (match && match[1]) {
        const qNum = parseInt(match[1], 10);
        if (CRITERIA_MAPPING[qNum]) return CRITERIA_MAPPING[qNum].category;
      }
    }
    return 'Diğer';
  }

  const trimmed = rawCat.trim();
  const lower = trimmed.toLowerCase();

  if (lower.includes('sızdırmazlık') || lower.includes('bütünlüğü') || lower.includes('sizdirmazlik')) {
    return 'Sızdırmazlık & Oda Bütünlüğü';
  }
  if (lower.includes('alarm') || lower.includes('entegrasyon')) {
    return 'Alarm & Entegrasyon';
  }
  if (lower.includes('gaz tahliyesi') || lower.includes('tahliye')) {
    return 'Gaz Tahliyesi & Güvenlik';
  }
  if (lower.includes('tüp') || lower.includes('tup') || lower.includes('depolama') || lower.includes('etiketleme')) {
    return 'Tüp & Gaz Depolama';
  }
  if (lower.includes('periyodik') || lower.includes('bakım') || lower.includes('bakim')) {
    return 'Periyodik Kontrol & Bakım';
  }
  if (lower.includes('kontrol paneli') || lower.includes('panel') || lower.includes('sistem modu')) {
    return 'Kontrol Paneli & Sistem Modu';
  }
  if (lower.includes('nozul') || lower.includes('dağılım') || lower.includes('dagilim')) {
    return 'Nozul & Dağılım';
  }
  if (lower.includes('algılama') || lower.includes('algilama') || lower.includes('dedektör') || lower.includes('dedektor')) {
    return 'Algılama (Dedektör)';
  }
  if (lower.includes('fiziksel')) {
    return 'Sızdırmazlık & Oda Bütünlüğü';
  }
  if (lower.includes('acil durum')) {
    return 'Alarm & Entegrasyon';
  }
  if (lower.includes('tesisat') || lower.includes('donanım')) {
    return 'Tüp & Gaz Depolama';
  }

  return trimmed;
}

// Risk isimlerini standart risklere bağlama
export function mapToStandardRisk(rawRisk: string | null | undefined, category: string, questionText?: string): string {
  if (!rawRisk || rawRisk.trim() === '-' || rawRisk.trim() === '') {
    if (questionText) {
      const match = questionText.match(/\[Kriter\s*(\d+)\]/i);
      if (match && match[1]) {
        const qNum = parseInt(match[1], 10);
        if (CRITERIA_MAPPING[qNum]) return CRITERIA_MAPPING[qNum].risk;
      }
    }
    return CATEGORY_DEFAULT_RISK[category] || 'Diğer';
  }

  const trimmed = rawRisk.trim();
  const lower = trimmed.toLowerCase();

  if (lower.includes('zehirlenme')) return 'Zehirlenme';
  if (lower.includes('haberdar') || lower.includes('yangından')) return 'Yangından Haberdar Olamama';
  if (lower.includes('izleyememe') || lower.includes('tüpe yapılan')) return 'Tüpe Yapılan İşlemleri İzleyememe';
  if (lower.includes('güvenilir') || lower.includes('guvenilir') || lower.includes('sistemin güvenilir')) return 'Sistemin Güvenilir Çalışmaması';
  if (lower.includes('söndürme') || lower.includes('sondurme') || lower.includes('işleminin yapılamaması')) return 'Söndürme İşleminin Yapılamaması';
  if (lower.includes('müdahalede gecikme') || lower.includes('manuel müdahale') || lower.includes('acil duruma')) return 'Acil Duruma Manuel Müdahalede Gecikme';
  if (lower.includes('arızası') || lower.includes('arizasi') || lower.includes('tüp boşalması') || lower.includes('tup bosalmasi')) return 'Cihaz Arızası/ Tüp Boşalması';

  return trimmed || CATEGORY_DEFAULT_RISK[category] || 'Diğer';
}

// ──────────────────────────────────────────────────────────────────────────────
// HASTANE İSİM VE KİMLİK EŞLEŞTİRME SİSTEMİ
// ──────────────────────────────────────────────────────────────────────────────
export const cleanKey = (str: string | null | undefined): string => {
  return (str || '')
    .toString()
    .toLowerCase()
    .replace(/i̇/g, 'i')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/ç/g, 'c')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/[^a-z0-9]/g, '');
};

const HOSPITAL_ALIASES: Record<string, string> = {
  'istinyeuniversitesilivhospitalbahcesehir': 'İSU-LIV-BAHCES',
  'isulivbahcesehir': 'İSU-LIV-BAHCES',
  'livhospitalbahcesehir': 'İSU-LIV-BAHCES',
  'istinyeuniversitesilivhospitaltopkapi': 'İSU-LIV-TOPKAP',
  'isulivtopkapi': 'İSU-LIV-TOPKAP',
  'livhospitaltopkapi': 'İSU-LIV-TOPKAP',
  'istinyeuniversitesimedicalparkhastanesi': 'İSU-MP-GAZIOSM',
  'isumpgaziosmanpasa': 'İSU-MP-GAZIOSM',
  'mpgaziosmanpasa': 'İSU-MP-GAZIOSM',
  'istinyeuniversitesitipfakultesihastanesi': 'İSU-TIP-FAKULT',
  'isutipfakultesi': 'İSU-TIP-FAKULT',
  'tipfakultesi': 'İSU-TIP-FAKULT',
  'livhospitalankara': 'LIV-ANKARA',
  'livankara': 'LIV-ANKARA',
  'livhospitalgaziantep': 'LIV-GAZIANTEP',
  'livgaziantep': 'LIV-GAZIANTEP',
  'livhospitalsamsun': 'LIV-SAMSUN',
  'livsamsun': 'LIV-SAMSUN',
  'livhospitalulus': 'LIV-ULUS',
  'livulus': 'LIV-ULUS',
  'livhospitalvadistanbul': 'LIV-VADI',
  'livvadi': 'LIV-VADI',
  'medicalparkadanahastanesi': 'MP-ADANA',
  'mpadana': 'MP-ADANA',
  'medicalparkankarabatikenthastanesi': 'MP-ANKARA',
  'medicalparkankarahastanesi': 'MP-ANKARA',
  'mpankara': 'MP-ANKARA',
  'medicalparkantalyahastanesi': 'MP-ANTALYA',
  'mpantalya': 'MP-ANTALYA',
  'medicalparkatasehirhastanesi': 'MP-ATASEHIR',
  'mpatasehir': 'MP-ATASEHIR',
  'medicalparkbahcelievlerhastanesi': 'MP-BAHCELIEVLER',
  'mpbahcelievler': 'MP-BAHCELIEVLER',
  'medicalparkgebzehastanesi': 'MP-GEBZE',
  'mpgebze': 'MP-GEBZE',
  'medicalparkgoztepehastanesi': 'MP-GOZTEPE',
  'mpgoztepe': 'MP-GOZTEPE',
  'medicalparkizmirhastanesi': 'MP-İZMIR',
  'mpizmir': 'MP-İZMIR',
  'medicalparkorduhastanesi': 'MP-ORDU',
  'mpordu': 'MP-ORDU',
  'medicalparkseyhanhastanesi': 'MP-SEYHAN',
  'mpseyhan': 'MP-SEYHAN',
  'medicalparktemhastanesi': 'MP-TEM',
  'mptem': 'MP-TEM',
  'medicalparktokathastanesi': 'MP-TOKAT',
  'mptokat': 'MP-TOKAT',
  'medicalparkkaradenizhastanesi': 'MP-KARADENIZ',
  'mpkaradeniz': 'MP-KARADENIZ',
  'medicalparkyildizlihastanesi': 'MP-YILDIZLI',
  'mpyildizli': 'MP-YILDIZLI',
  'vmmedicalparkankarakeciorenhastanesi': 'VM-MP-ANKARA',
  'vmmpankara': 'VM-MP-ANKARA',
  'vmmedicalparkbursahastanesi': 'VM-MP-BURSA',
  'vmmpbursa': 'VM-MP-BURSA',
  'vmmedicalparkgebzefatihhastanesi': 'VM-MP-FATIH',
  'vmmpfatih': 'VM-MP-FATIH',
  'vmmedicalparkfloryahastanesi': 'VM-MP-FLORYA',
  'vmmpflorya': 'VM-MP-FLORYA',
  'vmmedicalparkkocaelihastanesi': 'VM-MP-KOCAELI',
  'vmmpkocaeli': 'VM-MP-KOCAELI',
  'vmmedicalparkmaltepehastanesi': 'VM-MP-MALTEPE',
  'vmmpmaltepe': 'VM-MP-MALTEPE',
  'vmmedicalparkmersinhastanesi': 'VM-MP-MERSIN',
  'vmmpmersin': 'VM-MP-MERSIN',
  'vmmedicalparkpendikhastanesi': 'VM-MP-PENDIK',
  'vmmppendik': 'VM-MP-PENDIK',
  'vmmedicalparksamsunhastanesi': 'VM-MP-SAMSUN',
  'vmmpsamsun': 'VM-MP-SAMSUN',
  'ozelistanbulonkolojihastanesi': 'MP-İSTANBUL-ON',
  'mpistanbulonkoloji': 'MP-İSTANBUL-ON',
  'istanbulonkolojihastanesi': 'MP-İSTANBUL-ON'
};

export function matchFacilityWithDB(
  rawName: string,
  facilities: Array<{ id: string; name: string; shortName?: string | null }>
): { id: string; name: string } | null {
  if (!rawName) return null;
  const k = cleanKey(rawName);

  // 1. Alias Haritası kontrolü
  const targetId = HOSPITAL_ALIASES[k];
  if (targetId) {
    const f = facilities.find((fac) => cleanKey(fac.id) === cleanKey(targetId));
    if (f) return { id: f.id, name: f.name };
  }

  // 2. Birebir ID, name veya shortName eşleşmesi
  for (const fac of facilities) {
    if (cleanKey(fac.id) === k || cleanKey(fac.name) === k || (fac.shortName && cleanKey(fac.shortName) === k)) {
      return { id: fac.id, name: fac.name };
    }
  }

  // 3. Alt dize (substring) kapsama eşleşmesi
  for (const fac of facilities) {
    const fn = cleanKey(fac.name);
    const fs = fac.shortName ? cleanKey(fac.shortName) : '';
    if (fn.length >= 4 && (k.includes(fn) || fn.includes(k))) {
      return { id: fac.id, name: fac.name };
    }
    if (fs.length >= 4 && (k.includes(fs) || fs.includes(k))) {
      return { id: fac.id, name: fac.name };
    }
  }

  return null;
}

// ──────────────────────────────────────────────────────────────────────────────
// SAHA İŞ LİSTESİ VERİ MODELİ
// ──────────────────────────────────────────────────────────────────────────────
export interface FieldReportItem {
  sira: number;
  tesis: string;
  facilityId?: string | null;
  facilityName?: string | null;
  konum: string;
  mahalTuru: string;
  mahalAdiUid: string;
  kriterSoru: string;
  kategori: string;
  risk: string;
  ekAciklama: string;
  sorumluEkip: string;
  durum: string; // 'Tamamlandı', 'Devam ediyor', 'Başlamadı', 'Tespit Edildi', 'İptal'
  kayitTarihi?: string;
  terminTarihi?: string;
  aksiyon?: string;
  isEffectiveCompleted: boolean;
  scoreWeight: number; // Tamamlandı = 1, Devam Ediyor = 0.5, Diğerleri = 0
}

export interface FacilityRoomGroup {
  mahalAdiUid: string;
  konum: string;
  mahalTuru: string;
  totalActions: number;
  completedCount: number;
  inProgressCount: number;
  notStartedCount: number;
  detectedCount: number;
  effectiveCompletedPoints: number;
  roomSecurityRate: number;
  items: FieldReportItem[];
}

export interface FacilityFieldSummary {
  tesis: string;
  facilityId: string | null;
  facilityName: string | null;
  totalItems: number;
  uniqueRoomCount: number; // Tekil mahal / oda sayısı (Pano / Mahal Adı UID deduplication)
  actionedRoomCount: number; // İşlem yapılan oda sayısı (completedCount > 0 olan odalar)
  rooms: FacilityRoomGroup[]; // Mahale göre gruplanmış aksiyonlar
  doorfanCount: number; // Kriter 8 / Doorfan testleri
  preventiveMaintenanceCount: number; // Bakım / Tüp / Donanım kontrolleri
  periodicControlCount: number; // Alarm, algılama, damper, otomasyon kontrolleri
  tightnessCount: number; // Sızdırmazlık kriterleri
  completedCount: number; // Tamamlandı (x1.0)
  inProgressCount: number; // Devam Ediyor (x0.5)
  notStartedCount: number; // Başlamadı (x0)
  detectedCount: number; // Tespit Edildi (x0)
  cancelledCount: number; // İptal
  otherCount: number;
  effectiveCompletedPoints: number; // (completedCount * 1.0) + (inProgressCount * 0.5)
  securityReportRate: number; // % (effectiveCompletedPoints / totalItems) * 100
  iletilmeDurumu: string | null;
  hastaneNotu: string | null;
  categories: Record<string, number>;
  risks: Record<string, number>;
  items: FieldReportItem[];
}

export interface ConsolidatedFieldReport {
  uploadedAt: string;
  fileName: string;
  totalFacilities: number;
  totalItems: number;
  overallSecurityReportRate: number;
  overallCompleted: number;
  overallInProgress: number;
  overallNotStarted: number;
  overallDetected: number;
  overallCancelled: number;
  effectiveCompletedPoints: number;
  facilitySummaries: Record<string, FacilityFieldSummary>; // keyed by facilityId or normalized tesis
  hospitalNotes: Record<string, { iletilmeDurumu: string | null; not: string | null }>;
  categoryRiskMap: Record<string, string[]>;
}

// Dosya Saklama Yolları
const getReportsDir = () => {
  const dir = path.join(process.cwd(), 'uploads', 'fm200', 'reports');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
};

const getLatestJsonPath = () => path.join(getReportsDir(), 'field_report_latest.json');
const getLatestExcelPath = () => path.join(getReportsDir(), 'field_report_latest.xlsx');

// ──────────────────────────────────────────────────────────────────────────────
// EXCEL PARSER FONKSİYONU
// ──────────────────────────────────────────────────────────────────────────────
export async function parseFieldReportExcel(
  bufferOrPath: Buffer | string,
  fileName: string = 'FM200_Saha_Is_Listesi_Raporu.xlsx'
): Promise<ConsolidatedFieldReport> {
  const facilities = await prisma.facility.findMany({
    select: { id: true, name: true, shortName: true }
  });

  const wb = typeof bufferOrPath === 'string'
    ? XLSX.readFile(bufferOrPath)
    : XLSX.read(bufferOrPath, { type: 'buffer' });

  // 1. Hastane İletilme Durumları Sayfası
  const hospitalNotes: Record<string, { iletilmeDurumu: string | null; not: string | null }> = {};
  if (wb.SheetNames.includes('Hastane')) {
    const wsH = wb.Sheets['Hastane'];
    const hData = XLSX.utils.sheet_to_json(wsH, { header: 1 }) as any[][];
    for (let i = 1; i < hData.length; i++) {
      const row = hData[i];
      if (!row || !row[1]) continue;
      const rawHosp = String(row[1]).trim();
      const iletilme = row[2] ? String(row[2]).trim() : null;
      const not = row[3] ? String(row[3]).trim() : null;

      const matched = matchFacilityWithDB(rawHosp, facilities);
      const key = matched ? matched.id : cleanKey(rawHosp);
      hospitalNotes[key] = { iletilmeDurumu: iletilme, not: not };
    }
  }

  // 2. Veri Sayfası (Kategori & Risk Eşleşmeleri)
  const categoryRiskMap: Record<string, string[]> = {};
  if (wb.SheetNames.includes('veri')) {
    const wsV = wb.Sheets['veri'];
    const vData = XLSX.utils.sheet_to_json(wsV, { header: 1 }) as any[][];
    for (let i = 1; i < vData.length; i++) {
      const row = vData[i];
      if (!row) continue;
      const cat = row[0] ? String(row[0]).trim() : 'Genel';
      const risk = row[1] ? String(row[1]).trim() : 'Diğer';
      if (!categoryRiskMap[cat]) categoryRiskMap[cat] = [];
      if (!categoryRiskMap[cat].includes(risk)) categoryRiskMap[cat].push(risk);
    }
  }

  // 3. FM-200 Saha İş Listesi Sayfası
  const sheetName = wb.SheetNames.find((s) => s.toLowerCase().includes('saha') || s.toLowerCase().includes('fm-200')) || wb.SheetNames[0];
  const wsWorks = wb.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json(wsWorks, { header: 1 }) as any[][];

  // Başlık satırını bul (Genelde Satır 1)
  let headerIndex = 1;
  for (let i = 0; i < Math.min(5, rawRows.length); i++) {
    if (rawRows[i] && (rawRows[i].includes('Tesis') || rawRows[i].includes('Durum') || rawRows[i].includes('Sıra'))) {
      headerIndex = i;
      break;
    }
  }

  const facilitySummaries: Record<string, FacilityFieldSummary> = {};
  const facilityRoomMaps: Record<string, Record<string, FacilityRoomGroup>> = {};
  let totalItems = 0;
  let overallCompleted = 0;
  let overallInProgress = 0;
  let overallNotStarted = 0;
  let overallDetected = 0;
  let overallCancelled = 0;
  let totalEffectivePoints = 0;

  for (let i = headerIndex + 1; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || !row[1] || String(row[1]).trim() === '') continue;

    const rawTesis = String(row[1]).trim();
    const matchedFac = matchFacilityWithDB(rawTesis, facilities);
    const facId = matchedFac ? matchedFac.id : null;
    const facName = matchedFac ? matchedFac.name : rawTesis;
    const facKey = facId || cleanKey(rawTesis);

    const rawKategori = row[6] ? String(row[6]).trim() : '';
    const rawKriter = row[5] ? String(row[5]).trim() : '';
    const rawRisk = row[7] ? String(row[7]).trim() : '';
    const mappedKategori = mapToStandardCategory(rawKategori, rawKriter);
    const mappedRisk = mapToStandardRisk(rawRisk, mappedKategori, rawKriter);

    const rawDurum = row[10] ? String(row[10]).trim() : 'Tespit Edildi';
    const lowerDurum = rawDurum.toLowerCase();

    // ──────────────────────────────────────────────────────────────────────────
    // KULLANICI FORMÜLÜ:
    // "Devam ediyor olanları 0,5 olarak tamamlandı alsın, Tamamlandı olanları da 1 ile çarpıp tamamlandı alsın."
    // ──────────────────────────────────────────────────────────────────────────
    let scoreWeight = 0;
    let normalizedDurum = rawDurum;

    if (lowerDurum === 'tamamlandı' || lowerDurum === 'tamamlandi') {
      scoreWeight = 1.0;
      normalizedDurum = 'Tamamlandı';
      overallCompleted++;
    } else if (lowerDurum.includes('devam')) {
      scoreWeight = 0.5;
      normalizedDurum = 'Devam Ediyor';
      overallInProgress++;
    } else if (lowerDurum.includes('başlamadı') || lowerDurum.includes('baslamadi')) {
      scoreWeight = 0.0;
      normalizedDurum = 'Başlamadı';
      overallNotStarted++;
    } else if (lowerDurum.includes('tespit')) {
      scoreWeight = 0.0;
      normalizedDurum = 'Tespit Edildi';
      overallDetected++;
    } else if (lowerDurum.includes('iptal')) {
      scoreWeight = 0.0;
      normalizedDurum = 'İptal';
      overallCancelled++;
    } else {
      scoreWeight = 0.0;
      normalizedDurum = rawDurum;
    }

    totalItems++;
    totalEffectivePoints += scoreWeight;

    // Hastane Özeti Başlat veya Güncelle
    if (!facilitySummaries[facKey]) {
      const hospNote = hospitalNotes[facKey] || (facId ? hospitalNotes[facId] : null);
      facilitySummaries[facKey] = {
        tesis: rawTesis,
        facilityId: facId,
        facilityName: facName,
        totalItems: 0,
        uniqueRoomCount: 0,
        actionedRoomCount: 0,
        rooms: [],
        doorfanCount: 0,
        preventiveMaintenanceCount: 0,
        periodicControlCount: 0,
        tightnessCount: 0,
        completedCount: 0,
        inProgressCount: 0,
        notStartedCount: 0,
        detectedCount: 0,
        cancelledCount: 0,
        otherCount: 0,
        effectiveCompletedPoints: 0,
        securityReportRate: 0,
        iletilmeDurumu: hospNote ? hospNote.iletilmeDurumu : null,
        hastaneNotu: hospNote ? hospNote.not : null,
        categories: {},
        risks: {},
        items: []
      };
      facilityRoomMaps[facKey] = {};
    }

    const facSummary = facilitySummaries[facKey];
    facSummary.totalItems++;
    facSummary.effectiveCompletedPoints += scoreWeight;

    if (normalizedDurum === 'Tamamlandı') facSummary.completedCount++;
    else if (normalizedDurum === 'Devam Ediyor') facSummary.inProgressCount++;
    else if (normalizedDurum === 'Başlamadı') facSummary.notStartedCount++;
    else if (normalizedDurum === 'Tespit Edildi') facSummary.detectedCount++;
    else if (normalizedDurum === 'İptal') facSummary.cancelledCount++;
    else facSummary.otherCount++;

    // 4 Temel Sütun Dağılımı: Doorfan, Sızdırmazlık, Periyodik Kontrol, Önleyici Bakım
    const isDoorfan = rawKriter.includes('[Kriter 8]') ||
                      rawKriter.toLowerCase().includes('door fan') ||
                      rawKriter.toLowerCase().includes('doorfan') ||
                      mappedKategori.toLowerCase().includes('doorfan');

    const isTightness = !isDoorfan && (
      mappedKategori === 'Sızdırmazlık & Oda Bütünlüğü' ||
      /\[Kriter\s*(4|5|6|7)\]/i.test(rawKriter)
    );

    const isPeriodicControl = !isDoorfan && !isTightness && (
      mappedKategori === 'Alarm & Entegrasyon' ||
      mappedKategori === 'Gaz Tahliyesi & Güvenlik' ||
      mappedKategori === 'Algılama (Dedektör)' ||
      /\[Kriter\s*(17|18|19|20|22|23|24|25)\]/i.test(rawKriter)
    );

    if (isDoorfan) facSummary.doorfanCount++;
    else if (isTightness) facSummary.tightnessCount++;
    else if (isPeriodicControl) facSummary.periodicControlCount++;
    else facSummary.preventiveMaintenanceCount++;

    facSummary.categories[mappedKategori] = (facSummary.categories[mappedKategori] || 0) + 1;
    facSummary.risks[mappedRisk] = (facSummary.risks[mappedRisk] || 0) + 1;

    const itemObj: FieldReportItem = {
      sira: Number(row[0]) || facSummary.items.length + 1,
      tesis: rawTesis,
      facilityId: facId,
      facilityName: facName,
      konum: row[2] ? String(row[2]).trim() : '-',
      mahalTuru: row[3] ? String(row[3]).trim() : '-',
      mahalAdiUid: row[4] ? String(row[4]).trim() : '-',
      kriterSoru: rawKriter || '-',
      kategori: mappedKategori,
      risk: mappedRisk,
      ekAciklama: row[8] ? String(row[8]).trim() : '-',
      sorumluEkip: row[9] ? String(row[9]).trim() : '-',
      durum: normalizedDurum,
      kayitTarihi: row[11] ? String(row[11]).trim() : undefined,
      terminTarihi: row[12] ? String(row[12]).trim() : undefined,
      aksiyon: row[13] ? String(row[13]).trim() : undefined,
      isEffectiveCompleted: scoreWeight > 0,
      scoreWeight
    };

    facSummary.items.push(itemObj);

    // Mahal / Oda Gruplaması (Bir mahalde birden çok işlem olabilir, tekil oda olarak gruplanır)
    const roomUid = itemObj.mahalAdiUid && itemObj.mahalAdiUid !== '-' ? itemObj.mahalAdiUid : 'Genel / Belirtilmemiş Mahal';
    const roomKonum = itemObj.konum;
    const roomMahalTuru = itemObj.mahalTuru;

    if (!facilityRoomMaps[facKey][roomUid]) {
      facilityRoomMaps[facKey][roomUid] = {
        mahalAdiUid: roomUid,
        konum: roomKonum,
        mahalTuru: roomMahalTuru,
        totalActions: 0,
        completedCount: 0,
        inProgressCount: 0,
        notStartedCount: 0,
        detectedCount: 0,
        effectiveCompletedPoints: 0,
        roomSecurityRate: 0,
        items: []
      };
    }
    const rGroup = facilityRoomMaps[facKey][roomUid];
    rGroup.totalActions++;
    rGroup.effectiveCompletedPoints += scoreWeight;
    if (normalizedDurum === 'Tamamlandı') rGroup.completedCount++;
    else if (normalizedDurum === 'Devam Ediyor') rGroup.inProgressCount++;
    else if (normalizedDurum === 'Tespit Edildi') rGroup.detectedCount++;
    else if (normalizedDurum === 'Başlamadı') rGroup.notStartedCount++;
    rGroup.items.push(itemObj);
  }

  // Yüzdeleri ve Mahal Gruplarını hesapla
  for (const [fKey, sum] of Object.entries(facilitySummaries)) {
    sum.securityReportRate = sum.totalItems > 0
      ? Number(((sum.effectiveCompletedPoints / sum.totalItems) * 100).toFixed(1))
      : 0;

    const rgs = Object.values(facilityRoomMaps[fKey] || {});
    for (const rg of rgs) {
      rg.roomSecurityRate = rg.totalActions > 0
        ? Number(((rg.effectiveCompletedPoints / rg.totalActions) * 100).toFixed(1))
        : 0;
    }
    sum.rooms = rgs;
    sum.uniqueRoomCount = rgs.length;
    sum.actionedRoomCount = rgs.filter((rg) => rg.completedCount > 0).length;
  }

  const overallSecurityReportRate = totalItems > 0
    ? Number(((totalEffectivePoints / totalItems) * 100).toFixed(1))
    : 0;

  const result: ConsolidatedFieldReport = {
    uploadedAt: new Date().toISOString(),
    fileName,
    totalFacilities: Object.keys(facilitySummaries).length,
    totalItems,
    overallSecurityReportRate,
    overallCompleted,
    overallInProgress,
    overallNotStarted,
    overallDetected,
    overallCancelled,
    effectiveCompletedPoints: Number(totalEffectivePoints.toFixed(1)),
    facilitySummaries,
    hospitalNotes,
    categoryRiskMap
  };

  return result;
}

// ──────────────────────────────────────────────────────────────────────────────
// RAPOR VERİSİ GETİR / OTOMATİK İLK BAŞLATMA
// ──────────────────────────────────────────────────────────────────────────────
let inMemoryCache: ConsolidatedFieldReport | null = null;

export async function getConsolidatedFieldReport(): Promise<ConsolidatedFieldReport> {
  if (inMemoryCache) {
    return inMemoryCache;
  }

  const jsonPath = getLatestJsonPath();
  if (fs.existsSync(jsonPath)) {
    try {
      const raw = fs.readFileSync(jsonPath, 'utf8');
      inMemoryCache = JSON.parse(raw);
      if (inMemoryCache?.facilitySummaries) {
        for (const sum of Object.values(inMemoryCache.facilitySummaries)) {
          if (sum.actionedRoomCount === undefined && sum.rooms) {
            sum.actionedRoomCount = sum.rooms.filter((r) => r.completedCount > 0).length;
          }
        }
      }
      return inMemoryCache!;
    } catch (e) {
      console.error('Error reading field_report_latest.json:', e);
    }
  }

  // Eğer JSON yoksa, Excel dosyasını arayıp ilk yüklemeyi gerçekleştir
  const possiblePaths = [
    getLatestExcelPath(),
    path.join(process.cwd(), 'uploads', 'fm200', 'reports', 'FM200_Saha_Is_Listesi_Raporu_2026-10-06_V1.xlsx'),
    path.join(process.cwd(), 'FM200_Saha_Is_Listesi_Raporu_2026-10-06_V1.xlsx'),
    path.join(process.cwd(), '..', 'FM200_Saha_Is_Listesi_Raporu_2026-10-06_V1.xlsx'),
    'C:\\Users\\metin.salik\\Desktop\\sec_portali\\FM200_Saha_Is_Listesi_Raporu_2026-10-06_V1.xlsx'
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        console.log('Auto-initializing FM200 Field Report from:', p);
        const parsed = await parseFieldReportExcel(p, path.basename(p));
        // Kaydet
        fs.writeFileSync(jsonPath, JSON.stringify(parsed, null, 2), 'utf8');
        // Excel kopyasını da al
        if (p !== getLatestExcelPath()) {
          fs.copyFileSync(p, getLatestExcelPath());
        }
        inMemoryCache = parsed;
        return parsed;
      } catch (err) {
        console.error('Auto-init failed for', p, err);
      }
    }
  }

  // Hiçbir dosya bulunamazsa boş rapor şablonu dön
  const emptyReport: ConsolidatedFieldReport = {
    uploadedAt: new Date().toISOString(),
    fileName: 'Henüz Rapor Yüklenmedi',
    totalFacilities: 0,
    totalItems: 0,
    overallSecurityReportRate: 0,
    overallCompleted: 0,
    overallInProgress: 0,
    overallNotStarted: 0,
    overallDetected: 0,
    overallCancelled: 0,
    effectiveCompletedPoints: 0,
    facilitySummaries: {},
    hospitalNotes: {},
    categoryRiskMap: {}
  };
  return emptyReport;
}

// ──────────────────────────────────────────────────────────────────────────────
// MULTER YAPILANDIRMASI (EXCEL DOSYASI YÜKLEME)
// ──────────────────────────────────────────────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype.includes('excel') ||
      file.mimetype.includes('spreadsheet') ||
      file.originalname.endsWith('.xlsx') ||
      file.originalname.endsWith('.xls')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Sadece .xlsx ve .xls uzantılı Excel dosyaları yüklenebilir.'));
    }
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// API ROUTE'LARI
// ──────────────────────────────────────────────────────────────────────────────

// 1. Genel Rapor Özeti ve Tesis Listesi
router.get('/field-report', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const report = await getConsolidatedFieldReport();
    // Item dizilerini yanıtı şişirmemek için kırpıp sadece tesis özetlerini dönüyoruz
    const trimmedSummaries: Record<string, any> = {};
    for (const [key, sum] of Object.entries(report.facilitySummaries)) {
      trimmedSummaries[key] = {
        tesis: sum.tesis,
        facilityId: sum.facilityId,
        facilityName: sum.facilityName,
        totalItems: sum.totalItems,
        uniqueRoomCount: sum.uniqueRoomCount || 0,
        actionedRoomCount: sum.actionedRoomCount || 0,
        doorfanCount: sum.doorfanCount || 0,
        preventiveMaintenanceCount: sum.preventiveMaintenanceCount || 0,
        periodicControlCount: sum.periodicControlCount || 0,
        tightnessCount: sum.tightnessCount || 0,
        completedCount: sum.completedCount,
        inProgressCount: sum.inProgressCount,
        notStartedCount: sum.notStartedCount,
        detectedCount: sum.detectedCount,
        cancelledCount: sum.cancelledCount,
        effectiveCompletedPoints: sum.effectiveCompletedPoints,
        securityReportRate: sum.securityReportRate,
        iletilmeDurumu: sum.iletilmeDurumu,
        hastaneNotu: sum.hastaneNotu,
        categories: sum.categories,
        risks: sum.risks
      };
    }

    res.json({
      uploadedAt: report.uploadedAt,
      fileName: report.fileName,
      totalFacilities: report.totalFacilities,
      totalItems: report.totalItems,
      overallSecurityReportRate: report.overallSecurityReportRate,
      overallCompleted: report.overallCompleted,
      overallInProgress: report.overallInProgress,
      overallNotStarted: report.overallNotStarted,
      overallDetected: report.overallDetected,
      overallCancelled: report.overallCancelled,
      effectiveCompletedPoints: report.effectiveCompletedPoints,
      facilitySummaries: trimmedSummaries,
      categoryRiskMap: report.categoryRiskMap
    });
  } catch (err: any) {
    console.error('Get field report error:', err);
    res.status(500).json({ error: 'Saha raporu getirilemedi: ' + err.message });
  }
});

// 2. Belirli Bir Hastanenin Detaylı Saha Raporu (Dialog Penceresi İçin)
router.get('/field-report/facility/:facilityId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { facilityId } = req.params;
    const facilityName = req.query.facilityName ? String(req.query.facilityName) : null;
    const report = await getConsolidatedFieldReport();

    // ID ile eşleştir
    let summary = report.facilitySummaries[facilityId];

    // Eğer doğrudan ID ile bulunamadıysa, facilityId'nin adı veya normalize haliyle ara
    if (!summary) {
      const cleanTarget = cleanKey(facilityId);
      const cleanName = facilityName ? cleanKey(facilityName) : '';
      for (const [key, sum] of Object.entries(report.facilitySummaries)) {
        if (
          cleanKey(key) === cleanTarget ||
          (sum.facilityId && cleanKey(sum.facilityId) === cleanTarget) ||
          cleanKey(sum.tesis) === cleanTarget ||
          (cleanName && (cleanKey(sum.tesis) === cleanName || (sum.facilityName && cleanKey(sum.facilityName) === cleanName)))
        ) {
          summary = sum;
          break;
        }
      }
    }

    if (!summary) {
      return res.status(404).json({
        error: 'Bu tesis için saha raporu verisi bulunamadı.',
        facilityId
      });
    }

    res.json(summary);
  } catch (err: any) {
    console.error('Facility field report error:', err);
    res.status(500).json({ error: 'Tesis saha raporu detayı alınamadı.' });
  }
});

// 3. Canlıda Excel Yükleme Endpoint'i (Yönetici Özeti Yükleme Yeri)
router.post('/field-report/upload', authMiddleware, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Lütfen bir Excel dosyası (.xlsx) seçin.' });
    }

    const fileName = req.file.originalname || `FM200_Saha_Raporu_${Date.now()}.xlsx`;
    const parsed = await parseFieldReportExcel(req.file.buffer, fileName);

    // Dosyaları kaydet
    const jsonPath = getLatestJsonPath();
    const excelPath = getLatestExcelPath();

    fs.writeFileSync(jsonPath, JSON.stringify(parsed, null, 2), 'utf8');
    fs.writeFileSync(excelPath, req.file.buffer);

    // Bellek önbelleğini yenile
    inMemoryCache = parsed;

    res.json({
      success: true,
      message: `Saha raporu başarıyla sisteme aktarıldı. ${parsed.totalFacilities} tesis ve ${parsed.totalItems} saha kaydı işlendi. Güvenlik Raporu genel tamamlanma: %${parsed.overallSecurityReportRate}`,
      report: {
        uploadedAt: parsed.uploadedAt,
        fileName: parsed.fileName,
        totalFacilities: parsed.totalFacilities,
        totalItems: parsed.totalItems,
        overallSecurityReportRate: parsed.overallSecurityReportRate,
        overallCompleted: parsed.overallCompleted,
        overallInProgress: parsed.overallInProgress,
        overallNotStarted: parsed.overallNotStarted,
        overallDetected: parsed.overallDetected,
        overallCancelled: parsed.overallCancelled,
        effectiveCompletedPoints: parsed.effectiveCompletedPoints
      }
    });
  } catch (err: any) {
    console.error('Upload field report error:', err);
    res.status(500).json({ error: 'Excel dosyası işlenirken hata oluştu: ' + err.message });
  }
});

// 4. Mevcut Yüklü Excel Dosyasını İndirme Endpoint'i
router.get('/field-report/download', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const excelPath = getLatestExcelPath();
    if (fs.existsSync(excelPath)) {
      return res.download(excelPath, 'FM200_Saha_Is_Listesi_Raporu_Guncel.xlsx');
    }

    const fallbackPath = path.join(process.cwd(), 'FM200_Saha_Is_Listesi_Raporu_2026-10-06_V1.xlsx');
    if (fs.existsSync(fallbackPath)) {
      return res.download(fallbackPath, 'FM200_Saha_Is_Listesi_Raporu_2026-10-06_V1.xlsx');
    }

    res.status(404).json({ error: 'İndirilebilecek Excel raporu bulunamadı.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Excel indirilemedi: ' + err.message });
  }
});

export default router;
