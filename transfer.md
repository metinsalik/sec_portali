# Kurumsal Dosya Transfer Modülü (`/transfer`) — Detaylı Uygulama Planı

Bu doküman, **SEC Portalı** içerisine harici bir uygulama (Gokapi vb.) kurmadan, mevcut altyapı (`PostgreSQL + Prisma + Express + Multer + node-cron + Nginx + React`) üzerine inşa edilecek sade, hızlı ve güvenli **Kurumsal Dosya Transfer Modülü** için eksiksiz teknik uygulama planıdır.

---

## 1. Genel Bakış ve Hedef Kullanıcı Akışı

### Temel Amaç
Kurum içi lokal ağdaki kullanıcıların **2 GB’a kadar** olan dosyaları sisteme yükleyip tek tıkla paylaşılabilir kısa/rastgele bir indirme linki üretmesi; linki alan kişinin (sistemde kullanıcı olsun ya da olmasın) kurum ağından tek tıkla — ve istenirse şifre girerek — dosyayı indirebilmesidir.

### Hedef URL Yapısı
- **Yükleme ve Yönetim Ekranı:** `http://10.234.2.101/transfer`
- **Herkese Açık İndirme Ekranı:** `http://10.234.2.101/transfer/<rastgele-token>`

### Uçtan Uca Akış
1. **`FILE_TRANSFER` modül yetkisine sahip** (veya Admin/Management) kullanıcı portalda oturum açarak `/transfer` sayfasına girer. *(Yetkisi olmayan kullanıcılar yükleme ekranına erişemez; böylece disk şişmesi ve kontrolsüz kullanım önlenir.)*
2. Dosyayı sürükleyip bırakır veya seçer (maks. **2 GB**).
3. İsteğe bağlı ayarları belirler:
   - **Saklama Süresi:** Varsayılan **3 gün** (seçenekler: `1 Gün`, `3 Gün`, `7 Gün`).
   - **Şifre Koruması (Opsiyonel):** "Şifre oluştur" seçeneği açıldığında otomatik güçlü şifre üretilir veya kullanıcı kendi şifresini yazar.
   - **İndirme Limiti (Opsiyonel):** Sınırsız (varsayılan) veya belirli sayıda indirme (ör. `1`, `5`, `10` indirme).
   - **Açıklama / Not (Opsiyonel):** Alıcının indirme ekranında göreceği kısa bilgi notu.
4. Yükleme sırasında canlı ilerleme çubuğu (`%`, yüklenen MB / toplam MB, hız, tahmini kalan süre) gösterilir.
5. Yükleme tamamlandığında sonuç kartı açılır:
   - Oluşan URL (`http://10.234.2.101/transfer/<token>`) + **Linki Kopyala**
   - Şifre oluşturulduysa şifre alanı + **Şifreyi Kopyala**
   - **Link + Şifreyi Birlikte Kopyala** (mail veya Teams/WhatsApp mesajına tek tıkla yapıştırmak için hazır formatlı metin)
   - *(Opsiyonel)* Portal SMTP üzerinden **Doğrudan Mail Gönder** butonu.
6. Alıcı linke tıklar (**herkese açık — login/yetki gerektirmez**):
   - Sistemde hesabı olsun olmasın, kurum ağından linke basınca doğrudan indirme sayfası açılır.
   - Dosya adı, boyutu, son geçerlilik tarihi görünür.
   - Şifre yoksa **İndir** butonuna basıp dosyayı alır; şifre varsa şifreyi girip doğrular ve indirir.
7. **3 gün sonunda** (veya seçilen süre dolduğunda) sistem dosyayı hem diskten fiziksel olarak siler hem de linki pasif hale getirir.

---

## 2. Mimari ve Güvenlik Prensipleri (Kritik Kararlar)

