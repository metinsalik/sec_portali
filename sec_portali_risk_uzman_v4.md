# BÖLÜM 4: RİSK YAŞAM DÖNGÜSÜ MODÜLÜ - İSG UZMANI SÜRÜMÜ (V4)

## 4.1 Modülün Temel Mantığı (Faz 1: Uzman Odaklı Yapı)
Bu modülün ilk fazı, **sadece İSG Uzmanlarının** kendi sorumluluklarındaki tesislerin risk değerlendirmelerini uçtan uca dijitalleştirmesi ve yönetmesi üzerine kurgulanmıştır. Diğer çalışanlar (doktor, hemşire, teknik personel vb.) sisteme dahil edilmeyecektir. İSG uzmanı, atandığı tesis üzerinde **tam yetkilidir** ve tüm bölümlerin risk süreçlerini tek bir panelden yönetir.

Riskin ömrü, uzman tarafından 4 aşamalı ardışık bir blok üzerinden izlenir ve yönetilir:
`[ İLK TESPİT ] ➔ [ İLK MÜDAHALE / PLANLAMA ] ➔ [ TAKİP İYİLEŞTİRMELERİ ] ➔ [ GÜNCEL DURUM ]`

---

## 4.2 Veritabanı Modeli (Uzman-Tesis Mimarisi - Prisma)
Kullanıcı yetkilendirmesi departman bazlı karmaşık yapıdan çıkarılıp, doğrudan **Uzman ➔ Tesis** mantığına sadeleştirilmiştir. Uzman, tesisine ait tüm bölümleri ve riskleri yönetebilir.

```prisma
// =========================================================================
// 1. UZMAN VE TESİS YÖNETİMİ
// =========================================================================
model Facility {
  id          String           @id @default(uuid())
  name        String           // Örn: "Topkapı Liv Hospital"
  experts     ExpertFacility[] // Tesise atanan İSG Uzman(lar)ı
  departments Department[]
}

// İSG Uzmanı - Tesis Eşleştirmesi (Uzman birden fazla tesise bakabilir)
model ExpertFacility {
  expertId    String     // Sistemdeki Uzman ID'si
  facilityId  String
  facility    Facility   @relation(fields: [facilityId], references: [id], onDelete: Cascade)
  
  @@id([expertId, facilityId])
}

model Department {
  id          String          @id @default(uuid())
  facilityId  String
  name        String          // Örn: "Acil Servis", "Ameliyathane"
  risks       RiskLifecycle[]
  facility    Facility        @relation(fields: [facilityId], references: [id], onDelete: Cascade)
}

// =========================================================================
// 2. RİSK YAŞAM DÖNGÜSÜ (Aşamalı Takip)
// =========================================================================
model RiskLifecycle {
  id               String     @id @default(uuid())
  departmentId     String
  riskNo           Int        // Excel'deki sıra numarası
  riskCategory     String     
  subCategory      String?    
  area             String     // Örn: "Laboratuvar Patoloji Bölümü"
  
  // --- AŞAMA 1: İLK TESPİT (Uzman tarafından girilen/aktarılan kök veri) ---
  activity         String     
  hazard           String     
  riskDescription  String     
  initialCondition String     
  initialImage     String?    // Docker Nginx statik dosya yolu
  initialProb      Float      
  initialFreq      Float?     
  initialSev       Float      
  initialScore     Float      
  initialLevel     String     // "Yüksek Risk", "Kabul Edilemez" vb.

  // --- AŞAMA 2: İLK MÜDAHALE (Uzmanın planladığı ve uygulattığı aksiyonlar) ---
  firstActionPlan  String?    
  actionsTaken     String?    
  actionDate       DateTime?  
  actionBy         String?    // Sorumlu Birim (Metin olarak - Sisteme girmelerine gerek yok)
  actionImage      String?    

  // --- AŞAMA 3: TAKİP İYİLEŞTİRMELERİ (Uzmanın etkinlik ölçümü ve ek önlemleri) ---
  followUpMeasure  String?    
  extraImprovement String?    
  finalProb        Float?     
  finalFreq        Float?     
  finalSev         Float?     
  finalScore       Float?     
  finalLevel       String?    

  // --- AŞAMA 4: YAŞAM DÖNGÜSÜ DURUMU ---
  status           String     // "ACIK_TEHLIKE", "ILK_MUDAHALE_EDILDI", "TAKIP_SURECINDE", "KAPATILDI_GUVENLI"
  updatedAt        DateTime   @updatedAt

  department       Department @relation(fields: [departmentId], references: [id], onDelete: Cascade)
}
```

