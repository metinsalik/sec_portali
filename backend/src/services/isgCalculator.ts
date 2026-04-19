/**
 * ISG Yasal Hesaplama Motoru
 * Türkiye İSG Mevzuatına göre atama kuralları
 * Kaynak: atama.md
 */

// ─── Sabitler ────────────────────────────────────────────────────────────────

/** İş Güvenliği Uzmanı - dk/çalışan/ay */
export const IGU_MINUTES_PER_WORKER: Record<string, number> = {
  'Az Tehlikeli': 10,
  'Tehlikeli': 20,
  'Çok Tehlikeli': 40,
};

/** İşyeri Hekimi - dk/çalışan/ay */
export const HEKIM_MINUTES_PER_WORKER: Record<string, number> = {
  'Az Tehlikeli': 5,
  'Tehlikeli': 10,
  'Çok Tehlikeli': 15,
};

/** DSP - dk/çalışan/ay (sadece Çok Tehlikeli) */
export const DSP_MINUTES_PER_WORKER = {
  '10-49': 10,     // 10-49 çalışan
  '50-249': 15,    // 50-249 çalışan
  '250+': 20,      // 250+ çalışan
};

/** Tam zamanlı atama eşikleri (çalışan sayısı) */
export const IGU_FULLTIME_THRESHOLD: Record<string, number> = {
  'Az Tehlikeli': 1000,
  'Tehlikeli': 500,
  'Çok Tehlikeli': 250,
};

export const HEKIM_FULLTIME_THRESHOLD: Record<string, number> = {
  'Az Tehlikeli': 2000,
  'Tehlikeli': 1000,
  'Çok Tehlikeli': 750,
};

/** Minimum sınıf gereksinimleri */
export const IGU_MIN_CLASS: Record<string, string[]> = {
  'Çok Tehlikeli': ['A Sınıfı IGU'],
  'Tehlikeli': ['A Sınıfı IGU', 'B Sınıfı IGU'],
  'Az Tehlikeli': ['A Sınıfı IGU', 'B Sınıfı IGU', 'C Sınıfı IGU'],
};

/** Tam zamanlı kabul için dakika */
export const FULLTIME_MINUTES = 11_700;

// ─── Tip Tanımları ────────────────────────────────────────────────────────────

export interface ComplianceResult {
  facilityId: string;
  facilityName: string;
  dangerClass: string;
  employeeCount: number;
  igu: {
    requiredMinutes: number;
    assignedMinutes: number;
    isCompliant: boolean;
    isFullTimeRequired: boolean;
    hasValidClass: boolean;
    summary: string;
  };
  hekim: {
    requiredMinutes: number;
    assignedMinutes: number;
    isCompliant: boolean;
    isFullTimeRequired: boolean;
    summary: string;
  };
  dsp: {
    required: boolean;
    assigned: boolean;
    isCompliant: boolean;
    summary: string;
  };
  vekil: {
    assigned: boolean;
    names: string[];
    summary: string;
  };
  overallCompliant: boolean;
  monthlyPenaltyRisk: number;
}

export interface CertificateStatus {
  isExpired: boolean;
  isWarning: boolean;
  isCritical: boolean;
  daysLeft: number | null;
}

export interface AssignmentCalculation {
  type: 'IGU' | 'Hekim' | 'DSP';
  dangerClass: string;
  employeeCount: number;
  requiredMinutes: number;
  isFullTimeRequired: boolean;
  isFullTime: boolean; // 11700 dk = tam zamanlı
  summary: string;
  legalNote: string;
}

// ─── Yardımcı Fonksiyonlar ────────────────────────────────────────────────────

/**
 * DSP için katsayı belirleme (çalışan sayısına göre)
 */
function getDSPMinutesPerWorker(employeeCount: number): number {
  if (employeeCount >= 250) return DSP_MINUTES_PER_WORKER['250+'];
  if (employeeCount >= 50) return DSP_MINUTES_PER_WORKER['50-249'];
  return DSP_MINUTES_PER_WORKER['10-49'];
}

/**
 * DSP eşik değeri (250+ tam zamanlı)
 */
const DSP_FULLTIME_THRESHOLD = 250;

// ─── Hesaplama Fonksiyonları ──────────────────────────────────────────────────

/**
 * IGU için gerekli aylık dakikayı hesaplar
 */
