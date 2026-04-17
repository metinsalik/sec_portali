# İSG GÜVENLİK PORTALI — ANA YOL HARİTASI
## Tüm Kararlar, Mimari ve Geliştirme Rehberi

> **Versiyon:** 1.0  
> **Oluşturma Tarihi:** 2026-04-16  
> **Son Güncelleme:** 2026-04-16  
> **Amaç:** Bu dosya projenin tek yetkili kaynağıdır (Single Source of Truth). Tüm kararlar burada belgelenir. Proje ilerledikçe bu dosya güncellenir. Bir AI agent bu dosyayı okuyarak sistemin tamamını anlayabilir.

---

## BÖLÜM 0: KAYNAK DOKÜMANLAR VE ANALİZ ÖZETİ

Bu sistem, üç kaynaktan analiz edilerek oluşturulmuştur:

| Kaynak Dosya | İçerik | Sonuç |
|---|---|---|
| `agent_report_panel.md` | ISG Atama Paneli — Frontend-only SPA, Excel tabanlı, çoklu tesis atama/uyumluluk sistemi | Panel modüllerinin (atama, profesyonel, OSGB, mutabakat) tüm iş kuralları buradan alınacak |
| `agent_report.md` | ISG Tesis Yönetim Portalı — React + Express + SQLite, aylık veri girişi, kaza istatistikleri | Operasyon modüllerinin (HR verisi, kaza, defter, eğitim) tüm mantığı buradan alınacak |
| `rule.md` | Claude Sonnet 4.6 tarafından üretilen birleştirme planı — PostgreSQL, Docker, NTLM, Prisma kararları | Teknoloji kararları ve mimari bu dosyadan onaylanmıştır |

---

## BÖLÜM 1: PROJENİN KİMLİĞİ VE MİSYONU

### 1.1 Ne İnşa Ediyoruz?

**İSG Güvenlik Portalı:** Türkiye İş Sağlığı ve Güvenliği (İSG) mevzuatına uyumluluğu yönetmek için tasarlanmış, birden fazla tesise sahip kurumların kullanabileceği kurumsal yönetim platformu.

**İki ayrı uygulamayı birleştiriyoruz:**

| Kaynak | Amaç | Hedef Kullanıcı |
|---|---|---|
| ISG Atama Paneli | Tesis-uzman atama yönetimi, yasal uyumluluk, ceza riski hesaplama | Merkez Yönetim, Admin |
| ISG Tesis Portalı | Aylık personel/kaza verisi girişi, tespit defteri, eğitim takibi | Tesis İSG Uzmanı, İşyeri Hekimi, DSP |

**Tek bir sistem:** Tek codebase, tek backend, tek veritabanı. Rol bazlı farklı deneyimler aynı uygulamanın içinde.

### 1.2 Temel Değer Önerisi

- Yasal zorunlulukları otomatik hesapla (İGU, Hekim, DSP gereksinimleri)
- Tesis bazlı uyumluluk durumunu anlık izle
- Aylık İSG verilerini merkezi olarak topla
- Ceza riskini önceden hesapla ve uyar
- Mail + bildirim ile proaktif yönetim sağla

---

## BÖLÜM 2: ROL SİSTEMİ VE ERİŞİM MATRİSİ

### 2.1 Roller

| Rol ID | Ad | Açıklama |
|---|---|---|
| `admin` | Admin | Her şeye tam erişim |
| `management` | Merkez Yönetim | Panel + Operasyon tam erişim, sistem ayarları hariç bazı kısıtlamalar |
| `specialist` | İş Güvenliği Uzmanı | Sadece atandığı tesislerin operasyon modülleri |
| `physician` | İşyeri Hekimi | Sadece atandığı tesislerin operasyon modülleri |
| `dsp` | Diğer Sağlık Personeli (DSP) | Sadece atandığı tesislerin operasyon modülleri |

### 2.2 Uygulama Erişim Matrisi

```
┌──────────────────────────────────────────────────────┐
│                    GİRİŞ EKRANI                      │
└──────────────────────┬───────────────────────────────┘
                       │
          ┌────────────┴────────────┐
          │                         │
    Admin / Management         Specialist / Physician / DSP
          │                         │
          ▼                         ▼
  ┌───────────────────┐    ┌───────────────────┐
  │  İSG ATAMA PANELİ │    │                   │
  │  İSG AYLIK VERİ   │    │  İSG AYLIK VERİ   │
  │  SİSTEM AYARLARI  │    │  (sadece kendi    │
  │                   │    │   tesisleri)      │
  └───────────────────┘    └───────────────────┘
```

### 2.3 Modül Bazlı Erişim Tablosu

| Modül | Admin | Management | Specialist/Physician/DSP |
|---|---|---|---|
| **İSG Atama Paneli** | ✅ | ✅ | ❌ |
| → Dashboard | ✅ | ✅ | ❌ |
| → Tesis Yönetimi | ✅ | ✅ | ❌ |
| → Profesyoneller | ✅ | ✅ | ❌ |
| → OSGB Firmaları | ✅ | ✅ | ❌ |
| → Atama Yönetimi | ✅ | ✅ | ❌ |
| → Mutabakat | ✅ | ✅ | ❌ |
| → İşveren Vekilleri | ✅ | ✅ | ❌ |
| **İSG Aylık Veri Sistemi** | ✅ | ✅ | ✅ (kendi tesisi) |
| → Dashboard | ✅ | ✅ | ✅ |
| → Aylık Personel Verisi | ✅ | ✅ | ✅ |
| → Kaza İstatistikleri | ✅ | ✅ | ✅ |
| → Tespit & Öneri Defteri | ✅ | ✅ | ✅ |
| → Eğitim Takibi | ✅ | ✅ | ✅ |
| → İSG Kurul | ✅ | ✅ | ✅ |
| → Ölçüm & Kontrol | ✅ | ✅ | ✅ |
| **Sistem Ayarları** | ✅ | ⚠️ (kısıtlı) | ❌ |
| → Tesisler | ✅ | ✅ | ❌ |
| → Kullanıcı Yönetimi | ✅ | ❌ | ❌ |
| → SMTP Mail Ayarları | ✅ | ❌ | ❌ |
| → Bildirim Ayarları | ✅ | ✅ | ❌ |
| → Hesaplama Parametreleri | ✅ | ✅ | ❌ |
| → Kategoriler & Departmanlar | ✅ | ✅ | ❌ |

### 2.4 Tesis Bazlı Erişim Kuralları

Bu sistemin en kritik güvenlik mekanizmasıdır. Her `facilityId` içeren API isteği, `req.user.facilities` dizisiyle karşılaştırılır.

| Rol | Erişim Kapsamı | Middleware Davranışı |
|---|---|---|
| `admin` | Tüm tesisler | Kontrol atlanır |
| `management` | Tüm tesisler | Kontrol atlanır (admin gibi) |
| `specialist` / `physician` / `dsp` | Sadece UserFacility tablosundaki atanmış tesisler | Zorunlu kontrol → 403 |

> **OSGB Kadrosu Notu:** OSGB çalışanları için ayrı bir rol yoktur. `specialist` / `physician` / `dsp` rollerinden birini alırlar. `employmentType: "OSGB Kadrosu"` alanı yalnızca maliyet hesaplama ve mutabakat modülü için kullanılır; tesis erişimi UserFacility tablosundaki atamalarla kontrol edilir.

**Middleware Zorunluluğu:**
```typescript
// requireFacilityAccess middleware — tesis-spesifik her route'ta çalışır
if (!req.user.isAdmin && !req.user.isManagement) {
  if (!req.user.facilities.includes(facilityId)) {
    return res.status(403).json({ error: 'Bu tesise erişim yetkiniz yok.' });
  }
}
```

---

## BÖLÜM 3: GİRİŞ EKRANI TASARIMI

### 3.1 Login Sayfası Kararları

- **Tasarım:** Modern glassmorphism, koyu arka plan, premium hissiyat
- **Kimlik Doğrulama:** NTLM (Windows SSO) — tek seçenek, alternatif yok
- **Giriş Butonu:** "Windows Kimliğinizle Giriş Yapın"
- **Logo + Kurum Adı** üstte gösterilir
- **Hata Mesajı:** Yetkisiz kullanıcı için açık mesaj

### 3.2 Giriş Akışı

