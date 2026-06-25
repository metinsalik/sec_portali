# Bina Turu Yönetimi Modülü - Geliştirme Rehberi

Bu belge, `sec_portali` projesine eklenecek olan **Bina Turu Yönetimi** modülünün tam teknik ve fonksiyonel yapısını tanımlar. `modul.md` rehberindeki genel standartlar bu modül için de geçerlidir.

---

## Modüle Genel Bakış

Her tesis kendi bina turlarını bağımsız olarak yönetir. Modül; soru bankası yönetimi, tur planlaması, saha denetim akışı, uygunsuzluk takibi ve analitik dashboard bileşenlerinden oluşur.

---

## 1. Veritabanı Modelleri (Prisma)

**Dosya:** `backend/prisma/schema.prisma`

### 1.1 Ayarlar & Soru Bankası

```prisma
model BTAnaGrup {
  id        Int      @id @default(autoincrement())
  tesisId   Int
  ad        String
  sorular   BTSoru[]
  createdAt DateTime @default(now())
}

model BTDenetlenenAlan {
  id        Int      @id @default(autoincrement())
  tesisId   Int
  ad        String
  sorular   BTSoru[]
  createdAt DateTime @default(now())
}

model BTKategori {
  id        Int      @id @default(autoincrement())
  tesisId   Int
  ad        String
  sorular   BTSoru[]
  createdAt DateTime @default(now())
}

model BTSoruBankasi {
  id               Int              @id @default(autoincrement())
  tesisId          Int
  anaGrupId        Int
  denetlenenAlanId Int
  kategoriId       Int
  kriter           String
  anaGrup          BTAnaGrup        @relation(fields: [anaGrupId], references: [id])
  denetlenenAlan   BTDenetlenenAlan @relation(fields: [denetlenenAlanId], references: [id])
  kategori         BTKategori       @relation(fields: [kategoriId], references: [id])
  turSorulari      BTTurSorusu[]
  createdAt        DateTime         @default(now())
}
```

### 1.2 Sorumlu Birim & Kişi (Ayarlar)

```prisma
model BTSorumluBirim {
  id           Int          @id @default(autoincrement())
  tesisId      Int
  ad           String
  turler       BTTur[]
  uygunsuzluklar BTUygunsuzluk[]
  createdAt    DateTime     @default(now())
}

model BTSorumluKisi {
  id             Int          @id @default(autoincrement())
  tesisId        Int
  ad             String
  birimId        Int
  birim          BTSorumluBirim @relation(fields: [birimId], references: [id])
  turler         BTTur[]
  uygunsuzluklar BTUygunsuzluk[]
  createdAt      DateTime     @default(now())
}
```

### 1.3 Bina Turu (Plan)

```prisma
model BTTur {
  id               Int             @id @default(autoincrement())
  tesisId          Int
  ad               String
  baslangicTarihi  DateTime
  bitisTarihi      DateTime        // 3 aylık dönem
  durum            BTTurDurum      @default(TASLAK)
  sorumluBirimId   Int
  sorumluKisiId    Int
  sorumluBirim     BTSorumluBirim  @relation(fields: [sorumluBirimId], references: [id])
  sorumluKisi      BTSorumluKisi   @relation(fields: [sorumluKisiId], references: [id])
  denetimEkibi     BTDenetimEkibi[]
  turSorulari      BTTurSorusu[]
  uygunsuzluklar   BTUygunsuzluk[]
  createdAt        DateTime        @default(now())
  updatedAt        DateTime        @updatedAt
}

enum BTTurDurum {
  TASLAK
  AKTIF
  TAMAMLANDI
}

model BTDenetimEkibi {
  id        Int    @id @default(autoincrement())
  turId     Int
  kisiAdi   String
  tur       BTTur  @relation(fields: [turId], references: [id])
}
```

### 1.4 Tur Soruları & Denetim Cevapları

```prisma
model BTTurSorusu {
  id          Int           @id @default(autoincrement())
  turId       Int
  soruId      Int
  tur         BTTur         @relation(fields: [turId], references: [id])
  soru        BTSoruBankasi @relation(fields: [soruId], references: [id])
  cevap       BTCevap?
}

model BTCevap {
  id             Int           @id @default(autoincrement())
  turSorusuId    Int           @unique
  sonuc          BTCevapSonuc
  aciklama       String?
  fotograflar    String[]      // Dosya yolları dizisi
  dofGerekli     Boolean       @default(false)
  turSorusu      BTTurSorusu   @relation(fields: [turSorusuId], references: [id])
  uygunsuzluk    BTUygunsuzluk?
  createdAt      DateTime      @default(now())
}

enum BTCevapSonuc {
  UYGUN
  UYGUN_DEGIL
}
```