1. **İzole Depolama Dizini (Çok Önemli):**
   - Mevcut projede `backend/uploads` klasörü `backend/src/index.ts` ve `nginx.conf` üzerinden `express.static('/uploads')` ile herkese açık servis edilmektedir.
   - Transfer dosyaları **KESİNLİKLE `backend/uploads` içine konmamalıdır.** Aksi halde şifre ve süre kontrolü atlanabilir.
   - Bunun yerine tamamen kapalı bir dizin kullanılır: `backend/storage/transfers/` (Docker volume ile kalıcı hale getirilir). Dosyalara erişim **yalnızca** backend API üzerinden kontrol edilerek yapılır.
2. **RAM Dostu Akış (2 GB Dosya Güvenliği):**
   - Yükleme sırasında `multer.diskStorage` kullanılır (asla `memoryStorage` kullanılmaz). Dosya doğrudan diske yazılır.
   - İndirme sırasında `fs.createReadStream` + `res.download` / pipe akışı kullanılır. 2 GB dosya aktarılırken Node.js RAM tüketimi sabit ve düşük kalır.
3. **Tahmin Edilemez Token:**
   - URL’deki `<token>` için sıralı ID kullanılmaz. `crypto.randomBytes(12).toString('base64url')` (veya `uuidv4`) ile kriptografik olarak tahmin edilemez token üretilir.
4. **Şifre Güvenliği:**
   - Şifreler veritabanında kesinlikle düz metin saklanmaz; Node.js dahili `crypto.scryptSync` + rastgele `salt` ile hash’lenir, doğrulamada `crypto.timingSafeEqual` kullanılır.
   - Şifre doğrulama endpoint’inde kaba kuvvet (brute-force) saldırısına karşı IP + Token bazlı deneme sınırı (ör. 10 dakikada en fazla 10 hatalı deneme) uygulanır.
5. **Disk Doluluk Koruması (Kota):**
   - Sunucu diskinin dolmasını engellemek için toplam transfer klasörü kotası tanımlanır (ör. `.env` üzerinden `TRANSFER_MAX_TOTAL_GB=50`). Yeni yükleme kotayı aşacaksa kullanıcıya anlaşılır bir uyarı dönülür.
6. **Yarım Kalan Yükleme Temizliği:**
   - Kullanıcı 2 GB yüklerken tarayıcıyı kapatır veya bağlantı koparsa (`req.on('aborted')`), diskte yarım kalan geçici dosya anında `fs.unlink` ile temizlenir.

---

## 3. Adım 1 — Veritabanı Tasarımı (`backend/prisma/schema.prisma`)

`backend/prisma/schema.prisma` dosyasına aşağıdaki model eklenir:

```prisma
model FileTransfer {
  id              String    @id @default(uuid())
  token           String    @unique // URL'de kullanılacak kriptografik rastgele kod
  originalName    String    // Kullanıcının yüklediği orijinal dosya adı
  storedName      String    // Diskteki güvenli benzersiz dosya adı (UUID + uzantı)
  mimeType        String    // Dosya MIME tipi
  sizeBytes       BigInt    // 2 GB+ desteklemek için Int yerine BigInt!
  note            String?   // Opsiyonel gönderici notu

  // Güvenlik & Limitler
  passwordHash    String?   // Opsiyonel: "salt:hash" formatında scrypt hash
  maxDownloads    Int?      // Opsiyonel: maks indirme sayısı (null = sınırsız)
  downloadCount   Int       @default(0)

  // Yaşam Döngüsü
  expiresAt       DateTime  // Varsayılan: createdAt + 3 gün
  isDeleted       Boolean   @default(false)
  deletedAt       DateTime?

  // İzlenebilirlik (Zorunlu Auth — Modül Yetkili Kullanıcı)
  uploadedByUsername String  // req.user.username
  uploadedByName     String  // req.user.fullName
  uploaderIp         String? // Denetim izi (lokal ağ IP)

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([token])
  @@index([expiresAt, isDeleted])
  @@index([uploadedByUsername])
}
```

