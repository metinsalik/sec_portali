# İSG Kurul Yönetim Modülü - PRD ve Teknik Şartname

Bu doküman, projede yer alan `.agents` (Product Manager, Software Architect, Engineering Principles vb.) yeteneklerine ve mevcut yapıya (`apps/web/src/pages/isg-kurul` ve Prisma şeması) uygun olarak revize edilmiştir.

## 1. Ürün Stratejisi ve Hedefler (Product Manager)

### 1.1 Amaç
Tesis bazında İş Sağlığı ve Güvenliği (İSG) kurullarının oluşturulması, üye atamalarının takibi, yıllık toplantı planları, toplantı çağrıları, toplantı yönetimi, kararların yaşam döngüsü ve Merkezi SEÇ Kurulu koordinasyonunun dijitalleştirilmesi. Mevcut manuel veya parça parça yürütülen süreçleri merkezi, izlenebilir ve denetlenebilir (auditability) bir yapıya kavuşturmak.

### 1.2 Kullanıcı Personaları
- **Kurul Başkanı (İşveren/İşveren Vekili):** Kendi tesisindeki toplantıları ve kararları görüntüler. 72 saatlik onay/düzeltme sürecini işletir.
- **Kurul Sekreteri (İSG Uzmanı):** Kurul oluşturur, üyeleri atar, çağrı yapar, toplantıyı yönetir, kararları ve görüşülen konuları sisteme girer. 48 saatlik düzenleme penceresini yönetir.
- **Kurul Üyesi:** Toplantı çağrılarını görür, kararları takip eder.
- **Sorumlu Birim Kullanıcısı:** Kendi birimine atanan kararları görür, aksiyon/yorum girer.
- **Merkezi SEÇ Yönetimi:** Tüm tesislerdeki kararları konsolide izler, kritik kararları SEÇ Kuruluna taşır.

### 1.3 MVP Kapsamı (Minimum Viable Product)
- **Kurul & Üye Yönetimi:** Dönem bazlı kurul tanımlama, üye atama ve ıslak imzalı belge yükleme. (Mevcut `OhsBoardMember` yapısı `OhsBoard` ve `OhsBoardPeriod` gibi üst modellere bağlanacak).
- **Toplantı & Planlama:** Yıllık plan oluşturma, toplantı çağrısı ve yoklama. (Mevcut `OhsBoardMeeting` modeli genişletilecek).
- **Karar & Görüşülen Konular:** Kararların girilmesi, durum/termin/risk takibi. Karara bağlanmayan gündemlerin "Görüşülen Konular" olarak kaydı. (Mevcut `OhsBoardDecision` genişletilecek).
- **Yaşam Döngüsü & Onay Akışı:** 48 saatlik düzenleme, 72 saatlik başkan onayı ve 1 saatlik aksiyon düzenleme kilitleri. Karar aksiyonlarının loglanması (`OhsBoardDecisionAction` kullanımı).
- **Konsolide Dashboard:** Mevcut `IsgKurulDashboard.tsx` üzerinden tesisler arası genel durum takibi.

## 2. Mühendislik Prensipleri (Engineering Principles)

- **Mantık Kodun Önündedir (Logic Over Syntax):** 48 saat ve 72 saat kuralı gibi kritik iş kuralları veritabanı veya backend servis seviyesinde güvence altına alınacaktır. Frontend sadece bu kuralları arayüze yansıtacaktır.
- **Derinlemesine Savunma (Defense-in-Depth):** Kurul kararlarını sadece yetkili (Kurul Sekreteri/Başkanı) kişiler değiştirebilmelidir. Aksiyon girişleri ise ilgili Sorumlu Birim Kullanıcısı tarafından yapılabilmelidir. Backend'de sıkı rol ve tesis (facilityId) yetkilendirmesi uygulanacaktır.
- **İzlenebilirlik (Auditability):** Olayların tarihçesi (kim, ne zaman, hangi durumu değiştirdi) tutulmalıdır. Mevcut log yapıları veya yeni bir `OhsBoardAuditLog` modeli ile kararların onay/değişim geçmişi saklanacaktır.
- **KISS & DRY:** Mevcut sayfalar (`IsgKurulMeetings.tsx`, `IsgKurulDecisions.tsx`) aşırı karmaşıklıktan arındırılacak, ortak component'ler (örn: Karar Kartı) kullanılacaktır.

## 3. Yazılım Mimarisi (Software Architect)

Proje monorepo mimarisindedir. Özellik tabanlı izolasyon (Feature-Based Isolation) uygulanacaktır.

### 3.1 Veritabanı ve Model (Backend - Prisma)
Mevcut yapıdaki `OhsBoardMeeting`, `OhsBoardDecision`, `OhsBoardDecisionAction` ve `OhsBoardMember` modelleri MVP kapsamına göre genişletilecektir.

