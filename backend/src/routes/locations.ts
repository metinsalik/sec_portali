import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { authMiddleware } from '../middleware/auth';
import {
  buildCanonicalLocationName,
  deleteLocationNode,
  ensureFacilityBuilding,
  inferLocationType,
  renameLocationNode,
  upsertFacilityLocation,
} from '../utils/locationHierarchy';

const router = Router();
const prisma = new PrismaClient();

// Get all physical locations for a facility
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { facilityId } = req.query as Record<string, string>;
  if (!facilityId) return res.status(400).json({ error: 'facilityId zorunludur' });

  try {
    const locations = await prisma.facilityLocation.findMany({
      where: {
        facilityId,
        isActive: true,
        OR: [{ type: null }, { type: { not: 'TEMIZLIK_ARABASI' } }],
      },
      include: { facilityBuilding: true },
      orderBy: [
        { buildingName: 'asc' },
        { building: 'asc' },
        { floor: 'asc' },
        { department: 'asc' },
        { description: 'asc' },
        { name: 'asc' },
      ],
    });
    res.json(locations);
  } catch (err) {
    res.status(500).json({ error: 'Lokasyonlar alınamadı.' });
  }
});

// Create location (5-level: Bina Adı > Blok > Kat > Birim > Mahal)
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { facilityId, buildingName, building, block, floor, department, name, description, type } = req.body;
  if (!facilityId) return res.status(400).json({ error: 'facilityId zorunludur' });

  try {
    const { location } = await upsertFacilityLocation(prisma, {
      facilityId,
      buildingName,
      building,
      block,
      floor,
      department,
      description,
      name,
      type,
    });
    res.status(201).json(location);
  } catch (err: any) {
    console.error('Lokasyon ekleme hatası:', err);
    res.status(err.statusCode || 500).json({ error: err.message || 'Lokasyon eklenemedi.' });
  }
});

// Rename node (bulk update across 5 hierarchy levels)
router.post('/rename-node', authMiddleware, async (req: AuthRequest, res: Response) => {
  const {
    facilityId,
    level,
    oldValue,
    newValue,
    parentBuildingName,
    parentBuilding,
    parentFloor,
    parentDepartment,
  } = req.body;
  if (!facilityId) return res.status(400).json({ error: 'facilityId zorunludur' });

  try {
    const result = await renameLocationNode(prisma, {
      facilityId,
      level,
      oldValue,
      newValue,
      parentBuildingName,
      parentBuilding,
      parentFloor,
      parentDepartment,
    });
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ error: err.message || 'İsim güncellenemedi.' });
  }
});

// Delete node (soft delete node and its subtree)
router.post('/delete-node', authMiddleware, async (req: AuthRequest, res: Response) => {
  const {
    facilityId,
    level,
    value,
    parentBuildingName,
    parentBuilding,
    parentFloor,
    parentDepartment,
    id,
  } = req.body;
  if (!facilityId) return res.status(400).json({ error: 'facilityId zorunludur' });

  try {
    const result = await deleteLocationNode(prisma, {
      facilityId,
      level,
      value,
      parentBuildingName,
      parentBuilding,
      parentFloor,
      parentDepartment,
      id,
    });
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ error: err.message || 'Düğüm silinemedi.' });
  }
});

// Single location ops
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { buildingName, building, block, floor, department, name, description, type } = req.body;
  try {
    const existing = await prisma.facilityLocation.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Lokasyon bulunamadı.' });

    const nextBuildingName = buildingName !== undefined ? (buildingName?.trim() || null) : existing.buildingName;
    const rawBlk = block !== undefined ? block : building;
    const nextBuilding = rawBlk !== undefined ? (rawBlk?.trim() || null) : existing.building;
    const nextFloor = floor !== undefined ? (floor?.trim() || null) : existing.floor;
    const nextDept = department !== undefined ? (department?.trim() || null) : existing.department;
    const nextDesc = description !== undefined ? (description?.trim() || null) : existing.description;

    const buildingId = await ensureFacilityBuilding(prisma, existing.facilityId, nextBuildingName);
    const nextName = buildCanonicalLocationName({
      buildingName: nextBuildingName,
      building: nextBuilding,
      floor: nextFloor,
      department: nextDept,
      description: nextDesc,
      name: name ?? existing.name,
    });
    const nextType = inferLocationType({
      buildingName: nextBuildingName,
      building: nextBuilding,
      floor: nextFloor,
      department: nextDept,
      description: nextDesc,
      type: type ?? existing.type,
    });

    const location = await prisma.facilityLocation.update({
      where: { id: req.params.id },
      data: {
        buildingId,
        buildingName: nextBuildingName,
        building: nextBuilding,
        floor: nextFloor,
        department: nextDept,
        description: nextDesc,
        name: nextName,
        type: nextType,
      },
      include: { facilityBuilding: true },
    });
    res.json(location);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Lokasyon güncellenemedi.' });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    // Soft delete
    await prisma.facilityLocation.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Lokasyon silinemedi.' });
  }
});

