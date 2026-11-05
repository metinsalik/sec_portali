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

    console.log(`[Risks] ${unlinkedCount} adet bağlantısız risk kaydı tespit edildi, LIV-VADI lokasyonlarına bağlanıyor...`);

    // 1. LIV-VADI lokasyonlarını garantiye al
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

    // 2. Risk kayıtlarını eşle
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

    if (locMap['Acil Servis']) {
      await prisma.riskLifecycle.updateMany({
        where: {
          locationId: null,
          area: 'Acil Servis'
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
          area: 'İş Güvenliği Uzmanları'
        },
        data: {
          locationId: locMap['İş Güvenliği Uzmanları']
        }
      });
    }

    // Eğer halen herhangi bir sebeple boşta kalan kayıt varsa varsayılan olarak Radyolojiye ata
    const remaining = await prisma.riskLifecycle.count({ where: { locationId: null } });
    if (remaining > 0 && locMap['Radyoloji']) {
      await prisma.riskLifecycle.updateMany({
        where: { locationId: null },
        data: { locationId: locMap['Radyoloji'] }
      });
    }

    console.log(`[Risks] LIV-VADI risk kayıtları başarıyla bağlandı. Kalan bağlantısız: 0`);
  } catch (err: any) {
    console.error('[Risks] Otomatik risk lokasyon eşleme hatası:', err.message);
  }
}
