import React, { useState } from 'react';
import { 
  FileText, Calendar, Plus, X, Building2, RefreshCw 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  thermalInspectionService, 
  type ThermalInspectionSession 
} from '@/services/thermal-inspection.service';

interface Props {
  facilities: Array<{ id: string; name: string }>;
  activeFacilityId: string;
  isAdminOrMgmt: boolean;
  onClose: () => void;
  onCreated: (session: ThermalInspectionSession) => void;
}

export const ThermalNewReportModal: React.FC<Props> = ({
  facilities,
  activeFacilityId,
  isAdminOrMgmt,
  onClose,
  onCreated
}) => {
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>(
    activeFacilityId !== 'all' ? activeFacilityId : (facilities[0]?.id || '')
  );
  const [reportDate, setReportDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFacilityId || selectedFacilityId === 'all') {
      toast.error('Lütfen geçerli bir hastane/tesis seçiniz.');
      return;
    }
    if (!reportDate) {
      toast.error('Lütfen bir kontrol/rapor tarihi belirleyiniz.');
      return;
    }

    try {
      setLoading(true);
      const newSession = await thermalInspectionService.createSession({
        facilityId: selectedFacilityId,
        reportDate,
        notes: notes.trim() || undefined
      });
      toast.success(`${new Date(reportDate).toLocaleDateString('tr-TR')} tarihli ölçüm rapor dönemi açıldı.`);
      onCreated(newSession);
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Rapor oluşturulamadı.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 px-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Yeni Ölçüm Raporu Oluştur
              </h2>
              <p className="text-xs text-slate-500">
                Kontrol tarihi belirleyip pano kayıtlarını içine aktarın.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Tesis Seçimi (Merkez / Admin ise değiştirilebilir) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Hedef Hastane / Tesis *
            </Label>
            <select
              value={selectedFacilityId}
              onChange={(e) => setSelectedFacilityId(e.target.value)}
              disabled={!isAdminOrMgmt && activeFacilityId !== 'all'}
              className="w-full text-sm h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 disabled:opacity-60"
            >
              {facilities.map((fac) => (
                <option key={fac.id} value={fac.id}>
                  {fac.name}
                </option>
              ))}
            </select>
          </div>

          {/* Kontrol / Rapor Tarihi */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-orange-600" />
              Kontrol / Rapor Tarihi *
            </Label>
            <Input
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              className="h-10 text-sm bg-white dark:bg-slate-800"
              required
            />
            <p className="text-[11px] text-slate-400">
              Bu tarihe ait ölçüm formu oluşturulur. Ardından Excel ile toplu yükleme yapabilir veya tek tek pano ekleyebilirsiniz.
            </p>
          </div>

          {/* Açıklama / Not */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Rapor Notu / Dönem Açıklaması (Opsiyonel)
            </Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Örn: 2026 3. Çeyrek Periyodik Termal Kontrolü"
              className="h-9 text-xs"
            />
          </div>

          {/* Footer */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={loading}
              className="text-xs"
            >
              Vazgeç
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-orange-600 hover:bg-orange-700 text-white text-xs gap-1.5 font-medium px-4"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Oluşturuluyor...
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  Raporu Oluştur
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