import multer from 'multer';
import * as XLSX from 'xlsx';

// Excel Şablon İndirme (Tesis Adı, Bina, Blok, Kat, Birim, Mahal + Kurumsal Standart Kodlar)
router.get('/excel-template', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const sampleData = [
      {
        'Tesis Adı': 'MP Adana',
        'Bina': 'Ana Bina',
        'Blok': 'A Blok',
        'Kat': 'Z.Kat',
        'Birim': 'Acil Servis',
        'Mahal': 'Triaj Odası'
      },
      {
        'Tesis Adı': 'MP Adana',
        'Bina': 'Ana Bina',
        'Blok': 'A Blok',
        'Kat': '1.Kat',
        'Birim': 'Radyoloji',
        'Mahal': 'MR Çekim Odası'
      },
      {
        'Tesis Adı': 'MP Adana',
        'Bina': 'Ana Bina',
        'Blok': 'B Blok',
        'Kat': 'B1.Kat',
        'Birim': 'Teknik Servis',
        'Mahal': ''
      },
      {
        'Tesis Adı': 'Liv Ulus',
        'Bina': 'Ana Bina',
        'Blok': '',
        'Kat': 'Z.Kat',
        'Birim': '',
        'Mahal': ''
      },
      {
        'Tesis Adı': 'Liv Vadi',
        'Bina': 'Ana Bina',
        'Blok': 'A Blok',
        'Kat': '2.Kat',
        'Birim': 'Ameliyathane',
        'Mahal': 'Steril Depo'
      }
    ];

    const standardFacilities = [
      { 'Tesis Adı': 'İSÜ Liv Bahçeşehir', 'Kurumsal Kod': 'BHC' },
      { 'Tesis Adı': 'İSÜ Liv Topkapı', 'Kurumsal Kod': 'TPK' },
      { 'Tesis Adı': 'İSÜ MP Gaziosmanpaşa', 'Kurumsal Kod': 'GOP' },
      { 'Tesis Adı': 'İSÜ Tıp Fakültesi', 'Kurumsal Kod': 'TFK' },
      { 'Tesis Adı': 'Liv Ankara', 'Kurumsal Kod': 'ANL' },
      { 'Tesis Adı': 'Liv Gaziantep', 'Kurumsal Kod': 'GZN' },
      { 'Tesis Adı': 'Liv Samsun', 'Kurumsal Kod': 'SML' },
      { 'Tesis Adı': 'Liv Ulus', 'Kurumsal Kod': 'ULS' },
      { 'Tesis Adı': 'Liv Vadi', 'Kurumsal Kod': 'VAD' },
      { 'Tesis Adı': 'MP Adana', 'Kurumsal Kod': 'ADN' },
      { 'Tesis Adı': 'MP Ankara', 'Kurumsal Kod': 'ANM' },
      { 'Tesis Adı': 'MP Antalya', 'Kurumsal Kod': 'ANT' },
      { 'Tesis Adı': 'MP Ataşehir', 'Kurumsal Kod': 'ATS' },
      { 'Tesis Adı': 'MP Bahçelievler', 'Kurumsal Kod': 'BAH' },
      { 'Tesis Adı': 'MP Gebze', 'Kurumsal Kod': 'GBZ' },
      { 'Tesis Adı': 'MP Göztepe', 'Kurumsal Kod': 'GOZ' },
      { 'Tesis Adı': 'MP İzmir', 'Kurumsal Kod': 'IZM' },
      { 'Tesis Adı': 'MP Ordu', 'Kurumsal Kod': 'ORD' },
      { 'Tesis Adı': 'MP Seyhan', 'Kurumsal Kod': 'SYH' },
      { 'Tesis Adı': 'MP Tem', 'Kurumsal Kod': 'TEM' },
      { 'Tesis Adı': 'MP Tokat', 'Kurumsal Kod': 'TKT' },
      { 'Tesis Adı': 'MP Karadeniz', 'Kurumsal Kod': 'KAR' },
      { 'Tesis Adı': 'MP Yıldızlı', 'Kurumsal Kod': 'TRB' },
      { 'Tesis Adı': 'MP İstanbul Onkoloji', 'Kurumsal Kod': 'ONK' },
      { 'Tesis Adı': 'VM MP Ankara', 'Kurumsal Kod': 'ANW' },
      { 'Tesis Adı': 'VM MP Bursa', 'Kurumsal Kod': 'BUR' },
      { 'Tesis Adı': 'VM MP Fatih', 'Kurumsal Kod': 'FTH' },
      { 'Tesis Adı': 'VM MP Florya', 'Kurumsal Kod': 'FLR' },
      { 'Tesis Adı': 'VM MP Kocaeli', 'Kurumsal Kod': 'KOC' },
      { 'Tesis Adı': 'VM MP Maltepe', 'Kurumsal Kod': 'MLT' },
      { 'Tesis Adı': 'VM MP Mersin', 'Kurumsal Kod': 'MRS' },
      { 'Tesis Adı': 'VM MP Pendik', 'Kurumsal Kod': 'PEN' },
      { 'Tesis Adı': 'VM MP Samsun', 'Kurumsal Kod': 'SMW' },
      { 'Tesis Adı': 'İstinye Dent', 'Kurumsal Kod': 'DNT' },
      { 'Tesis Adı': 'GOP Diyaliz', 'Kurumsal Kod': 'DYZ' }
    ];

    const standardFloors = [
      { 'Kat Adı': 'Z.Kat', 'Kısaltma': 'ZK' },
      { 'Kat Adı': '1.Kat', 'Kısaltma': '1K' },
      { 'Kat Adı': '2.Kat', 'Kısaltma': '2K' },
      { 'Kat Adı': '3.Kat', 'Kısaltma': '3K' },
      { 'Kat Adı': '4.Kat', 'Kısaltma': '4K' },
      { 'Kat Adı': '5.Kat', 'Kısaltma': '5K' },
      { 'Kat Adı': '6.Kat', 'Kısaltma': '6K' },
      { 'Kat Adı': '7.Kat', 'Kısaltma': '7K' },
      { 'Kat Adı': '8.Kat', 'Kısaltma': '8K' },
      { 'Kat Adı': '9.Kat', 'Kısaltma': '9K' },
      { 'Kat Adı': '10.Kat', 'Kısaltma': '10K' },
      { 'Kat Adı': '11.Kat', 'Kısaltma': '11K' },
      { 'Kat Adı': '12.Kat', 'Kısaltma': '12K' },
      { 'Kat Adı': '13.Kat', 'Kısaltma': '13K' },
      { 'Kat Adı': '14.Kat', 'Kısaltma': '14K' },
      { 'Kat Adı': '15.Kat', 'Kısaltma': '15K' },
      { 'Kat Adı': 'B1.Kat', 'Kısaltma': 'B1K' },
      { 'Kat Adı': 'B2.Kat', 'Kısaltma': 'B2K' },
      { 'Kat Adı': 'B3.Kat', 'Kısaltma': 'B3K' },
      { 'Kat Adı': 'B4.Kat', 'Kısaltma': 'B4K' },
      { 'Kat Adı': 'B5.Kat', 'Kısaltma': 'B5K' },
      { 'Kat Adı': 'B6.Kat', 'Kısaltma': 'B6K' },
      { 'Kat Adı': 'B7.Kat', 'Kısaltma': 'B7K' },
      { 'Kat Adı': 'B8.Kat', 'Kısaltma': 'B8K' },
      { 'Kat Adı': 'T1.Kat', 'Kısaltma': 'T1K' },
      { 'Kat Adı': 'T2.Kat', 'Kısaltma': 'T2K' },
      { 'Kat Adı': 'T3.Kat', 'Kısaltma': 'T3K' },
      { 'Kat Adı': 'Ara Kat', 'Kısaltma': 'ARK' },
      { 'Kat Adı': 'Asma Kat', 'Kısaltma': 'ASK' },
      { 'Kat Adı': 'Teras Kat', 'Kısaltma': 'TRK' },
      { 'Kat Adı': 'Çatı Katı', 'Kısaltma': 'CTK' }
    ];

    const standardBlocks = [
      { 'Blok/Bina Adı': 'Ana Bina', 'Kısaltma': 'ANB' },
      { 'Blok/Bina Adı': 'Ek Bina', 'Kısaltma': 'EKB' },
      { 'Blok/Bina Adı': 'A Blok', 'Kısaltma': 'ABL' },
      { 'Blok/Bina Adı': 'B Blok', 'Kısaltma': 'BBL' },
      { 'Blok/Bina Adı': 'C Blok', 'Kısaltma': 'CBL' },
      { 'Blok/Bina Adı': 'D Blok', 'Kısaltma': 'DBL' },
      { 'Blok/Bina Adı': 'E Blok', 'Kısaltma': 'EBL' }
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sampleData);
    XLSX.utils.book_append_sheet(wb, ws, 'Konum Listesi');

    const wsFac = XLSX.utils.json_to_sheet(standardFacilities);
    XLSX.utils.book_append_sheet(wb, wsFac, 'Standart Tesisler');

    const wsFloors = XLSX.utils.json_to_sheet(standardFloors);
    XLSX.utils.book_append_sheet(wb, wsFloors, 'Standart Katlar');

    const wsBlocks = XLSX.utils.json_to_sheet(standardBlocks);
    XLSX.utils.book_append_sheet(wb, wsBlocks, 'Standart Bloklar');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename="Kurumsal_Konum_Listesi_Sablonu.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (error) {
    console.error('Lokasyon Excel şablon hatası:', error);
    res.status(500).json({ error: 'Excel şablonu oluşturulamadı.' });
  }
});

