"use strict";
/**
 * ISG Yasal Hesaplama Motoru
 * Türkiye İSG Mevzuatına göre atama kuralları
 * Kaynak: atama.md
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FULLTIME_MINUTES = exports.IGU_MIN_CLASS = exports.HEKIM_FULLTIME_THRESHOLD = exports.IGU_FULLTIME_THRESHOLD = exports.DSP_MINUTES_PER_WORKER = exports.HEKIM_MINUTES_PER_WORKER = exports.IGU_MINUTES_PER_WORKER = void 0;
exports.calculateIGURequiredMinutes = calculateIGURequiredMinutes;
exports.calculateHekimRequiredMinutes = calculateHekimRequiredMinutes;
exports.calculateDSPRequiredMinutes = calculateDSPRequiredMinutes;
exports.isDSPRequired = isDSPRequired;
exports.isIGUClassValid = isIGUClassValid;
exports.isIGUFullTimeRequired = isIGUFullTimeRequired;
exports.isHekimFullTimeRequired = isHekimFullTimeRequired;
exports.checkCapacity = checkCapacity;
exports.getCertificateStatus = getCertificateStatus;
exports.calculateMonthlyPenalty = calculateMonthlyPenalty;
exports.calculateAssignment = calculateAssignment;
exports.analyzeFacilityCompliance = analyzeFacilityCompliance;
// ─── Sabitler ────────────────────────────────────────────────────────────────
/** İş Güvenliği Uzmanı - dk/çalışan/ay */
exports.IGU_MINUTES_PER_WORKER = {
    'Az Tehlikeli': 10,
    'Tehlikeli': 20,
    'Çok Tehlikeli': 40,
};
/** İşyeri Hekimi - dk/çalışan/ay */
exports.HEKIM_MINUTES_PER_WORKER = {
    'Az Tehlikeli': 5,
    'Tehlikeli': 10,
    'Çok Tehlikeli': 15,
};
/** DSP - dk/çalışan/ay (sadece Çok Tehlikeli) */
exports.DSP_MINUTES_PER_WORKER = {
    '10-49': 10, // 10-49 çalışan
    '50-249': 15, // 50-249 çalışan
    '250+': 20, // 250+ çalışan
};
/** Tam zamanlı atama eşikleri (çalışan sayısı) */
exports.IGU_FULLTIME_THRESHOLD = {
    'Az Tehlikeli': 1000,
    'Tehlikeli': 500,
    'Çok Tehlikeli': 250,
};
exports.HEKIM_FULLTIME_THRESHOLD = {
    'Az Tehlikeli': 2000,
    'Tehlikeli': 1000,
    'Çok Tehlikeli': 750,
};
/** Minimum sınıf gereksinimleri */
exports.IGU_MIN_CLASS = {
    'Çok Tehlikeli': ['A Sınıfı IGU'],
    'Tehlikeli': ['A Sınıfı IGU', 'B Sınıfı IGU'],
    'Az Tehlikeli': ['A Sınıfı IGU', 'B Sınıfı IGU', 'C Sınıfı IGU'],
};
/** Tam zamanlı kabul için dakika */
exports.FULLTIME_MINUTES = 11_700;
// ─── Yardımcı Fonksiyonlar ────────────────────────────────────────────────────
/**
 * DSP için katsayı belirleme (çalışan sayısına göre)
 */
function getDSPMinutesPerWorker(employeeCount) {
    if (employeeCount >= 250)
        return exports.DSP_MINUTES_PER_WORKER['250+'];
    if (employeeCount >= 50)
        return exports.DSP_MINUTES_PER_WORKER['50-249'];
    return exports.DSP_MINUTES_PER_WORKER['10-49'];
}
/**
 * DSP eşik değeri (250+ tam zamanlı)
 */
const DSP_FULLTIME_THRESHOLD = 250;
// ─── Hesaplama Fonksiyonları ──────────────────────────────────────────────────
/**
 * IGU için gerekli aylık dakikayı hesaplar
 */
function calculateIGURequiredMinutes(dangerClass, employeeCount) {
    const rate = exports.IGU_MINUTES_PER_WORKER[dangerClass] ?? 10;
    return rate * employeeCount;
}
/**
 * Hekim için gerekli aylık dakikayı hesaplar
 */
function calculateHekimRequiredMinutes(dangerClass, employeeCount) {
    const rate = exports.HEKIM_MINUTES_PER_WORKER[dangerClass] ?? 5;
    return rate * employeeCount;
}
/**
 * DSP için gerekli aylık dakikayı hesaplar (sadece Çok Tehlikeli)
 */