```
1. Kullanıcı /login sayfasını açar
2. "Windows Kimliğinizle Giriş Yapın" butonuna tıklar
3. GET /api/auth/me (NTLM headers ile)
4. Backend: NTLM header → username → JWT token üret
5. Frontend: Token'ı sakla, kullanıcı rollerine bak
6. Eğer admin/management → /panel (İSG Atama Paneli)
7. Eğer specialist/physician/dsp → /operations (Aylık Veri Sistemi)
```

### 3.3 Yönlendirme Mantığı (Giriş Sonrası)

```typescript
// Giriş sonrası yönlendirme:
if (user.roles.includes('admin') || user.roles.includes('management')) {
  navigate('/panel');       // İSG Atama Paneli ana sayfası
} else {
  navigate('/operations');  // İSG Aylık Veri Sistemi ana sayfası
}
```

---

## BÖLÜM 4: NAVİGASYON YAPISI

### 4.1 Ana Uygulama Yapısı

Giriş sonrası ekranın üst kısmında **iki ana modül** görünür (admin/management için):

```
┌─────────────────────────────────────────────┐
│  [Logo]  [İSG ATAMA PANELİ] [İSG AYLIK VERİ] │  ← Ana Sekme/Nav
│                                    [⚙️ Ayarlar] [🔔] [👤]  │
└─────────────────────────────────────────────┘
```

- **İSG Atama Paneli** → Sol sidebar ile panel modülleri
- **İSG Aylık Veri Sistemi** → Sol sidebar ile operasyon modülleri
- **Sistem Ayarları** → Üst sağ köşe ⚙️ ikonu veya dropdown
- **Bildirimler** → Üst sağ 🔔 ikonu
- **Kullanıcı Profili** → Üst sağ 👤 ikonu + dropdown (Profil, Çıkış)

**Specialist/Physician/DSP için:** Sadece İSG Aylık Veri Sistemi görünür. Header basit tutulur.

### 4.2 Sol Sidebar — İSG Atama Paneli

```
GENEL
  • Dashboard
  • Tesis Yönetimi
  
PERSONEL
  • İSG Profesyonelleri
  • İşveren Vekilleri
  • OSGB Firmaları

ATAMA
  • Atama Yönetimi
  • Mutabakat

RAPORLAR
  • Uyumluluk Raporu
  • Ceza Riski Raporu
```

### 4.3 Sol Sidebar — İSG Aylık Veri Sistemi

```
GENEL
  • Dashboard

VERİ GİRİŞİ
  • Aylık Personel Verisi
  • Kaza İstatistikleri

KAYITLAR
  • Tespit & Öneri Defteri
  • Eğitim Takibi
  • İSG Kurul
  • Ölçüm & Kontrol
```

### 4.4 Sistem Ayarları (Ayrı Sayfa / Modal)

Tüm modülleri etkileyen merkezi ayarlar:

```
SİSTEM
  • Tesisler (Ekleme, düzenleme, bina, blok)
  • Kullanıcı Yönetimi [SADECE ADMİN]
  
HESAPLAMA PARAMETRELERİ
  • İSG Ceza Miktarları (Yıllık)
  • Çalışma Süresi / Gün Parametreleri
  • Ciddi Kaza Eşiği
  
TANIM YÖNETİMİ
  • Kategoriler & Alt Kategoriler (Tespit Defteri)
  • Departmanlar
  
İLETİŞİM
  • SMTP Mail Ayarları [SADECE ADMİN]
  • Bildirim Ayarları
  • Mail Şablonları [SADECE ADMİN]
```

---

## BÖLÜM 5: KULLANICI YÖNETİMİ — KARAR VE GEREKÇESİ

### 5.1 Karar: Sistem Ayarları İçinde

**Kullanıcı Yönetimi, Sistem Ayarları → Kullanıcı Yönetimi altında olacaktır.**

**Gerekçeler:**
1. Tüm modülleri etkileyen merkezi bir işlem — modüllerin içine konulması mantıksal tutarsızlık yaratır
2. Sadece Admin erişimi gerektirir → Ayarlar'daki diğer Admin-only bölümlerle tutarlı
3. UX açısından: Bir Merkez Yönetim kullanıcısı "kullanıcı ekleyeyim" dediğinde Panel içinde ya da Operasyon içinde aramamalı, Ayarlar'a bakmalı
4. Modüllerden bağımsız yaşam döngüsü var (kullanıcı oluşturma, tesis atama, rol değişikliği)

**Kullanıcı Yönetimi Özellikleri (Sistem Ayarları içinde):**
- Kullanıcı listesi (aktif / arşiv)
- Yeni kullanıcı ekleme (Windows kullanıcı adı, ad soyad, rol, istihdam tipi, OSGB adı)
- Tesis atamaları (multi-select)
- Admin yetkisi toggle
- Kullanıcı aktif/pasif yönetimi
- Rol filtreleme, kadro filtreleme, arama

---

## BÖLÜM 6: TEKNOLOJİ YIĞINI (KESINLEŞMIŞ KARARLAR)

### 6.1 Frontend

| Teknoloji | Versiyon | Karar |
|---|---|---|
| React | 18 | ✅ Onaylı |
| TypeScript | ~5.x | ✅ Onaylı |
| Vite | Latest | ✅ Onaylı |
| Shadcn/UI | Latest (radix-nova) | ✅ Onaylı |
| Tailwind CSS | v4 | ✅ Onaylı |
| Lucide React | Latest | ✅ Onaylı |
| Recharts | Latest | ✅ Onaylı |
| React Hook Form + Zod | Latest | ✅ Onaylı |
| React Router v6 | Latest | ✅ (URL tabanlı gerçek routing) |
| TanStack Query (React Query) | v5 | ✅ (API state, cache, loading/error) |
| Sonner | Latest | ✅ (Toast bildirimleri) |
| Geist Variable | Latest | ✅ (Font) |
| date-fns | v4 | ✅ (Tarih işlemleri) |

### 6.2 Backend

| Teknoloji | Versiyon | Karar |
|---|---|---|
| Node.js | 20+ LTS | ✅ Onaylı |
| Express.js | Latest | ✅ Onaylı |
| TypeScript | ~5.x | ✅ Onaylı |
| Prisma ORM | Latest | ✅ (PostgreSQL için type-safe, migration yönetimi) |
| NTLM Middleware | express-ntlm | ✅ Onaylı |
| JWT | jsonwebtoken | ✅ (NTLM → JWT dönüşümü) |
| Nodemailer | Latest | ✅ (SMTP mail) |
| Handlebars | Latest | ✅ (Mail şablonları) |
| node-cron | Latest | ✅ (Zamanlanmış görevler) |
| Multer | Latest | ✅ (Dosya yükleme) |
| Helmet | Latest | ✅ (Güvenlik) |
| CORS | Latest | ✅ |

### 6.3 Veritabanı ve Altyapı

| Teknoloji | Karar |
|---|---|
| **PostgreSQL** | ✅ Ana veritabanı (SQLite yerine) |
| **Docker Compose** | ✅ Olmazsa olmaz |
| **Nginx** | ✅ Reverse proxy + NTLM desteği |
| **Server-Sent Events (SSE)** | ✅ Gerçek zamanlı bildirimler (WebSocket yerine) |

---

## BÖLÜM 7: VERİTABANI ŞEMASI (PRİSMA)

### 7.1 Tüm Tablolar

