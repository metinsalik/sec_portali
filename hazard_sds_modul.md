# sec_portali - Tehlikeli Madde Yönetimi (HazMat) + SDS Modülü Geliştirme Rehberi

Bu belge, **sec_portali** sistemine **Tehlikeli Madde Yönetimi** modülünü eklemek için izlenecek adımları, önerilen veri modelini, API uç noktalarını ve frontend sayfa/menü yapısını tanımlar.

> Not: Mevcut projedeki gerçek model/rol/tesis alan adları farklı olabilir. Bu dokümandaki `Facility`, `User`, rol isimleri ve bazı alanlar **şablon** niteliğindedir. Uygulamaya geçerken mevcut `schema.prisma` ve auth/role yapınızla **birebir eşleştirme** yapılmalıdır.

## 0. Modül Kimliği ve Kapsam

- **Modül Kodu (öneri):** `hazmat`
- **Modül Adı:** Tehlikeli Madde Yönetimi
- **Ana Amaç:**
  - Tesis bazlı tehlikeli madde kartı tanımlama (CRUD)
  - GHS/ADR etiket seçimi (ikonlu)
  - KKD (PPE) seçimi (ikonlu)
  - Girilen verilerden **SDS/Güvenlik Bilgi Kartı** görüntüleme
  - Tesis departmanları + tehlikeli madde matrisi
  - “Göz Solüsyonu İhtiyaç Analizi” için **yakında** placeholder
  - Modül ayarları: **miktar birimleri** + (ister ayarlardan ister envanterden) **departman yönetimi**

## 1. Navigasyon / Sidebar Yapısı

Sol menü (HazMat modülü içi) şu şekilde olmalıdır:

- Dashboard
- Tesis Listesi
  - **Merkez** ve **yönetici** roller: buradan tesis seçerek tesise geçebilir.
  - Diğer kullanıcılar:
    - Tek tesis yetkisi varsa tesis otomatik seçili gelir.
    - Birden fazla tesis yetkisi varsa bir tesis seçili gelir; buradan değiştirir.
- Tehlikeli Madde
  - Tehlikeli Madde Tanımlama
  - Güvenlik Bilgi Kartı
- Tesis Envanteri
  - Tesis Departmanları
  - Tehlikeli Madde Matrisi
- Göz Solüsyon İhtiyaç Analizi
  - Yakında (placeholder)
- Modül Ayarları
  - Miktar Birimleri
  - Departman Yönetimi

### 1.1 Tesis Seçimi Davranışı (Özet)

- Uygulama genelinde “aktif tesis” kavramı olmalı.
- Aktif tesis:
  - Kullanıcı tek tesise yetkiliyse otomatik atanır.
  - Çok tesise yetkiliyse son seçilen tesis (yoksa ilk) atanır.
- Merkez/yönetici kullanıcılar, `Tesis Listesi` ekranından tesisi değiştirir.

## 2. Veritabanı ve Model (Backend - Prisma)

### 2.1 Yeni Modeller (Önerilen)

Aşağıdaki modeller, tehlikeli madde kartı ve SDS görüntüleme ihtiyacını karşılar.

> Uyarı: Projede zaten `Facility`, `Department` gibi modeller varsa **yenisini eklemek yerine** var olan modele ilişki kurun.

#### 2.1.1 Tehlikeli Madde (Ana Kayıt)

- Model adı önerisi: `HazmatMaterial`
- Kapsam: kullanıcıların girdiği tüm SDS alanlarını saklar.

Alanlar (ihtiyaç listesine göre):

- Ürün Adı
- Markası
- Miktarı: **sayısal değer** + **birim** (birim ayarlardan gelir)
- Kullanım Şekli
- Bileşimi / İçeriği
- Tehlike Tanımı
- İlkyardım Önlemleri
- Yangınla Mücadele Tedbirleri
- Kaza Sonucu Serbest Kalması Durumunda Alınacak Tedbirler
- Kullanım ve Depolama
- Maruz Kalma Kontrolü ve Kişisel Korunma
- Fiziksel ve Kimyasal Özellikleri
- Stabilite ve Reaktivite
- Toksikolojik Bilgi
- Ekolojik Bilgi
- Temizlik/İmha Yöntemi
- Taşıma Bilgisi
- Tehlike Etiketleri (ADR) (metin/çoklu seçime uygun)
- Yönetmelik Bilgisi

#### 2.1.2 Tehlike Etiketleri (GHS)

- Model adı önerisi: `HazmatHazardLabel`
- Amaç: UI’da ikonlu seçilecek etiketler.
- Material ile **çoktan çoğa** ilişki.

