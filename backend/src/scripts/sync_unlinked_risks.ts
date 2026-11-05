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

    console.log(`[Risks] ${unlinkedCount} adet bağlantısız risk kaydı tespit edildi. Kapsamlı lokasyon kurtarma ve eşleme başlatılıyor...`);

    // ── ADIM 1: Eski RiskDepartment ve departmentId üzerinden çoklu tesis aktarımı ──
    try {
      const checkCol: any = await prisma.$queryRawUnsafe(`
        SELECT column_name FROM information_schema.columns 
        WHERE lower(table_name) = 'risklifecycle' AND lower(column_name) = 'departmentid';
      `);
      const hasDepartmentIdCol = checkCol && checkCol.length > 0;

      if (hasDepartmentIdCol) {
        // 1a. RiskDepartment tablosu var mı?
        const checkTable: any = await prisma.$queryRawUnsafe(`
          SELECT to_regclass('public."RiskDepartment"') as tbl;
        `);
        const hasRiskDepartment = checkTable && checkTable[0] && checkTable[0].tbl !== null;

        if (hasRiskDepartment) {
          console.log('[Risks] Eski RiskDepartment tablosundan tesis ve departmanlar taranıyor...');
          const oldDepts: any = await prisma.$queryRawUnsafe(`
            SELECT id, "facilityId", name FROM "RiskDepartment";
          `);

          for (const d of oldDepts) {
            if (!d.facilityId || !d.name) continue;

            const fac = await prisma.facility.findUnique({ where: { id: d.facilityId } });
            if (!fac) continue;

            let loc = await prisma.facilityLocation.findFirst({
              where: {
                facilityId: d.facilityId,
                department: d.name,
              }
            });

            if (!loc) {
              loc = await prisma.facilityLocation.create({
                data: {
                  facilityId: d.facilityId,
                  name: `Ana Bina - Genel - ${d.name}`,
                  building: 'Ana Bina',
                  floor: 'Genel',
                  department: d.name,
                  type: 'DEPARTMAN',
                  isActive: true
                }
              });
            }

            const updated: any = await prisma.$executeRawUnsafe(`
              UPDATE "RiskLifecycle"
              SET "locationId" = '${loc.id}'
              WHERE "departmentId" = ${d.id} AND "locationId" IS NULL;
            `);

            if (updated > 0) {
              console.log(`[Risks] RiskDepartment: ${d.facilityId} - ${d.name} -> ${updated} adet risk bağlandı.`);
            }
          }
        }

        // 1b. RiskDepartmentSetting tablosu var mı?
        const checkSettingTable: any = await prisma.$queryRawUnsafe(`
          SELECT to_regclass('public."RiskDepartmentSetting"') as tbl;
        `);
        const hasSettingTable = checkSettingTable && checkSettingTable[0] && checkSettingTable[0].tbl !== null;

        if (hasSettingTable) {
          console.log('[Risks] RiskDepartmentSetting tablosu kontrol ediliyor...');
          const oldSettingDepts: any = await prisma.$queryRawUnsafe(`
            SELECT id, "facilityId", name FROM "RiskDepartmentSetting";
          `);

          for (const d of oldSettingDepts) {
            if (!d.facilityId || !d.name) continue;

            const fac = await prisma.facility.findUnique({ where: { id: d.facilityId } });
            if (!fac) continue;

            let loc = await prisma.facilityLocation.findFirst({
              where: {
                facilityId: d.facilityId,
                department: d.name,
              }
            });

            if (!loc) {
              loc = await prisma.facilityLocation.create({
                data: {
                  facilityId: d.facilityId,
                  name: `Ana Bina - Genel - ${d.name}`,
                  building: 'Ana Bina',
                  floor: 'Genel',
                  department: d.name,
                  type: 'DEPARTMAN',
                  isActive: true
                }
              });
            }

            const updated: any = await prisma.$executeRawUnsafe(`
              UPDATE "RiskLifecycle"
              SET "locationId" = '${loc.id}'
              WHERE "departmentId" = ${d.id} AND "locationId" IS NULL;
            `);

            if (updated > 0) {
              console.log(`[Risks] RiskDepartmentSetting: ${d.facilityId} - ${d.name} -> ${updated} adet risk bağlandı.`);
            }
          }
        }
      }
    } catch (oldErr: any) {
      console.warn('[Risks] Eski RiskDepartment kontrolü:', oldErr.message);
    }

    // ── ADIM 2: LIV-VADI'ye ait belirgin alanlar (Radyoloji, FAZ-1, Acil Servis, İSG vb.) ──
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

    // ── ADIM 3: Halen bağlantısız kalan riskler için Genel / Tanımlanmamış Lokasyon Kurtarma ──
    const stillUnlinked = await prisma.riskLifecycle.findMany({
      where: { locationId: null },
      select: { id: true, createdBy: true, area: true }
    });

    if (stillUnlinked.length > 0) {
      console.log(`[Risks] Halen bağlantısız ${stillUnlinked.length} kayıt için kullanıcı/varsayılan tesis eşlemesi yapılıyor...`);

      // Tesis ve lokasyon önbelleği
      const defaultLocCache: Record<string, string> = {};

      for (const r of stillUnlinked) {
        let targetFacilityId = 'LIV-VADI'; // Varsayılan

        // createdBy kullanıcısının tesisini bulmaya çalış
        if (r.createdBy) {
          const userFacility = await prisma.userFacility.findFirst({
            where: { username: r.createdBy },
            select: { facilityId: true }
          });
          if (userFacility?.facilityId) {
            targetFacilityId = userFacility.facilityId;
          }
        }

        if (!defaultLocCache[targetFacilityId]) {
          let fallbackLoc = await prisma.facilityLocation.findFirst({
            where: {
              facilityId: targetFacilityId,
              name: { contains: 'Genel / Aktarılan Eski Riskler' }
            }
          });

          if (!fallbackLoc) {
            fallbackLoc = await prisma.facilityLocation.create({
              data: {
                facilityId: targetFacilityId,
                name: 'Ana Bina - Genel - Aktarılan Eski Riskler',
                building: 'Ana Bina',
                floor: 'Genel',
                department: r.area || 'Genel Departman',
                type: 'DEPARTMAN',
                isActive: true,
                description: 'Lokasyon modernizasyonu sırasında otomatik bağlanan kayıtlar'
              }
            });
          }
          defaultLocCache[targetFacilityId] = fallbackLoc.id;
        }

        await prisma.riskLifecycle.update({
          where: { id: r.id },
          data: { locationId: defaultLocCache[targetFacilityId] }
        });
      }
    }

    const finalRemaining = await prisma.riskLifecycle.count({ where: { locationId: null } });
    console.log(`[Risks] Risk senkronizasyonu tamamlandı. Kalan bağlantısız: ${finalRemaining}`);
  } catch (err: any) {
    console.error('[Risks] Otomatik risk lokasyon eşleme hatası:', err.message);
  }
}
