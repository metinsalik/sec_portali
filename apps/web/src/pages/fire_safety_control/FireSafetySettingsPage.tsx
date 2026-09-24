import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Settings, 
  ShieldAlert, 
  Users, 
  Layers, 
  Pencil, 
  Check, 
  X 
} from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/context/AuthContext';

export default function FireSafetySettingsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isManager = Boolean(user?.isAdmin || user?.isManagement || user?.roles?.includes('admin') || user?.roles?.includes('management'));

  const [newSource, setNewSource] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newResp, setNewResp] = useState('');

  // Editing state: { type: 'sources' | 'categories' | 'responsibles', index: number, value: string } | null
  const [editingItem, setEditingItem] = useState<{
    type: 'sources' | 'categories' | 'responsibles';
    index: number;
    value: string;
  } | null>(null);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['fire-safety-settings'],
    queryFn: async () => {
      const res = await api.get('/fire-safety-control/settings/all');
      if (!res.ok) throw new Error('Ayarlar alınamadı');
      return res.json();
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: { sources?: any[]; categories?: any[]; responsibles?: any[] }) => {
      const res = await api.post('/fire-safety-control/settings/all', payload);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Ayar kaydedilemedi');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fire-safety-settings'] });
      toast.success('Ayarlar başarıyla güncellendi');
      setEditingItem(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Hata oluştu');
    }
  });

  // Extract array of strings
  const getArray = (field: any, defaults: string[] = []): string[] => {
    if (!field) return defaults;
    if (Array.isArray(field)) {
      return field.map(item => (typeof item === 'string' ? item : item.name || '')).filter(Boolean);
    }
    return defaults;
  };

  const defaultSources = ['İtfaiye Denetim Raporu', 'SEGEM Raporu', 'İç Süreç', 'Saha Turu', 'Yasal Denetim'];
  const defaultCategories = [
    'Yangın Kompartımanı & İzolasyon',
    'Elektrik & Pano Güvenliği',
    'Acil Durum Aydınlatma & Yönlendirme',
    'Kaçış Merdivenleri & Çıkışlar',
    'Algılama & Otomatik Söndürme',
    'İnşaat, Boya & Fiziki Alan Bakımı'
  ];
  const defaultResponsibles = [
    'Teknik Hizmetler – Hastane',
    'Teknik Hizmetler – Merkez',
    'Teknik Hizmetler & İSG – Hastane',
    'Satın Alma Direktörlüğü',
    'Dizayn Yöneticisi & Satınalma',
    'Merkez Satın Alma & Mimar'
  ];

  const sources = getArray(settings?.sources, defaultSources);
  const categories = getArray(settings?.categories, defaultCategories);
  const responsibles = getArray(settings?.responsibles, defaultResponsibles);

  // Ekleme - Tüm listeleri bir arada göndererek hiçbirinin silinmemesini garanti et
  const addItem = (type: 'sources' | 'categories' | 'responsibles', currentList: string[], newItem: string, resetFn: () => void) => {
    if (!isManager) {
      toast.error('Ayarları sadece yöneticiler düzenleyebilir.');
      return;
    }
    if (!newItem.trim()) return;
    if (currentList.some(item => item.toLowerCase() === newItem.trim().toLowerCase())) {
      toast.error('Bu öğe zaten listede mevcut');
      return;
    }
    const updated = [...currentList, newItem.trim()].map((name, i) => ({ id: String(i + 1), name }));
    
    saveMutation.mutate({
      sources: (type === 'sources' ? updated : sources.map((n, i) => ({ id: String(i + 1), name: n }))),
      categories: (type === 'categories' ? updated : categories.map((n, i) => ({ id: String(i + 1), name: n }))),
      responsibles: (type === 'responsibles' ? updated : responsibles.map((n, i) => ({ id: String(i + 1), name: n })))
    });
    resetFn();
  };

  // Silme - Tüm listeleri bir arada göndererek koru
  const removeItem = (type: 'sources' | 'categories' | 'responsibles', currentList: string[], indexToRemove: number) => {
    if (!isManager) {
      toast.error('Ayarları sadece yöneticiler düzenleyebilir.');
      return;
    }
    const updated = currentList.filter((_, i) => i !== indexToRemove).map((name, i) => ({ id: String(i + 1), name }));
    
    saveMutation.mutate({
      sources: (type === 'sources' ? updated : sources.map((n, i) => ({ id: String(i + 1), name: n }))),
      categories: (type === 'categories' ? updated : categories.map((n, i) => ({ id: String(i + 1), name: n }))),
      responsibles: (type === 'responsibles' ? updated : responsibles.map((n, i) => ({ id: String(i + 1), name: n })))
    });
  };

  // Güncelleme / Düzenleme (Edit) - Tüm listeleri bir arada göndererek koru
  const saveEdit = (type: 'sources' | 'categories' | 'responsibles', currentList: string[]) => {
    if (!isManager) {
      toast.error('Ayarları sadece yöneticiler düzenleyebilir.');
      return;
    }
    if (!editingItem || !editingItem.value.trim()) {
      setEditingItem(null);
      return;
    }
    const newVal = editingItem.value.trim();
    // Kendisi dışındakilerle çakışma kontrolü
    const existsOther = currentList.some((item, i) => i !== editingItem.index && item.toLowerCase() === newVal.toLowerCase());
    if (existsOther) {
      toast.error('Bu isimde başka bir öğe zaten mevcut');
      return;
    }

    const updatedList = [...currentList];
    updatedList[editingItem.index] = newVal;
    const updated = updatedList.map((name, i) => ({ id: String(i + 1), name }));
    
    saveMutation.mutate({
      sources: (type === 'sources' ? updated : sources.map((n, i) => ({ id: String(i + 1), name: n }))),
      categories: (type === 'categories' ? updated : categories.map((n, i) => ({ id: String(i + 1), name: n }))),
      responsibles: (type === 'responsibles' ? updated : responsibles.map((n, i) => ({ id: String(i + 1), name: n })))
    });
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/fire-safety-control')}
          className="rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Settings className="w-6 h-6 text-red-600" />
            Yangın Güvenliği Modül Ayarları
          </h1>
          <p className="text-sm text-slate-500">
            {isManager 
              ? 'Toplantı tutanakları ve tespitlerde kullanılan kaynaklar, kategoriler ve sorumlu birimleri ekleyebilir veya düzenleyebilirsiniz.'
              : 'Toplantı tutanakları ve tespitlerde kullanılan standart kaynak, kategori ve sorumlu birim tanımları (Salt Okunur).'
            }
          </p>
        </div>
      </div>

      {!isManager && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
          <span>Bu ekrandaki tanımları yalnızca sistem yöneticileri düzenleyebilir. Tutanak ve tespit girişlerinizde aşağıdaki hazır tanımları doğrudan seçebilirsiniz.</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. Kaynaklar */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                Tespit Kaynakları
              </CardTitle>
              <CardDescription className="text-xs">
                Maddelerin hangi denetim veya rapordan geldiğini tanımlar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Ekleme Input - Sadece Yöneticiler */}
              {isManager && (
                <div className="flex gap-2">
                  <Input
                    placeholder="Yeni kaynak ekle..."
                    value={newSource}
                    onChange={e => setNewSource(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addItem('sources', sources, newSource, () => setNewSource(''))}
                    className="text-sm"
                  />
                  <Button 
                    size="sm"
                    onClick={() => addItem('sources', sources, newSource, () => setNewSource(''))}
                    disabled={saveMutation.isPending}
                    className="bg-red-600 hover:bg-red-700 text-white shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Liste ve Edit */}
              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {sources.map((item: string, idx: number) => {
                  const isEditing = editingItem?.type === 'sources' && editingItem.index === idx;

                  return (
                    <div 
                      key={idx} 
                      className={`flex items-center justify-between p-2 rounded-lg border text-sm transition-colors ${
                        isEditing 
                          ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700' 
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-100 dark:border-slate-700'
                      }`}
                    >
                      {isEditing && isManager ? (
                        <div className="flex items-center gap-1.5 w-full">
                          <Input
                            autoFocus
                            value={editingItem.value}
                            onChange={e => setEditingItem({ ...editingItem, value: e.target.value })}
                            onKeyDown={e => {
                              if (e.key === 'Enter') saveEdit('sources', sources);
                              if (e.key === 'Escape') setEditingItem(null);
                            }}
                            className="h-8 text-xs bg-white dark:bg-slate-900"
                          />
                          <button
                            onClick={() => saveEdit('sources', sources)}
                            disabled={saveMutation.isPending}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-950 rounded"
                            title="Kaydet"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingItem(null)}
                            className="p-1.5 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                            title="İptal"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className="truncate max-w-[200px]">{item}</span>
                          {isManager && (
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => setEditingItem({ type: 'sources', index: idx, value: item })}
                                className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                                title="Düzenle"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => removeItem('sources', sources, idx)}
                                className="text-slate-400 hover:text-red-600 transition-colors p-1"
                                title="Sil"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </div>
        </Card>
                  );
                })}
              </div>
            </CardContent>
          </div>
        </Card>

        {/* 2. Kategoriler */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-500" />
                Kategoriler
              </CardTitle>
              <CardDescription className="text-xs">
                Tespit ve bulguların teknik/yapısal sınıflandırması.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Ekleme Input - Sadece Yöneticiler */}
              {isManager && (
                <div className="flex gap-2">
                  <Input
                    placeholder="Yeni kategori ekle..."
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addItem('categories', categories, newCategory, () => setNewCategory(''))}
                    className="text-sm"
                  />
                  <Button 
                    size="sm"
                    onClick={() => addItem('categories', categories, newCategory, () => setNewCategory(''))}
                    disabled={saveMutation.isPending}
                    className="bg-red-600 hover:bg-red-700 text-white shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Liste ve Edit */}
              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {categories.map((item: string, idx: number) => {
                  const isEditing = editingItem?.type === 'categories' && editingItem.index === idx;

                  return (
                    <div 
                      key={idx} 
                      className={`flex items-center justify-between p-2 rounded-lg border text-sm transition-colors ${
                        isEditing 
                          ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700' 
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-100 dark:border-slate-700'
                      }`}
                    >
                      {isEditing && isManager ? (
                        <div className="flex items-center gap-1.5 w-full">
                          <Input
                            autoFocus
                            value={editingItem.value}
                            onChange={e => setEditingItem({ ...editingItem, value: e.target.value })}
                            onKeyDown={e => {
                              if (e.key === 'Enter') saveEdit('categories', categories);
                              if (e.key === 'Escape') setEditingItem(null);
                            }}
                            className="h-8 text-xs bg-white dark:bg-slate-900"
                          />
                          <button
                            onClick={() => saveEdit('categories', categories)}
                            disabled={saveMutation.isPending}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-950 rounded"
                            title="Kaydet"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingItem(null)}
                            className="p-1.5 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                            title="İptal"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className="truncate max-w-[200px]">{item}</span>
                          {isManager && (
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => setEditingItem({ type: 'categories', index: idx, value: item })}
                                className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                                title="Düzenle"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => removeItem('categories', categories, idx)}
                                className="text-slate-400 hover:text-red-600 transition-colors p-1"
                                title="Sil"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </div>
        </Card>

        {/* 3. Sorumlu Birimler */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-500" />
                Sorumlu Birimler
              </CardTitle>
              <CardDescription className="text-xs">
                Aksiyon ve kararları takip edip yerine getirecek birimler.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Ekleme Input - Sadece Yöneticiler */}
              {isManager && (
                <div className="flex gap-2">
                  <Input
                    placeholder="Yeni sorumlu birim..."
                    value={newResp}
                    onChange={e => setNewResp(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addItem('responsibles', responsibles, newResp, () => setNewResp(''))}
                    className="text-sm"
                  />
                  <Button 
                    size="sm"
                    onClick={() => addItem('responsibles', responsibles, newResp, () => setNewResp(''))}
                    disabled={saveMutation.isPending}
                    className="bg-red-600 hover:bg-red-700 text-white shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Liste ve Edit */}
              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {responsibles.map((item: string, idx: number) => {
                  const isEditing = editingItem?.type === 'responsibles' && editingItem.index === idx;

                  return (
                    <div 
                      key={idx} 
                      className={`flex items-center justify-between p-2 rounded-lg border text-sm transition-colors ${
                        isEditing 
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700' 
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-100 dark:border-slate-700'
                      }`}
                    >
                      {isEditing && isManager ? (
                        <div className="flex items-center gap-1.5 w-full">
                          <Input
                            autoFocus
                            value={editingItem.value}
                            onChange={e => setEditingItem({ ...editingItem, value: e.target.value })}
                            onKeyDown={e => {
                              if (e.key === 'Enter') saveEdit('responsibles', responsibles);
                              if (e.key === 'Escape') setEditingItem(null);
                            }}
                            className="h-8 text-xs bg-white dark:bg-slate-900"
                          />
                          <button
                            onClick={() => saveEdit('responsibles', responsibles)}
                            disabled={saveMutation.isPending}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-950 rounded"
                            title="Kaydet"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingItem(null)}
                            className="p-1.5 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                            title="İptal"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className="truncate max-w-[200px]">{item}</span>
                          {isManager && (
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => setEditingItem({ type: 'responsibles', index: idx, value: item })}
                                className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                                title="Düzenle"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => removeItem('responsibles', responsibles, idx)}
                                className="text-slate-400 hover:text-red-600 transition-colors p-1"
                                title="Sil"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </div>
        </Card>
      </div>
    </div>
  );
}
