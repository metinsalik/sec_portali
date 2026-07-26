# BÖLÜM: KONTROL LİSTESİ (CHECKLIST) MODÜLÜ

## 1. Modülün Temel Mantığı

Bu modül, İSG portalındaki **Risk Yaşam Döngüsü** modülünün doğal uzantısıdır. İSG Uzmanları, sorumlu oldukları tesislerde sahada uygulanan her türlü denetim ve kontrol formunu dijital ortamda oluşturabilir, uygulayabilir, puanlayabilir ve raporlayabilir.

Modülün temel felsefesi **"şablon → uygulama → raporlama"** döngüsüdür:

```text
[ ŞABLON TASARLA ] ➔ [ TESİSE UYGULA ] ➔ [ PUANLA & RAPORLA ]
```

Sistemin Google Forms'dan temel farkı, **ağırlıklı puanlama (TW)**, **kategori bazlı gruplama**, **fotoğraf kanıt sistemi** ve **tesis/hastane bazlı karşılaştırmalı raporlama** yeteneklerini yerel olarak barındırmasıdır. Uzman herhangi bir konuda (yangın, hijyen, iş güvenliği, çevre, laboratuvar vb.) sıfırdan şablon oluşturabilir veya mevcut Excel kontrol listelerini sisteme aktarabilir.

---

## 2. Temel Kavramlar

| Kavram | Açıklama |
|---|---|
| **Şablon (Template)** | Tekrar tekrar kullanılabilen kontrol listesi taslağı. Sorular, kategoriler, ağırlıklar ve değerlendirme ölçeği burada tanımlanır. Tek başına veri içermez. |
| **Uygulama (Submission)** | Bir şablonun belirli bir tesiste, belirli bir tarihte doldurulmuş hali. Cevaplar, puanlar, fotoğraflar ve notlar buradadır. |
| **Soru (Item)** | Şablondaki tek bir değerlendirme kriteri. Farklı tiplerde olabilir (seçenekli, metin, sayısal, fotoğraf vb.). |
| **Kategori (Section)** | Soruları mantıksal başlıklar altında gruplar. Örn: "Yangın Güvenliği", "Elektrik Tesisatı", "Atık Yönetimi". |
| **Ağırlık (TW - Total Weight)** | Her sorunun toplam skora etkisini belirleyen sayısal değer. Kritik maddeler daha yüksek ağırlık alır. |
| **Değerlendirme Ölçeği (Scale)** | Şablon düzeyinde tanımlanan ve tüm sorulara uygulanan cevap-puan eşleştirmesi. |

---

## 3. Değerlendirme Ölçeği Sistemi

Her şablon, kendi **değerlendirme ölçeğini** tanımlar. Bu sayede farklı denetim türleri, farklı ölçekler kullanabilir. Ölçek, şablona ait seçeneklerin listesinden ve her seçeneğin çarpanından oluşur.

### Örnek Ölçek: Yangın Önlemleri (Mevcut Excel'deki Mantık)

| Seçenek | Çarpan | Açıklama |
|---|---|---|
| Karşılıyor | `×1.0` | Tam puan |
| Kısmen Karşılıyor | `×0.5` | Yarım puan |
| Karşılamıyor | `×(-1.0)` | Negatif puan (cezalandırıcı) |
| Kapsam Dışı | `NA` | Puanlamaya dahil edilmez, TW toplamından düşülür |

### Örnek Ölçek: Basit Evet/Hayır

| Seçenek | Çarpan |
|---|---|
| Evet | `×1.0` |
| Hayır | `×0.0` |
| Uygulanamaz | `NA` |

### Formül

Bir uygulamanın **toplam skoru** şu şekilde hesaplanır:

```
Kazanılan Puan = Σ (Seçenek Çarpanı × TW)          [Kapsam Dışı maddeler hariç]
Mümkün Toplam  = Σ TW                                [Kapsam Dışı maddeler hariç]
Yüzde Skor     = (Kazanılan Puan / Mümkün Toplam) × 100
```