#### 2.1.3 KKD / PPE

- Model adı önerisi: `HazmatPpe`
- Amaç: UI’da ikonlu seçilecek KKD listesi.
- Material ile **çoktan çoğa** ilişki.

#### 2.1.4 Miktar Birimleri (Ayar)

- Model adı önerisi: `HazmatUnit`
- Amaç: mg, g, kg, ml, L vb.

#### 2.1.5 Tesis Departmanları

- Model adı önerisi: `HazmatDepartment`
- Amaç: Tesise göre departman yönetimi.

> Eğer sistemde zaten departman yapısı varsa bunu kullanın; yoksa HazMat modülünün kendi departman tablosu olabilir.

#### 2.1.6 Tesis Envanteri / Matris İçin Bağlantı

Matris için minimum ihtiyaç:
- Bir tesiste, bir departmanda, hangi tehlikeli madde var ve miktarı ne?

- Model adı önerisi: `HazmatInventoryItem`

### 2.2 Prisma Şema Taslağı (Uyarlanabilir)

Aşağıdaki taslak birebir kopyala-yapıştır değildir; proje şemanıza göre düzenlenmelidir.

```prisma
// ÖNEMLİ: Facility ve User gibi modeller projede zaten olabilir.
// Buradaki ilişki alanlarını mevcut şemanıza göre uyarlayın.

model HazmatUnit {
  id        String   @id @default(cuid())
  name      String   // örn: Kilogram
  symbol    String   // örn: kg
  isActive  Boolean  @default(true)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  materials HazmatMaterial[]
}

model HazmatHazardLabel {
  id        String   @id @default(cuid())
  name      String
  code      String?  // örn: GHS01
  iconKey   String?  // FE'de map edilecek anahtar
  isActive  Boolean  @default(true)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  materials HazmatMaterialHazardLabel[]
}

model HazmatPpe {
  id        String   @id @default(cuid())
  name      String
  iconKey   String?
  isActive  Boolean  @default(true)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  materials HazmatMaterialPpe[]
}

model HazmatMaterial {
  id          String   @id @default(cuid())

  // tesis ilişkisi (projedeki Facility model adı/alanı ile eşleştirilecek)
  facilityId  String

  productName String
  brandName   String?

  amountValue Decimal? // sayısal
  unitId      String?
  unit        HazmatUnit? @relation(fields: [unitId], references: [id])

  usageMethod String?
  composition String?

  hazardDescription String?

  firstAid                    String?
  fireFightingMeasures         String?
  accidentalReleaseMeasures    String?
  handlingAndStorage           String?
  exposureControlsPpe          String?
  physicalAndChemicalProperties String?
  stabilityAndReactivity       String?
  toxicologicalInformation     String?
  ecologicalInformation        String?
  disposalConsiderations       String?
  transportInformation         String?
  adrHazardLabels              String?
  regulatoryInformation        String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  hazardLabels HazmatMaterialHazardLabel[]
  ppes         HazmatMaterialPpe[]
}

model HazmatMaterialHazardLabel {
  materialId String
  labelId    String

  material HazmatMaterial     @relation(fields: [materialId], references: [id], onDelete: Cascade)
  label    HazmatHazardLabel  @relation(fields: [labelId], references: [id], onDelete: Cascade)

  @@id([materialId, labelId])
}

model HazmatMaterialPpe {
  materialId String
  ppeId      String

  material HazmatMaterial @relation(fields: [materialId], references: [id], onDelete: Cascade)
  ppe      HazmatPpe      @relation(fields: [ppeId], references: [id], onDelete: Cascade)

  @@id([materialId, ppeId])
}

model HazmatDepartment {
  id         String   @id @default(cuid())
  facilityId String
  name       String
  isActive   Boolean  @default(true)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  inventoryItems HazmatInventoryItem[]

  @@unique([facilityId, name])
}

model HazmatInventoryItem {
  id           String   @id @default(cuid())
  facilityId   String
  departmentId String
  materialId   String

  // departmandaki miktar
  amountValue  Decimal?
  unitId       String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  department HazmatDepartment @relation(fields: [departmentId], references: [id], onDelete: Cascade)
  material   HazmatMaterial   @relation(fields: [materialId], references: [id], onDelete: Cascade)
  unit       HazmatUnit?      @relation(fields: [unitId], references: [id])

  @@index([facilityId, departmentId])
  @@index([facilityId, materialId])
}
```

### 2.3 Prisma Komutları

Backend dizininde:

- `npx prisma format`
- `npx prisma migrate dev --name hazmat_init` (veya mevcut akışınıza göre)
- `npx prisma generate`

