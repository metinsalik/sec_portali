# build_management - İnşaat ve Renovasyon Yönetimi Modülü

## Modül Adı

İnşaat ve Renovasyon Yönetimi

## Sistem Kodu

build_management

## Amaç

Bu modül; hastane, sağlık tesisi ve kurumsal yapılarda gerçekleştirilen inşaat, renovasyon, tadilat, yıkım, altyapı, elektrik, mekanik ve medikal gaz çalışmalarının planlanması, risk değerlendirilmesi, enfeksiyon kontrol yönetimi, onay süreçleri, saha denetimleri ve teslim alma faaliyetlerinin uçtan uca yönetilmesini sağlar.

Modülün temel amacı;

- Hasta güvenliğini korumak
- Enfeksiyon risklerini yönetmek
- İş sağlığı ve güvenliğini sağlamak
- Teknik altyapı sürekliliğini korumak
- Yasal ve akreditasyon gerekliliklerini karşılamak
- Tüm süreci izlenebilir ve denetlenebilir hale getirmektir

---

## 1. Veritabanı ve Model (Backend - Prisma)

Her yeni modülün kendine ait verilerini tutacağı tablolar sisteme Prisma ORM ile eklenir.

- **Dosya Yolu:** `backend/prisma/schema.prisma`
- **İşlem:** Aşağıdaki modeller buraya eklenir. Diğer modellerle olan ilişkiler (Relations & Foreign Keys) dikkatlice tanımlanır.
- **Kullanılacak Komutlar (Backend dizininde):**
  - `npx prisma format`
  - `npx prisma db push` veya `npx prisma migrate dev --name build_management_init`
  - `npx prisma generate`

### Prisma Modelleri

```
BuildProject
BuildRiskAssessment
BuildICRA
BuildDesignForm
BuildApproval
BuildPermit
BuildInspectionOHS
BuildInspectionInfection
BuildFinding
BuildAction
BuildDocument
BuildHandover
BuildReport
```

---

## 2. Backend Geliştirme

### a) Route (API Uç Noktaları)

- **Klasör Yolu:** `backend/src/routes/build_management/`
- **İçerik:** `express.Router()` kullanılarak GET, POST, PUT, DELETE işlemleri tanımlanır.
- **Entegrasyon:** `backend/src/index.ts` içine import edilip eklenir.
  - Örnek: `app.use('/api/build_management', buildManagementRoutes);`

### b) Servisler

- **Klasör Yolu:** `backend/src/services/build_management/`
- Risk skoru hesaplama, ICRA sınıfı belirleme, onay kapısı kontrolü gibi iş kuralları burada servis olarak yazılır.

### c) Tipler

- **Klasör Yolu:** `backend/src/types/`
- Modüle özgü TypeScript tipleri burada tanımlanır.

---

## 3. Frontend Geliştirme

### a) Sayfalar (Pages)

- **Klasör Yolu:** `frontend/src/pages/build_management/`

Sayfalar:

- `BuildDashboard.tsx` — Ana panel, KPI kartları, proje portföyü
- `BuildProjectList.tsx` — Proje listesi ve filtreleme
- `BuildProjectDetail.tsx` — Proje detay ve süreç akışı
- `BuildDesignForm.tsx` — Hizmet Tasarım / Geliştirme Formu
- `BuildRiskAssessment.tsx` — İnşaat öncesi risk değerlendirmesi
- `BuildICRA.tsx` — Enfeksiyon kontrol risk analizi
- `BuildDocuments.tsx` — Evrak ve doküman yönetimi
- `BuildApprovals.tsx` — Onay matrisi
- `BuildPermits.tsx` — Çalışma izinleri
- `BuildInspections.tsx` — Saha denetimleri (İSG + Enfeksiyon Kontrol)
- `BuildActions.tsx` — Aksiyon ve uygunsuzluk takibi
- `BuildHandover.tsx` — Teslim alma ve kullanıma açma
- `BuildReports.tsx` — Raporlama ve arşiv

### b) Bileşenler (Components)

- **Klasör Yolu:** `frontend/src/components/build_management/`

