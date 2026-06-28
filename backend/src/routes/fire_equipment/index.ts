import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../../middleware/auth';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

const router = express.Router();
const prisma = new PrismaClient();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});
const upload = multer({ storage: storage });

// Tüm route'lar auth gerektirir
router.use(authMiddleware);

// --- CATEGORIES ---
router.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.fireEquipmentCategory.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      include: { subcategories: true }
    });
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Kategoriler alınamadı.' });
  }
});

router.post('/categories', async (req, res) => {
  try {
    const { name, description, parentId, maintenanceFrequency } = req.body;
    const category = await prisma.fireEquipmentCategory.create({
      data: { name, description, parentId, maintenanceFrequency }
    });
    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Kategori oluşturulamadı.' });
  }
});

router.put('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, parentId, maintenanceFrequency } = req.body;
    const category = await prisma.fireEquipmentCategory.update({
      where: { id },
      data: { name, description, parentId, maintenanceFrequency }
    });
    res.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Kategori güncellenemedi.' });
  }
});

router.delete('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.fireEquipmentCategory.update({
      where: { id },
      data: { isActive: false }
    });
    res.json({ message: 'Kategori silindi.' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Kategori silinemedi.' });
  }
});

// --- RESPONSIBLES ---
router.get('/responsibles/:facilityId', async (req, res) => {
  try {
    const { facilityId } = req.params;
    const responsibles = await prisma.fireEquipmentResponsible.findMany({
      where: { facilityId, isActive: true },
      orderBy: { name: 'asc' }
    });
    res.json(responsibles);
  } catch (error) {
    console.error('Error fetching responsibles:', error);
    res.status(500).json({ error: 'Sorumlular alınamadı.' });
  }
});

router.post('/responsibles/:facilityId', async (req, res) => {
  try {
    const { facilityId } = req.params;
    const { name, department } = req.body;
    const responsible = await prisma.fireEquipmentResponsible.create({
      data: { facilityId, name, department }
    });
    res.status(201).json(responsible);
  } catch (error) {
    console.error('Error creating responsible:', error);
    res.status(500).json({ error: 'Sorumlu oluşturulamadı.' });
  }
});

router.put('/responsibles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, department } = req.body;
    const responsible = await prisma.fireEquipmentResponsible.update({
      where: { id },
      data: { name, department }
    });
    res.json(responsible);
  } catch (error) {
    console.error('Error updating responsible:', error);
    res.status(500).json({ error: 'Sorumlu güncellenemedi.' });
  }
});

router.delete('/responsibles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.fireEquipmentResponsible.update({
      where: { id },
      data: { isActive: false }
    });
    res.json({ message: 'Sorumlu silindi.' });
  } catch (error) {
    console.error('Error deleting responsible:', error);
    res.status(500).json({ error: 'Sorumlu silinemedi.' });
  }
});

// --- COMPANIES ---
router.get('/companies/:facilityId', async (req, res) => {
  try {
    const { facilityId } = req.params;
    const companies = await prisma.fireEquipmentCompany.findMany({
      where: { facilityId, isActive: true },
      orderBy: { name: 'asc' }
    });
    res.json(companies);
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ error: 'Firmalar alınamadı.' });
  }
});

router.post('/companies/:facilityId', async (req, res) => {
  try {
    const { facilityId } = req.params;
    const { name } = req.body;
    const company = await prisma.fireEquipmentCompany.create({
      data: { facilityId, name }
    });
    res.status(201).json(company);
  } catch (error) {
    console.error('Error creating company:', error);
    res.status(500).json({ error: 'Firma oluşturulamadı.' });
  }
});

router.put('/companies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const company = await prisma.fireEquipmentCompany.update({
      where: { id },
      data: { name }
    });
    res.json(company);
  } catch (error) {
    console.error('Error updating company:', error);
    res.status(500).json({ error: 'Firma güncellenemedi.' });
  }
});

router.delete('/companies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.fireEquipmentCompany.update({
      where: { id },
      data: { isActive: false }
    });
    res.json({ message: 'Firma silindi.' });
  } catch (error) {
    console.error('Error deleting company:', error);
    res.status(500).json({ error: 'Firma silinemedi.' });
  }
});

// --- LOCATIONS (MAPPED TO HAZMAT DEPARTMENTS) ---
router.get('/locations/:facilityId', async (req, res) => {
  try {
    const { facilityId } = req.params;
    const locations = await prisma.hazmatDepartment.findMany({
      where: { facilityId, isActive: true }
    });
    // Map 'name' to 'department' for frontend compatibility
    res.json(locations.map(loc => ({
      ...loc,
      department: loc.name
    })));
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ error: 'Lokasyonlar getirilemedi' });
  }
});

