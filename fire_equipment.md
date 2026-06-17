# Fire Equipment Modülü (Uygulama Klasörü: fire_equipment)

## Önerilen Ürün Adı

**FireTrack 360**

Alternatifler:
- FireSphere
- FireGuard Asset Manager
- FireLife
- FireOps
- SafeFire Portal

Bu dokümanda modül adı teknik olarak **fire_equipment**, kullanıcıya görünen ürün adı ise **FireTrack 360** olarak önerilmiştir.

## Amaç

Tesislerde bulunan tüm yangın mücadele ekipmanlarının yaşam döngüsü boyunca;

- Envanter yönetimi
- Yerleşim takibi
- Periyodik bakım yönetimi
- Arıza takibi
- Uygunsuzluk yönetimi
- Denetim süreçleri
- QR kod ile erişim
- Raporlama ve izlenebilirlik

süreçlerini merkezi olarak yönetmek.

## Modül Kapsamı

### 1. Envanter Yönetimi

Her ekipman için aşağıdaki bilgiler tutulur.

#### Kimlik Bilgileri

- Ekipman No
- Barkod / QR Kod
- Seri No
- Ekipman Türü
- Marka
- Model
- Üretim Yılı

#### Lokasyon Bilgileri

- Tesis
- Bina
- Blok
- Kat
- Bölüm
- Konum Açıklaması

#### Teknik Bilgiler

- Kapasite
- Standart
- Kritiklik Seviyesi
- Sorumlu Birim

#### Durum Bilgileri

- Aktif
- Depoda
- Arızalı
- Hurda
- Kullanım Dışı

### 2. Ekipman Türleri Yönetimi

Master veri olarak yönetilir.

Örnek ekipmanlar:

- Yangın Tüpü
- Yangın Dolabı
- Hidrant
- Sprinkler
- Yangın Alarm Butonu
- Duman Dedektörü
- Isı Dedektörü
- Yangın Perdesi
- Yangın Kapısı
- Yangın Battaniyesi
- Gazlı Söndürme Sistemi

### 3. Yerleşim ve Konum Takibi

Sadece mevcut konum değil, tüm geçmiş hareketler tutulur.

#### Yer Değişikliği Kaydı

- Tarih
- Eski Konum
- Yeni Konum
- Sebep
- İşlemi Yapan Kişi
- Açıklama

Amaç tam izlenebilirlik sağlamaktır.

### 4. Bakım Yönetimi

#### Periyodik Bakım

- Bakım Tarihi
- Firma
- Teknisyen
- Sonuç
- Açıklama

#### Bakım Sonuçları

- Uygun
- Şartlı Uygun
- Uygun Değil

#### Sonraki Bakım Tarihi

Ekipman türüne göre otomatik hesaplanır.

Örnek:

- Yangın Tüpü → 12 Ay
- Hidrant → 12 Ay
- Alarm Sistemi → 6 Ay

### 5. Arıza ve Uygunsuzluk Yönetimi

#### Kayıt Bilgileri

- Bildirim Tarihi
- Bildiren Kişi
- Arıza Türü
- Risk Seviyesi
- Açıklama

#### Durumlar

- Açık
- Devam Ediyor
- Tamamlandı
- İptal

### 6. Yaşam Döngüsü Yönetimi

Her ekipman için kronolojik olay geçmişi tutulur.

#### Olay Türleri

- Oluşturma
- Montaj
- Yer Değişikliği
- Bakım
- Arıza
- Kalibrasyon
- Değişim
- Hurdaya Ayırma

Bu kayıtlar silinmez.

### 7. Denetim Modülü

Yangın ve İSG denetimleri için kullanılacaktır.

#### Kontrol Listesi

- Yerinde mi?
- Erişilebilir mi?
- Etiketi mevcut mu?
- Basıncı uygun mu?
- Son bakım geçerli mi?

#### Sonuçlar

- Uygun
- Eksik
- Kritik Eksik

### 8. QR Kod Entegrasyonu

Her ekipman için:

- QR Kod üretimi
- Mobil erişim
- Hızlı ekipman kartı görüntüleme
- Mobil denetim desteği

### 9. Dashboard

#### KPI Alanları

- Toplam Ekipman
- Yaklaşan Bakımlar
- Geciken Bakımlar
- Açık Arızalar
- Kritik Uygunsuzluklar

#### Grafikler

- Ekipman Türlerine Göre Dağılım
- Aylık Bakım Planı
- Geciken Bakımlar
- Lokasyon Bazlı Dağılım

## Veri Modeli

Önerilen tablolar:

- FireEquipment
- FireEquipmentCategory
- FireEquipmentLocation
- FireEquipmentMovement
- FireEquipmentMaintenance
- FireEquipmentIncident
- FireEquipmentInspection
- FireEquipmentLifecycleEvent
- FireEquipmentAttachment

## Frontend Sayfaları

- FireEquipmentDashboard
- FireEquipmentListPage
- FireEquipmentDetailPage
- FireEquipmentFormPage
- FireEquipmentMaintenancePage
- FireEquipmentInspectionPage
- FireEquipmentReportsPage

## Bileşenler

- EquipmentTable
- EquipmentForm
- EquipmentCard
- MaintenanceForm
- InspectionChecklist
- MovementHistory
- LifecycleTimeline
- QRCodeViewer

## Fazlandırma

### Faz 1 (MVP)

- Envanter Yönetimi
- Konum Takibi
- Bakım Yönetimi
- QR Kod
- Dashboard

### Faz 2

- Arıza Yönetimi
- Denetim Modülü
- Yaşam Döngüsü Yönetimi

### Faz 3

- Mobil Denetim
- Fotoğraf Yükleme
- Excel Aktarımı
- PDF Aktarımı
- Gelişmiş Raporlama

## Beklenen Kazanımlar

- Merkezi yangın ekipman yönetimi
- Bakım gecikmelerinin önlenmesi
- Denetim hazırlık süresinin azaltılması
- Tam izlenebilirlik ve audit geçmişi
- Mobil QR destekli saha kullanımı
- Kurumsal yangın güvenliği süreçlerinin dijitalleştirilmesi
