# sec_portali — Kapsamlı Portal Rehberi

Bu doküman, `sec_portali` projesinin yapısını, işlevlerini, teknoloji yığınını ve projeye entegre edilmiş **agent (yapay zeka destekli geliştirme) sistemini** eksiksiz biçimde açıklar.

## 1. Proje Özeti

**sec_portali**, MLPCare hastane grubu için geliştirilen bir **İş Sağlığı ve Güvenliği (İSG) Yönetim Portalı**dır. Hastane tesislerindeki İSG süreçlerini (risk, olay, yangın güvenliği, tehlikeli madde, inşaat/yapı yönetimi, asansör, elektrik altyapısı vb.) tek çatı altında toplayan kurumsal bir web platformudur.

Proje aynı zamanda **agent destekli geliştirme modeliyle** inşa edilmiştir: `.agents/skills/` dizini altındaki uzman skill'ler (mimar, analist, mühendis, kalite rolleri) bir "Product Engineering Operating System" hattı üzerinden koordine edilir.

## 2. Genel Mimari (Monorepo)

npm workspaces tabanlı monorepo yapısı:

```
sec_portali/
├── .agents/skills/          # Agent becerileri (22 adet SKILL.md)
├── .claude/                 # Claude Code ayarları
├── .kilo/worktrees/         # Kilo agent çalışma kopyaları
├── apps/web/                # Frontend  (@sec-portali/web)
│   ├── src/pages/           # Modül bazlı sayfalar
│   ├── src/components/      # Modül bazlı bileşenler + ortak ui/
│   └── Dockerfile, nginx.conf
├── backend/                 # Backend   (@sec-portali/api)
│   ├── prisma/              # schema.prisma (179 model) + seed
│   ├── src/routes/          # Modül bazlı API uç noktaları
│   ├── src/services/        # İş kuralları (workflow, mail, telegram...)
│   ├── src/jobs/            # Cron görevleri (cronTasks, checklistCron)
│   ├── src/scripts/         # Veri import/düzeltme scriptleri
│   └── src/middleware/      # errorHandler vb.
├── packages/shared/         # Paylaşılan tipler (@sec-portali/shared)
├── packages/core/           # Çekirdek paket
├── harici_sayfalar/         # Statik HTML eğitim sayfaları (yangın güvenliği)
├── temp_backup_skills/      # Arşivlenmiş eski skill'ler
├── docker-compose.yml       # Tüm ortam (5 servis)
├── nginx.conf               # Reverse proxy yapılandırması
├── modul.md                 # Yeni modül geliştirme rehberi
└── FM200_Takip_Sistemi_Plani.md
```

## 3. Teknoloji Yığını

**Frontend (`apps/web`)**
- React 19 + Vite 8 + TypeScript (~6.0)
- Tailwind CSS 4 + shadcn/ui (Radix tabanlı) + tw-animate-css
- TanStack Query 5 (veri yönetimi), React Router DOM 7
- Socket.IO client (gerçek zamanlı güncelleme)
- TipTap (zengin metin editörü), Recharts (grafikler), turkey-map-react (Türkiye haritası)
- QR: html5-qrcode, @yudiel/react-qr-scanner, qrcode.react
- Çıktı: jspdf, exceljs, xlsx, react-to-print, html2canvas, html-to-image
- react-hook-form, sonner + react-hot-toast (bildirim), lucide-react (ikon)

**Backend (`backend`)**
- Node.js + Express 5 + TypeScript (dev: nodemon + ts-node)
- Prisma ORM + PostgreSQL 16
- Kimlik doğrulama: JWT (jsonwebtoken) + NTLM/Active Directory (express-ntlm)
- Socket.IO (görev bazlı gerçek zamanlı odalar)
- node-cron (zamanlanmış görevler)
- nodemailer (SMTP e-posta), node-telegram-bot-api (Telegram bildirim botu)
- multer (dosya yükleme), zod (doğrulama), helmet + cors (güvenlik), exceljs/xlsx/csv-parse/iconv-lite (veri işleme)

**Veritabanı:** PostgreSQL 16 (Docker volume: `postgres_data`; Adminer arayüzü 8080 portunda)

**Altyapı:** Docker Compose — her şey konteyner içinde çalışır (agent anayasası gereği localhost/yerel çalıştırma yasaktır).

## 4. Modüller ve İşlevleri

Portal, modül bazlı izole mimariyle geliştirilmiştir. Backend'e kayıtlı API yüzeyi (`backend/src/index.ts`):

