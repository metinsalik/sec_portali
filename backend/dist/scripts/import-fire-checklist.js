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
const client_1 = require("@prisma/client");
const xlsx = __importStar(require("xlsx"));
const prisma = new client_1.PrismaClient();
const FACILITY_MAP = {
    'ADANA MP': 'MP Adana',
    'ANKARA LİV': 'Liv Ankara',
    'ANKARA MP': 'MP Ankara',
    'ANKARA VM': 'VM MP Ankara',
    'ANKARA İNCEK MP': 'MP İncek',
    'ANTALYA MP': 'MP Antalya',
    'ATAŞEHİR MP': 'MP Ataşehir',
    'BAHÇELİEVLER MP': 'MP Bahçelievler',
    'BURSA VM': 'VM MP Bursa',
    'FLORYA VM': 'VM MP Florya',
    'GAZİANTEP LİV': 'Liv Gaziantep',
    'GEBZE MP': 'MP Gebze',
    'GEBZE VM': 'MP Gebze',
    'GÖZTEPE MP': 'MP Göztepe',
    'İSÜ BAHÇEŞEHİR LİV': 'İSÜ Liv Bahçeşehir',
    'İSÜ GAZİOSMANPAŞA MP': 'İSÜ MP Gaziosmanpaşa',
    'İSÜ Liv Topkapı': 'İSÜ Liv Topkapı',
    'İSÜ Tıp Fakültesi': 'İSÜ Tıp Fakültesi',
    'İZMİR MP': 'MP İzmir',
    'KOCAELİ VM': 'VM MP Kocaeli',
    'MALTEPE VM': 'VM MP Maltepe',
    'MERSİN VM': 'VM MP Mersin',
    'ONKOLOJİ MP': 'MP İstanbul Onkoloji',
    'ORDU MP': 'MP Ordu',
    'PENDİK VM': 'VM MP Pendik',
    'SAMSUN LİV': 'Liv Samsun',
    'SAMSUN VM': 'VM MP Samsun',
    'SEYHAN MP': 'MP Seyhan',
    'TEM MP': 'MP Tem',
    'TOKAT MP': 'MP Tokat',
    'TRABZON KARADENİZ MP': 'MP Karadeniz',
    'TRABZON YILDIZLI MP': 'MP Yıldızlı',
    'ULUS LİV': 'Liv Ulus',
    'VADİ LİV': 'Liv Vadi',
    'TEM MP ': 'MP Tem'
};
async function main() {
    console.log('Reading Excel file...');
    const workbook = xlsx.readFile('/Users/metinsalik/Desktop/Projelerim/sec_portali/Yangın Denetimleri/yangin-haziran-2026.xlsx');
    const worksheet = workbook.Sheets['Konsolide Denetim Sonuçları'];
    const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
    const adminUser = await prisma.user.findFirst({ where: { roles: { some: { role: { name: 'admin' } } } } }) || await prisma.user.findFirst();
    if (!adminUser)
        throw new Error("Admin user not found. Can't set createdBy.");
    // 1. Create or Find ScaleSet
    let scaleSet = await prisma.checklistScaleSet.findFirst({
        where: { name: 'Standart Uygunluk Ölçeği (10, 5, -10)' },
        include: { options: true }
    });
    if (!scaleSet) {
        console.log('Creating ScaleSet...');
        scaleSet = await prisma.checklistScaleSet.create({
            data: {
                name: 'Standart Uygunluk Ölçeği (10, 5, -10)',
                options: {
                    create: [
                        { label: 'Karşılıyor', multiplier: 10, color: 'success', sortOrder: 1 },
                        { label: 'Kısmen Karşılıyor', multiplier: 5, color: 'warning', sortOrder: 2 },
                        { label: 'Karşılamıyor', multiplier: -10, color: 'danger', sortOrder: 3 },
                        { label: 'G/D', multiplier: 0, color: 'default', sortOrder: 4 }
                    ]
                }
            },
            include: { options: true }
        });
    }
    // 2. Create Template
    console.log('Creating Checklist Template...');
    const group = await prisma.checklistTemplateGroup.findFirst({ where: { name: 'Yangın Kontrol Listesi' } });
    const template = await prisma.checklistTemplate.create({
        data: {
            title: 'Yangın Denetimleri - Haziran 2026',
            description: 'Haziran 2026 Yangın Denetimleri Konsolide Sonuçları (Excel Aktarımı)',
            createdById: adminUser.username,
            groupId: group?.id || null,
            scaleSetId: scaleSet.id,
            isActive: true,
            sections: {
                create: [
                    {
                        title: 'Genel Kontroller',
                        sortOrder: 0
                    }
                ]
            }
        },
        include: { sections: true }
    });
    const sectionId = template.sections[0].id;
    // 3. Map Hospitals
    const excelRow = data[2];
    const hospitalColumns = [];
    for (let i = 13; i < excelRow.length; i += 12) {
        if (excelRow[i]) {
            const excelName = excelRow[i].trim();
            const mappedName = FACILITY_MAP[excelName] || excelName;
            const dbFacility = await prisma.facility.findFirst({ where: { name: mappedName } });
            if (dbFacility) {
                hospitalColumns.push({ name: excelName, colIndex: i, facilityId: dbFacility.id });
            }
            else {
                console.warn(`Warning: Facility not found in DB for Excel name "${excelName}"`);
            }
        }
    }
    // 4. Parse Questions
    console.log(`Extracting questions and preparing submissions for ${hospitalColumns.length} hospitals...`);
    const questions = [];
    let itemOrder = 1;
    for (let rowIdx = 7; rowIdx < data.length; rowIdx += 2) {
        const rowData = data[rowIdx];
        if (!rowData || rowData.length === 0)
            continue;
        const questionText = rowData[1];
        if (typeof questionText === 'string' && questionText.trim().length > 0) {
            const item = await prisma.checklistItem.create({
                data: {
                    sectionId,
                    questionText: questionText.trim(),
                    questionType: 'MULTIPLE_CHOICE',
                    itemNo: itemOrder,
                    sortOrder: itemOrder,
                    isRequired: true
                }
            });
            questions.push({ rowIdx, item });
            itemOrder++;
        }
    }
    console.log(`Created ${questions.length} questions.`);
    // 5. Create Submissions
    for (const hc of hospitalColumns) {
        let totalScore = 0;
        const submission = await prisma.checklistSubmission.create({
            data: {
                templateId: template.id,
                facilityId: hc.facilityId,
                status: 'TAMAMLANDI',
                conductedById: adminUser.username,
                auditDate: new Date('2026-06-15T09:00:00Z'),
            }
        });
        for (const q of questions) {
            const rowData = data[q.rowIdx];
            if (!rowData)
                continue;
            const evalLabel = rowData[hc.colIndex];
            let numericScore = 0;
            let scaleOptionId = null;
            if (evalLabel && typeof evalLabel === 'string') {
                const matchingOption = scaleSet.options.find(o => o.label.toLowerCase() === evalLabel.trim().toLowerCase());
                if (matchingOption) {
                    numericScore = matchingOption.multiplier || 0;
                    scaleOptionId = matchingOption.id;
                    totalScore += matchingOption.multiplier || 0;
                }
            }
            let note = rowData[hc.colIndex + 8];
            if (note === undefined || note === null) {
                note = '';
            }
            await prisma.checklistAnswer.create({
                data: {
                    submissionId: submission.id,
                    itemId: q.item.id,
                    scaleOptionId: scaleOptionId,
                    earnedScore: numericScore,
                    note: note.toString()
                }
            });
        }
        const maxPossible = questions.length * 10;
        const percentScore = maxPossible > 0 ? (totalScore / maxPossible) * 100 : 0;
        await prisma.checklistSubmission.update({
            where: { id: submission.id },
            data: {
                totalScore: totalScore,
                maxScore: maxPossible,
                percentScore: Math.max(0, Math.min(100, percentScore))
            }
        });
        console.log(`Created submission for ${hc.name} (Score: %${percentScore.toFixed(1)})`);
    }
    console.log('✅ Import completed successfully!');
}
main().catch(console.error).finally(() => prisma.$disconnect());