---

## 4. Soru Tipleri

Şablon tasarlanırken her soru için bir tip seçilir. Tip, kullanıcı arayüzünde nasıl bir input gösterileceğini ve verinin nasıl saklanacağını belirler.

| Tip | Kod | Değerlendirme | Açıklama |
|---|---|---|---|
| **Ölçekli Seçim** | `SCALE` | ✅ Puanlanır | Şablonun değerlendirme ölçeğindeki seçeneklerden biri seçilir. Ana tip budur. Mevcut Excel'deki gibi. |
| **Evet / Hayır** | `YES_NO` | ✅ Puanlanır | Hızlı iki seçenekli değerlendirme. İsteğe bağlı "Uygulanamaz" seçeneği. |
| **Sayısal Değer** | `NUMBER` | ⚙️ Opsiyonel | Ölçüm değeri girilir (sıcaklık, basınç vb.). Min/max limitleri tanımlanabilir, limit dışı ise uyarı verir. |
| **Metin / Not** | `TEXT` | ❌ Puanlanmaz | Serbest metin alanı. Açıklama, gözlem, yorum için kullanılır. |
| **Fotoğraf** | `PHOTO` | ❌ Puanlanmaz | Sadece fotoğraf yükleme alanı. Kanıt, belge veya durum tespiti için. |
| **Çoklu Seçim** | `MULTI_SELECT` | ❌ Puanlanmaz | Birden fazla seçenek işaretlenebilir. Örn: "Bulunan ekipmanlar" listesi. |
| **Tarih** | `DATE` | ❌ Puanlanmaz | Tarih seçici. Son bakım tarihi, periyodik kontrol tarihi vb. |

**Not:** Her soru tipinden bağımsız olarak, tüm sorulara opsiyonel **"Açıklama / Not"** metin alanı ve **"Fotoğraf Ekle"** butonu eşlik eder. Bunlar soru tipinin dışında, her soruya eklenmiş genel alanlardır.

---

## 5. Veritabanı Modeli (Prisma)