// Excel ile Toplu Konum (Tesis Adı, Bina, Blok, Kat) İçe Aktarma
const excelUpload = multer({ storage: multer.memoryStorage() });

// Kat ve Blok Kısaltma Normalizasyon Haritası
const FLOOR_CODE_MAP: Record<string, string> = {
  'ZK': 'Z.Kat', 'ZEMIN': 'Z.Kat', 'ZEMİN KAT': 'Z.Kat',
  '1K': '1.Kat', '2K': '2.Kat', '3K': '3.Kat', '4K': '4.Kat', '5K': '5.Kat',
  '6K': '6.Kat', '7K': '7.Kat', '8K': '8.Kat', '9K': '9.Kat', '10K': '10.Kat',
  '11K': '11.Kat', '12K': '12.Kat', '13K': '13.Kat', '14K': '14.Kat', '15K': '15.Kat',
  'B1K': 'B1.Kat', 'B2K': 'B2.Kat', 'B3K': 'B3.Kat', 'B4K': 'B4.Kat', 'B5K': 'B5.Kat',
  'B6K': 'B6.Kat', 'B7K': 'B7.Kat', 'B8K': 'B8.Kat',
  'T1K': 'T1.Kat', 'T2K': 'T2.Kat', 'T3K': 'T3.Kat',
  'ARK': 'Ara Kat', 'ASK': 'Asma Kat', 'TRK': 'Teras Kat', 'CTK': 'Çatı Katı'
};

