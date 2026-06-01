# MLPCARE SEÇ Portalı — Workflow (İş Takip) Modülü

## Mevcut Sistem

- **Frontend:** React + TypeScript + Vite (`./frontend/src/`)
- **Backend:** Node.js (`./backend/`, port 3005)
- **Veritabanı:** PostgreSQL 16 (`isgdb`)
- **Auth:** JWT + NTLM (Active Directory)
- **Email:** SMTP entegrasyonu mevcut
- **Proxy:** Nginx
- **Kullanıcılar:** Merkezi sistemden geliyor (NTLM/AD üzerinden)

## Görev

Mevcut sisteme sıfırdan **Workflow (İş Takip)** modülü ekle.  
Frontend + Backend + Veritabanı şeması eksiksiz yazılsın.  
Mevcut auth, kullanıcı sistemi ve SMTP altyapısı kullanılsın.

---

## 1. Rol & Hiyerarşi Sistemi

Kullanıcılar merkezi sistemden (AD/NTLM) gelir. Her kullanıcının sistem rolünden **bağımsız**, sadece bu modülde geçerli bir rolü olur.

### Hiyerarşi

```
Direktör
  └── Müdür
        └── Sorumlu
              └── Üye
                    (İzleyici — atanmadan sadece takip eder)
```

### Yetki Matrisi

| İşlem | Direktör | Müdür | Sorumlu | Üye | İzleyici |
|-------|----------|-------|---------|-----|---------|
| Tüm işleri gör | ✅ | ❌ | ❌ | ❌ | ✅ |
| Kendi ekibini gör | ✅ | ✅ | ✅ | ❌ | ✅ |
| İş oluştur | ✅ | ✅ | ✅ | ✅ | ❌ |
| Herkese ata | ✅ | ❌ | ❌ | ❌ | ❌ |
| Ekibine ata | ✅ | ✅ | ✅ | ❌ | ❌ |
| Havuzdan iş al | ✅ | ✅ | ✅ | ✅ | ❌ |
| İş sil | ✅ | ❌ | ❌ | ❌ | ❌ |
| Modül ayarlarını düzenle | ✅ | ❌ | ❌ | ❌ | ❌ |
| Kullanıcıya rol ata | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 2. Veritabanı Şeması

Tüm tablolar mevcut `isgdb` veritabanına eklenir.

```sql
-- Departmanlar
CREATE TABLE workflow_departments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  manager_id INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Modül bazlı kullanıcı rolleri
CREATE TABLE workflow_user_roles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  module_role VARCHAR(50) NOT NULL CHECK (module_role IN ('DIREKTOR','MUDUR','SORUMLU','UYE','IZLEYICI')),
  department_id INTEGER REFERENCES workflow_departments(id),
  reports_to INTEGER, -- üst yönetici user_id
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- İş kategorileri
CREATE TABLE workflow_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  color VARCHAR(7),
  icon VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Etiketler
CREATE TABLE workflow_tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7)
);

-- Ana iş tablosu
CREATE TABLE workflow_tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW','MEDIUM','HIGH','CRITICAL')),
  status VARCHAR(30) NOT NULL DEFAULT 'BEKLIYOR' CHECK (status IN ('BEKLIYOR','DEVAM','TAMAMLANDI','YARIM_KALDI','IPTAL')),
  category_id INTEGER REFERENCES workflow_categories(id),
  department_id INTEGER REFERENCES workflow_departments(id),
  created_by INTEGER NOT NULL,
  due_date TIMESTAMP,
  alarm_date TIMESTAMP,
  is_pool BOOLEAN DEFAULT FALSE, -- havuz işi mi
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- İş-Etiket ilişkisi
CREATE TABLE workflow_task_tags (
  task_id INTEGER REFERENCES workflow_tasks(id) ON DELETE CASCADE,
  tag_id INTEGER REFERENCES workflow_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, tag_id)
);

-- Çoklu atama (ASSIGNEE: atanan, WATCHER: izleyici)
CREATE TABLE workflow_task_assignments (
  id SERIAL PRIMARY KEY,
  task_id INTEGER REFERENCES workflow_tasks(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'ASSIGNEE' CHECK (role IN ('ASSIGNEE','WATCHER')),
  assigned_by INTEGER NOT NULL,
  assigned_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Durum geçmişi (audit log)
CREATE TABLE workflow_task_history (
  id SERIAL PRIMARY KEY,
  task_id INTEGER REFERENCES workflow_tasks(id) ON DELETE CASCADE,
  changed_by INTEGER NOT NULL,
  old_status VARCHAR(30),
  new_status VARCHAR(30),
  note TEXT,
  changed_at TIMESTAMP DEFAULT NOW()
);

-- Yorumlar
CREATE TABLE workflow_task_comments (
  id SERIAL PRIMARY KEY,
  task_id INTEGER REFERENCES workflow_tasks(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Alarmlar
CREATE TABLE workflow_alarms (
  id SERIAL PRIMARY KEY,
  task_id INTEGER REFERENCES workflow_tasks(id) ON DELETE CASCADE,
  alarm_date TIMESTAMP NOT NULL,
  alarm_type VARCHAR(20) NOT NULL CHECK (alarm_type IN ('EMAIL','TELEGRAM','WHATSAPP','INAPP')),
  is_sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP,
  created_by INTEGER NOT NULL
);

-- Kullanıcı bildirim kanal ayarları
CREATE TABLE workflow_notification_settings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE,
  telegram_chat_id VARCHAR(100),
  whatsapp_number VARCHAR(20),
  notify_on_assign BOOLEAN DEFAULT TRUE,
  notify_on_status_change BOOLEAN DEFAULT TRUE,
  notify_on_alarm BOOLEAN DEFAULT TRUE,
  notify_on_comment BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 3. Backend

### Middleware

Mevcut JWT middleware'e `getWorkflowRole(userId)` fonksiyonu ekle.  
Her workflow route'unda modül rolü kontrol edilsin.

```
backend/src/
  ├── middleware/
  │     └── workflowAuth.js       # Modül rol kontrolü
  ├── routes/
  │     └── workflow/
  │           ├── index.js
  │           ├── tasks.js
  │           ├── settings.js
  │           ├── dashboard.js
  │           └── notifications.js
  ├── services/
  │     └── notificationService.js
  └── jobs/
        └── alarmJob.js