```prisma
// ============================================
// 1. ŞABLON (TEMPLATE) YAPISI
// ============================================

// Kontrol listesi şablonu. Tekrar tekrar kullanılabilir.
model ChecklistTemplate {
  id              String                @id @default(uuid())
  title           String                // "Yangın Önlemleri Saha Kontrol Listesi"
  description     String?               // Şablonun kısa açıklaması
  version         Int                   @default(1)     // Şablon versiyonu (güncelleme takibi)
  createdById     String                // Şablonu oluşturan uzman ID'si
  isActive        Boolean               @default(true)  // Pasif şablonlar listede gösterilmez
  createdAt       DateTime              @default(now())
  updatedAt       DateTime              @updatedAt

  scale           ScaleOption[]         // Bu şablonun değerlendirme ölçeği
  sections        ChecklistSection[]    // Kategori/bölüm grupları
  submissions     ChecklistSubmission[] // Bu şablonla doldurulan uygulamalar
}

// Değerlendirme ölçeği seçenekleri (şablon başına tanımlanır)
model ScaleOption {
  id              String             @id @default(uuid())
  templateId      String
  label           String             // "Karşılıyor", "Kısmen Karşılıyor", "Karşılamıyor", "Kapsam Dışı"
  multiplier      Float?             // 1.0, 0.5, -1.0  (null ise NA — puanlamaya dahil edilmez)
  sortOrder       Int                // Görüntüleme sırası
  color           String?            // Opsiyonel UI rengi: "#22c55e", "#eab308", "#ef4444"

  template        ChecklistTemplate  @relation(fields: [templateId], references: [id], onDelete: Cascade)
}

// Soru kategorisi / bölüm başlığı
model ChecklistSection {
  id              String             @id @default(uuid())
  templateId      String
  title           String             // "Yangın Güvenliği", "Atık Yönetimi"
  sortOrder       Int                // Bölüm sırası

  template        ChecklistTemplate  @relation(fields: [templateId], references: [id], onDelete: Cascade)
  items           ChecklistItem[]
}

// Tek bir kontrol maddesi / soru
model ChecklistItem {
  id              String             @id @default(uuid())
  sectionId       String
  itemNo          Int                // Soru numarası (1, 2, 3...)
  questionText    String             // Soru metni (uzun olabilir)
  questionType    String             // SCALE, YES_NO, NUMBER, TEXT, PHOTO, MULTI_SELECT, DATE
  weight          Float              @default(1)  // TW — ağırlık değeri
  isRequired      Boolean            @default(true)
  sortOrder       Int
  config          Json?              // Tipe özgü ek ayarlar (aşağıda detaylandırılmıştır)

  section         ChecklistSection   @relation(fields: [sectionId], references: [id], onDelete: Cascade)
  answers         ChecklistAnswer[]
}

// ============================================
// 2. UYGULAMA (SUBMISSION) YAPISI
// ============================================

// Bir şablonun belirli bir tesiste doldurulmuş hali
model ChecklistSubmission {
  id              String             @id @default(uuid())
  templateId      String
  facilityId      String             // Facility tablosuna referans (Risk modülüyle ortak)
  conductedById   String             // Denetimi yapan uzman ID'si
  auditDate       DateTime           // Denetim tarihi
  auditTimeStart  String?            // Başlangıç saati ("09:00")
  auditTimeEnd    String?            // Bitiş saati ("11:30")
  auditTeam       String?            // Denetim ekibi bilgisi (metin)
  status          String             @default("TASLAK")  // TASLAK, TAMAMLANDI, ONAYLANDI
  totalScore      Float?             // Hesaplanan toplam puan
  maxScore        Float?             // Mümkün maksimum puan
  percentScore    Float?             // Yüzde skor
  notes           String?            // Genel denetim notları
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt

  template        ChecklistTemplate  @relation(fields: [templateId], references: [id], onDelete: Cascade)
  facility        Facility           @relation(fields: [facilityId], references: [id], onDelete: Cascade)
  answers         ChecklistAnswer[]
  attachments     SubmissionAttachment[]
}

// Tek bir soruya verilen cevap
model ChecklistAnswer {
  id              String              @id @default(uuid())
  submissionId    String
  itemId          String
  scaleOptionId   String?             // SCALE tipi için: seçilen ölçek seçeneği
  yesNoValue      Boolean?            // YES_NO tipi için
  numberValue     Float?              // NUMBER tipi için
  textValue       String?             // TEXT tipi için veya herhangi bir sorunun "Açıklama/Not" alanı
  dateValue       DateTime?           // DATE tipi için
  multiSelectVal  Json?               // MULTI_SELECT tipi için: seçilen değerler dizisi
  photoPath       String?             // Cevaba eklenen fotoğraf yolu
  notApplicable   Boolean             @default(false)  // "Kapsam Dışı" veya "Uygulanamaz" olarak işaretlenmiş mi
  earnedScore     Float?              // Hesaplanan puan (TW × çarpan)
  note            String?             // Maddeye özel ek not / açıklama

  submission      ChecklistSubmission @relation(fields: [submissionId], references: [id], onDelete: Cascade)
  item            ChecklistItem       @relation(fields: [itemId], references: [id], onDelete: Cascade)
}

// Denetim ekleri (genel fotoğraflar, belgeler)
model SubmissionAttachment {
  id              String              @id @default(uuid())
  submissionId    String
  filePath        String              // "/uploads/checklists/{submissionId}/S-1.jpg"
  label           String?             // "S-1", "Jeneratör odası genel görünüm"
  sortOrder       Int                 @default(0)

  submission      ChecklistSubmission @relation(fields: [submissionId], references: [id], onDelete: Cascade)
}
```