### 1.5 Uygunsuzluk Takibi

```prisma
model BTUygunsuzluk {
  id               Int                  @id @default(autoincrement())
  tesisId          Int
  turId            Int
  cevapId          Int                  @unique
  sorumluBirimId   Int
  sorumluKisiId    Int
  terminTarihi     DateTime
  yapilacaklar     String
  durum            BTUygunsuzlukDurum   @default(ACIK)
  kapatmaKaniti    String?              // Dosya yolu
  kapatmaTarihi    DateTime?
  tur              BTTur                @relation(fields: [turId], references: [id])
  cevap            BTCevap              @relation(fields: [cevapId], references: [id])
  sorumluBirim     BTSorumluBirim       @relation(fields: [sorumluBirimId], references: [id])
  sorumluKisi      BTSorumluKisi        @relation(fields: [sorumluKisiId], references: [id])
  createdAt        DateTime             @default(now())
  updatedAt        DateTime             @updatedAt
}

enum BTUygunsuzlukDurum {
  ACIK
  KAPALI
}
```

---

## 2. Backend Geliştirme

**Klasör:** `backend/src/routes/bina-turu/`

### 2.1 Route Dosyaları

| Dosya | Açıklama |
|---|---|
| `index.ts` | Ana router — alt route'ları birleştirir |
| `ayarlar.ts` | Ana Grup, Denetlenen Alan, Kategori, Sorumlu Birim/Kişi CRUD |
| `soru-bankasi.ts` | Soru listele, ekle, güncelle, sil; Excel'den toplu yükleme |
| `turler.ts` | Tur oluştur, listele, güncelle, sil; ekip yönetimi |
| `denetim.ts` | Denetimi başlat, soru cevapla, fotoğraf yükle |
| `uygunsuzluklar.ts` | Uygunsuzluk listele, güncelle, kapat |
| `dashboard.ts` | Grafik & analiz verilerini dönen endpoint'ler |

### 2.2 Entegrasyon

`backend/src/index.ts` dosyasına eklenecek:

```typescript
import binaToruRoutes from './routes/bina-turu';
app.use('/api/bina-turu', binaToruRoutes);
```

### 2.3 Excel Yükleme Endpoint'i

`POST /api/bina-turu/soru-bankasi/excel-yukle`

- `multipart/form-data` ile `.xlsx` dosyası alır
- Beklenen sütunlar: `Ana Grup | Denetlenecek Alan | Kriter | Kategori`
- `exceljs` veya `xlsx` kütüphanesi ile parse edilir
- Eksik sütun varsa hata mesajıyla döner

---

## 3. Frontend Geliştirme

### 3.1 Sayfa Yapısı

**Klasör:** `frontend/src/pages/bina-turu/`

```
bina-turu/
├── BinaToruDashboard.tsx          # Ana dashboard — grafikler
├── BinaToruListesi.tsx            # Oluşturulan turların listesi
├── BinaToruOlustur.tsx            # Yeni tur oluşturma formu
├── BinaToruDetay.tsx              # Tur detayı + soru seçimi
├── DenetimBaslat.tsx              # Soru soru denetim akışı
├── UygunsuzlukListesi.tsx         # Açık / kapalı uygunsuzluklar
├── UygunsuzlukDetay.tsx           # Uygunsuzluk düzeltme & kapatma
└── ayarlar/
    ├── AyarlarIndex.tsx           # Ayarlar ana sayfası (sekmeli)
    ├── SoruBankasi.tsx            # Soru listesi + ekleme formu
    ├── SoruBankasiExcel.tsx       # Excel yükleme bileşeni
    ├── AnaGrupYonetimi.tsx        # Ana Grup CRUD
    ├── DenetlenenAlanYonetimi.tsx # Denetlenen Alan CRUD
    ├── KategoriYonetimi.tsx       # Kategori CRUD
    ├── SorumluBirimYonetimi.tsx   # Sorumlu Birim CRUD
    └── SorumluKisiYonetimi.tsx    # Sorumlu Kişi CRUD
```

### 3.2 Bileşen Yapısı

**Klasör:** `frontend/src/components/bina-turu/`