router.post('/locations/:facilityId', async (req, res) => {
  try {
    const { facilityId } = req.params;
    const { building, block, floor, department, description } = req.body;
    
    const location = await prisma.hazmatDepartment.create({
      data: {
        facilityId,
        building,
        block,
        floor,
        name: department,
        description
      }
    });
    
    res.status(201).json({ ...location, department: location.name });
  } catch (error) {
    console.error('Error creating location:', error);
    res.status(500).json({ error: 'Lokasyon oluşturulamadı' });
  }
});

router.put('/locations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { building, block, floor, department, description } = req.body;
    
    const location = await prisma.hazmatDepartment.update({
      where: { id },
      data: { building, block, floor, name: department, description }
    });
    
    res.json({ ...location, department: location.name });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ error: 'Lokasyon güncellenemedi' });
  }
});

router.delete('/locations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.hazmatDepartment.update({
      where: { id },
      data: { isActive: false }
    });
    res.json({ message: 'Lokasyon pasife alındı' });
  } catch (error) {
    console.error('Error deleting location:', error);
    res.status(500).json({ error: 'Lokasyon silinemedi' });
  }
});

// --- EQUIPMENT ---
router.get('/equipment/:facilityId', async (req, res) => {
  try {
    const { facilityId } = req.params;
    const equipment = await prisma.fireEquipment.findMany({
      where: { facilityId },
      include: {
        category: {
          include: { parent: true }
        },
        location: true,
        company: true,
        responsible: true,
        movements: { orderBy: { movementDate: 'desc' }, take: 1 },
        maintenances: { orderBy: { maintenanceDate: 'desc' }, take: 1 }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(equipment);
  } catch (error) {
    console.error('Error fetching equipment:', error);
    res.status(500).json({ error: 'Ekipmanlar alınamadı.' });
  }
});

router.get('/equipment/detail/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const equipment = await prisma.fireEquipment.findUnique({
      where: { id },
      include: {
        category: {
          include: { parent: true }
        },
        location: true,
        responsible: true,
        movements: { orderBy: { movementDate: 'desc' } },
        maintenances: { orderBy: { maintenanceDate: 'desc' } }
      }
    });
    
    if (!equipment) {
      return res.status(404).json({ error: 'Ekipman bulunamadı.' });
    }
    
    res.json(equipment);
  } catch (error) {
    console.error('Error fetching equipment details:', error);
    res.status(500).json({ error: 'Ekipman detayları alınamadı.' });
  }
});

router.get('/equipment/qr/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const equipment = await prisma.fireEquipment.findFirst({
      where: { qrCode: code }
    });
    
    if (!equipment) {
      return res.status(404).json({ error: 'Bu QR koda ait ekipman bulunamadı.' });
    }
    
    res.json(equipment);
  } catch (error) {
    console.error('Error finding equipment by QR:', error);
    res.status(500).json({ error: 'Ekipman aranırken hata oluştu.' });
  }
});