### `config` JSON Alanı Örnekleri (Soru Tipine Göre)

```jsonc
// NUMBER tipi — limit kontrolü
{
  "min": 0,
  "max": 50,
  "unit": "°C",
  "warningAbove": 40,
  "warningBelow": 5
}

// MULTI_SELECT tipi — seçenek listesi
{
  "options": ["Yangın Tüpü", "Sprink", "Yangın Dolabı", "FM-200", "Duman Dedektörü"]
}

// YES_NO tipi — "Uygulanamaz" seçeneği aktif mi
{
  "allowNA": true
}

// DATE tipi
{
  "maxPastDays": 365  // En fazla 1 yıl öncesi seçilebilir
}
```

---

## 6. İlişki Haritası (Mevcut Modüllerle Bağlantı)

Kontrol Listesi modülü, Risk modülündeki **Facility** tablosunu doğrudan kullanır. Yeni tesis tablosu oluşturulmaz; her iki modül aynı tesis havuzundan beslenir.

```text
┌─────────────────────┐         ┌──────────────────────────┐
│      Facility       │◄────────│   ChecklistSubmission    │
│  (Risk modülünden)  │         │  facilityId → Facility   │
└─────────────────────┘         └──────────────────────────┘
         │                                  │
         │                                  ▼
         │                      ┌──────────────────────────┐
         │                      │    ChecklistAnswer        │
         │                      └──────────────────────────┘
         │
         ▼
┌─────────────────────┐         ┌──────────────────────────┐
│  ExpertFacility     │         │  ChecklistTemplate       │
│ (Uzman-Tesis atama) │         │  ┣ ScaleOption           │
└─────────────────────┘         │  ┣ ChecklistSection      │
                                │  ┗ ChecklistItem         │
                                └──────────────────────────┘
```

**Yetki Kuralı:** Bir uzman, yalnızca `ExpertFacility` tablosunda eşleştirilmiş olduğu tesislere ait kontrol listesi uygulamalarını görebilir ve düzenleyebilir. Şablon oluşturma ise tüm uzmanlar için açıktır (şablonlar tesis bağımsızdır).

---

## 7. Backend API Yapısı

**Klasör:** `backend/src/routes/checklists/`

### 7.1 Şablon Yönetimi

| Metod | Endpoint | Açıklama |
|---|---|---|
| `GET` | `/api/checklists/templates` | Uzmanın erişebildiği tüm aktif şablonları listeler |
| `GET` | `/api/checklists/templates/:id` | Tek bir şablonun detayı (bölümler, sorular, ölçek dahil) |
| `POST` | `/api/checklists/templates` | Yeni şablon oluştur |
| `PUT` | `/api/checklists/templates/:id` | Şablonu güncelle (versiyon otomatik artar) |
| `DELETE` | `/api/checklists/templates/:id` | Şablonu pasife al (soft delete — `isActive: false`) |
| `POST` | `/api/checklists/templates/import-excel` | Excel dosyasından şablon oluştur |
| `GET` | `/api/checklists/templates/:id/export-excel` | Şablonu boş Excel olarak indir |

### 7.2 Uygulama (Denetim Doldurma)

| Metod | Endpoint | Açıklama |
|---|---|---|
| `GET` | `/api/checklists/submissions?facilityId=X` | Tesise ait tüm doldurulmuş kontrol listeleri |
| `GET` | `/api/checklists/submissions/:id` | Tek bir uygulamanın detayı (cevaplar dahil) |
| `POST` | `/api/checklists/submissions` | Yeni uygulama başlat (şablon + tesis + tarih) |
| `PUT` | `/api/checklists/submissions/:id` | Uygulamayı güncelle (cevapları kaydet / durumu değiştir) |
| `PUT` | `/api/checklists/submissions/:id/complete` | Uygulamayı tamamla (skor hesaplanır, durum → TAMAMLANDI) |
| `DELETE` | `/api/checklists/submissions/:id` | Taslak durumundaki uygulamayı sil |
| `POST` | `/api/checklists/submissions/:id/attachments` | Fotoğraf / belge yükle |

