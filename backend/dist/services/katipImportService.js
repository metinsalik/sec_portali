"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.processKatipImport = processKatipImport;
const xlsx = __importStar(require("xlsx"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
function excelDateToJSDate(excelDate) {
    if (!excelDate)
        return null;
    if (typeof excelDate === 'number') {
        const utc_days = Math.floor(excelDate - 25569);
        const utc_value = utc_days * 86400;
        return new Date(utc_value * 1000);
    }
    const date = new Date(excelDate);
    if (isNaN(date.getTime()))
        return null;
    return date;
}
function determineTitleClass(sertifikaTipi) {
    const t = (sertifikaTipi || '').toLowerCase();
    if (t.includes('a sınıfı'))
        return 'A Sınıfı IGU';
    if (t.includes('b sınıfı'))
        return 'B Sınıfı IGU';
    if (t.includes('c sınıfı'))
        return 'C Sınıfı IGU';
    if (t.includes('hekim'))
        return 'İşyeri Hekimi';
    if (t.includes('diğer sağlık') || t.includes('dsp'))
        return 'DSP';
    return 'Diğer';
}
function determineAssignmentType(sertifikaTipi) {
    const t = (sertifikaTipi || '').toLowerCase();
    if (t.includes('sınıfı'))
        return 'IGU';
    if (t.includes('hekim'))
        return 'Hekim';
    if (t.includes('sağlık') || t.includes('dsp'))
        return 'DSP';
    return 'Diğer';
}
async function processKatipImport(facilityId, fileBuffer, username) {
    const wb = xlsx.read(fileBuffer, { type: 'buffer' });
    const wsName = wb.SheetNames[0];
    const ws = wb.Sheets[wsName];
    const rawData = xlsx.utils.sheet_to_json(ws);
    // Sort by 'Sözleşme Başlangıç Tarihi' ascending so historical logs apply chronologically
    const data = rawData.sort((a, b) => {
        const dateA = a['Sözleşme Onay Tarihi'] || a['Sözleşme Başlangıç Tarihi'] || 0;
        const dateB = b['Sözleşme Onay Tarihi'] || b['Sözleşme Başlangıç Tarihi'] || 0;
        return (Number(dateA) || 0) - (Number(dateB) || 0);
    });
    const facility = await prisma.facility.findUnique({ where: { id: facilityId } });
    if (!facility)
        throw new Error('Facility not found');
    const allProfessionals = await prisma.professional.findMany();
    const allOsgbs = await prisma.oSGBCompany.findMany();
    function normalizeName(name) {
        return (name || '').toLocaleUpperCase('tr-TR').replace(/\s+/g, ' ').trim();
    }
    let employeeCountUpdated = false;
    let newEmployeeCount = facility.employeeCount;
    for (const row of data) {
        // 1. Update Employee Count
        const count = parseInt(row['Hizmet Alan İşyeri Çalışan Sayısı']);
        if (!isNaN(count) && count !== newEmployeeCount) {
            newEmployeeCount = count;
            employeeCountUpdated = true;
        }
        // 2. Process Professional
        const fullName = row['Görevlendirilen Kişi Ad Soyad']?.trim();
        if (!fullName)
            continue;
        const sertifikaTipi = row['Görevlendirilen Kişi Sertifika Tipi'] || '';
        const sertifikaNo = row['Görevlendirilen Kişi Sertifika No'] || '';
        const sozlesmeTipi = row['Sözleşme Tipi'] || '';
        const calismaSuresi = parseInt(row['Çalışma Süresi']) || 0;
        const sozlesmeStatusu = row['Sözleşme Statüsü'] || '';
        const baslangic = excelDateToJSDate(row['Sözleşme Başlangıç Tarihi']);
        const bitis = excelDateToJSDate(row['Sözleşme Bitiş Tarihi']);
        const isFullTime = sozlesmeTipi.toLowerCase().includes('tam');
        if (!baslangic)
            continue;
        const newTitleClass = determineTitleClass(sertifikaTipi);
        const newCertNo = String(sertifikaNo);
        const unvan = (row['Hizmet Veren İşyeri Unvanı'] || '').toLowerCase();
        const isOSGB = unvan.includes('ortak sağlık') || unvan.includes('osgb');
        const empType = isOSGB ? 'OSGB Kadrosu' : 'Tesis Kadrosu';
        if (isOSGB && row['Hizmet Veren İşyeri Unvanı']) {
            const normalizedOsgbName = normalizeName(row['Hizmet Veren İşyeri Unvanı']);
            let osgb = allOsgbs.find(o => normalizeName(o.name) === normalizedOsgbName);
            if (!osgb) {
                osgb = await prisma.oSGBCompany.create({
                    data: {
                        name: row['Hizmet Veren İşyeri Unvanı'],
                        isActive: true
                    }
                });
                allOsgbs.push(osgb);
            }
        }
        let professional = null;
        const normalizedTargetName = normalizeName(fullName);
        if (newCertNo && newCertNo.length > 0 && newCertNo !== 'null' && newCertNo !== 'undefined') {
            professional = allProfessionals.find(p => p.certificateNo === newCertNo) || null;
        }
        if (!professional) {
            professional = allProfessionals.find(p => normalizeName(p.fullName) === normalizedTargetName) || null;
        }
        if (!professional) {
            professional = await prisma.professional.create({
                data: {
                    fullName,
                    employmentType: empType,
                    titleClass: newTitleClass,
                    certificateNo: newCertNo,
                    osgbName: isOSGB ? row['Hizmet Veren İşyeri Unvanı'] : '',
                    isActive: true
                }
            });
            allProfessionals.push(professional);
        }
        else {
            const needsTitleUpdate = sertifikaTipi && newTitleClass !== professional.titleClass;
            const needsEmpTypeUpdate = professional.employmentType !== empType;
            const needsCertUpdate = newCertNo && newCertNo !== 'null' && newCertNo !== 'undefined' && newCertNo !== professional.certificateNo;
            const targetOsgbName = isOSGB ? row['Hizmet Veren İşyeri Unvanı'] : '';
            const needsOsgbUpdate = professional.osgbName !== targetOsgbName;
            if (needsTitleUpdate || needsEmpTypeUpdate || needsCertUpdate || needsOsgbUpdate) {
                professional = await prisma.professional.update({
                    where: { id: professional.id },
                    data: {
                        titleClass: needsTitleUpdate ? newTitleClass : professional.titleClass,
                        certificateNo: needsCertUpdate ? newCertNo : professional.certificateNo,
                        employmentType: needsEmpTypeUpdate ? empType : professional.employmentType,
                        osgbName: targetOsgbName
                    }
                });
                // Update in-memory reference so future rows use the updated properties
                const idx = allProfessionals.findIndex(p => p.id === professional.id);
                if (idx !== -1) {
                    allProfessionals[idx] = professional;
                }
            }
        }
        // 3. Process Assignment
        const type = determineAssignmentType(sertifikaTipi);
        const isTerminated = sozlesmeStatusu.toLowerCase().includes('sonlandırı') || sozlesmeStatusu.toLowerCase().includes('iptal');
        let assignment = await prisma.assignment.findFirst({
            where: {
                facilityId,
                professionalId: professional.id,
                type: type
            },
            orderBy: { id: 'desc' }
        });
        const actionDate = bitis && isTerminated ? bitis : baslangic;
        if (!assignment) {
            if (!isTerminated) {
                assignment = await prisma.assignment.create({
                    data: {
                        facilityId,
                        professionalId: professional.id,
                        type,
                        durationMinutes: calismaSuresi,
                        isFullTime,
                        startDate: baslangic,
                        status: 'Aktif'
                    }
                });
                await prisma.activityLog.create({
                    data: {
                        facilityId,
                        professionalId: professional.id,
                        username,
                        action: 'İSG-KATİP Yeni Atama',
                        details: `İSG-KATİP aktarımı ile ${type} ataması sisteme işlendi. Sözleşme Süresi: ${calismaSuresi} dk.`,
                        createdAt: baslangic
                    }
                });
            }
        }
        else {
            if (isTerminated && assignment.status === 'Aktif') {
                await prisma.assignment.update({
                    where: { id: assignment.id },
                    data: {
                        status: 'Sona Erdi',
                        endDate: bitis || new Date()
                    }
                });
                await prisma.activityLog.create({
                    data: {
                        facilityId,
                        professionalId: professional.id,
                        username,
                        action: 'İSG-KATİP Atama Sonlandırma',
                        details: `İSG-KATİP kayıtlarına göre atama sonlandırıldı.`,
                        createdAt: actionDate
                    }
                });
            }
            else if (!isTerminated && assignment.status !== 'Aktif') {
                await prisma.assignment.create({
                    data: {
                        facilityId,
                        professionalId: professional.id,
                        type,
                        durationMinutes: calismaSuresi,
                        isFullTime,
                        startDate: baslangic,
                        status: 'Aktif'
                    }
                });
                await prisma.activityLog.create({
                    data: {
                        facilityId,
                        professionalId: professional.id,
                        username,
                        action: 'İSG-KATİP Yeniden Atama',
                        details: `İSG-KATİP üzerinden yeni dönem ataması aktifleşti.`,
                        createdAt: baslangic
                    }
                });
            }
        }
    }
    if (employeeCountUpdated) {
        await prisma.facility.update({
            where: { id: facilityId },
            data: { employeeCount: newEmployeeCount }
        });
        await prisma.employeeCountHistory.create({
            data: {
                facilityId,
                count: newEmployeeCount,
                effectiveDate: new Date()
            }
        });
        await prisma.activityLog.create({
            data: {
                facilityId,
                username,
                action: 'Çalışan Sayısı Güncellendi',
                details: `İSG-KATİP verisine istinaden tesis çalışan sayısı ${newEmployeeCount} olarak güncellendi.`
            }
        });
    }
    return { success: true, newEmployeeCount };
}
