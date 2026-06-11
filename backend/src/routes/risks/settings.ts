import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Helper to check facility access
async function checkFacilityAccess(req: Request, facilityId: string): Promise<boolean> {
  // @ts-ignore
  const user = req.user;
  if (!user) return false;
  if (user.isAdmin || user.isManagement) return true;
  
  const access = await prisma.userFacility.findUnique({
    where: {
      username_facilityId: {
        username: user.username,
        facilityId: facilityId
      }
    }
  });
  return !!access;
}

// Helper to generate a 3-letter code from a department name
function generateDeptCode(name: string): string {
  const charMap: Record<string, string> = {
    'ı': 'i', 'i': 'i', 'ş': 's', 'ğ': 'g', 'ü': 'u', 'ö': 'o', 'ç': 'c',
    'I': 'I', 'İ': 'I', 'Ş': 'S', 'Ğ': 'G', 'Ü': 'U', 'Ö': 'O', 'Ç': 'C'
  };
  const str = name.replace(/[ıişğüöçIİŞĞÜÖÇ]/g, (m) => charMap[m]);
  return str.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase() || 'GEN';
}

// Default initializer helper
async function initializeFacilityRiskSettings(facilityId: string) {
  const deptCount = await prisma.riskDepartmentSetting.count({ where: { facilityId } });
  const catCount = await prisma.riskCategorySetting.count({ where: { facilityId } });
  const hdeptCount = await prisma.riskDepartment.count({ where: { facilityId } });
  
  if (deptCount > 0 || catCount > 0 || hdeptCount > 0) {
    return;
  }

  // 1. Default Hastane Bölümleri (RiskDepartment)
  const defaultHospitalDepts = ['Acil Servis', 'Yatan Hasta Servisi', 'Yetişkin Yoğun Bakım'];
  for (const name of defaultHospitalDepts) {
    await prisma.riskDepartment.upsert({
      where: { facilityId_name: { facilityId, name } },
      update: {},
      create: { facilityId, name, code: generateDeptCode(name) }
    });
  }

  // 2. Default Departmanlar (RiskDepartmentSetting)
  const defaultDepts = [
    'Başhekimlik',
    'Bilgi Sistemleri Müdürlüğü',
    'Biyomedikal Müdürlüğü',
    'Hasta Bakım Hizmetleri Müdürlüğü',
    'İnsan Kaynakları Müdürlüğü',
    'İş Sağlığı ve Güvenliği',
    'Kalite Müdürlüğü',
    'Misafir Hizmetleri Müdürlüğü',
    'Otelcilik ve Destek Hizmetleri Müdürlüğü',
    'Teknik Hizmetler Müdürlüğü',
    'Satınalma Müdürlüğü',
    'Üst Yönetim',
    'Diğer'
  ];
  for (const name of defaultDepts) {
    await prisma.riskDepartmentSetting.upsert({
      where: { facilityId_name: { facilityId, name } },
      update: {},
      create: { facilityId, name }
    });
  }

  // 3. Default Kategoriler ve Alt Kategoriler
  const defaultCategories = [
    {
      name: 'Tıbbi Hizmetler',
      subs: [
        'Hizmete erişim ile ilgili riskler',
        'Hasta kabul süreci ile ilgili riskler',
        'Tanı süreci ile ilgili riskler',
        'Tedavi ve rehabilitasyon süreci ile ilgili riskler',
        'Takip ve taburculuk süreci ile ilgili riskler',
        'Tıbbi kayıt ve arşiv süreci ile ilgili riskler'
      ]
    },
    {
      name: 'Yönetsel Hizmetler',
      subs: [
        'İdari süreçler ile ilgili riskler',
        'Finansal süreçler ile ilgili riskler',
        'İtibar yönetimi',
        'Paydaşlarla iletişim süreçlerine yönelik riskler',
        'Bilgi yönetimi süreçleri ile ilgili riskler'
      ]
    },
    {
      name: 'Tesis Güvenliği',
      subs: [
        'Atık yönetimi sürecindeki riskler',
        'Tıbbi cihaz ve malzeme yönetimi süreci riskleri',
        'Diğer cihaz ve malzemelerin yönetim süreci riskleri',
        'Yangın Güvenliği ile ilgili riskler',
        'Altyapı Sistemleri ile ilgili riskler',
        'İnşaat ve Renovasyon ile ilgili riskler',
        'Acil Durum ve Afet Yönetimi ile ilgili riskler',
        'Emniyet ile ilgili riskler'
      ]
    },
    {
      name: 'Çevre Güvenliği',
      subs: [
        'Hava kirliliği oluşturabilecek unsurlar',
        'Atıkların çevreye zarar vermesi',
        'Çevreden hastaneye gelecek zararlar',
        'Tehlikeli atıklardan oluşabilecek zararlar'
      ]
    },
    {
      name: 'İş Sağlığı ve Güvenliği',
      subs: [
        'Güvenlik - Fiziksel Risk Etmenleri',
        'Güvenlik - Biyolojik Risk Etmenleri',
        'Güvenlik - Psikososyal Risk Etmenleri',
        'Güvenlik- Ergonomik Risk Etmenleri',
        'Tehlikeli Madde Yönetimi / Kimyasal Risk Etmenleri'
      ]
    }
  ];

  for (const cat of defaultCategories) {
    const createdCat = await prisma.riskCategorySetting.upsert({
      where: { facilityId_name: { facilityId, name: cat.name } },
      update: {},
      create: { facilityId, name: cat.name }
    });

    for (const subName of cat.subs) {
      await prisma.riskSubCategorySetting.upsert({
        where: { categoryId_name: { categoryId: createdCat.id, name: subName } },
        update: {},
        create: { categoryId: createdCat.id, name: subName }
      });
    }
  }
}

