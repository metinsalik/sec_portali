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

// Excel Şablon İndirme (Tesis Adı, Bina, Blok, Kat)
router.get('/excel-template', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const sampleData = [
      {
        'Tesis Adı': 'MP Adana',
        'Bina': 'Ana Bina',
        'Blok': 'A Blok',
        'Kat': 'Zemin Kat'
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
        'Tesis Adı': 'Liv Gaziantep',
        'Bina': 'Ana Bina',
        'Blok': 'Ana Bina',
        'Kat': 'Zemin Kat'
      }
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sampleData);
    XLSX.utils.book_append_sheet(wb, ws, 'Konum Listesi');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename="Bina_Blok_Kat_Konum_Listesi_Sablonu.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (error) {
    console.error('Lokasyon Excel şablon hatası:', error);
    res.status(500).json({ error: 'Excel şablonu oluşturulamadı.' });
  }
});

// Excel ile Toplu Konum (Tesis Adı, Bina, Blok, Kat) İçe Aktarma
const excelUpload = multer({ storage: multer.memoryStorage() });

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
      const rawBuilding = (row['Bina'] || '').toString().trim();
      const rawBlock = (row['Blok'] || '').toString().trim();
      const rawFloor = (row['Kat'] || '').toString().trim();

      if (!rawBuilding && !rawBlock && !rawFloor) continue;

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
      // Eğer hem Bina hem Blok varsa: building = `${rawBuilding} - ${rawBlock}`, floor = rawFloor
      let buildingField = rawBuilding;
      if (rawBlock && rawBlock !== rawBuilding) {
        buildingField = rawBuilding ? `${rawBuilding} (${rawBlock})` : rawBlock;
      }
      const floorField = rawFloor || 'Zemin Kat';
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
