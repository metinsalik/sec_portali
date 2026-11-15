import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Units
router.get('/units', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const units = await prisma.hazmatUnit.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(units);
  } catch (error) {
    console.error('Error fetching units:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/units', authMiddleware, async (req: AuthRequest, res) => {
  const { name, symbol } = req.body;
  if (!name || !symbol) return res.status(400).json({ error: 'name and symbol are required' });

  try {
    const unit = await prisma.hazmatUnit.create({
      data: { name, symbol }
    });
    res.status(201).json(unit);
  } catch (error) {
    console.error('Error creating unit:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/units/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    await prisma.hazmatUnit.delete({ where: { id: req.params.id } });
    res.json({ message: 'Unit deleted successfully' });
  } catch (error) {
    console.error('Error deleting unit:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Locations / Departments
router.get('/departments', authMiddleware, async (req: AuthRequest, res) => {
  const { facilityId, isCleaningCart } = req.query as Record<string, any>;

  try {
    const whereClause: any = { isActive: true };
    if (facilityId && facilityId !== 'all' && facilityId !== 'ALL') {
      whereClause.facilityId = String(facilityId);
    }
    
    if (isCleaningCart === 'true') {
      whereClause.type = 'TEMIZLIK_ARABASI';
    }

    const locations = await prisma.facilityLocation.findMany({
      where: whereClause,
      include: {
        _count: {
          select: { hazmatMaterials: true }
        }
      },
      orderBy: [
        { building: 'asc' },
        { floor: 'asc' },
        { name: 'asc' },
        { description: 'asc' }
      ]
    });

    const mapped = locations.map((loc: any) => ({
      ...loc,
      _count: {
        ...(loc._count || {}),
        inventory: loc._count?.hazmatMaterials || 0
      },
      ...(isCleaningCart === 'true' ? { isCleaningCart: true } : {})
    }));
    
    return res.json(mapped);
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/departments', authMiddleware, async (req: AuthRequest, res) => {
  const { facilityId, name, building, floor, department, description, isCleaningCart } = req.body;
  if (!facilityId || facilityId === 'ALL') {
    return res.status(400).json({ error: 'Geçerli bir tesis seçilmelidir.' });
  }

  try {
    const trimmedName = name
      ? String(name).trim()
      : (isCleaningCart ? 'Bilinmeyen Araç' : 'Bilinmeyen Lokasyon');
    const targetType = isCleaningCart ? 'TEMIZLIK_ARABASI' : 'DEPARTMAN';

    const existing = await prisma.facilityLocation.findUnique({
      where: {
        facilityId_name: {
          facilityId,
          name: trimmedName
        }
      }
    });

    if (existing) {
      if (existing.isActive) {
        return res.status(400).json({ error: 'Bu isimde bir kayıt bu tesiste zaten mevcut.' });
      }

      const reactivated = await prisma.facilityLocation.update({
        where: { id: existing.id },
        data: {
          building: building || null,
          floor: floor || null,
          department: department || null,
          description: description || null,
          type: targetType,
          isActive: true
        }
      });

      return res.status(201).json(isCleaningCart ? { ...reactivated, isCleaningCart: true } : reactivated);
    }

    const newLocation = await prisma.facilityLocation.create({
      data: { 
        facilityId, 
        name: trimmedName, 
        building: building || null,
        floor: floor || null,
        department: department || null,
        description: description || null,
        type: targetType
      }
    });
    
    if (isCleaningCart) {
      return res.status(201).json({ ...newLocation, isCleaningCart: true });
    }
    return res.status(201).json(newLocation);
  } catch (error) {
    console.error('Error creating department:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/departments/:id', authMiddleware, async (req: AuthRequest, res) => {
  const { name, building, floor, department, description, isCleaningCart } = req.body;
  try {
    const updatedLoc = await prisma.facilityLocation.update({
      where: { id: req.params.id },
      data: { 
        name: name ? name.trim() : undefined, 
        building,
        floor,
        department,
        description 
      }
    });
    
    if (isCleaningCart || updatedLoc.type === 'TEMIZLIK_ARABASI') {
      return res.json({ ...updatedLoc, isCleaningCart: true });
    }
    return res.json(updatedLoc);
  } catch (error) {
    console.error('Error updating department:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/departments/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    await prisma.facilityLocation.update({
      where: { id: req.params.id },
      data: { isActive: false }
    });
    res.json({ message: 'Location deleted successfully' });
  } catch (error) {
    console.error('Error deleting location:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/departments/rename-node', authMiddleware, async (req: AuthRequest, res) => {
  res.status(400).json({ error: 'Bu islem artik kullanilmiyor' });
});

// Hazard Labels
router.get('/hazard-labels', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const labels = await prisma.hazmatHazardLabel.findMany({
      orderBy: { code: 'asc' }
    });
    res.json(labels);
  } catch (error) {
    console.error('Error fetching hazard labels:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/hazard-labels', authMiddleware, async (req: AuthRequest, res) => {
  const { code, name, description, imageUrl } = req.body;
  if (!code || !name) return res.status(400).json({ error: 'code and name are required' });

  try {
    const label = await prisma.hazmatHazardLabel.create({
      data: { code, name, description, imageUrl }
    });
    res.status(201).json(label);
  } catch (error) {
    console.error('Error creating hazard label:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/hazard-labels/:id', authMiddleware, async (req: AuthRequest, res) => {
  const { code, name, description, imageUrl } = req.body;
  try {
    const label = await prisma.hazmatHazardLabel.update({
      where: { id: req.params.id },
      data: { code, name, description, imageUrl }
    });
    res.json(label);
  } catch (error) {
    console.error('Error updating hazard label:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/hazard-labels/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    await prisma.hazmatHazardLabel.delete({ where: { id: req.params.id } });
    res.json({ message: 'Label deleted successfully' });
  } catch (error) {
    console.error('Error deleting hazard label:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ADR Labels
router.get('/adr-labels', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const labels = await prisma.hazmatAdrLabel.findMany({
      orderBy: { code: 'asc' }
    });
    res.json(labels);
  } catch (error) {
    console.error('Error fetching ADR labels:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/adr-labels', authMiddleware, async (req: AuthRequest, res) => {
  const { code, name, description, imageUrl } = req.body;
  if (!code || !name) return res.status(400).json({ error: 'code and name are required' });

  try {
    const label = await prisma.hazmatAdrLabel.create({
      data: { code, name, description, imageUrl }
    });
    res.status(201).json(label);
  } catch (error) {
    console.error('Error creating ADR label:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/adr-labels/:id', authMiddleware, async (req: AuthRequest, res) => {
  const { code, name, description, imageUrl } = req.body;
  try {
    const label = await prisma.hazmatAdrLabel.update({
      where: { id: req.params.id },
      data: { code, name, description, imageUrl }
    });
    res.json(label);
  } catch (error) {
    console.error('Error updating ADR label:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/adr-labels/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    await prisma.hazmatAdrLabel.delete({ where: { id: req.params.id } });
    res.json({ message: 'ADR Label deleted successfully' });
  } catch (error) {
    console.error('Error deleting ADR label:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PPEs
router.get('/ppes', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const ppes = await prisma.hazmatPpe.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(ppes);
  } catch (error) {
    console.error('Error fetching ppes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/ppes', authMiddleware, async (req: AuthRequest, res) => {
  const { name, description, imageUrl } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  try {
    const ppe = await prisma.hazmatPpe.create({
      data: { name, description, imageUrl }
    });
    res.status(201).json(ppe);
  } catch (error) {
    console.error('Error creating ppe:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/ppes/:id', authMiddleware, async (req: AuthRequest, res) => {
  const { name, description, imageUrl } = req.body;
  try {
    const ppe = await prisma.hazmatPpe.update({
      where: { id: req.params.id },
      data: { name, description, imageUrl }
    });
    res.json(ppe);
  } catch (error) {
    console.error('Error updating ppe:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/ppes/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    await prisma.hazmatPpe.delete({ where: { id: req.params.id } });
    res.json({ message: 'PPE deleted successfully' });
  } catch (error) {
    console.error('Error deleting ppe:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Categories
router.get('/categories', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const categories = await prisma.hazmatCategory.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/categories', authMiddleware, async (req: AuthRequest, res) => {
  const { name, scope, examples } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  try {
    const category = await prisma.hazmatCategory.create({
      data: { name, scope, examples }
    });
    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/categories/:id', authMiddleware, async (req: AuthRequest, res) => {
  const { name, scope, examples } = req.body;
  try {
    const category = await prisma.hazmatCategory.update({
      where: { id: req.params.id },
      data: { name, scope, examples }
    });
    res.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/categories/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    await prisma.hazmatCategory.delete({ where: { id: req.params.id } });
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- INCIDENT TYPES ---
const DEFAULT_HAZMAT_INCIDENT_TYPES: { name: string; description: string }[] = [
  { name: 'Sızıntı', description: 'Maddenin kap, vana, boru veya ekipmandan kontrolsüz çıkması' },
  { name: 'Dökülme', description: 'Maddenin zemine veya başka bir yüzeye yayılması' },
  { name: 'Vücuda sıçrama / temas', description: 'Maddenin cilde, göze veya vücudun başka bir bölümüne temas etmesi' },
  { name: 'Solunum yoluyla maruziyet', description: 'Gaz, buhar, duman, sis veya tozun solunması' },
  { name: 'Yutma / ağız yoluyla maruziyet', description: 'Maddenin yanlışlıkla ağız yoluyla alınması' },
  { name: 'Gaz veya buhar salınımı', description: 'Maddenin gaz veya buhar olarak ortama kontrolsüz yayılması' },
  { name: 'Toz veya aerosol yayılımı', description: 'Katı parçacıkların, sisin veya aerosolün ortama yayılması' },
  { name: 'Yangın', description: 'Tehlikeli maddenin veya bulunduğu alanın yanması' },
  { name: 'Patlama / parlama', description: 'Patlama veya ani alevlenme meydana gelmesi' },
  { name: 'Kontrolsüz kimyasal reaksiyon', description: 'Beklenmeyen ısınma, köpürme, gaz çıkışı veya benzeri reaksiyon' },
  { name: 'Basınç kaynaklı olay', description: 'Basınç artışı, kap veya tüpün hasar görmesi ya da basınçlı salınım' },
  { name: 'Kap / ambalaj hasarı', description: 'Kabın kırılması, delinmesi, devrilmesi veya şişmesi' },
  { name: 'Uygunsuz karışım', description: 'Maddelerin yanlışlıkla karıştırılması veya uyumsuz maddelerin temas etmesi' },
  { name: 'Yanlış madde kullanımı / transferi', description: 'Yanlış maddenin kullanılması, yanlış kaba veya hatta aktarılması' },
  { name: 'Çevreye yayılım', description: 'Maddenin toprağa, kanalizasyona, yüzey suyuna veya dış ortama ulaşması' },
  { name: 'Depolama uygunsuzluğu', description: 'Uyumsuz maddelerin birlikte tutulması veya depolama koşullarının uygunsuz olması' },
  { name: 'Taşıma / yükleme olayı', description: 'Taşıma, yükleme veya boşaltma sırasında oluşan kaza ya da hasar' },
  { name: 'Ramakkala', description: 'Olayın gerçekleşmediği ancak gerçekleşme potansiyeli taşıyan durum' },
  { name: 'Diğer', description: 'Listede bulunmayan olay; açıklama girilir' },
];

router.get('/incident-types', authMiddleware, async (req, res) => {
  try {
    let types = await prisma.hazmatIncidentType.findMany({
      orderBy: { name: 'asc' }
    });

    if (types.length === 0) {
      for (const item of DEFAULT_HAZMAT_INCIDENT_TYPES) {
        await prisma.hazmatIncidentType.create({
          data: { name: item.name, description: item.description }
        });
      }
      types = await prisma.hazmatIncidentType.findMany({
        orderBy: { name: 'asc' }
      });
    } else {
      // Missing default categories auto-sync
      const existingNames = new Set(types.map(t => t.name.toLowerCase()));
      for (const item of DEFAULT_HAZMAT_INCIDENT_TYPES) {
        if (!existingNames.has(item.name.toLowerCase())) {
          await prisma.hazmatIncidentType.create({
            data: { name: item.name, description: item.description }
          });
        }
      }
      types = await prisma.hazmatIncidentType.findMany({
        orderBy: { name: 'asc' }
      });
    }

    res.json(types);
  } catch (error) {
    console.error('Error fetching incident types:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/incident-types', authMiddleware, async (req: AuthRequest, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  try {
    const type = await prisma.hazmatIncidentType.create({
      data: { name, description: description || null }
    });
    res.status(201).json(type);
  } catch (error) {
    console.error('Error creating incident type:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/incident-types/:id', authMiddleware, async (req: AuthRequest, res) => {
  const { name, description } = req.body;
  try {
    const type = await prisma.hazmatIncidentType.update({
      where: { id: req.params.id },
      data: { 
        name: name !== undefined ? name : undefined,
        description: description !== undefined ? description : undefined 
      }
    });
    res.json(type);
  } catch (error) {
    console.error('Error updating incident type:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/incident-types/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    await prisma.hazmatIncidentType.delete({ where: { id: req.params.id } });
    res.json({ message: 'Incident type deleted successfully' });
  } catch (error) {
    console.error('Error deleting incident type:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- ROOT CAUSES (KÖK NEDENLER) ---
const DEFAULT_HAZMAT_ROOT_CAUSES: { name: string; description: string }[] = [
  { name: 'Ekipman / tesisat arızası', description: 'Vana arızası, conta arızası, hortum hasarı, boru çatlağı, pompa arızası, bağlantı arızası' },
  { name: 'Kap / ambalaj yetersizliği', description: 'Kırık veya delinmiş kap, gevşek kapak, uygun olmayan ambalaj, ambalajın yıpranması' },
  { name: 'Bakım / kontrol eksikliği', description: 'Bakımın yapılmaması, bakımın yetersiz yapılması, kontrol eksikliği, arızanın geç fark edilmesi' },
  { name: 'Hatalı işlem / uygulama', description: 'Yanlış vana veya ekipman kullanımı, hatalı aktarım, aşırı doldurma, yanlış madde kullanımı' },
  { name: 'Prosedür / talimat eksikliği', description: 'Talimatın bulunmaması, talimatın yetersiz veya anlaşılır olmaması, talimata uyulmaması' },
  { name: 'Eğitim / yetkinlik eksikliği', description: 'Yetersiz eğitim, işe özgü bilgi eksikliği, ekipman kullanımına ilişkin yetkinlik eksikliği' },
  { name: 'Etiketleme / bilgi eksikliği', description: 'Eksik veya yanlış etiket, ürünün yanlış tanımlanması, gerekli güvenlik bilgisinin erişilebilir olmaması' },
  { name: 'Depolama koşulları', description: 'Uyumsuz maddelerin birlikte depolanması, uygunsuz sıcaklık, kapların yanlış yerleştirilmesi, yetersiz depolama alanı' },
  { name: 'Taşıma / elleçleme koşulları', description: 'Kabın düşürülmesi, çarpma, uygunsuz kaldırma veya taşıma, yükün sabitlenmemesi' },
  { name: 'Çalışma ortamı koşulları', description: 'Yetersiz havalandırma, kaygan zemin, yetersiz aydınlatma, dar çalışma alanı' },
  { name: 'Koruyucu önlem eksikliği', description: 'Uygun kişisel koruyucu donanımın bulunmaması veya kullanılmaması, koruyucu bariyer ya da dökülme tutucunun yetersizliği' },
  { name: 'Planlama / organizasyon eksikliği', description: 'Yetersiz iş planlaması, görev ve sorumlulukların belirsizliği, iş yükü veya zaman baskısı' },
  { name: 'İletişim / koordinasyon eksikliği', description: 'Vardiyalar arası bilgi aktarımı eksikliği, ekipler arasında yetersiz koordinasyon' },
  { name: 'Dış etkenler', description: 'Araç çarpması, elektrik kesintisi, doğal olaylar veya dış kaynaklı başka bir etki' },
  { name: 'Diğer', description: 'Listede bulunmayan neden; açıklama girilir' },
  { name: 'Henüz belirlenmedi', description: 'İnceleme devam ediyor veya neden için yeterli bilgi yok' },
];

router.get('/root-causes', authMiddleware, async (req, res) => {
  try {
    let causes = await prisma.hazmatRootCause.findMany({
      orderBy: { name: 'asc' }
    });

    if (causes.length === 0) {
      for (const item of DEFAULT_HAZMAT_ROOT_CAUSES) {
        await prisma.hazmatRootCause.create({
          data: { name: item.name, description: item.description }
        });
      }
      causes = await prisma.hazmatRootCause.findMany({
        orderBy: { name: 'asc' }
      });
    } else {
      const existingNames = new Set(causes.map(c => c.name.toLowerCase()));
      for (const item of DEFAULT_HAZMAT_ROOT_CAUSES) {
        if (!existingNames.has(item.name.toLowerCase())) {
          await prisma.hazmatRootCause.create({
            data: { name: item.name, description: item.description }
          });
        }
      }
      causes = await prisma.hazmatRootCause.findMany({
        orderBy: { name: 'asc' }
      });
    }

    res.json(causes);
  } catch (error) {
    console.error('Error fetching root causes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/root-causes', authMiddleware, async (req: AuthRequest, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  try {
    const cause = await prisma.hazmatRootCause.create({
      data: { name, description: description || null }
    });
    res.status(201).json(cause);
  } catch (error) {
    console.error('Error creating root cause:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/root-causes/:id', authMiddleware, async (req: AuthRequest, res) => {
  const { name, description } = req.body;
  try {
    const cause = await prisma.hazmatRootCause.update({
      where: { id: req.params.id },
      data: { 
        name: name !== undefined ? name : undefined,
        description: description !== undefined ? description : undefined 
      }
    });
    res.json(cause);
  } catch (error) {
    console.error('Error updating root cause:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/root-causes/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    await prisma.hazmatRootCause.delete({ where: { id: req.params.id } });
    res.json({ message: 'Root cause deleted successfully' });
  } catch (error) {
    console.error('Error deleting root cause:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