```prisma
// KULLANICI VE YETKİLENDİRME
model User { ... }
model Role { ... }
model UserRole { ... }          // M:N
model UserFacility { ... }      // M:N — kullanıcı-tesis ataması

// TESİS
model Facility { ... }
model FacilityBuilding { ... }  // Bina/blok bilgileri

// İSG PROFESYONELLERİ (Panel)
model Professional { ... }      // İGU/Hekim/DSP kişi bilgileri
model OSGBCompany { ... }
model EmployerRepresentative { ... }
model Assignment { ... }        // Tesis-Profesyonel atama
model Reconciliation { ... }    // OSGB mutabakat
model PenaltySettings { ... }   // Yıllık ceza miktarları

// AYLIK VERİ (Operasyon)
model MonthlyHRData { ... }     // Aylık personel istatistikleri (JSON)
model MonthlyAccidentData { ... } // Aylık kaza istatistikleri (JSON)

// OPERASYON KAYITLARI
model Observation { ... }       // Tespit & Öneri Defteri
model Training { ... }          // Eğitim kayıtları
model BoardMeeting { ... }      // İSG Kurul kayıtları
model Inspection { ... }        // Ölçüm & Kontrol kayıtları

// SİSTEM
model Category { ... }          // Tespit defteri kategorileri
model SubCategory { ... }
model Department { ... }
model SystemSettings { ... }    // Yıllık hesaplama parametreleri

// İLETİŞİM
model SMTPSettings { ... }
model EmailTemplate { ... }
model EmailLog { ... }

// BİLDİRİMLER
model Notification { ... }

// LOG
model ActivityLog { ... }        // İşlem geçmişi (entityType, entityId, action, oldValue, newValue, createdBy, ipAddress, userAgent)

// RAPORLAMA (İleride genişletilebilir)
model ReportTemplate { ... }     // Rapor şablonları (name, type, content, isDefault)
```

### 7.2 Kritik Tablo Detayları

