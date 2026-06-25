"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
const handleError = (res, error) => {
    console.error(error);
    res.status(500).json({ error: 'Bir hata oluştu' });
};
// Yeni Tur Oluştur
router.post('/', async (req, res) => {
    const { facilityId, ad, baslangicTarihi, bitisTarihi, sorumluBirimIds, sorumluKisiIds, soruIds } = req.body;
    if (!facilityId || !ad || !soruIds || !soruIds.length) {
        res.status(400).json({ error: 'Eksik parametreler.' });
        return;
    }
    try {
        const tur = await prisma.bTTur.create({
            data: {
                facilityId,
                ad,
                baslangicTarihi: new Date(baslangicTarihi || new Date()),
                bitisTarihi: new Date(bitisTarihi || new Date()),
                sorumluBirimler: {
                    connect: (sorumluBirimIds || []).map((id) => ({ id }))
                },
                sorumluKisiler: {
                    connect: (sorumluKisiIds || []).map((id) => ({ id }))
                },
                turSorulari: {
                    create: soruIds.map((soruId) => ({
                        soruId
                    }))
                }
            }
        });
        res.status(201).json(tur);
    }
    catch (err) {
        handleError(res, err);
    }
});
// Turları Listele
router.get('/', async (req, res) => {
    const facilityId = req.query.facilityId;
    try {
        const turlar = await prisma.bTTur.findMany({
            where: { facilityId },
            include: {
                sorumluBirimler: true,
                sorumluKisiler: true,
                _count: {
                    select: { turSorulari: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(turlar);
    }
    catch (err) {
        handleError(res, err);
    }
});
// Tur Detay ve Soruları
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const tur = await prisma.bTTur.findUnique({
            where: { id: Number(id) },
            include: {
                sorumluBirimler: true,
                sorumluKisiler: true,
                turSorulari: {
                    include: {
                        soru: {
                            include: {
                                anaGrup: true,
                                denetlenenAlan: true,
                                kategori: true
                            }
                        },
                        cevap: true
                    }
                }
            }
        });
        if (!tur) {
            res.status(404).json({ error: 'Tur bulunamadı.' });
            return;
        }
        res.json(tur);
    }
    catch (err) {
        handleError(res, err);
    }
});
// Turu Tamamla
router.put('/:id/tamamla', async (req, res) => {
    const { id } = req.params;
    try {
        const tur = await prisma.bTTur.update({
            where: { id: Number(id) },
            data: { durum: 'TAMAMLANDI' }
        });
        res.json(tur);
    }
    catch (err) {
        handleError(res, err);
    }
});
exports.default = router;
