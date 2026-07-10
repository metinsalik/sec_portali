import { Router, Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();
const router = Router();

// GET: Tüm kategorileri getir
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const categories = await prisma.wfCategory.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Kategoriler getirilemedi.' });
  }
});

// POST: Yeni kategori ekle
const categorySchema = z.object({
  name: z.string().min(1, 'Kategori adı zorunludur'),
  description: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = categorySchema.parse(req.body);

    const existing = await prisma.wfCategory.findUnique({ where: { name: data.name } });
    if (existing) {
      return res.status(400).json({ error: 'Bu isimde bir kategori zaten var.' });
    }

    const category = await prisma.wfCategory.create({
      data: {
        name: data.name,
        description: data.description,
        color: data.color || '#3b82f6',
      }
    });

    res.status(201).json(category);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Geçersiz veri veya sunucu hatası.' });
  }
});

// PUT: Kategori düzenle
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = categorySchema.parse(req.body);

    const existing = await prisma.wfCategory.findFirst({
      where: { name: data.name, id: { not: id } }
    });
    if (existing) {
      return res.status(400).json({ error: 'Bu isimde başka bir kategori zaten var.' });
    }

    const category = await prisma.wfCategory.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        color: data.color,
      }
    });

    res.json(category);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Kategori güncellenemedi.' });
  }
});

// DELETE: Kategori sil
// replacementCategoryId varsa, silinen kategoriye bağlı iş planlarını (veya bitmiş olanları dahil) oraya aktarır. Yoksa null yapar.
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { replacementCategoryId } = req.body; // or could be query

    // Reassign plans if requested
    if (replacementCategoryId) {
      // Doğrula
      const target = await prisma.wfCategory.findUnique({ where: { id: replacementCategoryId } });
      if (!target) {
        return res.status(400).json({ error: 'Aktarılacak kategori bulunamadı.' });
      }

      // Update all plans that had the old category to the new one
      await prisma.wfPlan.updateMany({
        where: { categoryId: id },
        data: { categoryId: replacementCategoryId }
      });
    }

    // Now delete the category
    await prisma.wfCategory.delete({
      where: { id }
    });

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Kategori silinemedi.' });
  }
});

export default router;
