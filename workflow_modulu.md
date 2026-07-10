# Workflow Modülü - Detaylı Geliştirme Şartnamesi (Görev Atama ve Takip)

Bu doküman, `sec_portali` sistemindeki **workflow** modülünün eksiksiz fonksiyonel ve teknik tanımıdır.
Referans: "İş Akışı | Görev Atama ve Takip Uygulaması" prototipi.
Geliştirme sırasında `modul.md` (Modül Geliştirme Rehberi) adımları birebir uygulanacaktır.

---

## 1. Modülün Amacı

Kurum içi görevlerin; **iş planı**, **sorumlu**, **takip görevlisi**, **termin**, **öncelik** ve
**kanıt tabanlı kontrol adımları** ile atanması, izlenmesi ve raporlanması.

Temel ilkeler (sistem bunları zorunlu kılar, tavsiye değildir):
- Boş termin tarihi verilemez.
- Sorumlu tekildir; **sorumlu ve takip görevlisi aynı kişi olamaz**.
- İlerleme yüzdesi elle girilmez; **kanıtı girilmiş tamamlanan kontrol adımı / toplam adım** oranından otomatik hesaplanır.
- Tüm adımlar kanıtlarıyla tamamlanmadan (%100) görev "Tamamlandı" durumuna alınamaz.
- Termin değişikliği sorumlu tarafından **talep edilir**, yönetici **onaylar/reddeder**; değişim sayacı ve geçmişi tutulur.
- Her kritik işlem denetim izine (activity log) yazılır.

---

## 2. Veritabanı (Prisma - `backend/prisma/schema.prisma`)

Mevcut `User` ve rol yapısı kullanılacak; workflow'a özel modeller eklenecek.

### 2.1 Enum'lar
```prisma
enum WfStatus   { TODO DOING REVIEW DONE BLOCKED }        // Bekliyor, Devam Ediyor, Kontrolde, Tamamlandı, Bloke
enum WfPriority { LOW MEDIUM HIGH CRITICAL }              // Düşük, Orta, Yüksek, Kritik
enum WfDueRequestStatus { PENDING APPROVED REJECTED }
```

### 2.2 Modeller
```prisma
model WfPlan {
  id        String     @id @default(cuid())
  title     String                             // Plan adı (zorunlu)
  goal      String?                            // Ölçülebilir hedef
  ownerId   String                             // Plan sahibi (User)
  startDate DateTime
  dueDate   DateTime
  status    WfStatus   @default(TODO)
  priority  WfPriority @default(MEDIUM)
  tasks     WfTask[]
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
}

model WfTask {
  id             String     @id @default(cuid())
  title          String                         // Zorunlu
  description    String?
  planId         String?                        // Plan silinirse null kalabilir (görevler plansız kalır)
  plan           WfPlan?    @relation(fields: [planId], references: [id])
  assigneeId     String                         // Sorumlu (zorunlu, tekil)
  followerId     String                         // Takip görevlisi (zorunlu, assignee'den farklı)
  creatorId      String
  status         WfStatus   @default(TODO)
  priority       WfPriority @default(MEDIUM)
  category       String?                        // İSG, Bakım, Kalite...
  labels         String[]                       // Etiketler
  startDate      DateTime
  dueDate        DateTime                       // Zorunlu
  estimateHours  Float      @default(0)
  progress       Int        @default(0)         // Denormalize; her zaman checklist'ten hesaplanır
  dueChangeCount Int        @default(0)
  checklist      WfChecklistStep[]
  comments       WfComment[]
  dueHistory     WfDueHistory[]
  dueRequests    WfDueChangeRequest[]
  chatMessages   WfChatMessage[]
  createdAt      DateTime   @default(now())
  updatedAt      DateTime   @updatedAt
}

model WfChecklistStep {
  id         String    @id @default(cuid())
  taskId     String
  task       WfTask    @relation(fields: [taskId], references: [id], onDelete: Cascade)
  text       String                              // Adım metni
  order      Int
  done       Boolean   @default(false)
  doneById   String?
  doneAt     DateTime?
  evidence   String?                             // Kanıt / sonuç notu (done=true ise ZORUNLU)
  evidenceById String?
  evidenceAt DateTime?
}

model WfComment {
  id        String   @id @default(cuid())
  taskId    String
  task      WfTask   @relation(fields: [taskId], references: [id], onDelete: Cascade)
  authorId  String
  body      String
  createdAt DateTime @default(now())
}

model WfDueChangeRequest {
  id           String              @id @default(cuid())
  taskId       String
  task         WfTask              @relation(fields: [taskId], references: [id], onDelete: Cascade)
  requestedById String
  oldDue       DateTime
  requestedDue DateTime
  reason       String                              // Zorunlu
  status       WfDueRequestStatus  @default(PENDING)
  reviewedById String?
  reviewedAt   DateTime?
  createdAt    DateTime            @default(now())
}

model WfDueHistory {
  id         String   @id @default(cuid())
  taskId     String
  task       WfTask   @relation(fields: [taskId], references: [id], onDelete: Cascade)
  oldDue     DateTime
  newDue     DateTime
  changedById String
  source     String                                // "Yönetici düzenlemesi" | "Talep onayı"
  requestId  String?
  createdAt  DateTime @default(now())
}

model WfChatMessage {
  id        String   @id @default(cuid())
  taskId    String
  task      WfTask   @relation(fields: [taskId], references: [id], onDelete: Cascade)
  senderId  String
  body      String
  createdAt DateTime @default(now())
}

model WfActivityLog {
  id        String   @id @default(cuid())
  actorId   String
  action    String                                 // "Görev oluşturuldu", "Termin onaylandı"...
  detail    String
  createdAt DateTime @default(now())
}
```

