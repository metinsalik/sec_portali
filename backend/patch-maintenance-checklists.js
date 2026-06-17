const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const checklists = {
  "Yangın Kapısı": [
    { id: "kapanmaKontrol", label: "Kapı kendiliğinden kapanıyor mu?", type: "checkbox" },
    { id: "contaKontrol", label: "Conta ve sızdırmazlık elemanları sağlam mı?", type: "checkbox" },
    { id: "menteseKontrol", label: "Menteşeler çalışıyor mu?", type: "checkbox" },
    { id: "kilitKontrol", label: "Kilit mekanizması çalışıyor mu?", type: "checkbox" },
    { id: "isaretlemeKontrol", label: "İşaretleme ve levhalar mevcut mu?", type: "checkbox" }
  ],
  "Yangın Tüpü": [
    { id: "manometreOkuma", label: "Manometre yeşil bölgede mi?", type: "checkbox" },
    { id: "guvenlikPimi", label: "Güvenlik pimi yerinde mi?", type: "checkbox" },
    { id: "hortumKontrol", label: "Hortum ve lans hasarsız mı?", type: "checkbox" },
    { id: "etiketKontrol", label: "Etiket ve son kullanma tarihi okunuyor mu?", type: "checkbox" },
    { id: "konumKontrol", label: "Tüp erişilebilir konumda mı?", type: "checkbox" },
    { id: "dolumTarihi", label: "Dolum / Hidrostatik Test Tarihi", type: "date" }
  ],
  "Dedektör": [
    { id: "ledKontrol", label: "LED göstergesi yanıyor mu?", type: "checkbox" },
    { id: "temizlikKontrol", label: "Dedektör yüzeyi temiz mi?", type: "checkbox" },
    { id: "baglantiKontrol", label: "Bağlantı ve montaj sağlam mı?", type: "checkbox" },
    { id: "testKontrol", label: "Test butonu ile test yapıldı mı?", type: "checkbox" },
    { id: "panelKontrol", label: "Panel üzerinde hata kaydı yok mu?", type: "checkbox" }
  ],
  "Yangın Dolabı": [
    { id: "hortumKontrol", label: "Hortum hasarsız ve tam uzunlukta mı?", type: "checkbox" },
    { id: "vanaKontrol", label: "Vana açılıp kapanıyor mu?", type: "checkbox" },
    { id: "lansKontrol", label: "Lans çalışıyor mu?", type: "checkbox" },
    { id: "dolabKontrol", label: "Dolap kapısı açılıyor mu?", type: "checkbox" },
    { id: "isaretlemeKontrol", label: "İşaretleme levhaları mevcut mu?", type: "checkbox" }
  ],
  "Yangın Battaniyesi": [
    { id: "fizikselKontrol", label: "Battaniye fiziksel olarak sağlam mı?", type: "checkbox" },
    { id: "muhafazaKontrol", label: "Muhafaza/çanta hasarsız mı?", type: "checkbox" },
    { id: "konumKontrol", label: "Erişilebilir konumda mı?", type: "checkbox" },
    { id: "isaretlemeKontrol", label: "İşaretleme levhası mevcut mu?", type: "checkbox" }
  ],
  "Hidrant": [
    { id: "vanaKontrol", label: "Vana açılıp kapanıyor mu?", type: "checkbox" },
    { id: "sizintiKontrol", label: "Sızıntı yok mu?", type: "checkbox" },
    { id: "kapakKontrol", label: "Kapak/gövde hasarsız mı?", type: "checkbox" },
    { id: "erisilebilirlikKontrol", label: "Çevresi engelsiz mi?", type: "checkbox" },
    { id: "isaretlemeKontrol", label: "İşaretleme levhası mevcut mu?", type: "checkbox" }
  ],
  "İtfaiye Su Verme Bağlantısı": [
    { id: "kaplinKontrol", label: "Kaplin hasarsız ve temiz mi?", type: "checkbox" },
    { id: "kapakKontrol", label: "Kör tapa/kapak yerinde mi?", type: "checkbox" },
    { id: "vanaKontrol", label: "Vana çalışıyor mu?", type: "checkbox" },
    { id: "erisilebilirlikKontrol", label: "Erişim engeli yok mu?", type: "checkbox" },
    { id: "isaretlemeKontrol", label: "İşaretleme levhası mevcut mu?", type: "checkbox" }
  ],
  "Otomatik Gazlı Söndürme Sistemleri": [
    { id: "basincKontrol", label: "Tüp basıncı uygun aralıkta mı?", type: "checkbox" },
    { id: "aktivasyonKontrol", label: "Aktivasyon mekanizması çalışıyor mu?", type: "checkbox" },
    { id: "nozulKontrol", label: "Nozullar tıkalı değil mi?", type: "checkbox" },
    { id: "uyariKontrol", label: "Tahliye uyarı sistemi çalışıyor mu?", type: "checkbox" },
    { id: "panelKontrol", label: "Panel entegrasyonu aktif mi?", type: "checkbox" }
  ],
  "Yangın Perdesi": [
    { id: "motorKontrol", label: "Motor/mekanizma çalışıyor mu?", type: "checkbox" },
    { id: "aktivasyonKontrol", label: "Aktivasyon testi yapıldı mı?", type: "checkbox" },
    { id: "perdeKontrol", label: "Perde kumaşı/malzemesi hasarsız mı?", type: "checkbox" },
    { id: "engelKontrol", label: "Perde yolu engelsiz mi?", type: "checkbox" },
    { id: "gucKontrol", label: "Güç kaynağı aktif mi?", type: "checkbox" }
  ],
  "Flaşör": [
    { id: "isikKontrol", label: "Işık yanıyor mu?", type: "checkbox" },
    { id: "sesKontrol", label: "Ses çıkışı çalışıyor mu?", type: "checkbox" },
    { id: "baglantiKontrol", label: "Bağlantı ve montaj sağlam mı?", type: "checkbox" },
    { id: "gorunurlukKontrol", label: "Görünürlük engeli yok mu?", type: "checkbox" },
    { id: "testKontrol", label: "Panel üzerinden test yapıldı mı?", type: "checkbox" }
  ],
  "Alarm Butonu": [
    { id: "camKontrol", label: "Cam/kapak hasarsız mı?", type: "checkbox" },
    { id: "testKontrol", label: "Test anahtarı ile test yapıldı mı?", type: "checkbox" },
    { id: "panelKontrol", label: "Panel üzerinde alarm alındı mı?", type: "checkbox" },
    { id: "erisilebilirlikKontrol", label: "Erişim engeli yok mu?", type: "checkbox" },
    { id: "isaretlemeKontrol", label: "İşaretleme levhası mevcut mu?", type: "checkbox" }
  ],
  "Yangın Paneli": [
    { id: "ekranKontrol", label: "Ekran/gösterge çalışıyor mu?", type: "checkbox" },
    { id: "akuKontrol", label: "Akü testi yapıldı mı?", type: "checkbox" },
    { id: "hataKontrol", label: "Sistemde hata kaydı yok mu?", type: "checkbox" },
    { id: "logKontrol", label: "Log kayıtları incelendi mi?", type: "checkbox" },
    { id: "testKontrol", label: "Sistem testi yapıldı mı?", type: "checkbox" }
  ]
};

async function main() {
  const categories = await prisma.fireEquipmentCategory.findMany();
  
  for (const cat of categories) {
    if (checklists[cat.name]) {
      await prisma.fireEquipmentCategory.update({
        where: { id: cat.id },
        data: { maintenanceParameters: checklists[cat.name] }
      });
      console.log(`Updated maintenance parameters for ${cat.name}`);
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
