import React, { useState, useEffect } from 'react';
import { 
  Settings, Sliders, Shield, Bell, FileSpreadsheet, Building2, 
  Info, Tag, Plus, Trash2, RotateCcw, Check, Save 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';

const API = import.meta.env.VITE_API_URL || '';

const DEFAULT_CATEGORIES = [
  'Yangın Güvenliği',
  'Elektrik Güvenliği',
  'Mekanik / Tesisat',
  'Kimyasal Güvenlik',
  'İş Güvenliği / Fiziksel Riskler',
  'Acil Durum & Tahliye',
  'Diğer'
];

export const ImprovementsSettingsPage: React.FC = () => {
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Kategorileri getir
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/operations/improvements/categories`, {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setCategories(data.data);
      } else {
        setCategories(DEFAULT_CATEGORIES);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      setCategories(DEFAULT_CATEGORIES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Kategori Ekle
  const handleAddCategory = () => {
    const trimmed = newCategory.trim();
    if (!trimmed) return;
    if (categories.includes(trimmed)) {
      toast.error('Bu kategori zaten listede mevcut.');
      return;
    }
    setCategories(prev => [...prev, trimmed]);
    setNewCategory('');
  };

  // Kategori Sil
  const handleRemoveCategory = (catToRemove: string) => {
    setCategories(prev => prev.filter(c => c !== catToRemove));
  };

  // Varsayılanlara Sıfırla
  const handleResetDefaults = () => {
    if (window.confirm('Kategorileri sistem varsayılanlarına sıfırlamak istiyor musunuz?')) {
      setCategories(DEFAULT_CATEGORIES);
    }
  };

  // Kategorileri Kaydet
  const handleSaveCategories = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/operations/improvements/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ categories })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Kategoriler başarıyla güncellendi.');
      } else {
        throw new Error(data.message || 'Kaydedilemedi');
      }
    } catch (err: any) {
      toast.error('Hata: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      
      {/* Sayfa Başlığı */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold">
          <Settings className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            İyileştirme ve Aksiyon Takip Ayarları
          </h2>
          <p className="text-xs text-muted-foreground">
            Kategori yönetimi, modül parametreleri ve sistem kuralları.
          </p>
        </div>
      </div>

      {/* Bilgilendirme Notu */}
      <div className="p-4 bg-muted/40 border rounded-xl flex items-start gap-3">
        <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div className="text-xs text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Kategori Yönetimi:</strong> Denetimler ve tüm Elektrik Altyapı sekmelerinde Risk Skoru sütununun hemen öncesinde yer alan kategoriler buradan yönetilir. Excel'de kategori kolonu bulunmasa dahi sisteme girilen her satır için bu kategorilerden biri seçilebilir veya otomatik atanır.
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. KATEGORİ YÖNETİMİ KARTI (ÖNCELİKLİ & İNTERAKTİF)                */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="bg-card text-card-foreground border rounded-xl p-5 shadow-xs space-y-4">
        
        <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
          <div className="flex items-center gap-2.5">
            <Tag className="w-5 h-5 text-indigo-500" />
            <div>
              <h3 className="text-sm font-bold text-foreground">Takip ve Risk Kategorileri</h3>
              <p className="text-xs text-muted-foreground">
                Sistem genelinde kullanılabilir aktif kategori listesi ({categories.length} adet)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetDefaults}
              className="h-8 text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Varsayılanlara Dön
            </Button>
            <Button
              size="sm"
              onClick={handleSaveCategories}
              disabled={saving}
              className="h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Save className="w-3.5 h-3.5 mr-1.5" />
              {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
            </Button>
          </div>
        </div>

        {/* Yeni Kategori Ekleme Satırı */}
        <div className="flex items-center gap-2 pt-1">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddCategory();
              }
            }}
            placeholder="Yeni kategori adı yazın (Örn: Havalandırma & İklimlendirme)..."
            className="flex-1 h-9 px-3 rounded-lg border bg-background text-sm text-foreground focus:ring-2 focus:ring-primary outline-none"
          />
          <Button
            type="button"
            size="sm"
            onClick={handleAddCategory}
            className="h-9 px-3 text-xs"
          >
            <Plus className="w-4 h-4 mr-1" />
            Ekle
          </Button>
        </div>

        {/* Mevcut Kategoriler Listesi */}
        {loading ? (
          <div className="py-6 text-center text-xs text-muted-foreground animate-pulse">
            Kategoriler yükleniyor...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-2">
            {categories.map((cat, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-lg border bg-muted/30 hover:bg-muted/60 transition-colors group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                  <span className="text-xs font-medium text-foreground truncate">
                    {cat}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveCategory(cat)}
                  className="opacity-60 hover:opacity-100 hover:text-red-500 p-1 transition-opacity"
                  title="Kategoriyi Sil"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* DİĞER MODÜL BİLGİ KARTLARI                                         */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Kart 1: Hastane Kapsamı */}
        <div className="bg-card text-card-foreground border rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Building2 className="w-4 h-4 text-blue-500" />
              <h3 className="text-sm font-bold text-foreground">Tesis Kapsamı</h3>
            </div>
            <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-300 dark:border-emerald-800 dark:text-emerald-400">
              Aktif: Sadece Hastaneler
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Modülde yalnızca <strong>type = "Hastane"</strong> olan tesisler listelenir. Tıp merkezleri, depolar ve ofisler filtrelenerek dahil edilmez.
          </p>
        </div>

        {/* Kart 2: Sekme Yapılandırması */}
        <div className="bg-card text-card-foreground border rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-bold text-foreground">Takip Sekmeleri</h3>
            </div>
            <Badge variant="outline" className="text-[10px]">
              8 Sekme Aktif
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            1 Denetimler ve 7 Elektrik Altyapı/PK sekmesi (Elektrik PK, Topraklama PK, Paratoner PK, Jeneratör PK, Elektrik Pano Kontrolleri, Trafo, UPS) standart şablonla çalışmaktadır.
          </p>
        </div>

        {/* Kart 3: Risk ve Durum Tanımları */}
        <div className="bg-card text-card-foreground border rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-red-500" />
              <h3 className="text-sm font-bold text-foreground">Risk ve Durum Matrisi</h3>
            </div>
            <Badge variant="outline" className="text-[10px]">
              Standart
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Risk seviyeleri (Kritik, Yüksek, Önemli, Olası, Önemsiz) ve Durumlar (Başlamadı, Devam Ediyor, Tamamlandı, İptal Edildi) otomatik hesaplamalara bağlıdır.
          </p>
        </div>

        {/* Kart 4: Bildirim ve Eskalasyon */}
        <div className="bg-card text-card-foreground border rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Bell className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-foreground">Eskalasyon & Bildirim</h3>
            </div>
            <Badge variant="outline" className="text-[10px] text-muted-foreground">
              Hazır
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Kritik maddelerin gecikmesi durumunda ilgili hastane teknik birimine ve grup direktörlüğüne bildirim eskalasyonu desteklenir.
          </p>
        </div>

      </div>

    </div>
  );
};
