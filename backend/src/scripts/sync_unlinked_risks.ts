import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function syncUnlinkedRisks() {
  try {
    const unlinkedCount = await prisma.riskLifecycle.count({
      where: { locationId: null }
    });

    if (unlinkedCount === 0) {
      return;
    }

    console.log(`[Risks] ${unlinkedCount} adet bağlantısız risk kaydı tespit edildi. Akıllı lokasyon kurtarma başlatılıyor...`);

    // ── ADIM 1: LIV-VADI için temel lokasyonları garantiye al ──
    const targetLocations = [
      {
        department: 'Radyoloji',
        name: 'Ana Bina - Zemin Kat - Radyoloji',
        building: 'Ana Bina',
        floor: 'Zemin Kat',
        description: 'Radyoloji ve Görüntüleme',
      },
      {
        department: 'FAZ-1 Klinik Araştırmalar Merkezi',
        name: 'Ana Bina - 1. Kat - FAZ-1 Klinik Araştırmalar Merkezi',
        building: 'Ana Bina',
        floor: '1. Kat',
        description: 'FAZ-1 Klinik Araştırmalar Merkezi',
      },
      {
        department: 'Acil Servis',
        name: 'Ana Bina - Zemin Kat - Acil Servis',
        building: 'Ana Bina',
        floor: 'Zemin Kat',
        description: 'Acil Servis',
      },
      {
        department: 'İş Güvenliği Uzmanları',
        name: 'Ana Bina - Yönetim Katı - İş Güvenliği Uzmanları',
        building: 'Ana Bina',
        floor: 'Yönetim Katı',
        description: 'İSG Birimi',
      },
      {
        department: 'İdari Ofisler',
        name: 'İdari Ofisler',
        building: 'Ana Bina',
        floor: 'Genel',
        description: 'İdari Birimler',
      },
    ];

    const locMap: Record<string, string> = {};

    for (const loc of targetLocations) {
      let existing = await prisma.facilityLocation.findFirst({
        where: {
          facilityId: 'LIV-VADI',
          department: loc.department,
        }
      });

      if (!existing) {
        existing = await prisma.facilityLocation.create({
          data: {
            facilityId: 'LIV-VADI',
            name: loc.name,
            building: loc.building,
            floor: loc.floor,
            department: loc.department,
            description: loc.description,
            type: 'DEPARTMAN',
            isActive: true,
          }
        });
      }
      locMap[loc.department] = existing.id;
    }

    // ── ADIM 2: Belirli anahtar kelimelere göre Vadi lokasyonlarına eşle ──
    if (locMap['FAZ-1 Klinik Araştırmalar Merkezi']) {
      await prisma.riskLifecycle.updateMany({
        where: {
          locationId: null,
          area: { contains: 'FAZ-1' }
        },
        data: {
          locationId: locMap['FAZ-1 Klinik Araştırmalar Merkezi'],
          area: 'FAZ-1 Klinik Araştırmalar Merkezi'
        }
      });
    }

    if (locMap['Radyoloji']) {
      await prisma.riskLifecycle.updateMany({
        where: {
          locationId: null,
          area: { in: ['Radyoloji', 'MR'] }
        },
        data: {
          locationId: locMap['Radyoloji']
        }
      });
    }

    if (locMap['Acil Servis']) {
      await prisma.riskLifecycle.updateMany({
        where: {
          locationId: null,
          area: { contains: 'Acil' }
        },
        data: {
          locationId: locMap['Acil Servis']
        }
      });
    }

    if (locMap['İş Güvenliği Uzmanları']) {
      await prisma.riskLifecycle.updateMany({
        where: {
          locationId: null,
          area: { in: ['İş Güvenliği Uzmanları', 'İSG', 'İş Sağlığı ve Güvenliği'] }
        },
        data: {
          locationId: locMap['İş Güvenliği Uzmanları']
        }
      });
    }

    // ── ADIM 3: Geriye kalan tüm bağlantısız riskleri kendi alanına göre LIV-VADI lokasyonlarına bağla ──
    const unlinkedAreas = await prisma.riskLifecycle.findMany({
      where: { locationId: null },
      select: { area: true },
      distinct: ['area']
    });

    for (const item of unlinkedAreas) {
      const areaName = item.area?.trim();
      if (!areaName) continue;

      // 1. Vadi'de bu departman var mı?
      let existingLoc = await prisma.facilityLocation.findFirst({
        where: {
          facilityId: 'LIV-VADI',
          OR: [
            { department: areaName },
            { name: areaName },
            { name: `Ana Bina - Genel - ${areaName}` }
          ]
        }
      });

      // 2. Yoksa oluştur
      if (!existingLoc) {
        existingLoc = await prisma.facilityLocation.create({
          data: {
            facilityId: 'LIV-VADI',
            name: `Ana Bina - Genel - ${areaName}`,
            building: 'Ana Bina',
            floor: 'Genel',
            department: areaName,
            type: 'DEPARTMAN',
            isActive: true
          }
        });
      }

      // 3. Eşle
      await prisma.riskLifecycle.updateMany({
        where: {
          locationId: null,
          area: item.area
        },
        data: {
          locationId: existingLoc.id
        }
      });
    }

    const finalRemaining = await prisma.riskLifecycle.count({ where: { locationId: null } });
    console.log(`[Risks] Risk senkronizasyonu tamamlandı. Kalan bağlantısız: ${finalRemaining}`);
  } catch (err: any) {
    console.error('[Risks] Otomatik risk lokasyon eşleme hatası:', err.message);
  }
}
