import React, { useState, useEffect } from 'react';
import { 
  X, Check, AlertCircle, Clock, Calendar, Building2, 
  MapPin, Wrench, Shield, User, FileText, CheckCircle2, Tag, Plus 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';
import { type ImprovementRecord, type ImprovementRecordHistory, type FacilityOption } from './types';

const API = import.meta.env.VITE_API_URL || '';

// ─────────────────────────────────────────────────────────────────────────────
// 1. İNCELE (Salt Okunur Detay Penceresi)
// ─────────────────────────────────────────────────────────────────────────────
interface InspectProps {
  record: ImprovementRecord | null;
  onClose: () => void;
}

export const InspectRecordDialog: React.FC<InspectProps> = ({ record, onClose }) => {
  if (!record) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-card text-card-foreground border rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Başlık */}
        <div className="px-6 py-4 border-b flex items-center justify-between bg-muted/40">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge variant="outline" className="text-xs font-semibold">
                {record.sheetType} #{record.rowNo || '-'}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {record.category || 'Belirtilmemiş'}
              </Badge>
              <Badge 
                className={`text-xs ${
                  record.riskScore === 'Kritik' ? 'bg-red-500 text-white' :
                  record.riskScore === 'Yüksek' ? 'bg-orange-500 text-white' :
                  record.riskScore === 'Önemli' ? 'bg-amber-500 text-white' :
                  'bg-slate-500 text-white'
                }`}
              >
                {record.riskScore || 'Risk Belirtilmedi'}
              </Badge>
              <Badge 
                variant="outline"
                className={`text-xs ${
                  record.status === 'Tamamlandı' ? 'text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30' :
                  record.status === 'Devam Ediyor' ? 'text-blue-600 border-blue-300 bg-blue-50 dark:bg-blue-950/30' :
                  record.status === 'İptal Edildi' ? 'text-muted-foreground' :
                  'text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/30'
                }`}
              >
                {record.status}
              </Badge>
            </div>
            <h3 className="text-base font-bold text-foreground">
              {record.facility?.name || 'Tesis Belirtilmedi'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Gövde */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-muted/30 p-3 rounded-xl border">
            <div>
              <span className="text-muted-foreground font-semibold block">Tespit Tarihi</span>
              <span className="text-foreground font-mono font-medium">
                {record.recordDate ? new Date(record.recordDate).toLocaleDateString('tr-TR') : '-'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground font-semibold block text-primary">Termin Tarihi</span>
              <span className="text-foreground font-mono font-semibold">
                {record.dueDate ? new Date(record.dueDate).toLocaleDateString('tr-TR') : '-'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground font-semibold block">Mahal / Konum</span>
              <span className="text-foreground font-medium">{record.location || '-'}</span>
            </div>
            <div>
              <span className="text-muted-foreground font-semibold block">
                {record.sheetType === 'DENETIMLER' ? 'Denetim Adı' : 'Ekipman'}
              </span>
              <span className="text-foreground font-medium">
                {record.sheetType === 'DENETIMLER' ? (record.auditName || '-') : (record.equipment || '-')}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground font-semibold block">Sorumlu Kişi / Birim</span>
              <span className="text-foreground font-medium">{record.assignedTo || '-'}</span>
            </div>
            {record.applicationType && (
              <div>
                <span className="text-muted-foreground font-semibold block">Uygulama</span>
                <span className="text-foreground font-medium">{record.applicationType}</span>
              </div>
            )}
            <div>
              <span className="text-muted-foreground font-semibold block">Kaynak Dosya</span>
              <span className="text-foreground truncate block font-mono text-[10px]" title={record.sourceFileName || ''}>
                {record.sourceFileName || 'Sistem İçi Kayıt'}
              </span>
            </div>
          </div>

          {/* Tespit */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground">Tespit Açıklaması:</label>
            <div className="p-3 bg-muted/40 border rounded-xl text-foreground whitespace-pre-wrap leading-relaxed">
              {record.finding}
            </div>
          </div>

          {/* İş Planı */}
          {record.actionPlan && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground">İş Planı:</label>
              <div className="p-3 bg-muted/40 border rounded-xl text-foreground whitespace-pre-wrap leading-relaxed">
                {record.actionPlan}
              </div>
            </div>
          )}

          {/* Aksiyon / Açıklama */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-primary">Aksiyon / Güncel Durum Açıklaması:</label>
            <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl text-foreground whitespace-pre-wrap leading-relaxed">
              {record.currentNote || <span className="text-muted-foreground italic">Henüz bir aksiyon notu girilmemiş.</span>}
            </div>
          </div>

        </div>

        {/* Alt Buton */}
        <div className="px-6 py-3 border-t flex justify-end bg-muted/40">
          <Button variant="outline" size="sm" onClick={onClose}>
            Kapat
          </Button>
        </div>

      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. HIZLI AKSİYON GİR ("Aksiyon Gir" Penceresi)
// ─────────────────────────────────────────────────────────────────────────────
interface ActionNoteProps {
  record: ImprovementRecord | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const ActionNoteDialog: React.FC<ActionNoteProps> = ({ record, onClose, onSuccess }) => {
  if (!record) return null;

  const initialRecordDate = record.recordDate 
    ? new Date(record.recordDate).toISOString().split('T')[0]
    : '';
  const initialDueDate = record.dueDate 
    ? new Date(record.dueDate).toISOString().split('T')[0]
    : '';

  const [note, setNote] = useState(record.currentNote || '');
  const [actionPlan, setActionPlan] = useState(record.actionPlan || '');
  const [recordDate, setRecordDate] = useState(initialRecordDate);
  const [dueDate, setDueDate] = useState(initialDueDate);
  const [status, setStatus] = useState(record.status);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<ImprovementRecordHistory[]>([]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API}/api/operations/improvements/records/${record.id}/history`, {
          headers: { 'Authorization': token ? `Bearer ${token}` : '' }
        });
        const d = await res.json();
        if (d.success) setHistory(d.data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchHistory();
  }, [record.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim() && !actionPlan.trim()) {
      toast.error('Lütfen bir aksiyon notu veya iş planı girin.');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/operations/improvements/records/${record.id}/action-note`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ 
          currentNote: note, 
          status,
          actionPlan,
          recordDate: recordDate ? new Date(recordDate).toISOString() : null,
          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        })
      });

      const d = await res.json();
      if (!res.ok || !d.success) throw new Error(d.message || 'Güncellenemedi');

      toast.success('Aksiyon ve plan başarıyla kaydedildi.');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error('Hata: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-card text-card-foreground border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Başlık */}
        <div className="px-6 py-4 border-b flex items-center justify-between bg-muted/40">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              Aksiyon / İş Planı Girişi
            </h3>
            <p className="text-xs text-muted-foreground truncate max-w-md">
              {record.facility?.shortName || record.facility?.name} — {record.sheetType} #{record.rowNo}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-3.5 max-h-[80vh] overflow-y-auto">
          
          {/* Tespit Özeti */}
          <div className="p-3 bg-muted/30 border rounded-xl text-xs space-y-1">
            <span className="text-muted-foreground font-semibold block">İlgili Tespit:</span>
            <p className="text-foreground line-clamp-3 italic">
              "{record.finding}"
            </p>
          </div>

          {/* Tarihler Satırı: Tespit Tarihi ve Termin Tarihi */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                Tespit Tarihi
              </label>
              <input
                type="date"
                value={recordDate}
                onChange={(e) => setRecordDate(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border bg-background text-foreground text-xs outline-none font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-primary flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-primary" />
                Termin Tarihi
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border bg-background text-foreground text-xs outline-none font-mono font-medium border-primary/40 focus:border-primary"
              />
            </div>
          </div>

          {/* Durum Seçimi */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">
              Güncel Durum
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full h-9 px-3 rounded-lg border bg-background text-foreground text-xs focus:ring-2 focus:ring-primary outline-none"
            >
              <option value="Başlamadı">Başlamadı</option>
              <option value="Devam Ediyor">Devam Ediyor</option>
              <option value="Tamamlandı">Tamamlandı</option>
              <option value="İptal Edildi">İptal Edildi</option>
            </select>
          </div>

          {/* İş Planı */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">
              İş Planı
            </label>
            <textarea
              rows={2}
              value={actionPlan}
              onChange={(e) => setActionPlan(e.target.value)}
              placeholder="Yapılması planlanan faaliyetler..."
              className="w-full p-2.5 rounded-lg border bg-background text-foreground text-xs focus:ring-1 focus:ring-primary outline-none resize-none"
            />
          </div>

          {/* Not Alanı */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-primary">
              Aksiyon Notu / Durum Açıklaması <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Yapılan müdahale, parça siparişi, durum açıklaması vb. detayları yazınız..."
              className="w-full p-2.5 rounded-lg border bg-background text-foreground text-xs focus:ring-1 focus:ring-primary outline-none resize-none"
              required
            />
          </div>

          {/* Tarihçe (Önceki Notlar) */}
          {history.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground block">
                Önceki Notlar ({history.length})
              </label>
              <div className="max-h-32 overflow-y-auto space-y-2 p-2.5 bg-muted/20 border rounded-xl text-[11px]">
                {history.map((h) => (
                  <div key={h.id} className="border-b border-border/50 pb-1.5 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-0.5">
                      <span className="font-semibold text-foreground">{h.changedByName || h.changedBy}</span>
                      <span>{new Date(h.createdAt).toLocaleString('tr-TR')}</span>
                    </div>
                    <p className="text-foreground">{h.newNote}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Butonlar */}
          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
              Vazgeç
            </Button>
            <Button type="submit" size="sm" disabled={loading} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {loading ? 'Kaydediliyor...' : 'Aksiyonu Kaydet'}
            </Button>
          </div>

        </form>

      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. TAM DÜZENLE FORM MODALI (Tarih ve Ayarlardaki Kategoriler Dahil)
// ─────────────────────────────────────────────────────────────────────────────
interface EditProps {
  record: ImprovementRecord | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditRecordDialog: React.FC<EditProps> = ({ record, onClose, onSuccess }) => {
  if (!record) return null;

  const [availableCategories, setAvailableCategories] = useState<string[]>([]);

  // Tarih stringlerini YYYY-MM-DD formatına çevir
  const initialDateStr = record.recordDate 
    ? new Date(record.recordDate).toISOString().split('T')[0]
    : '';
  const initialDueDateStr = record.dueDate
    ? new Date(record.dueDate).toISOString().split('T')[0]
    : '';

  const [formData, setFormData] = useState({
    location: record.location || '',
    equipment: record.equipment || '',
    finding: record.finding || '',
    riskScore: record.riskScore || 'Önemli',
    assignedTo: record.assignedTo || '',
    status: record.status || 'Başlamadı',
    actionPlan: record.actionPlan || '',
    currentNote: record.currentNote || '',
    auditName: record.auditName || '',
    category: record.category || 'Elektrik Güvenliği',
    recordDate: initialDateStr,
    dueDate: initialDueDateStr,
  });
  const [loading, setLoading] = useState(false);

  // Ayarlardan kategorileri yükle
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API}/api/operations/improvements/categories`, {
          headers: { 'Authorization': token ? `Bearer ${token}` : '' }
        });
        const d = await res.json();
        if (d.success && Array.isArray(d.data)) {
          setAvailableCategories(d.data);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchCats();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/operations/improvements/records/${record.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          ...formData,
          recordDate: formData.recordDate ? new Date(formData.recordDate).toISOString() : null,
          dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
        })
      });

      const d = await res.json();
      if (!res.ok || !d.success) throw new Error(d.message || 'Kayıt güncellenemedi.');

      toast.success('Kayıt başarıyla güncellendi.');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error('Hata: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-card text-card-foreground border rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        <div className="px-6 py-4 border-b flex items-center justify-between bg-muted/40">
          <div>
            <h3 className="text-base font-bold text-foreground">
              Kaydı Düzenle ({record.sheetType} #{record.rowNo})
            </h3>
            <p className="text-xs text-muted-foreground">{record.facility?.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-sm">
          
          {/* Kategori, Risk Skoru ve Tarih Satırları */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Kategori */}
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Kategori
              </label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border bg-background text-foreground text-xs outline-none"
              >
                {availableCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                {!availableCategories.includes(formData.category) && formData.category && (
                  <option value={formData.category}>{formData.category}</option>
                )}
              </select>
            </div>

            {/* Risk Skoru */}
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Risk Skoru
              </label>
              <select
                value={formData.riskScore}
                onChange={e => setFormData({ ...formData, riskScore: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border bg-background text-foreground text-xs outline-none font-semibold"
              >
                <option value="Kritik">Kritik</option>
                <option value="Yüksek">Yüksek</option>
                <option value="Önemli">Önemli</option>
                <option value="Olası">Olası</option>
                <option value="Önemsiz">Önemsiz</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Tespit Tarihi */}
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                Tespit Tarihi
              </label>
              <input
                type="date"
                value={formData.recordDate}
                onChange={e => setFormData({ ...formData, recordDate: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border bg-background text-foreground text-xs outline-none font-mono"
              />
            </div>

            {/* Termin Tarihi */}
            <div>
              <label className="text-xs font-semibold text-primary block mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-primary" />
                Termin Tarihi
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border bg-background text-foreground text-xs outline-none font-mono border-primary/40 focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Durum
              </label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border bg-background text-foreground text-xs outline-none"
              >
                <option value="Başlamadı">Başlamadı</option>
                <option value="Devam Ediyor">Devam Ediyor</option>
                <option value="Tamamlandı">Tamamlandı</option>
                <option value="İptal Edildi">İptal Edildi</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Sorumlusu
              </label>
              <input
                type="text"
                value={formData.assignedTo}
                onChange={e => setFormData({ ...formData, assignedTo: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border bg-background text-foreground text-xs outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Mahal
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border bg-background text-foreground text-xs outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                {record.sheetType === 'DENETIMLER' ? 'Denetim Adı' : 'Ekipman'}
              </label>
              <input
                type="text"
                value={record.sheetType === 'DENETIMLER' ? formData.auditName : formData.equipment}
                onChange={e => {
                  if (record.sheetType === 'DENETIMLER') {
                    setFormData({ ...formData, auditName: e.target.value });
                  } else {
                    setFormData({ ...formData, equipment: e.target.value });
                  }
                }}
                className="w-full h-9 px-3 rounded-lg border bg-background text-foreground text-xs outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">
              Tespit Metni
            </label>
            <textarea
              rows={3}
              value={formData.finding}
              onChange={e => setFormData({ ...formData, finding: e.target.value })}
              className="w-full p-3 rounded-lg border bg-background text-foreground text-xs outline-none resize-none"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">
              İş Planı
            </label>
            <textarea
              rows={2}
              value={formData.actionPlan}
              onChange={e => setFormData({ ...formData, actionPlan: e.target.value })}
              className="w-full p-3 rounded-lg border bg-background text-foreground text-xs outline-none resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-primary block mb-1">
              Aksiyon / Açıklama
            </label>
            <textarea
              rows={2}
              value={formData.currentNote}
              onChange={e => setFormData({ ...formData, currentNote: e.target.value })}
              className="w-full p-3 rounded-lg border bg-background text-foreground text-xs outline-none resize-none"
            />
          </div>

          <div className="pt-3 border-t flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
              Vazgeç
            </Button>
            <Button type="submit" size="sm" disabled={loading} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
            </Button>
          </div>

        </form>

      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. YENİ KAYIT OLUŞTUR FORM MODALI (+ Yeni Kayıt Butonu İçin)
// ─────────────────────────────────────────────────────────────────────────────
interface CreateProps {
  sheetType: string;
  defaultFacilityId?: string;
  facilities: FacilityOption[];
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateRecordDialog: React.FC<CreateProps> = ({
  sheetType,
  defaultFacilityId,
  facilities,
  onClose,
  onSuccess,
}) => {
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const initialFacility = (defaultFacilityId && defaultFacilityId !== 'ALL') 
    ? defaultFacilityId 
    : (facilities[0]?.id || '');

  const [formData, setFormData] = useState({
    facilityId: initialFacility,
    location: '',
    equipment: '',
    finding: '',
    riskScore: 'Önemli',
    assignedTo: '',
    status: 'Başlamadı',
    actionPlan: '',
    currentNote: '',
    auditName: sheetType === 'DENETIMLER' ? 'İSG Yangın ve Teknik Alan Saha Turu' : '',
    category: sheetType === 'DENETIMLER' ? 'İş Güvenliği / Fiziksel Riskler' : 'Elektrik Güvenliği',
    recordDate: new Date().toISOString().split('T')[0],
    dueDate: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API}/api/operations/improvements/categories`, {
          headers: { 'Authorization': token ? `Bearer ${token}` : '' }
        });
        const d = await res.json();
        if (d.success && Array.isArray(d.data)) {
          setAvailableCategories(d.data);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchCats();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.facilityId) {
      toast.error('Lütfen bir hastane seçin.');
      return;
    }
    if (!formData.finding.trim()) {
      toast.error('Tespit metni zorunludur.');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/operations/improvements/records`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          ...formData,
          sheetType,
          moduleGroup: sheetType === 'DENETIMLER' ? 'DENETIMLER' : 'ELEKTRIK',
          recordDate: formData.recordDate ? new Date(formData.recordDate).toISOString() : null,
          dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
        })
      });

      const d = await res.json();
      if (!res.ok || !d.success) throw new Error(d.message || 'Kayıt eklenemedi.');

      toast.success('Yeni kayıt başarıyla eklendi.');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error('Hata: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-card text-card-foreground border rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        <div className="px-6 py-4 border-b flex items-center justify-between bg-muted/40">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Yeni Kayıt Oluştur ({sheetType})
            </h3>
            <p className="text-xs text-muted-foreground">Sisteme yeni bir tespit ve aksiyon kaydı ekleyin.</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-sm">
          
          {/* Hastane Seçimi */}
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">
              Hastane <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.facilityId}
              onChange={e => setFormData({ ...formData, facilityId: e.target.value })}
              className="w-full h-9 px-3 rounded-lg border bg-background text-foreground text-xs outline-none"
              required
            >
              <option value="">Hastane Seçiniz...</option>
              {facilities.map(fac => (
                <option key={fac.id} value={fac.id}>{fac.name}</option>
              ))}
            </select>
          </div>

          {/* Kategori ve Risk Skoru */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Kategori
              </label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border bg-background text-foreground text-xs outline-none"
              >
                {availableCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                {!availableCategories.includes(formData.category) && formData.category && (
                  <option value={formData.category}>{formData.category}</option>
                )}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Risk Skoru
              </label>
              <select
                value={formData.riskScore}
                onChange={e => setFormData({ ...formData, riskScore: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border bg-background text-foreground text-xs outline-none font-semibold"
              >
                <option value="Kritik">Kritik</option>
                <option value="Yüksek">Yüksek</option>
                <option value="Önemli">Önemli</option>
                <option value="Olası">Olası</option>
                <option value="Önemsiz">Önemsiz</option>
              </select>
            </div>
          </div>

          {/* Tespit Tarihi ve Termin Tarihi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                Tespit Tarihi
              </label>
              <input
                type="date"
                value={formData.recordDate}
                onChange={e => setFormData({ ...formData, recordDate: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border bg-background text-foreground text-xs outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-primary block mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-primary" />
                Termin Tarihi
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border bg-background text-foreground text-xs outline-none font-mono border-primary/40 focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Durum
              </label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border bg-background text-foreground text-xs outline-none"
              >
                <option value="Başlamadı">Başlamadı</option>
                <option value="Devam Ediyor">Devam Ediyor</option>
                <option value="Tamamlandı">Tamamlandı</option>
                <option value="İptal Edildi">İptal Edildi</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Sorumlusu
              </label>
              <input
                type="text"
                placeholder="Örn: Teknik Müdürlük"
                value={formData.assignedTo}
                onChange={e => setFormData({ ...formData, assignedTo: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border bg-background text-foreground text-xs outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Mahal
              </label>
              <input
                type="text"
                placeholder="Örn: A Blok 4. Kat"
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border bg-background text-foreground text-xs outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                {sheetType === 'DENETIMLER' ? 'Denetim Adı' : 'Ekipman'}
              </label>
              <input
                type="text"
                placeholder={sheetType === 'DENETIMLER' ? 'Örn: Saha Turu' : 'Örn: Ana Dağıtım Panosu'}
                value={sheetType === 'DENETIMLER' ? formData.auditName : formData.equipment}
                onChange={e => {
                  if (sheetType === 'DENETIMLER') {
                    setFormData({ ...formData, auditName: e.target.value });
                  } else {
                    setFormData({ ...formData, equipment: e.target.value });
                  }
                }}
                className="w-full h-9 px-3 rounded-lg border bg-background text-foreground text-xs outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">
              Tespit Metni <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Gözlemlenen uygunsuzluk ve tespit..."
              value={formData.finding}
              onChange={e => setFormData({ ...formData, finding: e.target.value })}
              className="w-full p-3 rounded-lg border bg-background text-foreground text-xs outline-none resize-none"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">
              İş Planı
            </label>
            <textarea
              rows={2}
              placeholder="Planlanan aksiyon ve giderim yöntemi..."
              value={formData.actionPlan}
              onChange={e => setFormData({ ...formData, actionPlan: e.target.value })}
              className="w-full p-3 rounded-lg border bg-background text-foreground text-xs outline-none resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-primary block mb-1">
              Aksiyon / Açıklama
            </label>
            <textarea
              rows={2}
              placeholder="Başlangıç açıklaması veya notu..."
              value={formData.currentNote}
              onChange={e => setFormData({ ...formData, currentNote: e.target.value })}
              className="w-full p-3 rounded-lg border bg-background text-foreground text-xs outline-none resize-none"
            />
          </div>

          <div className="pt-3 border-t flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
              Vazgeç
            </Button>
            <Button type="submit" size="sm" disabled={loading} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {loading ? 'Kaydediliyor...' : 'Kaydı Oluştur'}
            </Button>
          </div>

        </form>

      </div>
    </div>
  );
};