## 3. Backend Geliştirme (Node.js/Express)

### 3.1 Route Dosyaları

Önerilen yapı:

- `backend/src/routes/hazmat/index.ts`

Ve alt başlıklara göre route ayrımı yapılabilir:

- `backend/src/routes/hazmat/materials.ts`
- `backend/src/routes/hazmat/settings.ts`
- `backend/src/routes/hazmat/inventory.ts`

> Sisteminiz tek dosya standardını seviyorsa hepsi `index.ts` altında da tutulabilir.

### 3.2 API Uç Noktaları (Öneri)

#### 3.2.1 Materials (Tehlikeli Madde Kartı)

- `GET /api/hazmat/materials?facilityId=...`  (liste)
- `POST /api/hazmat/materials` (oluştur)
- `GET /api/hazmat/materials/:id` (detay/view)
- `PUT /api/hazmat/materials/:id` (edit)
- `DELETE /api/hazmat/materials/:id` (sil)

**Notlar:**
- `facilityId` filtresi zorunlu olmalı (aktif tesisten gelsin).
- Kullanıcının `facilityId` üzerinde yetkisi yoksa 403.

#### 3.2.2 SDS / Güvenlik Bilgi Kartı

- `GET /api/hazmat/materials/:id/sds`  (SDS view model döner)

> İlk aşamada SDS: DB’deki alanların düzenlenmiş/formatlanmış hali olabilir.

Opsiyonel ileri aşama:
- `GET /api/hazmat/materials/:id/sds.pdf` (PDF çıktısı)

#### 3.2.3 Settings

- Units:
  - `GET /api/hazmat/settings/units?facilityId=...` (liste)
  - `POST /api/hazmat/settings/units`
  - `PUT /api/hazmat/settings/units/:id`
  - `DELETE /api/hazmat/settings/units/:id`

- Hazard Labels (seed + yönetim opsiyonel):
  - `GET /api/hazmat/settings/hazard-labels` (global liste)

- PPE (seed + yönetim opsiyonel):
  - `GET /api/hazmat/settings/ppes` (global liste)

- Departments:
  - `GET /api/hazmat/settings/departments?facilityId=...`
  - `POST /api/hazmat/settings/departments`
  - `PUT /api/hazmat/settings/departments/:id`
  - `DELETE /api/hazmat/settings/departments/:id`

#### 3.2.4 Inventory / Matrix

- `GET /api/hazmat/inventory/items?facilityId=...` (matris için)
- `POST /api/hazmat/inventory/items` (departmana madde ekle)
- `PUT /api/hazmat/inventory/items/:id`
- `DELETE /api/hazmat/inventory/items/:id`

### 3.3 Yetkilendirme (Auth Middleware)

- Tüm `/api/hazmat/*` uç noktaları auth gerektirir.
- Rol bazlı yetki:
  - Merkez / yönetici: tesis seçebilir, tüm tesislerde işlem yapabilir (yetkisine göre).
  - Diğer roller: sadece yetkili olduğu tesis(ler) üzerinde işlem yapar.

> Rol isimleri projede nasıl geçiyorsa (örn. `admin`, `management`, `facility_manager` vb.) aynen kullanılmalıdır.

### 3.4 Seed (Öneri)

İlk kurulumda hazard label ve PPE listesi seed edilmesi önerilir.

- GHS label örnekleri: GHS01..GHS09
- PPE örnekleri: gözlük, yüz siperi, eldiven vb.

Seed yöntemi projedeki standart akışa göre belirlenmelidir.

## 4. Frontend Geliştirme (Vite + React + TypeScript)

### 4.1 Klasör Yapısı

- `frontend/src/pages/hazmat/`
  - `HazmatDashboardPage.tsx`
  - `FacilitySelectorPage.tsx`
  - `MaterialsListPage.tsx`
  - `MaterialFormPage.tsx` (create/edit)
  - `MaterialViewPage.tsx` (read-only view)
  - `SdsViewerPage.tsx`
  - `DepartmentsPage.tsx`
  - `MatrixPage.tsx`
  - `EyeWashAnalysisPage.tsx` (Yakında)
  - `HazmatSettingsPage.tsx`
  - `UnitsSettingsPage.tsx`

- `frontend/src/components/hazmat/`
  - `HazmatSidebar.tsx`
  - `MaterialForm.tsx`
  - `HazardLabelPicker.tsx` (ikonlu checkbox grid)
  - `PpePicker.tsx` (ikonlu checkbox grid)
  - `SdsTemplateView.tsx` (SDS formatlama)
  - `FacilitySwitcher.tsx`