export function calculateIGURequiredMinutes(
  dangerClass: string,
  employeeCount: number,
): number {
  const rate = IGU_MINUTES_PER_WORKER[dangerClass] ?? 10;
  return rate * employeeCount;
}

/**
 * Hekim için gerekli aylık dakikayı hesaplar
 */
export function calculateHekimRequiredMinutes(
  dangerClass: string,
  employeeCount: number,
): number {
  const rate = HEKIM_MINUTES_PER_WORKER[dangerClass] ?? 5;
  return rate * employeeCount;
}

/**
 * DSP için gerekli aylık dakikayı hesaplar (sadece Çok Tehlikeli)
 */
export function calculateDSPRequiredMinutes(employeeCount: number): number {
  const rate = getDSPMinutesPerWorker(employeeCount);
  return rate * employeeCount;
}

/**
 * DSP zorunlu mu? (Sadece Çok Tehlikeli, ≥10 çalışan)
 */
export function isDSPRequired(dangerClass: string, employeeCount: number): boolean {
  return dangerClass === 'Çok Tehlikeli' && employeeCount >= 10;
}

/**
 * IGU sınıfı yeterliliği
 */
export function isIGUClassValid(dangerClass: string, titleClass: string): boolean {
  const validClasses = IGU_MIN_CLASS[dangerClass] ?? [];
  return validClasses.includes(titleClass);
}

/**
 * IGU tam zamanlı gereksinim kontrolü
 */
export function isIGUFullTimeRequired(dangerClass: string, employeeCount: number): boolean {
  const threshold = IGU_FULLTIME_THRESHOLD[dangerClass] ?? 1000;
  return employeeCount >= threshold;
}

/**
 * Hekim tam zamanlı gereksinim kontrolü
 */
export function isHekimFullTimeRequired(dangerClass: string, employeeCount: number): boolean {
  const threshold = HEKIM_FULLTIME_THRESHOLD[dangerClass] ?? 2000;
  return employeeCount >= threshold;
}

/**
 * Kapasite kontrolü — 11.700 dk/ay limitini aşıyor mu?
 */
export function checkCapacity(
  currentAssignedMinutes: number,
  newMinutes: number,
): { wouldExceed: boolean; remaining: number } {
  const remaining = FULLTIME_MINUTES - currentAssignedMinutes;
  return {
    wouldExceed: currentAssignedMinutes + newMinutes > FULLTIME_MINUTES,
    remaining,
  };
}

/**
 * Sertifika geçerlilik durumu (5 yıl geçerli)
 */
export function getCertificateStatus(certificateDate: Date | null | undefined): CertificateStatus {
  if (!certificateDate) {
    return { isExpired: false, isWarning: false, isCritical: false, daysLeft: null };
  }

  const expiryDate = new Date(certificateDate);
  expiryDate.setFullYear(expiryDate.getFullYear() + 5);

  const today = new Date();
  const diffMs = expiryDate.getTime() - today.getTime();
  const daysLeft = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  return {
    isExpired: daysLeft < 0,
    isCritical: daysLeft >= 0 && daysLeft <= 60,
    isWarning: daysLeft > 60 && daysLeft <= 90,
    daysLeft,
  };
}

/**
 * Ceza riski hesaplama
 */
export function calculateMonthlyPenalty(
  isIGUCompliant: boolean,
  isHekimCompliant: boolean,
  isDSPCompliant: boolean,
  penaltyAmounts: { iguPenalty: number; hekimPenalty: number; dspPenalty: number },
): number {
  let total = 0;
  if (!isIGUCompliant) total += penaltyAmounts.iguPenalty;
  if (!isHekimCompliant) total += penaltyAmounts.hekimPenalty;
  if (!isDSPCompliant) total += penaltyAmounts.dspPenalty;
  return total;
}

/**
 * Tek atama hesaplaması (atama.md'ye göre)
 */
