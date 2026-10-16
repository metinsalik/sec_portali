ek-guide.md — İyileştirme ve Aksiyon Takip Modülü: Taslak (HTML) vs. Mevcut Sistem Eleştirel Analizi ve Tam Entegrasyon Rehberi
Bu doküman, hedef tasarım ve iş mantığını barındıran iyilestirme_takip.html prototipi ile sec_portali içerisindeki mevcut Operasyonlar: İyileştirme ve Aksiyon Takip (/api/operations/improvements & apps/web/src/pages/operations/improvements) modülü arasındaki farkları (Gap Analysis), mevcut mimarideki kusurları ve bir AI Agent'ın (Claude Code / Kilo / Cursor) hiçbir varsayımda bulunmadan (Zero-Assumption) sistemi uçtan uca kodlayabilmesi için gereken eksiksiz teknik spesifikasyonları içerir.


1. Yönetici Özeti ve Eleştirel Mimari Değerlendirme
Mevcut iyileştirme modülü, temel bir "Excel tablosu görüntüleyici ve basit CRUD" mantığıyla inşa edilmiştir. Ancak hazırlanan iyilestirme_takip.html taslağı, bu yapının çok ötesinde; Operasyonel Periyodik Kontrol (PK) & Denetim Raporu Takibi, Bütçe/Maliyet Konsolidasyonu, Veri Kalitesi (Data Hygiene) Denetimi, Sütun Bazlı Dinamik Şema Yönetimi ve Çoklu Aksiyon/Efor Geçmişi barındıran olgun bir kurumsal modül hedeflemektedir.
Mevcut Sistemdeki Kritik Mimari Kusurlar (Eleştirel Bakış)
"Tek Dosyada 920 Satır" Anti-Pattern'i (backend/src/routes/improvements/index.ts):

Eleştiri: Mevcut backend route dosyası hem HTTP yönlendirmesini, hem Excel ayrıştırma (parsing) mantığını, hem karmaşık istatistik sorgularını hem de veritabanı işlemlerini tek bir dosyada (~920 satır) toplamaktadır. Bu durum engineering-principles içindeki SOLID (Single Responsibility) ilkesini ve modul.md standartlarını açıkça ihlal eder.
Çözüm: İş mantığı derhal backend/src/services/improvements/ altına (improvementRecord.service.ts, improvementReport.service.ts, improvementAnalytics.service.ts, improvementExcel.service.ts) ayrıştırılmalıdır.

DRY ve "Single Source of Truth" İhlali (SHEET_MAP & ELECTRICAL_SHEETS):

Eleştiri: Sekme tanımları hem frontend (types.ts) hem de backend (index.ts) tarafında ayrı ayrı hardcode edilmiştir. Ayrıca mevcut sistemde 8 kaynak sekme bulunurken, HTML taslağında yapı 9 takip sayfasına (Denetimler, Elektrik PK, Topraklama PK, Paratoner PK, Jeneratör PK, Elektrik Pano Kontrolleri [Enerji Analiz Raporu], Elektrik Pano Bakımları, Trafo, UPS) çıkarılmış ve Pano işlemleri Kontrol vs Bakım olarak ikiye ayrılmıştır.
Çözüm: Tüm sekme, grup, sütun şeması ve kategori sabitleri @sec-portali/shared paketine taşınmalı ve tek doğruluk kaynağı (Single Source of Truth) sağlanmalıdır.

Eksik Domain Modellemesi (Rapor/Operasyon Katmanının Yokluğu):

Eleştiri: Mevcut sistemde sadece "Bulgu" (ImprovementRecord) vardır. Oysa HTML taslağı; bir hastanede yapılan Denetim veya Periyodik Kontrol Operasyonunun kendisini (Son kontrol tarihi, gelecek kontrol tarihi, gecikme durumu, kontrol sonucu: "Uygunsuzluk Yok" / "Tespit Var", bakım vs. kontrol ayrımı) takip etmektedir. Mevcut veritabanında "hiç bulgu çıkmayan başarılı bir periyodik kontrol raporu"nu kaydedecek bir tablo yoktur! (HTML taslağındaki "Sıfır kayıt, hastanede uygunsuzluk bulunmadığını göstermez" uyarısı ve Rapor Özeti tablosu bu yüzden kritiktir).

Sekmeler Arası Sütun Kayması (Column Offset) Problemi:

