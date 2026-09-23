import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();
const prisma = new PrismaClient();

// Dynamic Multer Storage with folder: uploads/fire_safety_control/<facilityId>/
const storage = multer.diskStorage({
  destination: (req: any, file, cb) => {
    // Sanitize facilityId or fallback to 'general'
    const rawFacId = req.query.facilityId || req.body.facilityId || 'general';
    const cleanFacId = String(rawFacId).replace(/[^a-zA-Z0-9_-]/g, '_');
    const targetDir = path.join(process.cwd(), 'uploads', 'fire_safety_control', cleanFacId);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    cb(null, targetDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `fsc-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({ storage });

// Dosya / Fotoğraf yükleme endpoint'i (tesise özel alt klasörde saklanır)
router.post('/upload', authMiddleware, upload.array('files', 20), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      return res.status(400).json({ error: 'Dosya yüklenmedi.' });
    }

    const rawFacId = req.query.facilityId || req.body.facilityId || 'general';
    const cleanFacId = String(rawFacId).replace(/[^a-zA-Z0-9_-]/g, '_');
    const files = req.files as Express.Multer.File[];

    const uploadedFiles = files.map(file => ({
      name: file.originalname,
      url: `/uploads/fire_safety_control/${cleanFacId}/${file.filename}`,
      type: file.mimetype,
      size: file.size,
      uploadedAt: new Date().toISOString()
    }));

    res.json(uploadedFiles);
  } catch (error) {
    console.error('Fire Safety Upload Error:', error);
    res.status(500).json({ error: 'Dosya yükleme başarısız oldu.' });
  }
});

// Tüm denetimleri listele (opsiyonel tesis filtreli)
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { facilityId } = req.query as Record<string, string>;
    const user = req.user!;
    const isManager = user.isAdmin || user.isManagement || user.roles?.includes('admin') || user.roles?.includes('management');

    const whereClause: any = {};
    if (facilityId && facilityId !== 'all') {
      whereClause.facilityId = facilityId;
    } else if (!isManager && user.facilities && user.facilities.length > 0) {
      whereClause.facilityId = { in: user.facilities };
    }

    const audits = await prisma.fireSafetyAudit.findMany({
      where: whereClause,
      include: {
        facility: {
          select: { id: true, name: true }
        },
        items: {
          include: {
            actions: {
              orderBy: { createdAt: 'desc' }
            }
          },
          orderBy: { orderNo: 'asc' }
        }
      },
      orderBy: { auditDate: 'desc' }
    });

    res.json(audits);
  } catch (error) {
    console.error('Error fetching fire safety audits:', error);
    res.status(500).json({ error: 'Denetimler getirilemedi.' });
  }
});

// Modül ayarlarını getir
router.get('/settings/all', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    let settings = await prisma.fireSafetySetting.findUnique({ where: { id: 'default' } });
    if (!settings) {
      settings = await prisma.fireSafetySetting.create({
        data: {
          id: 'default',
          sources: [
            { id: '1', name: 'İtfaiye Denetim Raporu' },
            { id: '2', name: 'SEGEM Raporu' },
            { id: '3', name: 'İç Süreç' },
            { id: '4', name: 'Saha Turu' },
            { id: '5', name: 'Yasal Denetim' }
          ],
          categories: [
            { id: '1', name: 'Yangın Kompartımanı & İzolasyon' },
            { id: '2', name: 'Elektrik & Pano Güvenliği' },
            { id: '3', name: 'Acil Durum Aydınlatma & Yönlendirme' },
            { id: '4', name: 'Kaçış Merdivenleri & Çıkışlar' },
            { id: '5', name: 'Algılama & Otomatik Söndürme' },
            { id: '6', name: 'İnşaat, Boya & Fiziki Alan Bakımı' }
          ],
          responsibles: [
            { id: '1', name: 'Teknik Hizmetler – Hastane' },
            { id: '2', name: 'Teknik Hizmetler – Merkez' },
            { id: '3', name: 'Teknik Hizmetler & İSG – Hastane' },
            { id: '4', name: 'Satın Alma Direktörlüğü' },
            { id: '5', name: 'Dizayn Yöneticisi & Satınalma' },
            { id: '6', name: 'Merkez Satın Alma & Mimar' }
          ]
        }
      });
    }
    res.json(settings);
  } catch (error) {
    console.error('Error getting settings:', error);
    res.status(500).json({ error: 'Ayarlar getirilemedi.' });
  }
});

// Modül ayarlarını güncelle
router.post('/settings/all', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { sources, categories, responsibles } = req.body;
    const updated = await prisma.fireSafetySetting.upsert({
      where: { id: 'default' },
      update: {
        sources: sources || [],
        categories: categories || [],
        responsibles: responsibles || []
      },
      create: {
        id: 'default',
        sources: sources || [],
        categories: categories || [],
        responsibles: responsibles || []
      }
    });
    res.json(updated);
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Ayarlar kaydedilemedi.' });
  }
});

// Önceki toplantılardaki açık ve devam eden maddeleri getir (Yeni toplantıya aktarım için)
router.get('/facilities/:facilityId/latest-items', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { facilityId } = req.params;
    const { includeCompleted } = req.query;

    const latestAudit = await prisma.fireSafetyAudit.findFirst({
      where: { facilityId },
      orderBy: { auditDate: 'desc' },
      include: {
        items: {
          include: {
            actions: {
              orderBy: { createdAt: 'desc' }
            }
          },
          orderBy: { orderNo: 'asc' }
        }
      }
    });

    if (!latestAudit) {
      return res.json({ audit: null, items: [] });
    }

    let items = latestAudit.items;
    if (includeCompleted !== 'true') {
      // Sadece devam eden veya açık maddeleri getir (veya tamamlanmışları filtrele)
      items = items.filter(i => i.status !== 'IPTAL');
    }

    res.json({
      audit: {
        id: latestAudit.id,
        title: latestAudit.title,
        auditDate: latestAudit.auditDate,
        topic: latestAudit.topic,
        purpose: latestAudit.purpose,
        preparedBy: latestAudit.preparedBy,
        reviewedBy: latestAudit.reviewedBy,
        approvedBy: latestAudit.approvedBy
      },
      items
    });
  } catch (error) {
    console.error('Error fetching latest audit items:', error);
    res.status(500).json({ error: 'Önceki maddeler getirilemedi.' });
  }
});

// Tekil denetim detayı getir
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const audit = await prisma.fireSafetyAudit.findUnique({
      where: { id },
      include: {
        facility: {
          select: { id: true, name: true, logoUrl: true }
        },
        items: {
          include: {
            actions: {
              orderBy: { createdAt: 'desc' }
            }
          },
          orderBy: { orderNo: 'asc' }
        }
      }
    });

    if (!audit) {
      return res.status(404).json({ error: 'Denetim tutanağı bulunamadı.' });
    }

    res.json(audit);
  } catch (error) {
    console.error('Error fetching audit details:', error);
    res.status(500).json({ error: 'Denetim detayları getirilemedi.' });
  }
});

// Denetim oluştur / güncelle
router.post('/save', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id, facilityId, title, subtitle, auditDate, topic, purpose, status, preparedBy, reviewedBy, approvedBy, items } = req.body;

    if (!facilityId) {
      return res.status(400).json({ error: 'facilityId zorunludur.' });
    }

    const auditData = {
      facilityId,
      title: title || 'TOPLANTI TUTANAĞI',
      subtitle: subtitle || 'Teknik Hizmetler, Yangın Güvenliği ve Fiziki Alan Değerlendirme Toplantısı',
      auditDate: auditDate ? new Date(auditDate) : new Date(),
      topic: topic || '',
      purpose: purpose || '',
      status: status || 'DEVAM_EDIYOR',
      preparedBy: preparedBy || '',
      reviewedBy: reviewedBy || '',
      approvedBy: approvedBy || '',
      createdBy: req.user?.username || req.user?.fullName || 'system'
    };

    let targetAuditId = id;

    await prisma.$transaction(async (tx) => {
      if (!id || id.startsWith('temp_')) {
        const created = await tx.fireSafetyAudit.create({ data: auditData });
        targetAuditId = created.id;
      } else {
        await tx.fireSafetyAudit.update({
          where: { id },
          data: auditData
        });
      }

      // Maddeleri senkronize et
      if (items && Array.isArray(items)) {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const itemPayload = {
            auditId: targetAuditId,
            orderNo: item.orderNo || (i + 1),
            topic: item.topic || '',
            source: item.source || null,
            category: item.category || null,
            action: item.action || '',
            responsible: item.responsible || '',
            deadlineDate: item.deadlineDate ? new Date(item.deadlineDate) : null,
            status: item.status || 'ACIK',
            riskLevel: item.riskLevel || 'Orta',
            findingPhotos: item.findingPhotos || [],
            notes: item.notes || null
          };

          if (item.id && !item.id.startsWith('temp_')) {
            await tx.fireSafetyItem.update({
              where: { id: item.id },
              data: itemPayload
            });
          } else {
            await tx.fireSafetyItem.create({
              data: itemPayload
            });
          }
        }
      }
    });

    const fullAudit = await prisma.fireSafetyAudit.findUnique({
      where: { id: targetAuditId },
      include: {
        facility: true,
        items: {
          include: { actions: true },
          orderBy: { orderNo: 'asc' }
        }
      }
    });

    res.json(fullAudit);
  } catch (error) {
    console.error('Error saving fire safety audit:', error);
    res.status(500).json({ error: 'Denetim kaydedilemedi.' });
  }
});

// Maddeye aksiyon ve kanıt ekleme endpoint'i
router.post('/items/:itemId/actions', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { itemId } = req.params;
    const { explanation, status, actionDate, evidencePhotos } = req.body;

    if (!explanation) {
      return res.status(400).json({ error: 'Aksiyon açıklaması zorunludur.' });
    }

    const item = await prisma.fireSafetyItem.findUnique({ where: { id: itemId } });
    if (!item) {
      return res.status(404).json({ error: 'Tespit maddesi bulunamadı.' });
    }

    const action = await prisma.fireSafetyItemAction.create({
      data: {
        itemId,
        performedBy: req.user?.fullName || req.user?.username || 'Kullanıcı',
        actionDate: actionDate ? new Date(actionDate) : new Date(),
        status: status || 'Devam Ediyor',
        explanation,
        evidencePhotos: evidencePhotos || []
      }
    });

    // Ana maddenin durumunu güncelle
    let newStatus = item.status;
    if (status === 'Tamamlandı') newStatus = 'TAMAMLANDI';
    else if (status === 'Devam Ediyor') newStatus = 'DEVAM_EDIYOR';
    else if (status === 'İptal Edildi') newStatus = 'IPTAL';

    await prisma.fireSafetyItem.update({
      where: { id: itemId },
      data: { status: newStatus }
    });

    res.json(action);
  } catch (error) {
    console.error('Error adding action step:', error);
    res.status(500).json({ error: 'Aksiyon eklenemedi.' });
  }
});

// Tekil madde kaydet / güncelle
router.post('/items/save', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id, auditId, orderNo, topic, source, category, action, responsible, deadlineDate, status, riskLevel, findingPhotos, notes } = req.body;

    if (!auditId) {
      return res.status(400).json({ error: 'auditId zorunludur.' });
    }

    const itemPayload: any = {
      auditId,
      orderNo: orderNo || 1,
      topic: topic || '',
      source: source || null,
      category: category || null,
      action: action || '',
      responsible: responsible || '',
      deadlineDate: deadlineDate ? new Date(deadlineDate) : null,
      status: status || 'ACIK',
      riskLevel: riskLevel || 'Orta',
      findingPhotos: findingPhotos || [],
      notes: notes || null
    };

    let savedItem;
    if (id && !id.startsWith('temp_')) {
      savedItem = await prisma.fireSafetyItem.update({
        where: { id },
        data: itemPayload,
        include: { actions: { orderBy: { createdAt: 'desc' } } }
      });
    } else {
      savedItem = await prisma.fireSafetyItem.create({
        data: itemPayload,
        include: { actions: true }
      });
    }

    res.json(savedItem);
  } catch (error) {
    console.error('Error saving fire safety item:', error);
    res.status(500).json({ error: 'Tespit maddesi kaydedilemedi.' });
  }
});

// Tekil madde sil
router.delete('/items/:itemId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { itemId } = req.params;
    await prisma.fireSafetyItem.delete({ where: { id: itemId } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting fire safety item:', error);
    res.status(500).json({ error: 'Tespit maddesi silinemedi.' });
  }
});

// Tutanak sil
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.fireSafetyAudit.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting audit:', error);
    res.status(500).json({ error: 'Denetim silinemedi.' });
  }
});

// Kocaeli Tutanak Seed / Import Endpoint'i (İlk Kurulum için)
router.post('/seed/kocaeli', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const fac = await prisma.facility.findFirst({
      where: {
        OR: [
          { id: 'VM-MP-KOCAELI' },
          { name: { contains: 'Kocaeli' } }
        ]
      }
    });

    const facilityId = fac ? fac.id : 'VM-MP-KOCAELI';

    // Var olan aynı tutanak var mı?
    const existing = await prisma.fireSafetyAudit.findFirst({
      where: { facilityId, title: 'TOPLANTI TUTANAĞI' }
    });

    if (existing) {
      return res.json({ message: 'Kocaeli tutanağı zaten mevcut.', audit: existing });
    }

    const itemsData = [
      {
        orderNo: 1,
        topic: 'Kazan dairesi, otopark, ana elektrik dağıtım odaları, yapı içindeki trafo merkezleri, orta gerilim merkezleri, jeneratör grubu odaları ve benzeri yangın tehlikesi olan kapalı alanların duvarları ve döşemeleri kompartıman duvarı özelliğinde olmalıdır.',
        source: 'İtfaiye Denetim Raporu',
        category: 'Yangın Kompartımanı & İzolasyon',
        action: 'Yetkili kişiden uygunluk yazısı alınacak.',
        responsible: 'Teknik Hizmetler – Merkez',
        status: 'ACIK',
        riskLevel: 'Yüksek'
      },
      {
        orderNo: 2,
        topic: 'Ana elektrik odalarından ve transformatör merkezlerinden temiz su, pis su, patlayıcı ve yanıcı sıvı ve gaz tesisatı donanımı ve ekipmanı geçirilemez ve üst kat mahallerinde ıslak hacim düzenlenemez.',
        source: 'İtfaiye Denetim Raporu',
        category: 'Elektrik & Pano Güvenliği',
        action: 'Borular izole edilip alçıpan ile kapatılacak. Kapalı hacim içine su sensörü koyulacak.',
        responsible: 'Teknik Hizmetler – Hastane',
        status: 'ACIK',
        riskLevel: 'Yüksek'
      },
      {
        orderNo: 3,
        topic: 'Acil durum yönlendirmesinin eksik olan kısımlara ilavelerinin yapılması, normal aydınlatmanın kesilmesi hâlinde en az 60 dakika süreyle sağlanması gerekir.',
        source: 'İtfaiye Denetim Raporu',
        category: 'Acil Durum Aydınlatma & Yönlendirme',
        action: 'Yoğun bakımlar dahil tüm alanlar için satın alma talebi oluşturulacak.',
        responsible: 'Teknik Hizmetler – Hastane',
        status: 'ACIK',
        riskLevel: 'Orta'
      },
      {
        orderNo: 4,
        topic: 'Acil durum kontrol sistemleri yangın halinde aktif olarak devreye girmelidir.',
        source: 'İtfaiye Denetim Raporu',
        category: 'Algılama & Otomatik Söndürme',
        action: 'Sistem kontrol edilecek ve firmadan uygunluk yazısı alınacak.',
        responsible: 'Teknik Hizmetler – Hastane',
        status: 'ACIK',
        riskLevel: 'Yüksek'
      },
      {
        orderNo: 5,
        topic: 'Kaçış merdivenlerinin kapasite ve sayı bakımından en az yarısının doğrudan bina dışına açılması gerekir. Kaçış merdiveninin, zemin düzeyindeki dışarı çıkışının görülebildiği ve engellenmediği hol, koridor, fuaye, lobi gibi bir dolaşım alanına inmesi hâlinde, kaçış merdiveninin indiği nokta ile dış açık alan arasındaki uzaklık 15 m’yi aşamaz.',
        source: 'İtfaiye Denetim Raporu',
        category: 'Kaçış Merdivenleri & Çıkışlar',
        action: 'Alanda renovasyon yapılacak. Ruhsatlandırma onayı alınması gerekiyor.',
        responsible: 'Teknik Hizmetler – Hastane',
        status: 'ACIK',
        riskLevel: 'Yüksek'
      },
      {
        orderNo: 6,
        topic: 'Bina yangın ve tahliye kaçış plan ve yönlendirme çalışmaları',
        source: 'İç Süreç',
        category: 'Kaçış Merdivenleri & Çıkışlar',
        action: 'Serhat Kara isimli firma çalışmalarını rapor halinde hastaneye sunacak.',
        responsible: 'Teknik Hizmetler – Hastane',
        status: 'ACIK',
        riskLevel: 'Orta'
      },
      {
        orderNo: 7,
        topic: 'Acil durum aydınlatma sistemi; şehir şebekesi veya benzeri bir dış elektrik beslemesinin kesilmesi, yangın, deprem gibi sebeplerle bina veya yapının elektrik enerjisinin güvenlik maksadıyla kesilmesi ve bir devre kesici veya sigortanın açılması sebebiyle normal aydınlatmanın kesilmesi hâllerinde, otomatik olarak devreye girerek yeterli aydınlatma sağlayacak şekilde düzenlenmeli, eksik kısımlara ilavelerinin yapılması gerekir.',
        source: 'İtfaiye Denetim Raporu',
        category: 'Acil Durum Aydınlatma & Yönlendirme',
        action: 'Talep oluşturulacak.',
        responsible: 'Teknik Hizmetler – Hastane',
        status: 'ACIK',
        riskLevel: 'Yüksek'
      },
      {
        orderNo: 8,
        topic: 'Elektrik pano odalarına temiz gaz Novec 1230 söndürme sistemi tesis edilmelidir.',
        source: 'İç Süreç',
        category: 'Algılama & Otomatik Söndürme',
        action: 'Firmadan hacim ve yeterlilik hesapları istenecek.',
        responsible: 'Teknik Hizmetler & İSG – Hastane',
        status: 'ACIK',
        riskLevel: 'Yüksek'
      },
      {
        orderNo: 9,
        topic: 'Hastane ortak alan ve koridorları boya ve bakım ihtiyaçları',
        source: 'İç Süreç',
        category: 'İnşaat, Boya & Fiziki Alan Bakımı',
        action: 'Mahal mahal boya metrajları Dizayn Yöneticisine iletilecek.',
        responsible: 'Teknik Hizmetler – Hastane',
        status: 'ACIK',
        riskLevel: 'Düşük'
      },
      {
        orderNo: 10,
        topic: 'PVC zemin kaplamaları aşınma ve yenileme ihtiyacı',
        source: 'İç Süreç',
        category: 'İnşaat, Boya & Fiziki Alan Bakımı',
        action: 'PVC ihtiyacı olan yerler için metraj ve fotoğraflı rapor hazırlanarak Dizayn Yöneticisine gönderilecek.',
        responsible: 'Teknik Hizmetler – Hastane',
        status: 'ACIK',
        riskLevel: 'Orta'
      },
      {
        orderNo: 11,
        topic: 'Yatan hasta katlarında tutunma barları deformasyonu',
        source: 'İç Süreç',
        category: 'İnşaat, Boya & Fiziki Alan Bakımı',
        action: 'Yatan hasta katlarında tutunma barları deformasyonu için firma çağırılacak.',
        responsible: 'Merkez Satın Alma & Mimar',
        status: 'ACIK',
        riskLevel: 'Orta'
      },
      {
        orderNo: 12,
        topic: 'Acil tarafında yağmur yağdığında doktor odaları su alıyor; izolasyon sorunu var.',
        source: 'İç Süreç',
        category: 'İnşaat, Boya & Fiziki Alan Bakımı',
        action: 'İzolasyon için hastane keşif yapıp talep oluşturacak.',
        responsible: 'Teknik Hizmetler – Hastane',
        status: 'ACIK',
        riskLevel: 'Yüksek'
      },
      {
        orderNo: 13,
        topic: 'Radyasyon onkolojisi alanında zemin bozulmaları mevcut.',
        source: 'İç Süreç',
        category: 'İnşaat, Boya & Fiziki Alan Bakımı',
        action: 'Daha sonra bakılacak.',
        responsible: 'Teknik Hizmetler – Hastane',
        status: 'ACIK',
        riskLevel: 'Düşük'
      },
      {
        orderNo: 14,
        topic: 'Doktor odalarında soğutma problemi mevcut.',
        source: 'İç Süreç',
        category: 'İnşaat, Boya & Fiziki Alan Bakımı',
        action: 'Kat bazlı olarak fancoil ve diğer havalandırma sistemlerinin yeterliliği kontrol edilecek; bakım ve temizliklerinin yapılması sağlanacak. Hastane alanları önceliklendirerek merkeze talep açacak.',
        responsible: 'Teknik Hizmetler – Hastane & Merkez',
        status: 'ACIK',
        riskLevel: 'Orta'
      },
      {
        orderNo: 15,
        topic: 'SEGEM raporunda belirtilen anons sistemi eksiklikleri',
        source: 'SEGEM Raporu',
        category: 'Algılama & Otomatik Söndürme',
        action: 'SEGEM raporunda belirtilen anons sistemi eksiklikleri için satın almaya talep açılacak.',
        responsible: 'Teknik Hizmetler – Hastane',
        status: 'ACIK',
        riskLevel: 'Yüksek'
      },
      {
        orderNo: 16,
        topic: 'Koridor çarpma bantları eksiklikleri',
        source: 'İç Süreç',
        category: 'İnşaat, Boya & Fiziki Alan Bakımı',
        action: 'Çarpma bandı için merkez satın almada süreç ilerleyecek.',
        responsible: 'Dizayn Yöneticisi & Satınalma',
        status: 'ACIK',
        riskLevel: 'Düşük'
      },
      {
        orderNo: 17,
        topic: 'Asansörler ile ilgili sürekli olarak arıza durumları var.',
        source: 'İç Süreç',
        category: 'İnşaat, Boya & Fiziki Alan Bakımı',
        action: 'Hastane asansörleri için arıza sayıları ve onarım bedelleri analiz edilecek. Hastanede asansör kullanımı ve ihtiyaç analizi yapılacak.',
        responsible: 'Teknik Hizmetler – Merkez / SEÇ',
        status: 'ACIK',
        riskLevel: 'Yüksek'
      },
      {
        orderNo: 18,
        topic: 'Su sayaçlarının yerüstüne alınması ihtiyacı',
        source: 'İç Süreç',
        category: 'İnşaat, Boya & Fiziki Alan Bakımı',
        action: 'Su sayaçlarının yerüstüne alınması çalışması için satın almada olan talep değerlendirilecek.',
        responsible: 'Satın Alma Direktörlüğü',
        status: 'ACIK',
        riskLevel: 'Orta'
      },
      {
        orderNo: 19,
        topic: 'Aydınlatma sistemlerinin LED dönüşümü ihtiyacı',
        source: 'İç Süreç',
        category: 'Elektrik & Pano Güvenliği',
        action: 'Aydınlatma sistemlerinin LED dönüşümü için gerekli çalışmalar yapılacak.',
        responsible: 'Teknik Hizmetler – Merkez',
        status: 'ACIK',
        riskLevel: 'Düşük'
      },
      {
        orderNo: 20,
        topic: '7 adet yangın kapısının teslim ve montajı yapılmamış.',
        source: 'İtfaiye Denetim Raporu',
        category: 'Yangın Kompartımanı & İzolasyon',
        action: 'İlgili kapılar için firma ile görüşülecek.',
        responsible: 'Satın Alma Direktörlüğü',
        status: 'ACIK',
        riskLevel: 'Yüksek'
      }
    ];

    const audit = await prisma.fireSafetyAudit.create({
      data: {
        facilityId,
        title: 'TOPLANTI TUTANAĞI',
        subtitle: 'Teknik Hizmetler, Yangın Güvenliği ve Fiziki Alan Değerlendirme Toplantısı',
        auditDate: new Date('2026-08-10'),
        topic: 'Yangın güvenliği, teknik altyapı, fiziki alanlar, bakım-onarım ihtiyaçları ve ilgili aksiyonların değerlendirilmesi',
        purpose: 'Hastane bünyesinde tespit edilen yangın güvenliği, teknik altyapı, bakım-onarım ve fiziki alan ihtiyaçlarını değerlendirmek; alınan kararları, oluşturulacak talepleri ve sorumlulukları kayıt altına almak.',
        status: 'DEVAM_EDIYOR',
        preparedBy: 'Teknik Hizmetler',
        reviewedBy: 'İSG Yöneticisi',
        approvedBy: 'Genel Müdürlük',
        createdBy: 'system',
        items: {
          create: itemsData
        }
      },
      include: {
        items: true
      }
    });

    res.json({ message: 'Kocaeli tutanağı başarıyla aktarıldı.', audit });
  } catch (error) {
    console.error('Error seeding Kocaeli audit:', error);
    res.status(500).json({ error: 'Seed işlemi başarısız.' });
  }
});

export default router;
