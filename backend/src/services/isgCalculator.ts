/**
 * ISG Yasal Hesaplama Motoru
 * Bölüm 11 — sec_portali.md
 */

// ─── Sabitler ────────────────────────────────────────────────────────────────

/** Tehlike sınıfına göre dk/çalışan zorunluluğu */
export const IGU_MINUTES_PER_WORKER: Record<string, number> = {
  'Çok Tehlikeli': 40,
  'Tehlikeli': 20,
  'Az Tehlikeli': 10,
};

export const HEKIM_MINUTES_PER_WORKER: Record<string, number> = {
  'Çok Tehlikeli': 15,
  'Tehlikeli': 10,
  'Az Tehlikeli': 5,
};

/** Tam zamanlı çalışma için üst limit (çalışan sayısı) */
export const IGU_FULLTIME_THRESHOLD: Record<string, number> = {
  'Çok Tehlikeli': 250,
  'Tehlikeli': 500,
  'Az Tehlikeli': 1000,
};

/** Minimum sınıf gereksinimleri */
export const IGU_MIN_CLASS: Record<string, string[]> = {
  'Çok Tehlikeli': ['A Sınıfı IGU'],
  'Tehlikeli': ['A Sınıfı IGU', 'B Sınıfı IGU'],
  'Az Tehlikeli': ['A Sınıfı IGU', 'B Sınıfı IGU', 'C Sınıfı IGU'],
};

/** Bir profesyonelin aylık max çalışma kapasitesi (dk) */
export const MAX_MONTHLY_CAPACITY_MINUTES = 11_700;

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
  };
  hekim: {
    requiredMinutes: number;
    assignedMinutes: number;
    isCompliant: boolean;
  };
  dsp: {
    required: boolean;
    assigned: boolean;
    isCompliant: boolean;
  };
  overallCompliant: boolean;
  monthlyPenaltyRisk: number;
}

export interface CertificateStatus {
  isExpired: boolean;
  isWarning: boolean;   // 90 gün içinde bitiyor
  isCritical: boolean;  // 60 gün içinde bitiyor
  daysLeft: number | null;
}

// ─── Fonksiyonlar ─────────────────────────────────────────────────────────────

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
 * DSP zorunlu mu? (Sadece Çok Tehlikeli, ≥50 çalışan)
 */
export function isDSPRequired(dangerClass: string, employeeCount: number): boolean {
  return dangerClass === 'Çok Tehlikeli' && employeeCount >= 50;
}

/**
 * IGU sınıfı yeterliliği — tesis tehlike sınıfına uygun mu?
 */
export function isIGUClassValid(dangerClass: string, titleClass: string): boolean {
  const validClasses = IGU_MIN_CLASS[dangerClass] ?? [];
  return validClasses.includes(titleClass);
}

/**
 * Tam zamanlı gereksinim var mı?
 */
export function isFullTimeRequired(dangerClass: string, employeeCount: number): boolean {
  const threshold = IGU_FULLTIME_THRESHOLD[dangerClass] ?? 1000;
  return employeeCount >= threshold;
}

/**
 * Kapasite kontrolü — 11.700 dk/ay limitini aşıyor mu?
 */
export function checkCapacity(
  currentAssignedMinutes: number,
  newMinutes: number,
): { wouldExceed: boolean; remaining: number } {
  const remaining = MAX_MONTHLY_CAPACITY_MINUTES - currentAssignedMinutes;
  return {
    wouldExceed: currentAssignedMinutes + newMinutes > MAX_MONTHLY_CAPACITY_MINUTES,
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
 * Ceza riski hesaplama (aylık)
 * penaltyAmounts: { iguPenalty, hekimPenalty, dspPenalty } — yıla göre ayarlardan gelir
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
 * Bir tesisin tam uyumluluk analizini döndürür
 */
export function analyzeFacilityCompliance(params: {
  facilityId: string;
  facilityName: string;
  dangerClass: string;
  employeeCount: number;
  iguAssignments: Array<{ durationMinutes: number; isFullTime: boolean; titleClass: string }>;
  hekimAssignments: Array<{ durationMinutes: number; isFullTime: boolean }>;
  dspAssignments: Array<{ durationMinutes: number }>;
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
    penaltyAmounts = { iguPenalty: 0, hekimPenalty: 0, dspPenalty: 0 },
  } = params;

  // IGU
  const iguRequired = calculateIGURequiredMinutes(dangerClass, employeeCount);
  const iguAssigned = iguAssignments.reduce((sum, a) => sum + a.durationMinutes, 0);
  const iguFullTimeRequired = isFullTimeRequired(dangerClass, employeeCount);
  const iguHasFullTime = iguAssignments.some((a) => a.isFullTime);
  const iguValidClass = iguAssignments.some((a) => isIGUClassValid(dangerClass, a.titleClass));
  const iguCompliant = iguFullTimeRequired
    ? iguHasFullTime && iguValidClass
    : iguAssigned >= iguRequired && iguValidClass;

  // Hekim
  const hekimRequired = calculateHekimRequiredMinutes(dangerClass, employeeCount);
  const hekimAssigned = hekimAssignments.reduce((sum, a) => sum + a.durationMinutes, 0);
  const hekimCompliant = hekimAssigned >= hekimRequired;

  // DSP
  const dspRequired = isDSPRequired(dangerClass, employeeCount);
  const dspAssigned = dspAssignments.length > 0;
  const dspCompliant = !dspRequired || dspAssigned;

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
      requiredMinutes: iguRequired,
      assignedMinutes: iguAssigned,
      isCompliant: iguCompliant,
      isFullTimeRequired: iguFullTimeRequired,
      hasValidClass: iguValidClass,
    },
    hekim: {
      requiredMinutes: hekimRequired,
      assignedMinutes: hekimAssigned,
      isCompliant: hekimCompliant,
    },
    dsp: {
      required: dspRequired,
      assigned: dspAssigned,
      isCompliant: dspCompliant,
    },
    overallCompliant: iguCompliant && hekimCompliant && dspCompliant,
    monthlyPenaltyRisk,
  };
}