// GET /api/risks/settings?facilityId=xxx
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { facilityId } = req.query as Record<string, any>;
    if (!facilityId) {
      return res.status(400).json({ error: 'facilityId gereklidir.' });
    }

    const hasAccess = await checkFacilityAccess(req, facilityId as string);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Bu tesis için yetkiniz yok.' });
    }

    // Initialize defaults if they don't exist yet
    await initializeFacilityRiskSettings(facilityId as string);

    const [departments, categories] = await Promise.all([
      prisma.riskDepartmentSetting.findMany({
        where: { facilityId: facilityId as string },
        orderBy: { name: 'asc' }
      }),
      prisma.riskCategorySetting.findMany({
        where: { facilityId: facilityId as string },
        include: { subCategories: { orderBy: { name: 'asc' } } },
        orderBy: { name: 'asc' }
      })
    ]);

    res.json({ departments, categories });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Ayarlar yüklenemedi.' });
  }
});

// POST /api/risks/settings/departments
router.post('/departments', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { facilityId, name } = req.body;
    if (!facilityId || !name) {
      return res.status(400).json({ error: 'facilityId ve name gereklidir.' });
    }

    const hasAccess = await checkFacilityAccess(req, facilityId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Bu tesis için yetkiniz yok.' });
    }

    const existing = await prisma.riskDepartmentSetting.findUnique({
      where: { facilityId_name: { facilityId, name } }
    });
    if (existing) {
      return res.status(400).json({ error: 'Bu departman zaten mevcut.' });
    }

    const dept = await prisma.riskDepartmentSetting.create({
      data: { facilityId, name }
    });
    res.status(201).json(dept);
  } catch (error) {
    console.error('Create department setting error:', error);
    res.status(500).json({ error: 'Departman eklenemedi.' });
  }
});

// PUT /api/risks/settings/departments/:id
router.put('/departments/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'name gereklidir.' });
    }

    const dept = await prisma.riskDepartmentSetting.findUnique({ where: { id } });
    if (!dept) return res.status(404).json({ error: 'Departman bulunamadı.' });

    const hasAccess = await checkFacilityAccess(req, dept.facilityId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Bu tesis için yetkiniz yok.' });
    }

    const updated = await prisma.riskDepartmentSetting.update({
      where: { id },
      data: { name }
    });
    res.json(updated);
  } catch (error) {
    console.error('Update department setting error:', error);
    res.status(500).json({ error: 'Departman güncellenemedi.' });
  }
});

// DELETE /api/risks/settings/departments/:id
router.delete('/departments/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const dept = await prisma.riskDepartmentSetting.findUnique({ where: { id } });
    if (!dept) return res.status(404).json({ error: 'Departman bulunamadı.' });

    const hasAccess = await checkFacilityAccess(req, dept.facilityId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Bu tesis için yetkiniz yok.' });
    }

    await prisma.riskDepartmentSetting.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete department setting error:', error);
    res.status(500).json({ error: 'Departman silinemedi.' });
  }
});

