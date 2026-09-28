import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  FileSpreadsheet, Upload, Plus, CheckCircle2, Clock,
  Camera, Trash2, Edit2, Search, Filter, AlertTriangle,
  ChevronDown, RefreshCw, BarChart3, ArrowLeft, Download, ShieldCheck,
  Calendar
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
import { ThermalOriginalDashboard } from './ThermalOriginalDashboard';
import { ThermalDateCardsView } from './ThermalDateCardsView';
import { ThermalWatchlistView } from './ThermalWatchlistView';
import { ThermalPanelDetailPage } from './ThermalPanelDetailPage';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '@/context/AuthContext';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function ThermalCameraPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isAdminOrMgmt = user?.roles?.includes('admin') || user?.roles?.includes('management') || user?.isAdmin || user?.isManagement;

  // Read initial states from URL query parameters (URL takibi & hatırlama)
  const urlFacility = searchParams.get('facilityId');
  const urlSession = searchParams.get('sessionId');
  const urlView = searchParams.get('view');

  const [activeFacilityId, setActiveFacilityId] = useState<string>(() => {
    if (urlFacility && urlFacility !== 'all') return urlFacility;
    const saved = localStorage.getItem('activeFacilityId');
    if (saved && saved !== 'all') return saved;
    const isStandard = user && !isAdminOrMgmt;
    if (isStandard && user.facilities && user.facilities.length > 0) {
      return user.facilities[0];
    }
    return saved || 'all';
  });

  const onFacilityChange = (facId: string) => {
    setActiveFacilityId(facId);
    localStorage.setItem('activeFacilityId', facId);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (facId && facId !== 'all') next.set('facilityId', facId);
      else next.delete('facilityId');
      return next;
    });
  };
  const [sessions, setSessions] = useState<ThermalInspectionSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ThermalInspectionSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState<ThermalDashboardResponse | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  // Sub-view: 'DATE_CARDS' | 'SESSION_DETAIL' | 'EXECUTIVE' | 'WATCHLIST' | 'PANEL_DETAIL'
  const [selectedPanelName, setSelectedPanelName] = useState<string | null>(searchParams.get('panelName'));
  const [viewMode, setViewModeState] = useState<'DATE_CARDS' | 'SESSION_DETAIL' | 'EXECUTIVE' | 'WATCHLIST' | 'PANEL_DETAIL'>(() => {
    if (searchParams.get('panelName')) return 'PANEL_DETAIL';
    if (urlView === 'watchlist') return 'WATCHLIST';
    if (urlView === 'executive') return 'EXECUTIVE';
    if (urlSession || urlView === 'detail') return 'SESSION_DETAIL';
    return 'DATE_CARDS';
  });

  const setViewMode = (mode: 'DATE_CARDS' | 'SESSION_DETAIL' | 'EXECUTIVE' | 'WATCHLIST' | 'PANEL_DETAIL', panel?: string) => {
    setViewModeState(mode);
    if (panel) setSelectedPanelName(panel);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (mode === 'DATE_CARDS') {
        next.delete('view');
        next.delete('panelName');
      } else if (mode === 'WATCHLIST') {
        next.set('view', 'watchlist');
        next.delete('panelName');
      } else if (mode === 'EXECUTIVE') {
        next.set('view', 'executive');
        next.delete('panelName');
      } else if (mode === 'SESSION_DETAIL') {
        next.set('view', 'detail');
        next.delete('panelName');
      } else if (mode === 'PANEL_DETAIL') {
        next.set('view', 'panel_detail');
        if (panel) next.set('panelName', panel);
      }
      return next;
    });
  };

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
            if (detail.facilityId && onFacilityChange && normalizeId(detail.facilityId) !== normalizeId(currentFacId)) {
              onFacilityChange(detail.facilityId);
            }
            return;
          }
        } catch (e) {
          console.error('Failed to load preferred session detail', e);
        }
        pendingPreferredSessionIdRef.current = null;
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
      pendingPreferredSessionIdRef.current = detail.id;
      setSelectedSession(detail);
      setViewMode('SESSION_DETAIL');
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        next.set('sessionId', detail.id);
        next.set('view', 'detail');
        return next;
      });
      if (detail.facilityId && onFacilityChange && normalizeId(detail.facilityId) !== normalizeId(activeFacilityId)) {
        onFacilityChange(detail.facilityId);
      }
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
      toast.error('Lütfen Excel yüklemesi yapmadan önce bir tesis seçiniz.');
      if (excelInputRef.current) excelInputRef.current.value = '';
      return;
    }

    setIsUploadingExcel(true);
    try {
      const res = await thermalInspectionService.importExcel(targetFacility, file);
      toast.success(res?.message || 'Excel başarıyla aktarıldı.');

      let uploadedSession = res?.session;
      if (uploadedSession?.id) {
        try {
          const fullSession = await thermalInspectionService.getSessionDetail(uploadedSession.id);
          if (fullSession && fullSession.id) {
            uploadedSession = fullSession;
          }
        } catch (e) {
          console.warn('Could not re-fetch session detail:', e);
        }

        setSearch('');
        setStatusFilter('ALL');
        setPriorityFilter('ALL');

        pendingPreferredSessionIdRef.current = uploadedSession.id;
        setSelectedSession(uploadedSession);
        setViewMode('SESSION_DETAIL');

        const uploadedFacId = uploadedSession.facilityId || targetFacility;
        if (onFacilityChange && normalizeId(uploadedFacId) !== normalizeId(activeFacilityId)) {
          onFacilityChange(uploadedFacId);
        }

        thermalInspectionService.getDashboardStats().then(d => { if (d) setDashboardData(d); }).catch(() => {});
        thermalInspectionService.getSessions(uploadedFacId).then(s => { if (Array.isArray(s)) setSessions(s); }).catch(() => {});
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
    if (selectedSession && selectedSession.id && viewMode === 'SESSION_DETAIL') {
      setFormItem(null);
      setModalSessionId(selectedSession.id);
      setIsFormModalOpen(true);
      return;
    }

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
      pendingPreferredSessionIdRef.current = session.id;
      setSelectedSession(sessionWithItems);
      setModalSessionId(session.id);
      setViewMode('SESSION_DETAIL');
      setFormItem(null);
      setIsFormModalOpen(true);
      if (targetFacility !== activeFacilityId && onFacilityChange) {
        onFacilityChange(targetFacility);
      }
      toast.success('Yeni termal ölçüm formu başlatıldı. Şimdi pano kaydınızı ekleyebilirsiniz.');
      fetchData(session.id, targetFacility);
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
    setSelectedSession(prev => {
      if (!prev) return prev;
      const currentItems = prev.items || [];
      const idx = currentItems.findIndex(it => it.id === updatedItem.id);
      if (idx !== -1) {
        const nextItems = [...currentItems];
        nextItems[idx] = updatedItem;
        return { ...prev, items: nextItems };
      } else {
        return {
          ...prev,
          items: [updatedItem, ...currentItems]
        };
      }
    });
  };

  // Cleanup completely empty / meaningless rows
  const handleCleanupEmpty = async () => {
    const isTargetingSession = viewMode === 'SESSION_DETAIL' && selectedSession;
    const confirmMsg = isTargetingSession
      ? 'Bu denetim oturumundaki tüm boş ve verisiz satırlar silinecektir. Onaylıyor musunuz?'
      : 'Sistemdeki (veya seçili tesisteki) verisiz ve boş satırlar taranıp silinecektir. Onaylıyor musunuz?';

    if (!confirm(confirmMsg)) return;

    setLoading(true);
    try {
      const res = await thermalInspectionService.cleanupEmptyItems(
        activeFacilityId,
        isTargetingSession ? selectedSession?.id : undefined
      );
      toast.success(res.message || 'Boş satırlar başarıyla temizlendi.');

      // Refresh data
      if (isTargetingSession && selectedSession) {
        handleSelectSession(selectedSession.id);
      }
      fetchData(selectedSession?.id);
    } catch (err: any) {
      toast.error(err.message || 'Boş satırlar temizlenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const activeFacilityObj = dashboardData?.facilities?.find(f => normalizeId(f.id) === normalizeId(activeFacilityId));
  const activeFacilityDisplayName = activeFacilityObj ? activeFacilityObj.name : (activeFacilityId === 'all' ? 'Tüm Tesisler' : 'Seçili Tesis');

  return (
    <div className="space-y-6">
      {/* Hidden Excel Input */}
      <input
        type="file"
        ref={excelInputRef}
        onChange={handleExcelUpload}
        accept=".xlsx, .xls"
        className="hidden"
      />

      {/* 1. VIEW: DATE CARDS VIEW (Clean view without redundant header) */}
      {viewMode === 'DATE_CARDS' && (
        <ThermalDateCardsView
          sessions={sessions}
          activeFacilityName={activeFacilityDisplayName}
          onSelectSession={handleSelectSession}
          onUploadExcelClick={() => excelInputRef.current?.click()}
          onNewSessionClick={handleCreateManualSession}
          onCleanupEmptyClick={handleCleanupEmpty}
          onViewExecutiveDashboard={isAdminOrMgmt ? () => setViewMode('EXECUTIVE') : undefined}
          onViewWatchlist={() => setViewMode('WATCHLIST')}
          isLoading={loading}
        />
      )}

      {/* 2. VIEW: DYNAMIC SESSION DETAIL & MEASUREMENTS TABLE */}
      {viewMode === 'SESSION_DETAIL' && selectedSession && (
        <ThermalOriginalDashboard
          session={selectedSession}
          onBack={() => {
            setViewMode('DATE_CARDS');
            setSearchParams(prev => {
              const next = new URLSearchParams(prev);
              next.delete('sessionId');
              next.delete('view');
              return next;
            });
          }}
          onAddPhoto={(it) => {
            setPhotoItem(it);
            setIsPhotoModalOpen(true);
          }}
          onEditItem={(it) => {
            setFormItem(it);
            setModalSessionId(selectedSession.id);
            setIsFormModalOpen(true);
          }}
          onDeleteItem={handleDeleteItem}
          onItemUpdated={handleItemUpdated}
          onOpenPanelDetail={(panel) => setViewMode('PANEL_DETAIL', panel)}
          onCleanupEmptyClick={handleCleanupEmpty}
        />
      )}

      {/* 3. VIEW: SIKI TAKİPTEKİ PANOLAR & TERMİN MERKEZİ (WATCHLIST) */}
      {viewMode === 'WATCHLIST' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-800">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('DATE_CARDS')}
              className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold gap-1.5 h-8"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Kontrol Tarihlerine Dön
            </Button>
          </div>
          <ThermalWatchlistView
            facilityId={activeFacilityId !== 'all' ? activeFacilityId : undefined}
            facilityName={activeFacilityDisplayName}
            onSelectSession={handleSelectSession}
            onInspectItem={(item) => {
              setPhotoItem(item);
              setIsPhotoModalOpen(true);
            }}
            onOpenPanelDetail={(panel) => setViewMode('PANEL_DETAIL', panel)}
          />
        </div>
      )}

      {/* 4. VIEW: TEKİL PANO DETAY & GEÇMİŞ DENETİM VE ISI HARİTASI (PANEL_DETAIL) */}
      {viewMode === 'PANEL_DETAIL' && selectedPanelName && (
        <ThermalPanelDetailPage
          panelName={selectedPanelName}
          facilityId={activeFacilityId !== 'all' ? activeFacilityId : undefined}
          facilityName={activeFacilityDisplayName}
          onBack={() => setViewMode('DATE_CARDS')}
        />
      )}

      {/* 5. VIEW: EXECUTIVE DASHBOARD */}
      {viewMode === 'EXECUTIVE' && (
        <ThermalExecutiveDashboard
          data={dashboardData}
          loading={dashboardLoading}
          onSelectFacility={(facId) => {
            setViewMode('DATE_CARDS');
            if (onFacilityChange) {
              onFacilityChange(facId);
            }
            fetchData(undefined, facId);
          }}
          onRefresh={fetchData}
        />
      )}

      {viewMode === 'SESSION_DETAIL' && !selectedSession && (
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
