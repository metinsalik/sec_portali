# FM-200 / Gazlı Yangın Söndürme Sistemi — Takip Sistemi Tam Planı

> **Kapsam:** 35 tesis, tüm FM-200 ve gazlı söndürme sistemleri
> **Amaç:** Sahadan dijitale kesintisiz veri akışı; periyodik kontrol, bakım, hazırlık ve sızdırmazlık testlerinin operasyonel iş akışları ve tutarlı başarı/tamamlanma yüzdeleriyle (%0–100) tek platformda yönetimi.
> **Kullanım:** Bu doküman backend mimarisi, AI agent kuralları ve frontend form davranışları için tam teknik spesifikasyondur.

---

## İÇİNDEKİLER

1. [Sistem Genel Mimarisi](#1-sistem-genel-mimarisi)
2. [Konum Hiyerarşisi ve Kimlik Yapısı](#2-konum-hiyerarşisi-ve-kimlik-yapısı)
3. [Sistem Fazları ve Akış Kuralları](#3-sistem-fazları-ve-akış-kuralları)
4. [FAZ 1 — Fiziksel Durum ve Tasarım Değerlendirmesi](#4-faz-1--fiziksel-durum-ve-tasarım-değerlendirmesi)
5. [FAZ 2 — Periyodik Kontrol](#5-faz-2--periyodik-kontrol)
6. [FAZ 3 — 6 Aylık Bakım (Çoklu Tüp/Ekipman Destekli)](#6-faz-3--6-aylık-bakım-çoklu-tüpekipman-destekli)
7. [FAZ 4 — Sızdırmazlık Testi ve İstisnai Giriş (Soft-Lock)](#7-faz-4--sızdırmazlık-testi-ve-istisnai-giriş-soft-lock)
8. [İş Yönetimi ve Durum Motoru (State Machine)](#8-iş-yönetimi-ve-durum-motoru-state-machine)
9. [İki Paralel Yol ve Yol Dönüşümleri](#9-iki-paralel-yol-ve-yol-dönüşümleri)
10. [Konum Değerlendirme ve Genel Durum Matrisi](#10-konum-değerlendirme-ve-genel-durum-matrisi)
11. [Matematiksel Model, KPI ve Yüzde Hesaplamaları](#11-matematiksel-model-kpi-ve-yüzde-hesaplamaları)
12. [İlişkisel Veri Modeli — Tablo ve Alan Yapısı](#12-ilişkisel-veri-modeli--tablo-ve-alan-yapısı)
13. [Otomasyon ve Eskalasyon Kuralları Motoru](#13-otomasyon-ve-eskalasyon-kuralları-motoru)
14. [Hazır Metin, Gözlem ve Aksiyon Referans Tablosu](#14-hazır-metin-gözlem-ve-aksiyon-referans-tablosu)
15. [Ağırlıklandırma ve Uygunluk Skoru Sistemi](#15-ağırlıklandırma-ve-uygunluk-skoru-sistemi)
16. [Ekran ve Form Davranış Referansı](#16-ekran-ve-form-davranış-referansı)
17. [Kullanıcı Rolleri ve Yetki Matrisi](#17-kullanıcı-rolleri-ve-yetki-matrisi)
18. [Kurulum ve Doğrulama Kontrol Listesi](#18-kurulum-ve-doğrulama-kontrol-listesi)

---

## 1. Sistem Genel Mimarisi

### 1.1 Sistem Ne Yapar?
Sistem, korunan her mahal için dört bağımsız operasyonel fazın veri girişini, uygunsuzlukların iş emrine dönüşmesini ve kapanış doğrulamasını yürütür:
```
[FAZ 1] Fiziksel Durum & Tasarım Değerlendirmesi ───┐
         ↓ (Paralel / Bağımsız)                    │ (Fiziksel Hazırlık)
[FAZ 2] Periyodik Kontrol (Yıllık Denetim)         │
         ↓ (Paralel / Bağımsız)                    ↓
[FAZ 3] 6 Aylık Bakım (Çoklu Tüp / Ekipman Bazlı)  [FAZ 4] Sızdırmazlık Testi
                                                   (Soft-Lock / Override)
```
* **Bağımsız Fazlar:** Bir fazın denetiminin gecikmesi diğer fazın veri girişini engellemez.
* **Otomatik İş Üretimi & Eskalasyon:** Denetimlerdeki "Uygun Değil" işaretleri anında iş kaydı açar; mükerrer kayıtlarda sayaç artırılır.
* **Tutarlı Yüzdeler:** Sıfıra bölünme (0/0) hatası barındırmayan, 0 ile 100 arasında tek yönlü artan başarı metrikleri kullanılır.

### 1.2 Temel İlkeler
| İlke | Kural |
| :--- | :--- |
| **Girdi Sadeliği** | Saha personeli için klavye girişi asgaridir; seçimler toggle/dropdown ile yapılır. |
| **Kanıta Dayalı Doğrulama** | Hiçbir iş fotoğraflı veya belgeli kanıt olmadan teknik sorumlu tarafından kapatılamaz. |
| **Döngüsel İyileştirme** | Saha personeli işi bitirdiğinde `Uygulandı` der; onaylanmazsa `Revize_Gerekli` ile sahaya döner. |
| **Varlık Bazlı İzleme** | Mahalde kaç tüp varsa bakım fazında her tüp ayrı bir satır olarak denetlenir. |

---

## 2. Konum Hiyerarşisi ve Kimlik Yapısı

### 2.1 Hiyerarşi
```
Tesis (35 adet)
  └── Bina
        └── Blok (opsiyonel)
              └── Kat
                    └── Mahal Tipi (Standart Liste)
                          └── Konum Kaydı (Otomatik İndeksli)
                                └── Tüpler / Varlıklar (1-N)
```

### 2.2 Mahal Tipi Standart Listesi
* Sunucu Odası
* Sistem Odası
* UPS Odası
* Trafo Odası
* Arşiv Odası
* MCC Panosu
* ADP Pano Odası
* Elektrik Panosu
* Kat Panosu
* Radyoloji Odası
* Hücre Odası
* CCTV Odası
* Bedaş Odası
* Anjiyo Odası
* Jeneratör Odası
* Diğer (Açıklama girilmesi zorunlu)

### 2.3 Kimlik Formatı
* **Etiket Formatı:** `[Mahal Tipi] #[İndeks]` (Örnek: `Kat Panosu #1`, `Trafo Odası #2`)
* **Sistem Benzersiz Kimliği (UID):** `[Tesis Kodu]-[Bina]-[Kat]-[Mahal Kodu]-[İndeks]` (Örnek: `TES01-B1-K3-KP-001`)

---

## 3. Sistem Fazları ve Akış Kuralları

| Faz | Periyot | Kapsam | Tamamlanma Kriteri |
| :--- | :--- | :--- | :--- |
| **FAZ 1** | Tek Seferlik / Tadilat Sonrası | Hacim, proje, nozul ve fiziksel açıklıklar | Fiziksel ve Doküman yollarındaki tüm işlerin kapatılması |
| **FAZ 2** | Yıllık (365 Gün) | 26 Maddelik Yetkili Denetimi | Formun doldurulması + Açılan UD işlerin kapatılması |
| **FAZ 3** | 6 Aylık (180 Gün) | Tüp bazlı fiziksel kontrol (Gövde, Mühür, Basınç, Emniyet) | Tüm tüplerin kontrol edilmesi + Açılan işlerin kapatılması |
| **FAZ 4** | Yıllık (365 Gün) | Door Fan / Basınç Tutma Testi | Test raporunun sisteme girilmesi ve sonucun "Geçti" olması |

---

## 4. FAZ 1 — Fiziksel Durum ve Tasarım Değerlendirmesi

### 4.1 Soru ve Aksiyon Matrisi

#### A — Hacim ve Boyut Bilgileri
| Kod | Soru | Tetikleyici | Otomatik İş Tanımı | Yol | Sorumlu | Tür |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| F1-A1 | Oda hacmi ölçüldü mü? | Hayır | Oda ölçülerinin alınması ve korunan hacmin hesaplanması | Doküman | Teknik | Küçük |
| F1-A2 | Tasarım hacmi ile ölçülen hacim uyuşuyor mu? | Hayır | Hacim farklılığının teknik incelenmesi ve tasarıma etkisinin belirlenmesi | Doküman | Firma | Büyük |
| F1-A3 | Kurulumdan bu yana oda değişikliği yapıldı mı? | Evet | Değişen mahal sınırlarına göre tasarımın yeniden değerlendirilmesi | Doküman | Firma | Büyük |
| F1-A4 | Oda değişiklik geçmişi biliniyor mu? | Bilinmiyor | Mahal değişiklik geçmişinin arşivden araştırılması | Doküman | Teknik | Küçük |

#### B — Söndürücü Sistemi ve Tasarım Belgeleri
| Kod | Soru | Tetikleyici | Otomatik İş Tanımı | Yol | Sorumlu | Tür |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| F1-B1 | Onaylı tasarım hesabı mevcut mu? | Hayır | Tasarım hesabının temin edilmesi; yoksa yeniden hazırlatılması | Doküman | Firma | Büyük |
| F1-B2 | Tasarım hesabının varlığı biliniyor mu? | Bilinmiyor | Tasarım hesabının şirket kayıtlarında araştırılması | Doküman | Teknik | Küçük |
| F1-B3 | Tüp dolum bilgileri ve etiketler doğrulanabiliyor mu? | Hayır | Tüp etiket ve dolum miktarlarının yerinde doğrulanması | Doküman | Teknik | Küçük |
| F1-B4 | Kurulu gaz miktarı tasarım hesabıyla uyuşuyor mu? | Hayır | Gaz miktarı uyuşmazlığının teknik incelenmesi | Doküman | Firma | Büyük |
| F1-B5 | Nozul ve borulama hidrolik hesabı var mı? | Hayır | Nozul dağıtım ve borulama izometrik hesap dokümanının temini | Doküman | Firma | Büyük |
| F1-B6 | Yangın ve söndürme senaryo dokümanı var mı? | Hayır | Yangın söndürme otomasyon senaryo dokümanının temini | Doküman | Firma | Büyük |

#### C — Dağıtım ve Boşluk Kapsamı
| Kod | Soru | Tetikleyici | Otomatik İş Tanımı | Yol | Sorumlu | Tür |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| F1-C1 | Nozul atış konisi önünde engel var mı? | Evet | Nozul atışını engelleyen fiziksel engellerin kaldırılması | Fiziksel | Teknik | Küçük |
| F1-C2 | Asma tavan üstü / yükseltilmiş döşeme altı koruma kapsamında mı? | Bilinmiyor | Hacim boşluklarının koruma kapsamının teknik olarak netleştirilmesi | Doküman | Firma | Büyük |

#### D — Sızdırmazlık ve Fiziksel Yapı
| Kod | Soru | Tetikleyici | Otomatik İş Tanımı | Yol | Sorumlu | Tür |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| F1-D1 | Kablo / boru geçişlerinde açıklık var mı? | Evet | Kablo/boru geçişlerinin yangın durdurucu harç/yastık ile yalıtılması | Fiziksel | Teknik | Küçük |
| F1-D2 | Duvar, tavan veya döşemede delik/açıklık var mı? | Evet | Bölme bütünlüğünü bozan yapısal delik ve açıklıkların kapatılması | Fiziksel | Teknik | Küçük |
| F1-D3 | Kapı tam kapanıyor ve sızdırmazlık sağlıyor mu? | Hayır | Kapı fitili, eşik veya hidrolik kapatıcı arızalarının giderilmesi | Fiziksel | Teknik | Küçük |

#### E — Geçmiş Sızdırmazlık Durumu
| Kod | Soru | Tetikleyici | Otomatik İş Tanımı | Yol | Sorumlu | Tür |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| F1-E1 | Daha önce sızdırmazlık testi yapıldı mı? | Hayır | FAZ 4 kapsamında ilk sızdırmazlık testinin planlanması | Doküman | Firma | Büyük |
| F1-E2 | Test yapıldıysa geçerli raporu var mı? | Hayır | Önceki test raporunun ilgili kurum veya firmadan temini | Doküman | Teknik | Küçük |

---

## 5. FAZ 2 — Periyodik Kontrol

### 5.1 26 Madde Denetim Listesi ve Sorumluluk Dağılımı
| Madde No | Denetim Konusu | UD Durumunda Otomatik İş Tanımı | Sorumlu | İş Türü |
| :---: | :--- | :--- | :--- | :--- |
| 1 | Sicil kartı ve bakım kayıtları | Sicil kartı ve periyodik bakım kayıtlarının düzenlenmesi | Teknik | Küçük |
| 2 | Önceki kontrol eksiklikleri | *(Sistem tarafından önceki dönem işlerine göre otomatik doldurulur)* | — | — |
| 3 | Yetkili / eğitimli personel durumu | Görevli personele gazlı söndürme kullanıcı eğitiminin verilmesi | Firma | Büyük |
| 4 | Etiket, sertifika ve uyarılar | Sistem tüp ve panel etiketlerinin standartlara uygun asılması | Teknik | Küçük |
| 5 | Kullanma talimatı ve levhalar | Mahal girişine acil durum ve kullanma talimatının asılması | Teknik | Küçük |
| 6 | Rutin kontrol kayıt defteri | Aylık/3 aylık kullanıcı kontrol formlarının işletilmeye başlanması | Teknik | Küçük |
| 7 | Onaylı proje ve resmi onay | Onaylı projenin temin edilerek sistem dosyasına eklenmesi | Firma | Büyük |
| 8 | Tesisatın projeye uygunluğu | Sahadaki tesisat farklılıklarının projeye uygun hale getirilmesi | Firma | Büyük |
| 9 | Sızdırmazlık test kayıtları | Mahalin geçerli sızdırmazlık test kaydının temini/yenilenmesi | Firma | Büyük |
| 10 | Gaz tankı bölme ortamı | Tüp odasının temizliği, havalandırması ve aydınlatmasının düzeltilmesi | Teknik | Küçük |
| 11 | Tank vanaları, kol ve mühürler | Vana emniyet pimi, boşaltma kolu ve mühürlerin yenilenmesi | Firma | Büyük |
| 12 | Basınç göstergeleri (Manometre) | Bozuk veya kalibrasyonsuz manometrelerin değiştirilmesi | Firma | Büyük |
| 13 | Tank gaz doluluk oranları | Gaz kaçağı olan veya eksik tüpün yeniden doldurulması | Firma | Büyük |
| 14 | Boşaltma hortumları ve borular | Korozyonlu boruların onarımı ve boru askılarının sabitlenmesi | Firma | Büyük |
| 15 | Yangın kontrol paneli durumu | Söndürme panelinin arızalarının giderilmesi ve devreye alınması | Firma | Büyük |
| 16 | Elektrik beslemesi ve aküler | Panel akülerinin yenilenmesi ve bağımsız linyenin sağlanması | Firma | Büyük |
| 17 | Boşaltma nozulları | Hasarlı veya yönü hatalı nozulların düzeltilmesi | Firma | Büyük |
| 18 | Aşırı basınç tahliye damperi | Basınç tahliye damperinin mekanik bakımının yapılması | Firma | Büyük |
| 19 | Manuel deşarj butonu | Manuel boşaltma butonunun tamir edilmesi ve mühürlenmesi | Firma | Büyük |
| 20 | Deşarj durdurma (Stop) butonu | Durdurma butonunun mekanik ve elektriksel onarımı | Firma | Büyük |
| 21 | Algılama dedektör hatları | Çapraz zon (cross-zone) dedektör arızalarının giderilmesi | Firma | Büyük |
| 22 | Alarm kornası ve flaşörler | 1. ve 2. kademe alarm ünitelerinin çalışır hale getirilmesi | Firma | Büyük |
| 23 | Menfez ve damperlerin kapanması | Gaz basma anında havalandırmayı kapatan damperin onarımı | Firma | Büyük |
| 24 | Otomatik gaz salım aktivatörü | Solenoid vana veya patlatıcı aktüatörün onarımı/değişimi | Firma | Büyük |
| 25 | Tekrarlayıcı ve ana panel iletimi | Söndürme sinyallerinin bina ana yangın santraline aktarımı | Firma | Büyük |
| 26 | Görevliye teslim tutanağı | Sistemin çalışır vaziyette tutanakla bina sorumlusuna teslimi | Teknik | Küçük |

---

## 6. FAZ 3 — 6 Aylık Bakım (Çoklu Tüp/Ekipman Destekli)

Mahalde bulunan birden fazla tüpün tek bir değerlendirmede genellenmesini önlemek adına form dinamik satırlar halinde açılır.

### 6.1 Tüp Bazlı Çoklu Değerlendirme Matrisi
Konum kaydında belirtilen `tup_sayisi` kadar satır otomatik listelenir:
```
[Konum: TES01-B1-K1-SO-001 (Sistem Odası #1) — Toplam Tüp: 3]

Tüp #1 (Seri No: FM-9941):  Gövde [U/UD]  Mühür [U/UD]  Basınç [U/UD]  Emniyet [U/UD]
Tüp #2 (Seri No: FM-9942):  Gövde [U/UD]  Mühür [U/UD]  Basınç [U/UD]  Emniyet [U/UD]
Tüp #3 (Seri No: FM-9943):  Gövde [U/UD]  Mühür [U/UD]  Basınç [U/UD]  Emniyet [U/UD]
Panel & Hat Kontrolü:       Genel [U/UD]
```

### 6.2 Ekipman Bazlı Otomatik İş Açılışı
Herhangi bir tüpte "Uygun Değil" işaretlendiğinde açılan iş kaydına **tüpün etiketi doğrudan yazılır**:
* **Örnek İş Tanımı:** `"Sistem Odası #1 bünyesindeki Tüp #2 için: Basınç kaybı tespit edildi; gaz dolumu ve sızdırmazlık onarımı yapılması."`
* **Sorumlu:** Firma (Basınçlı kap, gaz dolumu ve vana müdahaleleri yetkili firma kapsamındadır).

---

## 7. FAZ 4 — Sızdırmazlık Testi ve İstisnai Giriş (Soft-Lock)

Sahanın bürokratik engellerle kilitlenmesini önlemek için "Sert Blokaj" yerine gerekçeli istisna mimarisi işletilir.
```
FAZ 4 Giriş Talebi
       │
       ▼
FAZ 1 Fiziksel Yol Tamamlandı mı?
 ├── EVET ──→ Form Doğrudan Açılır (Normal Akış)
 └── HAYIR ─→ UYARI EKRANI (Soft-Lock):
              "Bu mahalde X adet açık fiziksel sızdırmazlık işi bulunmaktadır.
               Testin başarısız olma ihtimali yüksektir."
                   │
                   ├── [Vazgeç / İşi Tamamla] ──→ Form Kapanır
                   └── [Gerekçeli Giriş Yap] ──→ Gerekçe Seçimi Zorunlu:
                                                - "Resmi periyot son günü"
                                                - "Firma sahada hazır"
                                                - "Müşteri/Yönetim talebi"
                                                ▼
                                         Rapor Sisteme İşlenir +
                                         [Ön Koşulsuz Yapıldı] Bayrağı Konur
```

### 7.1 Test Sonuç Davranışı
* **Geçti:** Test raporu PDF olarak arşivlenir. `sonraki_test_tarihi = test_tarihi + 365 gün`.
* **Kaldı:** 
  1. Konum kartı durumuna *"Sızdırmazlık Başarısız"* işlenir.
  2. Otomatik iş açılır: *"Sızdırmazlık testinden geçilemedi; sızıntı noktalarının tespiti ve yalıtımı."* (Yol: Fiziksel, Sorumlu: Teknik/Firma).
  3. `sonraki_test_tarihi = NULL` (İşler bitip yeniden test geçilene kadar takvim boş kalır).

---

## 8. İş Yönetimi ve Durum Motoru (State Machine)

İşlerin askıda kalmasını veya eksik kanıtla kapatılmasını önleyen yaşam döngüsü şeması:
```
                  ┌───────────────────────────────┐
                  │           Planlandı           │
                  └──────────────┬────────────────┘
                                 │ Saha personeli/firma aksiyon alır
                                 ▼
                  ┌───────────────────────────────┐
                  │           Uygulandı           │
                  │   (Fotoğraf / Belge Kanıtı)   │
                  └──────────────┬────────────────┘
                                 │ Teknik Sorumlu İnceler
         ┌───────────────────────┴───────────────────────┐
         ▼                                               ▼
[Kanıt Yetersiz / Hatalı]                       [Kanıt Eksiksiz / Doğru]
         │                                               │
         ▼                                               ▼
┌─────────────────┐                             ┌─────────────────┐
│ Revize_Gerekli  │                             │   Tamamlandı    │
│ (Not ile Geri)  │                             │ (dogru_onay=T)  │
└────────┬────────┘                             └─────────────────┘
         │
         └──── Personel düzeltip tekrar [Uygulandı] yapar ───┘
```

---

## 9. İki Paralel Yol ve Yol Dönüşümleri

Fiziksel saha işleri ile teknik dokümantasyon süreçleri birbirini engellemeden iki ayrı kulvarda akar.

### 9.1 Kulvar Ayrımı
* **Fiziksel Yol:** Delik kapatma, kapı ayarı, nozul yönü, boru kelepçesi gibi sahada alet/edevat ile yapılan işler.
* **Doküman Yolu:** Tasarım hesabı temini, proje çizimi, hacim kontrol hesabı, eğitim belgesi temini gibi ofis/mühendislik işleri.

### 9.2 Yollar Arası Bağımlılık ve Görev Dönüşümü
Bir doküman incelemesi sahada fiziksel tadilat gerektirdiğinde iş akışı kesilmez; yeni bir iş üretilerek fiziksel yola aktarılır:
```
[Doküman İşi]: "F1-A2 Hacim Farkı İncelemesi" (Firma)
      │
      ▼ (Teknik İnceleme Tamamlandı: "Mevcut nozullar yetersiz, 1 adet ilave nozul gerekli")
[İş Kapatılır]: Doküman İşi → "Tamamlandı"
      │
      └─► [Sistem Otomatik Yeni İş Açar]:
            - İş Tanımı: "Yeni tasarıma uygun olarak 1 adet ilave nozul montajı"
            - Yol: Fiziksel
            - Sorumlu: Firma
            - kaynak_is_id: [Kapatılan Doküman İşinin ID'si]
```
Bu mekanizma sayesinde dokümantasyon yolu tamamlanırken, mahal durumu otomatik olarak *"Fiziksel İyileştirme Gerekli"* aşamasına geçer; takip kopmaz.

---

## 10. Konum Değerlendirme ve Genel Durum Matrisi

### 10.1 Durum Belirleme Öncelik Algoritması
Her konum kartı açıldığında hiyerarşik olarak aşağıdaki kontroller yapılır; ilk eşleşen kural konumun genel statüsünü belirler:
```
EĞER (Faz 1 formunda cevaplanmamış soru varsa)
  └─► DURUM: "Değerlendirme Eksik"

EĞER (Fiziksel Yolda açık/revizyon bekleyen iş varsa)
  └─► DURUM: "Fiziksel İyileştirme Gerekli"

EĞER (Doküman Yolunda açık iş varsa)
  └─► DURUM: "Bilgi / Belge Bekleniyor"

EĞER (Tüm işler 'Uygulandı' durumunda fakat onay bekliyorsa)
  └─► DURUM: "Doğrulama Bekleniyor"

EĞER (Tüm faz işleri kapandı VE son sızdırmazlık testi Geçti ise)
  └─► DURUM: "Sistem Hazır ve Uygun"
```

---

## 11. Matematiksel Model, KPI ve Yüzde Hesaplamaları

Sistemdeki tüm metrikler, paydası sıfır olduğunda tanımsızlık (`NaN` / `ZeroDivisionError`) üretmeyecek şekilde kurgulanmıştır. Tüm göstergeler **%0 (En Başarısız) ile %100 (Kusursuz/Tam)** arasında tek yönlü çalışır.

### 11.1 Form Kapsama Oranı (Veri Giriş Tamamlanma)
Planlanan kontrollerin sahada ne kadarının sisteme aktarıldığını gösterir:

Denetim Kapsama Oranı (%) = (Periyodunda Doldurulan Form Sayısı / Doldurulması Gereken Toplam Form Sayısı) * 100

### 11.2 Aksiyon / İş Kapatma Başarı Oranı
Açılan uygunsuzlukların ne kadarının çözüldüğünü ölçer. Açılan iş yoksa başarı tamdır:

Eğer Toplam Açılan İş = 0 ise:
  İş Kapatma Başarısı (%) = 100%
Eğer Toplam Açılan İş > 0 ise:
  İş Kapatma Başarısı (%) = (Kapatılan İş Sayısı / Toplam Açılan İş Sayısı) * 100

### 11.3 FAZ 2 Periyodik Kontrol Uygunluk Skoru
Ağırlıklı kusurları 100 üzerinden düşerek başarı puanı üretir:

Uygunluk Skoru (%) = 100 - [ (Toplam UD Ağırlıkları / (100 - Toplam UY Ağırlıkları)) * 100 ]

* **UY Düzeltmesi:** Uygulanamaz (UY) maddeler paydadan düşülerek mahal haksız yere cezalandırılmaz.
* **Aralık:** En kötü durumda 0, kusursuz durumda 100 üretir.

### 11.4 FAZ 1 Hazırlık İlerleme Oranları

Eğer Açılan Fiziksel İş = 0 ve Form Tamamlandı ise:
  Fiziksel Hazırlık İlerlemesi (%) = 100%
Eğer Açılan Fiziksel İş = 0 ve Form Tamamlanmadı ise:
  Fiziksel Hazırlık İlerlemesi (%) = 0%
Eğer Açılan Fiziksel İş > 0 ise:
  Fiziksel Hazırlık İlerlemesi (%) = (Kapatılan Fiziksel İşler / Toplam Açılan Fiziksel İşler) * 100

*(Doküman Yolu İlerleme Oranı da aynı formülle hesaplanır).*

---

## 12. İlişkisel Veri Modeli — Tablo ve Alan Yapısı

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│  tesisler   │──1:N──│   konumlar  │──1:N──│   tupler    │
└─────────────┘       └──────┬──────┘       └─────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │ 1:N               │ 1:N               │ 1:N
         ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│faz1_degerlendir.│ │periyodik_kontrol│ │bakim_kayitlari  │
└─────────────────┘ └────────┬────────┘ └─────────────────┘
                             │ 1:N
                             ▼
                    ┌─────────────────┐
                    │kontrol_maddeler │
                    └─────────────────┘
                             │
                             ▼ (Tetikler)
                    ┌─────────────────┐       ┌─────────────────┐
                    │  is_kayitlari   │──1:N──│  is_kanitlari   │
                    └─────────────────┘       └─────────────────┘
```

### 12.1 Tablo: `konumlar`
* `id` (UUID, PK)
* `tesis_id` (UUID, FK)
* `bina`, `kat`, `mahal_tipi` (VARCHAR / ENUM)
* `indeks` (INT) — Otomatik hesaplanan sayaç
* `sistem_tipi` (ENUM: FM-200, Novec1230, CO2, Inergen)
* `panel_tipi` (VARCHAR)
* `oda_hacmi_m3` (DECIMAL)
* `tup_sayisi` (INT)
* `aktif` (BOOLEAN)

### 12.2 Tablo: `tupler`
* `id` (UUID, PK)
* `konum_id` (UUID, FK)
* `seri_no` (VARCHAR)
* `etiket_kod` (VARCHAR) — Tüp #1, Tüp #2 vb.
* `kapasite_kg` (DECIMAL)
* `dara_kg` (DECIMAL)
* `imal_yili` (INT)
* `son_hidrostatik_test` (DATE)

### 12.3 Tablo: `is_kayitlari`
* `id` (UUID, PK)
* `konum_id` (UUID, FK)
* `tup_id` (UUID, FK, NULL Edilebilir) — Tüp bazlı işlerde ilgili tüp
* `faz` (ENUM: FAZ1, FAZ2, FAZ3, FAZ4)
* `kaynak_kod` (VARCHAR) — Soru no veya madde no
* `is_tanimi` (TEXT) — Standart sistem metni
* `is_turu` (ENUM: Kucuk, Buyuk)
* `sorumlu` (ENUM: Teknik, Firma)
* `yol` (ENUM: Fiziksel, Dokuman)
* `durum` (ENUM: Planlandi, Uygulandi, Revize_Gerekli, Tamamlandi)
* `tekrar_sayisi` (INT, DEFAULT 1) — Tekrarlayan uygunsuzluk sayacı
* `firma_takip_no` (VARCHAR, NULL Edilebilir)
* `kaynak_is_id` (UUID, FK, NULL Edilebilir) — Dönüşen iş bağıntısı
* `revize_notu` (TEXT, NULL Edilebilir) — Teknik sorumlu red gerekçesi
* `dogru_onay` (BOOLEAN, DEFAULT FALSE)
* `kapatildi_at` (TIMESTAMP, NULL Edilebilir)

### 12.4 Tablo: `is_kanitlari`
* `id` (UUID, PK)
* `is_id` (UUID, FK)
* `dosya_tipi` (ENUM: Foto_Oncesi, Foto_Sonrasi, Servis_Formu, Test_Raporu)
* `dosya_url` (TEXT)
* `yukleyen_id` (UUID, FK)
* `created_at` (TIMESTAMP)

### 12.5 Tablo: `bakim_tupler` (Faz 3 Detay)
* `id` (UUID, PK)
* `bakim_id` (UUID, FK)
* `tup_id` (UUID, FK)
* `govde` (ENUM: U, UD)
* `muhur` (ENUM: U, UD)
* `basinc` (ENUM: U, UD)
* `emniyet` (ENUM: U, UD)

### 12.6 Tablo: `sizdirmazlik_testleri`
* `id` (UUID, PK)
* `konum_id` (UUID, FK)
* `test_tarihi` (DATE)
* `tutma_suresi_dakika` (DECIMAL) — Standart gereği min. tutma süresi
* `olculen_deger` (DECIMAL)
* `sonuc` (ENUM: Gecti, Kaldi)
* `on_kosulsuz_giris` (BOOLEAN, DEFAULT FALSE) — Soft-lock aşımı yapıldı mı?
* `giris_gerekcesi` (TEXT, NULL Edilebilir)
* `rapor_url` (TEXT)

---

## 13. Otomasyon ve Eskalasyon Kuralları Motoru

### 13.1 Mükerrer İş Engelleme ve Sayaç Artırma (Eskalasyon)
Bir sonraki denetimde aynı madde tekrar UD çıkarsa iş listesi çöplüğe dönüştürülmez:
```
TETİKLEYİCİ: FAZ 2 veya FAZ 3'te bir madde 'UD' olarak işaretlendiğinde:
SORGULA:
  SELECT id, tekrar_sayisi FROM is_kayitlari
  WHERE konum_id = :konum_id 
    AND kaynak_kod = :madde_no 
    AND durum != 'Tamamlandi'
    AND (tup_id = :tup_id OR tup_id IS NULL);

İŞLEM:
  IF (Kayıt Varsa):
      UPDATE is_kayitlari SET
          tekrar_sayisi = tekrar_sayisi + 1,
          updated_at = NOW()
      WHERE id = :bulunan_id;
      --> Bildirim: "Bu uygunsuzluk N dönemdir devam ediyor (Kritik Eskalasyon)"
  ELSE:
      INSERT INTO is_kayitlari (konum_id, kaynak_kod, durum, tekrar_sayisi, ...)
      VALUES (:konum_id, :madde_no, 'Planlandi', 1, ...);
```

### 13.2 Madde 2 (Önceki Eksiklikler) Otomasyonu
Faz 2 formu açıldığında Madde 2 personelin inisiyatifine bırakılmaz:
```
TETİKLEYİCİ: FAZ 2 Formu Açılışı
SORGULA:
  SELECT COUNT(*) FROM is_kayitlari
  WHERE konum_id = :konum_id 
    AND faz = 'FAZ2' 
    AND durum != 'Tamamlandi';

İŞLEM:
  IF (Açık İş Sayısı == 0):
      Madde 2 = 'U' (Uygun)
  ELSE:
      Madde 2 = 'UD' (Uygun Değil)
      Not Alanı = "Önceki dönemden devam eden [N] adet açık iş kaydı bulunmaktadır."
```

---

## 14. Hazır Metin, Gözlem ve Aksiyon Referans Tablosu

Saha personeli form doldururken serbest metin yazmaz; sistem aşağıdaki tablodan resmi rapor dilini ve iş tanımını otomatik üretir:

| Kaynak Kod | Durum | Resmi Rapor Gözlem Metni | Otomatik Açılan İş Tanımı | Sorumlu | Kulvar |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **F1-D1** | Açıklık Var | Mahalde yangın durdurucu dolgusu yapılmamış kablo/boru geçiş açıklığı tespit edilmiştir. | Geçiş açıklıklarının yangın dayanımlı harç/yastık ile tam yalıtımı | Teknik | Fiziksel |
| **F1-D3** | Kapı Kapanmıyor | Mahal kapısı tam kapanmamakta, fitil ve sızdırmazlık bütünlüğü bulunmamaktadır. | Kapı fitili değişimi, kasa ve hidrolik kapatıcı mekanizma onarımı | Teknik | Fiziksel |
| **F1-B1** | Hesap Yok | Sisteme ait onaylı gaz hidrolik ve hacim tasarım hesabı mevcut değildir. | Onaylı tasarım hesabının ilgili firmadan temin veya tanzim edilmesi | Firma | Doküman |
| **F2-M04** | Etiket Görünmüyor | Sistem vanaları, tüpleri ve panosuna ait tanımlama etiketleri mevcut değildir. | Mahal panosu ve tüp etiketlerinin standartlara uygun asılması | Teknik | Doküman |
| **F2-M11** | Vana/Kol/Mühür | Söndürme tüp vanası, manuel boşaltma kolu veya mühürlerinde uygunsuzluk vardır. | Vana mekanizmasının incelenmesi, emniyet pim ve mührünün yenilenmesi | Firma | Fiziksel |
| **F2-M13** | Gaz Doluluk | Tüp gaz doluluk seviyesi veya manometre basınç değeri eşik değerin altındadır. | Basınç kaybı olan tüpün dolum ve hidrostatik test için sökülmesi/dolumu | Firma | Fiziksel |
| **F2-M16** | Akü / Elektrik | Panel yedek aküleri işlevsizdir veya ana besleme hattı bağımsız değildir. | Panel akülerinin yenilenmesi ve besleme hattı izolasyonunun sağlanması | Firma | Fiziksel |
| **F2-M21** | Algılama/Zon | Yangın algılama hatlarında veya dedektör çapraz zonlamasında arıza mevcuttur. | Dedektör hattı arızasının tespiti ve çalışır vaziyete getirilmesi | Firma | Fiziksel |
| **F2-M23** | Otomatik Damper | Yangın anında mahali kapatması gereken yangın/duman damperi kapanmamaktadır. | Mahal kapatma damperi yay ve motor mekanizmasının onarımı | Firma | Fiziksel |
| **F3-GÖVDE** | Korozyon/Hasar | [Tüp No] tüp gövdesinde korozyon, ezilme veya derin pas tespit edilmiştir. | [Tüp No] tüpünün hidrostatik teste gönderilmesi veya yenilenmesi | Firma | Fiziksel |
| **F3-BASINÇ**| Basınç Düşük | [Tüp No] manometre ibresi kırmızı alandadır (basınç kaybı mevcuttur). | [Tüp No] azot basınçlandırması veya kaçak onarımı yapılması | Firma | Fiziksel |
| **F4-TEST**  | Test Başarısız | Mahalin yıllık sızdırmazlık testi başarısız olmuştur (Tutma süresi yetersiz). | Sızıntı noktalarının tespiti, izolasyonu ve testin tekrarlanması | Firma | Fiziksel |

---

## 15. Ağırlıklandırma ve Uygunluk Skoru Sistemi

FAZ 2 kontrolleri için tanımlanan kritiklik seviyeleri doğrudan başarı puanına etki eder:

### 15.1 Kritiklik ve Ağırlık Dağılımı
| Seviye | Madde Numaraları | Madde Başı Ağırlık | Grup Toplamı |
| :--- | :--- | :---: | :---: |
| **Kritik (Red-Flag)** | M07, M08, M12, M13, M15, M21, M23, M24 | **%6 – %7** | **%49** |
| **Orta (Fonksiyonel)** | M03, M11, M14, M16, M17, M18, M19, M20, M22, M25 | **%3 – %4** | **%35** |
| **Düşük (İdari)** | M01, M04, M05, M06, M09, M10, M26 | **%2 – %3** | **%16** |

*(Not: Madde 2 sistem tarafından otomatik değerlendirildiğinden bu tabloda pay almaz; toplam ağırlık = %100).*

### 15.2 Başarı Derecelendirme Skalası
| Skor Aralığı | Derece | Arayüz Göstergesi | Operasyonel Karşılık |
| :---: | :--- | :---: | :--- |
| **%95 – %100** | A — Kusursuz | 🟢 Yeşil | Sistem tam operasyonel, iş emri yok. |
| **%80 – %94** | B — Yeterli | 🟡 Sarı | İdari/küçük eksikler var; sistem çalışabilir durumda. |
| **%60 – %79** | C — Müdahale Gerekli | 🟠 Turuncu | Orta düzey bileşen sorunları; planlı servis gerekli. |
| **%0 – %59** | D — Kritik Risk | 🔴 Kırmızı | Kritik güvenlik açığı; sistem yangını söndüremeyebilir. |

> **Kritik Eşik Kuralı (Gatekeeper):** Ağırlıklı skor kaç olursa olsun; Madde 13 (Gaz Doluluk) veya Madde 21 (Algılama) maddelerinden biri "UD" ise kartın üzerinde kırmızı **"Fonksiyonel Devre Dışı Riski"** bayrağı açılır.

---

## 16. Ekran ve Form Davranış Referansı

### 16.1 Konum Kartı Özeti
Konum kartı, mahal hakkındaki tüm fazların durumunu tek bakışta özetler:
```
┌────────────────────────────────────────────────────────────────────────┐
│ TES01-B1-K1-SO-001  │ Sistem Odası #1 (FM-200 / 3 Tüp)                  │
├─────────────────────┴──────────────────────────────────────────────────┤
│ [FAZ 1] Fiziksel: %100 (Kapalı)        │ Doküman: %66 (1 İnceleme Açık)│
│ [FAZ 2] Son Skor: %93 (Seviye B)       │ Kontrol: 14.04.2026 (Geçerli) │
│ [FAZ 3] Tüp Durumları: 3/3 Uygun       │ Son Bakım: 12.08.2026         │
│ [FAZ 4] Sızdırmazlık: GEÇTİ (12.2 dk)  │ Son Test: 10.03.2026          │
├────────────────────────────────────────────────────────────────────────┤
│ AÇIK İŞLER:                                                            │
│ 1) [Doküman] F1-A2 Hacim farkı analizi (Firma) ── [İncele]             │
└────────────────────────────────────────────────────────────────────────┘
```

### 16.2 İş Kaydı Detay Ekranı ve Onay Döngüsü
* **Saha/Firma Görünümü:** İş tanımı sabittir. Personel sadece `Fotoğraf Yükle`, `Belge Ekle` ve `Uygulandı Olarak İşaretle` butonlarını kullanır.
* **Teknik Sorumlu Görünümü:** Kanıtları inceler.
  * Uygunsa: `Onayla ve Kapat` butonu (Kayıt `Tamamlandi` olur).
  * Yetersizse: `Düzeltme İste` butonu (Zorunlu `revize_notu` girilir, kayıt `Revize_Gerekli` statüsüne düşer).

---

## 17. Kullanıcı Rolleri ve Yetki Matrisi

| Rol | Form Doldurma (F1-F4) | İş Açma (Otomatik) | İşi "Uygulandı" Yapma | İşi "Tamamlandı" Onaylama | Ayar & Eşik Değiştirme |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Saha Personeli** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Firma Temsilcisi**| ❌ | ❌ | ✅ (Atanan İş) | ❌ | ❌ |
| **Teknik Sorumlu** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Sistem Yöneticisi**| ✅ | ✅ | ✅ | ✅ | ✅ |
| **Yönetici (İzleme)**| ❌ (Salt Okunur) | ❌ | ❌ | ❌ | ❌ |

---

## 18. Kurulum ve Doğrulama Kontrol Listesi

Yeni bir tesis sisteme dahil edilirken uygulanacak sıralı adımlar:
1. **Tesis ve Konum Tanımları:** Tesis oluşturulur; bina, kat ve standart mahal tipiyle konumlar indekslenir.
2. **Tüp Envanteri:** Her konuma ait tüpler seri numaraları ve kapasiteleriyle `tupler` tablosuna işlenir.
3. **Faz 1 Başlangıç Değerlendirmesi:** Saha personeli tabletten Fiziksel ve Doküman sorularını tamamlar.
4. **İlk İş Emirleri:** Sistem açılan ilk işleri otomatik olarak Teknik Hizmetler ve Firma panellerine iletir.
5. **Döngüsel Takip:** Periyodik kontrol ve 6 aylık bakım zamanlayıcıları konum bazında işlemeye başlar.
