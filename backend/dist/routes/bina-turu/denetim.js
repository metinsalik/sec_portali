"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const multer_1 = __importDefault(require("multer"));
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
const upload = (0, multer_1.default)({ dest: 'uploads/' });
const handleError = (res, error) => {
    console.error(error);
    res.status(500).json({ error: 'Bir hata oluştu' });
};
router.post('/bulk-cevap', async (req, res) => {
    const { turSorusuIds, sonuc } = req.body;
    if (!turSorusuIds || !Array.isArray(turSorusuIds) || turSorusuIds.length === 0) {
        res.status(400).json({ error: 'Geçersiz soru listesi.' });
        return;
    }
    try {
        const createdAnswers = [];
        await prisma.$transaction(async (tx) => {
            for (const id of turSorusuIds) {
                const turSorusu = await tx.bTTurSorusu.findUnique({
                    where: { id: Number(id) },
                    include: { tur: true }
                });
                if (!turSorusu)
                    continue;
                const existingCevap = await tx.bTCevap.findUnique({
                    where: { turSorusuId: Number(id) }
                });
                let cevap;
                if (existingCevap) {
                    // If bulk overriding everything to UYGUN, we should clear aciklama and remove fotograflar conceptually?
                    // The user requested "komplesini uygun yapsın", usually means only answering unanswered ones, or overriding everything.
                    // It's safer to just set sonuc.
                    cevap = await tx.bTCevap.update({
                        where: { id: existingCevap.id },
                        data: {
                            sonuc: sonuc,
                            dofGerekli: sonuc === 'UYGUN_DEGIL',
                        }
                    });
                }
                else {
                    cevap = await tx.bTCevap.create({
                        data: {
                            turSorusuId: Number(id),
                            sonuc: sonuc,
                            aciklama: '',
                            dofGerekli: sonuc === 'UYGUN_DEGIL',
                            fotograflar: []
                        }
                    });
                }
                if (sonuc === 'UYGUN_DEGIL') {
                    const existingUygunsuzluk = await tx.bTUygunsuzluk.findUnique({
                        where: { cevapId: cevap.id }
                    });
                    if (!existingUygunsuzluk) {
                        await tx.bTUygunsuzluk.create({
                            data: {
                                facilityId: turSorusu.tur.facilityId,
                                turId: turSorusu.turId,
                                cevapId: cevap.id,
                                durum: 'ACIK'
                            }
                        });
                    }
                }
                else {
                    await tx.bTUygunsuzluk.deleteMany({
                        where: { cevapId: cevap.id }
                    });
                }
                if (turSorusu.tur.durum === 'TASLAK') {
                    await tx.bTTur.update({
                        where: { id: turSorusu.turId },
                        data: { durum: 'AKTIF' }
                    });
                }
                createdAnswers.push(cevap);
            }
        });
        res.json({ message: 'Başarılı', count: createdAnswers.length });
    }
    catch (err) {
        handleError(res, err);
    }
});
router.post('/:turSorusuId/cevap', upload.array('fotograflar'), async (req, res) => {
    const { turSorusuId } = req.params;
    const { sonuc, aciklama, dofGerekli } = req.body;
    const files = req.files;
    try {
        const turSorusu = await prisma.bTTurSorusu.findUnique({
            where: { id: Number(turSorusuId) },
            include: { tur: true }
        });
        if (!turSorusu) {
            res.status(404).json({ error: 'Soru bulunamadı.' });
            return;
        }
        const fotograflar = files ? files.map(f => f.filename) : [];
        // Mevcut cevap varsa güncelle, yoksa oluştur
        const existingCevap = await prisma.bTCevap.findUnique({
            where: { turSorusuId: Number(turSorusuId) }
        });
        let cevap;
        if (existingCevap) {
            cevap = await prisma.bTCevap.update({
                where: { id: existingCevap.id },
                data: {
                    sonuc: sonuc,
                    aciklama,
                    dofGerekli: sonuc === 'UYGUN_DEGIL', // DÖF gerekli mantığı artık sonuc'a bağlı
                    fotograflar: [...existingCevap.fotograflar, ...fotograflar]
                }
            });
        }
        else {
            cevap = await prisma.bTCevap.create({
                data: {
                    turSorusuId: Number(turSorusuId),
                    sonuc: sonuc,
                    aciklama,
                    dofGerekli: sonuc === 'UYGUN_DEGIL',
                    fotograflar
                }
            });
        }
        // UYGUN_DEGIL ise ve Uygunsuzluk henüz açılmamışsa oluştur
        if (sonuc === 'UYGUN_DEGIL') {
            const existingUygunsuzluk = await prisma.bTUygunsuzluk.findUnique({
                where: { cevapId: cevap.id }
            });
            if (!existingUygunsuzluk) {
                await prisma.bTUygunsuzluk.create({
                    data: {
                        facilityId: turSorusu.tur.facilityId,
                        turId: turSorusu.turId,
                        cevapId: cevap.id,
                        durum: 'ACIK'
                    }
                });
            }
        }
        else {
            // Eğer önceden UYGUN_DEGIL'di ve şimdi UYGUN olduysa, Uygunsuzluğu silebiliriz
            await prisma.bTUygunsuzluk.deleteMany({
                where: { cevapId: cevap.id }
            });
        }
        // Tur durumunu AKTIF'e çek (ilk cevap verildiğinde)
        if (turSorusu.tur.durum === 'TASLAK') {
            await prisma.bTTur.update({
                where: { id: turSorusu.turId },
                data: { durum: 'AKTIF' }
            });
        }
        res.json(cevap);
    }
    catch (err) {
        handleError(res, err);
    }
});
exports.default = router;
