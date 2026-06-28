import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const checklists = {
  "Yangın Kapısı": {
    altKategoriler: ["Tek Kanatlı", "Çift Kanatlı", "Kayar Kapı"],
    inventoryParameters: [
      { name: "Yangın Dayanımı", options: ["30 dk", "60 dk", "90 dk", "120 dk"] },
      { name: "Özellik", options: ["E", "EI", "EW"] },
      { name: "Manyetik Tutucu", options: ["Var", "Yok"] },
      { name: "Kapatma Sistemi", options: ["Kendiliğinden Kapanır", "Harici Hidrolik Kapatıcı"] },
      { name: "Yangın Sistemi Entegrasyonu", options: ["Var", "Yok"] }
    ],
    bakimKontrolleri: [
      { id: "kapanmaKontrol", label: "Kapı kendiliğinden kapanıyor mu?", type: "checkbox" },
      { id: "contaKontrol", label: "Conta ve sızdırmazlık elemanları sağlam mı?", type: "checkbox" },
      { id: "menteseKontrol", label: "Menteşeler çalışıyor mu?", type: "checkbox" },
      { id: "kilitKontrol", label: "Kilit mekanizması çalışıyor mu?", type: "checkbox" },
      { id: "isaretlemeKontrol", label: "İşaretleme ve levhalar mevcut mu?", type: "checkbox" }
    ]
  },
  "Yangın Tüpü": {
    altKategoriler: ["AFFF Köpük", "HFC-227", "Karbondioksit", "Kuru Kimyevi Tozlu"],
    inventoryParameters: [
      { name: "Kapasite", options: ["2 kg", "5 kg", "6 kg", "9 kg", "12 kg", "25 kg", "50 kg"] },
      { name: "Kullanım Tipi", options: ["Taşınabilir", "Arabalı"] },
      { name: "Manometre", options: ["Var", "Yok"] },
      { name: "Açıklama", type: "text" }
    ],
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
    inventoryParameters: [
      { name: "Algılama Tipi", options: ["Optik Duman", "İyonize Duman", "Sabit Isı", "Isı Artış Hızı", "UV Alev", "IR Alev", "Gaz", "Kombine"] },
      { name: "Çalışma Prensibi", options: ["Adresli", "Konvansiyonel", "Kablosuz"] },
      { name: "Besleme Tipi", options: ["Panel Beslemeli", "Bataryalı", "Harici Güç Kaynaklı"] },
      { name: "Yangın Paneli Entegrasyonu", options: ["Var", "Yok"] },
      { name: "Alarm Göstergesi", options: ["LED Var", "LED Yok"] },
      { name: "Kullanım Alanı", options: ["İç Ortam", "Dış Ortam", "Patlayıcı Ortam / Ex-proof"] }
    ],
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
    inventoryParameters: [
      { name: "Hortum Tipi", options: ["Yarı Sert Hortum", "Yassı Hortum", "Kauçuk Hortum"] },
      { name: "Hortum Uzunluğu", options: ["20 m", "25 m", "30 m", "35 m"] },
      { name: "Hortum Çapı", options: ["1” (25 mm)", "3/4” (19 mm)"] },
      { name: "Nozzle Çapı", options: ["6 mm", "9 mm", "10 mm", "12 mm"] },
      { name: "Çalışma Basıncı", options: ["4 Bar", "6 Bar", "12 MPa"] },
      { name: "Debi", options: ["66 lt/min", "95 lt/min"] },
      { name: "Vana Tipi", options: ["Köşe Tip Yangın Vanası", "Küresel Tip Yangın Vanası", "Basınç Düşürücü Vana"] },
      { name: "Kapak Tipi", options: ["Ahşap Kapak", "Camlı Kapak"] }
    ],
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
    inventoryParameters: [
      { name: "Ölçü", options: ["100x100 cm", "120x120 cm", "120x180 cm", "180x180 cm"] },
      { name: "Malzeme", options: ["Cam Elyaf", "Silikon Kaplı Cam Elyaf", "Isıya Dayanıklı Kumaş"] },
      { name: "Muhafaza Tipi", options: ["Çanta", "Sert Kutu", "Dolap İçi"] }
    ],
    bakimKontrolleri: [
      { id: "fizikselKontrol", label: "Battaniye fiziksel olarak sağlam mı?", type: "checkbox" },
      { id: "muhafazaKontrol", label: "Muhafaza/çanta hasarsız mı?", type: "checkbox" },
      { id: "konumKontrol", label: "Erişilebilir konumda mı?", type: "checkbox" },
      { id: "isaretlemeKontrol", label: "İşaretleme levhası mevcut mu?", type: "checkbox" }
    ]
  },
  "Hidrant": {
    altKategoriler: ["Yer Üstü Hidrant", "Yer Altı Hidrant"],
    inventoryParameters: [
      { name: "Hidrant Tipi", options: ["Yer Üstü", "Yer Altı"] },
      { name: "Çıkış Sayısı", options: ["Tek Çıkışlı", "Çift Çıkışlı", "Üç Çıkışlı"] },
      { name: "Çıkış Çapı", options: ["DN65", "DN80", "DN100"] },
      { name: "Donmaya Karşı Koruma", options: ["Var", "Yok", "Gerekli Değil"] }
    ],
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
    inventoryParameters: [
      { name: "Bağlantı Tipi", options: ["Tek Ağızlı", "Çift Ağızlı"] },
      { name: "Bağlantı Çapı", options: ["DN65", "DN80", "DN100"] },
      { name: "Kaplin Tipi", options: ["Storz", "İtfaiye Standardına Uygun Kaplin", "Diğer"] },
      { name: "Çekvalf", options: ["Var", "Yok"] }
    ],
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
    inventoryParameters: [
      { name: "Söndürme Gazı Tipi", options: ["FM-200", "Novec 1230 / FK-5-1-12", "CO₂", "Argon", "Azot", "IG-541", "Aerosol"] },
      { name: "Sistem Tipi", options: ["Total Flooding", "Lokal Uygulama"] },
      { name: "Tüp Sayısı", options: ["1", "2", "3", "4 ve Üzeri"] },
      { name: "Otomatik Aktivasyon", options: ["Var", "Yok"] },
      { name: "Manuel Aktivasyon", options: ["Var", "Yok"] },
      { name: "Gecikme Süresi", options: ["Yok", "10 sn", "30 sn", "60 sn"] },
      { name: "Tahliye Uyarısı", options: ["Sesli", "Işıklı", "Sesli ve Işıklı", "Yok"] },
      { name: "Yangın Paneli Entegrasyonu", options: ["Var", "Yok"] },
      { name: "Korunan Mahal", options: ["Server Odası", "Elektrik Odası", "Arşiv", "Laboratuvar", "UPS Odası", "Diğer"] }
    ],
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
    inventoryParameters: [
      { name: "Yangın Dayanımı", options: ["30 dk", "60 dk", "90 dk", "120 dk"] },
      { name: "Özellik", options: ["E", "EW", "EI"] },
      { name: "Çalışma Tipi", options: ["Motorlu", "Ağırlık Kontrollü", "Yaylı Sistem"] },
      { name: "Aktivasyon Tipi", options: ["Otomatik", "Manuel", "Otomatik ve Manuel"] },
      { name: "Yangın Sistemi Entegrasyonu", options: ["Var", "Yok"] },
      { name: "Güç Kaynağı", options: ["Şebeke", "UPS Destekli", "Akü Destekli"] }
    ],
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
    inventoryParameters: [
      { name: "Uyarı Tipi", options: ["Işıklı", "Sesli-Işıklı"] },
      { name: "Işık Rengi", options: ["Kırmızı", "Beyaz", "Amber"] },
      { name: "Çalışma Prensibi", options: ["Adresli", "Konvansiyonel"] },
      { name: "Kullanım Alanı", options: ["İç Ortam", "Dış Ortam", "Islak Hacim", "Ex-proof Alan"] },
      { name: "Besleme Tipi", options: ["Panel Beslemeli", "Harici Güç Kaynaklı"] },
      { name: "Yangın Paneli Entegrasyonu", options: ["Var", "Yok"] }
    ],
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
    inventoryParameters: [
      { name: "Çalışma Prensibi", options: ["Adresli", "Konvansiyonel"] },
      { name: "Buton Tipi", options: ["Kırılabilir Camlı", "Resetlenebilir"] },
      { name: "Koruma Kapağı", options: ["Var", "Yok"] },
      { name: "Kullanım Alanı", options: ["İç Ortam", "Dış Ortam", "Islak Hacim", "Ex-proof Alan"] },
      { name: "Yangın Paneli Entegrasyonu", options: ["Var", "Yok"] },
      { name: "Test Anahtarı", options: ["Var", "Yok"] }
    ],
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
    inventoryParameters: [
      { name: "Panel Tipi", options: ["Konvansiyonel", "Adresli", "Tekrarlayıcı", "Söndürme Kontrol Paneli"] },
      { name: "Zon / Loop Kapasitesi", options: ["2 Zon", "4 Zon", "8 Zon", "1 Loop", "2 Loop", "4 Loop ve Üzeri"] },
      { name: "Bağlı Cihaz Tipleri", options: ["Dedektör", "Alarm Butonu", "Flaşör", "Siren", "Modül", "Söndürme Sistemi"] },
      { name: "Akü Yedeklemesi", options: ["Var", "Yok"] },
      { name: "Hata İzleme", options: ["Var", "Yok"] },
      { name: "Yangın Senaryosu Entegrasyonu", options: ["Var", "Yok"] },
      { name: "BMS / Otomasyon Entegrasyonu", options: ["Var", "Yok"] },
      { name: "Log / Olay Kaydı", options: ["Var", "Yok"] }
    ],
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
  console.log('Seeding Fire Equipment Categories...');
  
  for (const mainCat of Object.keys(checklists)) {
    // Check if main category exists
    let category = await prisma.fireEquipmentCategory.findFirst({
      where: { name: mainCat, parentId: null }
    });
    
    if (!category) {
      category = await prisma.fireEquipmentCategory.create({
        data: {
          name: mainCat,
          maintenanceParameters: checklists[mainCat as keyof typeof checklists].bakimKontrolleri,
          inventoryParameters: checklists[mainCat as keyof typeof checklists].inventoryParameters
        }
      });
      console.log(`Created Main Category: ${mainCat}`);
    } else {
      // Update parameters just in case
      await prisma.fireEquipmentCategory.update({
        where: { id: category.id },
        data: { 
          maintenanceParameters: checklists[mainCat as keyof typeof checklists].bakimKontrolleri,
          inventoryParameters: checklists[mainCat as keyof typeof checklists].inventoryParameters
        }
      });
    }

    // Process subcategories
    const subcats = checklists[mainCat as keyof typeof checklists].altKategoriler;
    for (const subCatName of subcats) {
      let subCategory = await prisma.fireEquipmentCategory.findFirst({
        where: { name: subCatName, parentId: category.id }
      });
      
      if (!subCategory) {
        await prisma.fireEquipmentCategory.create({
          data: {
            name: subCatName,
            parentId: category.id,
            maintenanceParameters: checklists[mainCat as keyof typeof checklists].bakimKontrolleri,
            inventoryParameters: checklists[mainCat as keyof typeof checklists].inventoryParameters
          }
        });
        console.log(`Created Subcategory: ${subCatName} under ${mainCat}`);
      } else {
        await prisma.fireEquipmentCategory.update({
          where: { id: subCategory.id },
          data: { 
            maintenanceParameters: checklists[mainCat as keyof typeof checklists].bakimKontrolleri,
            inventoryParameters: checklists[mainCat as keyof typeof checklists].inventoryParameters
          }
        });
      }
    }
  }
  console.log('Seeding complete.');
}

main()
  .catch(e => {
    console.error(e);
    // @ts-ignore
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