Komutlar: `npx prisma format` → `npx prisma migrate dev --name workflow_init` → `npx prisma generate`

---

## 3. Roller ve Yetki Matrisi

Sistemdeki mevcut roller eşlenir: `admin` (Sistem Yöneticisi), `manager` (Birim Yöneticisi),
`member` (Ekip Üyesi), `viewer` (İzleyici).

| Yetki | Admin | Manager | Member | Viewer |
|---|---|---|---|---|
| Görev görme | Tümü | Oluşturduğu / atadığı / takip ettiği / plan sahibi olduğu | Sorumlusu veya takipçisi olduğu | Sadece dashboard/rapor |
| Görev oluşturma / atama | ✔ | ✔ | ✖ | ✖ |
| Görev tam düzenleme (başlık, sorumlu, takipçi, öncelik, termin, checklist tanımı) ve silme | ✔ | Kendi kapsamındakiler | ✖ | ✖ |
| Durum + kontrol adımı işaretleme + kanıt girme | ✔ | Kapsamındakiler | Sadece sorumlusu olduğu görevlerde | ✖ |
| Yorum / engel notu | Görebildiği her görevde | Aynı | Aynı | ✖ |
| Termin değişikliği talebi | — (direkt değiştirir) | — | ✔ (sorumlusu olduğu, done olmayan görevde) | ✖ |
| Termin talebi onay/red | ✔ | ✔ (kapsamındakiler) | ✖ | ✖ |
| Plan oluşturma/düzenleme | ✔ | Kendi planları | ✖ | ✖ |
| Kullanıcı & rol yönetimi | ✔ | ✖ | ✖ | ✖ |
| Görev sohbeti | Görebildiği görevlerde yaz/oku (tüm roller için geçerli kural) |

**Görünürlük kuralı (canSeeTask):** admin → hepsi; manager → creator/assignee/follower/plan sahibi olduğu görevler; member → assignee veya follower olduğu görevler. Sohbet ve raporlar da bu kapsama uyar.

---

## 4. İş Kuralları (Backend'de zorunlu doğrulamalar)

1. **Görev oluşturma/düzenleme:** `title`, `assigneeId`, `followerId`, `dueDate` ve **en az 1 kontrol adımı** zorunlu. `assigneeId !== followerId`. Sadece aktif kullanıcıya atama yapılabilir.
2. **İlerleme:** `progress = round(kanıtlı_tamamlanan_adım / toplam_adım * 100)`. Client'tan gelen progress değeri yok sayılır.
3. **Kanıt zorunluluğu:** Bir adım `done=true` yapılırken `evidence` boş olamaz → 400 "Tamamlanan her kontrol adımı için kanıt girilmeli".
4. **Done kilidi:** `status=DONE` yalnızca `progress===100` iken kabul edilir (form, hızlı durum ve kanban sürüklemesi dahil).
5. **Termin talebi:** Yeni tarih ≥ bugün, mevcut terminle aynı olamaz, gerekçe zorunlu, aynı kullanıcının bekleyen talebi varken yeni talep açılamaz.
6. **Talep onayı:** Onaylanınca `dueDate` güncellenir, `dueChangeCount++`, `WfDueHistory` kaydı (`source: "Talep onayı"`). Yönetici formdan direkt termin değiştirirse yine sayaç + history (`source: "Yönetici düzenlemesi"`).
7. **Plan silme:** Bağlı görevler silinmez, `planId = null` yapılır (kullanıcı uyarılır).
8. **Denetim izi:** Görev/plan/kullanıcı/rol CRUD, durum değişimi, checklist güncelleme, termin talep/onay/red, not ekleme → `WfActivityLog`.