### Dikkat Edilecek Noktalar
- `sizeBytes` alanı **mutlaka `BigInt`** olmalıdır (`Int` 32-bit sınırından dolayı ~2.14 GB’ta taşar).
- JSON yanıtlarında `BigInt` serileştirme hatası almamak için API yanıtında `Number(record.sizeBytes)` veya `record.sizeBytes.toString()` dönüşümü yapılır.
- Migrasyon adımı: `npx prisma db push` (veya `npx prisma migrate dev --name add_file_transfer`) + `npx prisma generate`.

---

## 4. Adım 2 — Altyapı, Docker ve Nginx Yapılandırması

### 4.1. `docker-compose.yml` Güncellemesi
`backend` servisinin `volumes` ve `environment` bölümüne izole transfer depolama alanı ve ortam değişkenleri eklenir:

```yaml
  backend:
    volumes:
      - ./backend/uploads:/app/backend/uploads
      - ./backend/storage/transfers:/app/backend/storage/transfers
    environment:
      # Mevcut değişkenlere ek:
      TRANSFER_STORAGE_DIR: /app/backend/storage/transfers
      TRANSFER_MAX_FILE_SIZE_MB: 2048
      TRANSFER_MAX_TOTAL_GB: 50
      TRANSFER_DEFAULT_EXPIRY_DAYS: 3
```

### 4.2. `nginx.conf` Güncellemesi
Mevcut `nginx.conf` içinde global `client_max_body_size 500M;` bulunmaktadır. 2 GB yüklemelerin kesilmeden ve Nginx diske çift kopya yapmadan geçmesi için **sadece transfer endpoint’ine özel** `location` bloğu eklenir (`/api/` bloğunun **üstüne** yerleştirilir):

```nginx
        location /api/transfer/ {
            set $backend_url http://backend:3005;
            proxy_pass $backend_url;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

            # 2 GB+ dosya desteği
            client_max_body_size 2100M;

            # Nginx'in 2 GB dosyayı önce kendi diskine tamponlamasını engelle (doğrudan backend'e akıt)
            proxy_request_buffering off;
            proxy_buffering off;

            # Büyük dosya yükleme/indirme zaman aşımı koruması (30 dk)
            proxy_connect_timeout 60s;
            proxy_send_timeout 1800s;
            proxy_read_timeout 1800s;
            send_timeout 1800s;
        }
```

> **Not:** SSL (HTTPS) bloğu aktif edildiğinde aynı `location /api/transfer/` bloğu `443` server bloğuna da eklenir.

---

## 5. Adım 3 — Backend Geliştirme

### 5.1. Oluşturulacak Dosyalar
1. `backend/src/services/transferService.ts` — İş mantığı, şifre hash/doğrulama, disk kota hesaplama, fiziksel silme, süre dolumu temizliği.
2. `backend/src/routes/transfer.ts` — Express route tanımları, Multer yapılandırması, rate-limit, stream indirme.
3. `backend/src/index.ts` — `app.use('/api/transfer', transferRoutes);` bağlantısı.

### 5.2. Modül Yetkilendirme Middleware'i (Yükleme Korumalı / İndirme Herkese Açık)
Mevcut `backend/src/middleware/auth.ts` yapısındaki `req.user.modules` ve `isAdmin` alanları doğrudan kullanılır:
- **Yükleme, listeleme, silme ve mail gönderme endpoint'leri:**
  - `authMiddleware` + `transferModuleMiddleware` zorunludur.
  - `transferModuleMiddleware` kontrolü: `req.user.isAdmin || req.user.isManagement || req.user.modules?.includes('FILE_TRANSFER')`.
  - Yetkisi yoksa `403 Forbidden` döner; böylece yetkisiz kişiler API üzerinden bile sunucuya dosya yükleyemez ve disk şişmesi tamamen engellenir.
- **İndirme ve link bilgi endpoint'leri (`:token/info`, `:token/verify-password`, `:token/download`):**
  - Tamamen **Public** kalır; giriş yapmamış kurum ağı kullanıcıları linke tıklayıp doğrudan indirebilir.
- **Yönetici (Admin) Yetkisi:**
  - Normal kullanıcılar yalnızca kendi yükledikleri dosyaları görür ve silebilir.
  - `isAdmin` kullanıcılar tüm aktif transferleri görebilir, disk kullanımını izleyebilir ve gerekirse herhangi bir dosyayı silebilir.