Bileşenler:

- `ProjectCard.tsx` — Proje kartı
- `RiskMatrix.tsx` — Risk matrisi görselleştirme
- `ICRATable.tsx` — ICRA sınıf tablosu
- `ApprovalMatrix.tsx` — Onay matrisi tablosu
- `InspectionChecklist.tsx` — Denetim kontrol listesi (U/UD/KD)
- `ActionTracker.tsx` — Aksiyon takip tablosu
- `WorkflowStepper.tsx` — Süreç akışı görseli
- `StatusBadge.tsx` — Durum rozeti
- `GateCheck.tsx` — Başlatma uygunluk kapısı

### c) Routing Entegrasyonu (App.tsx)

- **Dosya Yolu:** `frontend/src/App.tsx`
- Yeni sayfalar `App.tsx` içerisine import edilir.
- URL yolları `path="/build_management/..."` şeklinde tanımlanır.
- Sayfalar `<ProtectedRoute allowedRoles={['admin', 'management', 'technical', 'infection_control', 'ohs']}>` ile sarmalanır.

### d) Navigasyon

- `PortalPage.tsx` ekranına modül kartı eklenir.
- Modül Adı: **İnşaat ve Renovasyon Yönetimi**
- Modül Kodu: `build_management`
- İkon: Building / Construction
- Kategori: Operasyon Yönetimi

---

## 4. İş Süreci

Modül aşağıdaki süreç akışına göre çalışır. Bir aşama tamamlanmadan sonraki kritik aşamaya geçilemez.

1. Proje Talebi
2. Proje Oluşturma
3. Hizmet Tasarım / Geliştirme Formu
4. İnşaat Öncesi Risk Değerlendirmesi
5. Enfeksiyon Kontrol Risk Analizi (ICRA)
6. Evrak ve Doküman Yönetimi
7. Onay Matrisi
8. Çalışma İzinleri
9. Saha Denetimleri
10. Aksiyon ve Uygunsuzluk Takibi
11. İnşaat Bitim Kontrolleri
12. Teslim Alma ve Kullanıma Açma
13. Raporlama ve Arşiv

---

## 5. Risk Sınıflandırma Sistemi

### Yapım Tipleri

#### Tip A — Gözlemsel ve invaziv olmayan işlemler

- Tavan kapaklarının inceleme için çıkarılması
- Sıva gerektirmeyen boyama işlemleri
- Duvar kaplama
- En fazla bir hasta odasında 30 dakikadan fazla sürmeyen, toz üretmeyen işlemler

#### Tip B — Küçük çaplı, minimal toz oluşturan kısa süreli işlemler

- Toz kontrolünün sağlandığı küçük işlemler (tavan, çatı delme gibi)
- Havalandırma tamiratı
- 1.5 m² büyük asma tavanın kaldırılması ve kablo döşeme
- En fazla iki hasta odasında 30 dakikadan fazla süren su kaçağı olan işlemler

#### Tip C — Ciddi düzeyde yıkım gerektiren, tek bir iş gününde tamamlanamayacak işlemler

- Yer kaplamalarının ve tavan kapaklarının sökülmesi
- Yeni duvar yapılması
- Büyük çaplı yerden kablo döşemesi
- İki hasta odasında ve 60 dakikadan fazla süren su kaçağı olan işlemler

#### Tip D — Büyük inşaat, yıkım ve yenileme işlemleri

- Binanın tüm elektrik ve bilgisayar kablolarının sökülüp değiştirilmesi
- Tamamlanması 3 günden uzun süren inşaatlar
- Birden fazla hasta bakım alanında uzun süreli su tesisatı yapılan girişimler ve su kesintisi

---

## 6. Alan Risk Grupları

### Grup 1 — Düşük Risk

- Eğitim / İdari Ofisler
- Koridorlar
- Boş alanlar
- Danışma
- Kayıt

### Grup 2 — Orta Risk

- Tüm poliklinik katları
- İmmünsupresif hastası olmayan dahili klinikler
- Malzeme yönetimi
- EKG Odası
- Nükleer Tıp
- Fizik Tedavi Rehabilitasyon
- Kafeterya
- Mutfak

