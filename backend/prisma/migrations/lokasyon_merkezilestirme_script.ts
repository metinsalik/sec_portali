import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- LOKASYON MERKEZILESTIRME MIGRATION BASLIYOR ---');

  // 1. Temizlik Arabaları (HazmatVehicle) -> FacilityLocation
  console.log('1. HazmatVehicle (Temizlik Arabaları) tasiniyor...');
  const vehicles = await prisma.hazmatVehicle.findMany();
  for (const vehicle of vehicles) {
    const existing = await prisma.facilityLocation.findFirst({
      where: {
        facilityId: vehicle.facilityId,
        name: vehicle.name,
        type: 'TEMIZLIK_ARABASI'
      }
    });

    let newLocId;
    if (!existing) {
      const newLoc = await prisma.facilityLocation.create({
        data: {
          facilityId: vehicle.facilityId,
          name: vehicle.name,
          description: vehicle.description,
          type: 'TEMIZLIK_ARABASI',
          isActive: vehicle.isActive,
          createdAt: vehicle.createdAt,
          updatedAt: vehicle.updatedAt,
        }
      });
      newLocId = newLoc.id;
    } else {
      newLocId = existing.id;
    }

    // 2. HazmatInventoryItem guncellemesi (vehicleId -> locationId)
    await prisma.hazmatInventoryItem.updateMany({
      where: { vehicleId: vehicle.id },
      data: { 
        locationId: newLocId,
        vehicleId: null // Clear old vehicleId if nullable (requires dropping vehicleId later)
      }
    });
  }
  console.log('HazmatVehicle (Temizlik Arabaları) tasindi.');

  // 3. ExtraordinaryIncident -> Department (Int) yerine FacilityLocation
  console.log('3. ExtraordinaryIncident departmanlari tasiniyor...');
  const incidents = await prisma.extraordinaryIncident.findMany({
    include: { department: true }
  });

  for (const incident of incidents) {
    if (incident.locationId) continue; // Already migrated

    // Find or create FacilityLocation for this department
    const deptName = incident.department?.name || 'Bilinmeyen Departman';
    let loc = await prisma.facilityLocation.findFirst({
      where: {
        facilityId: incident.facilityId,
        name: deptName
      }
    });

    if (!loc) {
      loc = await prisma.facilityLocation.create({
        data: {
          facilityId: incident.facilityId,
          name: deptName,
          type: 'DEPARTMAN'
        }
      });
    }

    await prisma.extraordinaryIncident.update({
      where: { id: incident.id },
      data: { locationId: loc.id }
    });
  }
  console.log('ExtraordinaryIncident departmanlari tasindi.');

  // 4. Bina Turu Alanlari -> FacilityLocation (if requested to completely merge)
  // For now, mapping BTDenetlenenAlan if we need to. 
  // It's a bit more complex since BTDenetlenenAlan is global per facility.
  console.log('4. Bina Turu (BT) alanlari FacilityLocation ile eslestiriliyor...');
  const denetlenenAlanlar = await prisma.bTDenetlenenAlan.findMany();
  for (const alan of denetlenenAlanlar) {
    let loc = await prisma.facilityLocation.findFirst({
      where: {
        facilityId: alan.facilityId,
        name: alan.ad,
        type: 'BINA_TURU_ALANI'
      }
    });

    if (!loc) {
      loc = await prisma.facilityLocation.create({
        data: {
          facilityId: alan.facilityId,
          name: alan.ad,
          type: 'BINA_TURU_ALANI'
        }
      });
    }
    
    // Update BTSoruBankasi with locationId
    await prisma.bTSoruBankasi.updateMany({
      where: { denetlenenAlanId: alan.id },
      data: { locationId: loc.id }
    });
  }

  // Same for BTUygunsuzluk -> BTSorumluBirim
  const uygunsuzluklar = await prisma.bTUygunsuzluk.findMany({
    include: { sorumluBirimler: true }
  });
  
  for (const u of uygunsuzluklar) {
    if (u.locationId || !u.sorumluBirimler.length) continue;
    
    // Just pick the first unit for simplicity or create a merged location
    const unitName = u.sorumluBirimler[0].ad;
    let loc = await prisma.facilityLocation.findFirst({
      where: {
        facilityId: u.facilityId,
        name: unitName
      }
    });

    if (!loc) {
      loc = await prisma.facilityLocation.create({
        data: {
          facilityId: u.facilityId,
          name: unitName,
          type: 'BIRIM'
        }
      });
    }

    await prisma.bTUygunsuzluk.update({
      where: { id: u.id },
      data: { locationId: loc.id }
    });
  }
  console.log('Bina Turu verileri FacilityLocation e tasindi.');

  console.log('--- LOKASYON MERKEZILESTIRME MIGRATION TAMAMLANDI ---');
  console.log('SIMDI SCHEMA DOSYASINDAN ESKI TABLOLARI SILIP PRISMA DB PUSH YAPABILIRSINIZ.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