### 7.3 Raporlama

| Metod | Endpoint | Açıklama |
|---|---|---|
| `GET` | `/api/checklists/reports/facility/:facilityId` | Tesise ait tüm uygulamaların özet skorları |
| `GET` | `/api/checklists/reports/compare?facilityIds=X,Y,Z` | Tesisler arası karşılaştırmalı rapor |
| `GET` | `/api/checklists/reports/trend?templateId=X&facilityId=Y` | Aynı şablonun zaman içindeki skor değişimi |
| `GET` | `/api/checklists/submissions/:id/export-pdf` | Doldurulmuş kontrol listesini PDF olarak indir |

### 7.4 Backend Entegrasyonu

```typescript
// backend/src/index.ts
import checklistRoutes from './routes/checklists';
app.use('/api/checklists', checklistRoutes);
```

---

## 8. Excel Import Mekanizması

Mevcut Excel kontrol listelerinin sisteme şablon olarak aktarılması için yapılandırılmış bir import süreci tasarlanmıştır. Uzman, elindeki Excel dosyasını yükler ve sistem dosyayı aşağıdaki kurallara göre ayrıştırır.

### 8.1 Desteklenen Excel Yapısı

Sistem, yüklenen Excel dosyasından şu bilgileri okur:

| Excel'deki Alan | Eşlendiği Model Alanı | Zorunlu |
|---|---|---|
| Başlık satırı (merge cell) | `ChecklistTemplate.title` | ✅ |
| Soru metni sütunu (B) | `ChecklistItem.questionText` | ✅ |
| Kategori sütunu | `ChecklistSection.title` | ✅ |
| TW / Ağırlık sütunu | `ChecklistItem.weight` | ✅ |
| Değerlendirme seçenekleri | `ScaleOption` kayıtları | ⚙️ Otomatik |

### 8.2 Import Akışı

```text
1. Uzman Excel dosyasını yükler
2. Sistem dosyayı okur, başlık satırını bulur → Şablon adı
3. Soru satırları taranır:
   a. Kategori sütunundaki benzersiz değerler → ChecklistSection kayıtları
   b. Her soru satırı → ChecklistItem kaydı (tip: SCALE varsayılan)
   c. TW sütunundaki formüllerden sabit ağırlıklar çıkarılır
4. Değerlendirme sütunundaki Data Validation seçenekleri → ScaleOption kayıtları
5. Formüldeki çarpanlar parse edilir → ScaleOption.multiplier değerleri
6. Önizleme ekranı gösterilir (uzman onaylar veya düzenler)
7. Onay sonrası şablon veritabanına kaydedilir
```

### 8.3 Ekler (Attachments) Sayfası Desteği

Excel'deki "Ekler" sayfasındaki fotoğraf yuvalarına (S-1, S-2, ...) karşılık gelen yapı, `SubmissionAttachment` modeli üzerinden yönetilir. Import sırasında Excel'deki yuva sayısı tespit edilir ve uygulama formunda o kadar fotoğraf alanı hazırlanır.

---

## 9. Frontend Tasarımı (UI/UX)

### 9.1 Klasör Yapısı

