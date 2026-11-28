import { PrismaClient } from '@prisma/client';
import * as xlsx from 'xlsx';

const prisma = new PrismaClient();

const DEFAULT_RISK_LEVELS = [
  { name: 'Kritik', color: 'bg-red-600' },
  { name: 'Yüksek', color: 'bg-orange-500' },
  { name: 'Önemli', color: 'bg-amber-500' },
  { name: 'Olası', color: 'bg-yellow-500' },
  { name: 'Önemsiz', color: 'bg-slate-500' },
];

function normalizeRiskLevel(level?: string | null): string {
  const val = String(level || '').trim();
  if (!val) return 'Belirlenmedi';
  const lower = val.toLocaleLowerCase('tr-TR');
  if (lower.includes('tolere') || lower === 'kritik') return 'Kritik';
  if (lower.includes('yüksek')) return 'Yüksek';
  if (lower.includes('önemli')) return 'Önemli';
  if (lower.includes('olası')) return 'Olası';
  if (lower.includes('önemsiz')) return 'Önemsiz';
  return val;
}

function normalizeRiskSettingsList(raw: any[]): { name: string; color: string }[] {
  if (!Array.isArray(raw) || raw.length === 0) return DEFAULT_RISK_LEVELS;
  const seen = new Set<string>();
  const normalized: { name: string; color: string }[] = [];
  for (const r of raw) {
    const name = normalizeRiskLevel(r?.name);
    if (name === 'Belirlenmedi' || seen.has(name)) continue;
    seen.add(name);
    normalized.push({
      name,
      color: name === 'Kritik' ? 'bg-red-600' : (r?.color || 'bg-slate-500'),
    });
  }
  return normalized.length > 0 ? normalized : DEFAULT_RISK_LEVELS;
}

