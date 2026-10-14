# sec_portali - Operasyonlar: İyileştirme ve Aksiyon Takip Modülü Rehberi

Bu doküman, `sec_portali` projesinin **Operasyonlar** bölümündeki **İyileştirme ve Aksiyon Takip** modülünü (frontend ve backend) bir AI agent perspektifinden detaylıca incelemektedir. Modülün yapısı, teknolojileri, işlevleri, genel mimariye uyumu ve ilgili agent skill'leri açıklanmıştır.

## 1. Modül Amacı ve İşlevselliği

İyileştirme ve Aksiyon Takip modülü, MLPCare hastane tesislerindeki İş Sağlığı ve Güvenliği (İSG) süreçlerinde ortaya çıkan bulguların, denetim sonuçlarının ve belirlenen aksiyon planlarının merkezi olarak yönetilmesi ve izlenmesi için tasarlanmıştır. Modül, çeşitli kaynaklardan (denetimler, elektrik kontrolleri, kritik riskler) gelen verileri toplar, yönetici panoları sunar, geçmiş takibi sağlar ve Excel üzerinden toplu veri yüklemeyi destekler.

**Ana İşlevler:**
- Hastane bazında iyileştirme kayıtlarının (bulgu, risk puanı, durum, sorumlu, termin tarihi) takibi.
- Dashboard üzerinden genel durum özeti ve kritik maddelerin izlenmesi.
- Farklı `sheetType` (Denetimler, Elektrik PK, Topraklama PK, vb.) bazında kayıtların filtrelenmesi ve yönetimi.
- Kritik ve Yüksek riskli maddelerin merkezi konsolidasyonu.
- Kayıt geçmişi (not ve durum değişiklikleri) tutma.
- Excel şablonu ile toplu veri yüklemesi.
- Modüle özel kategori listelerinin yönetimi.
- Kullanıcıların yetkilerine göre tesis bazında veri erişimi.

## 2. Mimari ve Teknoloji Yığını

Bu modül, `sec_portali` monorepo yapısının `apps/web` (frontend) ve `backend` kısımlarında yer alır.

### 2.1. Frontend (`apps/web/src/pages/operations/improvements`)

**Teknoloji:** React 19, Vite 8, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query (veri yönetimi için), React Router DOM.

**Dosya Yapısı ve Bileşenler:**
- `ImprovementsLayout.tsx`: Modülün ana layout'u. Sol menü navigasyonu, üst header, hastane seçici (filtre), Excel yükleme modalını (`ImprovementExcelImportModal`) ve `Outlet` aracılığıyla alt sayfaları yönetir.
  - `fetchFacilities` fonksiyonu ile kullanıcının yetkili olduğu hastaneleri `/api/operations/improvements/facilities` endpoint'inden çeker.
  - `selectedFacilityId` state'ini yönetir ve alt bileşenlere `Outlet` context üzerinden sağlar.
- `ImprovementsDashboardPage.tsx`: Modülün ana kontrol paneli. Genel istatistikleri (`/api/operations/improvements/dashboard-stats`) ve kritik kayıtları (`/api/operations/improvements/critical`) çeker ve görüntüler.
  - Hastane ve kaynak sekme kırılımında istatistikleri sunar.
  - Kritik maddeleri görüntülemek için `ImprovementTable` bileşenini kullanır.
