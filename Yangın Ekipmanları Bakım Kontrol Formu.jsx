const { useState, useRef } = React;

const categories = {
  "Yangın Kapısı": {
    altKategoriler: ["Tek Kanatlı", "Çift Kanatlı", "Kayar Kapı"],
    parametreler: [
      { id: "yanginDayanimi", label: "Yangın Dayanımı", tip: "secim", secenekler: ["30 dk", "60 dk", "90 dk", "120 dk"] },
      { id: "ozellik", label: "Özellik", tip: "secim", secenekler: ["E", "EI", "EW"] },
      { id: "manyetikTutucu", label: "Manyetik Tutucu", tip: "secim", secenekler: ["Var", "Yok"] },
      { id: "kapatmaSistemi", label: "Kapatma Sistemi", tip: "secim", secenekler: ["Kendiliğinden Kapanır", "Harici Hidrolik Kapatıcı"] },
      { id: "yanginSistemiEntegrasyon", label: "Yangın Sistemi Entegrasyonu", tip: "secim", secenekler: ["Var", "Yok"] },
    ],
    bakimKontrolleri: [
      { id: "kapanmaKontrol", label: "Kapı kendiliğinden kapanıyor mu?" },
      { id: "contaKontrol", label: "Conta ve sızdırmazlık elemanları sağlam mı?" },
      { id: "menteseKontrol", label: "Menteşeler çalışıyor mu?" },
      { id: "kilitKontrol", label: "Kilit mekanizması çalışıyor mu?" },
      { id: "isaretlemeKontrol", label: "İşaretleme ve levhalar mevcut mu?" },
    ]
  },
  "Yangın Tüpü": {
    altKategoriler: ["Kuru Kimyevi Tozlu", "CO₂", "Köpüklü", "Sulu", "Temiz Gazlı"],
    parametreler: [
      { id: "sondurme", label: "Söndürme Maddesi", tip: "secim", secenekler: ["KKT", "CO₂", "Köpük", "Su", "Temiz Gaz"] },
      { id: "kapasite", label: "Kapasite", tip: "secim", secenekler: ["2 kg", "5 kg", "6 kg", "9 kg", "12 kg", "25 kg", "50 kg"] },
      { id: "kullanimTipi", label: "Kullanım Tipi", tip: "secim", secenekler: ["Taşınabilir", "Arabalı"] },
      { id: "basinc", label: "Basınç Durumu", tip: "secim", secenekler: ["Basınçlı", "Kartuşlu"] },
      { id: "manometre", label: "Manometre", tip: "secim", secenekler: ["Var", "Yok"] },
      { id: "periyodikKontrol", label: "Periyodik Kontrol Durumu", tip: "durum", secenekler: ["Uygun", "Uygun Değil", "Kontrol Bekliyor"] },
      { id: "dolumTarihi", label: "Dolum / Hidrostatik Test Tarihi", tip: "tarih" },
    ],
    bakimKontrolleri: [
      { id: "manometreOkuma", label: "Manometre yeşil bölgede mi?" },
      { id: "guvenlikPimi", label: "Güvenlik pimi yerinde mi?" },
      { id: "hortumKontrol", label: "Hortum ve lans hasarsız mı?" },
      { id: "etiketKontrol", label: "Etiket ve son kullanma tarihi okunuyor mu?" },
      { id: "konumKontrol", label: "Tüp erişilebilir konumda mı?" },
    ]
  },
  "Dedektör": {
    altKategoriler: ["Duman Dedektörü", "Isı Dedektörü", "Alev Dedektörü", "Gaz Dedektörü", "Kombine Dedektör"],
    parametreler: [
      { id: "algilamaTipi", label: "Algılama Tipi", tip: "secim", secenekler: ["Optik Duman", "İyonize Duman", "Sabit Isı", "Isı Artış Hızı", "UV Alev", "IR Alev", "Gaz", "Kombine"] },
      { id: "calismaPrensibi", label: "Çalışma Prensibi", tip: "secim", secenekler: ["Adresli", "Konvansiyonel", "Kablosuz"] },
      { id: "beslemeTipi", label: "Besleme Tipi", tip: "secim", secenekler: ["Panel Beslemeli", "Bataryalı", "Harici Güç Kaynaklı"] },
      { id: "panelEntegrasyon", label: "Yangın Paneli Entegrasyonu", tip: "secim", secenekler: ["Var", "Yok"] },
      { id: "alarmGostergesi", label: "Alarm Göstergesi", tip: "secim", secenekler: ["LED Var", "LED Yok"] },
      { id: "kullanimAlani", label: "Kullanım Alanı", tip: "secim", secenekler: ["İç Ortam", "Dış Ortam", "Patlayıcı Ortam / Ex-proof"] },
      { id: "testDurumu", label: "Test Durumu", tip: "durum", secenekler: ["Uygun", "Uygun Değil", "Test Edilemedi"] },
      { id: "kirlilikDurumu", label: "Kirlilik / Hassasiyet Durumu", tip: "durum", secenekler: ["Normal", "Temizlik Gerekli", "Değişim Gerekli"] },
    ],
    bakimKontrolleri: [
      { id: "ledKontrol", label: "LED göstergesi yanıyor mu?" },
      { id: "temizlikKontrol", label: "Dedektör yüzeyi temiz mi?" },
      { id: "baglantiKontrol", label: "Bağlantı ve montaj sağlam mı?" },
      { id: "testKontrol", label: "Test butonu ile test yapıldı mı?" },
      { id: "panelKontrol", label: "Panel üzerinde hata kaydı yok mu?" },
    ]
  },
  "Yangın Dolabı": {
    altKategoriler: ["Hortumlu Yangın Dolabı", "Tüplü Yangın Dolabı", "Kombine Yangın Dolabı", "Köpüklü Sistem Dolabı"],
    parametreler: [
      { id: "hortumTipi", label: "Hortum Tipi", tip: "secim", secenekler: ["Yassı Hortum", "Kauçuk Hortum", "Yarı Sert Hortum"] },
      { id: "hortumUzunlugu", label: "Hortum Uzunluğu", tip: "secim", secenekler: ["20 m", "25 m", "30 m"] },
      { id: "hortumCapi", label: "Hortum Çapı", tip: "secim", secenekler: ["1\"", "1½\"", "2\""] },
      { id: "lansTipi", label: "Lans Tipi", tip: "secim", secenekler: ["Açma-Kapama Lanslı", "Sis / Jet Ayarlı Lanslı"] },
      { id: "vanaTipi", label: "Vana Tipi", tip: "secim", secenekler: ["Köşe Vana", "Küresel Vana", "Basınç Düşürücü Vana"] },
      { id: "suBasinciDurumu", label: "Su Basıncı Durumu", tip: "durum", secenekler: ["Uygun", "Düşük", "Yüksek", "Ölçülmedi"] },
      { id: "erisilebilirlik", label: "Erişilebilirlik Durumu", tip: "durum", secenekler: ["Uygun", "Engelli", "İşaretleme Eksik"] },
    ],
    bakimKontrolleri: [
      { id: "hortumKontrol", label: "Hortum hasarsız ve tam uzunlukta mı?" },
      { id: "vanaKontrol", label: "Vana açılıp kapanıyor mu?" },
      { id: "lansKontrol", label: "Lans çalışıyor mu?" },
      { id: "dolabKontrol", label: "Dolap kapısı açılıyor mu?" },
      { id: "isaretlemeKontrol", label: "İşaretleme levhaları mevcut mu?" },
    ]
  },
  "Yangın Battaniyesi": {
    altKategoriler: ["Duvar Tipi", "Çanta Tipi", "Kabinli Tip"],
    parametreler: [
      { id: "olcu", label: "Ölçü", tip: "secim", secenekler: ["100x100 cm", "120x120 cm", "120x180 cm", "180x180 cm"] },
      { id: "malzeme", label: "Malzeme", tip: "secim", secenekler: ["Cam Elyaf", "Silikon Kaplı Cam Elyaf", "Isıya Dayanıklı Kumaş"] },
      { id: "muhafazaTipi", label: "Muhafaza Tipi", tip: "secim", secenekler: ["Çanta", "Sert Kutu", "Dolap İçi"] },
      { id: "erisilebilirlik", label: "Erişilebilirlik Durumu", tip: "durum", secenekler: ["Uygun", "Engelli", "İşaretleme Eksik"] },
      { id: "fizikselDurum", label: "Fiziksel Durum", tip: "durum", secenekler: ["Uygun", "Yıpranmış", "Eksik", "Kullanılmış"] },
    ],
    bakimKontrolleri: [
      { id: "fizikselKontrol", label: "Battaniye fiziksel olarak sağlam mı?" },
      { id: "muhafazaKontrol", label: "Muhafaza/çanta hasarsız mı?" },
      { id: "konumKontrol", label: "Erişilebilir konumda mı?" },
      { id: "isaretlemeKontrol", label: "İşaretleme levhası mevcut mu?" },
    ]
  },
  "Hidrant": {
    altKategoriler: ["Yer Üstü Hidrant", "Yer Altı Hidrant"],
    parametreler: [
      { id: "hidrantTipi", label: "Hidrant Tipi", tip: "secim", secenekler: ["Yer Üstü", "Yer Altı"] },
      { id: "cikisSayisi", label: "Çıkış Sayısı", tip: "secim", secenekler: ["Tek Çıkışlı", "Çift Çıkışlı", "Üç Çıkışlı"] },
      { id: "cikisCapi", label: "Çıkış Çapı", tip: "secim", secenekler: ["DN65", "DN80", "DN100"] },
      { id: "suBasinciDurumu", label: "Su Basıncı Durumu", tip: "durum", secenekler: ["Uygun", "Düşük", "Yüksek", "Ölçülmedi"] },
      { id: "vanaDurumu", label: "Vana Durumu", tip: "durum", secenekler: ["Açık", "Kapalı", "Arızalı", "Kontrol Edilemedi"] },
      { id: "kapakGovdeDurumu", label: "Kapak / Gövde Durumu", tip: "durum", secenekler: ["Uygun", "Hasarlı", "Paslı", "Eksik"] },
      { id: "donmaKoruma", label: "Donmaya Karşı Koruma", tip: "secim", secenekler: ["Var", "Yok", "Gerekli Değil"] },
      { id: "erisilebilirlik", label: "Erişilebilirlik Durumu", tip: "durum", secenekler: ["Uygun", "Engelli", "İşaretleme Eksik"] },
    ],
    bakimKontrolleri: [
      { id: "vanaKontrol", label: "Vana açılıp kapanıyor mu?" },
      { id: "sizintiKontrol", label: "Sızıntı var mı?" },
      { id: "kapakKontrol", label: "Kapak/gövde hasarsız mı?" },
      { id: "erisilebilirlikKontrol", label: "Çevresi engelsiz mi?" },
      { id: "isaretlemeKontrol", label: "İşaretleme levhası mevcut mu?" },
    ]
  },
  "İtfaiye Su Verme Bağlantısı": {
    altKategoriler: ["Cephe Tipi", "Serbest Dikili Tip", "Duvar Tipi"],
    parametreler: [
      { id: "baglantiTipi", label: "Bağlantı Tipi", tip: "secim", secenekler: ["Tek Ağızlı", "Çift Ağızlı"] },
      { id: "baglantıCapi", label: "Bağlantı Çapı", tip: "secim", secenekler: ["DN65", "DN80", "DN100"] },
      { id: "kaplinTipi", label: "Kaplin Tipi", tip: "secim", secenekler: ["Storz", "İtfaiye Standardına Uygun Kaplin", "Diğer"] },
      { id: "cekvalf", label: "Çekvalf", tip: "secim", secenekler: ["Var", "Yok"] },
      { id: "vanaDurumu", label: "Vana Durumu", tip: "durum", secenekler: ["Açık", "Kapalı", "Arızalı", "Kontrol Edilemedi"] },
      { id: "kapakDurumu", label: "Kapak / Kör Tapa Durumu", tip: "durum", secenekler: ["Var", "Yok", "Hasarlı"] },
      { id: "isaretleme", label: "İşaretleme", tip: "durum", secenekler: ["Var", "Yok", "Yetersiz"] },
      { id: "erisilebilirlik", label: "Erişilebilirlik Durumu", tip: "durum", secenekler: ["Uygun", "Engelli", "Araç Parkı ile Engelli"] },
    ],
    bakimKontrolleri: [
      { id: "kaplinKontrol", label: "Kaplin hasarsız ve temiz mi?" },
      { id: "kapakKontrol", label: "Kör tapa/kapak yerinde mi?" },
      { id: "vanaKontrol", label: "Vana çalışıyor mu?" },
      { id: "erisilebilirlikKontrol", label: "Erişim engeli yok mu?" },
      { id: "isaretlemeKontrol", label: "İşaretleme levhası mevcut mu?" },
    ]
  },
  "Otomatik Gazlı Söndürme Sistemleri": {
    altKategoriler: ["FM-200", "Novec 1230 / FK-5-1-12", "CO₂", "İnert Gazlı Sistem", "Aerosol Sistem"],
    parametreler: [
      { id: "gazTipi", label: "Söndürme Gazı Tipi", tip: "secim", secenekler: ["FM-200", "Novec 1230 / FK-5-1-12", "CO₂", "Argon", "Azot", "IG-541", "Aerosol"] },
      { id: "sistemTipi", label: "Sistem Tipi", tip: "secim", secenekler: ["Total Flooding", "Lokal Uygulama"] },
      { id: "tupSayisi", label: "Tüp Sayısı", tip: "secim", secenekler: ["1", "2", "3", "4 ve Üzeri"] },
      { id: "tupBasinc", label: "Tüp Basınç Durumu", tip: "durum", secenekler: ["Uygun", "Düşük", "Yüksek", "Ölçülmedi"] },
      { id: "otomatikAktivasyon", label: "Otomatik Aktivasyon", tip: "secim", secenekler: ["Var", "Yok"] },
      { id: "manuelAktivasyon", label: "Manuel Aktivasyon", tip: "secim", secenekler: ["Var", "Yok"] },
      { id: "gecikme", label: "Gecikme Süresi", tip: "secim", secenekler: ["Yok", "10 sn", "30 sn", "60 sn"] },
      { id: "tahliyeUyarisi", label: "Tahliye Uyarısı", tip: "secim", secenekler: ["Sesli", "Işıklı", "Sesli ve Işıklı", "Yok"] },
      { id: "panelEntegrasyon", label: "Yangın Paneli Entegrasyonu", tip: "secim", secenekler: ["Var", "Yok"] },
      { id: "korunanMahal", label: "Korunan Mahal", tip: "secim", secenekler: ["Server Odası", "Elektrik Odası", "Arşiv", "Laboratuvar", "UPS Odası", "Diğer"] },
    ],
    bakimKontrolleri: [
      { id: "basincKontrol", label: "Tüp basıncı uygun aralıkta mı?" },
      { id: "aktivasyonKontrol", label: "Aktivasyon mekanizması çalışıyor mu?" },
      { id: "nozulKontrol", label: "Nozullar tıkalı değil mi?" },
      { id: "uyariKontrol", label: "Tahliye uyarı sistemi çalışıyor mu?" },
      { id: "panelKontrol", label: "Panel entegrasyonu aktif mi?" },
    ]
  },
  "Yangın Perdesi": {
    altKategoriler: ["Duman Perdesi", "Alev Perdesi", "Yangın Dayanımlı Perde"],
    parametreler: [
      { id: "yanginDayanimi", label: "Yangın Dayanımı", tip: "secim", secenekler: ["30 dk", "60 dk", "90 dk", "120 dk"] },
      { id: "ozellik", label: "Özellik", tip: "secim", secenekler: ["E", "EW", "EI"] },
      { id: "calismaTipi", label: "Çalışma Tipi", tip: "secim", secenekler: ["Motorlu", "Ağırlık Kontrollü", "Yaylı Sistem"] },
      { id: "aktivasyonTipi", label: "Aktivasyon Tipi", tip: "secim", secenekler: ["Otomatik", "Manuel", "Otomatik ve Manuel"] },
      { id: "panelEntegrasyon", label: "Yangın Sistemi Entegrasyonu", tip: "secim", secenekler: ["Var", "Yok"] },
      { id: "gucKaynagi", label: "Güç Kaynağı", tip: "secim", secenekler: ["Şebeke", "UPS Destekli", "Akü Destekli"] },
      { id: "konumDurumu", label: "Konum Durumu", tip: "durum", secenekler: ["Açık", "Kapalı", "Bekleme Konumunda", "Arızalı"] },
      { id: "engelDurumu", label: "Engel Durumu", tip: "durum", secenekler: ["Engelsiz", "Kısmen Engelli", "Engelli"] },
    ],
    bakimKontrolleri: [
      { id: "motorKontrol", label: "Motor/mekanizma çalışıyor mu?" },
      { id: "aktivasyonKontrol", label: "Aktivasyon testi yapıldı mı?" },
      { id: "perdeKontrol", label: "Perde kumaşı/malzemesi hasarsız mı?" },
      { id: "engelKontrol", label: "Perde yolu engelsiz mi?" },
      { id: "gucKontrol", label: "Güç kaynağı aktif mi?" },
    ]
  },
  "Flaşör": {
    altKategoriler: ["İç Ortam Flaşör", "Dış Ortam Flaşör", "Sirenli Flaşör"],
    parametreler: [
      { id: "uyariTipi", label: "Uyarı Tipi", tip: "secim", secenekler: ["Işıklı", "Sesli-Işıklı"] },
      { id: "isikRengi", label: "Işık Rengi", tip: "secim", secenekler: ["Kırmızı", "Beyaz", "Amber"] },
      { id: "calismaPrensibi", label: "Çalışma Prensibi", tip: "secim", secenekler: ["Adresli", "Konvansiyonel"] },
      { id: "kullanimAlani", label: "Kullanım Alanı", tip: "secim", secenekler: ["İç Ortam", "Dış Ortam", "Islak Hacim", "Ex-proof Alan"] },
      { id: "beslemeTipi", label: "Besleme Tipi", tip: "secim", secenekler: ["Panel Beslemeli", "Harici Güç Kaynaklı"] },
      { id: "panelEntegrasyon", label: "Yangın Paneli Entegrasyonu", tip: "secim", secenekler: ["Var", "Yok"] },
      { id: "testDurumu", label: "Test Durumu", tip: "durum", secenekler: ["Uygun", "Uygun Değil", "Test Edilemedi"] },
      { id: "gorunurlukDurumu", label: "Görünürlük Durumu", tip: "durum", secenekler: ["Uygun", "Kısmen Engelli", "Engelli"] },
    ],
    bakimKontrolleri: [
      { id: "isikKontrol", label: "Işık yanıyor mu?" },
      { id: "sesKontrol", label: "Ses çıkışı çalışıyor mu? (varsa)" },
      { id: "baglantiKontrol", label: "Bağlantı ve montaj sağlam mı?" },
      { id: "gorunurlukKontrol", label: "Görünürlük engeli yok mu?" },
      { id: "testKontrol", label: "Panel üzerinden test yapıldı mı?" },
    ]
  },
  "Alarm Butonu": {
    altKategoriler: ["Kırılabilir Camlı Buton", "Resetlenebilir Buton", "Dış Ortam Butonu", "Ex-proof Buton"],
    parametreler: [
      { id: "calismaPrensibi", label: "Çalışma Prensibi", tip: "secim", secenekler: ["Adresli", "Konvansiyonel"] },
      { id: "butonTipi", label: "Buton Tipi", tip: "secim", secenekler: ["Kırılabilir Camlı", "Resetlenebilir"] },
      { id: "korumaKapagi", label: "Koruma Kapağı", tip: "secim", secenekler: ["Var", "Yok"] },
      { id: "kullanimAlani", label: "Kullanım Alanı", tip: "secim", secenekler: ["İç Ortam", "Dış Ortam", "Islak Hacim", "Ex-proof Alan"] },
      { id: "panelEntegrasyon", label: "Yangın Paneli Entegrasyonu", tip: "secim", secenekler: ["Var", "Yok"] },
      { id: "testAnahtari", label: "Test Anahtarı", tip: "secim", secenekler: ["Var", "Yok"] },
      { id: "isaretleme", label: "İşaretleme", tip: "durum", secenekler: ["Var", "Yok", "Yetersiz"] },
      { id: "erisilebilirlik", label: "Erişilebilirlik Durumu", tip: "durum", secenekler: ["Uygun", "Engelli", "Yüksek / Alçak Montajlı"] },
    ],
    bakimKontrolleri: [
      { id: "camKontrol", label: "Cam/kapak hasarsız mı?" },
      { id: "testKontrol", label: "Test anahtarı ile test yapıldı mı?" },
      { id: "panelKontrol", label: "Panel üzerinde alarm alındı mı?" },
      { id: "erisilebilirlikKontrol", label: "Erişim engeli yok mu?" },
      { id: "isaretlemeKontrol", label: "İşaretleme levhası mevcut mu?" },
    ]
  },
  "Yangın Paneli": {
    altKategoriler: ["Konvansiyonel Panel", "Adresli Panel", "Tekrarlayıcı Panel", "Söndürme Paneli"],
    parametreler: [
      { id: "panelTipi", label: "Panel Tipi", tip: "secim", secenekler: ["Konvansiyonel", "Adresli", "Tekrarlayıcı", "Söndürme Kontrol Paneli"] },
      { id: "zonKapasite", label: "Zon / Loop Kapasitesi", tip: "secim", secenekler: ["2 Zon", "4 Zon", "8 Zon", "1 Loop", "2 Loop", "4 Loop ve Üzeri"] },
      { id: "akuYedekleme", label: "Akü Yedeklemesi", tip: "secim", secenekler: ["Var", "Yok"] },
      { id: "akuDurumu", label: "Akü Durumu", tip: "durum", secenekler: ["Uygun", "Zayıf", "Arızalı", "Test Edilmedi"] },
      { id: "hataIzleme", label: "Hata İzleme", tip: "secim", secenekler: ["Var", "Yok"] },
      { id: "yanginSenaryosu", label: "Yangın Senaryosu Entegrasyonu", tip: "secim", secenekler: ["Var", "Yok"] },
      { id: "bmsEntegrasyon", label: "BMS / Otomasyon Entegrasyonu", tip: "secim", secenekler: ["Var", "Yok"] },
      { id: "logKaydi", label: "Log / Olay Kaydı", tip: "secim", secenekler: ["Var", "Yok"] },
      { id: "panelDurumu", label: "Panel Durumu", tip: "durum", secenekler: ["Normal", "Yangın Alarmı", "Hata", "Devre Dışı", "Test Modu"] },
    ],
    bakimKontrolleri: [
      { id: "ekranKontrol", label: "Ekran/gösterge çalışıyor mu?" },
      { id: "akuKontrol", label: "Akü testi yapıldı mı?" },
      { id: "hataKontrol", label: "Aktif hata kaydı var mı?" },
      { id: "logKontrol", label: "Log kayıtları incelendi mi?" },
      { id: "testKontrol", label: "Sistem testi yapıldı mı?" },
    ]
  }
};