```
frontend/src/
├── pages/checklists/
│   ├── TemplateListPage.tsx        // Şablon listesi
│   ├── TemplateBuilderPage.tsx     // Şablon oluştur/düzenle (drag & drop)
│   ├── SubmissionListPage.tsx      // Tesis bazlı uygulama listesi
│   ├── SubmissionFormPage.tsx      // Kontrol listesi doldurma arayüzü
│   ├── SubmissionReviewPage.tsx    // Doldurulmuş liste görüntüleme / PDF önizleme
│   └── ReportsPage.tsx             // Raporlama & karşılaştırma
│
├── components/checklists/
│   ├── TemplateCard.tsx            // Şablon kartı
│   ├── SectionBlock.tsx            // Kategori bloğu (soru grubunu sarar)
│   ├── QuestionRenderer.tsx        // Soru tipine göre dinamik input render
│   ├── ScaleSelector.tsx           // Ölçekli değerlendirme radio butonları
│   ├── ScoreBar.tsx                // Anlık skor çubuğu
│   ├── PhotoUploader.tsx           // Fotoğraf yükleme bileşeni
│   ├── ExcelImportModal.tsx        // Excel import sihirbazı
│   └── ComparisonChart.tsx         // Tesis karşılaştırma grafiği
```

### 9.2 Şablon Oluşturma Ekranı (Template Builder)

Uzmanın sıfırdan veya Excel'den şablon oluşturabildiği, sürükle-bırak destekli bir düzenleyici.