router.post('/equipment/bulk/:facilityId', async (req, res) => {
  try {
    const { facilityId } = req.params;
    const { equipments } = req.body;

    if (!Array.isArray(equipments)) {
      return res.status(400).json({ error: 'Geçersiz veri formatı.' });
    }

    const createdEquipments = [];

    for (const eq of equipments) {
      // Find or create company
      let companyId = null;
      if (eq.firma) {
        let company = await prisma.fireEquipmentCompany.findFirst({
          where: { facilityId, name: eq.firma }
        });
        if (!company) {
          company = await prisma.fireEquipmentCompany.create({
            data: { facilityId, name: eq.firma }
          });
        }
        companyId = company.id;
      }

      // Find location by block, floor, unit, description
      let locationId = null;
      if (eq.blok || eq.kat || eq.birim || eq.mahal) {
        let location = await prisma.hazmatDepartment.findFirst({
          where: {
            facilityId,
            building: eq.blok || null,
            floor: eq.kat || null,
            name: eq.birim || null,
            description: eq.mahal || null
          }
        });
        
        if (!location) {
          location = await prisma.hazmatDepartment.create({
            data: {
              facilityId,
              building: eq.blok || null,
              floor: eq.kat || null,
              name: eq.birim || null,
              description: eq.mahal || null
            }
          });
        }
        locationId = location.id;
      }

      // Find Subcategory
      let categoryId = null;
      if (eq.kategori && eq.alt_kategori) {
        const cat = await prisma.fireEquipmentCategory.findFirst({
          where: { name: eq.alt_kategori }
        });
        if (cat) categoryId = cat.id;
      } else if (eq.kategori) {
        const cat = await prisma.fireEquipmentCategory.findFirst({
          where: { name: eq.kategori, parentId: null }
        });
        if (cat) categoryId = cat.id;
      }

      if (!categoryId) {
        continue; // Skip if no category could be matched
      }

      // Dates
      let dolumTarihi = eq.dolum_tarihi ? new Date(eq.dolum_tarihi) : null;
      let imalTarihi = eq.imal_tarihi ? new Date(eq.imal_tarihi) : null;
      
      if (!imalTarihi && dolumTarihi) {
        const year = dolumTarihi.getFullYear();
        if (year === 2025) {
          imalTarihi = new Date(dolumTarihi);
          imalTarihi.setFullYear(year - 1);
        } else if (year === 2026) {
          imalTarihi = new Date(dolumTarihi);
          imalTarihi.setFullYear(year - 2);
        }
      }

      let nextMaintenanceDate = null;
      if (dolumTarihi) {
        nextMaintenanceDate = new Date(dolumTarihi);
        nextMaintenanceDate.setFullYear(nextMaintenanceDate.getFullYear() + 1);
      }

      let kapasite = eq.kapasite;
      if (kapasite) {
        let capStr = String(kapasite).toLowerCase().replace(/kg/g, '').replace(/[^0-9]/g, '');
        if (capStr) {
          kapasite = `${capStr} kg`;
        }
      }

      let manometre = eq.manometre;
      if (manometre) {
        const m = String(manometre).toLowerCase().trim();
        if (m === 'var' || m === 'yok') {
          manometre = m.charAt(0).toUpperCase() + m.slice(1);
        }
      }

      const inventoryData = {
        lastMaintenanceDate: dolumTarihi ? dolumTarihi.toISOString() : undefined,
        Açıklama: eq.not || undefined,
        Kapasite: kapasite || undefined,
        Manometre: manometre || undefined,
        "Kullanım Tipi": "Taşınabilir"
      };

      let initialStatus = 'AKTIF';
      const ekipmanNo = eq.ekipman_no ? String(eq.ekipman_no).toUpperCase() : '';
      if (ekipmanNo.includes('YSC-YDK-')) {
        initialStatus = 'DEPODA';
      }

      const newEq = await prisma.fireEquipment.create({
        data: {
          facilityId,
          categoryId,
          locationId,
          companyId,
          equipmentNo: eq.ekipman_no || `YT-${Math.floor(Math.random()*10000)}`,
          productionDate: imalTarihi,
          nextMaintenanceDate,
          capacity: kapasite ? String(kapasite) : null,
          responsibleUnit: eq.sorumlu_departman || null,
          inventoryData,
          status: initialStatus,
          notes: eq.not ? String(eq.not) : null
        }
      });
      createdEquipments.push(newEq);
    }

    res.json({ message: `${createdEquipments.length} ekipman başarıyla eklendi.`, count: createdEquipments.length });
  } catch (error) {
    console.error('Error bulk importing equipment:', error);
    res.status(500).json({ error: 'Toplu ekleme sırasında hata oluştu.' });
  }
});