const BLOCK_CODE_MAP: Record<string, string> = {
  'ABL': 'A Blok', 'BBL': 'B Blok', 'CBL': 'C Blok', 'DBL': 'D Blok', 'EBL': 'E Blok',
  'ANB': 'Ana Bina', 'EKB': 'Ek Bina'
};

router.post('/import-excel', authMiddleware, excelUpload.single('file'), async (req: any, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Excel dosyası yüklenmedi.' });
    }

    const { facilityId } = req.body; // opsiyonel seçili tesis

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet);

    if (!rows || rows.length === 0) {
      return res.status(400).json({ error: 'Excel dosyasında veri bulunamadı.' });
    }

    // Tesisleri önceden çek (İsme ve shortName'e göre eşleştirme için)
    const allFacilities = await prisma.facility.findMany({
      select: { id: true, name: true, shortName: true }
    });

    let importedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      // Sütun başlıkları: "Tesis Adı", "Bina", "Blok", "Kat", "Birim", "Mahal"
      const rawFacilityName = (row['Tesis Adı'] || row['Tesis'] || '').toString().trim();
      let rawBuilding = (row['Bina'] || row['Bina Adı'] || '').toString().trim();
      let rawBlock = (row['Blok'] || '').toString().trim();
      let rawFloor = (row['Kat'] || '').toString().trim();
      const rawDepartment = (row['Birim'] || row['Departman'] || '').toString().trim();
      const rawMahal = (row['Mahal'] || row['Oda'] || row['Açıklama'] || '').toString().trim();

      if (!rawBuilding && !rawBlock && !rawFloor && !rawDepartment && !rawMahal) continue;

      // Kod normalizasyonu (Örn: ABL -> A Blok, 1K -> 1.Kat)
      const upperBlock = rawBlock.toUpperCase();
      if (BLOCK_CODE_MAP[upperBlock]) {
        rawBlock = BLOCK_CODE_MAP[upperBlock];
      }
      const upperBuilding = rawBuilding.toUpperCase();
      if (BLOCK_CODE_MAP[upperBuilding]) {
        rawBuilding = BLOCK_CODE_MAP[upperBuilding];
      }
      const upperFloor = rawFloor.toUpperCase().replace(/\s+/g, '');
      if (FLOOR_CODE_MAP[upperFloor]) {
        rawFloor = FLOOR_CODE_MAP[upperFloor];
      }

      let targetFacilityId = facilityId;

      if (rawFacilityName) {
        // İsme veya shortName'e göre eşleştir
        const matched = allFacilities.find(f => 
          f.name.toLowerCase() === rawFacilityName.toLowerCase() ||
          (f.shortName && f.shortName.toLowerCase() === rawFacilityName.toLowerCase()) ||
          f.name.toLowerCase().includes(rawFacilityName.toLowerCase()) ||
          rawFacilityName.toLowerCase().includes(f.name.toLowerCase())
        );
        if (matched) {
          targetFacilityId = matched.id;
        }
      }

      if (!targetFacilityId) {
        errors.push(`Satır ${i + 2}: Tesis adı ("${rawFacilityName}") sistemde bulunamadı.`);
        continue;
      }

      const bNameField = rawBuilding || rawBlock || 'Ana Bina';
      const blockField = rawBlock && rawBlock.toLowerCase() !== bNameField.toLowerCase() ? rawBlock : '';
      const floorField = rawFloor || (rawDepartment || rawMahal ? 'Z.Kat' : '');

      const { created } = await upsertFacilityLocation(prisma, {
        facilityId: targetFacilityId,
        buildingName: bNameField,
        building: blockField,
        floor: floorField,
        department: rawDepartment,
        description: rawMahal,
        returnExistingOnDuplicate: true,
      });

      if (created) {
        importedCount++;
      }
    }

    res.json({
      success: true,
      importedCount,
      errors,
      message: `${importedCount} adet konum başarıyla içe aktarıldı.`
    });
  } catch (error: any) {
    console.error('Konum Excel içe aktarma hatası:', error);
    res.status(500).json({ error: error.message || 'Excel aktarımı sırasında hata oluştu.' });
  }
});