### Grup 3 — Yüksek Risk

- Acil Servis
- Radyoloji
- Doğumhane
- Laboratuvar
- Endoskopi
- Post-op Odası
- Çocuk Servisi
- Bebek Odası
- Eczane
- Kan Bankası

### Grup 4 — Çok Yüksek Risk

- İmmün yetmezliği olan hastaların bulunduğu birimler
- Merkezi Sterilizasyon Ünitesi
- Hemodiyaliz
- Yoğun Bakımlar
- Yenidoğan Alanları
- Medikal ve Cerrahi Servisler
- Onkoloji
- İzolasyon Odaları
- Ameliyathane
- Anjiyo
- Müdahale alanları

---

## 7. ICRA (Infection Control Risk Assessment)

Modül otomatik olarak Yapım Tipi + Alan Risk Grubu eşleştirmesi yaparak gerekli enfeksiyon kontrol sınıfını hesaplar.

| Çalışma Alanı Risk Seviyesi | Tip A | Tip B | Tip C | Tip D |
|-----------------------------|--------|--------|--------|--------|
| Düşük Risk                  | Sınıf I | Sınıf II | Sınıf II | Sınıf IV |
| Orta Risk                   | Sınıf I | Sınıf II | Sınıf III | Sınıf IV |
| Yüksek Risk                 | Sınıf I | Sınıf II | Sınıf IV | Sınıf IV |
| Çok Yüksek Risk             | Sınıf II | Sınıf IV | Sınıf IV | Sınıf IV |

---

## 8. Enfeksiyon Kontrol Önlemleri

### Sınıf 1 (Tip A)

**Çalışma Boyunca:**
- Yapım aşamasında tozu en aza indirecek önlemler alınır.
- Gözlem için çıkarılan tavan kapağı hemen kapatılır.
- İşlem 30 dakika içinde bitirilir.

**Çalışma Tamamlandığında:**
- Bölgenin temiz olduğu kontrol edilir.
- İşlem bitince alan ıslak paspas ile paspaslanır.
- Alan Genel Hastane Temizlik Talimatına göre temizlenir.

### Sınıf 2 (Tip B)

**Çalışma Boyunca:**
- Sınıf 1 geçerlidir.
- İşlem öncesi ve sonrası Enfeksiyon Kontrol Ekibi (EKE) onayı alınır.
- İnşaat alanı temiz alanlardan uygun malzeme ile ayrılır.
- Tozun havaya yayılması engellenir.
- Kesim işlemleri sırasında kesim yüzeyleri su ile nemlendirilir.
- Kapı ve pencereler bantlanır.
- Çalışma alanının giriş ve çıkışlarına paspas konulur.
- Görevi olmayan personelin çalışma alanına girişi engellenir.
- Havalandırma sistemi emiş menfezleri kapatılır, işlem bitince açılır.
- Onarım işlemi sırasında havalandırma filtreleri sık sık kontrol edilir.

**Çalışma Tamamlandığında:**
- Sınıf 1 geçerlidir.
- Çalışma yüzeyleri ıslak bezle silinir.
- İnşaat atıkları torbalara konulup ağzı sıkıca kapatılır ve kapalı konteynırlar ile taşınır.
- Tüm yüzeyler dezenfektan ile silinir.
- Çalışma ortamı toz emici ile vakumlanır.
- İklimlendirme cihazı çalıştırılır.
- HEPA filtreler korunur.

### Sınıf 3 (Tip C)

**Çalışma Boyunca:**
- Sınıf 2 geçerlidir.
- Mevcut havalandırma sistemi kanalın kontaminasyonunu engellemek için izole edilir.
- HEPA ile donanımlı hava filtrasyon birimleri kullanılarak negatif basınç idame ettirilir.
- Çalışma bölgesini çalışma dışı bölgelere kapatmak için bariyerler kurulur.
- İnşaat işçileri çalışma bölgesinden hasta bakım bölgelerine giderken koruyucu elbise (önlük, galoş) giyer.
- Atık arabalarının kapağı sıkıca kapatılır, gerekirse bantlanır.

