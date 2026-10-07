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
import { ThermalDateCardsView } from '@/pages/operations/thermal-camera/ThermalDateCardsView';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';

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

  // Sub-view: 'DATE_CARDS' | 'SESSION_DETAIL' | 'EXECUTIVE'
  const [viewMode, setViewMode] = useState<'DATE_CARDS' | 'SESSION_DETAIL' | 'EXECUTIVE'>('DATE_CARDS');

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
            // If the session facility differs from current active facility, inform parent
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
          // If existing selectedSession belongs to this facility and has items, keep it
          setSelectedSession(prev => {
            if (prev && normalizeId(prev.facilityId) === curFacNormalized && prev.items && prev.items.length > 0) {
              return prev;
            }
            return null;
          });
          setViewMode('SESSION_DETAIL');
        }
      } else {
        // 'all' facilities — if we have a selected session with items, keep it, otherwise show dashboard
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
      pendingPreferredSessionIdRef.current = detail.id;
      setSelectedSession(detail);
      setViewMode('SESSION_DETAIL');
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

      const uploadedSession = res?.session;
      if (uploadedSession?.id) {
        // Reset table filters so all uploaded rows are immediately visible
        setSearch('');
        setStatusFilter('ALL');
        setPriorityFilter('ALL');

        // Store preferred session ID
        pendingPreferredSessionIdRef.current = uploadedSession.id;

        // Set session and lock directly into detail view
        setSelectedSession(uploadedSession);
        setViewMode('SESSION_DETAIL');

        // Sync facility with parent if needed
        const uploadedFacId = uploadedSession.facilityId || targetFacility;
        if (onFacilityChange && normalizeId(uploadedFacId) !== normalizeId(activeFacilityId)) {
          onFacilityChange(uploadedFacId);
        }

        // Refresh stats and session list in background
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
    // If a session is already selected, open the modal for it immediately!
    if (selectedSession && selectedSession.id) {
      setFormItem(null);
      setModalSessionId(selectedSession.id);
      setIsFormModalOpen(true);
      return;
    }

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
      toast.error('Lütfen önce bir tesis seçiniz.');
      return;
    }

    // Check if an existing session for this facility already exists in sessions state
    const curFacNormalized = normalizeId(targetFacility);
    const existing = sessions.find(s => normalizeId(s.facilityId) === curFacNormalized);
    if (existing) {
      pendingPreferredSessionIdRef.current = existing.id;
      setModalSessionId(existing.id);
      setFormItem(null);
      setIsFormModalOpen(true);
      setViewMode('SESSION_DETAIL');
      // Load full session detail
      thermalInspectionService.getSessionDetail(existing.id).then(det => {
        if (det) setSelectedSession(det);
      }).catch(() => {});
      if (targetFacility !== activeFacilityId && onFacilityChange) {
        onFacilityChange(targetFacility);
      }
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

  // Delete session
  const handleDeleteSession = async (sessionId: string) => {
    try {
      setLoading(true);
      await thermalInspectionService.deleteSession(sessionId);
      toast.success('Termal kontrol oturumu silindi.');
      if (selectedSession?.id === sessionId) {
        setSelectedSession(null);
        setViewMode('DATE_CARDS');
      }
      fetchData();
    } catch (err: any) {
      toast.error('Oturum silinemedi: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
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
      {/* 1. VIEW: DATE CARDS VIEW */}
      {viewMode === 'DATE_CARDS' && (
        <ThermalDateCardsView
          sessions={sessions}
          activeFacilityName={activeFacilityDisplayName}
          onSelectSession={handleSelectSession}
          onUploadExcelClick={() => excelInputRef.current?.click()}
          onNewSessionClick={handleCreateManualSession}
          onCleanupEmptyClick={handleCleanupEmpty}
          onViewExecutiveDashboard={() => setViewMode('EXECUTIVE')}
          onDeleteSession={handleDeleteSession}
          isLoading={loading}
        />
      )}

      {/* 2. VIEW: DYNAMIC SESSION DETAIL & MEASUREMENTS TABLE */}
      {viewMode === 'SESSION_DETAIL' && selectedSession && (
        <ThermalOriginalDashboard
          session={selectedSession}
          onBack={() => setViewMode('DATE_CARDS')}
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
          onDeleteSession={() => handleDeleteSession(selectedSession.id)}
        />
      )}

      {/* 3. VIEW: EXECUTIVE DASHBOARD */}
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