### 5.3. Multer Yapılandırması (`diskStorage`)
- Hedef klasör uygulama açılışında otomatik oluşturulur (`fs.mkdirSync(TRANSFER_STORAGE_DIR, { recursive: true })`).
- Diskteki dosya adı: `${crypto.randomUUID()}${safeExt}` (orijinal dosya adındaki Türkçe karakter/özel karakter/path traversal riskini tamamen ortadan kaldırır; orijinal ad sadece DB’de ve `Content-Disposition` başlığında tutulur).
- Limit: `limits: { fileSize: 2 * 1024 * 1024 * 1024 }` (2 GB).
- Yükleme öncesi mevcut klasör toplam boyutu kontrol edilir; `TRANSFER_MAX_TOTAL_GB` (50 GB) aşılacaksa yükleme reddedilir (`507 Insufficient Storage`).
- Bağlantı kopması (`req.on('aborted')`) veya hata durumunda kısmi dosya diskten silinir.

### 5.4. API Endpoint Listesi

| Method | Endpoint | Erişim | Açıklama |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/transfer/upload` | Auth + `FILE_TRANSFER` | Multipart dosya yükleme (`file`, `expiryDays`, `password?`, `maxDownloads?`, `note?`). Oluşan `token`, `expiresAt`, `hasPassword` bilgisini döner. |
| `GET` | `/api/transfer/:token/info` | **Public** | İndirme sayfası için metadata döner: `originalName`, `sizeBytes`, `mimeType`, `expiresAt`, `hasPassword`, `downloadCount`, `maxDownloads`, `note`, `status` (`active` / `expired` / `limit_reached` / `not_found`). |
| `POST` | `/api/transfer/:token/verify-password` | **Public** | Şifreli dosyalarda şifreyi doğrular, 60 sn geçerli tek kullanımlık `downloadTicket` döner (IP + token rate-limit korumalı). |
| `GET` | `/api/transfer/:token/download` | **Public** | Şifresiz dosyalarda doğrudan, şifreli dosyalarda `?ticket=<downloadTicket>` ile dosyayı stream ederek indirir ve `downloadCount` değerini 1 artırır. |
| `GET` | `/api/transfer/my` | Auth + `FILE_TRANSFER` | Kullanıcının kendi yüklediği (Admin için isteğe bağlı tüm) aktif/geçmiş transferleri listeler. |
| `DELETE` | `/api/transfer/:id` | Auth + `FILE_TRANSFER` | Yükleyen kişi (veya Admin) dosyayı süresinden önce diskten siler ve linki iptal eder. |
| `POST` | `/api/transfer/:id/send-email` | Auth + `FILE_TRANSFER` | *(Opsiyonel)* Mevcut `nodemailer` SMTP altyapısıyla alıcı e-posta adresine indirme linkini (ve kullanıcı isterse şifreyi) gönderir. |

> **Önemli Tarayıcı İndirme Detayı (2 GB Dosya İçin):**
> Şifreli bir 2 GB dosyayı `fetch/axios` ile `blob` olarak çekmek tarayıcı RAM’ini doldurup sekmenin çökmesine yol açabilir. Bunun yerine:
> 1. `POST /api/transfer/:token/verify-password` ile şifre doğrulanır ve **60 saniye geçerli tek kullanımlık kısa bir indirme bileti (`downloadTicket`)** dönülür.
> 2. Tarayıcı doğrudan `window.location.href = /api/transfer/:token/download?ticket=<downloadTicket>` adresine yönlendirilir.
> 3. Böylece 2 GB’lık dosya tarayıcının kendi indirme yöneticisiyle **sıfır RAM yüküyle** ve yerel indirme çubuğuyla indirilir!

---

## 6. Adım 4 — Otomatik Süre Dolumu ve Disk Temizliği (`backend/src/jobs/cronTasks.ts`)

Mevcut `backend/src/jobs/cronTasks.ts` içindeki `startCronJobs()` fonksiyonuna **saatlik** bir temizlik görevi eklenir (`0 * * * *` — her saat başı çalışır):

1. **Süresi Dolan Kayıtları Bul:**
   - `isDeleted: false` VE `expiresAt <= new Date()` olan tüm `FileTransfer` kayıtlarını çek.
   - *(Ayrıca `maxDownloads != null` ve `downloadCount >= maxDownloads` olup üzerinden 5 dakika geçmiş kayıtları da dahil et.)*
2. **Fiziksel Dosyayı Sil:**
   - Her kayıt için `path.join(TRANSFER_STORAGE_DIR, record.storedName)` dosyasını `fs.promises.unlink` ile diskten sil (dosya zaten yoksa `ENOENT` hatasını sessizce geç).
3. **Veritabanını Güncelle:**
   - Kaydın `isDeleted = true`, `deletedAt = new Date()` alanlarını güncelle (log/istatistik amacıyla kayıt tutulur, dosya diskte yer kaplamaz).
4. **Yetim Dosya (Orphan File) Temizliği (Günde 1 kez, 03:00):**
   - `TRANSFER_STORAGE_DIR` içindeki fiziksel dosyaları tara; veritabanında aktif kaydı olmayan ve 24 saatten eski sahipsiz/yarım kalmış dosyaları diskten temizle.
5. **Loglama:**
   - `[CRON][Transfer] X adet süresi dolmuş dosya temizlendi, Y MB disk alanı açıldı.` şeklinde konsol logu bas.

---

## 7. Adım 5 — Frontend Geliştirme (`apps/web/src/`)

### 7.1. Oluşturulacak Dosyalar
1. `apps/web/src/services/transferApi.ts` — Yükleme (`onUploadProgress` destekli), bilgi sorgulama, şifre doğrulama, listeleme, silme ve mail gönderme API istemcisi.
2. `apps/web/src/pages/transfer/TransferUploadPage.tsx` — `/transfer` sayfası.
3. `apps/web/src/pages/transfer/TransferDownloadPage.tsx` — `/transfer/:token` herkese açık indirme sayfası.
4. `apps/web/src/App.tsx` — Route tanımları.

### 7.2. `/transfer` — Yükleme ve Paylaşım Ekranı Tasarımı
- **Header:** Sade başlık ("Kurumsal Dosya Transferi"), maksimum dosya boyutu rozeti (`Maks. 2 GB`) ve varsayılan saklama bilgisi (`3 Gün Otomatik Silinme`).
- **Dosya Seçim Alanı (Dropzone):**
  - Sürükle-bırak veya tıklayıp seçme.
  - Seçilen dosyanın adı, boyutu (okunaklı format: `1.42 GB`), türü ve "Değiştir / Kaldır" butonu.
  - 2 GB üzeri dosya seçilirse yüklemeye başlamadan anında istemci tarafında uyarı verir.
- **Paylaşım Seçenekleri:**
  - **Saklama Süresi:** `1 Gün` | `3 Gün (Varsayılan)` | `7 Gün`
  - **Şifre Koruması (Switch/Toggle):**
    - Açıldığında şifre inputu görünür.
    - Yanında **"Rastgele Güçlü Şifre Üret"** butonu (ör. `K7mP-9xR2-Qp4L` gibi okunması kolay, karışık karakter içermeyen format) ve göster/gizle göz ikonu.
  - **İndirme Limiti (Opsiyonel):** `Sınırsız` | `1 İndirme` | `5 İndirme` | `10 İndirme`
  - **Kısa Not (Opsiyonel):** Alıcıya mesaj (ör. "Bina 2 yangın projesi son revizyon").
- **Yükleme Aşaması:**
  - Canlı yüzde (`%64`), yüklenen/toplam (`912 MB / 1.42 GB`), anlık aktarım hızı (`48 MB/sn`), tahmini kalan süre (`~11 sn`) ve **"İptal Et"** (`AbortController`) butonu.
- **Yükleme Sonrası Sonuç Kartı (En Kritik UX Kısmı):**
  - Yeşil başarı başlığı + son geçerlilik tarihi (ör. `22 Kasım 2026, 00:25 tarihine kadar geçerli`).
  - **İndirme Linki Kutusu:** `http://10.234.2.101/transfer/<token>` + tek tıkla **"Linki Kopyala"** butonu (`sonner` toast bildirimi ile).
  - **Şifre Kutusu (şifre konulduysa):** Şifre + **"Şifreyi Kopyala"** butonu.
  - **Öne Çıkan Aksiyon:** **"Link ve Şifreyi Birlikte Kopyala"** butonu — panoya doğrudan mail/mesaja yapıştırılacak temiz bir metin kopyalar:
    ```text
    Dosya: Proje_Dosyasi.zip (1.42 GB)
    İndirme Linki: http://10.234.2.101/transfer/x9Kp2mQ7rT4v
    Şifre: K7mP-9xR2-Qp4L
    Son Geçerlilik: 22.11.2026 00:25 (3 gün sonra otomatik silinir)
    ```
  - **"Yeni Dosya Yükle"** butonu ve *(opsiyonel)* **"E-posta ile Gönder"** modalı.