### 4.2 Routing Entegrasyonu (App.tsx)

- `App.tsx` içine HazMat route’ları eklenir.
- Route’lar gerekli ise `ProtectedRoute` ile sarılmalıdır.

Önerilen path’ler:

- `/hazmat/dashboard`
- `/hazmat/facilities`
- `/hazmat/materials`
- `/hazmat/materials/new`
- `/hazmat/materials/:id`
- `/hazmat/materials/:id/edit`
- `/hazmat/sds/:materialId`
- `/hazmat/inventory/departments`
- `/hazmat/inventory/matrix`
- `/hazmat/eye-wash` (Yakında)
- `/hazmat/settings/units`
- `/hazmat/settings/departments`

### 4.3 UI / Form Tasarımı

#### 4.3.1 Tehlikeli Madde Tanımlama Formu

Form alanları (verilen listeye göre):

- Ürün Adı
- Markası
- Miktarı:
  - Sayısal değer (`amountValue`)
  - Birim dropdown (`HazmatUnit`) — ayarlardan gelir
- Kullanım Şekli
- Bileşimi / İçeriği
- Tehlike Tanımı
- Tehlike Etiketleri (GHS): ikonlu seçim (checkbox)
- İlkyardım Önlemleri
- Yangınla Mücadele Tedbirleri
- Kaza Sonucu Serbest Kalması Durumunda Alınacak Tedbirler
- Kullanım ve Depolama
- Maruz Kalma Kontrolü ve Kişisel Korunma
- Fiziksel ve Kimyasal Özellikleri
- Stabilite ve Reaktivite
- Toksikolojik Bilgi
- Ekolojik Bilgi
- Temizlik/ İmha Yöntemi
- Taşıma Bilgisi
- Tehlike Etiketleri (ADR)
- Yönetmelik Bilgisi
- Kullanılması Gereken KKD (PPE): ikonlu seçim (checkbox)

#### 4.3.2 View / Edit Akışı

- Liste ekranından `Görüntüle` tıklanınca `MaterialViewPage` açılır.
- View sayfasında `Düzenle` butonu ile `MaterialFormPage (edit)` açılır.
- Silme işlemi liste veya view üzerinden onay modali ile yapılır.

#### 4.3.3 SDS Viewer

- `SdsViewerPage` bir malzemenin alanlarını SDS bölümlerine göre formatlar.
- İlk sürümde sadece web view yeterli.
- İleri sürümde PDF export opsiyonel.

### 4.4 Sidebar Entegrasyonu

- Uygulama genel sidebar’ında HazMat modülüne giriş linki eklenir.
- HazMat modülü içinde kendi alt menüleri gösterilir.

### 4.5 PortalPage Modül Kartı

- `PortalPage.tsx` ekranına “Tehlikeli Madde Yönetimi” kartı eklenir.
- Kart `/hazmat/dashboard` route’una yönlendirir.

## 5. MVP (İlk Yayın) Planı

### 5.1 MVP-1 (En küçük çalışan sürüm)

- Tesis seçimi (aktif tesis mantığı)
- Tehlikeli Madde Tanımlama: CRUD
- Miktar birimleri ayarı: CRUD
- Hazard label + PPE listesi: read-only (seed)
- SDS Viewer: web view

### 5.2 MVP-2

- Departman CRUD
- Envanter item CRUD
- Matris ekranı

### 5.3 MVP-3

- Dashboard metrikleri
- Göz Solüsyonu (Yakında) placeholder sayfası

## 6. Özet Kontrol Listesi (Checklist)

- [ ] `schema.prisma` içine HazMat modelleri ve ilişkiler eklendi (mevcut şemaya uyumlu)
- [ ] Prisma migrate/db push çalıştırıldı
- [ ] `backend/src/routes/hazmat/*` endpoint’leri yazıldı
- [ ] Route `backend/src/index.ts` içine `app.use('/api/hazmat', ...)` ile eklendi
- [ ] FE: `frontend/src/pages/hazmat/*` sayfaları eklendi
- [ ] FE: `frontend/src/components/hazmat/*` bileşenleri eklendi
- [ ] FE: `App.tsx` route’ları eklendi (gerekirse `ProtectedRoute`)
- [ ] PortalPage’e modül kartı eklendi
- [ ] Sidebar’a HazMat linkleri eklendi
- [ ] Seed: Hazard labels + PPE listesi hazırlandı

Bu doküman baz alınarak modül, projedeki standartlara uygun şekilde izole klasör yapısında geliştirilecektir.