**Çalışma Tamamlandığında:**
- Sınıf 2 geçerlidir.
- Bölge temizlik görevlileri tarafından tamamen temizlenmeden bariyerler kaldırılmaz.
- Bariyerler dikkatlice kaldırılır.
- HEPA filtre ile ortam vakumlanır.
- HEPA filtre kanalları temizlenir.
- Tüm yüzeyler dezenfektan ile silinir.
- Atıklar kapağı sıkıca kapalı olan kaplarda taşınır.

### Sınıf 4 (Tip D)

**Çalışma Boyunca:**
- Sınıf 3 geçerlidir.
- Çalışmanın uygulandığı bölgede mevcut havalandırma sistemi izole edilir.
- Bölge çalışma dışı alanlarla paravan ile ayrılır.
- Delik, kanal ve kablo girişleri uygun olarak kapatılır.
- HEPA ile donatılı hava filtrasyon birimleri kullanılarak negatif basınç idame ettirilir.
- Hasta alanlarına yakın bölgede yapılan çalışmalarda çalışanlar tulumlarını değiştirir.
- Çalışma bölgesine giren tüm personel galoş giyer; çalışma alanından çıkıldığı her seferde galoş değiştirilir.

**Çalışma Tamamlandığında:**
- Sınıf 3 geçerlidir.
- Bölge temizlik görevlileri tarafından tamamen temizlenmeden bariyerler kaldırılmaz.
- Bariyerler dikkatlice kaldırılır.
- HEPA filtre ile ortam vakumlanır.
- HEPA filtre kanalları temizlenir.
- Tüm yüzeyler dezenfektan ile silinir.
- Atıklar kapağı sıkıca kapalı olan kaplarda taşınır.

---

## 9. Proje Yönetimi

### Temel Proje Bilgileri

- Proje Adı
- Tesis / Hastane
- Lokasyon
- Kat
- Bölüm / Klinik
- Çalışma Türü (Renovasyon, İnşaat, Yıkım, Tadilat, Elektrik, Mekanik, Medikal Gaz, Tasarım ve Geliştirme)
- Yapım Tipi (A / B / C / D)
- Alan Risk Grubu (1 / 2 / 3 / 4)
- ICRA Sınıfı (Otomatik hesaplanır)
- Planlanan Başlangıç Tarihi
- Planlanan Bitiş Tarihi
- Yüklenici Firma
- Proje Sorumlusu
- Kısa Açıklama / Kapsam

### Proje Durumları

- Taslak
- Ön İnceleme
- Risk Değerlendirme
- Onay Bekliyor
- Başlatılamaz
- Başlamaya Uygun
- Devam Ediyor
- Durduruldu
- Teslim Bekliyor
- Tamamlandı
- Arşivlendi

---

## 10. Hizmet Tasarım ve Geliştirme Formu

İnşaat veya renovasyon projesi başlamadan önce aşağıdaki alanlar doldurulmalıdır. Bu form tamamlanmadan risk değerlendirmesine geçilemez.

- Hastane / Tesis
- Form Türü (Tasarım / Geliştirme / Tasarım ve Geliştirme)
- Form Tarihi
- Tanım
- Talep Sahibi
- Proje Sponsoru / İmza
- Açıklamalar
- İlgili Bölümler
- Proje Yöneticisi
- Diğer Ekip Üyeleri
- Projenin Amacı ve İlgili Dokümanlar
- Proje Planı (Etaplar ve Takvim)
- Girdiler
- Çıktılar
- Doğrulama
- Gözden Geçirme
- Geçerlilik Tespiti (Hizmet öncesi tamamlanabiliyor mu?)
- Geçerlilik İçin Yapılan Çalışmalar
- Hizmet sonrası geçerlilik planı
- Değişiklik Kontrolü

---

## 11. İnşaat Öncesi Risk Değerlendirmesi

Aşağıdaki kriterler değerlendirilir. Her seçilen kriter risk skorunu artırır.