---

## 5. Backend API (`backend/src/routes/workflow/index.ts`)

Tüm uçlar `authMiddleware` arkasında; yazma uçları yukarıdaki yetki matrisine göre `roleCheck`/servis içi kontrol ile korunur.
Entegrasyon: `app.use('/api/workflow', workflowRoutes);` (`backend/src/index.ts`)

| Method | Uç | Açıklama |
|---|---|---|
| GET | `/tasks` | Görünür görevler + filtreler: `assignee, status, priority, plan, dateRange(all/overdue/7days), q` |
| POST | `/tasks` | Görev oluştur (admin/manager) |
| GET | `/tasks/:id` | Detay (checklist, yorumlar, due geçmişi, talepler) |
| PUT | `/tasks/:id` | Tam düzenleme (yetkiliyse) |
| PATCH | `/tasks/:id/status` | Hızlı durum değişimi (done kilidi uygulanır) |
| PATCH | `/tasks/:id/checklist` | Adım işaretleme + kanıt girme (sorumlu/yetkili) |
| POST | `/tasks/:id/comments` | Yorum / engel notu |
| POST | `/tasks/:id/due-requests` | Termin değişikliği talebi (sorumlu) |
| PATCH | `/tasks/:id/due-requests/:reqId` | Onay/red (yetkili yönetici) |
| DELETE | `/tasks/:id` | Silme (yetkili) |
| GET/POST/PUT/DELETE | `/plans`, `/plans/:id` | Plan CRUD |
| GET/POST | `/tasks/:id/chat` | Görev sohbeti (mesaj listele/gönder) |
| GET | `/alerts` | Uyarı motoru çıktısı (bkz. §7) |
| GET | `/reports/summary` | KPI + dağılımlar + kişi yükü + plan ilerlemesi |
| GET | `/reports/export.csv` | CSV dışa aktarım (prototipteki kolon seti: görev, plan, sorumlu, takipçi, durum, öncelik, tarihler, termin değişim sayısı, ilerleme, adım/kanıt sayıları, kanıt özeti) |
| GET | `/activity` | Denetim izleri (son 120) |

Karmaşık mantık `backend/src/services/workflowService.ts` içine (progress hesabı, yetki kontrolleri, uyarı motoru, due-request akışı) taşınır. Tipler: `backend/src/types/workflow.ts`.

---

## 6. Frontend (`frontend/src/pages/workflow/`, `frontend/src/components/workflow/`)

### 6.1 Sayfalar
- `WorkflowDashboard.tsx` — KPI kartları (Açık görev, Gecikmiş, Bloke, Ortalama ilerleme + kritik açık sayısı), duruma göre bar grafik, öncelik donut grafiği, 7 günlük termin akışı grafiği, "Yönetim İçgörüleri" (kural tabanlı metinler: gecikme, blokaj, tek kişide yük yoğunlaşması ≥3, %50 altı kritik işler), Kritik Takip Listesi tablosu. Üstte ortak filtre çubuğu (sorumlu/durum/öncelik/plan/tarih) + global arama.
- `WorkflowTasksPage.tsx` — **Kanban** (5 kolon: Bekliyor, Devam Ediyor, Kontrolde, Tamamlandı, Bloke; drag&drop ile durum değişimi, done kilidi) ve **Liste** görünümü arasında geçiş. Listede satır içi hızlı durum select'i, Düzenle/Sil.
- `WorkflowPlansPage.tsx` — Plan kartları (hedef, sahip, ortalama ilerleme, görev/tamamlanan sayısı, termin, "Görev Ata" kısayolu).
- `WorkflowCalendarPage.tsx` — 14 günlük termin takvimi, "Bugüne Dön".
- `WorkflowAlertsPage.tsx` — Uyarı listesi + termin talepleri için satır içi Onayla/Reddet.
- `WorkflowReportsPage.tsx` — Kişi bazlı açık iş yükü grafiği, plan bazlı tamamlanma, denetim izleri tablosu, CSV indir.
- (Admin) Kullanıcı & rol yönetimi mevcut sistem ekranlarını kullanır; workflow'a özel ekran açılmaz.

