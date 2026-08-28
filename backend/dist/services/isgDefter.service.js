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
exports.isgDefterService = void 0;
const client_1 = require("@prisma/client");
const xlsx = __importStar(require("xlsx"));
const prisma = new client_1.PrismaClient();
exports.isgDefterService = {
    // === CATEGORIES ===
    getCategories: async (facilityId) => {
        return prisma.isgDefterCategory.findMany({
            where: {
                OR: [{ facilityId }, { facilityId: null }]
            },
            orderBy: { name: 'asc' }
        });
    },
    createCategory: async (facilityId, name) => {
        return prisma.isgDefterCategory.create({
            data: { facilityId, name }
        });
    },
    updateCategory: async (id, name) => {
        return prisma.isgDefterCategory.update({
            where: { id },
            data: { name }
        });
    },
    deleteCategory: async (id, transferToId) => {
        if (transferToId) {
            await prisma.notebookItem.updateMany({
                where: { categoryId: id },
                data: { categoryId: transferToId }
            });
        }
        return prisma.isgDefterCategory.delete({
            where: { id }
        });
    },
    // === SETTINGS ===
    getSettings: async (facilityId) => {
        let setting = await prisma.isgDefterSetting.findUnique({
            where: { facilityId }
        });
        if (!setting) {
            // Default risk levels
            const defaultRiskLevels = [
                { name: 'Çok Yüksek', color: 'bg-red-600' },
                { name: 'Yüksek', color: 'bg-orange-500' },
                { name: 'Önemli', color: 'bg-yellow-500' },
                { name: 'Olası', color: 'bg-blue-500' },
                { name: 'Düşük', color: 'bg-green-500' }
            ];
            setting = await prisma.isgDefterSetting.create({
                data: {
                    facilityId,
                    maxPagesPerCilt: 50,
                    currentCilt: 1,
                    riskLevels: JSON.stringify(defaultRiskLevels)
                }
            });
        }
        return {
            ...setting,
            riskLevels: setting.riskLevels ? JSON.parse(setting.riskLevels) : []
        };
    },
    updateSettings: async (facilityId, data) => {
        const { riskLevels, maxPagesPerCilt, currentCilt } = data;
        return prisma.isgDefterSetting.upsert({
            where: { facilityId },
            update: {
                ...(riskLevels && { riskLevels: JSON.stringify(riskLevels) }),
                ...(maxPagesPerCilt && { maxPagesPerCilt: parseInt(maxPagesPerCilt) }),
                ...(currentCilt && { currentCilt: parseInt(currentCilt) }),
            },
            create: {
                facilityId,
                maxPagesPerCilt: maxPagesPerCilt ? parseInt(maxPagesPerCilt) : 50,
                currentCilt: currentCilt ? parseInt(currentCilt) : 1,
                riskLevels: riskLevels ? JSON.stringify(riskLevels) : null
            }
        });
    },
    // === RECORDS & PAGES ===
    getPages: async (facilityId, year) => {
        return prisma.notebookPage.findMany({
            where: {
                facilityId,
                ...(year && { year }),
            },
            include: {
                items: {
                    include: {
                        actions: true,
                        category: true,
                        comments: {
                            orderBy: { createdAt: 'asc' }
                        }
                    }
                }
            },
            orderBy: { date: 'desc' }
        });
    },
    createPage: async (data) => {
        // Determine page and cilt no
        const settings = await prisma.isgDefterSetting.findUnique({ where: { facilityId: data.facilityId } });
        const maxPages = settings?.maxPagesPerCilt || 50;
        const pageCount = await prisma.notebookPage.count({
            where: { facilityId: data.facilityId }
        });
        const ciltNo = Math.floor(pageCount / maxPages) + 1;
        const pageNo = (pageCount % maxPages) + 1;
        return prisma.notebookPage.create({
            data: {
                ...data,
                ciltNo,
                pageNo
            }
        });
    },
    updatePage: async (id, data) => {
        const updateData = {};
        if (data.ciltNo !== undefined)
            updateData.ciltNo = parseInt(data.ciltNo);
        if (data.pageNo !== undefined)
            updateData.pageNo = parseInt(data.pageNo);
        if (data.documentUrl !== undefined) {
            updateData.documentUrl = data.documentUrl;
            updateData.documentUploadedAt = new Date();
        }
        return prisma.notebookPage.update({
            where: { id },
            data: updateData
        });
    },
    createItem: async (data) => {
        return prisma.notebookItem.create({ data });
    },
    updateItem: async (id, data) => {
        return prisma.notebookItem.update({
            where: { id },
            data
        });
    },
    createItemAction: async (data) => {
        const action = await prisma.notebookItemAction.create({ data });
        await prisma.notebookItem.update({
            where: { id: data.notebookItemId },
            data: { status: data.status }
        });
        return action;
    },
    createComment: async (data) => {
        return prisma.notebookItemComment.create({ data });
    },
    getComments: async (itemId) => {
        return prisma.notebookItemComment.findMany({
            where: { notebookItemId: itemId },
            orderBy: { createdAt: 'asc' }
        });
    },
    // === EXCEL IMPORT ===
    importExcel: async (facilityId, year, filePath) => {
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        // Convert to JSON, skip header
        const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
        // Rows format: A(Tesis), B(Tarih), C(Tespit), D(Yapan), E(Sonuç)
        // index: 0=A, 1=B, 2=C, 3=D, 4=E
        const results = [];
        // Ensure default department for facility
        let defaultDepartment = await prisma.department.findFirst({
            where: { name: 'Genel' }
        });
        if (!defaultDepartment) {
            defaultDepartment = await prisma.department.create({ data: { name: 'Genel' } });
        }
        // Skip first row assuming it's headers
        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            if (!row || row.length < 3)
                continue;
            let dateVal = row[1];
            let itemDate = new Date();
            if (dateVal) {
                // Handle excel serial date or string
                if (typeof dateVal === 'number') {
                    itemDate = new Date((dateVal - (25567 + 2)) * 86400 * 1000); // Excel date to JS date
                }
                else {
                    itemDate = new Date(dateVal);
                    if (isNaN(itemDate.getTime()))
                        itemDate = new Date(); // fallback
                }
            }
            else {
                itemDate = new Date(year, 0, 1);
            }
            const content = row[2] || '';
            const authorType = row[3] || 'İSG Uzmanı';
            const statusText = row[4] || '';
            if (!content)
                continue;
            // 1. Create or Find Page for that date
            // Try to find a page for that date and facility
            let page = await prisma.notebookPage.findFirst({
                where: {
                    facilityId,
                    date: {
                        gte: new Date(itemDate.setHours(0, 0, 0, 0)),
                        lt: new Date(itemDate.setHours(23, 59, 59, 999))
                    }
                }
            });
            if (!page) {
                // Create new page with correct cilt/page numbers
                const settings = await prisma.isgDefterSetting.findUnique({ where: { facilityId } });
                const maxPages = settings?.maxPagesPerCilt || 50;
                const pageCount = await prisma.notebookPage.count({
                    where: { facilityId }
                });
                const ciltNo = Math.floor(pageCount / maxPages) + 1;
                const pageNo = (pageCount % maxPages) + 1;
                page = await prisma.notebookPage.create({
                    data: {
                        facilityId,
                        year: itemDate.getFullYear(),
                        date: itemDate,
                        ciltNo,
                        pageNo
                    }
                });
            }
            // 2. Create NotebookItem
            const item = await prisma.notebookItem.create({
                data: {
                    pageId: page.id,
                    content: content,
                    authorType: authorType,
                    authorName: 'Sistem', // In excel there is no user name, just type usually
                    categoryId: null, // Empty as requested
                    riskLevel: 'Belirlenmedi',
                    departmentId: defaultDepartment.id,
                    status: statusText.toLowerCase().includes('tamam') ? 'Tamamlandı' : 'Açık'
                }
            });
            if (statusText) {
                await prisma.notebookItemAction.create({
                    data: {
                        notebookItemId: item.id,
                        content: statusText,
                        status: statusText.toLowerCase().includes('tamam') ? 'Tamamlandı' : 'Açık',
                        createdBy: 'Sistem'
                    }
                });
            }
            results.push(item);
        }
        return results;
    },
    getDashboardStats: async (facilityId) => {
        const totalItems = await prisma.notebookItem.count({
            where: { page: { facilityId } }
        });
        const openItems = await prisma.notebookItem.count({
            where: { page: { facilityId }, status: 'Açık' }
        });
        return {
            totalItems,
            openItems,
            openPercentage: totalItems > 0 ? (openItems / totalItems) * 100 : 0
        };
    }
};
