const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const checklists = {
  "Yangın Kapısı": {
    altKategoriler: ["Tek Kanatlı", "Çift Kanatlı", "Kayar Kapı"],
    bakimKontrolleri: [
      { id: "kapanmaKontrol", label: "Kapı kendiliğinden kapanıyor mu?", type: "checkbox" },
      { id: "contaKontrol", label: "Conta ve sızdırmazlık elemanları sağlam mı?", type: "checkbox" },
      { id: "menteseKontrol", label: "Menteşeler çalışıyor mu?", type: "checkbox" },
      { id: "kilitKontrol", label: "Kilit mekanizması çalışıyor mu?", type: "checkbox" },
      { id: "isaretlemeKontrol", label: "İşaretleme ve levhalar mevcut mu?", type: "checkbox" }
    ]
  },
  "Yangın Tüpü": {
    altKategoriler: ["Kuru Kimyevi Tozlu", "CO₂", "Köpüklü", "Sulu", "Temiz Gazlı"],
    bakimKontrolleri: [
      { id: "manometreOkuma", label: "Manometre yeşil bölgede mi?", type: "checkbox" },
      { id: "guvenlikPimi", label: "Güvenlik pimi yerinde mi?", type: "checkbox" },
      { id: "hortumKontrol", label: "Hortum ve lans hasarsız mı?", type: "checkbox" },
      { id: "etiketKontrol", label: "Etiket ve son kullanma tarihi okunuyor mu?", type: "checkbox" },
      { id: "konumKontrol", label: "Tüp erişilebilir konumda mı?", type: "checkbox" },
      { id: "dolumTarihi", label: "Dolum / Hidrostatik Test Tarihi", type: "date" }
    ]
  },
  "Dedektör": {
    altKategoriler: ["Duman Dedektörü", "Isı Dedektörü", "Alev Dedektörü", "Gaz Dedektörü", "Kombine Dedektör"],
    bakimKontrolleri: [
      { id: "ledKontrol", label: "LED göstergesi yanıyor mu?", type: "checkbox" },
      { id: "temizlikKontrol", label: "Dedektör yüzeyi temiz mi?", type: "checkbox" },
      { id: "baglantiKontrol", label: "Bağlantı ve montaj sağlam mı?", type: "checkbox" },
      { id: "testKontrol", label: "Test butonu ile test yapıldı mı?", type: "checkbox" },
      { id: "panelKontrol", label: "Panel üzerinde hata kaydı yok mu?", type: "checkbox" }
    ]
  },
  "Yangın Dolabı": {
    altKategoriler: ["Hortumlu Yangın Dolabı", "Tüplü Yangın Dolabı", "Kombine Yangın Dolabı", "Köpüklü Sistem Dolabı"],
    bakimKontrolleri: [
      { id: "hortumKontrol", label: "Hortum hasarsız ve tam uzunlukta mı?", type: "checkbox" },
      { id: "vanaKontrol", label: "Vana açılıp kapanıyor mu?", type: "checkbox" },
      { id: "lansKontrol", label: "Lans çalışıyor mu?", type: "checkbox" },
      { id: "dolabKontrol", label: "Dolap kapısı açılıyor mu?", type: "checkbox" },
      { id: "isaretlemeKontrol", label: "İşaretleme levhaları mevcut mu?", type: "checkbox" }
    ]
  },
  "Yangın Battaniyesi": {
    altKategoriler: ["Duvar Tipi", "Çanta Tipi", "Kabinli Tip"],
    bakimKontrolleri: [
      { id: "fizikselKontrol", label: "Battaniye fiziksel olarak sağlam mı?", type: "checkbox" },
      { id: "muhafazaKontrol", label: "Muhafaza/çanta hasarsız mı?", type: "checkbox" },
      { id: "konumKontrol", label: "Erişilebilir konumda mı?", type: "checkbox" },
      { id: "isaretlemeKontrol", label: "İşaretleme levhası mevcut mu?", type: "checkbox" }
    ]
  },
  "Hidrant": {
    altKategoriler: ["Yer Üstü Hidrant", "Yer Altı Hidrant"],
    bakimKontrolleri: [
      { id: "vanaKontrol", label: "Vana açılıp kapanıyor mu?", type: "checkbox" },
      { id: "sizintiKontrol", label: "Sızıntı yok mu?", type: "checkbox" },
      { id: "kapakKontrol", label: "Kapak/gövde hasarsız mı?", type: "checkbox" },
      { id: "erisilebilirlikKontrol", label: "Çevresi engelsiz mi?", type: "checkbox" },
      { id: "isaretlemeKontrol", label: "İşaretleme levhası mevcut mu?", type: "checkbox" }
    ]
  },
  "İtfaiye Su Verme Bağlantısı": {
    altKategoriler: ["Cephe Tipi", "Serbest Dikili Tip", "Duvar Tipi"],
    bakimKontrolleri: [
      { id: "kaplinKontrol", label: "Kaplin hasarsız ve temiz mi?", type: "checkbox" },
      { id: "kapakKontrol", label: "Kör tapa/kapak yerinde mi?", type: "checkbox" },
      { id: "vanaKontrol", label: "Vana çalışıyor mu?", type: "checkbox" },
      { id: "erisilebilirlikKontrol", label: "Erişim engeli yok mu?", type: "checkbox" },
      { id: "isaretlemeKontrol", label: "İşaretleme levhası mevcut mu?", type: "checkbox" }
    ]
  },
  "Otomatik Gazlı Söndürme Sistemleri": {
    altKategoriler: ["FM-200", "Novec 1230 / FK-5-1-12", "CO₂", "İnert Gazlı Sistem", "Aerosol Sistem"],
    bakimKontrolleri: [
      { id: "basincKontrol", label: "Tüp basıncı uygun aralıkta mı?", type: "checkbox" },
      { id: "aktivasyonKontrol", label: "Aktivasyon mekanizması çalışıyor mu?", type: "checkbox" },
      { id: "nozulKontrol", label: "Nozullar tıkalı değil mi?", type: "checkbox" },
      { id: "uyariKontrol", label: "Tahliye uyarı sistemi çalışıyor mu?", type: "checkbox" },
      { id: "panelKontrol", label: "Panel entegrasyonu aktif mi?", type: "checkbox" }
    ]
  },
  "Yangın Perdesi": {
    altKategoriler: ["Duman Perdesi", "Alev Perdesi", "Yangın Dayanımlı Perde"],
    bakimKontrolleri: [
      { id: "motorKontrol", label: "Motor/mekanizma çalışıyor mu?", type: "checkbox" },
      { id: "aktivasyonKontrol", label: "Aktivasyon testi yapıldı mı?", type: "checkbox" },
      { id: "perdeKontrol", label: "Perde kumaşı/malzemesi hasarsız mı?", type: "checkbox" },
      { id: "engelKontrol", label: "Perde yolu engelsiz mi?", type: "checkbox" },
      { id: "gucKontrol", label: "Güç kaynağı aktif mi?", type: "checkbox" }
    ]
  },
  "Flaşör": {
    altKategoriler: ["İç Ortam Flaşör", "Dış Ortam Flaşör", "Sirenli Flaşör"],
    bakimKontrolleri: [
      { id: "isikKontrol", label: "Işık yanıyor mu?", type: "checkbox" },
      { id: "sesKontrol", label: "Ses çıkışı çalışıyor mu?", type: "checkbox" },
      { id: "baglantiKontrol", label: "Bağlantı ve montaj sağlam mı?", type: "checkbox" },
      { id: "gorunurlukKontrol", label: "Görünürlük engeli yok mu?", type: "checkbox" },
      { id: "testKontrol", label: "Panel üzerinden test yapıldı mı?", type: "checkbox" }
    ]
  },
  "Alarm Butonu": {
    altKategoriler: ["Kırılabilir Camlı Buton", "Resetlenebilir Buton", "Dış Ortam Butonu", "Ex-proof Buton"],
    bakimKontrolleri: [
      { id: "camKontrol", label: "Cam/kapak hasarsız mı?", type: "checkbox" },
      { id: "testKontrol", label: "Test anahtarı ile test yapıldı mı?", type: "checkbox" },
      { id: "panelKontrol", label: "Panel üzerinde alarm alındı mı?", type: "checkbox" },
      { id: "erisilebilirlikKontrol", label: "Erişim engeli yok mu?", type: "checkbox" },
      { id: "isaretlemeKontrol", label: "İşaretleme levhası mevcut mu?", type: "checkbox" }
    ]
  },
  "Yangın Paneli": {
    altKategoriler: ["Konvansiyonel Panel", "Adresli Panel", "Tekrarlayıcı Panel", "Söndürme Paneli"],
    bakimKontrolleri: [
      { id: "ekranKontrol", label: "Ekran/gösterge çalışıyor mu?", type: "checkbox" },
      { id: "akuKontrol", label: "Akü testi yapıldı mı?", type: "checkbox" },
      { id: "hataKontrol", label: "Sistemde hata kaydı yok mu?", type: "checkbox" },
      { id: "logKontrol", label: "Log kayıtları incelendi mi?", type: "checkbox" },
      { id: "testKontrol", label: "Sistem testi yapıldı mı?", type: "checkbox" }
    ]
  }
};

async function main() {
  const categories = await prisma.fireEquipmentCategory.findMany();
  
  // Build reverse map: categoryName -> checks
  const reverseMap = {};
  for (const mainCat of Object.keys(checklists)) {
    reverseMap[mainCat] = checklists[mainCat].bakimKontrolleri;
    for (const altCat of checklists[mainCat].altKategoriler) {
      reverseMap[altCat] = checklists[mainCat].bakimKontrolleri;
    }
  }

  for (const cat of categories) {
    if (reverseMap[cat.name]) {
      await prisma.fireEquipmentCategory.update({
        where: { id: cat.id },
        data: { maintenanceParameters: reverseMap[cat.name] }
      });
      console.log(`Updated maintenance parameters for ${cat.name}`);
    } else {
      console.log(`No match found for category: ${cat.name}`);
    }
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
