import { PrismaClient } from '@prisma/client';
import * as xlsx from 'xlsx';

const prisma = new PrismaClient();

export const isgDefterService = {
  // === SETTINGS ===
  getSettings: async (facilityId: string) => {
    let settings = null;
    if (facilityId !== 'all') {
      settings = await prisma.isgDefterSetting.findUnique({ where: { facilityId } });
    }
    
    // Always fetch global settings for risk levels
    const globalSettings = await prisma.isgDefterSetting.findUnique({ where: { facilityId: 'all' } });

    // Use global risk levels if available, else local, else empty array
    const rawRiskLevels = globalSettings?.riskLevels || settings?.riskLevels;
    const parsedRiskLevels = rawRiskLevels ? JSON.parse(rawRiskLevels) : [];

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
    return prisma.notebookPage.findMany({
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
            comments: {
              orderBy: { createdAt: 'asc' }
            }
          }
        }
      },
      orderBy: { date: 'desc' }
    });
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
    const action = await prisma.notebookItemAction.create({ data });
    await prisma.notebookItem.update({
      where: { id: data.notebookItemId },
      data: { status: data.status }
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
    const { year, month, mainCategoryId, categoryId, subCategoryId, riskLevel, status, mainCategory, category } = filters;
    
    // Base filter applied to notebook items
    const baseWhere: any = {
      page: {
        ...(facilityId && facilityId !== 'all' && { facilityId }),
        ...(year && year !== 'all' && { year: parseInt(year) }),
      },
      ...(mainCategoryId && { mainCategoryId: parseInt(mainCategoryId) }),
      ...(categoryId && { categoryId: parseInt(categoryId) }),
      ...(subCategoryId && { subCategoryId: parseInt(subCategoryId) }),
      ...(riskLevel && riskLevel !== 'all' && { riskLevel }),
      ...(status && status !== 'all' && status !== 'Tamamlanmamış' && { status }),
    };

    const items = await prisma.notebookItem.findMany({
      where: baseWhere,
      include: {
        page: {
          include: {
            facility: true
          }
        },
        category: true,
        mainCategory: true,
      }
    });

    let filteredItems = items;
    if (month && month !== 'all') {
      const monthInt = parseInt(month);
      filteredItems = filteredItems.filter(item => item.page.date.getMonth() === monthInt);
    }
    if (status === 'Tamamlanmamış') {
      filteredItems = filteredItems.filter(item => item.status !== 'Tamamlandı' && item.status !== 'İptal Edildi');
    }
    if (mainCategory && mainCategory !== 'all') {
      filteredItems = filteredItems.filter(item => item.mainCategory?.name === mainCategory);
    }
    if (category && category !== 'all') {
      filteredItems = filteredItems.filter(item => item.category?.name === category);
    }

    const facilityName = facilityId === 'all' 
      ? 'Tüm Tesisler' 
      : (items.length > 0 ? items[0].page.facility?.name : (await prisma.facility.findUnique({ where: { id: facilityId } }))?.name || 'Bilinmeyen Tesis');

    const totalItems = filteredItems.length;
    const incompleteItemsList = filteredItems.filter(i => i.status !== 'Tamamlandı' && i.status !== 'İptal Edildi');
    const closedItemsList = filteredItems.filter(i => i.status === 'Tamamlandı');
    
    const incompleteItems = incompleteItemsList.length;
    const closedItems = closedItemsList.length;
    
    const now = new Date();
    
    // Status Distribution
    const statusDistributionMap: Record<string, number> = {};
    filteredItems.forEach(i => {
      statusDistributionMap[i.status] = (statusDistributionMap[i.status] || 0) + 1;
    });
    const statusDistribution = Object.entries(statusDistributionMap).map(([name, value]) => ({ name, value }));

    // Risk Distribution
    const riskDistributionMap: Record<string, number> = {};
    filteredItems.forEach(i => {
      riskDistributionMap[i.riskLevel] = (riskDistributionMap[i.riskLevel] || 0) + 1;
    });
    const riskDistribution = Object.entries(riskDistributionMap).map(([name, value]) => ({ name, value }));

    // Category Distribution (Split into Main and Sub)
    const mainCategoryDistributionMap: Record<string, number> = {};
    const subCategoryDistributionMap: Record<string, number> = {};
    filteredItems.forEach(i => {
      const mainName = i.mainCategory?.name || 'Diğer';
      mainCategoryDistributionMap[mainName] = (mainCategoryDistributionMap[mainName] || 0) + 1;
      
      if (i.category?.name) {
        const subName = i.category.name;
        subCategoryDistributionMap[subName] = (subCategoryDistributionMap[subName] || 0) + 1;
      }
    });
    
    const mainCategoryDistribution = Object.entries(mainCategoryDistributionMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
      
    const subCategoryDistribution = Object.entries(subCategoryDistributionMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // Incomplete Item Age (Days since creation)
    let age0_30 = 0, age31_60 = 0, age61_90 = 0, age91_180 = 0, age180plus = 0;
    incompleteItemsList.forEach(i => {
      const diffTime = Math.abs(now.getTime() - new Date(i.createdAt).getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays <= 30) age0_30++;
      else if (diffDays <= 60) age31_60++;
      else if (diffDays <= 90) age61_90++;
      else if (diffDays <= 180) age91_180++;
      else age180plus++;
    });
    
    const incompleteJobAge = [
      { name: '0-30 Gün', value: age0_30, color: 'bg-blue-100 text-blue-600' },
      { name: '31-60 Gün', value: age31_60, color: 'bg-blue-200 text-blue-700' },
      { name: '61-90 Gün', value: age61_90, color: 'bg-blue-300 text-blue-800' },
      { name: '91-180 Gün', value: age91_180, color: 'bg-blue-600 text-white' },
      { name: '180+ Gün', value: age180plus, color: 'bg-red-500 text-white' }
    ];

    // Monthly Flow (Last 12 months)
    const monthlyFlowMap: Record<string, { month: string, index: number, open: number, closed: number }> = {};
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mKey = `${d.getFullYear()}-${d.getMonth()}`;
      monthlyFlowMap[mKey] = {
        month: d.toLocaleString('tr-TR', { month: 'short' }),
        index: i,
        open: 0,
        closed: 0
      };
    }
    
    filteredItems.forEach(i => {
      const d = new Date(i.page.date); // Using page date for flow
      const mKey = `${d.getFullYear()}-${d.getMonth()}`;
      if (monthlyFlowMap[mKey]) {
        if (i.status === 'Tamamlandı') monthlyFlowMap[mKey].closed++;
        else monthlyFlowMap[mKey].open++;
      }
    });
    
    const monthlyFlow = Object.values(monthlyFlowMap)
      .sort((a, b) => b.index - a.index) // Sort by chronological order
      .map(m => ({ month: m.month, open: m.open, closed: m.closed }));

    // Fire and Emergency (Specific Alarm)
    const fireKeywords = ['yangın', 'acil'];
    const fireItems = filteredItems.filter(i => {
      const mainName = i.mainCategory?.name?.toLowerCase() || '';
      return fireKeywords.some(k => mainName.includes(k));
    });
    
    const fireTotal = fireItems.length;
    const fireOpen = fireItems.filter(i => i.status !== 'Tamamlandı' && i.status !== 'İptal Edildi').length;

    // Finally, the recent items for the table (limited to 50 for performance)
    const recentItems = filteredItems
      .sort((a, b) => new Date(b.page.date).getTime() - new Date(a.page.date).getTime())
      .slice(0, 50);

    return {
      facilityName,
      totalItems,
      incompleteItems,
      closedItems,
      openPercentage: totalItems > 0 ? (closedItems / totalItems) * 100 : 0,
      monthlyFlow,
      statusDistribution,
      riskDistribution,
      mainCategoryDistribution,
      subCategoryDistribution,
      incompleteJobAge,
      fireAndEmergency: {
        total: fireTotal,
        open: fireOpen
      },
      recentItems
    };
  }
};