### 6.2 Bileşenler (`components/workflow/`)
- `TaskFormModal` — Tam düzenleme formu (yetkiliye). Kontrol adımları textarea ile satır satır tanımlanır; mevcut adımların done/kanıt bilgisi metin eşleşmesiyle korunur. İlerleme alanı salt okunur.
- `TaskQuickModal` — Yetkisiz-tam-düzenleme kullanıcı (sorumlu/takipçi) için: özet kartı (durum, öncelik, termin, ilerleme, adım/kanıt sayıları, termin değişim sayısı, bekleyen talep) + hızlı aksiyonlar: *Durum/adım güncelle*, *Termin talebi*, *Yorum ekle*, *Sohbeti aç*, *Kayıt geçmişi*.
- `ChecklistEditor` — Adım işaretleme + adım başına kanıt textarea'sı; kanıtsız done engeli client-side de gösterilir.
- `DueRequestBox`, `DueAuditTrail` — Talep formu ve termin/kayıt geçmişi (audit satırları).
- `TaskChatDrawer` — Sağdan açılan görev sohbeti: görev seçici (mesaj sayısıyla), katılımcı etiketleri (Sorumlu/Takip/Plan), mesaj balonları, Ctrl+Enter ile gönderim.
- `KanbanBoard`, `TaskCard`, `StatusPill`, `PriorityPill`, `ProgressBar`, `FilterBar`, `KpiCard`, `InsightList`, `AlertList`.

### 6.3 Routing ve Navigasyon
- `App.tsx`: `/workflow`, `/workflow/tasks`, `/workflow/plans`, `/workflow/calendar`, `/workflow/alerts`, `/workflow/reports` route'ları; tümü `<ProtectedRoute>` ile, raporlar viewer dahil, yazma sayfaları rol bazlı.
- `PortalPage.tsx`'e "İş Akışı — Görev · Plan · Takip" modül kartı; AppLayout sol menüsüne modül linkleri + uyarı sayısı badge'i.

---

## 7. Uyarı Motoru Kuralları

Ayarlanabilir eşik: `dueWarningDays` (1/3/7 gün, varsayılan 3). Done olmayan görevler için:
- **Gecikmiş görev** (danger): termin < bugün → "X gün gecikti".
- **Termin yaklaşıyor** (warning): kalan gün ≤ eşik.
- **Bloke görev** (danger): status=BLOCKED.
- **Kritik görev düşük ilerlemede** (info): priority=CRITICAL ve progress < %70.
- **Termin talebi onay bekliyor** (warning): sadece onay yetkisi olan kullanıcıya gösterilir; satır içi onay/red.

Uyarı sayısı menü badge'inde gösterilir.

---

## 8. Durum ve Öncelik Sözlüğü

| Kod | Etiket | Renk |
|---|---|---|
| TODO | Bekliyor | #64748b |
| DOING | Devam Ediyor | #2563eb |
| REVIEW | Kontrolde | #9333ea |
| DONE | Tamamlandı | #16a34a |
| BLOCKED | Bloke | #dc2626 |

| Kod | Etiket | Skor | Renk |
|---|---|---|---|
| LOW | Düşük | 1 | #0ea5e9 |
| MEDIUM | Orta | 2 | #64748b |
| HIGH | Yüksek | 3 | #f79009 |
| CRITICAL | Kritik | 4 | #f04438 |

Sıralama önceliği (görev listesi): gecikmiş > öncelik skoru > en yakın termin.

---

## 9. Geliştirme Kontrol Listesi

- [ ] `schema.prisma`'ya §2'deki modeller + enum'lar eklendi, migrate/generate çalıştırıldı.
- [ ] `backend/src/routes/workflow/index.ts` + `services/workflowService.ts` + `types/workflow.ts` oluşturuldu.
- [ ] Route `backend/src/index.ts` içine `app.use('/api/workflow', ...)` ile eklendi.
- [ ] §4'teki tüm iş kuralları **backend'de** doğrulanıyor (client'a güvenilmiyor).
- [ ] `frontend/src/pages/workflow/` ve `components/workflow/` klasörleri açıldı, §6'daki sayfa/bileşenler kodlandı.
- [ ] `App.tsx` route'ları `<ProtectedRoute>` ile tanımlandı.
- [ ] `PortalPage.tsx` kartı ve sol menü linkleri (+uyarı badge) eklendi.
- [ ] CSV export, denetim izi, uyarı motoru ve görev sohbeti test edildi.
- [ ] Yetki matrisi her rol için manuel test edildi (görünürlük, done kilidi, kanıt zorunluluğu, termin talep akışı).