*Eklenecek/Güncellenecek Alanlar:*
- **OhsBoard:** Tesisin kurullarını tutacak ana tablo (ad, durum).
- **OhsBoardPeriod:** Kurulun faaliyet dönemleri (başlangıç, bitiş, tehlike sınıfı).
- **OhsBoardMember:** `periodId` ile döneme bağlanacak. `isDocumentUploaded` ve `documentUrl` eklenecek.
- **OhsBoardMeeting:** `periodId`, `status` (Taslak, Planlandı, Çağrı Gönderildi, Gerçekleşti), `meetingPlace`, `isExtraordinary` eklenecek.
- **OhsBoardMeetingAttendance:** Toplantı yoklama tablosu (memberId, status, proxyMemberName).
- **OhsBoardTopic:** Görüşülen konular (karar olmayan maddeler).
- **OhsBoardDecision:** `approvalStatus` (Bekliyor, Onaylandı, Düzeltme İstendi), `lockedAt` (48 saat kuralı için), `centralBoardStatus` eklenecek.
- **OhsBoardDecisionAction:** `expiresAt` (1 saat düzenleme kuralı için) eklenecek.

### 3.2 Backend (Node.js/Express)
- **Route:** `backend/src/routes/operations/board.routes.ts` (mevcut rotalar güncellenecek).
- **Controller/Service:**
  - 48 saatlik toplantı kilitleme mantığı servis katmanında kontrol edilecek.
  - Başkan onay/ret işlemleri için özel endpoint'ler eklenecek.
  - Rol tabanlı yetki kontrolü middleware'ler ile sağlanacak.

### 3.3 Frontend (React/Vite)
Mevcut `/apps/web/src/pages/isg-kurul` dizinindeki bileşenler yeniden düzenlenecektir:
- `IsgKurulDashboard.tsx`: Konsolide grafikler ve durum özetleri (mevcut, korunacak/iyileştirilecek).
- `IsgKurulSettings.tsx`: Kurul tanımı, dönemleri, üye atamaları ve ıslak imzalı belge yükleme alanları eklenecek.
- `IsgKurulMeetings.tsx`: Yıllık plan ve çağrı gönderme arayüzü entegre edilecek.
- `IsgKurulMeetingDetails.tsx`: 
  - Yoklama modülü eklenecek.
  - Görüşülen Konular (Topics) sekmesi eklenecek.
  - 48 saat geri sayımı ve yetkiye bağlı "Başkan Onayı" butonları gösterilecek.
- `IsgKurulDecisions.tsx`: Karar yaşam döngüsü, aksiyon ekleme ve yorumlaşma, 1 saatlik düzenleme yetkisi UI'da kilitlenecek.

## 4. Kullanıcı Hikayeleri ve İş Kuralları

1. **Üye Atama:** *Kurul sekreteri olarak*, dönem başında üyeleri atamak ve atama belgelerini sisteme yüklemek istiyorum, böylece mevzuat eksikliklerini takip edebilirim.
2. **Toplantı Çağrısı:** *Kurul sekreteri olarak*, toplantıdan en az 48 saat önce çağrı göndermek istiyorum. Sistem beni bu süre için uyarmalıdır.
3. **48 Saat Kuralı:** *Kurul sekreteri olarak*, toplantı gerçekleşti olarak işaretlendikten sonraki 48 saat içinde karar ve görüşülen konuları düzenlemek istiyorum. Süre dolduğunda kayıt girişi kapanmalıdır.
4. **Başkan Onayı:** *Kurul başkanı olarak*, 48 saatlik düzenleme süresi bittikten sonraki 72 saat içinde kararları inceleyip onaylamak veya düzeltme istemek istiyorum. İşlem yapmazsam otomatik onaylanmasını istiyorum.
5. **Aksiyon Düzenleme:** *Sorumlu birim çalışanı olarak*, karara yazdığım aksiyonu olası hatalara karşı 1 saat içinde düzenleyebilmek istiyorum. Sonrasında kilitlenmelidir.
6. **Yetki Kapsamı:** *Sorumlu birim çalışanı olarak*, sadece kendi birimime atanan kararları görebilmek, kararın ana metnini değiştirememek istiyorum.

## 5. Kabul Kriterleri (Acceptance Criteria)
- [ ] Prisma şeması yeni modeller ve alanlarla güncellenmiş ve migrate edilmiştir.
- [ ] Backend iş kuralları (48 saat kilit, 72 saat otomatik onay mekanizması - cron veya check) uygulanmıştır.
- [ ] Kurul üye atamalarında belge yükleme ve eksik/tam takibi yapılabilmektedir.
- [ ] Toplantı detayında yoklama (katılım) kaydedilebilmektedir.
- [ ] Sadece yetkili kullanıcılar (Sekreter) karar metni düzenleyebilir; Başkan onayı sonrası düzenleme tamamen kapanır.
- [ ] Sorumlu birimler sadece kendilerine atanmış kararları listeleyebilir ve aksiyon girebilir.
- [ ] Frontend bileşenleri `isg-kurul` klasöründe projeye özgü Shadcn/UI standartlarına uygun tasarlanmıştır.