- **Alt Bölüm — Aktif Transferlerim:**
  - Kullanıcının kendi yüklediği (Admin için isteğe bağlı tüm kullanıcıların) aktif linklerini, kalan süresini, kaç kez indirildiğini gösteren sade liste + **Linki Kopyala** + **Hemen Sil** butonları.

### 7.3. `/transfer/:token` — Herkese Açık İndirme Ekranı Tasarımı
- **Tamamen Public:** `ProtectedRoute` ve `AppLayout` dışında, temiz ve sade ortalanmış bir kart tasarımıyla açılır (login ekranına yönlendirmez).
- **Gösterilen Bilgiler:**
  - Dosya ikonu, orijinal dosya adı, dosya boyutu (`1.42 GB`).
  - Varsa gönderici notu.
  - Kalan süre bilgisi (ör. `2 gün 14 saat içinde otomatik silinecek`).
- **Durum Yönetimi:**
  - **Şifresiz dosya:** Doğrudan büyük **"Dosyayı İndir"** butonu.
  - **Şifreli dosya:** Kilit ikonu + şifre alanı + **"Doğrula ve İndir"** butonu (yanlış şifrede anlaşılır hata mesajı).
  - **Süresi dolmuş / silinmiş / indirme limiti dolmuş / geçersiz link:** Temiz bilgilendirme ekranı ("Bu dosyanın süresi dolmuş veya gönderici tarafından silinmiştir.").

