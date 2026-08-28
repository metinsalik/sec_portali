# İSG Tespit ve Öneri Defteri Modülü Tasarım ve Geliştirme Yönergesi

Bu doküman, İş Sağlığı ve Güvenliğine İlişkin Tespit ve Öneri Defteri modülünün kullanıcı arayüzü (UI) ve veri yapısı gereksinimlerini tanımlar. Geliştirme sürecinde modern, sade ve erişilebilir bir deneyim sunulması hedeflenmektedir.

## 1. Tasarım Sistemi ve UI Bileşenleri (ÖNEMLİ)

Tasarımın bütününde kesinlikle **shadcn-ui** bileşen seti ve **Tailwind CSS** kullanılmalıdır. Arayüzde sadelik, net sınırlar, gölgelendirmeler (shadow-sm) ve zinc/slate renk paleti tercih edilmelidir. 
*   **Bileşenler:** Tablolar (`DataTable`), Form Elemanları (`Select`, `Input`, `Textarea`), Açılır Pencereler (`Dialog/Modal`), Kartlar (`Card`), Rozetler (`Badge`) shadcn-ui standartlarında olmalıdır.
*   **Renkler:** Risk düzeylerine göre (Çok Yüksek: Kırmızı, Orta: Sarı vb.) `Badge` bileşenleri renklendirilmelidir.

## 2. Navigasyon ve Layout Yapısı

Daha önceki üst sekme (tab) yapısı iptal edilerek, tüm navigasyon ekranın sol tarafındaki **Sidebar (Yan Menü)** üzerine taşınmalıdır. 

*   **Sol Menü (Sidebar) Hiyerarşisi:**
    *   **HSE PORTALI (Başlık)**
        *   Tesis Seçici (Örn: İstinye Üni. Liv Hospital)
    *   **İSG YÖNETİMİ (Kategori)**
        *   **Tespit ve Öneri Defteri** (Ana Menü Elemanı - Genişletilebilir)
            *   📊 Dashboard (Analytics)
            *   📋 Defter Kayıtları
            *   ⚙️ Modül Ayarları

Kullanıcı sol menüden ilgili alt sekmeye tıkladığında, sağ taraftaki geniş içerik alanı (Main Content) güncellenmelidir.

## 3. Veri Modeli ve Form Alanları

Yeni bir tespit/öneri girişi yapılırken veya mevcut kayıtlar listelenirken aşağıdaki veri alanları zorunlu olarak bulunmalıdır:

### 3.1. Temel Defter Bilgileri
*   **Defter (Cilt) Seçimi:** Hangi ciltte işlem yapıldığı (Örn: 2. Cilt - Aktif).
*   **Yaprak No(ları):** Kararın defterde denk geldiği sayfa veya sayfalar arası (Örn: 12 veya 12-15).
*   **Tarih:** Defter yaprağına atılan tarih. Aynı tarihte birden fazla yaprak yazılmış olabilir, bu yapı desteklenmelidir.

### 3.2. Tespit ve Sınıflandırma
*   **Tespit Eden (Yazan Kişi):** Bu kararı kimin yazdığını belirten alan. İki seçenekten biri seçilmelidir:
    *   İş Güvenliği Uzmanı
    *   İşyeri Hekimi
*   **Kategori:** Eğitim, KKD, Makine/Ekipman, Acil Durum vb.
*   **Risk Düzeyi:** Çok Yüksek, Yüksek, Önemli, Olası, Düşük (Kullanıcı tarafından ayarlardan değiştirilebilir).
*   **Tespit / Öneri Metni:** Deftere yazılan asıl metin.

### 3.3. Aksiyon, Durum ve Kanıt Yönetimi (YENİ ÖZELLİK)
Her bir tespit maddesinin bir yaşam döngüsü olmalıdır. Madde sadece "Tamamlandı" olarak işaretlenip bırakılmamalı, altına **aksiyon** girilebilmelidir.
*   **Aksiyon Geçmişi:** Kullanıcılar bir maddeye tıkladığında veya genişlettiğinde (Accordion/Expandable Row) o madde için alınan aksiyonları metin olarak girebilmelidir.
*   **Kanıt Yükleme:** Alınan aksiyonu doğrulamak için sisteme kanıt (Fotoğraf veya PDF) yüklenebilmelidir (Örn: "Topraklama yapıldı" metninin yanına topraklama ölçüm raporu PDF'inin eklenmesi).
*   **Durum (Status):** Aksiyonlara bağlı olarak ana maddenin durumu (Örn: Açık, Planlandı, Tamamlandı, Gecikmiş) güncellenmelidir.

## 4. Ekran Modülleri

### 4.1. Dashboard Ekranı
*   Tüm tespitlerin sayısını, kapanmamış (açık) işlerin oranını ve kritik riskleri gösteren Tepe KPI Kartları.
*   Kategorilere ve Risk Düzeylerine göre dağılımı gösteren grafikler (Bar Chart, Donut Chart).
*   Filtreler: Cilt, Ay, Tesis bazlı sorgulama yapılabilmelidir.

### 4.2. Defter Kayıtları Ekranı
*   Kayıtların listelendiği gelişmiş veri tablosu (`shadcn DataTable`).
*   Tablo satırlarında **Tespit Eden (İG Uzmanı / İşyeri Hekimi)** bilgisi açıkça görünmelidir.
*   **Sol Kolon (Defter Nüshası):** İlgili cilt ve yaprak seçilerek fiziki defterin PDF veya fotoğraf kopyası yüklenebilmeli ve önizlenebilmelidir.
*   **Aksiyon Ekleme:** Tablodaki her bir satırın sonunda yer alan işlemler menüsünden "Aksiyon / Kanıt Ekle" seçeneği açılmalı ve kullanıcı upload modalına yönlendirilmelidir.

### 4.3. Modül Ayarları Ekranı
*   Kullanıcının (veya yöneticinin) Cilt Tanımlarını (sayfa kapasitesi, dolum durumu), Risk Düzeylerini ve Kategorileri esnek bir şekilde ekleyip çıkarabileceği parametrik ayar arayüzü. 
*   Bu sistem, İSG dışındaki kurumsal risklerden arındırılmış, sadece İş Sağlığı ve Güvenliğine odaklı olmalıdır.