const statusColors = {
  "Uygun": "bg-green-100 text-green-800 border-green-300",
  "Normal": "bg-green-100 text-green-800 border-green-300",
  "Var": "bg-green-100 text-green-800 border-green-300",
  "Uygun Değil": "bg-red-100 text-red-800 border-red-300",
  "Arızalı": "bg-red-100 text-red-800 border-red-300",
  "Değişim Gerekli": "bg-red-100 text-red-800 border-red-300",
  "Engelli": "bg-red-100 text-red-800 border-red-300",
  "Kontrol Bekliyor": "bg-yellow-100 text-yellow-800 border-yellow-300",
  "Temizlik Gerekli": "bg-yellow-100 text-yellow-800 border-yellow-300",
  "Test Edilemedi": "bg-yellow-100 text-yellow-800 border-yellow-300",
  "Düşük": "bg-orange-100 text-orange-800 border-orange-300",
  "Yüksek": "bg-orange-100 text-orange-800 border-orange-300",
  "Ölçülmedi": "bg-gray-100 text-gray-800 border-gray-300",
};

function App() {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [formData, setFormData] = useState({});
  const [checkboxes, setCheckboxes] = useState({});
  const [altKategori, setAltKategori] = useState("");
  const [ekipmanAdi, setEkipmanAdi] = useState("");
  const [kontrolTarihi, setKontrolTarihi] = useState(new Date().toISOString().split('T')[0]);
  const [teknisyen, setTeknisyen] = useState("");
  const [notlar, setNotlar] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [savedRecords, setSavedRecords] = useState([]);
  const [view, setView] = useState("form"); // "form" | "records"

  const handleCategorySelect = (cat) => {
    setSelectedCategory(cat);
    setFormData({});
    setCheckboxes({});
    setAltKategori("");
    setSubmitted(false);
  };

  const handleParam = (id, value) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleCheck = (id) => {
    setCheckboxes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSubmit = () => {
    const record = {
      id: Date.now(),
      kategori: selectedCategory,
      altKategori,
      ekipmanAdi,
      kontrolTarihi,
      teknisyen,
      notlar,
      parametreler: formData,
      bakimKontrolleri: checkboxes,
      sonuc: getSonuc(),
    };
    setSavedRecords(prev => [record, ...prev]);
    setSubmitted(true);
  };

  const getSonuc = () => {
    if (!selectedCategory) return null;
    const cat = categories[selectedCategory];
    const total = cat.bakimKontrolleri.length;
    const checked = cat.bakimKontrolleri.filter(k => checkboxes[k.id]).length;
    if (checked === total) return "Uygun";
    if (checked >= total * 0.7) return "Kısmen Uygun";
    return "Uygun Değil";
  };

  const sonuc = getSonuc();

  const catKeys = Object.keys(categories);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <div className="bg-red-700 text-white px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🔥</span>
          <div>
            <div className="text-xl font-bold">Yangın Ekipmanları Bakım Kontrol Formu</div>
            <div className="text-red-200 text-sm">Periyodik Bakım & Kontrol Sistemi</div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView("form")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === "form" ? "bg-white text-red-700" : "bg-red-600 text-white hover:bg-red-500"}`}
          >
            📋 Yeni Kontrol
          </button>
          <button
            onClick={() => setView("records")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === "records" ? "bg-white text-red-700" : "bg-red-600 text-white hover:bg-red-500"}`}
          >
            📁 Kayıtlar ({savedRecords.length})
          </button>
        </div>
      </div>

      {view === "records" ? (
        <div className="max-w-5xl mx-auto p-6">
          <h2 className="text-lg font-bold text-gray-700 mb-4">Kaydedilen Kontrol Kayıtları</h2>
          {savedRecords.length === 0 ? (
            <div className="bg-white rounded-xl p-10 text-center text-gray-400 shadow">
              <div className="text-5xl mb-3">📭</div>
              <div>Henüz kayıt bulunmuyor.</div>
            </div>
          ) : (
            <div className="space-y-4">
              {savedRecords.map(rec => (
                <div key={rec.id} className="bg-white rounded-xl shadow p-5 border-l-4 border-red-500">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-bold text-gray-800">{rec.ekipmanAdi || rec.kategori}</span>
                      <span className="ml-2 text-sm text-gray-500">{rec.kategori} / {rec.altKategori}</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      rec.sonuc === "Uygun" ? "bg-green-100 text-green-800 border-green-300" :
                      rec.sonuc === "Kısmen Uygun" ? "bg-yellow-100 text-yellow-800 border-yellow-300" :
                      "bg-red-100 text-red-800 border-red-300"
                    }`}>{rec.sonuc}</span>
                  </div>
                  <div className="text-sm text-gray-500 flex gap-4 flex-wrap">
                    <span>📅 {rec.kontrolTarihi}</span>
                    {rec.teknisyen && <span>👤 {rec.teknisyen}</span>}
                    {rec.notlar && <span>📝 {rec.notlar}</span>}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {categories[rec.kategori]?.bakimKontrolleri.map(k => (
                      <span key={k.id} className={`text-xs px-2 py-1 rounded-full border ${rec.bakimKontrolleri[k.id] ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                        {rec.bakimKontrolleri[k.id] ? "✅" : "❌"} {k.label}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="max-w-5xl mx-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Sol: Kategori Seçimi */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-xl shadow p-4">
              <div className="text-sm font-bold text-gray-600 mb-3 uppercase tracking-wide">Ekipman Kategorisi</div>
              <div className="space-y-1">
                {catKeys.map(cat => (
                  <button
                    key={cat}
                    onClick={() => handleCategorySelect(cat)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${selectedCategory === cat ? "bg-red-600 text-white font-semibold" : "hover:bg-red-50 text-gray-700"}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sağ: Form */}
          <div className="md:col-span-2">
            {!selectedCategory ? (
              <div className="bg-white rounded-xl shadow p-10 text-center text-gray-400">
                <div className="text-5xl mb-3">👈</div>
                <div className="text-lg font-medium">Lütfen sol taraftan bir ekipman kategorisi seçin.</div>
              </div>
            ) : submitted ? (
              <div className="bg-white rounded-xl shadow p-8 text-center">
                <div className="text-5xl mb-3">✅</div>
                <div className="text-xl font-bold text-green-700 mb-2">Kontrol Kaydedildi!</div>
                <div className={`inline-block px-4 py-2 rounded-full font-bold text-sm border mb-4 ${
                  sonuc === "Uygun" ? "bg-green-100 text-green-800 border-green-300" :
                  sonuc === "Kısmen Uygun" ? "bg-yellow-100 text-yellow-800 border-yellow-300" :
                  "bg-red-100 text-red-800 border-red-300"
                }`}>Genel Sonuç: {sonuc}</div>
                <div className="flex gap-3 justify-center mt-4">
                  <button
                    onClick={() => { setSubmitted(false); setFormData({}); setCheckboxes({}); setAltKategori(""); setEkipmanAdi(""); setNotlar(""); setTeknisyen(""); }}
                    className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                  >
                    Yeni Kontrol
                  </button>
                  <button
                    onClick={() => setView("records")}
                    className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                  >
                    Kayıtları Gör
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Genel Bilgiler */}
                <div className="bg-white rounded-xl shadow p-5">
                  <div className="text-sm font-bold text-gray-600 mb-3 uppercase tracking-wide">📌 Genel Bilgiler</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Ekipman Adı / Konum</label>
                      <input
                        type="text"
                        value={ekipmanAdi}
                        onChange={e => setEkipmanAdi(e.target.value)}
                        placeholder="Örn: B Blok 2. Kat Koridor"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Alt Kategori</label>
                      <select
                        value={altKategori}
                        onChange={e => setAltKategori(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                      >
                        <option value="">Seçiniz...</option>
                        {categories[selectedCategory].altKategoriler.map(a => (
                          <option key={a} value={a}>{a}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Kontrol Tarihi</label>
                      <input
                        type="date"
                        value={kontrolTarihi}
                        onChange={e => setKontrolTarihi(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Teknisyen / Kontrol Eden</label>
                      <input
                        type="text"
                        value={teknisyen}
                        onChange={e => setTeknisyen(e.target.value)}
                        placeholder="Ad Soyad"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                      />
                    </div>
                  </div>
                </div>

                {/* Parametreler */}
                <div className="bg-white rounded-xl shadow p-5">
                  <div className="text-sm font-bold text-gray-600 mb-3 uppercase tracking-wide">⚙️ Ekipman Parametreleri</div>
                  <div className="grid grid-cols-2 gap-3">
                    {categories[selectedCategory].parametreler.map(param => (
                      <div key={param.id}>
                        <label className="text-xs text-gray-500 mb-1 block">{param.label}</label>
                        {param.tip === "tarih" ? (
                          <input
                            type="date"
                            value={formData[param.id] || ""}
                            onChange={e => handleParam(param.id, e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                          />
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {param.secenekler.map(s => {
                              const isSelected = formData[param.id] === s;
                              const colorClass = (param.tip === "durum" && statusColors[s]) ? statusColors[s] : "";
                              return (
                                <button
                                  key={s}
                                  onClick={() => handleParam(param.id, s)}
                                  className={`px-2 py-1 rounded-lg text-xs border transition-all font-medium ${
                                    isSelected
                                      ? (colorClass || "bg-red-600 text-white border-red-600")
                                      : "bg-gray-50 text-gray-600 border-gray-200 hover:border-red-300"
                                  }`}
                                >
                                  {s}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bakım Kontrolleri */}
                <div className="bg-white rounded-xl shadow p-5">
                  <div className="text-sm font-bold text-gray-600 mb-3 uppercase tracking-wide">✅ Bakım Kontrol Listesi</div>
                  <div className="space-y-2">
                    {categories[selectedCategory].bakimKontrolleri.map(kontrol => (
                      <label
                        key={kontrol.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                          checkboxes[kontrol.id]
                            ? "bg-green-50 border-green-300"
                            : "bg-gray-50 border-gray-200 hover:border-red-200"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={!!checkboxes[kontrol.id]}
                          onChange={() => handleCheck(kontrol.id)}
                          className="w-4 h-4 accent-green-600"
                        />
                        <span className={`text-sm ${checkboxes[kontrol.id] ? "text-green-800 font-medium" : "text-gray-700"}`}>
                          {kontrol.label}
                        </span>
                        {checkboxes[kontrol.id] && <span className="ml-auto text-green-600 text-sm">✓ Tamam</span>}
                      </label>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${(Object.values(checkboxes).filter(Boolean).length / categories[selectedCategory].bakimKontrolleri.length) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">
                      {Object.values(checkboxes).filter(Boolean).length} / {categories[selectedCategory].bakimKontrolleri.length}
                    </span>
                  </div>
                </div>

                {/* Notlar */}
                <div className="bg-white rounded-xl shadow p-5">
                  <div className="text-sm font-bold text-gray-600 mb-2 uppercase tracking-wide">📝 Notlar / Açıklamalar</div>
                  <textarea
                    value={notlar}
                    onChange={e => setNotlar(e.target.value)}
                    placeholder="Varsa ek notlar, gözlemler veya öneriler..."
                    rows={3}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
                  />
                </div>

                {/* Sonuç & Kaydet */}
                <div className="bg-white rounded-xl shadow p-5 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Tahmini Sonuç</div>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold border ${
                      sonuc === "Uygun" ? "bg-green-100 text-green-800 border-green-300" :
                      sonuc === "Kısmen Uygun" ? "bg-yellow-100 text-yellow-800 border-yellow-300" :
                      "bg-red-100 text-red-800 border-red-300"
                    }`}>{sonuc}</span>
                  </div>
                  <button
                    onClick={handleSubmit}
                    className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow"
                  >
                    💾 Kontrolü Kaydet
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}