| Modül | API Kökü | İşlev |
|---|---|---|
| Kimlik & Yetki | `/api/auth`, `/api/public` | JWT + NTLM girişi, rol/modül bazlı yetki (`Module`, `RoleModule`, `UserModule`) |
| Panel | `/api/panel` | Yönetim paneli, tesis yaşam kartları, İSG profesyonelleri |
| Operasyon | `/api/operations` | Operasyon kategori/departman yönetimi; İSG Panosu (`/board`); iyileştirmeler (`/improvements`: denetimler, elektrik takibi, kritik kalemler) |
| Olay Yönetimi | `/api/incidents` | Olay kayıtları, kategori/kök neden/destek birimi, acil kodlar, olağanüstü olaylar, idari para cezaları |
| İş Takibi (Workflow) | `/api/workflow` | Plan, görev, checklist adımları, yorum, görev içi sohbet, süre uzatma talepleri, aktarım talepleri, takvim, raporlar (`Wf*` modelleri) |
| Risk Değerlendirme | `/api/risks` (+ `/reports`) | Risk yaşam döngüsü, tesis/departman/bina/kat/oda bazlı riskler, denetim kaydı, raporlar, departman/kategori ayarları |
| Tehlikeli Madde (Hazmat) | `/api/hazmat` | Malzeme envanteri, tehlike/ADR etiketleri, KKD eşleştirme, dökülme kitleri (spill-kit) kontrolü, göz yıkama risk analizi, araç kayıtları, Excel import |
| Yangın Ekipmanları | `/api/fire-equipment` | Ekipman kategorileri, bakım ve hareket kayıtları, sorumlular, firmalar |
| Yangın Kapıları | `/api/safety-management/fire-doors` | Kapı özellikleri, soru grupları, denetim kayıtları |
| Yangın Güvenlik Kontrolü | `/api/fire-safety-control` | Yangın denetim raporları (`FireSafetyAudit`), bulgu/aksiyonlar, mükerrer rapor konsolidasyonu |
| FM200 (Gazlı Söndürme) | `/api/fm200` | Silindir takibi, Faz-1 değerlendirme, periyodik denetim, bakım, sıkılık testi, iş emirleri, hastane denetim matrisi |
| Asansör | `/api/safety-management/elevators` (+ `elevator-settings`) | Asansör kayıt/denetim, marka/tip/durum tanımları, bakım firmaları |
| Elektrik Altyapısı | `/api/safety-management/electric-infrastructure` (+ `/thermal`) | Elektrik altyapı kayıtları, termal kamera denetim oturumları/ölçümleri, panel takibi |
| İnşaat/Yapı Yönetimi | `/api/build-management` (+ `/settings`) | Projeler, yükleniciler, tasarım formu, risk değerlendirme, İÇRA, onaylar, izinler, İSG + enfeksiyon denetimleri, devir teslim formları, kapı kontrolü (GateCheck); tadilat raporları (`/api/renovation-reports`) |
| Bina Türü Analizi | `/api/bina-turu` | Detaylı bina analizi; soru bankası, denetim ekipleri, uygunsuzluk takibi (`BT*` modelleri) |
| Kontrol Listeleri | `/api/checklists` | Şablon/bölüm/soru yapısı, ölçek setleri, atama, gönderim, cevaplar, ekler |
| İSG Kurulu | `/api/operations/board` | Dönem, toplantı + katılım, gündem konuları, kararlar ve aksiyonları, üyeler, denetim kaydı (İSG Kurul ekranları: özet, analiz, toplantılar, kararlar, ayarlar) |
| İSG Defteri | `/api/safety-management/isg-defter` | Dijital İSG defteri sayfaları, kalem aksiyon/yorumları |
| Defterim | `/api/notebooks` | Kişisel not defterleri, kalem/aksiyon/yorum modeli |
| Bildirimler | `/api/notifications` | Uygulama içi bildirimler, şablonlar, kanal yapılandırması (SMTP/Telegram) |
| Lokasyonlar | `/api/locations` | Tesis → bina → kat → oda hiyerarşisi (`FacilityLocation`) |
| Ayarlar | `/api/settings` (+ `/telegram`, `/hazmat-kit-items`) | Kullanıcı/yetki, tesis sihirbazı, tanımlar, SMTP, Telegram, e-posta/rapor şablonları (rapor editörü) |

