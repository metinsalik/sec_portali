import React, { useState } from 'react';
import { 
  FileSpreadsheet, Upload, X, CheckCircle, AlertCircle, 
  Building2, Calendar, RefreshCw, Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { thermalInspectionService, type ThermalInspectionSession } from '@/services/thermal-inspection.service';

interface Props {
  facilities: Array<{ id: string; name: string }>;
  activeFacilityId: string;
  isAdminOrMgmt: boolean;
  sessions: ThermalInspectionSession[];
  targetSessionId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const ThermalExcelImportModal: React.FC<Props> = ({
  facilities,
  activeFacilityId,
  isAdminOrMgmt,
  sessions,
  targetSessionId,
  onClose,
  onSuccess
}) => {
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>(
    activeFacilityId !== 'all' ? activeFacilityId : (facilities[0]?.id || '')
  );

  // If a specific session was passed, pre-select its date
  const foundSession = sessions.find(s => s.id === targetSessionId);
  const [reportDate, setReportDate] = useState<string>(() => {
    if (foundSession?.reportDate) {
      return new Date(foundSession.reportDate).toISOString().split('T')[0];
    }
    return new Date().toISOString().split('T')[0];
  });

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setFile(files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFacilityId || selectedFacilityId === 'all') {
      toast.error('Lütfen içe aktarılacak hastaneyi/tesisi seçin.');
      return;
    }
    if (!file) {
      toast.error('Lütfen Excel dosyasını seçin.');
      return;
    }
    if (!reportDate) {
      toast.error('Lütfen bir kontrol/rapor tarihi belirleyin.');
      return;
    }

    try {
      setLoading(true);
      const res = await thermalInspectionService.importExcel(selectedFacilityId, file, reportDate);
      toast.success(res.message || 'Excel başarıyla aktarıldı.');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Excel yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Excel'den Toplu Ölçüm Aktar
              </h2>
              <p className="text-xs text-slate-500">
                Seçilen rapor tarihine göre tüm pano ölçümlerini tek seferde aktarın.
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
        <div className="p-6 space-y-4">
          {/* Tesis Seçimi */}
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

          {/* Ölçüm / Rapor Tarihi */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-orange-600" />
                Ölçüm / Rapor Tarihi *
              </Label>
              <span className="text-[11px] text-slate-400">
                (Bu rapor dönemine aktarılır)
              </span>
            </div>
            <Input
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              className="h-10 text-sm bg-white dark:bg-slate-800"
            />
          </div>

          {/* Dosya Yükleme Alanı */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Excel Dosyası (.xlsx, .xls) *
            </Label>
            <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-orange-500/50 transition-colors bg-slate-50/50 dark:bg-slate-800/30">
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                className="hidden"
                id="thermal-excel-input"
              />
              <label 
                htmlFor="thermal-excel-input"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                {file ? (
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Excel dosyasını seçmek için tıklayın
                    </p>
                    <p className="text-xs text-slate-400">
                      Ölçüm Formu veya Termal Kontrol Tablosu (.xlsx)
                    </p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Bilgi Kutusu */}
          <div className="bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl p-3 text-xs text-amber-800 dark:text-amber-300 space-y-1">
            <div className="font-semibold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              Otomatik Algılama:
            </div>
            <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-400">
              Excel içindeki Pano No, Lokasyon, Kat, Ekipman, Ölçülen ve Ortam Sıcaklıkları otomatik tespit edilip belirtilen rapor tarihine kaydedilir.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={loading}
            className="text-xs"
          >
            Vazgeç
          </Button>
          <Button
            onClick={handleUpload}
            disabled={loading || !file}
            className="bg-orange-600 hover:bg-orange-700 text-white text-xs gap-1.5 font-medium px-4"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                İçe Aktarılıyor...
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5" />
                Excel'i Bu Tarihe Aktar
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