```

### API Endpoint'leri

#### Ayarlar & Rol Yönetimi
```
GET    /api/workflow/settings/users              # Tüm sistem kullanıcıları + workflow rolleri
POST   /api/workflow/settings/users/:id/role     # Kullanıcıya modül rolü ata
GET    /api/workflow/settings/departments        # Departman listesi
POST   /api/workflow/settings/departments        # Departman oluştur
PUT    /api/workflow/settings/departments/:id    # Departman güncelle
DELETE /api/workflow/settings/departments/:id    # Departman sil
GET    /api/workflow/settings/hierarchy          # Org ağacı (kim kimin altında)
GET    /api/workflow/settings/categories         # Kategori listesi
POST   /api/workflow/settings/categories         # Kategori oluştur
PUT    /api/workflow/settings/categories/:id
DELETE /api/workflow/settings/categories/:id
GET    /api/workflow/settings/tags               # Etiket listesi
POST   /api/workflow/settings/tags
PUT    /api/workflow/settings/tags/:id
DELETE /api/workflow/settings/tags/:id
```

#### Görev (Task) CRUD
```
GET    /api/workflow/tasks                       # Rol bazlı filtrelenmiş liste
POST   /api/workflow/tasks                       # Yeni iş oluştur
GET    /api/workflow/tasks/:id                   # İş detayı
PUT    /api/workflow/tasks/:id                   # Güncelle
DELETE /api/workflow/tasks/:id                   # Sil (sadece DIREKTOR)
PATCH  /api/workflow/tasks/:id/status            # Durum değiştir
GET    /api/workflow/tasks/pool                  # İş havuzu (is_pool=true)
POST   /api/workflow/tasks/:id/claim             # Havuzdan iş al
```

#### Atama
```
POST   /api/workflow/tasks/:id/assign            # Kişi ata (ASSIGNEE veya WATCHER)
DELETE /api/workflow/tasks/:id/assign/:userId    # Atamayı kaldır
```

#### Yorumlar & Geçmiş
```
GET    /api/workflow/tasks/:id/comments          # Yorum listesi
POST   /api/workflow/tasks/:id/comments          # Yorum ekle
DELETE /api/workflow/tasks/:id/comments/:cid     # Yorum sil
GET    /api/workflow/tasks/:id/history           # Audit log
```

#### Dashboard
```
GET    /api/workflow/dashboard/my-tasks          # Bana atanan işler
GET    /api/workflow/dashboard/team              # Ekip özeti (Müdür ve üstü)
GET    /api/workflow/dashboard/overview          # Genel bakış (Direktör)
```

#### Bildirim Ayarları
```
GET    /api/workflow/notifications/settings      # Kullanıcının bildirim ayarları
PUT    /api/workflow/notifications/settings      # Güncelle
POST   /api/workflow/notifications/test          # Test bildirimi gönder
```

### Bildirim Servisi

`backend/src/services/notificationService.js` dosyası oluşturulsun:

```javascript
NotificationService
  ├── sendInApp(userId, message)
  ├── sendEmail(userId, subject, body)      // Mevcut SMTP kullan
  ├── sendTelegram(chatId, message)         // Telegram Bot API
  └── sendWhatsApp(phone, message)          // Twilio veya Meta Cloud API