- Hasta bakım alanına yakın / doğrudan etkiliyor
- Toz, gürültü veya titreşim oluşturuyor
- Yoğun bakım / ameliyathane / steril alan etkileniyor
- HVAC / basınç dengesi etkilenebilir
- Medikal gaz hattına müdahale var
- Yangın algılama, söndürme veya acil çıkış etkilenebilir
- Elektrik kesintisi ihtimali var
- Su / kanalizasyon / sızıntı riski var

Risk Skoru Sonuçları:

- 0–4: Düşük Risk
- 5–9: Orta Risk
- 10–15: Yüksek Risk
- 16+: Kritik Risk

Risk alt başlıkları:

- Hasta güvenliği
- Enfeksiyon kontrol
- Yangın güvenliği
- Altyapı sürekliliği
- İSG

---

## 12. Enfeksiyon Kontrol Formları

### ENF-F15-02 — İnşaat Başlangıç Onay ve İnşaat Süresince Enfeksiyon Kontrol Formu

Fonksiyonlar:

- Risk sınıfı belirleme
- Başlangıç onayları
- Günlük kontroller
- Tarih bazlı takip
- Not yönetimi
- Enfeksiyon Kontrol Hemşiresi onayı

### ENF-F76-00 — İnşaat Bitiminde Enfeksiyon Kontrol ve Onay Formu

Fonksiyonlar:

- Final temizlik doğrulaması
- HVAC kontrolleri
- Bariyer kaldırma onayı
- Alan kullanıma açma onayı
- Enfeksiyon Kontrol Hemşiresi onayı

---

## 13. Onay Matrisi

Aşağıdaki onaylar sistem tarafından takip edilir. Elektronik onay desteği bulunmalıdır.

| Onay Birimi | Gerekçe | Durum |
|-------------|---------|-------|
| Teknik Hizmetler | Altyapı ve teknik kapsam | — |
| İSG Uzmanı | Yüklenici ve saha güvenliği | — |
| Enfeksiyon Kontrol | Toz, bariyer, HVAC, klinik alan | — |
| Yangın Güvenliği | Sıcak çalışma, algılama, acil çıkış | — |
| Klinik Birim | Hasta bakım hizmeti etkisi | — |
| Kalite Yönetimi | Süreç uygunluğu | — |
| Başhekimlik | Klinik onay | — |
| Hastane Yönetimi | Genel onay | — |

---

## 14. Çalışma İzinleri

Desteklenecek izin türleri:

- Sıcak Çalışma İzni
- Elektrik Çalışma İzni
- Yüksekte Çalışma İzni
- Kapalı Alan Çalışma İzni
- Medikal Gaz Çalışma İzni
- Tavan İçi Çalışma İzni
- Genel Çalışma İzni

Her izin için:

- İzin Türü
- Başlangıç Tarihi ve Saati
- Bitiş Tarihi ve Saati
- Onay Durumu
- Onaylayan Kişi

---

## 15. Saha Denetimleri

### İSG Günlük Kontrol Formu

Değerlendirme seçenekleri: U (Uygun) / UD (Uygun Değil) / KD (Kapsam Dışı)

Kontrol kriterleri:

1. Çalışma alanı yetkisiz girişe karşı kapatıldı mı?
2. Yalnızca önceden bildirilen ve evrakları eksiksiz olan kişiler mi çalıştırılıyor?
3. Yetkilendirilen alan ve iş dışında herhangi bir çalışma yapılıyor mu?
4. Çalışanların KKD'leri işe uygun ve eksiksiz şekilde kullanılıyor mu?
5. Alanda uyarı/ikaz levhaları uygun ve eksiksiz şekilde bulunuyor mu?
6. Çalışma alanında yangın söndürme cihazları kullanıma hazır şekilde bulunuyor mu?
7. El aletleri çalışma için uygun mu? Güvenli şekilde muhafaza ediliyor ve kullanılıyor mu?
8. Elektrikli el aletleri çalışma için uygun mu? Güvenli şekilde muhafaza ediliyor ve kullanılıyor mu?
9. Taşıma - istifleme aletleri uygun mu? Güvenli şekilde muhafaza ediliyor ve kullanılıyor mu?
10. Tehlikeli maddeler çalışma için uygun mu? Güvenli şekilde muhafaza ediliyor ve kullanılıyor mu?
11. Aydınlatma uygun ve yeterli mi? Aydınlatma sistemleri çalışıyor mu?
12. Sıcaklık ve nem uygun mu? Havalandırma yeterli mi?
13. Gürültü koşulları uygun mu?
14. Altyapı sistemlerini korumaya yönelik önlemler alınmış ve yetkisiz müdahaleden kaçınılıyor mu?
15. Düşmeye neden olacak boşluklara yönelik tedbirler alınmış mı? Bu tedbirler uygulanıyor mu?
16. İstifleme alanlarında malzeme düşmesi / devrilmesi gibi durumlara karşı önlemler alınmış mı?
17. Acil kaçış yolları ve acil çıkışlar yabancı malzemeden arındırılmış ve kullanılabilir durumda mı?
18. Atıklar belirlenen alanlarda düzenli şekilde depolanıyor mu?