function calculateDSPRequiredMinutes(employeeCount) {
    const rate = getDSPMinutesPerWorker(employeeCount);
    return rate * employeeCount;
}
/**
 * DSP zorunlu mu? (Sadece Çok Tehlikeli, ≥10 çalışan)
 */
function isDSPRequired(dangerClass, employeeCount) {
    return dangerClass === 'Çok Tehlikeli' && employeeCount >= 10;
}
/**
 * IGU sınıfı yeterliliği
 */
function isIGUClassValid(dangerClass, titleClass) {
    const validClasses = exports.IGU_MIN_CLASS[dangerClass] ?? [];
    return validClasses.includes(titleClass);
}
/**
 * IGU tam zamanlı gereksinim kontrolü
 */
function isIGUFullTimeRequired(dangerClass, employeeCount) {
    const threshold = exports.IGU_FULLTIME_THRESHOLD[dangerClass] ?? 1000;
    return employeeCount >= threshold;
}
/**
 * Hekim tam zamanlı gereksinim kontrolü
 */
function isHekimFullTimeRequired(dangerClass, employeeCount) {
    const threshold = exports.HEKIM_FULLTIME_THRESHOLD[dangerClass] ?? 2000;
    return employeeCount >= threshold;
}
/**
 * Kapasite kontrolü — 11.700 dk/ay limitini aşıyor mu?
 */
function checkCapacity(currentAssignedMinutes, newMinutes) {
    const remaining = exports.FULLTIME_MINUTES - currentAssignedMinutes;
    return {
        wouldExceed: currentAssignedMinutes + newMinutes > exports.FULLTIME_MINUTES,
        remaining,
    };
}
/**
 * Sertifika geçerlilik durumu (5 yıl geçerli)
 */
