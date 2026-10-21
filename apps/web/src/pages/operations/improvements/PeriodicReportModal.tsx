import React, { useState, useEffect } from 'react';
import { X, Calendar, FileText, CheckCircle2, AlertTriangle, Building2, UploadCloud, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import type { FacilityOption, ImprovementPeriodicReport } from './types';

const API = import.meta.env.VITE_API_URL || '';

interface PeriodicReportModalProps {
  sheetType: string;
  sheetTitle: string;
  facilities: FacilityOption[];
  defaultFacilityId?: string;
  reportToEdit?: ImprovementPeriodicReport | null;
  onClose: () => void;
  onSuccess: (savedReport: ImprovementPeriodicReport) => void;
  onRequestAddFinding?: (facilityId: string, reportId: string) => void;
}

export const PeriodicReportModal: React.FC<PeriodicReportModalProps> = ({
  sheetType,
  sheetTitle,
  facilities,
  defaultFacilityId,
  reportToEdit,
  onClose,
  onSuccess,
  onRequestAddFinding,
}) => {
  const isEditing = !!reportToEdit;
  const initialFacility = (defaultFacilityId && defaultFacilityId !== 'ALL')
    ? defaultFacilityId
    : (reportToEdit?.facilityId || facilities[0]?.id || '');

  // Tarih yardımcı fonksiyonları
  const toDateInputVal = (d?: string | null) => {
    if (!d) return '';
    try {
      return new Date(d).toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  const toDateTimeInputVal = (d?: string | null) => {
    if (!d) return '';
    try {
      const dt = new Date(d);
      return dt.toISOString().slice(0, 16);
    } catch {
      return '';
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    facilityId: initialFacility,
    actionType: reportToEdit?.actionType || 'Periyodik Kontrol',
    inspectionDate: toDateInputVal(reportToEdit?.inspectionDate) || todayStr,
    nextInspectionDate: toDateInputVal(reportToEdit?.nextInspectionDate) || '',
    reportNo: reportToEdit?.reportNo || '',
    reportDate: toDateInputVal(reportToEdit?.reportDate) || todayStr,
    isgKatipId: reportToEdit?.isgKatipId || '',
    startDate: toDateTimeInputVal(reportToEdit?.startDate) || '',
    endDate: toDateTimeInputVal(reportToEdit?.endDate) || '',
    firmName: reportToEdit?.firmName || '',
    inspectorName: reportToEdit?.inspectorName || '',
    result: reportToEdit?.result || 'Uygun',
    notes: reportToEdit?.notes || '',
  });

  const [loading, setLoading] = useState(false);

  // 1 Yıl Kuralı: Sonuç "Uygun" ise Sonraki Kontrol Tarihini otomatik olarak Başlangıç/Gerçekleşme tarihinden 1 yıl sonraya ayarla
  useEffect(() => {
    if (!isEditing && formData.result === 'Uygun') {
      const baseDateStr = formData.inspectionDate || (formData.startDate ? formData.startDate.split('T')[0] : todayStr);
      if (baseDateStr) {
        const baseDate = new Date(baseDateStr);
        if (!isNaN(baseDate.getTime())) {
          baseDate.setFullYear(baseDate.getFullYear() + 1);
          const nextDateStr = baseDate.toISOString().split('T')[0];
          setFormData(prev => ({ ...prev, nextInspectionDate: nextDateStr }));
        }
      }
    }
  }, [formData.inspectionDate, formData.startDate, formData.result, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.facilityId) {
      toast.error('Lütfen bir hastane seçin.');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const url = isEditing
        ? `${API}/api/operations/improvements/periodic-reports/${reportToEdit.id}`
        : `${API}/api/operations/improvements/periodic-reports`;

      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          ...formData,
          sheetType,
        }),
      });

      const d = await res.json();
      if (!res.ok || !d.success) {
        throw new Error(d.message || 'Rapor kaydedilemedi.');
      }

      const savedReport: ImprovementPeriodicReport = d.data;
      toast.success(isEditing ? 'Rapor güncellendi.' : 'Periyodik kontrol raporu kaydedildi.');
      onSuccess(savedReport);
      onClose();

      // Kural: Eğer sonuç "Uygun Değil" ise kullanıcıya bulgu ekleme önerisi sun
      if (savedReport.result === 'Uygun Değil' && onRequestAddFinding) {
        setTimeout(() => {
          const addFindingConfirm = window.confirm(
            'Topraklama periyodik kontrol sonucu "Uygun Değil" olarak kaydedildi.\n\nTespit edilen kusur ve uygunsuzluklar için şimdi bulgu eklemek ister misiniz?'
          );
          if (addFindingConfirm) {
            onRequestAddFinding(savedReport.facilityId, savedReport.id);
          }
        }, 300);
      }
    } catch (err: any) {
      toast.error('Hata: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto font-sans animate-in fade-in duration-150">
      <div className="bg-card text-card-foreground border rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-6">
        
        {/* Üst Başlık (Görsel 2'deki gibi) */}
        <div className="px-6 py-4 border-b flex items-center justify-between bg-muted/40">
          <div>
            <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
              {sheetTitle || 'TOPRAKLAMA PK'}
            </span>
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              {isEditing ? 'Rapor Bilgilerini Düzenle' : 'İşlem / Rapor Ekle'}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              1 · Rapor Bilgileri & Periyodik Kontrol Doğrulama
            </p>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[78vh] overflow-y-auto text-sm">
          
          {/* 1. Satır: Hastane, İşlem Türü, Gerçekleşme Tarihi */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Hastane <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.facilityId}
                onChange={e => setFormData({ ...formData, facilityId: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border bg-background text-foreground text-xs outline-none cursor-pointer"
                required
              >
                <option value="">Seçiniz</option>
                {facilities.map(fac => (
                  <option key={fac.id} value={fac.id}>
                    {fac.shortName || fac.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                İşlem Türü
              </label>
              <select
                value={formData.actionType}
                onChange={e => setFormData({ ...formData, actionType: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border bg-background text-foreground text-xs outline-none cursor-pointer"
              >
                <option value="Periyodik Kontrol">Periyodik Kontrol</option>
                <option value="Ara Kontrol">Ara Kontrol</option>
                <option value="Bakım / Revizyon">Bakım / Revizyon</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Gerçekleşme Tarihi
              </label>
              <input
                type="date"
                value={formData.inspectionDate}
                onChange={e => setFormData({ ...formData, inspectionDate: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border bg-background text-foreground text-xs outline-none font-mono"
                required
              />
            </div>
          </div>

          {/* 2. Satır: Sonraki Kontrol Tarihi, Rapor No, Yapan Firma/Kişi */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-primary block mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                Sonraki Kontrol Tarihi
              </label>
              <input
                type="date"
                value={formData.nextInspectionDate}
                onChange={e => setFormData({ ...formData, nextInspectionDate: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border border-primary/50 bg-background text-foreground text-xs outline-none font-mono font-semibold"
              />
              <span className="text-[10px] text-muted-foreground block mt-0.5">
                Topraklama uygun ise 1 yıl sürelidir.
              </span>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Rapor No
              </label>
              <input
                type="text"
                placeholder="Örn: 26-1478-141"
                value={formData.reportNo}
                onChange={e => setFormData({ ...formData, reportNo: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border bg-background text-foreground text-xs outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Yapan Firma / Kişi
              </label>
              <input
                type="text"
                placeholder="Örn: Test & Denetim Ltd."
                value={formData.firmName}
                onChange={e => setFormData({ ...formData, firmName: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border bg-background text-foreground text-xs outline-none"
              />
            </div>
          </div>

          {/* 3. Satır: Sonuç (Uygun / Uygun Değil) & İSG-KATİP Sözleşme ID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Sonuç <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, result: 'Uygun' })}
                  className={`h-10 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    formData.result === 'Uygun'
                      ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs'
                      : 'bg-background text-muted-foreground border-border hover:bg-muted'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Uygun (Yeşil)
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, result: 'Uygun Değil' })}
                  className={`h-10 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    formData.result === 'Uygun Değil'
                      ? 'bg-red-600 text-white border-red-700 shadow-xs'
                      : 'bg-background text-muted-foreground border-border hover:bg-muted'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                  Uygun Değil (Kırmızı)
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                İSG-KATİP Sözleşme ID
              </label>
              <input
                type="text"
                placeholder="Örn: 27058219"
                value={formData.isgKatipId}
                onChange={e => setFormData({ ...formData, isgKatipId: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border bg-background text-foreground text-xs outline-none font-mono"
              />
            </div>
          </div>

          {/* 4. Satır: Başlangıç ve Bitiş Tarih & Saati (Görsel 1 Detayları) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-muted/30 rounded-xl border border-border/70">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Periyodik Kontrol Başlangıç Tarihi ve Saati
              </label>
              <input
                type="datetime-local"
                value={formData.startDate}
                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full h-8 px-2.5 rounded-lg border bg-background text-foreground text-xs outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Periyodik Kontrol Bitiş Tarihi ve Saati
              </label>
              <input
                type="datetime-local"
                value={formData.endDate}
                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full h-8 px-2.5 rounded-lg border bg-background text-foreground text-xs outline-none font-mono"
              />
            </div>
          </div>

          {/* Açıklama / Rapor Özeti */}
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">
              Rapor Genel Notu / Açıklama
            </label>
            <textarea
              rows={2}
              placeholder="Rapor veya denetçi açıklamaları..."
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              className="w-full p-2.5 rounded-xl border bg-background text-foreground text-xs outline-none resize-none"
            />
          </div>

          {/* Alt Butonlar */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="h-9 px-4 text-xs font-medium"
            >
              Vazgeç
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="h-9 px-6 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
            >
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>

        </form>

      </div>
    </div>
  );
};
