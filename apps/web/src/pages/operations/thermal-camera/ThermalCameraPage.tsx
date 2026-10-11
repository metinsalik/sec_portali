import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Thermometer, FileSpreadsheet, Plus, Settings, 
  Layers, ArrowLeft, RefreshCw, BarChart3, Clock, 
  ShieldAlert, AlertTriangle, Menu, X, PanelLeftClose, PanelLeftOpen,
  Building2, Sliders, Upload, User, LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { 
  thermalInspectionService, 
  type ThermalInspectionSession, 
  type ThermalInspectionItem 
} from '@/services/thermal-inspection.service';
import { ThermalCleanDashboard } from './ThermalCleanDashboard';
import { ThermalPaginatedTable } from './ThermalPaginatedTable';
import { ThermalPanelsInventoryView } from './ThermalPanelsInventoryView';
import { ThermalPanelDetailPage } from './ThermalPanelDetailPage';
import { ThermalNewReportModal } from './ThermalNewReportModal';
import { ThermalExcelImportModal } from './ThermalExcelImportModal';
import { ThermalQuickEntryModal } from './ThermalQuickEntryModal';
import { ThermalSettingsModal } from './ThermalSettingsModal';
import { ThermalItemDetailModal } from './ThermalItemDetailModal';
import { ThermalItemFormModal } from './ThermalItemFormModal';
import { ThermalActionModal } from './ThermalActionModal';
import { ThermalMergePanelsModal } from './ThermalMergePanelsModal';
import { ThermalBulkDeleteReportsModal } from './ThermalBulkDeleteReportsModal';
import { ThermalSettingsView } from './ThermalSettingsView';
import { toast } from 'sonner';

const API = import.meta.env.VITE_API_URL || '';

