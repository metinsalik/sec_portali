# SEÇ Portalı — Sıfırdan Kurulum ve Felaket Kurtarma (Yedekten Geri Yükleme) Rehberi

Bu rehber, canlı sunucunun arızalanması veya yeni bir bilgisayara/sunucuya geçiş yapılması durumunda **SEÇ Portalı**'nın GitHub'dan sıfırdan kurulması ve yedeklerin eksiksiz geri yüklenmesi için hazırlanmıştır. Teknik bilgisi olmayan bir kullanıcı bile adımları sırasıyla uygulayarak sistemi tamamen ayağa kaldırabilir.

---

## Kurulum Öncesi Elinizde Olması Gerekenler

Yeni sunucuda/bilgisayarda kurulum yapmadan önce şu dosyaların elinizde olduğundan emin olun:

1. **Son Yedek Dosyaları** (OneDrive `SEC_Portali_Backup` klasörünüzden veya harici diskten):
   - `db_latest.sql.gz` *(Tüm veritabanı tabloları ve kayıtları)*
   - `uploads_latest.tar.gz` *(Yüklenen tüm fotoğraf ve belgeler)*
2. **Ortam Değişkenleri Dosyası (`.env`)** *(Canlı sunucu ayarları: `DB_PASSWORD`, `JWT_SECRET`, `SMTP_*`, `FRONTEND_URL` vb. — elinizde yoksa Adım 3'teki şablondan oluşturabilirsiniz).*
3. *(Varsa)* **SSL Sertifika Klasörü (`ssl/`)** *(HTTPS kullanılıyorsa).*

---

## Adım 1 — Gerekli Programları Kurun

Yeni bilgisayarda/sunucuda aşağıdakilerin kurulu olması gerekir:

1. **Docker Desktop** (Windows için): https://www.docker.com/products/docker-desktop/
   - Kurulum sırasında **WSL 2** seçeneğini işaretli bırakın.
   - Kurulum bitince bilgisayarı yeniden başlatın ve **Docker Desktop**'ı açıp sol altta **Engine running** (yeşil) olmasını bekleyin.
2. **Git** (GitHub'dan kod çekmek için): https://git-scm.com/downloads
   - *(Git kurmak istemezseniz GitHub sayfasından **Code → Download ZIP** ile indirip klasöre çıkartabilirsiniz.)*

---

## Adım 2 — Projeyi GitHub'dan İndirin

Komut İstemi (**CMD**) veya **Ubuntu/WSL** terminalini açın ve projenin kurulacağı klasöre (örneğin Masaüstü) gidin:

```bash
cd Desktop
git clone https://github.com/<KULLANICI_ADI>/sec_portali.git
cd sec_portali
```

> **Not:** GitHub'dan ZIP indirip açtıysanız klasör adı genelde `sec_portali-main` olur; tüm komutları o klasörün içinde çalıştırın.

---

## Adım 3 — `.env` Dosyasını Hazırlayın

Proje ana klasöründe (`.env` dosyası yoksa) bir `.env` dosyası oluşturun ve aşağıdaki değerleri doldurun:

```env
DB_PASSWORD=guclu_bir_veritabani_sifresi
JWT_SECRET=uzun_rastgele_bir_gizli_anahtar
NTLM_ENABLED=false
DEV_USER=
NODE_ENV=production
FRONTEND_URL=http://localhost
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
```

> **Önemli:** Eski `.env` dosyanızın yedeği varsa doğrudan proje ana klasörüne kopyalamanız yeterlidir.

---

## Adım 4 — Sistemi İlk Kez Docker ile Başlatın (Boş Kurulum)

Proje ana klasörünün içinde şu komutu çalıştırın:

```bash
docker compose up -d --build
```

- İlk kurulum internet hızına bağlı olarak **3–8 dakika** sürebilir.
- İşlem bitince tüm servislerin ayakta olduğunu kontrol edin:

```bash
docker ps
```

Aşağıdaki **5 servisin** `Up` (ve `postgres` için `healthy`) durumda olduğunu görmelisiniz:
- `...-postgres-1` *(Veritabanı)*
- `...-backend-1` *(API Sunucusu)*
- `...-frontend-1` *(Web Arayüzü)*
- `...-nginx-1` *(Web Proxy — Port 80/443)*
- `...-adminer-1` *(Veritabanı Yönetim Arayüzü — Port 8080)*

> **Not:** `docker ps` çıktısındaki **postgres container adını** bir kenara not alın. Klasör adına göre `sec_portali-postgres-1` veya `sec_portali-main-postgres-1` şeklinde görünür.

---

## Adım 5 — Yedek Dosyalarını `backups` Klasörüne Kopyalayın

1. Proje ana klasörünün içinde `backups` klasörü yoksa oluşturun:
   - Örnek (Windows): `C:\Users\Administrator\Desktop\sec_portali-main\backups`
   - Örnek (WSL/Linux): `mkdir -p backups`
2. Elinizdeki şu **2 dosyayı** bu `backups` klasörünün içine kopyalayın:
   - `db_latest.sql.gz`
   - `uploads_latest.tar.gz`

---

## Adım 6 — Yedeği Geri Yükleyin

Kullandığınız ortama göre **Seçenek A (Linux / WSL)** veya **Seçenek B (Windows CMD)** adımlarından yalnızca birini uygulayın.

### Seçenek A — Linux veya Windows WSL (Ubuntu Terminali) Kullanıyorsanız *(En Kolay Yol)*

Proje ana klasöründe sırasıyla şu komutları çalıştırın:

```bash
# 1. Backend'i geçici durdur (veritabanı yüklenirken kilitlenmesin)
docker compose stop backend

# 2. Yedek geri yükleme scriptine izin ver ve çalıştır
chmod +x restore.sh backup.sh setup-auto-backup.sh
./restore.sh
```

- Ekranda *"DİKKAT: Mevcut veritabanı ve fotoğrafların üzerine seçilen yedek yazılacaktır! Devam edilsin mi? (e/h):"* sorusu çıktığında **`e`** yazıp Enter'a basın.
- Script hem veritabanını (`db_latest.sql.gz`) hem de tüm fotoğraf/belgeleri (`uploads_latest.tar.gz`) otomatik geri yükleyecektir.

```bash
# 3. Backend'i tekrar başlat ve nginx'i yenile
docker compose start backend
docker compose restart nginx
```

---

### Seçenek B — Windows CMD (Komut İstemi) Kullanıyorsanız

Proje ana klasöründe **CMD** açıp aşağıdaki komutları sırasıyla çalıştırın.

> **Dikkat:** Aşağıdaki komutlarda `POSTGRES_CONTAINER_ADI` yazan yere Adım 4'te `docker ps` çıktısında gördüğünüz adı yazın (genellikle `sec_portali-postgres-1` veya `sec_portali-main-postgres-1`).

```bat
:: 1. Backend'i geçici durdur (veritabanı yüklenirken kilitlenmesin)
docker compose stop backend

:: 2. Veritabanı yedeğini postgres container'ına kopyala
docker cp "backups\db_latest.sql.gz" POSTGRES_CONTAINER_ADI:/tmp/db_latest.sql.gz

:: 3. Veritabanını geri yükle ve geçici dosyayı sil
docker exec POSTGRES_CONTAINER_ADI sh -c "gunzip -c /tmp/db_latest.sql.gz | psql -U isguser -d isgdb && rm -f /tmp/db_latest.sql.gz"

:: 4. Fotoğraf ve belgeleri backend/uploads içine çıkar
tar -xzf "backups\uploads_latest.tar.gz" -C "backend"

:: 5. Backend'i tekrar başlat ve nginx'i yenile
docker compose start backend
docker compose restart nginx
```

> **Sadece Test / Lokal Bilgisayara Yüklüyorsanız (Önemli Güvenlik Adımı):**
> Yedeği canlı sunucuya değil de kendi test bilgisayarınıza yüklediyseniz, lokal bilgisayarınızın canlı Telegram botuyla çakışmaması için Step 5'ten önce şu komutu çalıştırıp Telegram botunu lokalde pasife çekin:
> ```bat
> docker exec POSTGRES_CONTAINER_ADI psql -U isguser -d isgdb -c "UPDATE \"TelegramSettings\" SET \"isActive\" = false;"
> ```

---

## Adım 7 — Kurulumu Doğrulayın

1. Tarayıcıdan sisteme girin (`http://localhost` veya sunucu adresi).
2. Kullanıcı adınız ve şifrenizle giriş yapın.
3. Şu kontrolleri yapın:
   - Tesisler, çalışan sayıları ve `/panel/dashboard` verileri eksiksiz geliyor mu?
   - İyileştirme / denetim kayıtlarındaki **fotoğraflar ve belgeler** açılıyor mu?
4. Herhangi bir hata alırsanız backend loglarını kontrol edin:
   ```bash
   docker compose logs --tail=50 backend
   ```

---

## Adım 8 — Otomatik Günlük Yedeklemeyi Yeniden Kurun (Canlı Sunucu İçin)

Yeni kurduğunuz bilgisayar **canlı sunucu** ise, her gün saat **18:00**'de otomatik yedek alınması için WSL/Linux terminalinde tek seferlik şu komutu çalıştırın:

```bash
chmod +x backup.sh restore.sh setup-auto-backup.sh
./setup-auto-backup.sh
```

- Bu işlem ilk tam yedeği hemen alır, bütünlüğünü doğrular ve her gün saat 18:00 için otomatik zamanlayıcıyı (`cron`) kurar.
- Diskin şişmemesi için her zaman yalnızca en güncel tam yedek (`db_latest.sql.gz` ve `uploads_latest.tar.gz`) saklanır, eskiler otomatik silinir.
- Zamanlayıcının kurulduğunu doğrulamak için: `crontab -l`

---

## Sık Karşılaşılan Sorunlar ve Çözümleri

| Sorun | Sebep | Çözüm |
|---|---|---|
| Giriş yaparken `500 Internal Server Error` (`column ... does not exist`) | Yedek eski bir şemadan alınmış, yeni tablo/sütunlar eksik | `docker compose restart backend` çalıştırın (`entrypoint.sh` otomatik olarak `prisma db push` çalıştırıp eksik sütunları ekler). |
| `docker cp` komutu `No such container` hatası veriyor | Container adı klasör adına göre değişmiştir | `docker ps --format "{{.Names}}"` ile tam postgres container adını öğrenip komutta onu kullanın. |
| Fotoğraflar kırık (yüklenmiyor) görünüyor | `uploads_latest.tar.gz` çıkarılmamış veya yanlış klasöre çıkarılmış | `backend/uploads` klasörünün içinde dosyaların olduğunu kontrol edin; yoksa Adım 6'daki `tar -xzf ... -C backend` komutunu tekrarlayın. |
| Sayfa eski sürümde kalıyor veya `502 Bad Gateway` veriyor | Nginx, yeniden başlayan backend/frontend IP'sini önbellekte tutmuş | `docker compose restart nginx` çalıştırın. |
| Manuel anlık yedek almak istiyorum | — | Linux/WSL terminalinde `./backup.sh` çalıştırın. |