router.post('/equipment/bulk-dolap/:facilityId', async (req, res) => {
  try {
    const { facilityId } = req.params;
    const { equipments } = req.body;

    if (!Array.isArray(equipments)) {
      return res.status(400).json({ error: 'Geçersiz veri formatı.' });
    }

    const createdEquipments = [];

    for (const eq of equipments) {
      let companyId = null;
      if (eq.firma) {
        let company = await prisma.fireEquipmentCompany.findFirst({ where: { facilityId, name: eq.firma } });
        if (!company) {
          company = await prisma.fireEquipmentCompany.create({ data: { facilityId, name: eq.firma } });
        }
        companyId = company.id;
      }

      let locationId = null;
      if (eq.blok || eq.kat || eq.birim || eq.mahal) {
        let location = await prisma.hazmatDepartment.findFirst({
          where: {
            facilityId,
            building: eq.blok || null,
            floor: eq.kat || null,
            name: eq.birim || null,
            description: eq.mahal || null
          }
        });
        if (!location) {
          location = await prisma.hazmatDepartment.create({
            data: {
              facilityId,
              building: eq.blok || null,
              floor: eq.kat || null,
              name: eq.birim || null,
              description: eq.mahal || null
            }
          });
        }
        locationId = location.id;
      }

      let categoryId = null;
      if (eq.kategori && eq.alt_kategori) {
        const cat = await prisma.fireEquipmentCategory.findFirst({ where: { name: eq.alt_kategori } });
        if (cat) categoryId = cat.id;
      } else if (eq.kategori) {
        const cat = await prisma.fireEquipmentCategory.findFirst({ where: { name: eq.kategori, parentId: null } });
        if (cat) categoryId = cat.id;
      }

      if (!categoryId) {
        continue;
      }

      const imalTarihi = eq.imal_yili ? new Date(String(eq.imal_yili)) : null;
      
      const inventoryData = {
        "Hortum Tipi": eq.hortum_tipi || undefined,
        "Hortum Uzunluğu": eq.hortum_uzunlugu || undefined,
        "Hortum Çapı": eq.hortum_capi || undefined,
        "Nozzle Çapı": eq.nozzle_capi || undefined,
        "Çalışma Basıncı": eq.calisma_basinci || undefined,
        "Debi": eq.debi || undefined,
        "Vana Tipi": eq.vana_tipi || undefined,
        "Kapak Tipi": eq.kapak_tipi || undefined,
        "Not": eq.not || undefined,
      };

      const newEq = await prisma.fireEquipment.create({
        data: {
          facilityId, categoryId, locationId, companyId,
          equipmentNo: eq.ekipman_no || `YD-${Math.floor(Math.random()*10000)}`,
          productionDate: imalTarihi,
          responsibleUnit: eq.sorumlu_departman || null,
          brand: eq.marka || null,
          inventoryData,
          status: 'AKTIF',
          notes: eq.not ? String(eq.not) : null
        }
      });
      createdEquipments.push(newEq);
    }
    res.json({ message: `${createdEquipments.length} adet yangın dolabı başarıyla eklendi.` });
  } catch (error) {
    console.error('Bulk Import Error:', error);
    res.status(500).json({ error: 'Toplu ekleme sırasında bir hata oluştu.' });
  }
});
router.post('/equipment/bulk-alarm/:facilityId', async (req, res) => {
  try {
    const { facilityId } = req.params;
    const { equipments } = req.body;
    if (!Array.isArray(equipments)) return res.status(400).json({ error: 'Geçersiz veri formatı.' });

    const createdEquipments = [];
    for (const eq of equipments) {
      if (!eq.ekipman_no || !eq.kategori) continue;

      let locationId = null;
      if (eq.blok || eq.kat || eq.birim || eq.mahal) {
        let loc = await prisma.hazmatDepartment.findFirst({
          where: {
            facilityId,
            building: eq.blok || null,
            floor: eq.kat || null,
            department: eq.birim || null,
            name: eq.mahal || null
          }
        });
        if (!loc) {
          loc = await prisma.hazmatDepartment.create({
            data: {
              facilityId,
              building: eq.blok || null,
              floor: eq.kat || null,
              department: eq.birim || null,
              name: eq.mahal || null,
              isActive: true
            }
          });
        }
        locationId = loc.id;
      }

      let companyId = null;
      if (eq.firma) {
        let comp = await prisma.fireEquipmentCompany.findFirst({
          where: { facilityId, name: eq.firma }
        });
        if (!comp) {
          comp = await prisma.fireEquipmentCompany.create({
            data: { facilityId, name: eq.firma, isActive: true }
          });
        }
        companyId = comp.id;
      }

      let categoryId = null;
      if (eq.kategori && eq.alt_kategori) {
        const cat = await prisma.fireEquipmentCategory.findFirst({ where: { name: eq.alt_kategori } });
        if (cat) categoryId = cat.id;
      } else if (eq.kategori) {
        const cat = await prisma.fireEquipmentCategory.findFirst({ where: { name: eq.kategori, parentId: null } });
        if (cat) categoryId = cat.id;
      }
      if (!categoryId) continue;

      let imalTarihi = null;
      if (eq.imal_yili) {
        imalTarihi = new Date(`${eq.imal_yili}-01-01`);
        if (isNaN(imalTarihi.getTime())) imalTarihi = null;
      }

      const inventoryData = {
        "Çalışma Prensibi": eq.calisma_prensibi || undefined,
        "Buton Tipi": eq.buton_tipi || undefined,
        "Koruma Kapağı": eq.koruma_kapagi || undefined,
        "Kullanım Alanı": eq.kullanım_alani || undefined,
        "Yangın Paneli Entegrasyonu": eq.yangin_paneli_entegrasyonu || undefined,
        "Test Anahtarı": eq.test_anahtari || undefined,
        "Not": eq.not || undefined,
      };

      const newEq = await prisma.fireEquipment.create({
        data: {
          facilityId, categoryId, locationId, companyId,
          equipmentNo: eq.ekipman_no || `AB-${Math.floor(Math.random()*10000)}`,
          productionDate: imalTarihi,
          responsibleUnit: eq.sorumlu_departman || null,
          brand: eq.marka || null,
          model: eq.model || null,
          inventoryData,
          status: 'AKTIF',
          notes: eq.not ? String(eq.not) : null
        }
      });
      createdEquipments.push(newEq);
    }
    res.json({ message: `${createdEquipments.length} adet alarm butonu başarıyla eklendi.` });
  } catch (error) {
    console.error('Bulk Import Error:', error);
    res.status(500).json({ error: 'Toplu ekleme sırasında bir hata oluştu.' });
  }
});