export default function ThermalCameraPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const isAdminOrMgmt = !!(
    user?.isAdmin || 
    user?.isManagement || 
    user?.roles?.includes('admin') || 
    user?.roles?.includes('management')
  );

  // Active Tab: 'dashboard' | 'table' | 'panels' | 'settings'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'table' | 'panels' | 'settings'>(
    (searchParams.get('tab') as any) || 'dashboard'
  );

  // Selected Panel for Deep History & Trend Line Chart
  const [selectedPanelName, setSelectedPanelName] = useState<string | null>(
    searchParams.get('panel') || null
  );

  // Facilities & Active Facility
  const [facilities, setFacilities] = useState<Array<{ id: string; name: string }>>([]);
  const [activeFacilityId, setActiveFacilityId] = useState<string>(() => {
    const urlFac = searchParams.get('facilityId');
    if (urlFac && urlFac !== 'all') return urlFac;
    const saved = localStorage.getItem('activeFacilityId');
    if (saved && saved !== 'all') return saved;
    return 'all';
  });

  // Data State
  const [sessions, setSessions] = useState<ThermalInspectionSession[]>([]);
  const [allItems, setAllItems] = useState<ThermalInspectionItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals State
  const [showNewReportModal, setShowNewReportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importTargetSessionId, setImportTargetSessionId] = useState<string | undefined>(undefined);
  const [showQuickEntryModal, setShowQuickEntryModal] = useState(false);
  const [quickEntrySessionId, setQuickEntrySessionId] = useState<string | undefined>(undefined);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ThermalInspectionItem | null>(null);
  const [viewingItem, setViewingItem] = useState<ThermalInspectionItem | null>(null);
  const [actionItem, setActionItem] = useState<ThermalInspectionItem | null>(null);

  // All Unique Panel Names (for merging and dropdowns)
  const uniquePanelNames = useMemo(() => {
    const set = new Set<string>();
    allItems.forEach(i => {
      if (i.panelName) set.add(i.panelName.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [allItems]);

  // Sidebar Layout
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Fetch Facilities
  useEffect(() => {
    fetchFacilities();
  }, []);

  const fetchFacilities = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/settings/facilities`, {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      const data = await res.json();
      const facs = Array.isArray(data) ? data : (data.facilities || data.data || []);
      setFacilities(facs.filter((f: any) => f.isActive !== false));

      if (activeFacilityId === 'all' && facs.length > 0 && !isAdminOrMgmt) {
        setActiveFacilityId(facs[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch Sessions and Items
  useEffect(() => {
    fetchThermalData();
  }, [activeFacilityId]);

  const fetchThermalData = async () => {
    try {
      setLoading(true);
      const rawSessions = await thermalInspectionService.getSessions(
        activeFacilityId !== 'all' ? activeFacilityId : undefined
      );
      const sessList = Array.isArray(rawSessions) ? rawSessions : [];
      setSessions(sessList);

      // Detail items fetch
      let aggregatedItems: ThermalInspectionItem[] = [];
      const details = await Promise.all(
        sessList.map(s => thermalInspectionService.getSessionDetail(s.id).catch(() => null))
      );

      details.forEach(d => {
        if (d && d.items) {
          aggregatedItems = [...aggregatedItems, ...d.items];
        }
      });

      setAllItems(aggregatedItems);
    } catch (err) {
      console.error(err);
      toast.error('Termal ölçüm verileri yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  const currentFacilityName = facilities.find(f => f.id === activeFacilityId)?.name || 'Tüm Tesisler';

  const handleFacilityChange = (facId: string) => {
    setActiveFacilityId(facId);
    localStorage.setItem('activeFacilityId', facId);
    setSelectedPanelName(null);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (facId !== 'all') next.set('facilityId', facId);
      else next.delete('facilityId');
      next.delete('panel');
      return next;
    });
  };

  const handleTabChange = (tab: 'dashboard' | 'table' | 'panels' | 'settings') => {
    setActiveTab(tab);
    setSelectedPanelName(null);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('tab', tab);
      next.delete('panel');
      return next;
    });
  };

  const handleOpenPanelDetail = (panelName: string) => {
    setSelectedPanelName(panelName);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('panel', panelName);
      return next;
    });
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!window.confirm('Bu pano ölçüm kaydını silmek istediğinize emin misiniz?')) return;
    try {
      await thermalInspectionService.deleteItem(itemId);
      toast.success('Kayıt silindi.');
      setAllItems(prev => prev.filter(i => i.id !== itemId));
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Silinemedi.');
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await thermalInspectionService.deleteSession(sessionId);
      toast.success('Rapor ve bağlı ölçüm kayıtları silindi.');
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      setAllItems(prev => prev.filter(i => i.sessionId !== sessionId));
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Rapor silinemedi.');
    }
  };

  const handleBulkDeleteSessions = async (sessionIds: string[]) => {
    try {
      const res = await thermalInspectionService.deleteSessionsBulk(sessionIds);
      toast.success(res.message || `${sessionIds.length} adet rapor silindi.`);
      setSessions(prev => prev.filter(s => !sessionIds.includes(s.id)));
      setAllItems(prev => prev.filter(i => !sessionIds.includes(i.sessionId)));
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Raporlar toplu silinemedi.');
      throw err;
    }
  };

  // Keep activeTab in sync with URL searchParams (e.g. when clicked from AppLayout sidebar)
  useEffect(() => {
    const tabParam = searchParams.get('tab') as 'dashboard' | 'table' | 'panels' | 'settings' | null;
    if (tabParam && ['dashboard', 'table', 'panels', 'settings'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
    const panelParam = searchParams.get('panel');
    setSelectedPanelName(panelParam || null);
  }, [searchParams]);

  return (
    <div className="space-y-6">
      {/* ─────────────────────────────────────────────────────────── */}
      {/* TOP ACTION BAR & STATS HEADER (Tekil, Temiz ve Entegre)     */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              {activeTab === 'dashboard' ? 'Termal Kamera & Pano Kontrol Özeti' :
               activeTab === 'table' ? 'Pano Ölçüm Listesi' :
               activeTab === 'panels' ? 'Pano Envanteri ve Ölçüm Döngüleri' :
               'Termal Kamera Modül Ayarları'}
            </h1>
            <Badge variant="outline" className="text-xs font-semibold px-2 border-slate-300">
              {activeTab === 'settings' ? 'Yönetici Paneli' : `${allItems.length} Kayıt`}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {activeTab === 'settings'
              ? 'Bina, blok ve kat konumları, elektrik pano & mahal türleri ve termal risk değerlendirme eşikleri'
              : 'Elektrik panolarının termal kamera ölçümleri, sıcaklık farkları (ΔT) ve periyodik kontrolleri'}
          </p>
        </div>

        {/* Action Buttons & Tab Switchers */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl overflow-x-auto shrink-0">
            <button
              type="button"
              onClick={() => handleTabChange('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'table'
                  ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Thermometer className="w-3.5 h-3.5" />
              Ölçüm Tablosu
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('panels')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'panels'
                  ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Pano Envanteri
            </button>
            {isAdminOrMgmt && (
              <button
                type="button"
                onClick={() => handleTabChange('settings')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'settings'
                    ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                Ayarlar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* MAIN CONTENT AREA                                           */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div>
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-orange-600" />
            <p className="text-xs font-medium">Termal kamera ölçümleri yükleniyor...</p>
          </div>
        ) : selectedPanelName ? (
          /* Panel Deep Detail & Trend Line Chart Page */
          <ThermalPanelDetailPage
            panelName={selectedPanelName}
            facilityId={activeFacilityId !== 'all' ? activeFacilityId : undefined}
            facilityName={currentFacilityName}
            onBack={() => {
              setSelectedPanelName(null);
              setSearchParams(prev => {
                const next = new URLSearchParams(prev);
                next.delete('panel');
                return next;
              });
            }}
          />
        ) : activeTab === 'dashboard' ? (
          /* Clean KPI & Distribution Dashboard */
          <ThermalCleanDashboard
            items={allItems}
            facilityName={currentFacilityName}
            onNavigateToTab={(tab) => handleTabChange(tab)}
            onOpenPanelDetail={handleOpenPanelDetail}
            onTakeAction={(item) => setActionItem(item)}
            onViewItem={(item) => setViewingItem(item)}
          />
        ) : activeTab === 'table' ? (
          /* 50-row Paginated Table with Dropdown Sessions & 3 Actions */
          <ThermalPaginatedTable
            items={allItems}
            sessions={sessions}
            facilityName={currentFacilityName}
            pageSize={50}
            onOpenPanelDetail={handleOpenPanelDetail}
            onEditItem={(item) => setEditingItem(item)}
            onDeleteItem={handleDeleteItem}
            onViewItem={(item) => setViewingItem(item)}
            onOpenNewReportModal={() => setShowNewReportModal(true)}
            onOpenImportModal={(sessId) => {
              setImportTargetSessionId(sessId);
              setShowImportModal(true);
            }}
            onOpenQuickEntryModal={(sessId) => {
              setQuickEntrySessionId(sessId);
              setShowQuickEntryModal(true);
            }}
            onDeleteSession={handleDeleteSession}
            onOpenBulkDeleteSessions={() => setShowBulkDeleteModal(true)}
          />
        ) : activeTab === 'panels' ? (
          /* Panels Inventory and Cycles View */
          <ThermalPanelsInventoryView
            items={allItems}
            onOpenPanelDetail={handleOpenPanelDetail}
            onOpenMergeModal={() => setShowMergeModal(true)}
            activeFacilityId={activeFacilityId !== 'all' ? activeFacilityId : facilities[0]?.id}
            facilities={facilities}
            isAdminOrMgmt={isAdminOrMgmt}
          />
        ) : (
          /* Settings View (Bina, Blok, Kat, Pano Türleri, Termal Eşikler) */
          <ThermalSettingsView
            activeFacilityId={activeFacilityId !== 'all' ? activeFacilityId : facilities[0]?.id}
            facilities={facilities}
            onFacilityChange={handleFacilityChange}
          />
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* MODALS                                                      */}
      {/* ─────────────────────────────────────────────────────────── */}
      {showNewReportModal && (
        <ThermalNewReportModal
          facilities={facilities}
          activeFacilityId={activeFacilityId}
          isAdminOrMgmt={isAdminOrMgmt}
          onClose={() => setShowNewReportModal(false)}
          onCreated={(newSession) => {
            setSessions(prev => [newSession, ...prev]);
            setShowNewReportModal(false);
            // İsterse hemen içine aktarım yapsın veya tek tek eklesin
            fetchThermalData();
          }}
        />
      )}

      {showImportModal && (
        <ThermalExcelImportModal
          facilities={facilities}
          activeFacilityId={activeFacilityId}
          isAdminOrMgmt={isAdminOrMgmt}
          sessions={sessions}
          targetSessionId={importTargetSessionId}
          onClose={() => {
            setShowImportModal(false);
            setImportTargetSessionId(undefined);
          }}
          onSuccess={() => {
            fetchThermalData();
          }}
        />
      )}

      {showQuickEntryModal && (
        <ThermalQuickEntryModal
          facilityId={activeFacilityId !== 'all' ? activeFacilityId : (facilities[0]?.id || '')}
          facilityName={currentFacilityName}
          activeSession={sessions.find(s => s.id === quickEntrySessionId) || sessions[0] || null}
          sessions={sessions}
          onSessionCreated={(s) => setSessions(prev => [s, ...prev])}
          onItemAdded={(item) => {
            setAllItems(prev => [item, ...prev]);
            setShowQuickEntryModal(false);
            setQuickEntrySessionId(undefined);
          }}
          onClose={() => {
            setShowQuickEntryModal(false);
            setQuickEntrySessionId(undefined);
          }}
        />
      )}

      {showSettingsModal && (
        <ThermalSettingsModal
          facilityId={activeFacilityId}
          facilityName={currentFacilityName}
          onClose={() => setShowSettingsModal(false)}
          onSaved={() => fetchThermalData()}
        />
      )}

      {viewingItem && (
        <ThermalItemDetailModal
          item={viewingItem}
          facilityId={activeFacilityId !== 'all' ? activeFacilityId : undefined}
          onClose={() => setViewingItem(null)}
          onItemUpdated={(updated) => {
            setAllItems(prev => prev.map(i => i.id === updated.id ? updated : i));
            setViewingItem(updated);
          }}
        />
      )}

      {editingItem && (
        <ThermalItemFormModal
          item={editingItem}
          facilityId={activeFacilityId !== 'all' ? activeFacilityId : editingItem.session?.facilityId}
          onClose={() => setEditingItem(null)}
          onSaved={(saved) => {
            setAllItems(prev => prev.map(i => i.id === saved.id ? saved : i));
            setEditingItem(null);
            toast.success('Pano ölçümü güncellendi.');
          }}
        />
      )}

      {actionItem && (
        <ThermalActionModal
          item={actionItem}
          facilityId={activeFacilityId !== 'all' ? activeFacilityId : undefined}
          onClose={() => setActionItem(null)}
          onSaved={(saved) => {
            setAllItems(prev => prev.map(i => i.id === saved.id ? saved : i));
            setActionItem(null);
          }}
        />
      )}

      {showMergeModal && (
        <ThermalMergePanelsModal
          isOpen={showMergeModal}
          onClose={() => setShowMergeModal(false)}
          allPanelNames={uniquePanelNames}
          facilityId={activeFacilityId !== 'all' ? activeFacilityId : undefined}
          onMerged={() => {
            fetchThermalData();
          }}
        />
      )}

      {showBulkDeleteModal && (
        <ThermalBulkDeleteReportsModal
          isOpen={showBulkDeleteModal}
          onClose={() => setShowBulkDeleteModal(false)}
          sessions={sessions}
          facilityName={currentFacilityName}
          onDeleteSelected={handleBulkDeleteSessions}
        />
      )}
    </div>
  );
}
