import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function cleanupEmptyThermalItems() {
  try {
    console.log('[Thermal] Boş/anlamsız termal ölçüm satırları kontrol ediliyor...');

    const items = await prisma.thermalInspectionItem.findMany({
      select: {
        id: true,
        panelName: true,
        measuredTemp: true,
        ambientTemp: true,
        measurementPoint: true,
        equipmentConnection: true,
        detectedRisk: true,
        actionTaken: true,
        actionPlan: true,
        photoUrls: true,
      }
    });

    const idsToDelete: string[] = [];

    for (const it of items) {
      const hasTemp = it.measuredTemp !== null && it.measuredTemp !== undefined;
      const hasAmb = it.ambientTemp !== null && it.ambientTemp !== undefined;
      const hasPoint = it.measurementPoint && it.measurementPoint.trim() !== '';
      const hasRisk = it.detectedRisk && it.detectedRisk.trim() !== '';
      const hasAction = it.actionTaken && it.actionTaken.trim() !== '';
      const hasEquip = it.equipmentConnection && it.equipmentConnection.trim() !== '';
      const hasPlan = it.actionPlan && it.actionPlan.trim() !== '';
      let photos: any[] = [];
      try {
        photos = typeof it.photoUrls === 'string' ? JSON.parse(it.photoUrls) : (it.photoUrls || []);
      } catch (e) {}
      const hasPhotos = Array.isArray(photos) && photos.length > 0;

      // An item is completely empty/meaningless if it has no measurement, no point, no finding, no equipment, no plan, no photos
      if (!hasTemp && !hasAmb && !hasPoint && !hasRisk && !hasAction && !hasEquip && !hasPlan && !hasPhotos) {
        idsToDelete.push(it.id);
      }
    }

    if (idsToDelete.length > 0) {
      const result = await prisma.thermalInspectionItem.deleteMany({
        where: { id: { in: idsToDelete } }
      });
      console.log(`[Thermal] Otomatik temizlik tamamlandı. Toplam ${result.count} adet boş/anlamsız satır silindi.`);
    } else {
      console.log('[Thermal] Temizlenecek boş satır bulunamadı, veriler temiz.');
    }
  } catch (error) {
    console.error('[Thermal] Otomatik temizlik sırasında hata oluştu:', error);
  }
}
