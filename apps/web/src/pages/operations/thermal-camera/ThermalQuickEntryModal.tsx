import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Building2, MapPin, Layers, 
  Thermometer, Clock, Calendar, CheckCircle2, 
  AlertTriangle, RefreshCw, X 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  thermalInspectionService, 
  type ThermalInspectionSession,
  type ThermalInspectionItem 
} from '@/services/thermal-inspection.service';

interface Props {
  facilityId: string;
  facilityName: string;
  activeSession: ThermalInspectionSession | null;
  sessions?: ThermalInspectionSession[];
  initialDate?: string;
  onSessionCreated: (session: ThermalInspectionSession) => void;
  onItemAdded: (item: ThermalInspectionItem) => void;
  onClose?: () => void;
}

export const ThermalQuickEntryModal: React.FC<Props> = ({
  facilityId,
  facilityName,
  activeSession,
  sessions = [],
  initialDate,
  onSessionCreated,
  onItemAdded,
  onClose
}) => {
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);

  // Selected Session / Report Date
  const [selectedSessionId, setSelectedSessionId] = useState<string>(
    activeSession?.id || (sessions[0]?.id || '')
  );

  // Form Fields
  const [panelName, setPanelName] = useState('');
  const [buildingLocation, setBuildingLocation] = useState('Hastane Geneli');
  const [floorSection, setFloorSection] = useState('');
  const [measurementPoint, setMeasurementPoint] = useState('1 Metre');
  const [equipmentConnection, setEquipmentConnection] = useState('');
  const [measuredTemp, setMeasuredTemp] = useState<string>('');
  const [ambientTemp, setAmbientTemp] = useState<string>('22.0');
  const [controlTime, setControlTime] = useState<string>(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [measurementDate, setMeasurementDate] = useState<string>(() => {
    if (initialDate && /^\d{4}-\d{2}-\d{2}$/.test(initialDate)) return initialDate;
    if (activeSession?.reportDate) {
      return new Date(activeSession.reportDate).toISOString().split('T')[0];
    }
    return new Date().toISOString().split('T')[0];
  });
  const [detectedRisk, setDetectedRisk] = useState('');
  const [actionTaken, setActionTaken] = useState('');

  // Autocomplete Suggestions
  const [suggestions, setSuggestions] = useState<Array<{
    panelName: string;
    buildingLocation?: string;
    floorSection?: string;
    equipmentConnection?: string;
    measurementPoint?: string;
  }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Calculated Delta T
  const deltaT = (measuredTemp && ambientTemp) 
    ? (parseFloat(measuredTemp) - parseFloat(ambientTemp)).toFixed(1)
    : null;

  // Search autocomplete on panelName input
  useEffect(() => {
    const term = panelName.trim();
    if (term.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const results = await thermalInspectionService.getPanelSuggestions(facilityId, term);
        setSuggestions(results);
      } catch (e) {
        console.error(e);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [panelName, facilityId]);

  const handleSelectSuggestion = (s: any) => {
    setPanelName(s.panelName);
    if (s.buildingLocation) setBuildingLocation(s.buildingLocation);
    if (s.floorSection) setFloorSection(s.floorSection);
    if (s.equipmentConnection) setEquipmentConnection(s.equipmentConnection);
    if (s.measurementPoint) setMeasurementPoint(s.measurementPoint);
    setShowSuggestions(false);
  };

  const ensureSession = async (): Promise<string> => {
    // If user explicitly picked an existing session
    if (selectedSessionId) {
      return selectedSessionId;
    }
    if (activeSession && activeSession.id) {
      return activeSession.id;
    }

    // Check if an existing session in this facility matches this measurementDate
    const existing = sessions.find(s => {
      if (!s.reportDate) return false;
      const sDate = new Date(s.reportDate).toISOString().split('T')[0];
      return sDate === measurementDate;
    });
    if (existing) {
      return existing.id;
    }

    // Create new session for this date
    setSessionLoading(true);
    try {
      const newSess = await thermalInspectionService.createSession({
        facilityId,
        reportDate: measurementDate,
        notes: `Manuel ölçüm girişi (${measurementDate})`
      });
      onSessionCreated(newSess);
      setSelectedSessionId(newSess.id);
      return newSess.id;
    } finally {
      setSessionLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!panelName.trim()) {
      toast.error('Lütfen pano no veya adını girin.');
      return;
    }
    if (!measuredTemp) {
      toast.error('Lütfen ölçülen sıcaklığı girin.');
      return;
    }

    try {
      setLoading(true);
      const sessionId = await ensureSession();

      const mTemp = parseFloat(measuredTemp);
      const aTemp = ambientTemp ? parseFloat(ambientTemp) : null;
      const dT = (aTemp !== null && !isNaN(aTemp)) ? Number((mTemp - aTemp).toFixed(1)) : null;

      // Status suggestion
      let autoStatus = 'Normal';
      let autoPriority = 'Rutin';
      if (mTemp >= 60 || (dT !== null && dT >= 30)) {
        autoStatus = 'Acil';
        autoPriority = 'Yüksek';
      } else if (mTemp >= 40 || (dT !== null && dT >= 15)) {
        autoStatus = 'Uygunsuz';
        autoPriority = 'Orta';
      } else if (mTemp >= 35 || (dT !== null && dT >= 10)) {
        autoStatus = 'Takip';
        autoPriority = 'Orta';
      } else if (dT !== null && dT < 0) {
        autoStatus = 'Normal';
        autoPriority = 'Rutin';
      }

      const created = await thermalInspectionService.createItem({
        sessionId,
        panelName: panelName.trim(),
        buildingLocation: buildingLocation.trim() || null,
        floorSection: floorSection.trim() || null,
        measurementPoint: measurementPoint.trim() || null,
        equipmentConnection: equipmentConnection.trim() || null,
        measuredTemp: mTemp,
        ambientTemp: aTemp,
        deltaTemp: dT,
        measurementDate: measurementDate ? new Date(measurementDate) : new Date(),
        controlTime: controlTime || null,
        status: autoStatus,
        priority: autoPriority,
        detectedRisk: detectedRisk.trim() || (autoStatus === 'Normal' ? 'Anormal sıcaklık yok' : null),
        actionTaken: actionTaken.trim() || null
      });

      toast.success(`${created.panelName} ölçümü rapora eklendi!`);
      onItemAdded(created);

      // Reset fields for fast next entry (keep date & location)
      setPanelName('');
      setMeasuredTemp('');
      setDetectedRisk('');
      setActionTaken('');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Kayıt eklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 px-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Rapor İçine Tek Tek Pano Ölçümü Ekle
              </h2>
              <p className="text-xs text-slate-500">
                {facilityName} için ölçüm değerlerini kaydedin.
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Rapor / Dönem Seçimi */}
          <div className="p-3.5 bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/40 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-orange-900 dark:text-orange-300 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-orange-600" />
                Ölçüm / Rapor Tarihi & Oturumu *
              </Label>
              <span className="text-[11px] text-orange-700/80">
                (Kayıt bu rapor altına işlenir)
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sessions.length > 0 && (
                <div>
                  <select
                    value={selectedSessionId}
                    onChange={(e) => {
                      const sId = e.target.value;
                      setSelectedSessionId(sId);
                      const target = sessions.find(s => s.id === sId);
                      if (target?.reportDate) {
                        setMeasurementDate(new Date(target.reportDate).toISOString().split('T')[0]);
                      }
                    }}
                    className="w-full text-xs h-9 px-3 rounded-lg border border-orange-300 dark:border-orange-800 bg-white dark:bg-slate-800 font-semibold text-slate-800 dark:text-slate-200"
                  >
                    {sessions.map(s => {
                      const d = s.reportDate ? new Date(s.reportDate).toLocaleDateString('tr-TR') : 'Tarihsiz';
                      return (
                        <option key={s.id} value={s.id}>
                          Rapor: {d} ({s._count?.items ?? s.items?.length ?? 0} Pano)
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}
              <div>
                <Input
                  type="date"
                  value={measurementDate}
                  onChange={(e) => setMeasurementDate(e.target.value)}
                  className="h-9 text-xs bg-white dark:bg-slate-800 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Autocomplete Pano Adı / No */}
          <div className="relative space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Pano No / Adı *
              </Label>
              <span className="text-[11px] text-slate-400">
                (Önceki Excel'den kaydedilen panolar otomatik bulunur)
              </span>
            </div>
            <div className="relative">
              <Input
                placeholder="Örn: ADP-01 veya THD-TEM07899..."
                value={panelName}
                onChange={(e) => {
                  setPanelName(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="h-10 text-sm font-medium pr-10"
                autoFocus
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            </div>

            {/* Suggestions Popup */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto">
                <div className="p-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2">
                  Kayıtlı Panolar (Tıklayarak lokasyonu ve bağlantıyı otomatik doldurun)
                </div>
                {suggestions.map((s, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectSuggestion(s)}
                    className="p-2.5 px-3 hover:bg-orange-50 dark:hover:bg-slate-700/60 cursor-pointer flex items-center justify-between text-xs border-b border-slate-100 dark:border-slate-700/50 last:border-0"
                  >
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {s.panelName}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {s.floorSection || s.buildingLocation || '—'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Konum / Kat & Ekipman */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Lokasyon / Bina
              </Label>
              <Input
                value={buildingLocation}
                onChange={(e) => setBuildingLocation(e.target.value)}
                placeholder="Örn: Hastane Geneli"
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Kat / Bölüm
              </Label>
              <Input
                value={floorSection}
                onChange={(e) => setFloorSection(e.target.value)}
                placeholder="Örn: -1 ADP veya 3. Kat"
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Ekipman / Bağlantı
              </Label>
              <Input
                value={equipmentConnection}
                onChange={(e) => setEquipmentConnection(e.target.value)}
                placeholder="Örn: Şönt Reaktif Panosu"
                className="h-9 text-xs"
              />
            </div>
          </div>

          {/* Sıcaklık Ölçümleri & Delta T */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Ölçülen Sıcaklık (°C) *
              </Label>
              <Input
                type="number"
                step="0.1"
                value={measuredTemp}
                onChange={(e) => setMeasuredTemp(e.target.value)}
                placeholder="Örn: 38.5"
                className="h-10 text-base font-bold text-orange-600 dark:text-orange-400"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Ortam Sıcaklığı (°C)
              </Label>
              <Input
                type="number"
                step="0.1"
                value={ambientTemp}
                onChange={(e) => setAmbientTemp(e.target.value)}
                placeholder="Örn: 22.0"
                className="h-10 text-base font-medium"
              />
            </div>
            <div className="space-y-1.5 flex flex-col justify-end">
              <div className="h-10 px-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Fark (ΔT):</span>
                <span className={`text-base font-bold ${
                  deltaT !== null && parseFloat(deltaT) >= 30 ? 'text-rose-600' :
                  deltaT !== null && parseFloat(deltaT) >= 15 ? 'text-orange-600' :
                  deltaT !== null && parseFloat(deltaT) < 0 ? 'text-indigo-600' : 'text-emerald-600'
                }`}>
                  {deltaT !== null ? `${deltaT} °C` : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Saat ve Ölçüm Noktası */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Kontrol Saati
              </Label>
              <Input
                type="time"
                value={controlTime}
                onChange={(e) => setControlTime(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Ölçüm Mesafesi / Noktası
              </Label>
              <Input
                value={measurementPoint}
                onChange={(e) => setMeasurementPoint(e.target.value)}
                placeholder="Örn: 1 Metre"
                className="h-9 text-xs"
              />
            </div>
          </div>

          {/* Tespit / Açıklama */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Tespit / Açıklama
            </Label>
            <Input
              value={detectedRisk}
              onChange={(e) => setDetectedRisk(e.target.value)}
              placeholder="Örn: Şalter giriş barasında hafif ısınma tespit edildi veya Anormal sıcaklık yok..."
              className="h-9 text-xs"
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            {onClose && (
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={loading}
                className="text-xs"
              >
                Kapat
              </Button>
            )}
            <Button
              type="submit"
              disabled={loading || sessionLoading}
              className="bg-orange-600 hover:bg-orange-700 text-white text-xs gap-1.5 font-medium px-5"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  Ölçümü Bu Rapora Ekle
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
