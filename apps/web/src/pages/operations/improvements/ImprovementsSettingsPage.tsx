import React, { useState, useEffect } from 'react';
import { 
  Settings, Sliders, Shield, Bell, FileSpreadsheet, Building2, 
  Info, Tag, Plus, Trash2, RotateCcw, Check, Save,
  FileText, Scale, ShoppingCart, HardHat, Package, Wrench, 
  CheckCircle2, MoreHorizontal, Sparkles, Layers, Edit2, X, ToggleLeft, ToggleRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';
import type { ImprovementActionTemplate, ActionTemplateField } from './types';

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

  // Aksiyon Kalıpları & Şablon State
  const [actionTemplates, setActionTemplates] = useState<ImprovementActionTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [templatesSaving, setTemplatesSaving] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ImprovementActionTemplate | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Veri Temizleme State
  const [facilities, setFacilities] = useState<Array<{ id: string; name: string }>>([]);
  const [cleanupFacilityId, setCleanupFacilityId] = useState('');
  const [cleanupSheetType, setCleanupSheetType] = useState('ALL');
  const [cleaning, setCleaning] = useState(false);

  const fetchFacilities = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/operations/improvements/facilities`, {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setFacilities(data.data);
        if (data.data.length > 0) {
          setCleanupFacilityId(data.data[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCleanupRecords = async () => {
    if (!cleanupFacilityId) {
      toast.error('Lütfen bir hastane seçin.');
      return;
    }

    const facObj = facilities.find(f => f.id === cleanupFacilityId);
    const confirmMsg = `${facObj?.name || cleanupFacilityId} hastanesinin ${cleanupSheetType === 'ALL' ? 'TÜM' : cleanupSheetType} verileri silinecektir. Emin misiniz?`;
    if (!window.confirm(confirmMsg)) return;

    setCleaning(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/operations/improvements/facility-records`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          facilityId: cleanupFacilityId,
          sheetType: cleanupSheetType,
        })
      });
      const d = await res.json();
      if (!res.ok || !d.success) throw new Error(d.message || 'Silinemedi');

      toast.success(d.message || 'Kayıtlar başarıyla temizlendi.');
      fetchFacilities();
      window.dispatchEvent(new Event('facilityChanged'));
    } catch (err: any) {
      toast.error('Hata: ' + err.message);
    } finally {
      setCleaning(false);
    }
  };

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

  // Aksiyon Kalıplarını Getir
  const fetchActionTemplates = async () => {
    try {
      setTemplatesLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/operations/improvements/action-templates`, {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setActionTemplates(data.data);
      }
    } catch (err) {
      console.error('Error fetching action templates:', err);
    } finally {
      setTemplatesLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchActionTemplates();
    fetchFacilities();
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

  // 🎯 Aksiyon Kalıpları Kaydet
  const handleSaveActionTemplates = async (newList?: ImprovementActionTemplate[]) => {
    const listToSave = newList || actionTemplates;
    try {
      setTemplatesSaving(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/operations/improvements/action-templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ templates: listToSave })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Aksiyon kalıpları başarıyla kaydedildi.');
        setActionTemplates(data.data);
      } else {
        throw new Error(data.message || 'Kaydedilemedi');
      }
    } catch (err: any) {
      toast.error('Hata: ' + err.message);
    } finally {
      setTemplatesSaving(false);
    }
  };

  // Aksiyon Kalıplarını Varsayılanlara Sıfırla
  const handleResetDefaultTemplates = async () => {
    if (!window.confirm('Aksiyon kalıplarını sistemin orijinal standart şablonlarına sıfırlamak istiyor musunuz?')) return;
    try {
      setTemplatesSaving(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/operations/improvements/action-templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ templates: [] }) // Empty triggers defaults in backend
      });
      const data = await res.json();
      if (data.success) {
        await fetchActionTemplates();
        toast.success('Aksiyon kalıpları varsayılanlara sıfırlandı.');
      }
    } catch (err: any) {
      toast.error('Hata: ' + err.message);
    } finally {
      setTemplatesSaving(false);
    }
  };

  // Kalıp Aktif/Pasif Toggle
  const handleToggleTemplate = (templateId: string) => {
    const updated = actionTemplates.map(t => {
      if (t.id === templateId) {
        return { ...t, isActive: t.isActive === false ? true : false };
      }
      return t;
    });
    setActionTemplates(updated);
    handleSaveActionTemplates(updated);
  };

  // Kalıp Sil
  const handleDeleteTemplate = (templateId: string) => {
    if (!window.confirm('Bu kalıbı silmek istediğinize emin misiniz?')) return;
    const updated = actionTemplates.filter(t => t.id !== templateId);
    setActionTemplates(updated);
    handleSaveActionTemplates(updated);
  };

  // Düzenleme / Yeni Kalıp Kaydet
  const handleSaveModal = (savedTemplate: ImprovementActionTemplate) => {
    let updated: ImprovementActionTemplate[];
    const exists = actionTemplates.some(t => t.id === savedTemplate.id);
    if (exists) {
      updated = actionTemplates.map(t => t.id === savedTemplate.id ? savedTemplate : t);
    } else {
      updated = [...actionTemplates, savedTemplate];
    }
    setActionTemplates(updated);
    handleSaveActionTemplates(updated);
    setIsModalOpen(false);
    setEditingTemplate(null);
  };

  // Kalıp İkonu Yardımcısı
  const getTemplateIcon = (iconName?: string) => {
    switch (iconName) {
      case 'FileText': return <FileText className="w-4 h-4" />;
      case 'Scale': return <Scale className="w-4 h-4" />;
      case 'ShoppingCart': return <ShoppingCart className="w-4 h-4" />;
      case 'HardHat': return <HardHat className="w-4 h-4" />;
      case 'Package': return <Package className="w-4 h-4" />;
      case 'Wrench': return <Wrench className="w-4 h-4" />;
      case 'CheckCircle2': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      default: return <MoreHorizontal className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      
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
            Aksiyon kalıpları, kategori yönetimi, modül parametreleri ve veri temizleme.
          </p>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. AKSİYON KALIPLARI VE ŞABLON YÖNETİMİ (ÖNCELİKLİ & ADIM ADIM)      */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="bg-card text-card-foreground border-2 border-primary/30 rounded-2xl p-6 shadow-sm space-y-5">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-foreground flex items-center gap-2">
                <span>🎯 Aksiyon Kalıpları ve Şablon Yönetimi</span>
                <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                  Step-by-Step Süreç
                </Badge>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Sahadan aksiyon girilirken kullanılan standart adımlar (Talep Açıldı, İhale, SS Verildi vb.) ve otomatik cümle kalıpları.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetDefaultTemplates}
              disabled={templatesSaving}
              className="h-8 text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Standart Şablonlara Sıfırla
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setEditingTemplate({
                  id: `CUSTOM_${Date.now()}`,
                  title: '',
                  description: '',
                  icon: 'FileText',
                  color: 'blue',
                  suggestedStatus: 'Devam Ediyor',
                  fields: [
                    { key: 'detay', label: 'Detay / Açıklama', type: 'text', placeholder: 'Açıklama...', required: true }
                  ],
                  sentenceTemplate: '{detay}',
                  isActive: true,
                });
                setIsModalOpen(true);
              }}
              className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Yeni Kalıp Ekle
            </Button>
          </div>
        </div>

        {/* Kalıplar Grid Listesi */}
        {templatesLoading ? (
          <div className="py-8 text-center text-xs text-muted-foreground animate-pulse">
            Aksiyon kalıpları yükleniyor...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {actionTemplates.map((tpl) => {
              const isActive = tpl.isActive !== false;
              return (
                <div 
                  key={tpl.id}
                  className={`p-4 rounded-xl border transition-all space-y-3 ${
                    isActive 
                      ? 'bg-card border-border/80 shadow-2xs hover:border-primary/50' 
                      : 'bg-muted/30 border-dashed border-border/50 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                        {getTemplateIcon(tpl.icon)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-xs font-black text-foreground">
                            {tpl.title}
                          </h4>
                          {tpl.suggestedStatus && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium">
                              {tpl.suggestedStatus}
                            </Badge>
                          )}
                          {tpl.id === 'TAMAMLANDI' ? (
                            <Badge className="text-[10px] px-1.5 py-0 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-300 font-bold">
                              %100 Kapatır
                            </Badge>
                          ) : tpl.id === 'DIGER' ? (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground font-medium">
                              Serbest %
                            </Badge>
                          ) : (
                            <Badge className="text-[10px] px-1.5 py-0 bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-300 font-bold">
                              +{tpl.progressWeight ?? 10}% İlerleme
                            </Badge>
                          )}
                          {!isActive && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              Pasif
                            </Badge>
                          )}
                        </div>
                        {tpl.description && (
                          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                            {tpl.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleTemplate(tpl.id)}
                        className={`p-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          isActive 
                            ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30' 
                            : 'text-muted-foreground hover:bg-muted'
                        }`}
                        title={isActive ? 'Kalıbı Devre Dışı Bırak' : 'Kalıbı Aktif Et'}
                      >
                        {isActive ? <ToggleRight className="w-5 h-5 text-emerald-500" /> : <ToggleLeft className="w-5 h-5" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingTemplate(tpl);
                          setIsModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="Kalıbı Düzenle"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {!tpl.isDefault && (
                        <button
                          type="button"
                          onClick={() => handleDeleteTemplate(tpl.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-muted-foreground hover:text-red-500 transition-colors"
                          title="Kalıbı Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Kalıbın Dinamik Alanları */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                      İstenen Veri Alanları ({tpl.fields?.length || 0}):
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {tpl.fields && tpl.fields.length > 0 ? (
                        tpl.fields.map((f, fIdx) => (
                          <span 
                            key={fIdx} 
                            className="px-2 py-0.5 rounded-md bg-muted/60 border text-[11px] font-mono text-foreground"
                          >
                            {f.label} {f.required ? <span className="text-red-500">*</span> : ''}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] italic text-muted-foreground">Alan belirtilmedi (Serbest metin)</span>
                      )}
                    </div>
                  </div>

                  {/* Cümle Kalıbı Önizlemesi */}
                  <div className="p-2.5 rounded-lg bg-muted/20 border border-border/60 text-[11px] text-muted-foreground font-mono leading-relaxed">
                    <span className="font-bold text-foreground font-sans mr-1">Cümle Şablonu:</span>
                    "{tpl.sentenceTemplate}"
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. KATEGORİ YÖNETİMİ KARTI                                          */}
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
      {/* 3. VERİ YÖNETİMİ & MÜKERRER / SEKME TEMİZLEME ARACI                 */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="bg-card text-card-foreground border border-red-200 dark:border-red-900/50 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center font-bold">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                Veri Temizleme & Sekme Sıfırlama
              </h3>
              <p className="text-xs text-muted-foreground">
                Mükerrer veya hatalı yüklenen hastane sekme verilerini kalıcı olarak veritabanından temizleyin.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end pt-1">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Hastane Seçin</label>
            <select
              value={cleanupFacilityId}
              onChange={(e) => setCleanupFacilityId(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border bg-background text-foreground text-xs focus:ring-2 focus:ring-primary outline-none"
            >
              {facilities.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Temizlenecek Sekme</label>
            <select
              value={cleanupSheetType}
              onChange={(e) => setCleanupSheetType(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border bg-background text-foreground text-xs focus:ring-2 focus:ring-primary outline-none"
            >
              <option value="ALL">⚠️ TÜM SEKME VERİLERİ (Komple Sıfırla)</option>
              <option value="MERKEZI_DENETIMLER">Merkezi Denetimler</option>
              <option value="HASTANE_IC_DENETIMLERI">Hastane İç Denetimleri</option>
              <option value="SAGLIK_DENETIMLERI">Sağlık Denetimleri</option>
              <option value="ITFAIYE_YANGIN_DENETIMLERI">İtfaiye/Yangın Komisyonu</option>
              <option value="ELEKTRIK_PK">Elektrik PK</option>
              <option value="TOPRAKLAMA_PK">Topraklama PK</option>
              <option value="PARATONER_PK">Paratoner PK</option>
              <option value="JENERATOR_PK">Jeneratör PK</option>
              <option value="ELEKTRIK_PANO_KONTROLLERI">Elektrik Pano Kontrolleri</option>
              <option value="TRAFO">Trafo</option>
              <option value="UPS">UPS</option>
              <option value="KAZANLAR">Kazanlar</option>
              <option value="CHILLERLER">Chillerler</option>
              <option value="KLIMA_SANTRALLERI">Klima Santralleri</option>
              <option value="SULU_SONDURME_PK_BAKIM">Sulu Söndürme PK & Bakım</option>
              <option value="GAZLI_SONDURME_PK_BAKIM">Gazlı Söndürme PK & Bakım</option>
              <option value="BASINCLANDIRMA_PK_BAKIM">Basınçlandırma Sistemleri PK</option>
              <option value="YANGIN_ALGILAMA_PK_BAKIM">Yangın Algılama Sistemleri PK</option>
            </select>
          </div>

          <div>
            <Button
              type="button"
              variant="destructive"
              disabled={cleaning || !cleanupFacilityId}
              onClick={handleCleanupRecords}
              className="w-full h-9 text-xs font-bold"
            >
              {cleaning ? 'Temizleniyor...' : 'Seçili Verileri Kalıcı Sil'}
            </Button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 4. KALIP DÜZENLEME & EKLEME MODALI                                  */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {isModalOpen && editingTemplate && (
        <TemplateEditModal
          template={editingTemplate}
          onClose={() => {
            setIsModalOpen(false);
            setEditingTemplate(null);
          }}
          onSave={handleSaveModal}
        />
      )}

    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. KALIP DÜZENLEME / OLUŞTURMA MODAL BİLEŞENİ
// ─────────────────────────────────────────────────────────────────────────────
interface TemplateEditModalProps {
  template: ImprovementActionTemplate;
  onClose: () => void;
  onSave: (template: ImprovementActionTemplate) => void;
}

const TemplateEditModal: React.FC<TemplateEditModalProps> = ({ template, onClose, onSave }) => {
  const [formData, setFormData] = useState<ImprovementActionTemplate>({ ...template });
  const [newFieldKey, setNewFieldKey] = useState('');
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<'text' | 'date' | 'number'>('text');

  const handleAddField = () => {
    if (!newFieldKey.trim() || !newFieldLabel.trim()) {
      toast.error('Lütfen alan anahtarı ve etiketi giriniz.');
      return;
    }
    const cleanKey = newFieldKey.trim().replace(/[^a-zA-Z0-9]/g, '');
    const field: ActionTemplateField = {
      key: cleanKey,
      label: newFieldLabel.trim(),
      type: newFieldType,
      required: false,
    };
    setFormData(prev => ({
      ...prev,
      fields: [...(prev.fields || []), field]
    }));
    setNewFieldKey('');
    setNewFieldLabel('');
  };

  const handleRemoveField = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== idx)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Lütfen kalıp başlığı giriniz.');
      return;
    }
    if (!formData.sentenceTemplate.trim()) {
      toast.error('Lütfen cümle şablonu giriniz.');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-card text-card-foreground border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        <div className="px-6 py-4 border-b flex items-center justify-between bg-muted/40">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              {template.id.startsWith('CUSTOM_') ? 'Yeni Aksiyon Kalıbı Ekle' : 'Aksiyon Kalıbını Düzenle'}
            </h3>
            <p className="text-xs text-muted-foreground">
              Otomatik cümle oluşturucu ve form parametreleri
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-foreground">Kalıp Adı / Başlığı *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Örn: Talep Açıldı"
                className="w-full h-9 px-3 rounded-lg border bg-background text-foreground text-xs outline-none"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">İlerleme Katkısı (+%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={formData.progressWeight ?? 10}
                onChange={(e) => setFormData({ ...formData, progressWeight: parseInt(e.target.value) || 0 })}
                placeholder="Örn: 10"
                className="w-full h-9 px-3 rounded-lg border bg-background text-foreground text-xs font-bold font-mono outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Önerilen Durum</label>
              <select
                value={formData.suggestedStatus || 'Devam Ediyor'}
                onChange={(e) => setFormData({ ...formData, suggestedStatus: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border bg-background text-foreground text-xs outline-none"
              >
                <option value="Devam Ediyor">Devam Ediyor</option>
                <option value="Tamamlandı">Tamamlandı</option>
                <option value="Başlamadı">Başlamadı</option>
                <option value="İptal Edildi">İptal Edildi</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Açıklama / İpucu</label>
              <input
                type="text"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Örn: Satınalma veya bakım talebi sisteme iletildiğinde seçilir"
                className="w-full h-9 px-3 rounded-lg border bg-background text-foreground text-xs outline-none"
              />
            </div>
          </div>

          {/* İstenen Dinamik Alanlar */}
          <div className="space-y-2 border-t pt-3">
            <label className="text-xs font-bold text-foreground block">
              Dinamik Giriş Alanları (Kullanıcıdan istenecek parametreler)
            </label>
            
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {formData.fields && formData.fields.map((f, fIdx) => (
                <div key={fIdx} className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-primary font-bold">{`{${f.key}}`}</span>
                    <span className="font-medium text-foreground">{f.label}</span>
                    <Badge variant="outline" className="text-[10px] px-1 py-0">{f.type}</Badge>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveField(fIdx)}
                    className="text-muted-foreground hover:text-red-500 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Yeni Alan Ekleme */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newFieldKey}
                onChange={(e) => setNewFieldKey(e.target.value)}
                placeholder="Alan Kodu (örn: talepNo)"
                className="w-1/3 h-8 px-2.5 rounded-lg border bg-background text-foreground text-[11px] font-mono outline-none"
              />
              <input
                type="text"
                value={newFieldLabel}
                onChange={(e) => setNewFieldLabel(e.target.value)}
                placeholder="Görünen İsim (örn: Talep No)"
                className="flex-1 h-8 px-2.5 rounded-lg border bg-background text-foreground text-[11px] outline-none"
              />
              <select
                value={newFieldType}
                onChange={(e) => setNewFieldType(e.target.value as any)}
                className="h-8 px-2 rounded-lg border bg-background text-foreground text-[11px] outline-none"
              >
                <option value="text">Metin</option>
                <option value="date">Tarih</option>
                <option value="number">Sayı</option>
              </select>
              <Button type="button" size="sm" onClick={handleAddField} className="h-8 px-2.5 text-xs">
                Ekle
              </Button>
            </div>
          </div>

          {/* Cümle Şablonu */}
          <div className="space-y-1 border-t pt-3">
            <label className="text-xs font-bold text-foreground flex items-center justify-between">
              <span>Otomatik Cümle Şablonu *</span>
              <span className="text-[10px] text-muted-foreground font-normal">Parametreleri {'{kod}'} şeklinde yazın</span>
            </label>
            <textarea
              rows={3}
              value={formData.sentenceTemplate}
              onChange={(e) => setFormData({ ...formData, sentenceTemplate: e.target.value })}
              placeholder="Örn: {tarih} tarihinde #{talepNo} numaralı talep açılmıştır."
              className="w-full p-2.5 rounded-lg border bg-background text-foreground font-mono text-xs outline-none"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Vazgeç
            </Button>
            <Button type="submit" size="sm" className="bg-primary text-primary-foreground font-bold">
              Kalıbı Kaydet
            </Button>
          </div>

        </form>

      </div>
    </div>
  );
};