```text
┌─────────────────────────────────────────────────────────────────────┐
│  📋 Şablon Oluştur                                    [💾 Kaydet] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Şablon Adı:  [ Yangın Önlemleri Saha Kontrol Listesi           ]  │
│  Açıklama:    [ Hastanelerin yangın güvenliği denetim formu      ]  │
│                                                                     │
│  ── Değerlendirme Ölçeği ──────────────────────────────────────    │
│  │ Karşılıyor      │ ×1.0   │ 🟢 │ [✏️] [🗑️]                     │
│  │ Kısmen Karşılıyor │ ×0.5 │ 🟡 │ [✏️] [🗑️]                     │
│  │ Karşılamıyor    │ ×(-1)  │ 🔴 │ [✏️] [🗑️]                     │
│  │ Kapsam Dışı     │ NA     │ ⚪ │ [✏️] [🗑️]                     │
│  │ [+ Seçenek Ekle]                                               │
│                                                                     │
│  ── Bölümler & Sorular ────────────────────────────────────────    │
│                                                                     │
│  📂 Yangın Güvenliği                              [⬆️⬇️] [🗑️]    │
│  ┣ 1. Çatılarda yanıcı malzeme...      │ SCALE │ TW:10 │ [✏️🗑️] │
│  ┣ 2. Jeneratör alanı önlemleri...     │ SCALE │ TW:10 │ [✏️🗑️] │
│  ┣ 3. Baca temizlikleri...             │ SCALE │ TW:7  │ [✏️🗑️] │
│  ┗ [+ Soru Ekle]                                                   │
│                                                                     │
│  📂 Elektrik Güvenliği                            [⬆️⬇️] [🗑️]    │
│  ┣ 12. Elektrik panoları kontrolü...   │ SCALE │ TW:7  │ [✏️🗑️] │
│  ┗ [+ Soru Ekle]                                                   │
│                                                                     │
│  [+ Bölüm Ekle]           [📥 Excel'den İçe Aktar]                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 9.3 Kontrol Listesi Doldurma Ekranı (Submission Form)

Uzmanın sahada kullandığı asıl form arayüzü. Mobil uyumlu, her soruya anlık cevap verilir ve toplam skor canlı güncellenir.

```text
┌─────────────────────────────────────────────────────────────────────┐
│  🏥 Liv Topkapı  ›  Yangın Önlemleri             Tarih: 26.07.2026│
│  Denetim Ekibi: [ ________________ ]     Saat: [09:00] - [11:30] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ████████████████████░░░░░  Skor: 142 / 200 (%71)   TAMAMLA ▶    │
│                                                                     │
│  ── 🔥 Yangın Güvenliği ───────────────────────────────────────    │
│                                                                     │
│  1. Çatılarda ve çatılarda bulunan teknik alanlarda               │
│     herhangi bir yanıcı malzeme muhafazası bulunmamalıdır.         │
│     ┌──────────────────────────────────────────┐                   │
│     │ 🟢 Karşılıyor  │ 🟡 Kısmen  │ 🔴 Karşılamıyor │ ⚪ K.Dışı │
│     └──────────────────────────────────────────┘                   │
│     TW: 10 │ Puan: +10                                             │
│     📝 Not: [ _________________________ ]     📷 [Fotoğraf Ekle]  │
│                                                                     │
│  2. Jeneratör ve yakıt tankı alanında yangın riskine karşı        │
│     alınması gereken önlemler alınmış olmalıdır.                   │
│     ┌──────────────────────────────────────────┐                   │
│     │ 🟢 Karşılıyor  │ 🟡 Kısmen  │ 🔴 Karşılamıyor │ ⚪ K.Dışı │
│     └──────────────────────────────────────────┘                   │
│     TW: 10 │ Puan: +5                                              │
│     📝 Not: [ Pedallı kutu eksik          ]     📷 [2 fotoğraf]   │
│                                                                     │
│  ── ⚡ Elektrik Güvenliği ─────────────────────────────────────    │
│  ...                                                                │
│                                                                     │
│  ── 📎 Ekler ──────────────────────────────────────────────────    │
│  │ S-1 [📷+] │ S-2 [📷+] │ S-3 [📷+] │ S-4 [📷+] │ S-5 [📷+] │ │
│  │ S-6 [📷+] │ S-7 [📷+] │ ...                                   │
│                                                                     │
│  [💾 Taslak Kaydet]                            [✅ Denetimi Bitir] │
└─────────────────────────────────────────────────────────────────────┘
```

### 9.4 Raporlama Ekranı

```text
┌─────────────────────────────────────────────────────────────────────┐
│  📊 Kontrol Listesi Raporları                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Şablon:  [Yangın Önlemleri ▼]     Dönem: [2026 ▼]                │
│                                                                     │
│  ── Tesis Karşılaştırması ─────────────────────────────────────    │
│                                                                     │
│  Liv Topkapı        ████████████████████░░░░  %82     🟢           │
│  MP Ataşehir        ██████████████████░░░░░░  %74     🟡           │
│  Liv Bahçeşehir     ████████████████░░░░░░░░  %68     🟡           │
│  Liv Ankara         ████████████░░░░░░░░░░░░  %53     🔴           │
│                                                                     │
│  ── Zaman İçinde Trend (Liv Topkapı) ──────────────────────────    │
│                                                                     │
│  %100│                                          ●                  │
│      │                              ●          ╱                   │
│  %75 │              ●              ╱  ╲       ╱                    │
│      │    ●        ╱  ╲           ╱    ●     ╱                     │
│  %50 │   ╱ ╲      ╱    ╲        ╱            ╱                     │
│      │  ╱   ●    ╱      ●      ╱                                   │
│  %25 │ ╱                                                            │
│      └──────────────────────────────────────────                   │
│        Oca   Şub   Mar   Nis   May   Haz   Tem                    │
│                                                                     │
│  ── Kategori Bazlı Kırılım (Son Denetim) ─────────────────────    │
│  Yangın Güvenliği      %78                                         │
│  Elektrik Güvenliği    %65                                         │
│  Atık Yönetimi         %90                                         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 10. Frontend Routing Entegrasyonu

```tsx
// App.tsx içine eklenmesi gereken route tanımları

<Route path="/checklists" element={<ProtectedRoute allowedRoles={['admin','management','specialist']}><TemplateListPage /></ProtectedRoute>} />
<Route path="/checklists/templates/new" element={<ProtectedRoute allowedRoles={['admin','specialist']}><TemplateBuilderPage /></ProtectedRoute>} />
<Route path="/checklists/templates/:id/edit" element={<ProtectedRoute allowedRoles={['admin','specialist']}><TemplateBuilderPage /></ProtectedRoute>} />
<Route path="/checklists/submissions" element={<ProtectedRoute allowedRoles={['admin','management','specialist']}><SubmissionListPage /></ProtectedRoute>} />
<Route path="/checklists/submissions/:id" element={<ProtectedRoute allowedRoles={['admin','management','specialist']}><SubmissionFormPage /></ProtectedRoute>} />
<Route path="/checklists/submissions/:id/review" element={<ProtectedRoute allowedRoles={['admin','management','specialist']}><SubmissionReviewPage /></ProtectedRoute>} />
<Route path="/checklists/reports" element={<ProtectedRoute allowedRoles={['admin','management']}><ReportsPage /></ProtectedRoute>} />
```