export function calculateAssignment(params: {
  type: 'IGU' | 'Hekim' | 'DSP';
  dangerClass: string;
  employeeCount: number;
  durationMinutes: number;
  isFullTime: boolean;
}): AssignmentCalculation {
  const { type, dangerClass, employeeCount, durationMinutes, isFullTime } = params;

  let requiredMinutes: number;
  let isFullTimeRequired: boolean;
  let summary: string;
  let legalNote: string;

  if (type === 'IGU') {
    requiredMinutes = calculateIGURequiredMinutes(dangerClass, employeeCount);
    isFullTimeRequired = isIGUFullTimeRequired(dangerClass, employeeCount);
    const rate = IGU_MINUTES_PER_WORKER[dangerClass] || 10;
    summary = `${dangerClass} işyerinde ${employeeCount} çalışan için IGU: ${rate} dk × ${employeeCount} = ${requiredMinutes} dk/ay`;
    legalNote = `Çalışan başına aylık en az ${rate} dakika. ${IGU_FULLTIME_THRESHOLD[dangerClass]}+ çalışan = tam zamanlı.`;
  } else if (type === 'Hekim') {
    requiredMinutes = calculateHekimRequiredMinutes(dangerClass, employeeCount);
    isFullTimeRequired = isHekimFullTimeRequired(dangerClass, employeeCount);
    const rate = HEKIM_MINUTES_PER_WORKER[dangerClass] || 5;
    summary = `${dangerClass} işyerinde ${employeeCount} çalışan için Hekim: ${rate} dk × ${employeeCount} = ${requiredMinutes} dk/ay`;
    legalNote = `Çalışan başına aylık en az ${rate} dakika. ${HEKIM_FULLTIME_THRESHOLD[dangerClass]}+ çalışan = tam zamanlı.`;
  } else {
    // DSP - sadece Çok Tehlikeli
    if (dangerClass !== 'Çok Tehlikeli') {
      requiredMinutes = 0;
      isFullTimeRequired = false;
      summary = 'DSP sadece Çok Tehlikeli işyerlerinde zorunludur.';
      legalNote = 'Diğer tehlike sınıflarında DSP zorunlu değildir.';
    } else {
      requiredMinutes = calculateDSPRequiredMinutes(employeeCount);
      isFullTimeRequired = employeeCount >= DSP_FULLTIME_THRESHOLD;
      const rate = getDSPMinutesPerWorker(employeeCount);
      let countRange = '10-49';
      if (employeeCount >= 250) countRange = '250+';
      else if (employeeCount >= 50) countRange = '50-249';
      summary = `${dangerClass} işyerinde ${employeeCount} çalışan için DSP: ${rate} dk × ${employeeCount} = ${requiredMinutes} dk/ay`;
      legalNote = `${countRange} çalışan grubu için ${rate} dk/çalışan. ${DSP_FULLTIME_THRESHOLD}+ çalışan = tam zamanlı. 11700 dk = tam zamanlı atama.`;
    }
  }

  return {
    type,
    dangerClass,
    employeeCount,
    requiredMinutes,
    isFullTimeRequired,
    isFullTime: durationMinutes >= FULLTIME_MINUTES || isFullTime,
    summary,
    legalNote,
  };
}

/**
 * Bir tesisin tam uyumluluk analizi
 */