```
bina-turu/
├── TurKarti.tsx                   # Tur listesindeki kart bileşeni
├── DenetimSorusu.tsx              # Tek soru kartı (Uygun / Uygun Değil)
├── KategoriInfoDialog.tsx         # Soru kategorisini gösteren info dialog
├── UygunsuzDegil Form.tsx         # Açıklama + Foto + DOF seçimi formu
├── DenetimEkibiForm.tsx           # Ekip üyesi ekleme bileşeni
├── SoruFiltrele.tsx               # Ana Grup / Alan / Kategori filtresi
├── DashboardGrafik.tsx            # Yeniden kullanılabilir grafik sarmalayıcı
└── UygunsuzlukDurumBadge.tsx      # Açık / Kapalı durum etiketi
```

### 3.3 Sayfa Akışları

#### A) Ayarlar Akışı
```
AyarlarIndex (sekmeli yapı)
 ├── Sekme: Ana Grup       → AnaGrupYonetimi
 ├── Sekme: Denetlenen Alan → DenetlenenAlanYonetimi
 ├── Sekme: Kategori       → KategoriYonetimi
 ├── Sekme: Sorumlu Birim  → SorumluBirimYonetimi
 ├── Sekme: Sorumlu Kişi   → SorumluKisiYonetimi
 └── Sekme: Soru Bankası   → SoruBankasi + SoruBankasiExcel
```

#### B) Tur Oluşturma Akışı
```
BinaToruOlustur (Çok adımlı form — Stepper)
 ├── Adım 1: Tur adı, dönem (3 aylık), sorumlu birim, sorumlu kişi
 ├── Adım 2: Denetim ekibini oluştur (kişi ekle / çıkar)
 └── Adım 3: Soru bankasından (Ana Grup / Alan / Kategori filtresiyle) soru seç
```

#### C) Denetim Akışı
```
DenetimBaslat
 ├── Her soru için DenetimSorusu bileşeni render edilir
 │    ├── "i" ikonuna tıklanınca → KategoriInfoDialog (Kategori, Alan, Ana Grup)
 │    ├── [Uygun] → Sonraki soruya geç
 │    └── [Uygun Değil] → UygunsuzDegilForm açılır
 │         ├── Açıklama (zorunlu)
 │         ├── Fotoğraf ekle (çoklu)
 │         └── DOF Gereksinimi: [Var] / [Yok]
 │              └── [Var] seçilirse → Uygunsuzluk Takip modülüne taşınır
 └── Tüm sorular tamamlandığında → Denetim TAMAMLANDI durumuna geçer
```

#### D) Uygunsuzluk Takip Akışı
```
UygunsuzlukListesi
 ├── Sekme: Açık Uygunsuzluklar
 │    └── Her kayıt → ilgili Denetim adı, tarih, sorumlu kişi/birim, termin
 └── Sekme: Kapanmış Uygunsuzluklar

UygunsuzlukDetay
 ├── Sorumlu Birim ve Kişi atama
 ├── Termin tarihi belirleme
 ├── Yapılacaklar açıklaması girme
 ├── Düzeltme kanıtı (dosya/fotoğraf) yükleme
 └── [Uygunsuzluğu Kapat] butonu → Durum KAPALI'ya geçer
```

---

## 4. Dashboard Grafikleri

**Sayfa:** `BinaToruDashboard.tsx`  
**Kütüphane:** Recharts (mevcut projeye uygun)

| Grafik | Tür | Açıklama |
|---|---|---|
| Dönemsel Denetim Özeti | Çubuk Grafik | Aylara göre toplam soru / uygun / uygun değil sayısı |
| Kategori Bazlı Uygunluk | Yatay Çubuk Grafik | Her kategorideki uygunluk oranı |
| Denetlenen Alan Durumu | Gruplandırılmış Çubuk | Her alana göre Uygun / Uygun Değil dağılımı |
| Ana Grup Analizi | Pasta Grafik | Ana gruplara göre uygunsuzluk oranı |
| Uygunsuzluk Trendi | Çizgi Grafik | Aylık açılan ve kapanan uygunsuzluk sayısı |
| DOF Gereksinim Oranı | Halka Grafik | DOF gerekli / gereksiz dağılımı |
| En Çok Uygunsuzluk Alan Alanlar | Sıralı Çubuk | Top 5 / Top 10 sorunu alan listesi |

---

## 5. Routing Tanımlamaları (`App.tsx`)