---

## 4.3 İSG Uzmanı Dashboard Tasarımı (UI/UX)

Diğer kullanıcı rolleri devreden çıktığı için arayüz tamamen uzman verimliliğine odaklanır.

### 4.3.1 Tesis Konsolu
* Uzman giriş yaptığında, sorumlu olduğu tesisi (veya tesisleri) görür.
* Tesis seçildiğinde, sol menüde o tesise ait **Bölümler (Departmanlar)** listelenir.
* Üst barda **"Excel'den Aktar"** butonu her zaman erişilebilirdir. Uzman, şablonunu anında sisteme gömebilir.

### 4.3.2 4 Bloklu Yaşam Döngüsü Kartı
Uzman bir departmana (Örn: Acil Servis) tıkladığında, riskler alt alta 4 aşamalı bloklar halinde listelenir. Uzman tek yetkili olduğu için her bloğun üzerinde anında düzenleme (inline edit) yapabileceği ikonlar bulunur.

```text
[+ YENİ RİSK EKLE]  [📥 EXCEL İÇERİ AKTAR]

BÖLÜM: ACİL SERVİS | RİSK NO: #12                                       DURUM: [TAKİP SÜRECİNDE]
------------------------------------------------------------------------------------------------
[ AŞAMA 1: İLK TESPİT ]    | [ AŞAMA 2: İLK MÜDAHALE ]  | [ AŞAMA 3: TAKİP ]        | [ SKOR ]
                           |                            |                           |
• Tehlike: Tıbbi Atık      | • Plan: Kutu değişimi      | • Ölçüm: Yetersiz         | İlk: 400
• Risk: Enfeksiyon         | • Yapılan: Pedallı kutu    | • Ek Önlem: Sensör        | 
• Durum: Aşırı dolu        | • Tarih: 12.05.2026        |                           | Son: 21
[✏️ Düzenle] [📷 Resim]    | [✏️ Düzenle] [📷 Resim]    | [✏️ Düzenle] [📷 Resim]   | 
------------------------------------------------------------------------------------------------
```

---

## 4.4 Excel Import Mekanizması (Uzman İçin Otonom Yapı)
Sadece uzman kullanacağı için, Excel yükleme süreci ekstra onay mekanizmalarından arındırılmıştır.
1.  Uzman, `Fine Kinney Metodu` veya `Matris` tablosunu sisteme yükler.
2.  Sistem, Excel'deki departmanları kontrol eder. Veritabanında olmayan bir departman ismi varsa (Örn: "Yenidoğan Yoğun Bakım"), **uzmana sormadan** o tesise yeni departman olarak otomatik ekler.
3.  Tüm satırlar, Excel'deki sütun durumlarına göre `ACIK_TEHLIKE`, `ILK_MUDAHALE_EDILDI` veya `KAPATILDI_GUVENLI` statülerine otomatik atanarak 4'lü bloğa yerleştirilir.

---

## 4.5 Docker Altyapısı ve Dosya Yönetimi
Uzmanın saha denetimlerinde çekeceği veya Excel'de belirttiği tehlike/iyileştirme fotoğrafları (`initialImage`, `actionImage`), Docker ortamındaki nginx proxy üzerinden `/uploads/risks/` dizininde statik olarak servis edilecektir. Veritabanında sadece bu dosya yolları saklanarak performans optimize edilir.