**PortalPage.tsx** veya Sidebar'a eklenecek modül kartı:

```tsx
{
  title: "Kontrol Listeleri",
  icon: ClipboardCheck,   // Lucide icon
  path: "/checklists",
  description: "Saha denetim formları oluştur, uygula ve raporla",
  color: "emerald"
}
```

---

## 11. Docker & Dosya Yönetimi

Denetim sırasında yüklenen fotoğraflar, Risk modülüyle aynı Docker nginx altyapısını kullanır.

- **Yükleme dizini:** `/uploads/checklists/{submissionId}/`
- **Dosya adlandırma:** `{itemNo}_{timestamp}.jpg` (soru bazlı fotoğraflar) veya `S-{slotNo}.jpg` (genel ekler)
- **Veritabanında saklanan:** Yalnızca dosya yolu (örn: `/uploads/checklists/abc123/1_1722002400.jpg`)
- **Nginx konfigürasyonu:** Mevcut `/uploads/` location bloğu checklists alt dizinini de kapsar, ek konfigürasyon gerekmez.

---

## 12. Özet Kontrol Listesi (Modül Geliştirme Checklist)

Bu modül geliştirilirken `modul.md` rehberine uygun olarak aşağıdaki adımlar takip edilmelidir:

- [ ] **1. Veritabanı:** `schema.prisma` dosyasına `ChecklistTemplate`, `ScaleOption`, `ChecklistSection`, `ChecklistItem`, `ChecklistSubmission`, `ChecklistAnswer`, `SubmissionAttachment` modelleri eklendi. `Facility` modeline `submissions ChecklistSubmission[]` ilişkisi eklendi.
- [ ] **2. Prisma:** `npx prisma generate` ve `npx prisma db push` komutları çalıştırıldı.
- [ ] **3. Backend Route:** `backend/src/routes/checklists/` altında şablon, uygulama ve raporlama API uç noktaları oluşturuldu.
- [ ] **4. Backend Entegrasyon:** `app.use('/api/checklists', checklistRoutes)` ile `index.ts` dosyasına register edildi.
- [ ] **5. Excel Import Servisi:** `backend/src/services/checklistImport.ts` dosyasında Excel ayrıştırma mantığı kodlandı.
- [ ] **6. Frontend Pages:** `frontend/src/pages/checklists/` klasörü oluşturuldu. `TemplateListPage`, `TemplateBuilderPage`, `SubmissionListPage`, `SubmissionFormPage`, `SubmissionReviewPage`, `ReportsPage` sayfaları kodlandı.
- [ ] **7. Frontend Components:** `frontend/src/components/checklists/` altında `QuestionRenderer`, `ScaleSelector`, `ScoreBar`, `PhotoUploader`, `ExcelImportModal`, `ComparisonChart` bileşenleri oluşturuldu.
- [ ] **8. Frontend App.tsx:** Tüm sayfalar `<Route>` tanımları ile `<ProtectedRoute>` sarmalayıcı ile ana router'a bağlandı.
- [ ] **9. Navigasyon:** Portal sayfasına "Kontrol Listeleri" modül kartı eklendi, sidebar'a bağlantı eklendi.
- [ ] **10. Dosya Yükleme:** `/uploads/checklists/` dizin yapısı oluşturuldu, mevcut nginx konfigürasyonuyla uyumluluğu doğrulandı.