router.post('/equipment/:facilityId', async (req, res) => {
  try {
    const { facilityId } = req.params;
    const { 
      equipmentNo, qrCode, serialNo, brand, model, productionDate, lastMaintenanceDate,
      categoryId, locationId, capacity, standard, criticality, responsibleId, companyId, responsibleUnit, status,
      inventoryData
    } = req.body;
    
    // Clean empty strings to undefined/null for Prisma
    const cleanLocationId = locationId === '' ? undefined : locationId;
    const cleanCompanyId = companyId === '' ? null : companyId;
    
    // @ts-ignore - Assuming req.user is set by authMiddleware
    const username = req.user?.username || 'System';

    const finalQrCode = qrCode || `EQP-${uuidv4().substring(0,8).toUpperCase()}`;

    // Calculate initial nextMaintenanceDate based on category and lastMaintenanceDate
    let nextMaintenanceDate = null;
    const category = await prisma.fireEquipmentCategory.findUnique({ where: { id: categoryId } });
    if (category && category.maintenanceFrequency) {
      const freq = category.maintenanceFrequency;
      const date = lastMaintenanceDate ? new Date(lastMaintenanceDate) : new Date();
      if (freq === 'AYLIK') date.setMonth(date.getMonth() + 1);
      else if (freq === '3_AYLIK') date.setMonth(date.getMonth() + 3);
      else if (freq === '6_AYLIK') date.setMonth(date.getMonth() + 6);
      else if (freq === 'YILLIK') date.setFullYear(date.getFullYear() + 1);
      nextMaintenanceDate = date;
    } else if (lastMaintenanceDate) {
      // Default to 1 year if no category freq is set but lastMaintenanceDate is provided
      const date = new Date(lastMaintenanceDate);
      date.setFullYear(date.getFullYear() + 1);
      nextMaintenanceDate = date;
    }

    // Preserve lastMaintenanceDate in inventoryData
    const finalInventoryData = inventoryData ? { ...inventoryData } : {};
    if (lastMaintenanceDate) {
      finalInventoryData.lastMaintenanceDate = lastMaintenanceDate;
    }

    const equipment = await prisma.fireEquipment.create({
      data: {
        facilityId,
        equipmentNo,
        qrCode: finalQrCode,
        serialNo,
        brand,
        model,
        productionDate: productionDate ? new Date(productionDate) : null,
        categoryId,
        locationId: cleanLocationId,
        capacity,
        standard,
        criticality,
        responsibleId,
        companyId: cleanCompanyId,
        responsibleUnit,
        inventoryData: finalInventoryData,
        status: status || 'AKTIF',
        nextMaintenanceDate,
        movements: cleanLocationId ? {
          create: {
            newLocationId: cleanLocationId,
            reason: 'İlk Kayıt',
            movedBy: username,
            description: 'Ekipman sisteme eklendi ve ilk konumu belirlendi.'
          }
        } : undefined
      }
    });
    
    res.status(201).json(equipment);
  } catch (error) {
    console.error('Error creating equipment:', error);
    res.status(500).json({ error: 'Ekipman oluşturulamadı. Aynı Ekipman No veya QR kod kullanılıyor olabilir.' });
  }
});