Sonuç:

- UD madde yoksa: UYGUNDUR
- UD madde varsa: UYGUN DEĞİLDİR — Aksiyon açılır, kanıtla kapatılır.

### Enfeksiyon Kontrol Saha Denetimi

Kontrol kriterleri:

1. Çalışma alanı fiziksel bariyerle hasta/ziyaretçi alanından ayrılmış mı?
2. Toz yayılımını önlemek için uygun bariyer, kapama ve sızdırmazlık sağlanmış mı?
3. Negatif/pozitif basınç veya HVAC etkisi değerlendirilmiş mi?
4. Asma tavan, duvar kırımı veya delme işlemlerinde toz kontrol planı uygulanıyor mu?
5. Yapışkan paspas / geçiş kontrolü gerekli alanlarda uygulanıyor mu?
6. Moloz ve atık taşıma güzergahı klinik alanlarla çakışmayacak şekilde belirlenmiş mi?
7. Çalışanların klinik alanlara toz/kir taşımasını önleyecek önlemler alınmış mı?
8. Gün sonu temizlik ve ara temizlik kayıt altına alınıyor mu?
9. Steril alan, yoğun bakım, ameliyathane veya izolasyon alanı etkisi değerlendirilmiş mi?
10. Çalışma bitiminde final temizlik/dezenfeksiyon ve kullanıma açma onayı planlanmış mı?

---

## 16. Aksiyon Yönetimi

Her uygunsuzluk için aşağıdaki bilgiler takip edilir:

- Aksiyon Açıklaması
- Kaynak (İSG / Enfeksiyon Kontrol / Genel Denetim)
- Risk Seviyesi (Kritik / Yüksek / Orta / Düşük)
- Sorumlu Kişi
- Termin Tarihi
- Kanıt Dosyası
- Kapatma Tarihi
- Kapatma Notu

Kritik aksiyonlar kapatılmadan teslim alma yapılamaz.

---

## 17. İnşaat Bitim Süreci

İnşaat tamamlandığında aşağıdaki kontroller yapılmalıdır. Bu süreç ENF-F76-00 formuna bağlı çalışır.

- Alan temizliği tamamlandı
- Final dezenfeksiyon yapıldı
- Bariyer dikkatlice kaldırıldı
- HVAC açıldı ve kontrol edildi
- HEPA filtreler kontrol edildi
- Teknik sistem testleri tamamlandı
- Yangın algılama ve söndürme sistemleri test edildi
- Klinik birim kullanıma uygun gördü
- Enfeksiyon Kontrol onayı alındı
- Açık kritik aksiyon yok

---

## 18. Teslim Alma ve Kullanıma Açma

Teslim alma kontrol listesi:

- [ ] Alan temiz ve güvenli
- [ ] Teknik sistem testleri tamam
- [ ] Enfeksiyon kontrol son onayı var
- [ ] Yangın güvenliği son onayı var
- [ ] Klinik birim kullanıma uygun gördü
- [ ] Açık kritik aksiyon yok

Tüm maddeler tamamlanmadan nihai kabul yapılamaz.

---

## 19. Dashboard

