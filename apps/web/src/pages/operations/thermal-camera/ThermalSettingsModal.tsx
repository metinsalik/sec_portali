import React, { useState, useEffect } from 'react';
import { 
  Settings, Sliders, ShieldAlert, Thermometer, 
  CheckCircle2, RefreshCw, X, AlertTriangle, Info 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { thermalInspectionService } from '@/services/thermal-inspection.service';

interface Props {
  facilityId: string;
  facilityName: string;
  onClose?: () => void;
  onSaved?: () => void;
}

export const ThermalSettingsModal: React.FC<Props> = ({
  facilityId,
  facilityName,
  onClose,
  onSaved
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Settings State
  const [warningThreshold, setWarningThreshold] = useState<number>(35.0);
  const [criticalThreshold, setCriticalThreshold] = useState<number>(40.0);
  const [deltaWarning, setDeltaWarning] = useState<number>(15.0);
  const [deltaCritical, setDeltaCritical] = useState<number>(30.0);
  const [negativeDeltaWarn, setNegativeDeltaWarn] = useState<boolean>(true);

  useEffect(() => {
    fetchSettings();
  }, [facilityId]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await thermalInspectionService.getSettings(facilityId);
      if (data) {
        setWarningThreshold(data.warningThreshold ?? 35.0);
        setCriticalThreshold(data.criticalThreshold ?? 40.0);
        setDeltaWarning(data.deltaWarning ?? 15.0);
        setDeltaCritical(data.deltaCritical ?? 30.0);
        setNegativeDeltaWarn(data.negativeDeltaWarn ?? true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await thermalInspectionService.updateSettings({
        facilityId: facilityId !== 'all' ? facilityId : null,
        warningThreshold,
        criticalThreshold,
        deltaWarning,
        deltaCritical,
        negativeDeltaWarn
      });
      toast.success('Termal değerlendirme ve Delta T ayarları kaydedildi!');
      if (onSaved) onSaved();
      if (onClose) onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Ayarlar kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 px-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Sıcaklık ve ΔT Değerlendirme Kriterleri
              </h2>
              <p className="text-xs text-slate-500">
                {facilityName} için otomatik risk ve öncelik eşikleri
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
              <span className="text-xs">Ayarlar yükleniyor...</span>
            </div>
          ) : (
            <>
              {/* Bilgi Kutusu */}
              <div className="bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 rounded-xl p-3 text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  Ölçülen sıcaklık ve ortam farkı (ΔT) bu eşiklerle otomatik karşılaştırılarak panolara <strong>Normal</strong>, <strong>Takip</strong> veya <strong>Uygunsuz/Kritik</strong> durumları atanır.
                </p>
              </div>

              {/* 1. Sıcaklık Eşikleri */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Ölçülen Sıcaklık Sınırları (°C)
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Takip Başlangıcı (°C)
                    </Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={warningThreshold}
                      onChange={(e) => setWarningThreshold(parseFloat(e.target.value) || 35)}
                      className="h-9 text-sm font-semibold"
                    />
                    <span className="text-[10px] text-slate-400">Örn: 35.0 °C (Yüksek yükte takip)</span>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Kritik / Aksiyon Eşiği (°C)
                    </Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={criticalThreshold}
                      onChange={(e) => setCriticalThreshold(parseFloat(e.target.value) || 40)}
                      className="h-9 text-sm font-semibold text-rose-600 dark:text-rose-400"
                    />
                    <span className="text-[10px] text-slate-400">Örn: 40.0 °C (Teknik inceleme & aksiyon)</span>
                  </div>
                </div>
              </div>

              {/* 2. Delta T Fark Eşikleri */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Sıcaklık Farkı Eşikleri (ΔT = Ölçülen - Ortam)
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Uyarı Farkı (ΔT °C)
                    </Label>
                    <Input
                      type="number"
                      step="1"
                      value={deltaWarning}
                      onChange={(e) => setDeltaWarning(parseFloat(e.target.value) || 15)}
                      className="h-9 text-sm font-semibold"
                    />
                    <span className="text-[10px] text-slate-400">Örn: 15 °C fark</span>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Acil / Tehlike Farkı (ΔT °C)
                    </Label>
                    <Input
                      type="number"
                      step="1"
                      value={deltaCritical}
                      onChange={(e) => setDeltaCritical(parseFloat(e.target.value) || 30)}
                      className="h-9 text-sm font-semibold text-rose-600 dark:text-rose-400"
                    />
                    <span className="text-[10px] text-slate-400">Örn: 30 °C ve üzeri aşırı ısınma</span>
                  </div>
                </div>
              </div>

              {/* 3. Negatif Delta T Doğrulama Uyarısı */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold text-slate-900 dark:text-white">
                    Ortamdan Soğuk Ölçüm Uyarısı (ΔT &lt; 0)
                  </Label>
                  <p className="text-[11px] text-slate-500">
                    Pano sıcaklığı ortamdan düşükse parlak yüzey / yansıma hatası olarak işaretle
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={negativeDeltaWarn}
                  onChange={(e) => setNegativeDeltaWarn(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
              </div>
            </>
          )}

          {/* Footer */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            {onClose && (
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={saving}
                className="text-xs"
              >
                Vazgeç
              </Button>
            )}
            <Button
              type="submit"
              disabled={saving || loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5 font-medium px-4"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                'Ayarları Kaydet'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