export const isgDefterService = {
  // === SETTINGS ===
  getSettings: async (facilityId: string) => {
    let settings = null;
    if (facilityId !== 'all') {
      settings = await prisma.isgDefterSetting.findUnique({ where: { facilityId } });
    }
    
    // Always fetch global settings for risk levels
    const globalSettings = await prisma.isgDefterSetting.findUnique({ where: { facilityId: 'all' } });

    // Use global risk levels if available, else local, else default Improvements scale
    const rawRiskLevels = globalSettings?.riskLevels || settings?.riskLevels;
    const parsedRiskLevels = normalizeRiskSettingsList(rawRiskLevels ? JSON.parse(rawRiskLevels) : []);

    if (settings) {
      return {
        ...settings,
        riskLevels: parsedRiskLevels
      };
    }
    
    return {
      currentCilt: 1,
      maxPagesPerCilt: 50,
      ...(globalSettings || {}),
      riskLevels: parsedRiskLevels
    };
  },

  updateSettings: async (facilityId: string, data: any) => {
    const { riskLevels, maxPagesPerCilt, currentCilt } = data;
    
    // Risk düzeyleri her zaman 'all' (global) olarak kaydedilir
    if (riskLevels !== undefined) {
      await prisma.isgDefterSetting.upsert({
        where: { facilityId: 'all' },
        update: { riskLevels: JSON.stringify(riskLevels) },
        create: {
          facilityId: 'all',
          riskLevels: JSON.stringify(riskLevels),
          maxPagesPerCilt: 50,
          currentCilt: 1
        }
      });
    }

    // Diğer ayarlar (cilt vb.) seçili tesise kaydedilir
    return prisma.isgDefterSetting.upsert({
      where: { facilityId },
      update: {
        ...(maxPagesPerCilt && { maxPagesPerCilt: parseInt(maxPagesPerCilt) }),
        ...(currentCilt && { currentCilt: parseInt(currentCilt) }),
      },
      create: {
        facilityId,
        maxPagesPerCilt: maxPagesPerCilt ? parseInt(maxPagesPerCilt) : 50,
        currentCilt: currentCilt ? parseInt(currentCilt) : 1,
      }
    });
  },

  // === RECORDS & PAGES ===
  getPages: async (facilityId: string, year?: number) => {
    const pages = await prisma.notebookPage.findMany({
      where: {
        ...(facilityId && facilityId !== 'all' && { facilityId }),
        ...(year && { year }),
      },
      include: {
        facility: true,
        items: {
          include: {
            actions: true,
            category: true,
            department: true,
            comments: {
              orderBy: { createdAt: 'asc' }
            }
          }
        }
      },
      orderBy: { date: 'desc' }
    });
    return pages.map((p) => ({
      ...p,
      items: p.items.map((item) => ({
        ...item,
        riskLevel: normalizeRiskLevel(item.riskLevel),
      })),
    }));
  },

  createPage: async (data: any) => {
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
        pageNo: pageNo.toString()
      } 
    });
  },

  updatePage: async (id: number, data: any) => {
    const updateData: any = {};
    if (data.ciltNo !== undefined) updateData.ciltNo = parseInt(data.ciltNo);
    if (data.pageNo !== undefined) updateData.pageNo = data.pageNo.toString();
    if (data.documentUrl !== undefined) {
      updateData.documentUrl = data.documentUrl;
      updateData.documentUploadedAt = new Date();
    }
    if (data.date !== undefined) {
      updateData.date = new Date(data.date);
      updateData.year = updateData.date.getFullYear();
    }

    return prisma.notebookPage.update({
      where: { id },
      data: updateData
    });
  },

  updatePagesBulk: async (ids: number[], data: any) => {
    const updateData: any = {};
    if (data.ciltNo !== undefined) updateData.ciltNo = parseInt(data.ciltNo);
    if (data.pageNo !== undefined) updateData.pageNo = data.pageNo.toString();
    if (data.documentUrl !== undefined) {
      updateData.documentUrl = data.documentUrl;
      updateData.documentUploadedAt = new Date();
    }
    if (data.date !== undefined) {
      updateData.date = new Date(data.date);
      updateData.year = updateData.date.getFullYear();
    }

    return prisma.notebookPage.updateMany({
      where: { id: { in: ids } },
      data: updateData
    });
  },

  deletePagesBulk: async (ids: number[]) => {
    return prisma.notebookPage.deleteMany({
      where: { id: { in: ids } }
    });
  },

  createItem: async (data: any) => {
    return prisma.notebookItem.create({ data });
  },

  updateItem: async (id: number, data: any) => {
    return prisma.notebookItem.update({
      where: { id },
      data
    });
  },

  createItemAction: async (data: any) => {
    const { departmentId, departmentName, ...actionData } = data;
    let finalContent = String(actionData.content || '').trim();
    if (departmentName && !finalContent.startsWith(`[${departmentName}]`)) {
      finalContent = `[${departmentName}] ${finalContent}`;
    }

    const action = await prisma.notebookItemAction.create({
      data: {
        ...actionData,
        content: finalContent,
      },
    });
    await prisma.notebookItem.update({
      where: { id: actionData.notebookItemId },
      data: {
        status: actionData.status,
        ...(departmentId ? { departmentId: Number(departmentId) } : {}),
      }
    });
    return action;
  },

  createComment: async (data: any) => {
    return prisma.notebookItemComment.create({ data });
  },

  getComments: async (itemId: number) => {
    return prisma.notebookItemComment.findMany({
      where: { notebookItemId: itemId },
      orderBy: { createdAt: 'asc' }
    });
  },

  // === EXCEL IMPORT ===
  importExcel: async (facilityId: string, year: number, filePath: string) => {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Convert to JSON, skip header
    const data: any[] = xlsx.utils.sheet_to_json(sheet, { header: 1 });
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

    let duplicateCount = 0;

    // Skip first row assuming it's headers
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length < 3) continue;

      let dateVal = row[1];
      let itemDate = new Date();
      if (dateVal) {
        // Handle excel serial date or string
        if (typeof dateVal === 'number') {
          itemDate = new Date((dateVal - (25567 + 2)) * 86400 * 1000); // Excel date to JS date
        } else {
          itemDate = new Date(dateVal);
          if (isNaN(itemDate.getTime())) itemDate = new Date(); // fallback
        }
      } else {
        itemDate = new Date(year, 0, 1);
      }

      const content = row[2] || '';
      const authorType = row[3] || 'İSG Uzmanı';
      const statusText = row[4] || '';

      if (!content) continue;

      // 1. Create or Find Page for that date
      // Try to find a page for that date and facility
      let page = await prisma.notebookPage.findFirst({
        where: {
          facilityId,
          date: {
            gte: new Date(itemDate.setHours(0,0,0,0)),
            lt: new Date(itemDate.setHours(23,59,59,999))
          }
        }
      });

      if (page) {
        // Check if item already exists
        const existingItem = await prisma.notebookItem.findFirst({
          where: {
            pageId: page.id,
            content: content
          }
        });
        
        if (existingItem) {
          duplicateCount++;
          continue;
        }
      } else {
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
            pageNo: pageNo.toString()
          }
        });
      }

      // 2. Create NotebookItem
      const item = await prisma.notebookItem.create({
        data: {
          pageId: page.id,
          content: content,
          authorType: authorType,
          authorName: '', // In excel there is no user name, just type usually
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

    if (results.length === 0 && duplicateCount > 0) {
      throw new Error('Bu Excel dosyası daha önce yüklenmiş veya içerisindeki tüm maddeler zaten mevcut.');
    }

    return results;
  },

  deletePage: async (id: number) => {
    return prisma.notebookPage.delete({
      where: { id }
    });
  },

  deleteItem: async (id: number) => {
    return prisma.notebookItem.delete({
      where: { id }
    });
  },

  getDashboardStats: async (facilityId: string, filters: any = {}) => {
    const { year, month, status, mainCategory, category, risk } = filters;
    
    // Fetch base items for facility and year (Global filters)
    const baseWhere: any = {
      page: {
        ...(facilityId && facilityId !== 'all' && { facilityId }),
        ...(year && year !== 'all' && { year: parseInt(year) }),
      }
    };

    const rawItems = await prisma.notebookItem.findMany({
      where: baseWhere,
      include: {
        page: { include: { facility: true } },
        category: true,
        mainCategory: true,
        department: true,
        actions: { orderBy: { createdAt: 'desc' } },
      }
    });

    const allItems = rawItems.map((i) => ({
      ...i,
      riskLevel: normalizeRiskLevel(i.riskLevel),
    }));

    const monthInt = month && month !== 'all' ? parseInt(month) : null;
    const activeStatus = status && status !== 'all' ? status : null;
    const activeRisk = risk && risk !== 'all' ? normalizeRiskLevel(risk) : null;
    const activeMainCat = mainCategory && mainCategory !== 'all' ? mainCategory : null;
    const activeCat = category && category !== 'all' ? category : null;

    // Helpers
    const matchesMonth = (item: any) => monthInt === null || item.page.date.getMonth() === monthInt;
    const matchesStatus = (item: any) => {
      if (!activeStatus) return true;
      if (activeStatus === 'Tamamlanmamış') return item.status !== 'Tamamlandı' && item.status !== 'İptal Edildi';
      return item.status === activeStatus;
    };
    const matchesRisk = (item: any) => !activeRisk || item.riskLevel === activeRisk;
    const matchesMainCat = (item: any) => !activeMainCat || item.mainCategory?.name === activeMainCat;
    const matchesCat = (item: any) => !activeCat || item.category?.name === activeCat;

    // Fully filtered items (for table and totals)
    const fullyFilteredItems = allItems.filter(i => 
      matchesMonth(i) && matchesStatus(i) && matchesRisk(i) && matchesMainCat(i) && matchesCat(i)
    );

    const facilityName = facilityId === 'all' 
      ? 'Tüm Tesisler' 
      : (allItems.length > 0 ? allItems[0].page.facility?.name : (await prisma.facility.findUnique({ where: { id: facilityId } }))?.name || 'Bilinmeyen Tesis');

    const totalItems = fullyFilteredItems.length;
    const incompleteItemsList = fullyFilteredItems.filter(i => i.status !== 'Tamamlandı' && i.status !== 'İptal Edildi');
    const closedItemsList = fullyFilteredItems.filter(i => i.status === 'Tamamlandı');
    
    const incompleteItems = incompleteItemsList.length;
    const closedItems = closedItemsList.length;
    
    const now = new Date();
    
    // Status Distribution (Filter by everything EXCEPT status)
    const statusItems = allItems.filter(i => matchesMonth(i) && matchesRisk(i) && matchesMainCat(i) && matchesCat(i));
    const statusDistributionMap: Record<string, number> = {};
    statusItems.forEach(i => {
      statusDistributionMap[i.status] = (statusDistributionMap[i.status] || 0) + 1;
    });
    const statusDistribution = Object.entries(statusDistributionMap).map(([name, value]) => ({ name, value }));

    // Risk Distribution (Filter by everything EXCEPT risk)
    const riskItems = allItems.filter(i => matchesMonth(i) && matchesStatus(i) && matchesMainCat(i) && matchesCat(i));
    const riskDistributionMap: Record<string, number> = {};
    riskItems.forEach(i => {
      riskDistributionMap[i.riskLevel] = (riskDistributionMap[i.riskLevel] || 0) + 1;
    });
    const riskDistribution = Object.entries(riskDistributionMap).map(([name, value]) => ({ name, value }));

    // Main Category Distribution (Filter by everything EXCEPT mainCategory and category)
    const mainCatItems = allItems.filter(i => matchesMonth(i) && matchesStatus(i) && matchesRisk(i));
    const mainCategoryDistributionMap: Record<string, number> = {};
    mainCatItems.forEach(i => {
      const name = i.mainCategory?.name || 'Diğer';
      mainCategoryDistributionMap[name] = (mainCategoryDistributionMap[name] || 0) + 1;
    });
    const mainCategoryDistribution = Object.entries(mainCategoryDistributionMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
      
    // Sub Category Distribution (Filter by everything EXCEPT category, but KEEP mainCat filter)
    const catItems = allItems.filter(i => matchesMonth(i) && matchesStatus(i) && matchesRisk(i) && matchesMainCat(i));
    const subCategoryDistributionMap: Record<string, number> = {};
    catItems.forEach(i => {
      if (i.category?.name) {
        const name = i.category.name;
        subCategoryDistributionMap[name] = (subCategoryDistributionMap[name] || 0) + 1;
      }
    });
    const subCategoryDistribution = Object.entries(subCategoryDistributionMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    const criticalOpenCount = incompleteItemsList.filter(i => i.riskLevel === 'Kritik').length;
    const highOpenCount = incompleteItemsList.filter(i => i.riskLevel === 'Yüksek').length;

    // Open/Closed Breakdown by Facility (when all) or Department (when single facility)
    const breakdownMap: Record<string, { name: string; open: number; closed: number; total: number }> = {};
    fullyFilteredItems.forEach((i) => {
      const groupName =
        facilityId === 'all'
          ? i.page.facility?.name || 'Bilinmeyen Tesis'
          : i.department?.name || 'Atanmamış Departman';
      if (!breakdownMap[groupName]) {
        breakdownMap[groupName] = { name: groupName, open: 0, closed: 0, total: 0 };
      }
      if (i.status === 'Tamamlandı') breakdownMap[groupName].closed++;
      else if (i.status !== 'İptal Edildi') breakdownMap[groupName].open++;
      breakdownMap[groupName].total++;
    });
    const openClosedBreakdown = Object.values(breakdownMap)
      .sort((a, b) => b.open - a.open || b.total - a.total)
      .slice(0, 10);

    // Open/Closed Breakdown by Risk Level
    const riskOrder = ['Kritik', 'Yüksek', 'Önemli', 'Olası', 'Önemsiz', 'Belirlenmedi'];
    const riskOpenClosedMap: Record<string, { name: string; open: number; closed: number; total: number }> = {};
    fullyFilteredItems.forEach((i) => {
      const rName = i.riskLevel || 'Belirlenmedi';
      if (!riskOpenClosedMap[rName]) {
        riskOpenClosedMap[rName] = { name: rName, open: 0, closed: 0, total: 0 };
      }
      if (i.status === 'Tamamlandı') riskOpenClosedMap[rName].closed++;
      else if (i.status !== 'İptal Edildi') riskOpenClosedMap[rName].open++;
      riskOpenClosedMap[rName].total++;
    });
    const openClosedByRisk = Object.values(riskOpenClosedMap).sort((a, b) => {
      const ia = riskOrder.indexOf(a.name);
      const ib = riskOrder.indexOf(b.name);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });

    // Fire and Emergency (Specific Alarm)
    const fireKeywords = ['yangın', 'acil'];
    const fireItems = fullyFilteredItems.filter(i => {
      const mainName = i.mainCategory?.name?.toLowerCase() || '';
      return fireKeywords.some(k => mainName.includes(k));
    });
    
    const fireTotal = fireItems.length;
    const fireOpen = fireItems.filter(i => i.status !== 'Tamamlandı' && i.status !== 'İptal Edildi').length;

    // Recent items for the table
    const recentItems = fullyFilteredItems
      .sort((a, b) => new Date(b.page.date).getTime() - new Date(a.page.date).getTime())
      .slice(0, 50);

    return {
      facilityName,
      totalItems,
      incompleteItems,
      closedItems,
      criticalOpenCount,
      highOpenCount,
      openPercentage: totalItems > 0 ? (closedItems / totalItems) * 100 : 0,
      openClosedBreakdown,
      openClosedByRisk,
      statusDistribution,
      riskDistribution,
      mainCategoryDistribution,
      subCategoryDistribution,
      fireAndEmergency: {
        total: fireTotal,
        open: fireOpen
      },
      recentItems
    };
  }
};
