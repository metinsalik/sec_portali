import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get all locations for a facility
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { facilityId } = req.query as Record<string, string>;
  if (!facilityId) return res.status(400).json({ error: 'facilityId zorunludur' });

  try {
    const locations = await prisma.facilityLocation.findMany({
      where: { facilityId, isActive: true },
      orderBy: [
        { building: 'asc' },
        { floor: 'asc' },
        { name: 'asc' },
        { description: 'asc' }
      ]
    });
    res.json(locations);
  } catch (err) {
    res.status(500).json({ error: 'Lokasyonlar alınamadı.' });
  }
});

// Create location
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { facilityId, building, floor, department, name, description, type } = req.body;
  if (!facilityId) return res.status(400).json({ error: 'facilityId zorunludur' });

  try {
    const location = await prisma.facilityLocation.create({
      data: {
        facilityId,
        building,
        floor,
        department,
        name: name || 'Yeni Lokasyon',
        description,
        type: type || 'DEPARTMAN'
      }
    });
    res.status(201).json(location);
  } catch (err: any) {
    console.error('Lokasyon ekleme hatası:', err);
    res.status(500).json({ error: err.message || 'Lokasyon eklenemedi.' });
  }
});

// Rename node (bulk update)
router.post('/rename-node', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { facilityId, level, oldValue, newValue, parentBuilding, parentFloor } = req.body;
  if (!facilityId) return res.status(400).json({ error: 'facilityId zorunludur' });
  if (!newValue || newValue.trim() === '') return res.status(400).json({ error: 'Yeni isim boş olamaz.' });
  
  try {
    let whereClause: any = { facilityId };
    let dataClause: any = {};
    
    const cleanOld = oldValue.startsWith('Belirtilmemiş') ? '' : oldValue;
    const cleanPB = parentBuilding && parentBuilding.startsWith('Belirtilmemiş') ? '' : parentBuilding;
    const cleanPF = parentFloor && parentFloor.startsWith('Belirtilmemiş') ? '' : parentFloor;

    if (level === 'building') {
      whereClause.building = cleanOld;
      dataClause.building = newValue;
    } else if (level === 'floor') {
      whereClause.building = cleanPB;
      whereClause.floor = cleanOld;
      dataClause.floor = newValue;
    } else if (level === 'department') {
      whereClause.building = cleanPB;
      whereClause.floor = cleanPF;
      whereClause.department = cleanOld;
      dataClause.department = newValue;
    } else if (level === 'name') {
      whereClause.building = cleanPB;
      whereClause.floor = cleanPF;
      whereClause.name = cleanOld;
      dataClause.name = newValue;
    } else {
      return res.status(400).json({ error: 'Geçersiz seviye.' });
    }

    await prisma.facilityLocation.updateMany({
      where: whereClause,
      data: dataClause
    });
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'İsim güncellenemedi.' });
  }
});

// Delete node (bulk delete / clear)
router.post('/delete-node', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { facilityId, level, value, parentBuilding, parentFloor } = req.body;
  if (!facilityId) return res.status(400).json({ error: 'facilityId zorunludur' });
  
  try {
    let whereClause: any = { facilityId };
    let dataClause: any = {};
    
    const cleanVal = value.startsWith('Belirtilmemiş') ? '' : value;
    const cleanPB = parentBuilding && parentBuilding.startsWith('Belirtilmemiş') ? '' : parentBuilding;
    const cleanPF = parentFloor && parentFloor.startsWith('Belirtilmemiş') ? '' : parentFloor;
    
    if (level === 'building') {
      whereClause.building = cleanVal;
      dataClause.building = '';
    } else if (level === 'floor') {
      whereClause.building = cleanPB;
      whereClause.floor = cleanVal;
      dataClause.floor = '';
    } else if (level === 'department') {
      whereClause.building = cleanPB;
      whereClause.floor = cleanPF;
      whereClause.department = cleanVal;
      dataClause.department = '';
    } else {
      return res.status(400).json({ error: 'Geçersiz seviye.' });
    }

    await prisma.facilityLocation.updateMany({
      where: whereClause,
      data: dataClause
    });
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Düğüm silinemedi.' });
  }
});

// Single location ops
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { building, floor, department, name, description, type } = req.body;
  try {
    const location = await prisma.facilityLocation.update({
      where: { id: req.params.id },
      data: { building, floor, department, name, description, type }
    });
    res.json(location);
  } catch (err) {
    res.status(500).json({ error: 'Lokasyon güncellenemedi.' });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    // Soft delete
    await prisma.facilityLocation.update({
      where: { id: req.params.id },
      data: { isActive: false }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Lokasyon silinemedi.' });
  }
});

import multer from 'multer';
import * as XLSX from 'xlsx';

// Excel Şablon İndirme (Tesis Adı, Bina, Blok, Kat + Kurumsal Standart Kodlar)
router.get('/excel-template', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const sampleData = [
      {
        'Tesis Adı': 'MP Adana',
        'Bina': 'Ana Bina',
        'Blok': 'A Blok',
        'Kat': 'Z.Kat'
      },
      {
        'Tesis Adı': 'MP Adana',
        'Bina': 'Ana Bina',
        'Blok': 'A Blok',
        'Kat': '1.Kat'
      },
      {
        'Tesis Adı': 'MP Adana',
        'Bina': 'Ana Bina',
        'Blok': 'B Blok',
        'Kat': 'B1.Kat'
      },
      {
        'Tesis Adı': 'Liv Ulus',
        'Bina': 'Ana Bina',
        'Blok': 'Ana Bina',
        'Kat': 'Z.Kat'
      },
      {
        'Tesis Adı': 'Liv Vadi',
        'Bina': 'Ana Bina',
        'Blok': 'A Blok',
        'Kat': '2.Kat'
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
      // Kullanıcının tablosundaki sütun başlıkları: "Tesis Adı", "Bina", "Blok", "Kat"
      const rawFacilityName = (row['Tesis Adı'] || row['Tesis'] || '').toString().trim();
      let rawBuilding = (row['Bina'] || '').toString().trim();
      let rawBlock = (row['Blok'] || '').toString().trim();
      let rawFloor = (row['Kat'] || '').toString().trim();

      if (!rawBuilding && !rawBlock && !rawFloor) continue;

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

      // Bina, Blok ve Kat kombinasyonunu oluştur
      // Modelimizde: building = Blok veya Bina, floor = Kat
      let buildingField = rawBuilding;
      if (rawBlock && rawBlock !== rawBuilding) {
        buildingField = rawBuilding ? `${rawBuilding} (${rawBlock})` : rawBlock;
      } else if (!buildingField && rawBlock) {
        buildingField = rawBlock;
      }
      const floorField = rawFloor || 'Z.Kat';
      const nameField = `${buildingField} - ${floorField}`;

      // Mükerrer kontrolü: Aynı tesiste aynı bina ve kat var mı?
      const existing = await prisma.facilityLocation.findFirst({
        where: {
          facilityId: targetFacilityId,
          building: buildingField,
          floor: floorField,
          isActive: true
        }
      });

      if (!existing) {
        await prisma.facilityLocation.create({
          data: {
            facilityId: targetFacilityId,
            building: buildingField,
            floor: floorField,
            name: nameField,
            type: 'KAT',
            description: rawBlock || rawBuilding
          }
        });
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

export default router;