Frontend'de kullanıcı ilk olarak **PortalPage** (modül kartları) ekranına gelir; İşletme Yönetimi (`OperationsManagementPage`), Güvenlik Yönetimi (`SafetyManagementPage`), İSG Kurul, Panel ve Ayarlar ana bölümlerinden modüllere ulaşır. Tüm korumalı rotalar `ProtectedRoute` bileşeniyle sarılır (modül/rol bazlı yetki).

## 5. Veritabanı

- **ORM:** Prisma — tek şema dosyası: `backend/prisma/schema.prisma`
- **Model sayısı:** 179
- **Ana model grupları:**
  - Kimlik/Yetki: `User`, `Role`, `UserRole`, `Module`, `RoleModule`, `UserModule`, `WorkflowUserRole`
  - Tesis: `Facility`, `FacilityBuilding`, `FacilityLocation`, `UserFacility`, `EmployeeCountHistory`, `MonthlyHRData`, `MonthlyAccidentData`
  - Olay: `IncidentCategory`, `IncidentRootCause`, `EmergencyCode`, `ExtraordinaryIncident`, `AdministrativeFine`
  - Risk: `RiskLifecycle`, `RiskExpertFacility`, `RiskAuditLog`, `Risk*Setting`
  - Hazmat (25+ model): `HazmatMaterial*`, `HazmatSpillKit*`, `HazmatInventoryItem`, `HazmatVehicle`, `HazmatEyewashRiskAnalysis`...
  - Yangın: `FireEquipment*`, `FireDoor*`, `FireSafetyAudit/Item/Action`, `Fm200*` (10 model)
  - Build Management (18 model): `BuildProject`, `BuildICRA`, `BuildPermit`, `BuildHandover*`, `BuildInspection*`, `BuildApproval`...
  - Bina Türü: `BTAnaGrup`, `BTSoruBankasi`, `BTDenetimEkibi`, `BTUygunsuzluk`... (11 model)
  - Workflow: `WfPlan`, `WfTask`, `WfChecklistStep`, `WfComment`, `WfChatMessage`, `WfDueChangeRequest`... (9 model)
  - Checklist (11 model), İSG Kurulu (8 model), Asansör (7 model), Termal (4 model), İyileştirme (3 model)
  - Sistem: `SystemSettings`, `SmtpSettings`, `TelegramSettings`, `Notification*`, `ReportTemplate`, `ActivityLog`

## 6. Altyapı (Docker Compose)

`docker-compose.yml` servisleri:

| Servis | Port | Açıklama |
|---|---|---|
| `postgres` | 5432 | PostgreSQL 16 Alpine (`isgdb`), healthcheck + init dump (`backend/database_dump.sql`) |
| `backend` | 3005 | Express API; `./backend/uploads` volume'u; DB/JWT/SMTP/NTLM env değişkenleri |
| `frontend` | — | Vite build (nginx tabanlı Dockerfile) |
| `nginx` | 80/443 | Reverse proxy, SSL (`./ssl`), statik eğitim sayfaları (`harici_sayfalar`) |
| `adminer` | 8080 | Veritabanı yönetim arayüzü |

## 7. Entegrasyonlar ve Otomasyonlar

- **SMTP (nodemailer):** e-posta bildirimleri + şablon yönetimi
- **Telegram Botu (node-telegram-bot-api):** sunucu açılışında polling başlar, bildirim gönderir
- **NTLM / Active Directory (express-ntlm):** kurumsal kimlik doğrulama
- **Socket.IO:** görev bazlı gerçek zamanlı odalar (`joinTask` / `leaveTask`)
- **node-cron:** `cronTasks` + `checklistCron` zamanlanmış görevleri
- **Başlangıçta otomatik:** mükerrer yangın denetim konsolidasyonu (`consolidateFireSafetyAudits`), boş termal kayıt temizliği (`cleanupEmptyThermalItems`)
- **Sağlık kontrolü:** `GET /health`

## 8. Agent Sistemi (AI Destekli Geliştirme)

Proje, **"Product Engineering Operating System"** yaklaşımıyla geliştirilir. `.agents/skills/` altında 22 adet skill bulunur; her biri bir uzman rolünü temsil eder. Klasör adlarındaki sayı önekleri hiyerarşi katmanını gösterir.

### 8.1 Skill Katalogu

