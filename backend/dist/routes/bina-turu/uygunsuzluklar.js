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
// Uygunsuzluk Listesi
router.get('/', async (req, res) => {
    const facilityId = req.query.facilityId;
    try {
        const uygunsuzluklar = await prisma.bTUygunsuzluk.findMany({
            where: { facilityId },
            include: {
                tur: true,
                cevap: {
                    include: {
                        turSorusu: {
                            include: {
                                soru: {
                                    include: { anaGrup: true, denetlenenAlan: true, kategori: true }
                                }
                            }
                        }
                    }
                },
                sorumluBirimler: true,
                sorumluKisiler: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(uygunsuzluklar);
    }
    catch (err) {
        handleError(res, err);
    }
});
// Atama Yap ve DÖF Gir (Devam Ediyor)
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { sorumluBirimIds, sorumluKisiIds, onleyiciFaaliyet, terminTarihi, yapilacaklar } = req.body;
    try {
        const uygunsuzluk = await prisma.bTUygunsuzluk.update({
            where: { id: Number(id) },
            data: {
                sorumluBirimler: {
                    set: (sorumluBirimIds || []).map((bId) => ({ id: bId }))
                },
                sorumluKisiler: {
                    set: (sorumluKisiIds || []).map((kId) => ({ id: kId }))
                },
                onleyiciFaaliyet,
                yapilacaklar,
                terminTarihi: terminTarihi ? new Date(terminTarihi) : null,
                durum: 'DEVAM_EDIYOR'
            }
        });
        res.json(uygunsuzluk);
    }
    catch (err) {
        handleError(res, err);
    }
});
// Uygunsuzluk Kapat
router.put('/:id/kapat', upload.array('kanitDosyalari'), async (req, res) => {
    const { id } = req.params;
    const { kapatmaKaniti } = req.body;
    const files = req.files;
    try {
        const filePaths = files ? files.map(f => f.filename) : [];
        // Kanıt metni ve dosya isimlerini birleştirerek kaydediyoruz (ya da sadece metni alıyoruz, dosya yolları için yeni alan eklenebilir ama şu an string? alanına JSON veya metin olarak birleştirebiliriz. veya sadece kapatmaKaniti alanını kullanırız.)
        const combinedKanit = [kapatmaKaniti, ...filePaths].filter(Boolean).join('\nDosya: ');
        const uygunsuzluk = await prisma.bTUygunsuzluk.update({
            where: { id: Number(id) },
            data: {
                durum: 'KAPALI',
                kapatmaKaniti: combinedKanit,
                kapatmaTarihi: new Date()
            }
        });
        res.json(uygunsuzluk);
    }
    catch (err) {
        handleError(res, err);
    }
});
exports.default = router;