- `CriticalItemsPage.tsx`: Yalnızca 'Kritik' veya 'Yüksek' risk puanına sahip iyileştirme kayıtlarını listeler (`/api/operations/improvements/critical` endpoint'ini kullanır).
- `DenetimlerPage.tsx`: `sheetType=DENETIMLER` olan iyileştirme kayıtlarını listeler (`/api/operations/improvements/records` endpoint'ini kullanır).
- `ElectricalTrackingPage.tsx`: Elektrik altyapısı ile ilgili farklı `sheetType`'lara (Elektrik PK, Topraklama PK, vb.) göre kayıtları listeler. `useParams` ile alt kategoriye göre dinamik rota yönetimi yapar.
- `ImprovementTable.tsx`: (Modülün içinde bulunan reusable tablo bileşeni) İyileştirme kayıtlarını listeler, filtreleme, sıralama ve aksiyon butonları (düzenleme, silme, durum değiştirme) sunar.
- `ImprovementExcelImportModal.tsx`: Excel dosya yükleme arayüzünü sağlar, backend'deki `/api/operations/improvements/upload-excel` endpoint'i ile entegre olur.
- `ImprovementRecordDialogs.tsx`: Tek bir iyileştirme kaydının detaylarını görüntülemek ve düzenlemek için kullanılır.
- `types.ts`: Modüle özgü TypeScript arayüzlerini ve sabitlerini tanımlar (`FacilityOption`, `ImprovementRecord`, `ImprovementRecordHistory`, `DashboardStats`, `ELECTRICAL_SHEETS`, `SHEET_MAP`).

### 2.2. Backend (`backend/src/routes/improvements/index.ts`)

**Teknoloji:** Node.js, Express 5, TypeScript, Prisma ORM, PostgreSQL, Zod (validasyon), multer (dosya yükleme), xlsx (Excel işleme).

**API Uç Noktaları (`/api/operations/improvements` altında):**
- `GET /facilities`: Kullanıcının erişebildiği hastaneleri, iyileştirme kayıt sayılarıyla birlikte döner.
- `GET /dashboard-stats`: Genel ve hastane bazında iyileştirme istatistikleri sunar.
- `GET /critical`: Kritik veya Yüksek riskli iyileştirme kayıtlarını döner.
- `GET /records`: `sheetType`, `facilityId`, `status`, `assignedTo`, `riskScore` gibi parametrelerle filtrelenebilir tüm iyileştirme kayıtlarını çeker.
- `GET /record/:id`: Belirli bir iyileştirme kaydını ve geçmişini çeker.
- `POST /record`: Yeni bir iyileştirme kaydı oluşturur (Zod ile validasyon, geçmiş kaydı).
- `PUT /record/:id`: Mevcut bir kaydı günceller (Zod ile validasyon, not ve durum değişikliklerinin geçmişini kaydeder).
- `PATCH /record/:id/status`: Kaydın sadece durumunu ve notunu günceller (geçmiş kaydı).
- `PATCH /record/:id/archive`: Kaydı arşivler (`isArchived: true`).
- `DELETE /record/:id`: Bir kaydı siler.
- `POST /batch-delete`: Birden fazla kaydı toplu siler.
- `POST /upload-excel`: Excel dosyasını işler, bulguları ayrıştırır ve veritabanına `ImprovementRecord` olarak kaydeder. `SHEET_MAP` kullanarak sekme türlerini normalize eder ve her import için `ImprovementRecordHistory` oluşturur.
- `GET/POST /categories`: İyileştirme kategorilerini yönetir (`ImprovementSetting` modelini kullanır).
- `POST /renumber`: Belirli `facilityId` ve `sheetType` için `rowNo` değerlerini otomatik olarak yeniden düzenler (sıfırdan başlatır ve sıralı yapar).

**Prisma Modelleri (`backend/prisma/schema.prisma`):**
- `ImprovementRecord`: İyileştirme bulgularının ana modelidir. `facilityId`, `moduleGroup`, `sheetType`, `finding`, `riskScore`, `status`, `dueDate` gibi alanları içerir. `isArchived` alanı ile arşivleme desteği bulunur.
- `ImprovementRecordHistory`: `ImprovementRecord` üzerindeki `currentNote` ve `status` değişikliklerinin geçmişini tutar. `changedBy` (User ile ilişkili) ve `createdAt` alanları mevcuttur.
- `ImprovementSetting`: Modüle özel ayarları, özellikle de iyileştirme kategorileri listesini `key: 'categories'` ile tutar.

## 3. Agent Perspektifi ve İlgili Beceriler (Skills)

Bu modülün geliştirilmesi ve sürdürülmesi, "Product Engineering Operating System" içindeki birçok agent skill'i ile yakından ilişkilidir:

- **`workflow-orchestrator`**: İyileştirme takibi, bir iş akışının yönetimidir. Bu skill, bulgunun açılmasından kapanmasına kadar tüm yaşam döngüsünü koordine eder.
- **`business-analyst` & `product-manager`**: Modülün gereksinimlerini (hangi veriler tutulacak, hangi raporlar üretilecek, Excel şablonu nasıl olmalı, kullanıcı akışı) tanımlar.
- **`software-architect`**: Modülün backend/frontend arasındaki API sözleşmesini, veri modellerini (`ImprovementRecord`, `ImprovementRecordHistory`) ve monorepo içindeki konumunu tasarlar.
- **`database-architect`**: `schema.prisma` üzerindeki `ImprovementRecord` ve `ImprovementRecordHistory` modellerinin optimize edilmiş, ilişkileri doğru kurulmuş olmasını sağlar.
- **`fullstack-engineer`**: React bileşenlerinin (Dashboard, Table, Modal, Layout) geliştirilmesi ve Express API uç noktalarının (CRUD, Excel import, dashboard logic) implementasyonunu yapar.
- **`design-system`**: Frontend UI/UX tasarım prensiplerini ve shadcn/ui bileşenlerinin kullanımını sağlar.
- **`quality-assurance`**: Excel içe aktarımının doğruluğunu, tüm filtreleme ve istatistiklerin tutarlılığını, yetkilendirme mekanizmalarını ve CRUD işlemlerinin güvenliğini test eder.
- **`cleaner-knip`**: Modülün zamanla biriken kullanılmayan kod, bağımlılık veya export'larını tespit ederek temizlik yapar.
- **`engineering-principles`**: Modül, "Modül İzolasyonu" (kendi frontend sayfası/bileşen klasörü, kendi backend route dosyası), "Tek Doğruluk Kaynağı" (Prisma modelleri) ve "Katmanlı Doğrulama" (Zod schema'lar) gibi prensiplere sıkı sıkıya bağlıdır.

## 4. Mevcut Durum Notları

- Backend route dosyası tek dosyadır (`index.ts`, ~920 satır): CRUD + dashboard + Excel import + kategori + renumber uçları aynı yerde. Karmaşıklık artarsa `modul.md` gereği `backend/src/services/` altına servis çıkarımı düşünülebilir.
- `SHEET_MAP` ve `ELECTRICAL_SHEETS` sabitleri hem frontend (`types.ts`) hem backend (`index.ts`) tarafında tanımlıdır — sekme eklenirken iki taraf da güncellenmelidir.
- Yetkilendirme: tüm uçlarda `authMiddleware`; tesis erişimi roller (`admin`/`management`) + `user.facilities` filtresiyle sınırlandırılır. Yöneticiler `ALL` (grup geneli) seçebilir.
- Kayıt geçmişi (`ImprovementRecordHistory`) her not/durum değişikliğinde otomatik oluşur; silme yerine `isArchived` yumuşak silme kullanılır.
- Dashboard dipnotuna göre 8 kaynak sekme takip edilmektedir: Denetimler + 7 elektrik sekmesi.
- Veri akışında Socket.IO kullanılmaz; sayfalar `fetch` + `onRefresh` manuel yenileme modeliyle çalışır.

Bu modül, `sec_portali` projesinin genel İSG hedefleri doğrultusunda, veri odaklı ve yönetilebilir bir aksiyon takip platformu sağlamak üzere tasarlanmıştır.