Ana panelde aşağıdaki göstergeler bulunmalıdır:

- Aktif Projeler
- Yüksek Riskli Projeler
- Kritik Riskli Projeler
- Onay Bekleyenler
- Durdurulan İşler
- Açık Aksiyonlar
- Teslim Bekleyenler
- Yaklaşan Bitiş Tarihleri

---

## 20. Raporlar

### Operasyonel Raporlar

- Aktif Proje Raporu
- Risk Dağılımı
- Yüklenici Performansı
- Açık Aksiyonlar

### Enfeksiyon Kontrol Raporları

- ICRA Raporu
- Başlangıç Onay Raporu (ENF-F15-02)
- Final Onay Raporu (ENF-F76-00)

### Yönetim Raporları

- Aylık İnşaat Faaliyetleri
- Kritik Riskler
- Uygunsuzluk Trendleri
- KPI Dashboard

---

## 21. Özet Kontrol Listesi (Checklist)

- [ ] **1. Veritabanı:** `schema.prisma` dosyasına BuildProject, BuildRiskAssessment, BuildICRA, BuildDesignForm, BuildApproval, BuildPermit, BuildInspectionOHS, BuildInspectionInfection, BuildFinding, BuildAction, BuildDocument, BuildHandover, BuildReport modelleri ve ilişkileri eklendi.
- [ ] **2. Prisma:** `npx prisma generate` ve `npx prisma db push/migrate` komutları çalıştırıldı.
- [ ] **3. Backend Route:** `backend/src/routes/build_management/` altında API uç noktaları oluşturuldu.
- [ ] **4. Backend Entegrasyon:** Yeni route, `backend/src/index.ts` içerisine `app.use` ile register edildi.
- [ ] **5. Frontend Pages:** `frontend/src/pages/build_management/` klasörü açıldı ve tüm arayüz sayfaları buraya kodlandı.
- [ ] **6. Frontend Components:** `frontend/src/components/build_management/` klasörü açıldı ve modüle özel bileşenler oluşturuldu.
- [ ] **7. Frontend App.tsx:** Yeni sayfalar `App.tsx` içinde ilgili `<Route>` tanımlamaları ile `<ProtectedRoute>` sarmalı olarak ana router'a bağlandı.
- [ ] **8. Arayüz Navigasyonu:** `PortalPage.tsx` ekranına modül kartı eklendi.
- [ ] **9. ICRA Otomasyonu:** Yapım Tipi + Alan Risk Grubu eşleştirmesi ile ICRA sınıfı otomatik hesaplanıyor.
- [ ] **10. Onay Kapısı:** Tüm zorunlu onaylar tamamlanmadan proje "Başlatılamaz" durumunda kalıyor.
- [ ] **11. Enfeksiyon Kontrol Formları:** ENF-F15-02 ve ENF-F76-00 formları sisteme entegre edildi.
- [ ] **12. Saha Denetimi:** İSG ve Enfeksiyon Kontrol denetim formları U/UD/KD seçenekleriyle çalışıyor.

---

## 22. Kritik İş Kuralı

Aşağıdaki şartların tamamı sağlanmadan proje durumu "Başlamaya Uygun" olamaz:

- Hizmet Tasarım / Geliştirme Formu tamamlanmış olmalı
- İnşaat Öncesi Risk Değerlendirmesi tamamlanmış olmalı
- ENF-F15-02 başlangıç onayı alınmış olmalı
- Zorunlu evraklar yüklenmiş ve onaylanmış olmalı
- Teknik Hizmetler onayı alınmış olmalı
- İSG Uzmanı onayı alınmış olmalı
- Enfeksiyon Kontrol onayı alınmış olmalı
- Yangın Güvenliği onayı alınmış olmalı

Herhangi biri eksik ise sistem otomatik olarak **"Başlatılamaz"** kararı vermelidir.

Teslim alma aşamasında ise:

- Tüm teslim alma kontrolleri tamamlanmış olmalı
- Açık kritik aksiyon bulunmamalı
- ENF-F76-00 final onayı alınmış olmalı

Bu kurallar zayıflatılmamalıdır.
