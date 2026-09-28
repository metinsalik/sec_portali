import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function consolidateFireSafetyAudits() {
  try {
    console.log('[FireSafety] Mükerrer rapor konsolidasyonu başlatılıyor...');
    
    // Tüm denetimleri al
    const allAudits = await prisma.fireSafetyAudit.findMany({
      include: {
        items: {
          orderBy: { orderNo: 'asc' }
        }
      },
      orderBy: { auditDate: 'asc' }
    });

    const facilityGroups: Record<string, typeof allAudits> = {};
    for (const a of allAudits) {
      if (!facilityGroups[a.facilityId]) facilityGroups[a.facilityId] = [];
      facilityGroups[a.facilityId].push(a);
    }

    let mergedAuditsCount = 0;
    let mergedItemsCount = 0;

    for (const [facilityId, group] of Object.entries(facilityGroups)) {
      if (group.length > 1) {
        console.log(`[FireSafety] Tesis: ${facilityId} için ${group.length} adet rapor tespit edildi. Konsolide ediliyor...`);

        // En çok maddesi olanı ana (master) rapor olarak seç
        const sorted = [...group].sort((a, b) => (b.items?.length || 0) - (a.items?.length || 0));
        const master = sorted[0];
        let maxOrder = (master.items || []).reduce((max, it) => Math.max(max, it.orderNo || 0), 0);

        for (let i = 1; i < sorted.length; i++) {
          const duplicate = sorted[i];
          for (const item of duplicate.items || []) {
            maxOrder += 1;
            await prisma.fireSafetyItem.update({
              where: { id: item.id },
              data: {
                auditId: master.id,
                orderNo: maxOrder
              }
            });
            mergedItemsCount += 1;
          }

          // Mükerrer boşalan denetim başlığını sil
          await prisma.fireSafetyAudit.delete({
            where: { id: duplicate.id }
          });
          mergedAuditsCount += 1;
        }

        console.log(`[FireSafety] Tesis ${facilityId} için raporlar master ID (${master.id}) altında birleştirildi. Toplam madde: ${maxOrder}`);
      }
    }

    if (mergedAuditsCount > 0) {
      console.log(`[FireSafety] Konsolidasyon tamamlandı: ${mergedAuditsCount} mükerrer rapor silindi, ${mergedItemsCount} tespit maddesi ana raporlara aktarıldı.`);
    } else {
      console.log('[FireSafety] Mükerrer rapor bulunamadı, tüm tesis raporları zaten tekil ve güncel.');
    }
  } catch (error) {
    console.error('[FireSafety] Konsolidasyon hatası:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Doğrudan script olarak çalıştırıldığında (node veya ts-node ile)
if (require.main === module) {
  consolidateFireSafetyAudits().then(() => {
    process.exit(0);
  });
}