router.delete('/equipment/bulk/:facilityId', async (req, res) => {
  try {
    const { facilityId } = req.params;
    const { categoryId } = req.query;

    if (!categoryId) {
      return res.status(400).json({ error: 'Kategori ID gereklidir.' });
    }

    // Include subcategories too
    const subcats = await prisma.fireEquipmentCategory.findMany({
      where: { parentId: categoryId as string }
    });
    const catIds = [categoryId as string, ...subcats.map(c => c.id)];

    await prisma.fireEquipment.deleteMany({
      where: {
        facilityId,
        categoryId: { in: catIds }
      }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error bulk deleting equipment:', error);
    res.status(500).json({ error: 'Toplu silme başarısız oldu.' });
  }
});
router.delete('/equipment/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.fireEquipment.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting equipment:', error);
    res.status(500).json({ error: 'Ekipman silinemedi.' });
  }
});

router.put('/equipment/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    
    if (data.productionDate === "") data.productionDate = null;
    else if (data.productionDate) data.productionDate = new Date(data.productionDate);

    if (data.lastMaintenanceDate === "") {
      delete data.lastMaintenanceDate;
    } else if (data.lastMaintenanceDate) {
      const date = new Date(data.lastMaintenanceDate);
      // Try to fetch category to get freq
      const equipment = await prisma.fireEquipment.findUnique({ where: { id }, include: { category: true } });
      const freq = equipment?.category?.maintenanceFrequency;
      if (freq === 'AYLIK') date.setMonth(date.getMonth() + 1);
      else if (freq === '3_AYLIK') date.setMonth(date.getMonth() + 3);
      else if (freq === '6_AYLIK') date.setMonth(date.getMonth() + 6);
      else date.setFullYear(date.getFullYear() + 1);
      
      data.nextMaintenanceDate = date;
      
      // Update inventoryData
      const invData = typeof data.inventoryData === 'object' && data.inventoryData !== null ? data.inventoryData : (equipment?.inventoryData || {});
      data.inventoryData = { ...(invData as any), lastMaintenanceDate: data.lastMaintenanceDate };
      delete data.lastMaintenanceDate;
    }
    
    // Temizlik: Relational objeleri sil ki Prisma update hata vermesin
    delete data.category;
    delete data.location;
    delete data.responsible;
    delete data.company;
    delete data.movements;
    delete data.maintenances;
    delete data.facility;
    delete data.subcategoryId; // Frontend gönderebilir, DB'de yok
    delete data.id; // Sil, bazen id update hata verir veya string gelir
    delete data.createdAt;
    delete data.updatedAt;
    
    if (data.locationId === "") data.locationId = null;

    console.log("UPDATING EQUIPMENT", id, data);

    const equipment = await prisma.fireEquipment.update({
      where: { id },
      data
    });
    
    res.json(equipment);
  } catch (error) {
    console.error('Error updating equipment:', error);
    res.status(500).json({ error: 'Ekipman güncellenemedi.' });
  }
});

// --- MAINTENANCE ---
router.post('/equipment/:id/maintenance', upload.single('attachment'), async (req, res) => {
  try {
    const { id } = req.params;
    const { maintenanceDate, companyId, company, technician, result, description, nextMaintenanceDate, maintenanceData, equipmentStatus } = req.body;

    let attachmentUrl = null;
    if (req.file) {
      attachmentUrl = `/uploads/${req.file.filename}`;
    }

    let maintenanceDataParsed = null;
    if (maintenanceData) {
      try {
        maintenanceDataParsed = typeof maintenanceData === 'string' ? JSON.parse(maintenanceData) : maintenanceData;
      } catch (e) {
        console.error('Error parsing maintenanceData:', e);
      }
    }

    const maintenance = await prisma.$transaction(async (tx) => {
      // Create maintenance record
      const record = await tx.fireEquipmentMaintenance.create({
        data: {
          equipmentId: id as string,
          maintenanceDate: new Date(maintenanceDate as string),
          companyId: (companyId as string) || null,
          company: company as string,
          technician: technician as string,
          result: result as string,
          description: description as string,
          maintenanceData: maintenanceDataParsed,
          attachmentUrl
        }
      });

      // Calculate nextMaintenanceDate if not provided explicitly, based on frequency
      let calculatedNextDate = nextMaintenanceDate ? new Date(nextMaintenanceDate as string) : null;
      if (!calculatedNextDate) {
        const eq = await tx.fireEquipment.findUnique({ 
          where: { id: id as string },
          include: { category: true }
        }) as any;
        if (eq?.category?.maintenanceFrequency) {
          const freq = eq.category.maintenanceFrequency;
          const date = new Date(maintenanceDate as string);
          if (freq === 'AYLIK') date.setMonth(date.getMonth() + 1);
          else if (freq === '3_AYLIK') date.setMonth(date.getMonth() + 3);
          else if (freq === '6_AYLIK') date.setMonth(date.getMonth() + 6);
          else if (freq === 'YILLIK') date.setFullYear(date.getFullYear() + 1);
          calculatedNextDate = date;
        }
      }

      const updateData: any = {};
      if (calculatedNextDate) updateData.nextMaintenanceDate = calculatedNextDate;
      if (equipmentStatus) updateData.status = equipmentStatus as string;

      // Update equipment next maintenance date and status
      if (Object.keys(updateData).length > 0) {
        await tx.fireEquipment.update({
          where: { id: id as string },
          data: updateData
        });
      }

      return record;
    });

    res.status(201).json(maintenance);
  } catch (error) {
    console.error('Error creating maintenance:', error);
    res.status(500).json({ error: 'Bakım kaydı oluşturulamadı.' });
  }
});

