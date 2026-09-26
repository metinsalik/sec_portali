import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  FileSpreadsheet, Upload, Plus, CheckCircle2, Clock,
  Camera, Trash2, Edit2, Search, Filter, AlertTriangle,
  ChevronDown, RefreshCw, BarChart3, ArrowLeft, Download, ShieldCheck
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  thermalInspectionService,
  type ThermalInspectionSession,
  type ThermalInspectionItem,
  type ThermalDashboardResponse
} from '@/services/thermal-inspection.service';
import { ThermalPhotoModal } from './ThermalPhotoModal';
import { ThermalItemFormModal } from './ThermalItemFormModal';
import { ThermalExecutiveDashboard } from './ThermalExecutiveDashboard';

interface Props {
  activeFacilityId: string;
  onFacilityChange?: (facilityId: string) => void;
  isAdminOrMgmt: boolean;
}

export const ThermalInspectionTab: React.FC<Props> = ({
  activeFacilityId,
  onFacilityChange,
  isAdminOrMgmt
}) => {
  const [sessions, setSessions] = useState<ThermalInspectionSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ThermalInspectionSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState<ThermalDashboardResponse | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  // Sub-view: 'DASHBOARD' | 'SESSION_DETAIL'
  const [viewMode, setViewMode] = useState<'DASHBOARD' | 'SESSION_DETAIL'>('DASHBOARD');

  // Excel Upload State
  const [isUploadingExcel, setIsUploadingExcel] = useState(false);
  const excelInputRef = useRef<HTMLInputElement>(null);

  // Photo Modal State
  const [photoItem, setPhotoItem] = useState<ThermalInspectionItem | null>(null);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

  // Manual Item Form Modal State
  const [formItem, setFormItem] = useState<ThermalInspectionItem | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [modalSessionId, setModalSessionId] = useState<string | null>(null);

  // Table Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  // Track session preference to survive facility change re-renders
  const pendingPreferredSessionIdRef = useRef<string | null>(null);

  // Helper: Unicode and case normalization for robust ID and name comparison
  const normalizeId = (id?: string | null) => (id || '').normalize('NFC').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();

  // Load Sessions and Dashboard
  const fetchData = async (preferSessionId?: string, overrideFacilityId?: string) => {
    const currentFacId = overrideFacilityId !== undefined ? overrideFacilityId : activeFacilityId;
    const targetPrefId = preferSessionId || pendingPreferredSessionIdRef.current || undefined;

    setLoading(true);
    setDashboardLoading(true);
    try {
      const [dashRes, sessRes] = await Promise.all([
        thermalInspectionService.getDashboardStats().catch(() => null),
        thermalInspectionService.getSessions(currentFacId !== 'all' ? currentFacId : undefined).catch(() => [])
      ]);
      const sessionList = Array.isArray(sessRes) ? sessRes : [];
      setDashboardData(dashRes);
      setSessions(sessionList);

      if (targetPrefId) {
        // Explicitly requested session: load it and lock into detail view
        try {
          const detail = await thermalInspectionService.getSessionDetail(targetPrefId);
          if (detail && detail.id) {
            setSelectedSession(detail);
            setViewMode('SESSION_DETAIL');
            // Keep the ref so subsequent calls also find it
            return;
          }
        } catch (e) {
          console.error('Failed to load preferred session detail', e);
        }
        // Only clear ref if we couldn't load it
        pendingPreferredSessionIdRef.current = null;
      }

      // If a specific facility is selected, load its session
      if (currentFacId !== 'all') {
        const curFacNormalized = normalizeId(currentFacId);
        const currentFacilityObj = dashRes?.facilities?.find((f: any) => normalizeId(f.id) === curFacNormalized);
        const currentFacilityName = currentFacilityObj ? normalizeId(currentFacilityObj.name) : '';

        const facSessions = sessionList.filter(s => {
          if (normalizeId(s.facilityId) === curFacNormalized) return true;
          if (currentFacilityName && s.facility?.name && normalizeId(s.facility.name) === currentFacilityName) return true;
          return false;
        });
        
        // Pick session with items first, or the latest one
        const withItems = facSessions.find(s => (s._count?.items || 0) > 0);
        const targetSessionId = withItems ? withItems.id : facSessions[0]?.id;

        if (targetSessionId) {
          const detail = await thermalInspectionService.getSessionDetail(targetSessionId);
          if (detail && detail.id) {
            setSelectedSession(detail);
            setViewMode('SESSION_DETAIL');
          }
        } else {
          // No sessions found for this facility — keep existing session if it has data
          setSelectedSession(prev => {
            if (prev && prev.items && prev.items.length > 0) {
              return prev; // NEVER wipe a session that has items
            }
            return null;
          });
          // Show SESSION_DETAIL view (shows empty state card if session is null)
          setViewMode('SESSION_DETAIL');
        }
      } else {
        // 'all' facilities — keep current session or show dashboard
        setSelectedSession((prev) => {
          if (!prev) setViewMode('DASHBOARD');
          return prev;
        });
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Veriler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
      setDashboardLoading(false);
    }
  };

  useEffect(() => {
    const handleFacilityChanged = () => {
      const current = localStorage.getItem('activeFacilityId') || 'all';
      fetchData(pendingPreferredSessionIdRef.current || undefined, current);
    };
    window.addEventListener('facilityChanged', handleFacilityChanged);
    fetchData(pendingPreferredSessionIdRef.current || undefined);
    return () => {
      window.removeEventListener('facilityChanged', handleFacilityChanged);
    };
  }, [activeFacilityId]);

  // Load single session detail
  const handleSelectSession = async (sessionId: string) => {
    setLoading(true);
    try {
      const detail = await thermalInspectionService.getSessionDetail(sessionId);
      setSelectedSession(detail);
      setViewMode('SESSION_DETAIL');
    } catch (err: any) {
      toast.error('Oturum detayları yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  // Excel Upload Handler
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    // Determine target facility
    let targetFacility = activeFacilityId;
    if (targetFacility === 'all') {
      const stored = localStorage.getItem('activeFacilityId');
      if (stored && stored !== 'all') {
        targetFacility = stored;
      } else if (dashboardData?.facilities && dashboardData.facilities.length > 0) {
        targetFacility = dashboardData.facilities[0].id;
      }
    }

    if (!targetFacility || targetFacility === 'all') {
      toast.error('Lütfen Excel yüklemesi yapmadan önce tesis seçiniz.');
      if (excelInputRef.current) excelInputRef.current.value = '';
      return;
    }

    setIsUploadingExcel(true);
    try {
      const res = await thermalInspectionService.importExcel(targetFacility, file);
      toast.success(res?.message || 'Excel başarıyla aktarıldı.');

      const uploadedSession = res?.session;
      if (uploadedSession?.id) {
        // Reset filters so all uploaded rows are immediately visible
        setSearch('');
        setStatusFilter('ALL');
        setPriorityFilter('ALL');

        // Store the session ID so any subsequent fetchData call preserves it
        pendingPreferredSessionIdRef.current = uploadedSession.id;

        // Immediately show the uploaded session and lock into detail view
        // The API response already contains the full session with all items
        setSelectedSession(uploadedSession);
        setViewMode('SESSION_DETAIL');

        // Update sessions list in the background (don't await, don't let it overwrite selectedSession)
        thermalInspectionService.getDashboardStats().then(d => { if (d) setDashboardData(d); }).catch(() => {});
        thermalInspectionService.getSessions(uploadedSession.facilityId || targetFacility).then(s => { if (Array.isArray(s)) setSessions(s); }).catch(() => {});
      } else {
        await fetchData(undefined, targetFacility);
      }
    } catch (err: any) {
      console.error('Excel upload error:', err);
      toast.error(err.response?.data?.error || err.message || 'Excel yüklenemedi.');
    } finally {
      setIsUploadingExcel(false);
      if (excelInputRef.current) excelInputRef.current.value = '';
    }
  };

  // Create Manual Session or Open Form
  const handleCreateManualSession = async () => {
    let targetFacility = activeFacilityId;
    if (targetFacility === 'all') {
      const stored = localStorage.getItem('activeFacilityId');
      if (stored && stored !== 'all') {
        targetFacility = stored;
      } else if (dashboardData?.facilities && dashboardData.facilities.length > 0) {
        targetFacility = dashboardData.facilities[0].id;
      }
    }

    if (!targetFacility || targetFacility === 'all') {
      toast.error('Lütfen önce bir tesis seçiniz.');
      return;
    }

    try {
      setLoading(true);
      const session = await thermalInspectionService.createSession({
        facilityId: targetFacility,
        notes: 'Manuel ölçüm oturumu'
      });
      const sessionWithItems = { ...session, items: session.items || [] };
      setSelectedSession(sessionWithItems);
      setModalSessionId(session.id);
      setViewMode('SESSION_DETAIL');
      setFormItem(null);
      setIsFormModalOpen(true);
      if (targetFacility !== activeFacilityId) {
        onFacilityChange?.(targetFacility);
      }
      toast.success('Yeni termal ölçüm formu başlatıldı. Şimdi ilk pano kaydınızı ekleyebilirsiniz.');
    } catch (err: any) {
      toast.error('Oturum oluşturulamadı: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Toggle Session Status ("Ölçümler Tamamlandı")
  const handleToggleStatus = async () => {
    if (!selectedSession) return;
    const nextStatus = selectedSession.status === 'TAMAMLANDI' ? 'DEVAM_EDIYOR' : 'TAMAMLANDI';
    try {
      const updated = await thermalInspectionService.updateSessionStatus(selectedSession.id, nextStatus);
      setSelectedSession({ ...selectedSession, ...updated });
      toast.success(
        nextStatus === 'TAMAMLANDI'
          ? 'Tebrikler! Termal pano ölçümleri "TAMAMLANDI" olarak onaylandı.'
          : 'Form durumu "DEVAM EDİYOR" olarak güncellendi.'
      );
      fetchData(selectedSession.id);
    } catch (err: any) {
      toast.error('Durum güncellenemedi.');
    }
  };

  // Delete item
  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Bu ölçüm satırını silmek istediğinize emin misiniz?')) return;
    try {
      await thermalInspectionService.deleteItem(itemId);
      toast.success('Ölçüm satırı silindi.');
      if (selectedSession && selectedSession.items) {
        setSelectedSession({
          ...selectedSession,
          items: selectedSession.items.filter(it => it.id !== itemId)
        });
      }
    } catch (err: any) {
      toast.error('Satır silinemedi.');
    }
  };

  // Update item in local state after photo or edit
  const handleItemUpdated = (updatedItem: ThermalInspectionItem) => {
    if (selectedSession && selectedSession.items) {
      const idx = selectedSession.items.findIndex(it => it.id === updatedItem.id);
      if (idx !== -1) {
        const nextItems = [...selectedSession.items];
        nextItems[idx] = updatedItem;
        setSelectedSession({ ...selectedSession, items: nextItems });
      } else {
        setSelectedSession({
          ...selectedSession,
          items: [updatedItem, ...selectedSession.items]
        });
      }
    }
  };

  // Filtered Items
  const filteredItems = (selectedSession?.items || []).filter(item => {
    if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
    if (priorityFilter !== 'ALL' && item.priority !== priorityFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        item.panelName.toLowerCase().includes(q) ||
        (item.buildingLocation && item.buildingLocation.toLowerCase().includes(q)) ||
        (item.floorSection && item.floorSection.toLowerCase().includes(q)) ||
        (item.measurementPoint && item.measurementPoint.toLowerCase().includes(q)) ||
        (item.detectedRisk && item.detectedRisk.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Action Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg text-white shadow-sm">
            <Camera className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Termal Kamera İle Elektrik Pano Kontrolü
              {selectedSession && (
                <Badge
                  className={
                    selectedSession.status === 'TAMAMLANDI'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-500 text-white'
                  }
                >
                  {selectedSession.status === 'TAMAMLANDI' ? 'Ölçümler Tamamlandı' : 'Devam Ediyor'}
                </Badge>
              )}
            </h2>
            <p className="text-xs text-slate-500">
              Excelden toplu aktarım yapabilir, elle yeni pano ölçümleri ekleyebilir ve pano başına 5 adede kadar termal fotoğraf yükleyebilirsiniz.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Hızlı Tesis Seçici (Yönetici veya 'all' modunda tesis seçmek için) */}
          {dashboardData?.facilities && dashboardData.facilities.length > 0 && (
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="text-[11px] font-medium text-slate-500 px-1">Tesis:</span>
              <select
                value={activeFacilityId}
                onChange={(e) => {
                  const val = e.target.value;
                  if (onFacilityChange) {
                    onFacilityChange(val);
                  }
                  fetchData(undefined, val);
                }}
                className="h-7 text-xs font-semibold px-2 rounded border-0 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">Tüm Tesisler (Özet)</option>
                {dashboardData.facilities.map((fac) => (
                  <option key={fac.id} value={fac.id}>
                    {fac.name} {fac.itemCount > 0 ? `(${fac.itemCount} Pano)` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
          {/* Oturum Seçici (Tesisin birden fazla formu varsa) */}
          {activeFacilityId !== 'all' && sessions.filter(s => normalizeId(s.facilityId) === normalizeId(activeFacilityId)).length > 1 && (
            <select
              value={selectedSession?.id || ''}
              onChange={(e) => handleSelectSession(e.target.value)}
              className="h-8 text-xs px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium"
            >
              {sessions.filter(s => normalizeId(s.facilityId) === normalizeId(activeFacilityId)).map((s, idx) => (
                <option key={s.id} value={s.id}>
                  Form #{idx + 1} ({s._count?.items || 0} Pano - {s.status === 'TAMAMLANDI' ? 'Tamamlandı' : 'Devam Ediyor'})
                </option>
              ))}
            </select>
          )}

          {/* View Toggle: Dashboard vs Form */}
          <Button
            variant={viewMode === 'DASHBOARD' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('DASHBOARD')}
            className={`text-xs gap-1.5 ${viewMode === 'DASHBOARD' ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : ''}`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Yönetici Takip Ekranı
          </Button>

          {selectedSession && (
            <Button
              variant={viewMode === 'SESSION_DETAIL' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('SESSION_DETAIL')}
              className={`text-xs gap-1.5 ${viewMode === 'SESSION_DETAIL' ? 'bg-indigo-600 text-white' : ''}`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Aktif Ölçüm Tablosu ({selectedSession.items?.length || 0})
            </Button>
          )}

          {/* Hidden Excel Input */}
          <input
            type="file"
            ref={excelInputRef}
            onChange={handleExcelUpload}
            accept=".xlsx, .xls"
            className="hidden"
          />

          {/* Excel Import Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              excelInputRef.current?.click();
            }}
            disabled={isUploadingExcel}
            className="text-xs gap-1.5 border-indigo-200 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100 dark:border-indigo-900 dark:text-indigo-400 dark:bg-indigo-950/20"
          >
            <Upload className="w-3.5 h-3.5" />
            {isUploadingExcel ? 'Aktarılıyor...' : 'Excelden Yükle'}
          </Button>

          {/* Manual Add Button */}
          {selectedSession ? (
            <Button
              size="sm"
              onClick={() => {
                setFormItem(null);
                setModalSessionId(selectedSession.id);
                setIsFormModalOpen(true);
              }}
              className="text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Elle Pano Ölçümü Ekle
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleCreateManualSession}
              className="text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Yeni Form Başlat
            </Button>
          )}
        </div>
      </div>

      {/* VIEW: EXECUTIVE DASHBOARD */}
      {viewMode === 'DASHBOARD' && (
        <ThermalExecutiveDashboard
          data={dashboardData}
          loading={dashboardLoading}
          onSelectFacility={(facId) => {
            if (onFacilityChange) {
              onFacilityChange(facId);
            }
          }}
          onRefresh={fetchData}
        />
      )}

      {/* VIEW: SESSION DETAIL & MEASUREMENTS TABLE */}
      {viewMode === 'SESSION_DETAIL' && (
        <div className="space-y-4">
          {/* Status & Complete Verification Bar */}
          {selectedSession ? (
            <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors ${
              selectedSession.status === 'TAMAMLANDI'
                ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                : 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${
                  selectedSession.status === 'TAMAMLANDI'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-amber-500 text-white'
                }`}>
                  {selectedSession.status === 'TAMAMLANDI' ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Clock className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                    {selectedSession.status === 'TAMAMLANDI'
                      ? 'Bu Tesis İçin Termal Ölçümler Tamamlandı'
                      : 'Ölçüm ve Görsel Yüklemeleri Devam Ediyor'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedSession.status === 'TAMAMLANDI'
                      ? `${selectedSession.completedBy || 'Yetkili'} tarafından onaylandı. Tüm kayıtlar denetim raporuna hazırdır.`
                      : 'Excel veya elle girilen pano kayıtlarına fotoğraf ekledikten sonra alttaki butondan tamamlandı onayı verebilirsiniz.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  onClick={handleToggleStatus}
                  className={`gap-1.5 shadow font-medium text-xs ${
                    selectedSession.status === 'TAMAMLANDI'
                      ? 'bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  {selectedSession.status === 'TAMAMLANDI'
                    ? 'Tekrar "Devam Ediyor"a Al'
                    : 'Ölçümler Tamamlandı Olarak İşaretle'}
                </Button>
              </div>
            </div>
          ) : (
            <Card className="p-10 text-center border-dashed">
              <Camera className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-700 dark:text-slate-300">Bu Tesis İçin Henüz Form Bulunmuyor</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                Yukarıdaki "Excelden Yükle" butonuyla hazır şablonu yükleyebilir veya "Yeni Form Başlat" butonuyla elle ölçüm girmeye başlayabilirsiniz.
              </p>
              <div className="flex justify-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => excelInputRef.current?.click()}
                  className="gap-1.5 text-xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Excelden Aktar
                </Button>
                <Button
                  size="sm"
                  onClick={handleCreateManualSession}
                  className="gap-1.5 text-xs bg-indigo-600 text-white"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Yeni Form Aç
                </Button>
              </div>
            </Card>
          )}

          {/* Measurements Table Card */}
          {selectedSession && (
            <Card className="border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-4 border-b dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-sm text-slate-900 dark:text-white">
                    Pano Ölçüm Listesi ({filteredItems.length} Pano)
                  </h4>
                  {selectedSession.reportDate && (
                    <Badge variant="outline" className="text-xs font-normal">
                      Rapor Tarihi: {format(new Date(selectedSession.reportDate), 'dd.MM.yyyy')}
                    </Badge>
                  )}
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative w-48">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                    <Input
                      placeholder="Pano veya konum ara..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-8 text-xs h-8"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-8 text-xs px-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    <option value="ALL">Tüm Durumlar</option>
                    <option value="Normal">Normal</option>
                    <option value="Takip">Takip</option>
                    <option value="Dikkat">Dikkat</option>
                    <option value="Uygunsuz">Uygunsuz</option>
                    <option value="Kritik">Kritik</option>
                    <option value="Acil">Acil</option>
                  </select>

                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="h-8 text-xs px-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    <option value="ALL">Tüm Öncelikler</option>
                    <option value="Düşük">Düşük</option>
                    <option value="Orta">Orta</option>
                    <option value="Yüksek">Yüksek</option>
                    <option value="Acil">Acil</option>
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-semibold text-[11px] border-b dark:border-slate-800">
                    <tr>
                      <th className="px-3 py-2.5 w-12 text-center">No</th>
                      <th className="px-3 py-2.5">Pano No / Adı</th>
                      <th className="px-3 py-2.5">Kat / Blok</th>
                      <th className="px-3 py-2.5">Konum / Mahal</th>
                      <th className="px-3 py-2.5 text-right">Ölçülen (°C)</th>
                      <th className="px-3 py-2.5 text-right">Ortam (°C)</th>
                      <th className="px-3 py-2.5 text-center">ΔT (Fark)</th>
                      <th className="px-3 py-2.5 text-center">Durum</th>
                      <th className="px-3 py-2.5 text-center">Öncelik</th>
                      <th className="px-3 py-2.5 text-center">Fotoğraflar</th>
                      <th className="px-3 py-2.5 text-right">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-slate-800">
                    {filteredItems.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="px-4 py-8 text-center text-slate-400">
                          Kayıtlı pano ölçümü bulunamadı.
                        </td>
                      </tr>
                    ) : (
                      filteredItems.map((item) => {
                        const hasDelta = item.deltaTemp != null;
                        const isHighDelta = hasDelta && item.deltaTemp! >= 15;
                        const isMediumDelta = hasDelta && item.deltaTemp! >= 8 && item.deltaTemp! < 15;
                        const photoCount = (item.photoUrls || []).length;

                        return (
                          <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="px-3 py-2.5 text-center font-mono text-slate-400">
                              {item.orderIndex}
                            </td>
                            <td className="px-3 py-2.5">
                              <span className="font-semibold text-slate-900 dark:text-white">
                                {item.panelName}
                              </span>
                              {item.equipmentConnection && (
                                <div className="text-[11px] text-slate-400">{item.equipmentConnection}</div>
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-slate-700 dark:text-slate-300 font-medium">
                              {item.buildingLocation || '-'}
                            </td>
                            <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400">
                              <div>{item.floorSection || item.measurementPoint || '-'}</div>
                              {item.measurementPoint && item.floorSection && item.measurementPoint !== item.floorSection && (
                                <div className="text-[11px] text-slate-400">{item.measurementPoint}</div>
                              )}
                              {item.controlTime && (
                                <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                  <Clock className="w-3 h-3 text-slate-400 inline" />
                                  {item.controlTime}
                                </div>
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-right font-mono font-medium text-slate-900 dark:text-white">
                              {item.measuredTemp != null ? `${item.measuredTemp}°C` : '-'}
                            </td>
                            <td className="px-3 py-2.5 text-right font-mono text-slate-500">
                              {item.ambientTemp != null ? `${item.ambientTemp}°C` : '-'}
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              {hasDelta ? (
                                <Badge
                                  variant="outline"
                                  className={`font-mono text-[11px] ${
                                    isHighDelta
                                      ? 'border-red-500 text-red-600 bg-red-50 dark:bg-red-950/30'
                                      : isMediumDelta
                                      ? 'border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950/30'
                                      : 'border-slate-300 text-slate-600'
                                  }`}
                                >
                                  +{item.deltaTemp}°C
                                </Badge>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <Badge
                                variant={
                                  (item.status === 'Kritik' || item.status === 'Acil' || item.status === 'Uygunsuz')
                                    ? 'destructive'
                                    : (item.status === 'Dikkat' || item.status === 'Takip')
                                    ? 'outline'
                                    : 'secondary'
                                }
                                className={`text-[10px] ${
                                  item.status === 'Dikkat'
                                    ? 'border-amber-400 text-amber-700 bg-amber-50'
                                    : item.status === 'Takip'
                                    ? 'border-sky-400 text-sky-700 bg-sky-50 dark:bg-sky-950/30'
                                    : item.status === 'Uygunsuz'
                                    ? 'border-orange-500 text-white bg-orange-600'
                                    : ''
                                }`}
                              >
                                {item.status || 'Normal'}
                              </Badge>
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <span
                                className={`text-[11px] font-medium ${
                                  item.priority === 'Acil'
                                    ? 'text-red-600'
                                    : item.priority === 'Yüksek'
                                    ? 'text-amber-600'
                                    : 'text-slate-500'
                                }`}
                              >
                                {item.priority || 'Düşük'}
                              </span>
                            </td>
                            {/* Photo upload / preview button */}
                            <td className="px-3 py-2.5 text-center">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setPhotoItem(item);
                                  setIsPhotoModalOpen(true);
                                }}
                                className={`h-7 px-2 text-xs gap-1 ${
                                  photoCount > 0
                                    ? 'border-indigo-300 text-indigo-700 bg-indigo-50/60 dark:bg-indigo-950/30'
                                    : 'border-slate-200 text-slate-500'
                                }`}
                              >
                                <Camera className="w-3.5 h-3.5" />
                                <span>{photoCount}/5</span>
                              </Button>
                            </td>
                            {/* Edit / Delete actions */}
                            <td className="px-3 py-2.5 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-slate-500 hover:text-slate-900"
                                  onClick={() => {
                                    setFormItem(item);
                                    setModalSessionId(item.sessionId || selectedSession?.id || null);
                                    setIsFormModalOpen(true);
                                  }}
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                                  onClick={() => handleDeleteItem(item.id)}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Photo Modal */}
      {isPhotoModalOpen && (
        <ThermalPhotoModal
          isOpen={isPhotoModalOpen}
          onClose={() => setIsPhotoModalOpen(false)}
          item={photoItem}
          facilityId={activeFacilityId !== 'all' ? activeFacilityId : (selectedSession?.facilityId || '')}
          onPhotosUpdated={(updated) => {
            setPhotoItem(updated);
            handleItemUpdated(updated);
          }}
        />
      )}

      {/* Manual Item Add / Edit Form Modal */}
      {isFormModalOpen && (modalSessionId || selectedSession?.id) && (
        <ThermalItemFormModal
          isOpen={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          sessionId={modalSessionId || selectedSession!.id}
          item={formItem}
          onSaved={(saved) => {
            handleItemUpdated(saved);
          }}
        />
      )}
    </div>
  );
};
