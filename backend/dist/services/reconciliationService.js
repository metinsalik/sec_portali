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
exports.calculateMonthlyReconciliation = calculateMonthlyReconciliation;
exports.syncReconciliation = syncReconciliation;
exports.autoSyncAllMonths = autoSyncAllMonths;
exports.exportReconciliationToExcel = exportReconciliationToExcel;
const client_1 = require("@prisma/client");
const XLSX = __importStar(require("xlsx"));
const prisma = new client_1.PrismaClient();
async function calculateMonthlyReconciliation(month) {
    // 1. Ayın başlangıç ve bitiş tarihlerini belirle
    const [year, monthStr] = month.split('-').map(Number);
    const startDate = new Date(year, monthStr - 1, 1);
    const endDate = new Date(year, monthStr, 0, 23, 59, 59);
    // 2. Bu ay aktif olan tüm atamaları getir (OSGB atamaları)
    const assignments = await prisma.assignment.findMany({
        where: {
            status: 'Aktif',
            startDate: { lte: endDate },
            OR: [
                { endDate: null },
                { endDate: { gte: startDate } }
            ],
            professional: {
                employmentType: 'OSGB Kadrosu'
            }
        },
        include: {
            professional: true,
            facility: true
        }
    });
    // 3. Hesaplama yap ve grupla (Facility + OSGB)
    const results = {};
    for (const assignment of assignments) {
        if (!assignment.professional || !assignment.professional.osgbName)
            continue;
        const osgbName = assignment.professional.osgbName;
        const facilityId = assignment.facilityId;
        const key = `${facilityId}_${osgbName}`;
        // OSGB Şirketini ID olarak bulmak için (isimle eşleştirme)
        const osgbCompany = await prisma.oSGBCompany.findFirst({
            where: { name: osgbName }
        });
        if (!osgbCompany)
            continue;
        if (!results[key]) {
            results[key] = {
                facilityId,
                facilityName: assignment.facility.name,
                osgbCompanyId: osgbCompany.id,
                osgbCompanyName: osgbName,
                month,
                calculatedAmount: 0,
                details: []
            };
        }
        // Ücret hesaplama logic
        const unitPrice = assignment.unitPrice || assignment.professional.unitPrice || 0;
        let cost = 0;
        let description = '';
        if (assignment.isFullTime) {
            // Tam zamanlı: Sabit aylık ücret
            cost = unitPrice;
            description = `Tam Zamanlı Sabit Ücret (${assignment.professional.fullName})`;
        }
        else {
            // Kısmi zamanlı: Dakikayı saate yuvarla (Math.ceil)
            const hours = Math.ceil(assignment.durationMinutes / 60);
            cost = hours * unitPrice;
            description = `Kısmi Zamanlı: ${assignment.durationMinutes} dk -> ${hours} saat * ₺${unitPrice} (${assignment.professional.fullName})`;
        }
        results[key].calculatedAmount += cost;
        results[key].details.push({
            professionalId: assignment.professionalId,
            professionalName: assignment.professional.fullName,
            assignmentId: assignment.id,
            durationMinutes: assignment.durationMinutes,
            isFullTime: assignment.isFullTime,
            unitPrice,
            cost,
            description
        });
    }
    return Object.values(results);
}
async function syncReconciliation(month) {
    const calculations = await calculateMonthlyReconciliation(month);
    const syncedItems = [];
    for (const calc of calculations) {
        const item = await prisma.reconciliation.upsert({
            where: {
                facilityId_osgbCompanyId_month: {
                    facilityId: calc.facilityId,
                    osgbCompanyId: calc.osgbCompanyId,
                    month: calc.month
                }
            },
            update: {
                calculatedAmount: calc.calculatedAmount,
                calculationDetails: calc.details,
                difference: calc.calculatedAmount - (calc.invoiceAmount || 0)
            },
            create: {
                facilityId: calc.facilityId,
                osgbCompanyId: calc.osgbCompanyId,
                month: calc.month,
                calculatedAmount: calc.calculatedAmount,
                calculationDetails: calc.details,
                difference: calc.calculatedAmount,
                status: 'Beklemede'
            }
        });
        syncedItems.push(item);
    }
    return syncedItems;
}
/**
 * Belirli bir tarihten günümüze kadar tüm ayları senkronize eder
 */
async function autoSyncAllMonths(startYear = 2026) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    for (let year = startYear; year <= currentYear; year++) {
        const maxMonth = (year === currentYear) ? currentMonth : 12;
        for (let month = 1; month <= maxMonth; month++) {
            const monthStr = `${year}-${month.toString().padStart(2, '0')}`;
            await syncReconciliation(monthStr);
        }
    }
}
/**
 * Mutabakat verilerini Excel dosyasına dönüştürür
 */
async function exportReconciliationToExcel(items) {
    const data = items.flatMap(item => {
        const details = item.calculationDetails || [];
        return details.map(d => ({
            'Dönem': item.month,
            'OSGB': item.osgbCompany?.name,
            'Tesis': item.facility?.name,
            'Profesyonel': d.professionalName,
            'İstihdam': d.isFullTime ? 'Tam Zamanlı' : 'Kısmi Zamanlı',
            'Süre (dk)': d.durationMinutes,
            'Birim Fiyat (₺)': d.unitPrice,
            'Sistem Hesabı (₺)': d.cost,
            'Hesaplama Detayı': d.description,
            'Fatura Tutarı (₺)': d.invoiceAmount || 0,
            'Durum': item.status
        }));
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Mutabakat');
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}