export function analyzeFacilityCompliance(params: {
  facilityId: string;
  facilityName: string;
  dangerClass: string;
  employeeCount: number;
  iguAssignments: Array<{ durationMinutes: number; isFullTime: boolean; titleClass: string }>;
  hekimAssignments: Array<{ durationMinutes: number; isFullTime: boolean }>;
  dspAssignments: Array<{ durationMinutes: number }>;
  vekilAssignments: Array<{ name: string }>;
  penaltyAmounts?: { iguPenalty: number; hekimPenalty: number; dspPenalty: number };
}): ComplianceResult {
  const {
    facilityId,
    facilityName,
    dangerClass,
    employeeCount,
    iguAssignments,
    hekimAssignments,
    dspAssignments,
    vekilAssignments,
    penaltyAmounts = { iguPenalty: 0, hekimPenalty: 0, dspPenalty: 0 },
  } = params;

  // --- IGU TIERED LOGIC ---
  const iguThreshold = IGU_FULLTIME_THRESHOLD[dangerClass] || 1000;
  const iguRate = IGU_MINUTES_PER_WORKER[dangerClass] || 10;
  
  const requiredIGUFullTimeCount = Math.floor(employeeCount / iguThreshold);
  const excessIGUEmployees = employeeCount % iguThreshold;
  const requiredIGUExcessMinutes = excessIGUEmployees * iguRate;

  const assignedIGUFullTime = iguAssignments.filter(a => a.isFullTime && isIGUClassValid(dangerClass, a.titleClass)).length;
  // Total assigned minutes counting full-time as at least 11700
  const totalIGUMinutes = iguAssignments.reduce((sum, a) => sum + (a.isFullTime ? Math.max(a.durationMinutes, 11700) : a.durationMinutes), 0);
  
  // Requirement: at least the floor count of full-timers, AND enough total minutes for everyone
  // Actually, each full-timer satisfies exactly 'iguThreshold' employees.
  const iguValidClass = iguAssignments.some((a) => isIGUClassValid(dangerClass, a.titleClass));
  const iguCompliant = assignedIGUFullTime >= requiredIGUFullTimeCount && totalIGUMinutes >= (requiredIGUFullTimeCount * 11700 + requiredIGUExcessMinutes) && iguValidClass;

  // --- HEKIM TIERED LOGIC ---
  const hekimThreshold = HEKIM_FULLTIME_THRESHOLD[dangerClass] || 2000;
  const hekimRate = HEKIM_MINUTES_PER_WORKER[dangerClass] || 5;

  const requiredHekimFullTimeCount = Math.floor(employeeCount / hekimThreshold);
  const excessHekimEmployees = employeeCount % hekimThreshold;
  const requiredHekimExcessMinutes = excessHekimEmployees * hekimRate;

  const assignedHekimFullTime = hekimAssignments.filter(a => a.isFullTime).length;
  const totalHekimMinutes = hekimAssignments.reduce((sum, a) => sum + (a.isFullTime ? Math.max(a.durationMinutes, 11700) : a.durationMinutes), 0);
  
  const hekimCompliant = assignedHekimFullTime >= requiredHekimFullTimeCount && totalHekimMinutes >= (requiredHekimFullTimeCount * 11700 + requiredHekimExcessMinutes);

  // --- DSP ---
  const dspRequired = isDSPRequired(dangerClass, employeeCount);
  const dspAssigned = dspAssignments.length > 0;
  const dspCompliant = !dspRequired || dspAssigned;

  // DSP summary
  let dspSummary = '';
  if (dangerClass !== 'Çok Tehlikeli') {
    dspSummary = 'Zorunlu değil';
  } else if (!dspRequired) {
    dspSummary = '10 çalışan altı zorunlu değil';
  } else if (dspAssigned) {
    dspSummary = 'Atanmış';
  } else {
    dspSummary = 'ATANMAMIŞ!';
  }

  // --- VEKIL ---
  const vekilAssigned = vekilAssignments.length > 0;

  // Ceza
  const monthlyPenaltyRisk = calculateMonthlyPenalty(
    iguCompliant,
    hekimCompliant,
    dspCompliant,
    penaltyAmounts,
  );

  return {
    facilityId,
    facilityName,
    dangerClass,
    employeeCount,
    igu: {
      requiredMinutes: requiredIGUFullTimeCount * 11700 + requiredIGUExcessMinutes,
      assignedMinutes: totalIGUMinutes,
      isCompliant: iguCompliant,
      isFullTimeRequired: requiredIGUFullTimeCount > 0,
      hasValidClass: iguValidClass,
      summary: `${requiredIGUFullTimeCount > 0 ? requiredIGUFullTimeCount + ' Tam Zamanlı + ' : ''}${requiredIGUExcessMinutes} dk gerekli | ${assignedIGUFullTime} Tam Zamanlı + ${Math.max(0, totalIGUMinutes - assignedIGUFullTime * 11700)} dk atanmış`,
    },
    hekim: {
      requiredMinutes: requiredHekimFullTimeCount * 11700 + requiredHekimExcessMinutes,
      assignedMinutes: totalHekimMinutes,
      isCompliant: hekimCompliant,
      isFullTimeRequired: requiredHekimFullTimeCount > 0,
      summary: `${requiredHekimFullTimeCount > 0 ? requiredHekimFullTimeCount + ' Tam Zamanlı + ' : ''}${requiredHekimExcessMinutes} dk gerekli | ${assignedHekimFullTime} Tam Zamanlı + ${Math.max(0, totalHekimMinutes - assignedHekimFullTime * 11700)} dk atanmış`,
    },
    dsp: {
      required: dspRequired,
      assigned: dspAssigned,
      isCompliant: dspCompliant,
      summary: dspSummary,
    },
    vekil: {
      assigned: vekilAssigned,
      names: vekilAssignments.map(v => v.name),
      summary: vekilAssigned ? vekilAssignments.map(v => v.name).join(', ') : 'Atanmamış',
    },
    overallCompliant: iguCompliant && hekimCompliant && dspCompliant,
    monthlyPenaltyRisk,
  };
}