### 7.4. Router (`apps/web/src/App.tsx`), Yetki Tanımı ve Portal Giriş Entegrasyonu
- **Route ayrımı (`App.tsx`):**
  - `/transfer` → `<ProtectedRoute><AppLayout><TransferUploadPage /></AppLayout></ProtectedRoute>` (yalnızca giriş yapmış ve `FILE_TRANSFER` modül yetkisi olan kullanıcılar erişir).
  - `/transfer/:token` → **Public Route** (`ProtectedRoute` ve `AppLayout` dışında `<TransferDownloadPage />` — giriş yapmamış herkes indirir).
- **Modül yetki tanımı:**
  - `apps/web/src/components/ProtectedRoute.tsx` içine:
    `else if (location.pathname === '/transfer') requiredModule = 'FILE_TRANSFER';`
  - Kullanıcı düzenleme ekranındaki (`apps/web/src/pages/settings/UserEditPage.tsx`) modül izinleri listesine **`FILE_TRANSFER` ("Dosya Transfer")** seçeneği eklenir; böylece yöneticiler hangi kullanıcının dosya yükleyebileceğini tek tıkla açıp kapatabilir.
- **Portal menüsü:** `PortalPage.tsx` içinde yalnızca `FILE_TRANSFER` yetkisi (veya Admin) olan kullanıcılara **"Dosya Transfer"** kartı gösterilir.

---

