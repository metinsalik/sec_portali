import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Check, X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';

const API = import.meta.env.VITE_API_URL || '';

interface StringListSettingCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  dotColorClass?: string;
  endpoint: string;
  bodyField: string;
  defaults: string[];
  placeholder: string;
  itemLabel: string;
  hasAdminAccess: boolean;
}

/**
 * İyileştirme ayarlarındaki metin listelerini (Sorumlular, Denetim Adları vb.)
 * yönetici yetkisiyle ekleme, düzenleme, silme ve sıfırlama kartı.
 */
export const StringListSettingCard: React.FC<StringListSettingCardProps> = ({
  title,
  description,
  icon,
  dotColorClass = 'bg-blue-500',
  endpoint,
  bodyField,
  defaults,
  placeholder,
  itemLabel,
  hasAdminAccess,
}) => {
  const [items, setItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newItem, setNewItem] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');

  useEffect(() => {
    let active = true;
    const loadItems = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const res = await fetch(`${API}${endpoint}`, {
          headers: { 'Authorization': token ? `Bearer ${token}` : '' }
        });
        const data = await res.json();
        if (active) {
          setItems(data.success && Array.isArray(data.data) ? data.data : defaults);
        }
      } catch {
        if (active) setItems(defaults);
      } finally {
        if (active) setLoading(false);
      }
    };
    loadItems();
    return () => {
      active = false;
    };
  }, [endpoint, defaults]);

  const saveList = async (updatedList: string[], successMsg: string) => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ [bodyField]: updatedList })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Kaydedilemedi');
      setItems(Array.isArray(data.data) ? data.data : updatedList);
      toast.success(successMsg);
    } catch (err: any) {
      toast.error('Hata: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = () => {
    const trimmed = newItem.trim();
    if (!trimmed) return;
    if (items.some(r => r.toLocaleLowerCase('tr-TR') === trimmed.toLocaleLowerCase('tr-TR'))) {
      toast.error(`Bu ${itemLabel.toLocaleLowerCase('tr-TR')} zaten listede mevcut.`);
      return;
    }
    const next = [...items, trimmed];
    setNewItem('');
    saveList(next, `${itemLabel} eklendi.`);
  };

  const handleSaveEdit = (index: number) => {
    const trimmed = editingValue.trim();
    if (!trimmed) {
      toast.error(`${itemLabel} adı boş olamaz.`);
      return;
    }
    const duplicate = items.some(
      (r, idx) => idx !== index && r.toLocaleLowerCase('tr-TR') === trimmed.toLocaleLowerCase('tr-TR')
    );
    if (duplicate) {
      toast.error(`Bu isimde başka bir ${itemLabel.toLocaleLowerCase('tr-TR')} zaten mevcut.`);
      return;
    }
    const next = items.map((r, idx) => (idx === index ? trimmed : r));
    setEditingIndex(null);
    setEditingValue('');
    saveList(next, `${itemLabel} güncellendi.`);
  };

  const handleDelete = (index: number) => {
    const target = items[index];
    if (!window.confirm(`"${target}" kaydını listeden silmek istediğinize emin misiniz?`)) return;
    const next = items.filter((_, idx) => idx !== index);
    if (editingIndex === index) {
      setEditingIndex(null);
      setEditingValue('');
    }
    saveList(next, `${itemLabel} silindi.`);
  };

  const handleResetDefaults = () => {
    if (!window.confirm(`${itemLabel} listesini sistem varsayılanlarına sıfırlamak istiyor musunuz?`)) return;
    setEditingIndex(null);
    saveList(defaults, `${itemLabel} listesi varsayılanlara sıfırlandı.`);
  };

  return (
    <div className="bg-card text-card-foreground border rounded-xl p-5 shadow-xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
        <div className="flex items-center gap-2.5">
          {icon}
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <span>{title}</span>
              {!hasAdminAccess && (
                <Badge variant="outline" className="text-[10px] font-medium text-muted-foreground">
                  Yalnızca Yöneticiler Düzenleyebilir
                </Badge>
              )}
            </h3>
            <p className="text-xs text-muted-foreground">
              {description} ({items.length} adet)
            </p>
          </div>
        </div>

        {hasAdminAccess && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetDefaults}
            disabled={saving}
            className="h-8 text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            Varsayılanlara Dön
          </Button>
        )}
      </div>

      {hasAdminAccess && (
        <div className="flex items-center gap-2 pt-1">
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAdd();
              }
            }}
            placeholder={placeholder}
            disabled={saving}
            className="flex-1 h-9 px-3 rounded-lg border bg-background text-sm text-foreground focus:ring-2 focus:ring-primary outline-none"
          />
          <Button
            type="button"
            size="sm"
            onClick={handleAdd}
            disabled={saving || !newItem.trim()}
            className="h-9 px-3 text-xs"
          >
            <Plus className="w-4 h-4 mr-1" />
            Ekle
          </Button>
        </div>
      )}

      {loading ? (
        <div className="py-6 text-center text-xs text-muted-foreground animate-pulse">
          Yükleniyor...
        </div>
      ) : items.length === 0 ? (
        <div className="py-6 text-center text-xs text-muted-foreground border border-dashed rounded-lg">
          Henüz tanımlı kayıt bulunmamaktadır.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
          {items.map((item, idx) => {
            const isEditing = editingIndex === idx;
            return (
              <div
                key={`${item}-${idx}`}
                className="flex items-center justify-between gap-2 p-2.5 rounded-lg border bg-muted/30 hover:bg-muted/60 transition-colors"
              >
                {isEditing ? (
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <input
                      type="text"
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSaveEdit(idx);
                        } else if (e.key === 'Escape') {
                          setEditingIndex(null);
                          setEditingValue('');
                        }
                      }}
                      autoFocus
                      className="flex-1 h-7 px-2 rounded border bg-background text-xs text-foreground outline-none focus:ring-1 focus:ring-primary min-w-0"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(idx)}
                      disabled={saving}
                      className="p-1 text-emerald-600 hover:text-emerald-700"
                      title="Kaydet"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingIndex(null);
                        setEditingValue('');
                      }}
                      className="p-1 text-muted-foreground hover:text-foreground"
                      title="İptal"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-2 h-2 rounded-full ${dotColorClass} shrink-0`} />
                      <span className="text-xs font-medium text-foreground truncate" title={item}>
                        {item}
                      </span>
                    </div>
                    {hasAdminAccess && (
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingIndex(idx);
                            setEditingValue(item);
                          }}
                          disabled={saving}
                          className="opacity-70 hover:opacity-100 hover:text-blue-600 p-1 transition-opacity"
                          title="Düzenle"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(idx)}
                          disabled={saving}
                          className="opacity-70 hover:opacity-100 hover:text-red-500 p-1 transition-opacity"
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
      )}
    </div>
  );
};