#### User
```prisma
model User {
  username        String    @id        // Windows kullanıcı adı: "metin.salik"
  fullName        String
  isActive        Boolean   @default(true)
  employmentType  String?              // "Tesis Kadrosu" | "OSGB Kadrosu"
  osgbName        String?
  roles           UserRole[]
  facilities      UserFacility[]
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

#### Professional (Panel'den)
```prisma
model Professional {
  id              Int       @id @default(autoincrement())
  fullName        String
  employmentType  String    // "Tesis Kadrosu" | "OSGB Kadrosu"
  osgbName        String?
  titleClass      String    // "A Sınıfı IGU" | "B Sınıfı IGU" | "C Sınıfı IGU" | "İşyeri Hekimi" | "DSP"
  certificateNo   String?
  certificateDate DateTime?
  phone           String?
  email           String?
  unitPrice       Float?    // OSGB personeli aylık maliyet (₺)
  isActive        Boolean   @default(true)
  assignments     Assignment[]
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

#### Assignment (Panel'den)
```prisma
model Assignment {
  id              Int          @id @default(autoincrement())
  facilityId      String       // FK → Facility
  professionalId  Int?         // FK → Professional (IGU/Hekim/DSP)
  employerRepId   Int?         // FK → EmployerRepresentative
  type            String       // "IGU" | "Hekim" | "DSP" | "İşveren Vekili"
  durationMinutes Int
  isFullTime      Boolean      @default(false)
  startDate       DateTime
  endDate         DateTime?
  status          String       // "Aktif" | "Sona Erdi"
  costType        String?      // "Sabit" | "Saatlik"
  unitPrice       Float?
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
}
```

#### MonthlyHRData (Operasyon'dan)
```prisma
model MonthlyHRData {
  id              Int       @id @default(autoincrement())
  facilityId      String    // FK → Facility
  month           String    // "2026-04" formatı
  mainEmployerData Json     // {total, hires, changes, female, male, disabled, pregnant, chronic, interns}
  subContractorData Json    // aynı yapı
  createdBy       String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@unique([facilityId, month])
}
```

---

## BÖLÜM 8: DOCKER COMPOSE YAPISI

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: isgdb
      POSTGRES_USER: isguser
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://isguser:${DB_PASSWORD}@postgres:5432/isgdb
      JWT_SECRET: ${JWT_SECRET}
      NTLM_ENABLED: ${NTLM_ENABLED}
      SMTP_HOST: ${SMTP_HOST}
      SMTP_PORT: ${SMTP_PORT}
      SMTP_USER: ${SMTP_USER}
      SMTP_PASS: ${SMTP_PASS}
    depends_on:
      - postgres
    ports:
      - "3005:3005"

  frontend:
    build: ./frontend
    ports:
      - "5173:80"
    depends_on:
      - backend

  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    ports:
      - "80:80"
    depends_on:
      - frontend
      - backend

  adminer:
    image: adminer
    ports:
      - "8080:8080"

volumes:
  postgres_data:
```

---

## BÖLÜM 9: URL VE ROUTİNG YAPISI

### 9.1 React Router v6 Yapısı

```
/                         → Giriş (/login) redirect
/login                    → Login sayfası

/panel                    → İSG Atama Paneli (admin/management)
/panel/dashboard          → Panel ana dashboard
/panel/facilities         → Tesis yönetimi
/panel/professionals      → Profesyonel yönetimi
/panel/employers          → İşveren vekilleri
/panel/osgb               → OSGB firmaları
/panel/assignments        → Atama yönetimi
/panel/reconciliation     → Mutabakat

/operations               → İSG Aylık Veri Sistemi (herkese)
/operations/dashboard     → Operasyon dashboard
/operations/hr-data       → Aylık personel verisi
/operations/accidents     → Kaza istatistikleri
/operations/notebooks     → Tespit & Öneri Defteri
/operations/training      → Eğitim takibi
/operations/board         → İSG Kurul
/operations/inspections   → Ölçüm & Kontrol

/settings                 → Sistem Ayarları
/settings/facilities      → Tesis yönetimi
/settings/users           → Kullanıcı yönetimi [ADMIN]
/settings/smtp            → SMTP ayarları [ADMIN]
/settings/notifications   → Bildirim ayarları
/settings/parameters      → Hesaplama parametreleri
/settings/definitions     → Kategoriler & Departmanlar
/settings/templates       → Mail şablonları [ADMIN]

/profile                  → Kullanıcı profili
```

### 9.2 Route Guard Mantığı

```typescript
// ProtectedRoute bileşeni:
// - Giriş yapmamış → /login
// - Panel'e specialist erişmeye çalışırsa → /operations
// - Settings'e specialist erişmeye çalışırsa → /operations
// - Admin-only sayfalara (users, smtp) management erişmeye çalışırsa → /settings
```

---

## BÖLÜM 10: BACKEND API YAPISI

### 10.1 Auth Routes

```
GET  /api/auth/me           → Giriş yapmış kullanıcı bilgileri (NTLM → JWT)
POST /api/auth/logout       → Token geçersizleştirme
```

### 10.2 Panel Routes (/api/panel) — Admin + Management

```
# Tesisler (Panel görünümü — atama odaklı)
GET  /api/panel/facilities
POST /api/panel/facilities
PUT  /api/panel/facilities/:id
GET  /api/panel/facilities/:id/compliance    → Uyumluluk analizi
GET  /api/panel/facilities/:id/logs

# Profesyoneller
GET  /api/panel/professionals
POST /api/panel/professionals
PUT  /api/panel/professionals/:id
POST /api/panel/professionals/:id/archive

# OSGB
GET  /api/panel/osgb
POST /api/panel/osgb
PUT  /api/panel/osgb/:id

# İşveren Vekilleri
GET  /api/panel/employers
POST /api/panel/employers
PUT  /api/panel/employers/:id
POST /api/panel/employers/:id/archive

# Atamalar
GET  /api/panel/assignments
POST /api/panel/assignments
PUT  /api/panel/assignments/:id
POST /api/panel/assignments/:id/terminate

# Mutabakat
GET  /api/panel/reconciliation
POST /api/panel/reconciliation

# Dashboard KPI'ları
GET  /api/panel/dashboard
```

### 10.3 Operations Routes (/api/operations) — Tüm Roller

```
# Monthly HR
GET  /api/operations/monthly-hr/:facilityId/:month
GET  /api/operations/monthly-hr-history/:facilityId
POST /api/operations/monthly-hr

# Accidents
GET  /api/operations/monthly-accident/:facilityId/:month
GET  /api/operations/monthly-accident-history/:facilityId
POST /api/operations/monthly-accident

# ⚠️ ÖNEMLİ: Sistemde hard delete yoktur. Tüm "silme" işlemleri PATCH /:id/archive
# ile soft-delete olarak yapılır. HTTP DELETE KULLANILMAZ.
# İstisna: Disk üzerindeki yükleme dosyaları (uploads/) fiziksel kaldırılabilir,
# ancak veritabanı kaydı (file_path null yapılarak) her zaman korunur.

# Observations (Tespit & Öneri Defteri)
GET   /api/operations/observations
POST  /api/operations/observations
PUT   /api/operations/observations/:id
PATCH /api/operations/observations/:id/archive      → Soft delete (isArchived: true)

# Training (Eğitim Takibi)
GET   /api/operations/training
POST  /api/operations/training
PUT   /api/operations/training/:id
PATCH /api/operations/training/:id/archive

# Board (İSG Kurul)
GET   /api/operations/board
POST  /api/operations/board
PUT   /api/operations/board/:id
PATCH /api/operations/board/:id/archive

# Inspections (Ölçüm & Kontrol)
GET   /api/operations/inspections
POST  /api/operations/inspections
PUT   /api/operations/inspections/:id
PATCH /api/operations/inspections/:id/archive

# NOT: Her modülün ayrı endpoint'i vardır — /:type generic yapısı kullanılmaz.
# Bu yaklaşım OpenAPI dokümantasyonu, validasyon şemaları ve ileride
# modül bazlı genişleme için daha sağlıklıdır.

# Dashboard
GET  /api/operations/dashboard
```

### 10.4 Settings Routes (/api/settings) — Admin / Management

```
# Tesisler (Tam yönetim)
GET  /api/settings/facilities
POST /api/settings/facilities           [ADMIN + MANAGEMENT]
PUT  /api/settings/facilities/:id       [ADMIN + MANAGEMENT]

# Kullanıcılar
GET  /api/settings/users                [ADMIN]
POST /api/settings/users                [ADMIN]
PUT  /api/settings/users/:username      [ADMIN]

# SMTP
GET  /api/settings/smtp                 [ADMIN]
PUT  /api/settings/smtp                 [ADMIN]

# Bildirimler
GET  /api/settings/notifications
PUT  /api/settings/notifications

# Hesaplama parametreleri
GET  /api/settings/parameters/:year
POST /api/settings/parameters

# Tanımlar (Kategoriler, Departmanlar)
GET  /api/settings/definitions/categories
POST /api/settings/definitions/categories
PATCH /api/settings/definitions/categories/:id
POST /api/settings/definitions/subcategories
PATCH /api/settings/definitions/subcategories/:id
GET  /api/settings/definitions/departments
POST /api/settings/definitions/departments
PATCH /api/settings/definitions/departments/:id

# Mail şablonları
GET  /api/settings/templates            [ADMIN]
POST /api/settings/templates            [ADMIN]
PUT  /api/settings/templates/:id        [ADMIN]
```

### 10.5 Notifications Routes

```
GET  /api/notifications                 → Kullanıcının bildirimleri
POST /api/notifications/:id/read        → Okundu işaretle
POST /api/notifications/read-all        → Tümünü okundu işaretle
GET  /api/notifications/stream          → SSE endpoint (gerçek zamanlı)
```

### 10.6 Mail Routes

```
POST /api/mail/send                     → Manuel mail gönder [ADMIN]
GET  /api/mail/logs                     → Mail log listesi [ADMIN]
```

### 10.7 Upload Routes

```
POST /api/upload/:type/:facilityId      → Dosya yükle (multer)
```

---

## BÖLÜM 11: YASAL HESAPLAMA MOTORU

### 11.1 Kural: Backend'e Taşınıyor

`isgRules.ts` dosyasındaki tüm iş kuralları backend'e taşınır. Frontend sadece API'dan gelen hesaplanmış sonuçları gösterir.

### 11.2 Korunan İş Kuralları

| Kural | Detay |
|---|---|
| **İGU dk/çalışan** | Çok Tehlikeli: 40, Tehlikeli: 20, Az Tehlikeli: 10 |
| **İGU Min. Sınıf** | Çok Tehlikeli birincil: A, Tehlikeli: B, Az Tehlikeli: C |
| **İGU TZ Limiti** | Çok Tehlikeli: 250, Tehlikeli: 500, Az Tehlikeli: 1000 çalışan |
| **Hekim dk/çalışan** | Çok Tehlikeli: 15, Tehlikeli: 10, Az Tehlikeli: 5 |
| **DSP Zorunluluğu** | Sadece Çok Tehlikeli, ≥50 çalışan |
| **DSP Muafiyet** | TZ Hekim varsa DSP zorunluluğu kalkar |
| **Kapasite Limiti** | Bir profesyonelin toplam yükü 11700 dk/ay'ı geçemez |
| **Sertifika Geçerliliği** | 5 yıl. 90 gün → uyarı, 60 gün → kritik |
| **Ceza Hesabı** | Aylık = Σ(eksik atama × ilgili tehlike sınıfı ceza miktarı) |
| **Kümülatif Ceza** | Aylık × ay sayısı (yıl başından itibaren) |

---

## BÖLÜM 12: AYLIK VERİ MODÜLÜ İŞ KURALLARI

### 12.1 Korunan HR İş Kuralları

- Toplam çalışan = Kadın + Erkek (validation)
- Asıl işveren + Alt işveren ayrı ayrı girilir
- Dönem formatı: "YYYY-MM" (2026-04)
- Aynı tesis + aynı dönem için UNIQUE kısıtı

### 12.2 Kaza İstatistikleri Kuralları

- `total_accidents = lost_day_accidents + no_lost_day_accidents` (zorunlu)
- 3 grup: Asıl İşveren, Stajyerler, Alt İşveren
- Ciddi kaza eşiği SystemSettings'ten alınır (varsayılan: 4 gün)

### 12.3 Performans KPI Formülleri

| KPI | Formül |
|---|---|
| Kaza Sıklık Oranı | (totalAccidents / totalHours) × 1.000.000 |
| Kaza Ağırlık Oranı | (totalLostDays / totalHours) × 100.000 |
| Ciddi Kaza Oranı | (totalSerious × 100.000) / lastEmployeeCount |
| Kayıp Gün Oranı | (totalLostDays × 200.000) / totalHours |
| Devamsızlık Oranı | (totalLostDays / totalPlannedDays) × 100 |
| Meslek Hastalığı Oranı | totalDiseases / (totalHours × 200.000) |
| Kaza Sıklık Hızı | totalAccidents / lastEmployeeCount |

---

## BÖLÜM 13: BİLDİRİM SİSTEMİ

### 13.1 Bildirim Türleri

| Tür | Tetikleyici | Alıcı |
|---|---|---|
| `cert_expiry_warning` | Sertifika bitimine 90 gün kaldı | Admin, Management |
| `cert_expiry_critical` | Sertifika bitimine 60 gün kaldı | Admin, Management |
| `cert_expired` | Sertifika süresi doldu | Admin, Management |
| `assignment_new` | Yeni atama yapıldı | İlgili profesyonel |
| `assignment_terminated` | Atama sonlandırıldı | İlgili profesyonel |
| `data_entry_reminder` | Ay sonu 3 gün kala (veri girilmemişse) | Tesis uzmanı |
| `compliance_warning` | Tesis uyumsuz hale geldi | Admin, Management |
| `reconciliation_pending` | Ay sonu yaklaşıyor, mutabakat yapılmadı | Admin, Management |

### 13.2 SSE Yapısı

```
GET /api/notifications/stream (EventSource bağlantısı)
Backend: Her 30 saniyede → okunmamış bildirim sayısı push
Frontend: Header'daki 🔔 ikonu güncellenir
```

### 13.3 SSE Geliştirme Stratejisi

| Faz | Yaklaşım | Açıklama |
|---|---|---|
| **Faz 1 (Mevcut)** | Interval-based | Her 30 saniyede okunmamış bildirim sayısı push edilir |
| **İleride** | Event-based | Gerçek zamanlı olay tetikleyicilerine geçilebilir |

**İlk Fazda Interval-Based Yeterlidir:**
- Kurulum basitliği ve stabilite önceliklidir
- 30 saniyelik gecikme bu sistemin kullanım senaryoları için kabul edilebilir

**İleride Event-Based Geçiş İçin Örnek Tetikleyiciler:**
- Yeni atama oluşturuldu / sonlandırıldı
- Tesis uyumsuz hale geldi
- Sertifika süresi kritik seviyeye düştü
- Ay sonu yaklaşıyor, veri henüz girilmedi

> **Not:** Event-driven mimariye geçilirse backend'e Redis Pub/Sub eklenebilir. Bu karar sistem büyüdükçe değerlendirilmeli — ilk fazda gereksiz karmaşıklık yaratmaz. Ayrıca HTTP/1.1'de tarayıcı başına domain bazlı 6 SSE bağlantı limiti vardır; HTTP/2 ile bu kısıt kalkar.

---

## BÖLÜM 14: MAIL SİSTEMİ

### 14.1 Mail Mimarisi

- **SMTP Ayarları:** Admin panelinden girilir, veritabanında şifreli saklanır
- **Şablonlar:** Handlebars ile dinamik. Admin oluşturur/düzenler
- **Zamanlama:** node-cron ile günlük/haftalık kontroller
- **Loglama:** Her gönderim EmailLog tablosuna kaydedilir

### 14.2 Otomatik Mail Tetikleyiciler

| Olay | Zamanlama |
|---|---|
| Sertifika süresi dolmak üzere | Her gün kontrol |
| Aylık veri girişi hatırlatması | Her ayın 28'i |
| Uyumsuzluk uyarısı | Anlık (atama/arşivleme sonrası) |
| Yeni atama bildirimi | Anlık |

---

## BÖLÜM 15: UI/UX TASARIM PRENSİPLERİ

### 15.1 Genel Stil

- **Component Kütüphanesi:** Shadcn/UI (radix-nova stili, neutral base)
- **Font:** Geist Variable (sans-serif)
- **Tema:** Dark/Light/System desteği (localStorage ile persist)
- **İkonlar:** Lucide React
- **Grafikler:** Recharts (PieChart, AreaChart, BarChart)

### 15.2 Renk Kodlaması (Korunacak)

| Durum | Renk |
|---|---|
| Çok Tehlikeli | rose-500 / red |
| Tehlikeli | amber-500 / yellow |
| Az Tehlikeli | emerald-500 / green |
| Admin | rose badge |
| OSGB Kadrosu | blue |
| Tesis Kadrosu | emerald |
| Uyumlu | green |
| Eksik | red |
| Uyarı | amber |

### 15.3 Tasarım Dili

- **Glassmorphism:** `bg-white/50 backdrop-blur-xl`
- **Rounded:** `rounded-2xl`, `rounded-3xl`
- **Shadow:** `shadow-xl`, `shadow-2xl`
- **Animasyonlar:** `animate-in fade-in`, `slide-in-from-bottom-2`
- **Hover:** `hover:scale-[1.01]`, `hover:shadow-lg`
- Premium hissiyat: Abartılmamış ama göze çarpan

---

## BÖLÜM 16: GELİŞTİRME ÖNCELİKLEME SIRASI

### Faz 1 — Çekirdek Altyapı
1. Docker Compose kurulumu (PostgreSQL + Adminer + Backend + Frontend + Nginx)
2. Prisma şema oluşturma ve migration
3. NTLM → JWT Authentication middleware
4. Route guard sistemi (ProtectedRoute bileşenleri)
5. Temel Login sayfası
6. ApiContext + React Query kurulumu
7. Sidebar bileşenleri (Panel / Operasyon / Ayarlar)

### Faz 2 — Sistem Ayarları
8. Tesis Yönetimi (CRUD + bina/blok)
9. Kullanıcı Yönetimi (Admin only)
10. Hesaplama parametreleri
11. Kategori & Departman tanımları
12. SMTP + Mail şablonları

### Faz 3 — Panel Modülleri
13. Panel Dashboard (KPI + grafikler + uyumluluk tablosu)
14. Profesyoneller modülü
15. OSGB Firmaları modülü
16. İşveren Vekilleri modülü
17. Atama Yönetimi (yasal hesaplama motoru dahil)
18. Mutabakat modülü

### Faz 4 — Operasyon Modülleri
19. Operasyon Dashboard
20. Aylık Personel Verisi (MonthlyHRData)
21. Kaza İstatistikleri (MonthlyAccidentData + KPI)
22. Tespit & Öneri Defteri (dosya yükleme dahil)
23. Eğitim Takibi
24. İSG Kurul
25. Ölçüm & Kontrol

### Faz 5 — Akıllı Servisler
26. Bildirim sistemi (SSE + veritabanı)
27. Mail sistemi (Nodemailer + Handlebars + cron)
28. Activity log görüntüleme
29. PDF export (mutabakat)

---

## BÖLÜM 17: SEED VERİLERİ

### 17.1 Roller (seed)
```
admin       → Admin
management  → Merkez Yönetim
specialist  → İş Güvenliği Uzmanı
physician   → İşyeri Hekimi
dsp         → Diğer Sağlık Personeli
```

### 17.2 Bootstrap Başlangıç Kullanıcısı (Kurulum Admin)
```
username: metin.salik
fullName: Metin Salık
roles: admin, management, specialist, physician
```

> ⚠️ **Önemli:** `metin.salik` bir **bootstrap başlangıç kullanıcısıdır** — kalıcı bir üretim hesabı değildir.
>
> **Prod ortamında kurulum sonrası adımlar:**
> 1. Kurum yöneticisi kendi Windows kimliğiyle sisteme giriş yapar
> 2. Admin panelinden kendi hesabına admin yetkisi verilir
> 3. Seed kullanıcısı `isActive: false` yapılarak devre dışı bırakılır
> 4. Admin yönetimi tamamen kuruma devredilmiş olur
>
> Seed verisi yalnızca `NODE_ENV=development` ortamında veya ilk `prisma migrate deploy` sırasında çalıştırılır.

### 17.3 Sistem Ayarları (2026)
```
Ciddi kaza eşiği: 4 gün
Cumartesi dahil: true
Günlük saat: 7.5
Aylık iş günleri: Ocak-Kasım 22, Şubat 20
```

### 17.4 Tespit Defteri Kategorileri (seed)
```
1. Acil Durum Yönetimi
2. Altyapı Sistemleri (Alt: Mekanik, Havalandırma, Elektrik)
3. Cihaz-Ekipman-Malzeme Yönetimi
4. Emniyet
5. Güvenlik
6. İnşaat-Renovasyon
7. Tehlikeli Madde ve Atık Yönetimi
8. Tıbbi Cihazlar
9. Yangın Güvenliği
```

### 17.5 Departmanlar (seed)
```
1. Teknik Hizmetler Müdürlüğü
2. İdari İşler ve Otelcilik Hizmetleri Müdürlüğü
3. Bilgi Sistemleri Müdürlüğü
4. Hasta Bakım Hizmetleri Müdürlüğü
```

---

## BÖLÜM 18: ÇEVRE DEĞİŞKENLERİ (.env)

```env
# Veritabanı
DATABASE_URL=postgresql://isguser:password@postgres:5432/isgdb

# Auth
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=8h
NTLM_ENABLED=true
DEV_USER=metin.salik          # ⚠️ SADECE NODE_ENV=development! Staging ve prod'da BOŞ bırakılmalı!
                               # Middleware: if (NODE_ENV==='development' && DEV_USER) — iki koşul zorunlu

# Audit & Log
AUDIT_LOG_RETENTION_YEARS=2   # Varsayılan 2 yıl. Kurum/yasal ihtiyaca göre artırılabilir.

# Mail
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=mailuser@example.com
SMTP_PASS=mailpassword
MAIL_FROM=isg@example.com

# Uygulama
NODE_ENV=development
PORT=3005
FRONTEND_URL=http://localhost:5173
```

---

## BÖLÜM 19: DOSYA YÜKLEME

### 19.1 Yükleme Yapısı

```
uploads/
  notebooks/
    {facilityId}/
      dosya.pdf
      ...
  documents/
    {facilityId}/
      ...
```

### 19.2 Dosya İsimlendirme Kuralı

Yüklenen dosyalar **orijinal adıyla kaydedilmez**. Sistem tarafından üretilen benzersiz UUID ile yeniden isimlendirilir:

```
uploads/notebooks/{facilityId}/a8f3c2e1-4b7d-uuid.pdf
```

**Veritabanında saklanan alanlar (ilgili modellerde):**
- `originalFileName` — Kullanıcıya gösterim için orijinal ad
- `storedFileName` — Diskteki gerçek UUID dosya adı
- `filePath` — Tam kayıt yolu

### 19.3 Dosya Güvenlik Kuralları

- **MIME type doğrulaması:** Hem dosya uzantısından hem de içerikten (magic bytes) doğrulanır — `file-type` kütüphanesi kullanılır (uzantı sahteciliğine karşı koruma)
- **Kabul edilen tipler:** PDF, PNG, JPG, JPEG (yalnızca beyaz liste)
- **Yasaklı uzantılar:** `.exe`, `.sh`, `.bat`, `.cmd`, `.js`, `.php` ve tüm executable'lar kesinlikle reddedilir
- **Max boyut:** 10MB (multer limit konfigürasyonu)
- **Path traversal engeli:** `../` ve benzeri manipülasyonlar multer ve Nginx tarafından engellenir
- **Static serving:** Nginx üzerinden `/uploads/*` → `server/uploads/` (backend'e doğrudan erişim kapalı)
- **Disk-DB tutarlılığı:** Fiziksel dosya silinirse `filePath` null yapılır, DB kaydı korunur

---

## BÖLÜM 20: GÜVENLİK PRENSİPLERİ

- Her API isteği JWT ile doğrulanır
- Tesis bazlı izin kontrolü: Kullanıcı sadece atandığı tesislere erişir
- Admin-only rotalar ayrı middleware ile korunur
- Helmet.js ile HTTP güvenlik başlıkları
- CORS: Sadece izin verilen origin
- SQL injection: Prisma ORM ile önlenir
- XSS: React'ın doğal escape mekanizması + DOMPurify (gerekirse)

---

## BÖLÜM 21: ORTAM STRATEJİSİ

### 21.1 Temel Yaklaşım

Bu proje için başlangıçta iki ana ortam yeterlidir. Gereksiz ortam çoğaltılmaz, sistem yönetimi sade tutulur.

| Ortam | Amaç | Açıklama |
|---|---|---|
| **Test / Staging** | Geliştirme sonrası doğrulama | Canlıya çok benzeyen, gerçek kullanıcı verisi içermeyen ortam |
| **Prod** | Gerçek kullanım | Nihai onay almış sürümün çalıştığı canlı ortam |

### 21.2 Git Branch Stratejisi

| Branch | Ortam | Açıklama |
|---|---|---|
| `main` | Prod | Onaylanmış, canlıya alınmış kod |
| `staging` | Test/Staging | Test ortamına deploy edilen dal |
| `feature/*` | Local | Geliştirme dalları |

**Kural:** `feature/*` → `staging` → test geçerse → `main` → Prod

### 21.3 Ortamlar Arasında Ayrılacak Değerler

Her ortam kendi bağımsız konfigürasyonuna sahip olacaktır:
- Ayrı veritabanı + `DATABASE_URL`
- Ayrı `JWT_SECRET`
- Ayrı SMTP ayarları
- Ayrı frontend URL
- Ayrı log kayıtları
- Ayrı dosya yükleme alanı

### 21.4 Yayın Prensibi

- Kod tabanı aynı kalır; konfigürasyon ortam bazında değişir
- Test ortamında doğrulanan sürüm prod'a alınır
- Canlı ortamda doğrudan deneysel değişiklik yapılmaz

---

## BÖLÜM 22: AUDİT TRAIL VE İŞLEM GEÇMİŞİ

### 22.1 Temel Kural

Sistemde yapılan kritik işlemler backend tarafında kayıt altına alınır. **Sadece write/mutasyon işlemleri loglanır** — read-only operasyonlar loglanmaz (veritabanı şişmesini önlemek için).

### 22.2 Loglanacak İşlemler

- Kayıt oluşturma / güncelleme / pasife alma / arşivleme
- Veri silme girişimi
- Atama oluşturma / sonlandırma
- Yetki değişikliği
- Parametre değişikliği
- Dosya yükleme / kaldırma
- Rapor oluşturma
- Mail gönderimi
- Bildirim tetikleme

### 22.3 ActivityLog Alan Yapısı

```prisma
model ActivityLog {
  id          Int      @id @default(autoincrement())
  entityType  String   // "Facility" | "User" | "Assignment" | "Professional" | ...
  entityId    String   // İlgili kaydın ID'si
  action      String   // "CREATE" | "UPDATE" | "ARCHIVE" | "TERMINATE" | "DELETE_ATTEMPT"
  oldValue    Json?    // Değişiklik öncesi değer
  newValue    Json?    // Değişiklik sonrası değer
  createdBy   String   // username
  createdAt   DateTime @default(now())
  ipAddress   String?  // Güvenlik denetimi için
  userAgent   String?  // Tarayıcı/istemci bilgisi
  note        String?  // Varsa açıklama notu
}
```

### 22.4 Retention Politikası

- Audit logları varsayılan olarak **2 yıl** saklanır (`AUDIT_LOG_RETENTION_YEARS` env ile konfigüre edilebilir)
- Kurum ihtiyacına, KVKK gerekliliklerine ve sektör düzenlemelerine göre artırılabilir
- Süreyi aşan loglar arşiv tablosuna taşınır veya politikaya göre temizlenir
- Kişisel veri içeren alanlar (`ipAddress`, `userAgent`, kullanıcı adı) maskelenebilir yapıda tutulur; talep halinde anonim hale getirilebilir

| Senaryo | Önerilen Süre |
|---|---|
| Genel İSG operasyonları | 2 yıl (varsayılan) |
| Sağlık sektörü / denetim gerektiren kurumlar | 5-10 yıl |
| KVKK kapsamında kişisel veri içeren loglar | Maskelenerek saklanır |

### 22.5 Arayüzde Gösterim

- İşlem geçmişi ekranı (tarih aralığı, kullanıcı, modül, kayıt bazlı filtreleme)
- Kayıt detay ekranında değişim geçmişi görünümü
- Kritik kayıtlar için yalnızca "son hal" değil, tam değişim zinciri saklanır

---

## BÖLÜM 23: ONAY AKIŞLARI

### 23.1 Temel Karar

**İlk fazda zorunlu onay akışı kurulmaz.** Ancak sistem ileride onay mekanizması eklenebilecek şekilde tasarlanır.

### 23.2 İleride Onay Gerektirebilecek İşlemler

- Kritik atama değişiklikleri
- Mutabakat onayı
- Ceza parametresi değişiklikleri
- Önemli kayıt düzeltmeleri

### 23.3 Hazır Tutulacak Alanlar (Opsiyonel)

```prisma
// İleride ihtiyaç olursa ilgili modellere eklenebilir:
approvalStatus   String?   // "pending" | "approved" | "rejected"
approvedBy       String?
approvedAt       DateTime?
approvalNote     String?
```

---

## BÖLÜM 24: VERİ DOĞRULAMA VE HATA YÖNETİMİ

### 24.1 Temel Kural

**"Client validation = UX, Server validation = Gerçek güvenlik"**

Frontend validasyonu atlanabilir; backend her zaman bağımsız olarak re-validate eder. Zod şemaları hem frontend formlarında hem de backend route'larında paylaşılır.

### 24.2 Kesin Validasyonlar (Değiştirilemez)

- Zorunlu alanların boş geçilmemesi
- Tarih formatlarının doğru girilmesi (`YYYY-MM-DD`, `YYYY-MM`)
- Sayı alanlarının sayısal olması
- Aynı tesis / aynı dönem için mükerrer kayıt engeli (DB UNIQUE kısıtı)
- `total_accidents = lost_day_accidents + no_lost_day_accidents`
- `total_employees = female + male` (HR validasyonu)
- Pasif / kapalı kayıtlar üzerinde kontrollü işlem

### 24.3 Esnek Validasyonlar (Genişletilebilir)

- Operasyonel alan bazlı özel kontroller
- Ekran bazlı yardım mesajları
- Kurum özelinde ek alan zorunlulukları

### 24.4 Hata Yönetimi Prensibi

- Kullanıcıya anlaşılır Türkçe hata mesajı gösterilir
- Teknik hata detayları backend loglarında tutulur (kullanıcıya gösterilmez)
- Kritik veri kaybı oluşturacak işlemler engellenir ve onay istenir
- HTTP hata kodları tutarlı kullanılır (400, 401, 403, 404, 409, 500)

---

## BÖLÜM 25: RAPORLAMA VE DIŞA AKTARIM

### 25.1 Temel Prensipler

- Türkçe karakter desteği tam olacak
- Rapor şablonları yönetilebilir ve güncellenebilir olacak
- PDF ve Excel çıktıları desteklenecek
- Kuruma özel logo ve format uygulanabilecek

### 25.2 PDF Kütüphanesi Kararı

**Seçim: `@react-pdf/renderer`**

| Seçenek | Avantaj | Dezavantaj | Karar |
|---|---|---|---|
| Puppeteer | Görsel mükemmel | Docker'da Chromium ağır (~150MB) | ❌ |
| @react-pdf/renderer | React bileşeni, Docker'a ek yük yok | Karmaşık layout sınırları var | ✅ |
| jsPDF | Frontend'de kolay | Sunucu tarafı değil | ❌ |

### 25.3 Rapor Şablonu Yetenekleri

- Başlık düzeni değiştirilebilir
- Alanlar açılıp kapatılabilir
- Logo ve kurum bilgisi eklenebilir
- Tarih formatı özelleştirilebilir
- Farklı tesisler için farklı görünüm uygulanabilir

### 25.4 Kullanım Alanları

- Yönetim sunumu
- Denetim raporu
- Tesis bazlı özet
- Profesyonel bazlı özet
- Dönemsel uyumluluk raporu
- Mutabakat ekstresi (PDF)
- Arşiv amaçlı çıktı (Excel)

---

## BÖLÜM 26: KURUMSAL YAPI VE ARŞİVLEME POLİTİKASI

### 26.1 Kurumsal Yapı

Bu sistem **tek çatı / çok tesis** mimarisinde çalışır:

- Ana kurum tek yapıdadır
- Kurumun altında çok sayıda tesis bulunur
- Bazı tesislerde kurum içi İSG profesyonelleri görev yapar
- Bazı tesisler OSGB hizmeti ile yönetilir

> **Not:** Bu yapı klasik multi-tenant (SaaS) mimariden farklıdır. Farklı kurumlar için değil, tek kurumun birden fazla tesisi için tasarlanmıştır.

### 26.2 Arşivleme Prensibi

**Sistemde kritik veriler için hard delete uygulanmaz.**

Bunun yerine:
- `isActive: false` → pasife alma
- `isArchived: true` → arşivleme
- `archivedAt`, `archivedBy` → arşiv tarihçesi

### 26.3 Arşivde Korunacak Kayıtlar

Atama geçmişi, kullanıcı değişiklikleri, aylık veriler, kaza kayıtları, tespit ve öneriler, eğitim kayıtları, kurul kayıtları, ölçüm ve kontrol kayıtları, rapor çıktıları, mail logları, işlem geçmişi.

### 26.4 Ortak Arşiv Alanları (Prisma Modelleri)

```prisma
// Arşivlenebilir tüm modellerde şu alanlar desteklenir:
isActive    Boolean   @default(true)
isArchived  Boolean   @default(false)
archivedAt  DateTime?
archivedBy  String?   // username
```

---

## BÖLÜM 27: TEST STRATEJİSİ

### 27.1 Kullanılacak Araçlar

| Katman | Araç | Kapsam |
|---|---|---|
| Unit Test | `vitest` | Hesaplama fonksiyonları, KPI formülleri, iş kuralları |
| Integration | `supertest` | API route'ları, DB işlemleri, yetkilendirme |
| E2E (Opsiyonel) | `playwright` | Kritik kullanıcı akışları (ilk fazda değil) |
| Smoke Test | Manuel | Yeni deploy sonrası temel akışlar |

### 27.2 Test Katmanları

**Unit Test Örnekleri:**
- Ceza hesabı (`calculatePenalty`)
- Kapasite kontrolü (11700 dk limiti)
- Sertifika geçerliliği hesabı
- KPI formülleri (Kaza Sıklık Oranı vb.)

**Integration Test Örnekleri:**
- Kayıt oluşturma → DB'de doğrulama
- Rol kontrolü (specialist panel'e erişemesin)
- Atama → uyumluluk hesabı
- HR veri girişi → duplicate engeli

**Smoke Test Örnekleri (Deploy Sonrası):**
- Giriş yapma
- Dashboard açılması
- Veri kaydı
- Rapor görüntüleme

### 27.3 Yayın Kuralı

**Test ortamında doğrulanmayan sürüm prod ortamına alınmaz.**

---

## BÖLÜM 28: PRİSMA ŞEMA EKLERİ VE GENİŞLETME ALANLARI

### 28.1 ActivityLog — Tam Alan Yapısı

Bölüm 22.3'te tanımlandı. Tüm modellerde `entityType` değeri model adıyla eşleştirilir.

### 28.2 Arşiv Alanları (Tüm Arşivlenebilir Modeller)

```
isActive    → aktif/pasif durumu
isArchived  → arşivlenmiş mi
archivedAt  → arşivleme zamanı
archivedBy  → arşivleyen kullanıcı
```

### 28.3 Onay Alanları (İleride)

```
approvalStatus → "pending" | "approved" | "rejected"
approvedBy     → username
approvedAt     → onay zamanı
approvalNote   → açıklama
```

### 28.4 ReportTemplate Modeli

```prisma
model ReportTemplate {
  id                Int       @id @default(autoincrement())
  name              String    // Şablon adı
  type              String    // "pdf" | "excel" | "both"
  content           Json      // Şablon yapısı (alanlar, başlık, logo, tarih formatı vb.)
  version           Int       @default(1)     // Her yayınlamada artar
  isDraft           Boolean   @default(true)  // true=taslak/test, false=yayında/prod
  publishedBy       String?   // Yayınlayan kullanıcı (username)
  lastPublishedAt   DateTime? // Son yayın zamanı
  previousVersionId Int?      // Önceki versiyona referans (rollback için)
  isDefault         Boolean   @default(false)
  isActive          Boolean   @default(true)
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
}
```

**Versiyonlama Kuralları:**
- `isDraft: true` olan şablonlar yalnızca test/staging ortamında kullanılır
- `isDraft: false` (Yayında) olan şablonlar prod raporlarında geçerlidir
- Şablon güncellendiğinde `version` 1 artar, eski içerik `previousVersionId` ile izlenebilir
- Test şablonu → Onay → `publishedBy` + `lastPublishedAt` doldurulur → `isDraft: false`

---

## BÖLÜM 29: GELİŞTİRME İLKELERİ EKİ

### 29.1 Olgunlaştırma Prensibi

- Çekirdek mimari en başta netleştirilir ve değiştirilmez
- Erken aşamada gereksiz kısıtlar ve aşırı mühendislik yapılmaz
- İş kuralları ve validasyonlar ihtiyaç oluştukça olgunlaştırılır
- Ortamlar sade tutulur, ihtiyaçla genişletilir

### 29.2 Karar Döngüsü

```
1. Test ortamında geliştir
2. Olgunlaştır (validasyon, edge case, hata yönetimi)
3. Test doğrulaması yap
4. Prod'a al
5. Gözlemle → gerekirse revize et → 1'e dön
```

### 29.3 Teknik Borç Yönetimi

- `TODO:` ve `FIXME:` yorumları düzenli temizlenir
- TypeScript `any` kullanımı minimum tutulur
- Prisma migration'ları temiz tutulur, gereksiz migration birleştirilmez

---

## BÖLÜM 30: BİLİNEN KISITLAR VE NOTLAR

| Konu | Not |
|---|---|
| NTLM Logout | Gerçek NTLM logout mümkün değil. Frontend state sıfırlanır, JWT geçersizleştirilir |
| React Router | Mevcut `activeModule` state sistemi tamamen URL tabanlı gerçek routing'le değiştirilir |
| Türkçe Slug | Facility ID oluşturulurken Türkçe karakterler normalize edilmeli (ş→s, ı→i vb.) |
| Pagination | Büyük veri setlerinde gerekli — React Query ile lazy loading planlanmalı |
| TypeScript strict | `any` kullanımından kaçınılacak, tüm tipler Prisma'dan üretilecek |
| Test | vitest (unit), supertest (integration), playwright (e2e — opsiyonel) |
| Ortamlar | Test/Staging ve Prod olmak üzere iki ortam yönetilir; aynı kodbase, farklı konfigürasyon |
| Hard Delete | Kritik veriler silinmez; isActive/isArchived ile pasife alınır veya arşivlenir |
| Raporlama | Raporlar sabit değil şablon tabanlıdır; `@react-pdf/renderer` ile üretilir |

---

## BÖLÜM 31: GÜNLÜK ÇALIŞMA KURALLARI (AGENT İÇİN)

1. **Bu dosya her oturumun başında okunur.** Değişiklik yapmadan önce mevcut kararlar kontrol edilir.
2. **Yeni bir karar alındığında** bu dosyaya eklenir. Kararlar geçmişe dönük silinmez, güncellenir.
3. **Teknoloji değişikliği** gerekirse bu dosyaya "Karar Değişikliği" bölümü altında gerekçesiyle yazılır.
4. **Modül geliştirilirken** ilgili bölümdeki kurallar ve iş mantığı birebir uygulanır.
5. **Veritabanı şeması değişirse** bu dosyadaki Bölüm 7 güncellenir.
6. **API endpoint eklenmesi/değişmesi** Bölüm 10'da belgelenmelidir.
7. **Ortam kararları** Bölüm 21'de yönetilir. Prod'a doğrudan değişiklik yapılmaz.
8. **Tüm write işlemleri** ActivityLog'a kaydedilir. Read işlemleri loglanmaz.
9. **Hard delete yasaktır.** Silme yerine arşivleme yapılır (Bölüm 26).
10. **PDF çıktıları** `@react-pdf/renderer` ile üretilir. Puppeteer kullanılmaz.

---

---

## BÖLÜM 32: PROD'A GEÇİŞ KONTROL LİSTESİ

Test/Staging ortamından Prod'a geçmeden önce aşağıdaki kontroller tamamlanmış olmalıdır:

### 32.1 Altyapı ve Konfigürasyon
- [ ] `.env` dosyasında `DEV_USER` yok veya boş (production'da aktif olamaz)
- [ ] `NODE_ENV=production` olarak ayarlı
- [ ] `JWT_SECRET` güçlü, benzersiz ve prod'a özel
- [ ] `DATABASE_URL` prod PostgreSQL veritabanına işaret ediyor
- [ ] SMTP ayarları prod mail sunucusuna yapılandırılmış
- [ ] `AUDIT_LOG_RETENTION_YEARS` kuruma göre ayarlı

### 32.2 Veritabanı
- [ ] `prisma migrate deploy` başarılı (hata yok)
- [ ] Seed verisi uygulandı (roller, kategoriler, departmanlar, sistem ayarları)
- [ ] Bootstrap admin kullanıcısı (`metin.salik`) oluşturuldu
- [ ] Migration öncesi DB yedeği alındı

### 32.3 Uygulama Testleri
- [ ] Login akışı çalışıyor (NTLM → JWT token)
- [ ] Rol bazlı erişim doğru (specialist `/panel`'e erişemiyor → 403)
- [ ] Tesis bazlı erişim doğru (kullanıcı sadece kendi tesisini görüyor)
- [ ] Veri kaydı çalışıyor (HR verisi, kaza verisi kayıt ve güncelleme)
- [ ] Soft-delete çalışıyor (arşivleme → kayıt DB'de kalıyor, `isArchived: true`)
- [ ] Rapor/PDF export çalışıyor (`@react-pdf/renderer`)
- [ ] Mail gönderimi başarılı (test maili gönder ve doğrula)
- [ ] Dosya yükleme akışı sorunsuz (notebook PDF upload)
- [ ] SSE bildirim bağlantısı çalışıyor

### 32.4 Güvenlik
- [ ] Tüm API endpoint'leri JWT doğrulaması yapıyor
- [ ] 403 yanıtları yetkisiz tesis erişimlerinde doğru dönüyor
- [ ] `X-Powered-By` başlığı helmet ile kapatılmış
- [ ] CORS sadece izin verilen origin'lere açık

### 32.5 Devir Adımları
- [ ] Kurum yöneticisi kendi hesabına admin yetkisi aldı
- [ ] Bootstrap kullanıcısı (`metin.salik`) `isActive: false` yapıldı
- [ ] Monitoring ve log izleme aktif
- [ ] Veritabanı otomatik yedekleme planı aktif

---

## BÖLÜM 33: VERİTABANI MİGRATİON STRATEJİSİ

### 33.1 Temel Kural: Backward Compatible Migration

Production ortamında veri kaybını ve servis kesintisini önlemek için tüm şema değişiklikleri **geriye uyumlu (backward compatible)** tasarlanır.

### 33.2 Production Migration Sırası (Expand-Contract Pattern)

Mevcut alanın doğrudan silinmesi veya tipinin değiştirilmesi **yasaktır**. Bunun yerine:

```
ADIM 1: Yeni alan ekle (nullable veya @default ile)
        → Mevcut kod çalışmaya devam eder, yeni alan boş olur

ADIM 2: Eski veriyi yeni alana migrate et
        → Prisma migration içinde veya ayrı bir seed script ile

ADIM 3: Kodu yeni alanı kullanacak şekilde güncelle
        → Code deploy + test + staging doğrulaması

ADIM 4: Eski alanı kaldır (ayrı migration ile, güvenli dönem sonrası)
        → Yalnızca tüm veriler yeni alana geçtikten sonra
```

### 33.3 Zorunlu Kurallar

| Kural | Detay |
|---|---|
| Yedek alma | `prisma migrate deploy` öncesi DB yedeği **zorunludur** |
| Alan silme | Production'da mevcut alan **doğrudan silinemez** |
| Tip değişikliği | Production'da alan tipi **doğrudan değiştirilemez** |
| `prisma migrate dev` | Yalnızca **development** ortamında kullanılır |
| `prisma migrate deploy` | Yalnızca **staging ve production**'da kullanılır |
| Migration geçmişi | `prisma/migrations/` altında korunur, gereksiz birleştirme yapılmaz |

### 33.4 Migration İsimlendirme Örneği

```
20260501_add_report_version_to_templates
20260515_migrate_facility_address_fields
20260601_drop_old_address_column          ← Ayrı migration, güvenli dönem sonrası
```

---

## BÖLÜM 34: CONCURRENCY (EŞ ZAMANLI İŞLEM) KONTROLÜ

### 34.1 Problem: Sessiz Veri Overwrite Riski

Çok kullanıcılı sistemlerde aynı kayıt eş zamanlı düzenilenebilir. Kullanıcı A ile Kullanıcı B aynı kaydı açar; B kaydeder → A da kaydeder → B'nin değişikliği **sessizce kaybolur**.

### 34.2 Çözüm: Optimistic Locking (updatedAt Kontrolü)

Tüm kritik kaynak güncelleme endpoint'lerinde `updatedAt` kontrolü uygulanır:

```typescript
// Backend — her PUT/PATCH endpoint'inde:
const dbRecord = await prisma.model.findUnique({ where: { id } });

if (dbRecord.updatedAt.toISOString() !== incoming.updatedAt) {
  return res.status(409).json({
    error: 'Kayıt başka bir kullanıcı tarafından güncellenmiş. Lütfen sayfayı yenileyin.'
  });
}
// Kontrol geçtiyse güncelleme yapılır...
```

```typescript
// Frontend — güncelleme isteğinde fetch anındaki updatedAt gönderilir:
await apiCall(`/api/panel/assignments/${id}`, 'PUT', {
  ...formData,
  updatedAt: originalRecord.updatedAt  // fetch sırasında alınan değer (şu anki zaman değil!)
});
```

### 34.3 Kurallar

| Kural | Detay |
|---|---|
| HTTP kodu | `409 Conflict` döner |
| Frontend davranışı | Kullanıcıya uyarı gösterilir, sayfayı yenilemesi istenir |
| `updatedAt` kaynağı | Frontend'in fetch sırasında aldığı orijinal değer — güncel zaman değil |
| Kapsam | Tüm kritik `PUT` ve `PATCH` endpoint'leri |

### 34.4 Öncelikli Uygulanacak Modeller

| Model | Önem | Not |
|---|---|---|
| `Assignment` | Kritik | İlk fazda zorunlu |
| `Professional` | Kritik | İlk fazda zorunlu |
| `Facility` | Kritik | İlk fazda zorunlu |
| `MonthlyHRData` | Orta | UNIQUE(facility, month) kısıt ek koruma sağlar |
| `MonthlyAccidentData` | Orta | UNIQUE(facility, month) kısıt ek koruma sağlar |
| `ReportTemplate` | Düşük | `isDraft` akışı doğal koruma sağlar |

---

> **Son Güncelleme:** 2026-04-16  
> **Versiyon:** 1.3  
> **Oluşturan:** Metin Salık + Antigravity AI  
> **Toplam Bölüm:** 34 (Bölüm 0 dahil 35 başlık)