## 8. Adım 6 — Test ve Doğrulama Kontrol Listesi

Geliştirme tamamlandıktan sonra sırayla şu testler çalıştırılır:

1. **Temel Yükleme & İndirme Testi:**
   - Küçük bir dosya (PDF/ZIP) yüklenir → oluşan link yeni gizli sekmede (oturumsuz) açılır → doğrudan indirildiği doğrulanır.
2. **Şifreli Paylaşım Testi:**
   - Şifre üretilerek dosya yüklenir → yanlış şifre ile indirme reddedilir (`401`) → doğru şifre ile tek kullanımlık ticket üzerinden tarayıcı indirmesi başlar.
   - 10+ kez üst üste yanlış şifre denenir → rate-limit (`429`) devreye girdiği doğrulanır.
3. **2 GB Büyük Dosya Stres Testi:**
   - ~1.5–2 GB boyutunda test dosyası yüklenir:
     - Nginx `413 Request Entity Too Large` veya `504 Gateway Timeout` vermemeli.
     - İlerleme çubuğu akıcı ilerlemeli.
     - Yükleme ve indirme sırasında `docker stats` ile backend RAM kullanımı kontrol edilir (sabit/düşük kalmalı).
4. **İptal ve Yarım Kalan Dosya Testi:**
   - Büyük dosya yüklenirken yarıda "İptal Et" veya sekme kapatma yapılır → `backend/storage/transfers` klasöründe çöp dosya kalmadığı doğrulanır.
5. **Güvenlik Testi (Direct Access Bypass):**
   - `/uploads/...` üzerinden transfer dosyasına erişilemediği doğrulanır.
   - Şifreli dosyanın `GET /api/transfer/:token/download` endpoint’ine biletsiz istek atıldığında `403` döndüğü doğrulanır.
6. **Otomatik Silme (Cron) Testi:**
   - Bir test kaydının `expiresAt` değeri geçmiş bir tarihe çekilir → temizlik fonksiyonu tetiklenir → fiziksel dosyanın diskten silindiği ve linkin "Süresi dolmuş" ekranı gösterdiği doğrulanır.
7. **Kopyalama UX Testi:**
   - HTTP (SSL’siz `http://10.234.2.101`) ortamında `navigator.clipboard` kısıtlaması olabileceği için **fallback (`document.execCommand('copy')`)** kopyalama mekanizmasının çalıştığı özellikle test edilir! *(Lokal IP üzerinden HTTP ile çalışan uygulamalarda kritik detaydır.)*

---

## 9. Adım 7 — Canlıya Alma (Deployment) Adımları

1. `backend/storage/transfers` klasörünün sunucuda oluşturulduğundan ve yazma izinlerinin düzgün olduğundan emin olunur.
2. `docker-compose.yml` ve `nginx.conf` değişiklikleri uygulanır.
3. Prisma şeması güncellenir (`npx prisma db push`).
4. Konteynerler yeniden derlenip ayağa kaldırılır:
   ```bash
   docker compose up -d --build backend frontend nginx
   ```
5. `docker compose logs -f backend` ile cron görevinin başladığı ve `nginx -t` ile Nginx konfigürasyonunun hatasız olduğu doğrulanır.

---

## 10. Opsiyonel Faz 2 Geliştirmeleri (İleride İstenirse)

- **Çoklu Dosya Yükleme:** Birden fazla dosya seçildiğinde sunucuda veya tarayıcıda otomatik `.zip` olarak paketleme.
- **İndirme Bildirimi:** Alıcı dosyayı indirdiğinde yükleyen kişiye e-posta/portal bildirimi gönderme.
- **Yönetici Disk Özeti:** Admin panelinde toplam kullanılan transfer alanı, aktif dosya sayısı ve tek tıkla toplu temizlik ekranı.
- **Parçalı (Chunked) Yükleme:** İleride 2 GB’ın da üzerine (5–10 GB) çıkılmak istenirse yüklemeyi 50 MB’lık parçalara bölerek kopma durumunda kaldığı yerden devam etme desteği.