Eleştiri: HTML taslağındaki gömülü Excel formüllerine bakıldığında, her sekmenin sütun yapısı aynı değildir! Örneğin Denetimler sekmesinde tespit metni F sütununda iken, Elektrik PK sekmesinde G sütununda, Trafo ve UPS sekmelerinde ise H sütunundadır (Trafo ve UPS'te Cihaz/Bölüm detayı için ekstra sütun mevcuttur). Mevcut sistem bu farklılıkları düzleştirirken veri kaybına yol açmaktadır.
Çözüm: Her sheetType için tam sütun haritası (SHEET_COLUMN_SCHEMA) tanımlanmalı ve sekmeye özel alanlar extraFields (JSONB) veya adanmış sütunlarda kayıpsız tutulmalıdır.

Yüzeysel Tarihçe Modeli (ImprovementRecordHistory):

Eleştiri: Mevcut sistemde tarihçe sadece currentNote ve status değişimini tutar. HTML taslağında ise bir bulgunun altında Aksiyon Kartları (Action Workspace) vardır; her aksiyonun kendi durumu, sorumlusu, termin tarihi, açıklaması ve bütçesi (maliyeti) bulunmaktadır.

Veri Çekme (Data Fetching) ve State Yönetimi Zafiyeti:

Eleştiri: Mevcut modül fetch + manuel onRefresh callback'leri ile çalışmaktadır. Oysa teknoloji yığınında TanStack Query 5 mevcuttur. Optimistic update, cache invalidation (özellikle silme/geri alma ve aksiyon ekleme işlemlerinde) TanStack Query ile yönetilmelidir.


2. Boşluk Analizi (Gap Analysis): Mevcut Modül vs. HTML Taslağı
Özellik / Bileşen
Mevcut Modül (improvements)
Taslak (iyilestirme_takip.html)
Yapılması Gereken Aksiyon
Takip Alanı Sayısı
8 Sekme (Denetimler + 7 Elektrik)
9 Sekme (Elektrik Pano Kontrolleri ve Elektrik Pano Bakımları ayrılmış, Enerji Analiz Raporu eşleşmesi var)
ImprovementSheetType enum'ı 9 alana güncellenmeli, Pano Kontrol ve Bakım ayrımı yapılmalı.
Veri Kalitesi & Eksik Bilgi Analizi
Yok. Sadece toplam ve durum sayıları var.
Veri Kalitesi Grid'i (Quality Grid): Durumu boş, Riski boş, Sorumlusu boş, Aksiyonu boş, Tarihi boş, Hastane boş, Tanımsız durum/risk sayaçları.
Dashboard API'sine "Data Hygiene / Veri Kalitesi" metrikleri eklenmeli.
Tamamlanma Oranı Formülü
Basit yüzdelik hesaplama.
Koşullu Formül: Tamamlanan / (Toplam - İptal). Eğer durumu boş/tanımsız kayıt varsa oran hesaplanmaz (n.a. döner) ve sarı uyarı banner'ı çıkar.
Hesaplama algoritması taslaktaki Excel formül mantığına (IF(C26<>SUM(D26:G26),"n.a.",...)) birebir uyarlanmalı.
Rapor & Operasyon Takibi
Yok. Sadece bulgular listeleniyor.
Rapor Özeti Paneli (report-overview): Hastane bazında son kontrol/bakım tarihi, gelecek tarih, gecikme (overdue), sonuç (clear/findings/unconfirmed) ve geçmiş rapor kartları.
Yeni ImprovementOperationReport modeli oluşturulmalı.
Periyodik Kontrol & Denetim Sihirbazı
Tekil kayıt ekleme modalı veya Excel import.
2 Adımlı PK Sihirbazı (pk-wizard) & Denetim Raporu Modalı (audit-report-dialog): 1. Adımda rapor üst verisi girilir, 2. Adımda tablo (grid) içinde çoklu bulgu satırı eklenir veya mevcut bulgular rapora bağlanır.
Çok adımlı (Multi-step) Rapor + Çoklu Bulgu ekleme sihirbazı (Dialog) geliştirilmeli.
Grup Seviyesi Dashboard
Yok. Elektrik sekmeleri sadece liste sayfası açar.
Grup Dashboard (report-dashboard-stage): Sol menüde grup başlığına tıklayınca 6'lı Grup KPI, Durum/Risk dağılım barları, Operasyon metrikleri ve Hastane karşılaştırma matrisi açılır.
Elektrik/PK grubu için özel toplu analiz sayfası (GroupDashboardPage.tsx) yapılmalı.
Kırılımlı Bulgu Özeti (Accordion)
Yok.
3 Seviyeli Accordion (finding-summary): Hastane -> Takip Alanı (Kaynak) -> Kategori bazında sayı ve tamamlanma oranı kırılımı.
Dashboard'a hiyerarşik kırılım bileşeni eklenmeli.
Aksiyon Çalışma Alanı & Bütçe
Tek bir currentNote alanı ve basit log.
Aksiyon Workspace (compact-actions-dialog): Sol tarafta yeni aksiyon formu (bütçe, termin, sorumlu, ekstra alanlar), sağda aksiyon kartları geçmişi. İnceleme ekranında Bütçe Özeti (Toplam Bütçe, Aksiyon Bütçesi, Kayıt Bütçesi).
ImprovementAction modeli kurulmalı, maliyet/bütçe alanları (legacyBudget, costAmount, currency) eklenmeli.
Tablo Filtreleme (Excel Tipi)
Basit üst filtreler.
Excel Tarzı Sütun Filtre Menüsü (source-filter-menu): Her sütun başlığında sıralama, koşul seçimi (içerir, eşittir vb.), değer arama ve checkbox listesi.
AdvancedSourceTable bileşenine gelişmiş sütun bazlı popover filtreleme eklenmeli.
Silme ve Geri Alma (Trash/Undo)
isArchived: true yapıyor ama arayüzde geri alma veya çöp kutusu yok.
Silinen Kayıtlar Kutusu (deleted-records-dialog) & Toast Undo: Silme onay modalı, sildikten sonra altta çıkan Toast üzerinden anında "Geri Al" (delete-toast-undo) ve arşivden geri yükleme ekranı.
Çöp kutusu modalı ve /restore API ucu eklenmeli.



3. Sabitler, Sekme Haritası ve Sütun Şemaları (@sec-portali/shared)
Agent'ın Excel import, form oluşturma ve tablo render işlemlerinde hiçbir belirsizlik yaşamaması için aşağıdaki yapı packages/shared/src/improvements.ts içerisine eklenmelidir:
3.1. 9 Takip Alanı ve Excel Eşleşme Matrisi
ImprovementSheetType (Enum)
Arayüz Etiketi (UI Label)
Grup (moduleGroup)
Excel Sekme Adı (SHEET_MAP)
Operasyon Yapısı
DENETIMLER
Denetimler
DENETIM
Denetimler
Tekil (INSPECTION)
ELEKTRIK_PK
Elektrik PK
ELEKTRIK_BAKIM_KONTROL
Elektrik PK
Tekil (INSPECTION)
TOPRAKLAMA_PK
Topraklama PK
ELEKTRIK_BAKIM_KONTROL
Topraklama PK
Tekil (INSPECTION)
PARATONER_PK
Paratoner PK
ELEKTRIK_BAKIM_KONTROL
Paratoner PK
Tekil (INSPECTION)
JENERATOR_PK
Jeneratör PK
ELEKTRIK_BAKIM_KONTROL
Jeneratör PK
Çift (INSPECTION & MAINTENANCE)
ELEKTRIK_PANO_KONTROLLERI
Elektrik Pano Kontrolleri
ELEKTRIK_BAKIM_KONTROL
Enerji Analiz Raporu
Tekil (INSPECTION - Termal/Enerji)
ELEKTRIK_PANO_BAKIMLARI
Elektrik Pano Bakımları
ELEKTRIK_BAKIM_KONTROL
Elektrik Pano Kontrolleri
Tekil (MAINTENANCE - Pano Bakım)
TRAFO
Trafo
ELEKTRIK_BAKIM_KONTROL
Trafo
Çift (INSPECTION & MAINTENANCE)
UPS
UPS
ELEKTRIK_BAKIM_KONTROL
UPS
Çift (INSPECTION & MAINTENANCE)


ÖNEMLİ KURAL (Dashboard Satır 22 Formülü): HTML taslağındaki Excel formüllerinde Elektrik Pano Kontrolleri yüksek/kritik açık sayısı hesaplanırken hem Enerji Analiz Raporu hem de Elektrik Pano Kontrolleri sekmeleri kontrol edilmektedir. Sistemde Enerji Analiz Raporu sekmesi ELEKTRIK_PANO_KONTROLLERI olarak, Elektrik Pano Kontrolleri sekmesi ise ELEKTRIK_PANO_BAKIMLARI olarak normalize edilmelidir.
3.2. Excel Sütun Haritası (Excel Import & Dinamik Grid Şeması)
HTML taslağındaki formüllerden ('Denetimler'!$F$5:$F$256, 'Elektrik PK'!$G$5:$G$250, 'Trafo'!$H$5:$H$250) çıkarılan kesin sütun haritası:

Tip A (DENETIMLER):

B: Sıra No (rowNo)
C: Hastane (facilityName)
D: Denetim Türü / Kaynak (extraFields.auditType)
E: Kategori / Bölüm (category)
F: Tespit / Uygunsuzluk (finding) — Zorunlu Kriter
G: Tespit Tarihi (findingDate)
H: Lokasyon / Mahal (locationDetail)
I: Risk Seviyesi (riskScore)
J: Sorumlu (assignedTo)
K: Durum (status)
L: Planlanan Aksiyon (actionPlan)
M: Termin Tarihi (dueDate)
N+: Bütçe / Açıklama / Notlar (legacyBudget, currentNote)

Tip B (ELEKTRIK_PK, TOPRAKLAMA_PK, PARATONER_PK, JENERATOR_PK, ELEKTRIK_PANO_KONTROLLERI, ELEKTRIK_PANO_BAKIMLARI):

B: Sıra No (rowNo)
C: Hastane (facilityName)
D: Kontrol Tarihi (findingDate)
E: Kontrol Kurumu / Firma (extraFields.companyName)
F: Kategori / Pano / Bölge (category)
G: Tespit / Uygunsuzluk (finding) — Zorunlu Kriter
H: Önerilen Düzeltici Faaliyet (locationDetail / extraFields.recommendation)
I: Risk Seviyesi (riskScore)
J: Sorumlu (assignedTo)
K: Durum (status)
L: Aksiyon Planı / Yapılan İşlem (actionPlan)
M: Termin Tarihi (dueDate)
N: Bütçe / Maliyet (legacyBudget)

Tip C (TRAFO, UPS):

B: Sıra No (rowNo)
C: Hastane (facilityName)
D: Cihaz / Trafo / UPS Tanımı veya Gücü (locationDetail / extraFields.equipmentSpec)
E: Kontrol / Bakım Tarihi (findingDate)
F: Firma / Kurum (extraFields.companyName)
G: Kategori / Alt Sistem (category)
H: Tespit / Uygunsuzluk (finding) — Zorunlu Kriter
I: Teknik Öneri (extraFields.recommendation)
J: Risk Seviyesi (riskScore)
K: Sorumlu (assignedTo)
L: Durum (status)
M: Aksiyon Planı / Yapılan İşlem (actionPlan)
N: Termin Tarihi (dueDate)
O: Bütçe / Maliyet (legacyBudget)
3.3. Standartlaştırılmış Durum ve Risk Değerleri
Geçerli Durumlar (VALID_STATUSES): ['Tamamlandı', 'Devam Ediyor', 'Başlamadı', 'İptal Edildi', 'Açık']
Veri Kalitesi Kuralı: Eğer bir kaydın status alanı null veya "" ise "Durumu girilmemiş (Durum boş)" sayılır. Eğer dolu fakat VALID_STATUSES içinde değilse "Tanımsız durum" sayılır.
Geçerli Risk Seviyeleri (VALID_RISKS): ['Kritik', 'Yüksek', 'Önemli', 'Olası', 'Önemsiz', 'Çok Yüksek']
Veri Kalitesi Kuralı: Eğer riskScore alanı null veya "" ise "Riski girilmemiş (Risk boş)" sayılır. Eğer dolu fakat listede yoksa "Tanımsız risk" sayılır.
Kritik Kalem Kriteri: riskScore IN ('Kritik', 'Yüksek', 'Çok Yüksek') VE status NOT IN ('Tamamlandı', 'İptal Edildi').


4. Veritabanı Mimarisi (schema.prisma) Revizyon Planı
Mevcut 3 modelli yapı (ImprovementRecord, ImprovementRecordHistory, ImprovementSetting), HTML taslağındaki işlevleri karşılamak için aşağıdaki şekilde güncellenmelidir:

// 1. Takip Alanı (Sheet) Enum'ı - 9 Ana Alan

enum ImprovementSheetType {

  DENETIMLER

  ELEKTRIK_PK

  TOPRAKLAMA_PK

  PARATONER_PK

  JENERATOR_PK

  ELEKTRIK_PANO_KONTROLLERI // Excel'deki 'Enerji Analiz Raporu' karşılığı

  ELEKTRIK_PANO_BAKIMLARI   // Excel'deki 'Elektrik Pano Kontrolleri' bakım karşılığı

  TRAFO

  UPS

}

// 2. Operasyon / Rapor Türü (Kontrol vs Bakım ayrımı)

enum ImprovementOperationType {

  INSPECTION  // Periyodik Kontrol / Denetim

  MAINTENANCE // Bakım

}

// 3. Rapor Sonuç Durumu

enum ImprovementReportResult {

  CLEAR       // Uygunsuzluk Yok / Temiz

  FINDINGS    // Tespit / Bulgu Var

  UNCONFIRMED // Onaylanmamış / Taslak

  PLANNED     // Planlandı

}

// YENİ MODEL: Periyodik Kontrol, Bakım ve Denetim Raporu (Operasyon) Kaydı

model ImprovementOperationReport {

  id                String                   @id @default(uuid())

  facilityId        String

  facility          Facility                 @relation(fields: [facilityId], references: [id])

  sheetType         ImprovementSheetType

  operationType     ImprovementOperationType @default(INSPECTION)

  

  reportDate        DateTime                 // Kontrol / Denetim Tarihi

  nextScheduledDate DateTime?                // Gelecek Planlanan Kontrol Tarihi

  resultStatus      ImprovementReportResult  @default(UNCONFIRMED)

  

  companyName       String?                  // Kontrolü yapan firma / kurum

  inspectorName     String?                  // Kontrolü yapan uzman / ekip

  reportNo          String?                  // Rapor numarası

  summaryNotes      String?                  @db.Text

  

  // İlişkili bulgular (1 raporda N adet bulgu olabilir veya 0 bulgu ile CLEAR olabilir)

  findings          ImprovementRecord[]      @relation("ReportFindings")

  

  isDeleted         Boolean                  @default(false)

  deletedAt         DateTime?

  deletedById       String?

  

  createdById       String

  createdAt         DateTime                 @default(now())

  updatedAt         DateTime                 @updatedAt

  @@index([facilityId, sheetType, operationType, isDeleted])

  @@index([reportDate])

}

// GÜNCELLENEN MODEL: Ana Bulgu / Tespit Kaydı

model ImprovementRecord {

  id                String                      @id @default(uuid())

  rowNo             Int                         // Sıra No (renumber ile sıralanır)

  facilityId        String

  facility          Facility                    @relation(fields: [facilityId], references: [id])

  

  moduleGroup       String                      // 'DENETIM' | 'ELEKTRIK_BAKIM_KONTROL'

  sheetType         ImprovementSheetType

  

  // Rapor Bağlantısı (Opsiyonel: Doğrudan girilen veya rapordan gelen bulgu)

  reportId          String?

  report            ImprovementOperationReport? @relation("ReportFindings", fields: [reportId], references: [id], onDelete: SetNull)

  

  findingDate       DateTime?                   // Tespit Tarihi

  category          String?                     // Bulgu Kategorisi / Alanı

  locationDetail    String?                     // Bölüm / Mahal / Pano Adı / Trafo No

  finding           String                      @db.Text // Tespit / Uygunsuzluk Açıklaması

  

  riskScore         String?                     // 'Kritik', 'Yüksek', 'Önemli', 'Olası', 'Önemsiz'

  status            String?                     // 'Tamamlandı', 'Devam Ediyor', 'Başlamadı', 'İptal Edildi', 'Açık'

  

  assignedTo        String?                     // Sorumlu Kişi / Birim

  dueDate           DateTime?                   // Termin Tarihi

  actionPlan        String?                     @db.Text // Planlanan Aksiyon

  currentNote       String?                     @db.Text // Son güncel not (geriye dönük uyumluluk)

  

  // Bütçe Alanları (HTML taslağındaki finding-budget-summary karşılığı)

  legacyBudget      Decimal?                    @db.Decimal(12, 2) // Kayıt üzerindeki başlangıç/eski bütçe

  currency          String                      @default("TRY")

  

  // Dinamik ekstra sütunlar (companyName, recommendation, equipmentSpec vb.)

  extraFields       Json?                       

  

  // Yumuşak Silme (Soft Delete & Çöp Kutusu desteği)

  isArchived        Boolean                     @default(false)

  deletedAt         DateTime?

  deletedById       String?

  deleteReason      String?

  actions           ImprovementAction[]

  histories         ImprovementRecordHistory[]

  createdById       String?

  createdAt         DateTime                    @default(now())

  updatedAt         DateTime                    @updatedAt

  @@index([facilityId, sheetType, isArchived])

  @@index([riskScore, status])

}

// YENİ MODEL: Bulguya Ait Aksiyon Kartları (compact-actions-dialog karşılığı)

model ImprovementAction {

  id                String            @id @default(uuid())

  recordId          String

  record            ImprovementRecord @relation(fields: [recordId], references: [id], onDelete: Cascade)

  

  actionDescription String            @db.Text // Yapılan işlem / aksiyon açıklaması

  statusAfterAction String?           // Bu aksiyonla birlikte geçilen durum

  responsiblePerson String?           // Aksiyonu alan sorumlu

  actionDate        DateTime          @default(now())

  dueDate           DateTime?         // Aksiyon termin tarihi

  

  // Aksiyon Bütçesi (compact-action-budget)

  costAmount        Decimal?          @db.Decimal(12, 2)

  currency          String            @default("TRY")

  

  // Ekstra detaylar (compact-action-extra-grid: Tedarikçi, Fatura No, İş Emri No, Notlar vb.)

  extraDetails      Json?

  origin            String            @default("MANUAL") // 'MANUAL' | 'EXCEL_IMPORT' | 'LEGACY'

  

  isDeleted         Boolean           @default(false)

  deletedAt         DateTime?

  deletedById       String?

  

  createdById       String

  createdAt         DateTime          @default(now())

  updatedAt         DateTime          @updatedAt

  @@index([recordId, isDeleted])

}


5. Matematiksel Kurallar ve İş Mantığı (Zero-Assumption Logic)
Backend servislerinde (improvementAnalytics.service.ts ve improvementReport.service.ts) uygulanacak kesin hesaplama formülleri:
5.1. Tamamlanma Oranı Algoritması
HTML taslağındaki IF(OR(C26=0, C26-G26=0, C26<>SUM(D26:G26)), "n.a.", D26/(C26-G26)) formülünün TypeScript karşılığı:

export function calculateCompletionRate(metrics: {

  total: number;

  completed: number;

  inProgress: number;

  notStarted: number;

  cancelled: number;

  openCount?: number;

}): { rate: number | null; display: string; hasIncompleteStatus: boolean } {

  const { total, completed, inProgress, notStarted, cancelled } = metrics;

  const categorizedSum = completed + inProgress + notStarted + cancelled;

  if (total === 0) {

    return { rate: null, display: 'n.a.', hasIncompleteStatus: false };

  }

  // Eğer durumu boş, 'Açık' veya tanımsız kayıt varsa (toplam != 4 ana durum toplamı)

  if (total !== categorizedSum) {

    return { rate: null, display: 'n.a.', hasIncompleteStatus: true };

  }

  const actionableTotal = total - cancelled;

  if (actionableTotal <= 0) {

    return { rate: null, display: 'n.a.', hasIncompleteStatus: false };

  }

  const ratio = (completed / actionableTotal) * 100;

  return {

    rate: Math.round(ratio),

    display: `%${Math.round(ratio)}`,

    hasIncompleteStatus: false,

  };

}
5.2. Rapor / Operasyon Durumu ve Çelişki (Conflict) Tespiti
Her hastane ve takip alanı (sheetType) için CompactReportOverview tablosunda gösterilecek kurallar:

Gecikme (isOverdue): nextScheduledDate < Bugün ise ve bu tarihten sonra yeni bir rapor girilmemişse isOverdue = true döner (report-overdue uyarısı).
Sonuç Çelişkisi (hasConflict): Eğer bir raporun durumu CLEAR (Uygunsuzluk Yok) olarak işaretlenmiş ancak o rapora bağlı veya aynı tarihte o hastane/sekmede açık bulgu (ImprovementRecord) varsa report-conflict uyarısı üretilir: "Rapor temiz işaretli ancak bağlı tespit kaydı bulunuyor."
Bütçe Konsolidasyonu (finding-budget-summary):
legacyBudget: Kaydın kendi üzerindeki bütçe.
actionsBudget: actions.filter(a => !a.isDeleted).reduce((sum, a) => sum + Number(a.costAmount || 0), 0)
totalBudget: (legacyBudget || 0) + actionsBudget (Arayüzde 3 ayrı kutu olarak gösterilir: Kayıt Bütçesi, Aksiyon Bütçesi, Toplam Bütçe).


6. Backend Mimari ve API Sözleşmesi (backend/src/)
Mevcut 920 satırlık backend/src/routes/improvements/index.ts parçalanarak aşağıdaki dosya yapısına dönüştürülecektir:

backend/src/

├── routes/improvements/

│   ├── index.ts                         # Ana router birleştirici

│   ├── analytics.routes.ts              # Dashboard, grup istatistikleri, veri kalitesi

│   ├── records.routes.ts                # Bulgu CRUD, toplu silme, renumber, Excel import

│   ├── reports.routes.ts                # YENİ: Operasyon/Kontrol raporları CRUD ve geçmişi

│   ├── actions.routes.ts                # YENİ: Bulgu aksiyon kartları ve bütçe işlemleri

│   ├── trash.routes.ts                  # YENİ: Silinen kayıtlar ve geri yükleme (Restore)

│   └── validators.ts                    # Tüm Zod şemaları

└── services/improvements/

    ├── improvementAnalytics.service.ts  # 9 sekme matrisi, hastane karşılaştırması, 3'lü accordion

    ├── improvementRecord.service.ts     # Bulgu CRUD ve renumber

    ├── improvementReport.service.ts     # Rapor/Operasyon hesaplamaları, 2 adımlı sihirbaz kaydı

    ├── improvementAction.service.ts     # Aksiyon ekleme, bütçe toplama, durum senkronizasyonu

    └── improvementExcel.service.ts      # Tip A, Tip B, Tip C sütun haritalarına göre Excel import/export
API Uç Noktaları Detayı
GET /api/operations/improvements/dashboard-stats?facilityId=ALL

Yanıt:
kpis: { totalFindings, completed, completionRateDisplay, missingStatusCount, missingRiskCount, missingOwnerCount }
notice: { type: 'amber' | 'neutral', message: string }
statusDistribution: Durum dağılımı dizisi
riskDistribution: Risk dağılımı dizisi
qualityGrid: { emptyStatus, emptyRisk, emptyOwner, emptyAction, emptyDate, emptyFacility, undefinedStatus, undefinedRisk }
areaSummaryMatrix: 9 sekmenin tamamı için 12 sütunlu özet tablo satırları + Toplam satırı
hospitalComparisonMatrix: Tüm hastaneler için 12 sütunlu karşılaştırma satırları (Üstteki hastane filtresinden etkilenmez, her zaman grup genelini gösterir!)
hospitalFindingAccordion: Hospital -> SheetType -> Category 3 seviyeli kırılım ağacı.

GET /api/operations/improvements/group-stats?group=ELEKTRIK_BAKIM_KONTROL&facilityId=ALL

Yanıt: Grup sayfasındaki 6 KPI (group-kpi-grid), grup içi sekme özet tablosu (group-summary-table), 6'lı operasyon metrikleri (group-operation-metrics: Rapor Girilen Hastane, Geciken Kontrol, Açık Tespitli Rapor vb.) ve Hastane Operasyon Matrisi (hospital-operation-table).

GET /api/operations/improvements/reports/overview?sheetType=...&facilityId=...

Yanıt: Seçili sekme için hastane bazında son kontrol (INSPECTION), son bakım (MAINTENANCE), gelecek tarih, gecikme durumu, açık/kritik bulgu sayıları.

POST /api/operations/improvements/reports/wizard

İstek Gövdesi (Zod):

{

  facilityId: z.string().uuid(),

  sheetType: z.nativeEnum(ImprovementSheetType),

  operationType: z.nativeEnum(ImprovementOperationType),

  reportDate: z.string(),

  nextScheduledDate: z.string().optional().nullable(),

  resultStatus: z.nativeEnum(ImprovementReportResult),

  companyName: z.string().optional(),

  inspectorName: z.string().optional(),

  reportNo: z.string().optional(),

  summaryNotes: z.string().optional(),

  newFindings: z.array(FindingCreateSchema).optional(), // 2. adımdaki tablo satırları

  linkedFindingIds: z.array(z.string().uuid()).optional() // Rapora bağlanan mevcut bulgular

}

İşlem: Tek bir Prisma $transaction içinde raporu oluşturur, yeni bulguları reportId ile kaydeder, mevcut seçili bulguların reportId alanını günceller ve rowNo numaralarını yeniden sıralar.

POST /api/operations/improvements/record/:id/actions

İşlem: Yeni ImprovementAction oluşturur. Eğer istek içinde updateRecordStatus gönderilmişse ImprovementRecord.status alanını günceller ve ImprovementRecordHistory kaydı atar.

GET /api/operations/improvements/trash?facilityId=... & POST /api/operations/improvements/restore

Silinmiş (isArchived: true veya isDeleted: true) Rapor, Bulgu ve Aksiyonları listeler; restore çağrıldığında ilgili kaydı geri yükler.


7. Frontend Mimari ve UI/UX Dönüşüm Rehberi (apps/web)
HTML taslağındaki tüm görsel ve etkileşimli özelliklerin React 19 + Tailwind CSS + shadcn/ui mimarisine taşınması için aşağıdaki bileşen ağacı uygulanmalıdır:

apps/web/src/pages/operations/improvements/

├── ImprovementsLayout.tsx               # Daraltılabilir (collapsible) gruplu sol menü, üst bar, Silinenler (Trash) butonu, Toast Undo

├── ImprovementsDashboardPage.tsx        # Ana Genel Bakış (6 KPI, Veri Kalitesi Grid'i, 3'lü Accordion, Kritik Tablo, Hastane Matrisi)

├── GroupDashboardPage.tsx               # YENİ: Grup başlıklarına (örn. Elektrik Kontrolleri) tıklandığında açılan 6 KPI'lı grup özet ekranı

├── CriticalItemsPage.tsx                # 4'lü filtre (Hastane, Kaynak, Kategori, Durum) + Sıralanabilir Kritik Tablo

├── SourceSheetPage.tsx                  # YENİ (DenetimlerPage ve ElectricalTrackingPage birleşimi): Üstte Rapor Özeti + Altta Gelişmiş Kaynak Tablo

├── hooks/

│   └── useImprovementsQueries.ts        # YENİ: Tüm TanStack Query (useQuery, useMutation, optimistic updates) kancaları

├── components/

│   ├── DataQualityNotice.tsx            # Eksik veri (boş durum/risk/sorumlu) uyarı banner'ı ve 4'lü kalite grid'i

│   ├── HospitalFindingAccordion.tsx     # Hastane -> Takip Alanı -> Kategori 3 seviyeli daraltılabilir özet bileşeni

│   ├── CompactReportOverview.tsx        # Sekme üstündeki Rapor/Operasyon özeti (Kontrol vs Bakım, gecikme rozetleri, "Rapor Ekle")

│   ├── AdvancedSourceTable.tsx          # Excel tarzı sütun filtreleme (Popover), 4 satır line-clamp önizleme, sağda sabit (sticky) 3'lü aksiyon butonu

│   ├── ColumnFilterPopover.tsx          # Sütun içi A->Z sıralama, koşul (içerir, eşittir, boş) ve değer seçme menüsü

│   └── dialogs/

│       ├── PkReportWizardDialog.tsx     # 2 Adımlı PK Raporu ve Çoklu Bulgu Grid Sihirbazı (pk-wizard)

│       ├── AuditReportDialog.tsx        # Denetim Raporu + Çoklu Bulgu Tablosu + Mevcut Bulguları Bağlama (audit-report-dialog)

│       ├── SeparatedHistoryDialog.tsx   # Kontrol ve Bakım geçmişini iki ayrı sütunda gösteren rapor geçmişi modalı

│       ├── ActionWorkspaceDialog.tsx    # Sol: Yeni Aksiyon & Bütçe Formu | Sağ: Aksiyon Kartları Geçmişi (compact-actions-dialog)

│       ├── CompactInspectDialog.tsx     # 3'lü Bütçe Özeti (Toplam/Aksiyon/Kayıt) + 3 Sütunlu Detay + Aksiyon Geçmişi (compact-inspect-dialog)

│       ├── RecordFormDialog.tsx         # Tekil bulgu ekleme/düzenleme (3 sütunlu unified-compact-dialog)

│       └── DeletedRecordsDialog.tsx     # Silinen kayıtları ve raporları listeleme / geri yükleme (Trash) modalı

└── types.ts
Birebir Uygulanacak UI/UX Kuralları
Sol Navigasyon (ImprovementsLayout.tsx):
Sol menüde Denetimler tekil sekme, Elektrik & Periyodik Kontroller ise açılır-kapanır grup (nav-group) olarak yer alır.
Grup başlığına (nav-group-page) tıklandığında /operations/improvements/group/electrical rotasına giderek GroupDashboardPage açılır; yanındaki oka tıklandığında 8 alt elektrik sekmesi açılır/kapanır.
Tablo Satır Yüksekliği ve Sabit İşlem Sütunu (AdvancedSourceTable.tsx):
Hücre içi metinlerde line-clamp-4 max-h-16 leading-4 whitespace-pre-wrap break-words uygulanarak satır yüksekliği sınırlandırılır.
Sağdaki İşlem sütunu sticky right-0 z-10 bg-[#fbfcfe] w-[100px] olarak sabitlenir ve içinde alt alta 3 kompakt buton bulunur: İncele, Aksiyon Gir, Düzenle.
Birleşik Kompakt Modal Boyutlandırması (unified-compact-dialog):
Tüm modallar max-w-[800px] (Sihirbaz 2. adımında max-w-[1320px], Denetim raporunda max-w-[1260px]), max-h-[84dvh], 3 sütunlu form grid'i (grid-cols-3 gap-3) ve kompakt input yükseklikleri (h-8 text-xs) ile ekrana taşmadan sığacak şekilde tasarlanır.
Silme Onayı ve Anında Geri Alma (Toast Undo):
Kayıt, aksiyon veya rapor silindiğinde sonner / toast üzerinden "Kayıt silindi" mesajı ve yanında "Geri Al" aksiyon butonu gösterilir. Tıklandığında /restore ucu çağrılarak cache yenilenir.


8. Agent Sistemi (workflow-orchestrator) İçin Adım Adım Uygulama Komutları
Bu dokümanı geliştirici AI Agent'a verirken aşağıdaki sırayla ilerlemesini talep edin:

Adım 1 (@sec-portali/shared): packages/shared altında 9 ImprovementSheetType sabitini, Excel sütun şemalarını (Tip A, B, C) ve doğrulama listelerini oluştur.
Adım 2 (database-architect): backend/prisma/schema.prisma dosyasını Bölüm 4'teki modellerle güncelle ve Docker içinde npx prisma db push (veya migrate dev) çalıştırarak Prisma Client'ı üret.
Adım 3 (fullstack-engineer - Backend): backend/src/services/improvements/ altındaki 5 servisi ve backend/src/routes/improvements/ altındaki modüler route dosyalarını Bölüm 5 ve Bölüm 6'daki kurallara göre kodla. Eski 920 satırlık tekil yapıyı kaldır.
Adım 4 (fullstack-engineer - Frontend): useImprovementsQueries.ts ile TanStack Query altyapısını kur. Bölüm 7'deki sayfa, tablo ve 7 dialog bileşenini eksiksiz oluştur. App.tsx içindeki rotaları yeni GroupDashboardPage ve SourceSheetPage yapısına göre güncelle.
Adım 5 (quality-assurance & cleaner-knip): Docker ortamında build al (npm run build), tip hatalarını sıfırla (any kullanma) ve knip ile boşa çıkan eski dosyaları temizle.