```

Tetikleyiciler:
- İş atandığında → atanana bildirim
- Durum değiştiğinde → atananlara + izleyicilere bildirim
- Yorum eklendiğinde → atananlara + izleyicilere bildirim
- Alarm zamanı geldiğinde → ilgili kanallara bildirim

### Alarm Scheduler

`backend/src/jobs/alarmJob.js` dosyası oluşturulsun:

- `node-cron` ile her 15 dakikada bir çalışsın
- `workflow_alarms` tablosunu kontrol etsin
- `alarm_date <= NOW()` ve `is_sent = false` olan alarmları göndersin
- Gönderi sonrası `is_sent = true`, `sent_at = NOW()` olarak güncelle

---

## 4. Frontend

### Dosya Yapısı

```
src/pages/workflow/
  ├── WorkflowPage.tsx              # Ana sayfa (görünüm seçici)
  ├── BoardView.tsx                 # Kanban board (sütun bazlı durum)
  ├── ListView.tsx                  # Liste görünümü (filtrelenebilir tablo)
  ├── PoolView.tsx                  # İş havuzu (sahipsiz işler)
  ├── TaskDetail.tsx                # İş detay modal/sayfa
  ├── TaskForm.tsx                  # Yeni iş oluşturma/düzenleme formu
  ├── TeamOverview.tsx              # Müdür/Direktör ekip özet ekranı
  └── settings/
        ├── WorkflowSettings.tsx    # Ayarlar ana sayfa
        ├── UserRoleManager.tsx     # Kullanıcı & modül rolü atama
        ├── HierarchyEditor.tsx     # Org ağacı görsel editör
        ├── DepartmentManager.tsx   # Departman yönetimi
        ├── NotificationSettings.tsx # Telegram/WhatsApp kanal ayarları
        └── CategoryManager.tsx     # Kategori & etiket yönetimi

src/types/
  └── workflow.types.ts             # Tüm tip tanımları

src/hooks/
  ├── useWorkflow.ts                # Task CRUD + filtre hook'ları
  └── useWorkflowSettings.ts       # Ayar hook'ları

src/context/
  └── WorkflowContext.tsx           # Global state yönetimi
```

### Tip Tanımları (`workflow.types.ts`)

```typescript
type WorkflowRole = 'DIREKTOR' | 'MUDUR' | 'SORUMLU' | 'UYE' | 'IZLEYICI';
type TaskStatus = 'BEKLIYOR' | 'DEVAM' | 'TAMAMLANDI' | 'YARIM_KALDI' | 'IPTAL';
type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type AssignmentRole = 'ASSIGNEE' | 'WATCHER';
type AlarmType = 'EMAIL' | 'TELEGRAM' | 'WHATSAPP' | 'INAPP';

interface WorkflowUserRole { ... }
interface WorkflowDepartment { ... }
interface WorkflowTask { ... }
interface WorkflowAssignment { ... }
interface WorkflowComment { ... }
interface WorkflowHistory { ... }
interface WorkflowAlarm { ... }
interface WorkflowNotificationSettings { ... }
```

### PortalPage.tsx Güncellemesi

`PortalPage.tsx`'e mevcut kart tasarımıyla birebir uyumlu **"İş Takip"** kartı eklensin:

```tsx
{
  icon: <WorkflowIcon />,
  title: "İş Takip",
  description: "İş atama, durum takibi, ekip yönetimi ve bildirim sistemi.",
  link: "/workflow"
}
```

### Görünümler

| Görünüm | Açıklama |
|--------|---------|
| Kanban Board | Durum sütunları (Bekliyor / Devam / Tamamlandı / Yarım Kaldı / İptal) |
| Liste | Filtrelenebilir, sıralanabilir tablo |
| İş Havuzu | Sahipsiz işler, havuzdan alma butonu |
| Bana Atananlar | Kişisel iş listesi |
| Ekip Özeti | Müdür ve üstü için ekip performans özeti |
| Geçmiş | Tamamlanan işler + audit log |

---

## 5. Tasarım Kuralları

- Mevcut SEÇ Portalı renk paleti ve kart stiliyle **birebir uyumlu** olsun
- `PortalPage.tsx`'teki mevcut component yapısını referans al
- Tüm yeni componentlar mevcut `src/components/` klasöründeki ortak bileşenleri kullansın
- Mevcut `pages/notifications/` altyapısına entegre olsun (in-app bildirimler)

---

## 6. Ortam Değişkenleri

`docker-compose.yml` ve `.env` dosyasına eklenecekler:

```env
# Telegram Bot
TELEGRAM_BOT_TOKEN=

# WhatsApp (Twilio veya Meta)
WHATSAPP_PROVIDER=twilio   # veya meta
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=
# Meta Cloud API için:
META_WHATSAPP_TOKEN=
META_PHONE_NUMBER_ID=
```

---

## 7. Özet Kontrol Listesi

- [ ] Veritabanı tabloları oluşturuldu
- [ ] Backend route'ları yazıldı
- [ ] Modül rol middleware'i eklendi
- [ ] NotificationService yazıldı (email + telegram + whatsapp + in-app)
- [ ] Alarm cron job'u kuruldu
- [ ] Frontend dosya yapısı oluşturuldu
- [ ] Tüm tipler tanımlandı
- [ ] Context ve hook'lar yazıldı
- [ ] Kanban, Liste, Havuz görünümleri tamamlandı
- [ ] Ayarlar ekranı tamamlandı (rol, hiyerarşi, departman, bildirim, kategori)
- [ ] PortalPage.tsx'e İş Takip kartı eklendi
- [ ] Tasarım mevcut SEÇ Portalı stiliyle uyumlu