function getCertificateStatus(certificateDate) {
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
function calculateMonthlyPenalty(isIGUCompliant, isHekimCompliant, isDSPCompliant, penaltyAmounts) {
    let total = 0;
    if (!isIGUCompliant)
        total += penaltyAmounts.iguPenalty;
    if (!isHekimCompliant)
        total += penaltyAmounts.hekimPenalty;
    if (!isDSPCompliant)
        total += penaltyAmounts.dspPenalty;
    return total;
}
/**
 * Tek atama hesaplaması (atama.md'ye göre)
 */
function calculateAssignment(params) {
    const { type, dangerClass, employeeCount, durationMinutes, isFullTime } = params;
    let requiredMinutes;
    let isFullTimeRequired;
    let summary;
    let legalNote;
    if (type === 'IGU') {
        requiredMinutes = calculateIGURequiredMinutes(dangerClass, employeeCount);
        isFullTimeRequired = isIGUFullTimeRequired(dangerClass, employeeCount);
        const rate = exports.IGU_MINUTES_PER_WORKER[dangerClass] || 10;
        summary = `${dangerClass} işyerinde ${employeeCount} çalışan için IGU: ${rate} dk × ${employeeCount} = ${requiredMinutes} dk/ay`;
        legalNote = `Çalışan başına aylık en az ${rate} dakika. ${exports.IGU_FULLTIME_THRESHOLD[dangerClass]}+ çalışan = tam zamanlı.`;
    }
    else if (type === 'Hekim') {
        requiredMinutes = calculateHekimRequiredMinutes(dangerClass, employeeCount);
        isFullTimeRequired = isHekimFullTimeRequired(dangerClass, employeeCount);
        const rate = exports.HEKIM_MINUTES_PER_WORKER[dangerClass] || 5;
        summary = `${dangerClass} işyerinde ${employeeCount} çalışan için Hekim: ${rate} dk × ${employeeCount} = ${requiredMinutes} dk/ay`;
        legalNote = `Çalışan başına aylık en az ${rate} dakika. ${exports.HEKIM_FULLTIME_THRESHOLD[dangerClass]}+ çalışan = tam zamanlı.`;
    }
    else {
        // DSP - sadece Çok Tehlikeli
        if (dangerClass !== 'Çok Tehlikeli') {
            requiredMinutes = 0;
            isFullTimeRequired = false;
            summary = 'DSP sadece Çok Tehlikeli işyerlerinde zorunludur.';
            legalNote = 'Diğer tehlike sınıflarında DSP zorunlu değildir.';
        }
        else {
            requiredMinutes = calculateDSPRequiredMinutes(employeeCount);
            isFullTimeRequired = employeeCount >= DSP_FULLTIME_THRESHOLD;
            const rate = getDSPMinutesPerWorker(employeeCount);
            let countRange = '10-49';
            if (employeeCount >= 250)
                countRange = '250+';
            else if (employeeCount >= 50)
                countRange = '50-249';
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
        isFullTime: durationMinutes >= exports.FULLTIME_MINUTES || isFullTime,
        summary,
        legalNote,
    };
}
/**
 * Bir tesisin tam uyumluluk analizi
 */
function analyzeFacilityCompliance(params) {
    const { facilityId, facilityName, dangerClass, employeeCount, iguAssignments, hekimAssignments, dspAssignments, vekilAssignments, penaltyAmounts = { iguPenalty: 0, hekimPenalty: 0, dspPenalty: 0 }, } = params;
    // --- IGU TIERED LOGIC ---
    const iguThreshold = exports.IGU_FULLTIME_THRESHOLD[dangerClass] || 1000;
    const iguRate = exports.IGU_MINUTES_PER_WORKER[dangerClass] || 10;
    const requiredIGUFullTimeCount = Math.floor(employeeCount / iguThreshold);
    const excessIGUEmployees = employeeCount % iguThreshold;
    const requiredIGUExcessMinutes = excessIGUEmployees * iguRate;
    const assignedIGUFullTime = iguAssignments.filter(a => a.isFullTime && isIGUClassValid(dangerClass, a.titleClass)).length;
    // Total assigned minutes counting full-time as at least 11700
    const totalIGUMinutes = iguAssignments.reduce((sum, a) => sum + (a.isFullTime ? Math.max(a.durationMinutes, 11700) : a.durationMinutes), 0);
    // Requirement: at least the floor count of full-timers, AND enough total minutes for everyone
    // Actually, each full-timer satisfies exactly 'iguThreshold' employees.
    // Requirement: at least enough total minutes for everyone, and at least one valid class professional
    const iguValidClass = iguAssignments.some((a) => isIGUClassValid(dangerClass, a.titleClass));
    const iguRequiredMinutes = requiredIGUFullTimeCount * 11700 + requiredIGUExcessMinutes;
    const iguCompliant = totalIGUMinutes >= iguRequiredMinutes && iguValidClass;
    // --- HEKIM TIERED LOGIC ---
    const hekimThreshold = exports.HEKIM_FULLTIME_THRESHOLD[dangerClass] || 2000;
    const hekimRate = exports.HEKIM_MINUTES_PER_WORKER[dangerClass] || 5;
    const requiredHekimFullTimeCount = Math.floor(employeeCount / hekimThreshold);
    const excessHekimEmployees = employeeCount % hekimThreshold;
    const requiredHekimExcessMinutes = excessHekimEmployees * hekimRate;
    const assignedHekimFullTime = hekimAssignments.filter(a => a.isFullTime).length;
    const totalHekimMinutes = hekimAssignments.reduce((sum, a) => sum + (a.isFullTime ? Math.max(a.durationMinutes, 11700) : a.durationMinutes), 0);
    const hekimRequiredMinutes = requiredHekimFullTimeCount * 11700 + requiredHekimExcessMinutes;
    const hekimCompliant = totalHekimMinutes >= hekimRequiredMinutes;
    // --- DSP ---
    const isHekimFullTimeAssigned = hekimAssignments.some(a => a.isFullTime);
    let dspRequired = isDSPRequired(dangerClass, employeeCount);
    if (isHekimFullTimeAssigned) {
        dspRequired = false;
    }
    const dspRequiredMinutes = dspRequired ? calculateDSPRequiredMinutes(employeeCount) : 0;
    const dspAssignedMinutes = dspAssignments.reduce((sum, a) => sum + a.durationMinutes, 0);
    const dspAssigned = dspAssignments.length > 0;
    // If assigned even if not required, it's compliant. If required and not assigned, not compliant.
    const dspCompliant = dspAssigned || !dspRequired;
    // DSP summary
    let dspSummary = '';
    if (dangerClass !== 'Çok Tehlikeli') {
        dspSummary = 'Muaf';
    }
    else if (isHekimFullTimeAssigned) {
        dspSummary = 'Zorunlu Değil';
    }
    else if (!dspRequired) {
        dspSummary = '10 çalışan altı zorunlu değil';
    }
    else if (dspAssigned) {
        dspSummary = 'Uygun';
    }
    else {
        dspSummary = 'Eksik';
    }
    // --- VEKIL ---
    const vekilAssigned = vekilAssignments.length > 0;
    // Ceza
    const monthlyPenaltyRisk = calculateMonthlyPenalty(iguCompliant, hekimCompliant, dspCompliant, penaltyAmounts);
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
            requiredMinutes: dspRequiredMinutes,
            assignedMinutes: dspAssignedMinutes,
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