// POST /api/risks/settings/categories
router.post('/categories', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { facilityId, name } = req.body;
    if (!facilityId || !name) {
      return res.status(400).json({ error: 'facilityId ve name gereklidir.' });
    }

    const hasAccess = await checkFacilityAccess(req, facilityId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Bu tesis için yetkiniz yok.' });
    }

    const existing = await prisma.riskCategorySetting.findUnique({
      where: { facilityId_name: { facilityId, name } }
    });
    if (existing) {
      return res.status(400).json({ error: 'Bu kategori zaten mevcut.' });
    }

    const cat = await prisma.riskCategorySetting.create({
      data: { facilityId, name }
    });
    res.status(201).json(cat);
  } catch (error) {
    console.error('Create category setting error:', error);
    res.status(500).json({ error: 'Kategori eklenemedi.' });
  }
});

// PUT /api/risks/settings/categories/:id
router.put('/categories/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'name gereklidir.' });
    }

    const cat = await prisma.riskCategorySetting.findUnique({ where: { id } });
    if (!cat) return res.status(404).json({ error: 'Kategori bulunamadı.' });

    const hasAccess = await checkFacilityAccess(req, cat.facilityId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Bu tesis için yetkiniz yok.' });
    }

    const updated = await prisma.riskCategorySetting.update({
      where: { id },
      data: { name }
    });
    res.json(updated);
  } catch (error) {
    console.error('Update category setting error:', error);
    res.status(500).json({ error: 'Kategori güncellenemedi.' });
  }
});

// DELETE /api/risks/settings/categories/:id
router.delete('/categories/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const cat = await prisma.riskCategorySetting.findUnique({ where: { id } });
    if (!cat) return res.status(404).json({ error: 'Kategori bulunamadı.' });

    const hasAccess = await checkFacilityAccess(req, cat.facilityId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Bu tesis için yetkiniz yok.' });
    }

    await prisma.riskCategorySetting.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete category setting error:', error);
    res.status(500).json({ error: 'Kategori silinemedi.' });
  }
});

// POST /api/risks/settings/subcategories
router.post('/subcategories', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { categoryId, name } = req.body;
    if (!categoryId || !name) {
      return res.status(400).json({ error: 'categoryId ve name gereklidir.' });
    }

    const cat = await prisma.riskCategorySetting.findUnique({ where: { id: parseInt(categoryId) } });
    if (!cat) return res.status(404).json({ error: 'Kategori bulunamadı.' });

    const hasAccess = await checkFacilityAccess(req, cat.facilityId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Bu tesis için yetkiniz yok.' });
    }

    const existing = await prisma.riskSubCategorySetting.findUnique({
      where: { categoryId_name: { categoryId: parseInt(categoryId), name } }
    });
    if (existing) {
      return res.status(400).json({ error: 'Bu alt kategori zaten mevcut.' });
    }

    const sub = await prisma.riskSubCategorySetting.create({
      data: { categoryId: parseInt(categoryId), name }
    });
    res.status(201).json(sub);
  } catch (error) {
    console.error('Create subcategory setting error:', error);
    res.status(500).json({ error: 'Alt kategori eklenemedi.' });
  }
});

// PUT /api/risks/settings/subcategories/:id
router.put('/subcategories/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'name gereklidir.' });
    }

    const sub = await prisma.riskSubCategorySetting.findUnique({
      where: { id },
      include: { category: true }
    });
    if (!sub) return res.status(404).json({ error: 'Alt kategori bulunamadı.' });

    const hasAccess = await checkFacilityAccess(req, sub.category.facilityId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Bu tesis için yetkiniz yok.' });
    }

    const updated = await prisma.riskSubCategorySetting.update({
      where: { id },
      data: { name }
    });
    res.json(updated);
  } catch (error) {
    console.error('Update subcategory setting error:', error);
    res.status(500).json({ error: 'Alt kategori güncellenemedi.' });
  }
});

// DELETE /api/risks/settings/subcategories/:id
router.delete('/subcategories/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const sub = await prisma.riskSubCategorySetting.findUnique({
      where: { id },
      include: { category: true }
    });
    if (!sub) return res.status(404).json({ error: 'Alt kategori bulunamadı.' });

    const hasAccess = await checkFacilityAccess(req, sub.category.facilityId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Bu tesis için yetkiniz yok.' });
    }

    await prisma.riskSubCategorySetting.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete subcategory setting error:', error);
    res.status(500).json({ error: 'Alt kategori silinemedi.' });
  }
});

export default router;
