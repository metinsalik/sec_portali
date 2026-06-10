# sec_portali - Modül Geliştirme Rehberi

Bu belge, sisteme yeni bir modül (örneğin; `risks`, `operations`, `workflow`, `panel` vb.) ekleneceği zaman izlenmesi gereken adımları ve sistemin teknik altyapısını eksiksiz bir şekilde tanımlamak için hazırlanmıştır. 

Yeni bir modül planlaması yapılırken bu dokümandaki adımlar birebir uygulanmalı ve her modülün kendine ait izole bir klasör yapısında olmasına özen gösterilmelidir.

## 1. Veritabanı ve Model (Backend - Prisma)

Her yeni modülün kendine ait verilerini tutacağı tablolar sisteme Prisma ORM ile eklenir.

- **Dosya Yolu:** `backend/prisma/schema.prisma`
- **İşlem:** Yeni modüle ait modeller (örneğin `Risk`, `Incident`, `Notebook` vb.) buraya eklenir. Diğer modellerle olan ilişkiler (Relations & Foreign Keys) dikkatlice tanımlanır.
- **Kullanılacak Komutlar (Backend dizininde):** 
  - `npx prisma format` (Şemayı standart formata getirir)
  - `npx prisma db push` veya `npx prisma migrate dev --name [migration_adi]` (Veritabanını günceller)
  - `npx prisma generate` (TypeScript için Prisma Client'ı günceller, tipleri oluşturur)

## 2. Backend Geliştirme

Backend kod tabanı (Node.js/Express), modül bazlı bir dosya yapısına sahiptir.

### a) Route (API Uç Noktaları)
- **Klasör Yolu:** `backend/src/routes/` veya `backend/src/routes/[modul_adi]/`
- **İşlem:** İlgili modül için, tek bir dosya ise `[modul_adi].ts`, eğer çok kapsamlı ise `[modul_adi]/index.ts` klasör yapısı oluşturulur.
- **İçerik:** `express.Router()` kullanılarak işlemler (GET, POST, PUT, DELETE) tanımlanır. Yetki ve kimlik doğrulama işlemleri için middleware'ler (örneğin `authMiddleware`, `roleCheck`) buralara eklenir.
- **Entegrasyon:** Oluşturulan route dosyası mutlaka `backend/src/index.ts` içine import edilip express uygulamasına eklenmelidir.
  - Örnek: `app.use('/api/[modul_adi]', modulRoutes);`

### b) Kontrolcüler ve Servisler (Opsiyonel)
- Eğer modülün iş kuralları çok karmaşıksa kodların tamamı route dosyasına yazılmamalı, `backend/src/services/` klasörü altına o modüle ait servis dosyaları açılarak mantık oraya taşınmalıdır.

### c) Tipler
- **Klasör Yolu:** `backend/src/types/`
- Eğer modüle özgü çok özel request/response body TypeScript tipleri gerekiyorsa bu dizinde tanımlanmalıdır.

## 3. Frontend Geliştirme

Frontend (Vite + React + TypeScript), modüllerin klasör bazlı ayrışmasını kesin bir standart olarak kabul eder. **Hiçbir yeni modül dosyası doğrudan `pages` veya `components` kök dizinine atılmamalıdır.**

### a) Sayfalar (Pages)
- **Klasör Yolu:** `frontend/src/pages/[modul_adi]/` (Örn: `frontend/src/pages/risks/`)
- **İşlem:** Modüle ait tüm sayfa bileşenleri bu klasör altında toplanmalıdır. (Örn: `RiskDashboard.tsx`, `RiskFormPage.tsx` vb.)

### b) Bileşenler (Components)
- **Klasör Yolu:** `frontend/src/components/[modul_adi]/`
- **İşlem:** Sadece bu modülde kullanılacak ve diğer modülleri ilgilendirmeyen form, tablo, modal gibi özel UI bileşenleri bu klasör altında oluşturulmalıdır. (Tüm projeyi ilgilendiren buton, input vb. bileşenler `components/ui/` altında kalmaya devam eder).

### c) Routing Entegrasyonu (App.tsx)
- **Dosya Yolu:** `frontend/src/App.tsx`
- **İşlem:** Yeni oluşturulan ana sayfalar `App.tsx` içerisine import edilir.
- **Yönlendirme:** React Router DOM `<Route>` bileşenleri ile URL yolları (`path="/[modul_adi]/..."`) tanımlanır.
- **Yetkilendirme:** Eğer sayfaya sadece yetkili kişiler girecekse, route mutlaka `<ProtectedRoute allowedRoles={['admin', 'management']}>` gibi bir bileşen ile sarmalanmalıdır.

### d) Navigasyon ve Modül Seçimi
- Yeni oluşturulan modüle giriş yapabilmek için, kullanıcının karşısına çıkan **`PortalPage.tsx`** ekranına bir modül kartı/bağlantısı eklenmelidir.
- Ek olarak sol menü (Sidebar vb. AppLayout içinde) kullanılıyorsa, yeni modülün linkleri navigasyon sistemine tanıtılmalıdır.

## 4. Özet Kontrol Listesi (Checklist)

Yeni modül geliştirilirken teknik mimariyi bozmamak için aşağıdaki adımlar eksiksiz takip edilmelidir:

- [ ] **1. Veritabanı:** `schema.prisma` dosyasına gerekli Modeller (Table) ve ilişkiler eklendi.
- [ ] **2. Prisma:** `npx prisma generate` ve `npx prisma db push/migrate` komutları çalıştırıldı.
- [ ] **3. Backend Route:** `backend/src/routes/[modul_adi]` altında API uç noktaları oluşturuldu.
- [ ] **4. Backend Entegrasyon:** Yeni route, `backend/src/index.ts` içerisine `app.use` ile register edildi.
- [ ] **5. Frontend Pages:** `frontend/src/pages/[modul_adi]/` klasörü açıldı ve arayüz sayfaları buraya kodlandı.
- [ ] **6. Frontend Components:** İhtiyaç varsa `frontend/src/components/[modul_adi]/` klasörü açıldı.
- [ ] **7. Frontend App.tsx:** Yeni sayfalar `App.tsx` içinde ilgili `<Route>` tanımlamaları ile (gerekli ise `<ProtectedRoute>` ile) ana router'a bağlandı.
- [ ] **8. Arayüz Navigasyonu:** Kullanıcıların modüle erişebilmesi için Portal sayfasına veya yan menüye modülün kısayolu eklendi.

Bu doküman, projenin büyümesi esnasında düzenli klasör yapısını, kodun okunabilirliğini ve teknik bütünlüğünü sağlamak için oluşturulmuştur. Yeni geliştirilecek her modül bu rehbere sadık kalarak inşa edilmelidir.
