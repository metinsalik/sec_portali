import type { IsometricBuildingData, IsometricFloor, IsometricRoom, RiskDistribution, StatusType } from './types';
import { parseFloorRank } from '@/utils/locationHierarchy';

export const MOCK_ISOMETRIC_BUILDING: IsometricBuildingData = {
  id: 'bld-florya-main',
  name: 'Ana Hastane Binası (A Blok)',
  totalRisks: 12,
  safetyScore: 72,
  riskDistribution: {
    tolereGosterilmez: 1,
    yuksek: 3,
    onemli: 4,
    olasi: 2,
    onemsiz: 6,
  },
  floors: [
    {
      id: 'floor-13',
      floorNumber: 13,
      name: '13. Kat (Teknik & Pano)',
      gridSize: 3,
      status: 'critical',
      riskCount: 4,
      safetyScore: 48,
      hasCriticalFault: true,
      criticalFaultText: 'Ana Pano Odasında Aşırı Yük & Bara Sıcaklık Arızası!',
      riskDistribution: {
        tolereGosterilmez: 1,
        yuksek: 2,
        onemli: 1,
        olasi: 0,
        onemsiz: 2,
      },
      rooms: [
        {
          id: 'room-13-pano',
          name: '13. Kat Ana Pano Odası',
          code: 'PNO-13A',
          gridX: 0,
          gridY: 0,
          height: 38,
          type: 'electrical',
          status: 'critical',
          openRiskCount: 3,
          safetyScore: 35,
          description: 'Ana dikey kolon dağıtım panosu, faz baraları ve akım trafoları.',
          riskDistribution: {
            tolereGosterilmez: 1,
            yuksek: 2,
            onemli: 0,
            olasi: 0,
            onemsiz: 0,
          },
          activeHazards: [
            {
              id: 'hz-1301',
              riskNo: 'RSK-1301',
              hazard: 'Bara Faz Dengesizliği ve Aşırı Isınma',
              level: 'Tolere Gösterilmez Risk',
              status: 'ACIK_TEHLIKE',
              responsible: 'Elektrik Teknik Şefliği',
              action: 'Yük dağıtımı acil dengelenmeli, termal kamera ile bağlantı klemensleri sıkılmalıdır.'
            },
            {
              id: 'hz-1302',
              riskNo: 'RSK-1302',
              hazard: 'Ana Şalter Termik Açma ve Yangın Tehlikesi',
              level: 'Yüksek Risk',
              status: 'ACIK_TEHLIKE',
              responsible: 'Teknik Hizmetler Müdürü',
              action: 'Kapasite aşımı engellenmeli, yedek linyeler devreye alınmalıdır.'
            },
            {
              id: 'hz-1303',
              riskNo: 'RSK-1303',
              hazard: 'Pano İçi Otomatik Gazlı Söndürme Nozül Engeli',
              level: 'Yüksek Risk',
              status: 'TAKIP_SURECINDE',
              responsible: 'İSG Uzmanı',
              action: 'FM200 nozülü önündeki kablo tavası revize edilmelidir.'
            }
          ],
          telemetry: {
            voltageL1: 238,
            voltageL2: 241,
            voltageL3: 185, // Dengesiz faz
            temperature: 78.4, // Kritik sıcaklık (>65°C)
            loadPercentage: 118, // Kapasite aşımı
            currentAmps: 345,
            lastMaintenance: '12.08.2026',
            activeAlarm: 'Aşırı Yük & Faz Dengesizliği (Bara Sıcaklığı 78.4°C Kritik Seviyede!)',
            isSimulatedResolved: false,
          }
        },
        {
          id: 'room-13-ups',
          name: 'Statik UPS & Akü Odası',
          code: 'UPS-13',
          gridX: 1,
          gridY: 0,
          height: 32,
          type: 'ups',
          status: 'warning',
          openRiskCount: 1,
          safetyScore: 76,
          description: '2x 160 kVA kesintisiz güç kaynağı ve kuru tip akü grupları.',
          riskDistribution: {
            tolereGosterilmez: 0,
            yuksek: 0,
            onemli: 1,
            olasi: 1,
            onemsiz: 1,
          },
          activeHazards: [
            {
              id: 'hz-1304',
              riskNo: 'RSK-1304',
              hazard: 'Akü Odası Hidrojen Gaz Tahliye Fanı Periyodik Bakımı',
              level: 'Önemli Risk',
              status: 'ILK_MUDAHALE_EDILDI',
              responsible: 'Biyomedikal / Elektrik Ekibi',
              action: 'Ex-proof fan motor rulman değişimi planlandı.'
            }
          ],
          telemetry: {
            voltageL1: 230,
            voltageL2: 229,
            voltageL3: 231,
            temperature: 31.2,
            loadPercentage: 82,
            currentAmps: 198,
            lastMaintenance: '24.09.2026',
            activeAlarm: 'Yedek Akü Sıcaklık Uyarısı (31.2°C)',
            isSimulatedResolved: false,
          }
        },
        {
          id: 'room-13-elevator',
          name: 'Asansör Makine Dairesi',
          code: 'ASN-13',
          gridX: 2,
          gridY: 0,
          height: 40,
          type: 'elevator',
          status: 'normal',
          openRiskCount: 0,
          safetyScore: 94,
          description: 'Yolcu ve acil sedye asansörleri çekme motorları ve hız regülatörleri.',
          riskDistribution: { tolereGosterilmez: 0, yuksek: 0, onemli: 0, olasi: 0, onemsiz: 2 },
          telemetry: {
            voltageL1: 400,
            voltageL2: 398,
            voltageL3: 401,
            temperature: 24.5,
            loadPercentage: 45,
            currentAmps: 64,
            lastMaintenance: '02.10.2026',
            isSimulatedResolved: false,
          }
        },
        {
          id: 'room-13-air',
          name: 'Klima Santrali (AHU-13)',
          code: 'AHU-13',
          gridX: 0,
          gridY: 1,
          height: 30,
          type: 'mechanical',
          status: 'normal',
          openRiskCount: 0,
          safetyScore: 92,
          description: '13. kat pozitif basınçlı hijyenik havalandırma ünitesi.',
          riskDistribution: { tolereGosterilmez: 0, yuksek: 0, onemli: 0, olasi: 1, onemsiz: 1 },
        },
        {
          id: 'room-13-storage',
          name: 'Tesisat & Yangın Şaftı',
          code: 'ŞFT-13',
          gridX: 1,
          gridY: 1,
          height: 26,
          type: 'storage',
          status: 'normal',
          openRiskCount: 0,
          safetyScore: 96,
          description: 'Sprinkler zon kontrol vanaları ve yangın duman damperleri.',
          riskDistribution: { tolereGosterilmez: 0, yuksek: 0, onemli: 0, olasi: 0, onemsiz: 1 },
        },
        {
          id: 'room-13-it',
          name: 'Zayıf Akım & IT Şaftı',
          code: 'IT-13',
          gridX: 2,
          gridY: 1,
          height: 28,
          type: 'office',
          status: 'normal',
          openRiskCount: 0,
          safetyScore: 98,
          description: 'Kat dağıtım kabinleri (Patch panel & Fiber sonlandırma kabini).',
          riskDistribution: { tolereGosterilmez: 0, yuksek: 0, onemli: 0, olasi: 0, onemsiz: 2 },
        }
      ]
    },
    {
      id: 'floor-12',
      floorNumber: 12,
      name: '12. Kat (Ameliyathane & Yoğun Bakım)',
      gridSize: 3,
      status: 'normal',
      riskCount: 1,
      safetyScore: 88,
      riskDistribution: { tolereGosterilmez: 0, yuksek: 0, onemli: 1, olasi: 1, onemsiz: 3 },
      rooms: [
        { id: 'room-12-1', name: 'Ameliyathane Salonu 1', code: 'AML-01', gridX: 0, gridY: 0, height: 32, type: 'medical', status: 'normal', openRiskCount: 0, safetyScore: 95 },
        { id: 'room-12-2', name: 'Ameliyathane Salonu 2', code: 'AML-02', gridX: 1, gridY: 0, height: 32, type: 'medical', status: 'normal', openRiskCount: 0, safetyScore: 95 },
        { id: 'room-12-3', name: 'Cerrahi Yoğun Bakım', code: 'CYB-12', gridX: 2, gridY: 0, height: 30, type: 'medical', status: 'normal', openRiskCount: 0, safetyScore: 90 },
        { id: 'room-12-4', name: 'Medikal Gaz Santrali', code: 'MED-12', gridX: 0, gridY: 1, height: 28, type: 'mechanical', status: 'warning', openRiskCount: 1, safetyScore: 78,
          description: 'O2 ve Vakum regülatör manometresi kalibrasyon kontrolü.',
          riskDistribution: { tolereGosterilmez: 0, yuksek: 0, onemli: 1, olasi: 0, onemsiz: 0 }
        },
        { id: 'room-12-5', name: 'Sterilizasyon Birimi', code: 'STR-12', gridX: 1, gridY: 1, height: 26, type: 'medical', status: 'normal', openRiskCount: 0, safetyScore: 92 },
        { id: 'room-12-6', name: 'Kat Dağıtım Panosu', code: 'PNO-12', gridX: 2, gridY: 1, height: 32, type: 'electrical', status: 'normal', openRiskCount: 0, safetyScore: 94 }
      ]
    },
    {
      id: 'floor-8',
      floorNumber: 8,
      name: '8. Kat (Yataklı Servis)',
      gridSize: 3,
      status: 'warning',
      riskCount: 3,
      safetyScore: 74,
      riskDistribution: { tolereGosterilmez: 0, yuksek: 1, onemli: 1, olasi: 1, onemsiz: 2 },
      rooms: [
        { id: 'room-8-1', name: 'Hasta Odaları (801-815)', code: 'HST-801', gridX: 0, gridY: 0, height: 28, type: 'medical', status: 'normal', openRiskCount: 0, safetyScore: 90 },
        { id: 'room-8-2', name: 'Hemşire İstasyonu', code: 'HMS-08', gridX: 1, gridY: 0, height: 24, type: 'office', status: 'normal', openRiskCount: 0, safetyScore: 92 },
        { id: 'room-8-3', name: 'Kat Elektrik Panosu', code: 'PNO-08', gridX: 2, gridY: 0, height: 32, type: 'electrical', status: 'warning', openRiskCount: 2, safetyScore: 68,
          description: 'Termal kamera muayenesinde Nötr klemensinde ısınma görüldü.',
          riskDistribution: { tolereGosterilmez: 0, yuksek: 1, onemli: 1, olasi: 0, onemsiz: 0 },
          activeHazards: [
            {
              id: 'hz-801',
              riskNo: 'RSK-801',
              hazard: 'Nötr Bara Klemens Gevşekliği ve Ark Riski',
              level: 'Yüksek Risk',
              status: 'ACIK_TEHLIKE',
              responsible: 'Bakım Teknikeri'
            }
          ],
          telemetry: {
            voltageL1: 228,
            voltageL2: 231,
            voltageL3: 229,
            temperature: 58.2,
            loadPercentage: 88,
            currentAmps: 140,
            lastMaintenance: '05.07.2026',
            activeAlarm: 'Faz Klemens Isınması (58.2°C)',
            isSimulatedResolved: false,
          }
        },
        { id: 'room-8-4', name: 'İlaç Hazırlama Odası', code: 'ILC-08', gridX: 0, gridY: 1, height: 26, type: 'medical', status: 'normal', openRiskCount: 0, safetyScore: 94 },
        { id: 'room-8-5', name: 'Kat Temizlik Deposu', code: 'DEP-08', gridX: 1, gridY: 1, height: 22, type: 'storage', status: 'normal', openRiskCount: 1, safetyScore: 82 }
      ]
    },
    {
      id: 'floor-0',
      floorNumber: 0,
      name: 'Zemin Kat (Acil & Giriş)',
      gridSize: 3,
      status: 'normal',
      riskCount: 1,
      safetyScore: 91,
      riskDistribution: { tolereGosterilmez: 0, yuksek: 0, onemli: 0, olasi: 1, onemsiz: 4 },
      rooms: [
        { id: 'room-0-1', name: 'Kırmızı Alan (Resüsitasyon)', code: 'RES-01', gridX: 0, gridY: 0, height: 30, type: 'medical', status: 'normal', openRiskCount: 0, safetyScore: 96 },
        { id: 'room-0-2', name: 'Triyaj & Danışma', code: 'TRY-01', gridX: 1, gridY: 0, height: 24, type: 'office', status: 'normal', openRiskCount: 0, safetyScore: 95 },
        { id: 'room-0-3', name: 'Acil Gözlem Ünitesi', code: 'GZM-01', gridX: 2, gridY: 0, height: 28, type: 'medical', status: 'normal', openRiskCount: 1, safetyScore: 88 }
      ]
    },
    {
      id: 'floor-b1',
      floorNumber: -1,
      name: 'Bodrum Kat (Trafo & Jeneratör)',
      gridSize: 3,
      status: 'warning',
      riskCount: 3,
      safetyScore: 70,
      riskDistribution: { tolereGosterilmez: 0, yuksek: 1, onemli: 1, olasi: 1, onemsiz: 1 },
      rooms: [
        { id: 'room-b1-trafo', name: 'Trafo Odası (1600 kVA)', code: 'TRF-01', gridX: 0, gridY: 0, height: 40, type: 'electrical', status: 'warning', openRiskCount: 1, safetyScore: 68,
          description: 'Orta gerilim hücresi ve kuru tip dökme reçineli trafo ünitesi.',
          riskDistribution: { tolereGosterilmez: 0, yuksek: 1, onemli: 0, olasi: 0, onemsiz: 0 },
          telemetry: {
            voltageL1: 34500,
            voltageL2: 34500,
            voltageL3: 34500,
            temperature: 48.0,
            loadPercentage: 74,
            currentAmps: 1120,
            lastMaintenance: '10.06.2026',
            isSimulatedResolved: false,
          }
        },
        { id: 'room-b1-jen', name: 'Dizel Jeneratör Dairesi', code: 'JEN-01', gridX: 1, gridY: 0, height: 38, type: 'mechanical', status: 'normal', openRiskCount: 1, safetyScore: 84 },
        { id: 'room-b1-su', name: 'Yangın Hidrofor İstasyonu', code: 'HDF-01', gridX: 2, gridY: 0, height: 32, type: 'mechanical', status: 'normal', openRiskCount: 1, safetyScore: 85 }
      ]
    }
  ]
};

