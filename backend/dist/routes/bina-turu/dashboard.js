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
router.get('/ozet', async (req, res) => {
    const facilityId = req.query.facilityId;
    try {
        const turlar = await prisma.bTTur.count({ where: { facilityId } });
        const acikUygunsuzluklar = await prisma.bTUygunsuzluk.count({ where: { facilityId, durum: 'ACIK' } });
        const kapaliUygunsuzluklar = await prisma.bTUygunsuzluk.count({ where: { facilityId, durum: 'KAPALI' } });
        const denetimSonuclari = await prisma.bTCevap.groupBy({
            by: ['sonuc'],
            where: { turSorusu: { tur: { facilityId } } },
            _count: true
        });
        res.json({
            turlar,
            acikUygunsuzluklar,
            kapaliUygunsuzluklar,
            denetimSonuclari
        });
    }
    catch (err) {
        handleError(res, err);
    }
});
router.get('/kategori-bazli', async (req, res) => {
    const facilityId = req.query.facilityId;
    try {
        const data = await prisma.bTCevap.findMany({
            where: { turSorusu: { tur: { facilityId } } },
            include: {
                turSorusu: {
                    include: {
                        soru: {
                            include: { kategori: true }
                        }
                    }
                }
            }
        });
        const result = {};
        data.forEach(c => {
            const katAd = c.turSorusu.soru.kategori.ad;
            if (!result[katAd])
                result[katAd] = { UYGUN: 0, UYGUN_DEGIL: 0 };
            result[katAd][c.sonuc]++;
        });
        res.json(Object.entries(result).map(([kategori, count]) => ({ kategori, ...count })));
    }
    catch (err) {
        handleError(res, err);
    }
});
exports.default = router;