**00- Yönetim ve Anayasa**
| Skill | Rol / Açıklama |
|---|---|
| `agent-constitution` | Mutlak çekirdek kurallar: plan onayı olmadan kod yok, Docker-only, modül izolasyonu, varsayım yasak, cross-platform önce, Stitch-onaylı tasarım, production-grade kod |
| `engineering-principles` | Evrensel teknik anayasa: Logic Over Syntax, SOLID/DRY/KISS, Zero Trust doğrulama, strict typing (`any` yok), UUID PK, katmanlı validasyon |
| `platform-governor` | CTO / karar verici: öncelikleri belirler, mimari etkiyi değerlendirir, kodlamadan önce planı onaylar |
| `prompt-engineer` | Görev tanımlarını yüksek doğruluklu teknik spesifikasyona dönüştürür |
| `thinking-mode` | Derin akıl yürütme, ödün analizi, varsayımların sorgulanması |
| `workflow-orchestrator` | Yürütücü beyin: hangi uzman, hangi sırayla çalışacak; faz atlama ve erken kodlama engellenir |

**10- Ürün ve Alan**
| Skill | Rol / Açıklama |
|---|---|
| `business-analyst` | Keşif ve gereksinim elicitation; gizli karmaşıklıkları ortaya çıkarır, netleştirici sorular sorar |
| `product-manager` | Ürün stratejisi, user story'ler, MVP kapsamı; her yeni özellik için zorunlu |
| `domain-architect` | İş alanı analizi: Bounded Context, Aggregate, Entity tanımları |
| `enterprise-architect` | Uzun vadeli ekosistem: modül bağımlılıkları, capability map, ölçeklenebilirlik (2-5 yıl) |
| `platform-architect` | Platform stratejisi: multi-tenancy, modüller arası iletişim, global standartlar |

**20- Mimari** · `software-architect` (klasör yapısı, monorepo, feature-based tasarım) · `database-architect` (şema tasarımı, veri modelleme, performans) · `workflow-architect` (state machine, yaşam döngüsü, event-driven iletişim)

**30- Tasarım** · `design-system` (görsel dil, UI bileşenleri, Shadcn/UI standartları, erişilebilirlik) · `stitch-expert` (Google Stitch için yüksek doğruluklu prompt üretimi + tasarım ekran görüntülerini teknik kılavuza çevirme)

**40- Mühendislik** · `fullstack-engineer` (Next.js/React/Node/Prisma implementasyonu; mimariye sıkı bağlı) · `mobile-engineer` (Expo + React Native; iOS/Android uyumluluk)