// Sync Bina Adı > Blok > Kat from FM200BuildingFloor into FacilityLocation
router.post('/sync-from-fm200', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { facilityId } = (req.body || {}) as { facilityId?: string };
    const syncAll = !facilityId || facilityId === 'ALL' || facilityId === 'all';

    const fm200Floors = await prisma.fm200BuildingFloor.findMany({
      where: syncAll ? {} : { facilityId },
      orderBy: [{ facilityId: 'asc' }, { building: 'asc' }, { block: 'asc' }, { floor: 'asc' }],
    });

    let createdCount = 0;
    let skippedCount = 0;

    for (const bf of fm200Floors) {
      const bName = (bf.building || 'Ana Bina').trim();
      const blk = bf.block ? bf.block.trim() : null;
      const flr = (bf.floor || '').trim();
      if (!flr) continue;

      const existingOnFloor = await prisma.facilityLocation.findFirst({
        where: {
          facilityId: bf.facilityId,
          buildingName: bName,
          building: blk,
          floor: flr,
          isActive: true,
        },
        select: { id: true },
      });

      if (existingOnFloor) {
        skippedCount++;
        continue;
      }

      const { created } = await upsertFacilityLocation(prisma, {
        facilityId: bf.facilityId,
        buildingName: bName,
        block: blk || undefined,
        floor: flr,
        returnExistingOnDuplicate: true,
      });

      if (created) {
        createdCount++;
      } else {
        skippedCount++;
      }
    }

    res.json({
      success: true,
      totalSourceRows: fm200Floors.length,
      createdCount,
      skippedCount,
      message:
        createdCount > 0
          ? `FM200 verilerinden ${createdCount} yeni Bina/Blok/Kat konumu aktarıldı (${skippedCount} mevcut atlandı).`
          : `Tüm FM200 Bina/Blok/Kat kayıtları zaten güncel (${skippedCount} kayıt).`,
    });
  } catch (error: any) {
    console.error('FM200 konum eşitleme hatası:', error);
    res.status(500).json({ error: error.message || 'FM200 konumları eşitlenemedi.' });
  }
});

export default router;