```tsx
// Bina Turu Yönetimi
<Route path="/bina-turu" element={<ProtectedRoute><BinaToruDashboard /></ProtectedRoute>} />
<Route path="/bina-turu/turler" element={<ProtectedRoute><BinaToruListesi /></ProtectedRoute>} />
<Route path="/bina-turu/turler/olustur" element={<ProtectedRoute><BinaToruOlustur /></ProtectedRoute>} />
<Route path="/bina-turu/turler/:id" element={<ProtectedRoute><BinaToruDetay /></ProtectedRoute>} />
<Route path="/bina-turu/turler/:id/denetim" element={<ProtectedRoute><DenetimBaslat /></ProtectedRoute>} />
<Route path="/bina-turu/uygunsuzluklar" element={<ProtectedRoute><UygunsuzlukListesi /></ProtectedRoute>} />
<Route path="/bina-turu/uygunsuzluklar/:id" element={<ProtectedRoute><UygunsuzlukDetay /></ProtectedRoute>} />
<Route path="/bina-turu/ayarlar" element={<ProtectedRoute allowedRoles={['admin']}><AyarlarIndex /></ProtectedRoute>} />
```

---

## 6. Navigasyon Entegrasyonu

### PortalPage.tsx
`PortalPage.tsx` içine yeni bir modül kartı eklenir:

```tsx
{
  title: "Bina Turu Yönetimi",
  description: "Bina turlarını planlayın, denetimleri yürütün, uygunsuzlukları takip edin.",
  icon: <BuildingIcon />,
  path: "/bina-turu",
  color: "blue"
}
```

### Sidebar (AppLayout)
Sol menüye aşağıdaki link grubu eklenir:

```
🏢 Bina Turu
 ├── Dashboard
 ├── Tur Listesi
 ├── Yeni Tur Oluştur
 ├── Uygunsuzluk Takibi
 └── ⚙️ Ayarlar (sadece admin)
```

---

## 7. Özet Kontrol Listesi (Checklist)

- [ ] **Prisma Modelleri:** `BTAnaGrup`, `BTDenetlenenAlan`, `BTKategori`, `BTSoruBankasi`, `BTSorumluBirim`, `BTSorumluKisi`, `BTTur`, `BTDenetimEkibi`, `BTTurSorusu`, `BTCevap`, `BTUygunsuzluk` modelleri `schema.prisma`'ya eklendi.
- [ ] **Prisma Migration:** `npx prisma migrate dev --name bina_turu_module` çalıştırıldı.
- [ ] **Backend Routes:** `backend/src/routes/bina-turu/` altında tüm route dosyaları oluşturuldu.
- [ ] **Backend Entegrasyon:** `app.use('/api/bina-turu', binaToruRoutes)` `index.ts`'e eklendi.
- [ ] **Excel Yükleme:** `xlsx` veya `exceljs` kütüphanesi backend'e eklendi; yükleme endpoint'i çalışıyor.
- [ ] **Frontend Pages:** `frontend/src/pages/bina-turu/` klasörü ve tüm sayfa dosyaları oluşturuldu.
- [ ] **Frontend Components:** `frontend/src/components/bina-turu/` bileşenleri oluşturuldu.
- [ ] **App.tsx:** Tüm rotalar `<ProtectedRoute>` ile tanımlandı.
- [ ] **PortalPage.tsx:** Bina Turu modül kartı eklendi.
- [ ] **Sidebar:** Navigasyon linkleri eklendi.
- [ ] **Dashboard:** Recharts ile 7 grafik bileşeni tamamlandı.
- [ ] **Uygunsuzluk Akışı:** DOF → Uygunsuzluk takibine taşıma ve kapatma akışı test edildi.
- [ ] **Tesis İzolasyonu:** Tüm sorgularda `tesisId` filtresi doğrulandı.

---

## 8. Önemli Notlar

- **Tesis İzolasyonu:** Her API endpoint'te `tesisId` doğrulaması yapılmalı; bir tesisin verisi başka tesis tarafından görülemez.
- **Fotoğraf Yükleme:** Cevap ve uygunsuzluk kapatma adımlarında dosya yükleme için mevcut projedeki storage mekanizması kullanılmalıdır.
- **3 Aylık Dönem:** Tur oluştururken `baslangicTarihi` seçildiğinde `bitisTarihi` otomatik olarak +3 ay hesaplanarak önerilebilir, kullanıcı isterse değiştirebilir.
- **DOF → Uygunsuzluk Geçişi:** `BTCevap` kaydedilirken `dofGerekli: true` ise otomatik olarak `BTUygunsuzluk` kaydı oluşturulur ve denetim bilgileriyle ilişkilendirilir.
- **Denetim Ekibi:** Serbest metin olarak kişi adı girilir ya da mevcut `BTSorumluKisi` listesinden seçilebilir.