**50- Altyapı** · `docker-architect` (altyapıda mutlak otorite; proje yalnızca Docker'da, production-grade standartlarda çalışır)

**60- Kalite** · `quality-assurance` (test, güvenlik denetimi, teslim öncesi son kod incelemesi) · `cleaner-knip` (Knip ile kullanılmayan dosya/bağımlılık/export temizliği)

**90/95- İnceleme ve İyileştirme** · `reviewer` (Kıdemli Lead Reviewer: kod, mimari ve ilkeler uygunluğunu eleştirel değerlendirir) · `retrospective` (tamamlanan döngüyü analiz eder, agent süreçlerini iyileştirir)

### 8.2 Geliştirme Pipeline (workflow-orchestrator)

Her istek şu fazlardan geçer; **herhangi biri onaysızsa kod üretimi durdurulur:**

1. **Phase 00 — Thinking:** `thinking-mode` ile derin analiz (riskler, varsayımlar, alternatifler)
2. **Phase 01 — Discovery:** `business-analyst` + `product-manager` → problem, kişiler, user story, fonksiyonel/fonksiyonel olmayan gereksinimler
3. **Phase 02 — Enterprise Vision:** `enterprise-architect` → capability map, yol haritası, modül kataloğu
4. **Phase 03 — Domain Design:** `domain-architect` + `platform-architect` → bounded context, aggregate, kimlik/yetki, paylaşılan servisler
5. **Phase 04 — Workflow Design:** `workflow-architect` → state machine, olay kataloğu, kuyruk stratejisi
6. **Phase 05 — Technical Architecture:** `software-architect` + `database-architect` → klasör yapısı, monorepo stratejisi, API/DB stratejisi, Prisma modelleri (kod yok, sadece mimari)
7. **Phase 06 — Design:** `design-system` + `stitch-expert` → UX/UI akışı, bileşen listesi, Stitch prompt
8. **Phase 07 — Infrastructure:** `docker-architect` → Docker mimarisi, proxy, PostgreSQL/Redis/MinIO, izleme
9. **Phase 08 — Engineering:** `fullstack-engineer` + `mobile-engineer` → onaylı plana sadık implementasyon
10. **Phase 09 — Quality:** `quality-assurance` + `cleaner-knip` → güvenlik, performans, test, Knip temizliği, dokümantasyon

**Yönetici ilkeleri:** platformlar inşa et (sayfalar değil), ekosistemler inşa et (projeler değil); erken koda izin yok; uzun vadeli bakım önce.

### 8.3 Desteklenen Agent Araçları / Ortamları

- `.claude/settings.json` — Claude Code entegrasyonu
- `.kilo/worktrees/` — Kilo agent worktree kopyaları (paralel çalışma)
- `temp_backup_skills/` — Arşiv skill'ler (frontend-init, shadcn-expert, knip-*, prompt-enhancer, project-architect vb.)

## 9. Geliştirme Kuralları ve Yeni Modül Ekleme

`modul.md` dosyası sistemin geliştirme standardını tanımlar. Yeni modül eklerken 8 adımlık zorunlu checklist:

1. **Veritabanı:** `backend/prisma/schema.prisma` içine modeller + ilişkiler ekle
2. **Prisma:** `npx prisma format`, `npx prisma generate`, `npx prisma db push` (veya `migrate dev`)
3. **Backend Route:** `backend/src/routes/[modul_adi]/` altında `express.Router()` uç noktaları + auth middleware
4. **Backend Entegrasyon:** Route'u `backend/src/index.ts` içine `app.use('/api/[modul_adi]', ...)` ile register et
5. **Frontend Pages:** `apps/web/src/pages/[modul_adi]/` klasörü (kök dizine dosya atmak yasak)
6. **Frontend Components:** Gerekirse `apps/web/src/components/[modul_adi]/`
7. **Routing:** `App.tsx` içine `<Route>` tanımı; yetkili erişim için `<ProtectedRoute>` sarmalaması
8. **Navigasyon:** PortalPage'e modül kartı + sidebar linki

**Agent anayasası (agent-constitution) özeti:**
- Kodlamadan önce onaylı plan şart
- Tüm kod Docker içinde çalışır; yerel çalıştırma yasak
- Her özellik kendi kendine yeten izole modül (Feature-Based Architecture)
- Belirsiz gereksinimde varsayım yok → kullanıcıya sor
- UI, Google Stitch tasarım onayı olmadan geliştirilmez
- Cross-platform (Web/Android/iOS) birlikte düşünülür

**Engineering principles özeti:** Logic > syntax, SOLID/DRY/KISS, Zero Trust (her dış veri doğrulanır), strict typing (`any` yasak), tek doğruluk kaynağı, imkansız durum tip ile engellenir, secrets hardcode edilmez, kullanılmayan kod silinir (Knip).

## 10. Komutlar

**Kök dizin (npm workspaces):**
```bash
npm run dev      # tüm workspaces'lerde dev
npm run build    # tüm workspaces'lerde build
npm run lint     # tüm workspaces'lerde lint
```

**Backend (`backend/`):**
```bash
npm run dev        # nodemon + ts-node (src watch)
npm run build      # tsc
npm run db:push    # prisma db push
npm run db:import  # import_data.ts scripti
npx prisma generate
npx prisma migrate dev --name <migration>
```

**Frontend (`apps/web/`):**
```bash
npm run dev      # vite
npm run build    # vite build
npm run preview
```

**Ortam:** `.env.example` dosyası baz alınır → `.env` (DB_PASSWORD, JWT_SECRET, NTLM_ENABLED, DEV_USER, SMTP_*, FRONTEND_URL, NODE_ENV). Çalıştırma: `docker compose up --build`.

## 11. İlgili Dokümanlar ve Ek Kaynaklar

- `modul.md` — Modül geliştirme rehberi (bölüm 9'un kaynağı)
- `FM200_Takip_Sistemi_Plani.md` — FM200 gazlı söndürme takip modülünün planı
- `report.md` — Proje raporu
- `apps/web/README.md` — Frontend notları
- `harici_sayfalar/` — Nginx üzerinden yayılan statik yangın güvenliği eğitim sayfaları (vaka-analizi, yangin-ani-kriz, yangin_onlemleri, yangin_pompalari)
- `backend/database_dump.sql` — Postgres başlangıç veri seti
- `.agents/skills/*/SKILL.md` — Agent becerilerinin tam metinleri

---

*Bu rehber, kod tabanı statik analiziyle (dosya yapısı, `package.json` dosyaları, `docker-compose.yml`, `backend/src/index.ts`, `App.tsx`, `schema.prisma` ve SKILL.md dosyaları okunarak) hazırlanmıştır.*