// --- MOVEMENTS ---
router.post('/equipment/:id/movement', async (req, res) => {
  try {
    const { id } = req.params;
    const { newLocationId, reason, description } = req.body;
    
    // @ts-ignore
    const username = req.user?.username || 'System';

    // Get current equipment to find old location
    const currentEquipment = await prisma.fireEquipment.findUnique({ where: { id }});
    if (!currentEquipment) {
      return res.status(404).json({ error: 'Ekipman bulunamadı.' });
    }

    const movement = await prisma.$transaction(async (tx) => {
      // Create movement record
      const record = await tx.fireEquipmentMovement.create({
        data: {
          equipmentId: id,
          oldLocationId: currentEquipment.locationId,
          newLocationId,
          reason,
          movedBy: username,
          description
        }
      });

      // Update equipment location
      await tx.fireEquipment.update({
        where: { id },
        data: { locationId: newLocationId }
      });

      return record;
    });

    res.status(201).json(movement);
  } catch (error) {
    console.error('Error creating movement:', error);
    res.status(500).json({ error: 'Hareket kaydı oluşturulamadı.' });
  }
});
// --- SWAP (DEĞİŞİM) ---
router.post('/equipment/:id/swap', async (req, res) => {
  try {
    const { id } = req.params;
    const { replacementEquipmentId, brokenStatus = 'ARIZALI', isReverseSwap = false } = req.body;
    
    // @ts-ignore
    const username = req.user?.username || 'System';

    const currentEquipment = await prisma.fireEquipment.findUnique({ where: { id }});
    if (!currentEquipment) {
      return res.status(404).json({ error: 'Mevcut ekipman bulunamadı.' });
    }

    const replacementEquipment = await prisma.fireEquipment.findUnique({ where: { id: replacementEquipmentId }});
    if (!replacementEquipment) {
      return res.status(404).json({ error: 'Yedek ekipman bulunamadı.' });
    }

    // Determine target location for the old equipment
    const targetLocName = isReverseSwap ? 'Merkez Depo' : 'Arıza Deposu / Hurdalık';
    const targetStatus = isReverseSwap ? 'DEPODA' : brokenStatus;

    let targetLocation = await prisma.hazmatDepartment.findFirst({
      where: { facilityId: currentEquipment.facilityId, name: 'HURDA/KULLANIM DIŞI DEPOT' }
    });

    if (!targetLocation) {
      targetLocation = await prisma.hazmatDepartment.create({
        data: {
          facilityId: currentEquipment.facilityId,
          name: 'HURDA/KULLANIM DIŞI DEPOT',
          description: 'Otomatik oluşturulan hurda/kullanım dışı alanı'
        }
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update replacement equipment to AKTIF and move to old location
      const newEq = await tx.fireEquipment.update({
        where: { id: replacementEquipmentId },
        data: { 
          status: 'AKTIF', 
          locationId: currentEquipment.locationId 
        }
      });

      // 2. Create movement for new equipment
      await tx.fireEquipmentMovement.create({
        data: {
          equipmentId: replacementEquipmentId,
          oldLocationId: replacementEquipment.locationId,
          newLocationId: currentEquipment.locationId,
          reason: 'Değişim (Swap) - Yeni',
          movedBy: username,
          description: `Arızalanan ${currentEquipment.equipmentNo} yerine sahaya alındı.`
        }
      });

      // 3. Update old equipment to targetStatus and move to target location
      const oldEq = await tx.fireEquipment.update({
        where: { id },
        data: { 
          status: targetStatus, 
          locationId: targetLocation.id 
        }
      });

      // 4. Create movement for old equipment
      await tx.fireEquipmentMovement.create({
        data: {
          equipmentId: id,
          oldLocationId: currentEquipment.locationId,
          newLocationId: targetLocation.id,
          reason: isReverseSwap ? 'Değişim (Swap) - İade' : `Değişim (Swap) - ${targetStatus}`,
          movedBy: username,
          description: `Yerine ${replacementEquipment.equipmentNo} yerleştirilerek ${targetLocName}'ya alındı.`
        }
      });

      return { oldEq, newEq };
    });

    res.status(200).json(result);
  } catch (error) {
    console.error('Error swapping equipment:', error);
    res.status(500).json({ error: 'Ekipman değişimi sırasında bir hata oluştu.' });
  }
});

// --- MAINTENANCE ---
router.get('/maintenances/:facilityId', async (req, res) => {
  try {
    const { facilityId } = req.params;
    const maintenances = await prisma.fireEquipmentMaintenance.findMany({
      where: {
        equipment: {
          facilityId
        }
      },
      include: {
        equipment: {
          include: {
            category: true,
            location: true,
            responsible: true
          }
        }
      },
      orderBy: { maintenanceDate: 'desc' }
    });
    res.json(maintenances);
  } catch (error) {
    console.error('Error fetching maintenances:', error);
    res.status(500).json({ error: 'Bakımlar alınamadı.' });
  }
});

router.post('/maintenances', async (req, res) => {
  try {
    const { equipmentId, maintenanceDate, company, technician, result, description } = req.body;
    
    // Create maintenance record
    const maintenance = await prisma.fireEquipmentMaintenance.create({
      data: {
        equipmentId,
        maintenanceDate: new Date(maintenanceDate),
        company,
        technician,
        result,
        description
      }
    });

    // Update equipment's nextMaintenanceDate
    const equipment = await prisma.fireEquipment.findUnique({
      where: { id: equipmentId },
      include: { category: true }
    });

    if (equipment && equipment.category && equipment.category.maintenanceFrequency !== 'none') {
      const nextDate = new Date(maintenanceDate);
      switch (equipment.category.maintenanceFrequency) {
        case 'AYLIK': nextDate.setMonth(nextDate.getMonth() + 1); break;
        case '3_AYLIK': nextDate.setMonth(nextDate.getMonth() + 3); break;
        case '6_AYLIK': nextDate.setMonth(nextDate.getMonth() + 6); break;
        case 'YILLIK': nextDate.setFullYear(nextDate.getFullYear() + 1); break;
      }
      await prisma.fireEquipment.update({
        where: { id: equipmentId },
        data: { nextMaintenanceDate: nextDate }
      });
    }

    res.status(201).json(maintenance);
  } catch (error) {
    console.error('Error creating maintenance:', error);
    res.status(500).json({ error: 'Bakım oluşturulamadı.' });
  }
});

// --- RETURN FROM SERVICE ---
router.post('/equipment/:id/return-from-service', async (req, res) => {
  try {
    const { id } = req.params;
    // @ts-ignore
    const username = req.user?.username || 'System';

    const currentEquipment = await prisma.fireEquipment.findUnique({
      where: { id },
      include: { category: true }
    });

    if (!currentEquipment) {
      return res.status(404).json({ error: 'Ekipman bulunamadı.' });
    }

    // Set next maintenance date to 1 year from now
    const nextDate = new Date();
    nextDate.setFullYear(nextDate.getFullYear() + 1);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update equipment status and nextMaintenanceDate
      const updatedEquipment = await tx.fireEquipment.update({
        where: { id },
        data: {
          status: 'DEPODA',
          nextMaintenanceDate: nextDate
        }
      });

      // 2. Log movement
      await tx.fireEquipmentMovement.create({
        data: {
          equipmentId: id,
          oldLocationId: currentEquipment.locationId,
          newLocationId: currentEquipment.locationId, // usually null since it was in depot
          reason: 'Servisten Döndü',
          movedBy: username,
          description: 'Cihaz servisten döndü ve depoya sağlam olarak alındı.'
        }
      });

      return updatedEquipment;
    });

    res.json(result);
  } catch (error) {
    console.error('Error returning from service:', error);
    res.status(500).json({ error: 'Servis dönüş işlemi yapılamadı.' });
  }
});

export default router;