/**
 * Format floor label cleanly without duplicate dots
 */
export function formatFloorLabel(rawName: string): string {
  if (!rawName) return 'Kat';
  // If rawName is "13. Kat", return "13. Kat"
  // If rawName is "13.. Kat", clean it to "13. Kat"
  let cleaned = rawName.replace(/\.{2,}/g, '.').trim();
  if (/^\d+$/.test(cleaned)) {
    return `${cleaned}. Kat`;
  }
  return cleaned;
}

/**
 * Builds an isometric building model from real tree & locations data,
 * enriching generic placeholders with full modular hospital rooms.
 */
export function buildBuildingDataFromTree(
  tree: Record<string, any>, 
  selectedBuildingName?: string | null
): IsometricBuildingData {
  const buildingNames = Object.keys(tree);
  const activeBuildingName = selectedBuildingName && tree[selectedBuildingName] 
    ? selectedBuildingName 
    : (buildingNames[0] || 'Ana Bina');

  const bNode = tree[activeBuildingName];
  if (!bNode || !bNode.children || Object.keys(bNode.children).length === 0) {
    return MOCK_ISOMETRIC_BUILDING;
  }

  const floorEntries = Object.entries(bNode.children);
  
  const floors: IsometricFloor[] = floorEntries.map(([fName, fNode]: [string, any], index) => {
    const cleanFloorName = formatFloorLabel(fName);
    const parsedRank = parseFloorRank(cleanFloorName);
    const floorNum = parsedRank > -8000 ? parsedRank : (floorEntries.length - index);

    // Check if mock template has technical telemetry for this floor
    const mockMatch = MOCK_ISOMETRIC_BUILDING.floors.find(mf => 
      mf.floorNumber === floorNum || 
      cleanFloorName.toLowerCase().includes(mf.name.toLowerCase().slice(0, 5)) ||
      (floorNum === 13 && mf.floorNumber === 13)
    );

    const deptEntries = Object.entries(fNode.children || {});
    const rawRooms: {
      name: string;
      code: string;
      departmentName: string;
      departmentId?: string;
      unitId?: string;
      risks: number;
      stats: { acik: number; mudahale: number; takip: number; kapali: number };
      loc?: any;
    }[] = [];

    // Extract all real mahaller (units) and departments under this floor
    deptEntries.forEach(([dName, dNode]: [string, any]) => {
      const units = dNode.units || [];
      const mahalUnits = units.filter((u: any) => u.description && String(u.description).trim().length > 0);

      if (mahalUnits.length > 0) {
        mahalUnits.forEach((u: any) => {
          rawRooms.push({
            name: String(u.description).trim(),
            code: `M-${floorNum}${String(rawRooms.length + 1).padStart(2, '0')}`,
            departmentName: dName,
            departmentId: u.id,
            unitId: u.id,
            risks: u.riskCount || 0,
            stats: u.stats || { acik: 0, mudahale: 0, takip: 0, kapali: 0 },
            loc: u,
          });
        });
      } else {
        rawRooms.push({
          name: dName,
          code: `D-${floorNum}${String(rawRooms.length + 1).padStart(2, '0')}`,
          departmentName: dName,
          departmentId: units[0]?.id,
          unitId: units[0]?.id,
          risks: dNode.risks || 0,
          stats: dNode.stats || { acik: 0, mudahale: 0, takip: 0, kapali: 0 },
          loc: units[0],
        });
      }
    });

    let rooms: IsometricRoom[] = [];

    if (rawRooms.length > 0) {
      // Dynamic procedural grid size (e.g. 3x3, 4x4)
      const gridSize = Math.max(3, Math.ceil(Math.sqrt(rawRooms.length)));

      rooms = rawRooms.map((r, rIdx) => {
        const gx = rIdx % gridSize;
        const gy = Math.floor(rIdx / gridSize);
        const openRisks = r.stats?.acik || 0;
        const isCritical = openRisks > 0 || (floorNum === 13 && /pano|elektrik|trafo/i.test(r.name));
        const isWarning = !isCritical && (r.stats?.mudahale > 0 || r.stats?.takip > 0);
        const status: StatusType = isCritical ? 'critical' : isWarning ? 'warning' : 'normal';

        const isElectrical = /pano|trafo|elektrik|ups|jeneratör/i.test(r.name) || /pano|elektrik/i.test(r.departmentName);
        const isMedical = /ameliyat|klinik|yatak|hasta|radyoloji|laboratuvar|yoğun bakım|acil|diyaliz/i.test(r.name) || /sağlık|medikal|klinik/i.test(r.departmentName);
        const isElevator = /asansör|merdiven|şaft/i.test(r.name);
        const isArchive = /arşiv|depo|atık/i.test(r.name);
        const type = isElectrical ? 'electrical' : isMedical ? 'medical' : isElevator ? 'elevator' : isArchive ? 'archive' : 'office';

        return {
          id: r.unitId || `room-${floorNum}-${rIdx}`,
          name: r.name,
          code: r.code,
          departmentId: r.departmentId,
          gridX: gx,
          gridY: gy,
          height: isElectrical ? 36 : isMedical ? 30 : 26,
          type,
          status,
          openRiskCount: r.risks,
          safetyScore: status === 'critical' ? 42 : status === 'warning' ? 74 : 95,
          riskDistribution: {
            tolereGosterilmez: openRisks > 1 ? 1 : 0,
            yuksek: openRisks > 0 ? 1 : 0,
            onemli: r.stats?.mudahale || 0,
            olasi: r.stats?.takip || 0,
            onemsiz: r.stats?.kapali || 1,
          },
          telemetry: isElectrical ? {
            voltageL1: 238,
            voltageL2: 241,
            voltageL3: 185,
            temperature: 78.4,
            loadPercentage: 118,
            currentAmps: 345,
            lastMaintenance: '12.08.2026',
            activeAlarm: 'Aşırı Yük & Faz Dengesizliği (Bara Sıcaklığı 78.4°C)',
            isSimulatedResolved: false,
          } : undefined
        };
      });
    } else if (mockMatch) {
      rooms = mockMatch.rooms;
    }

    const hasCritical = rooms.some(r => r.status === 'critical') || fNode.stats?.acik > 0 || floorNum === 13;
    const floorStatus = hasCritical ? 'critical' : (fNode.stats?.mudahale > 0 || fNode.stats?.takip > 0) ? 'warning' : 'normal';

    const floorRiskDist: RiskDistribution = rooms.reduce((acc, r) => ({
      tolereGosterilmez: acc.tolereGosterilmez + (r.riskDistribution?.tolereGosterilmez || (r.status === 'critical' ? 1 : 0)),
      yuksek: acc.yuksek + (r.riskDistribution?.yuksek || (r.status === 'critical' ? 1 : 0)),
      onemli: acc.onemli + (r.riskDistribution?.onemli || (r.status === 'warning' ? 1 : 0)),
      olasi: acc.olasi + (r.riskDistribution?.olasi || 0),
      onemsiz: acc.onemsiz + (r.riskDistribution?.onemsiz || 1),
    }), { tolereGosterilmez: 0, yuksek: 0, onemli: 0, olasi: 0, onemsiz: 0 });

    const maxGridDim = rooms.reduce((max, r) => Math.max(max, r.gridX + 1, r.gridY + 1), 3);

    return {
      id: `floor-${floorNum}`,
      floorNumber: floorNum,
      name: cleanFloorName,
      gridSize: maxGridDim,
      rooms,
      status: floorStatus,
      riskCount: rooms.reduce((sum, r) => sum + r.openRiskCount, 0) || fNode.risks || (floorNum === 13 ? 4 : 1),
      riskDistribution: floorRiskDist,
      safetyScore: hasCritical ? 48 : floorStatus === 'warning' ? 74 : 94,
      hasCriticalFault: hasCritical,
      criticalFaultText: hasCritical ? 'Kritik risk veya aşırı yük arızası tespit edildi!' : undefined,
    };
  });

  floors.sort((a, b) => b.floorNumber - a.floorNumber);

  return {
    id: `bld-${activeBuildingName}`,
    name: activeBuildingName,
    floors,
    totalRisks: floors.reduce((s, f) => s + f.riskCount, 0),
    safetyScore: Math.round(floors.reduce((s, f) => s + (f.safetyScore || 85), 0) / (floors.length || 1)),
  };
}
