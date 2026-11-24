import React, { useEffect } from 'react';
import { useLocation, useNavigate, Routes, Route, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { LayoutDashboard, FileText, Settings, Plus } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { IRSCProvider, useIRSC } from './context/IRSCContext';
import TrackingDashboard from './views/TrackingDashboard';
import AuditLibrary from './views/AuditLibrary';
import LocationConsole from './views/LocationConsole';
import AuditWorkspace from './views/AuditWorkspace';
import RenovationReportSettings from './views/RenovationReportSettings';
import PublishedReportDetailPage from './views/PublishedReportDetailPage';
import FindingPoolPage from './views/FindingPoolPage';
import AuditFindingDetailPage from './views/AuditFindingDetailPage';

function ReportDetailRouteWrapper() {
  const { id } = useParams<{ id: string }>();
  return <PublishedReportDetailPage reportId={id || ''} />;
}

function WorkspaceRouteWrapper({
  isNew = false,
  findingMode = null,
}: {
  isNew?: boolean;
  findingMode?: 'CREATE' | 'VIEW' | 'EDIT' | null;
}) {
  const { id, findingId } = useParams<{ id: string; findingId?: string }>();
  const { setActiveAuditId } = useIRSC();

  useEffect(() => {
    setActiveAuditId(isNew ? null : (id || null));
  }, [id, isNew, setActiveAuditId]);

  return (
    <AuditWorkspace
      routeFindingId={findingId || null}
      routeFindingMode={findingMode}
    />
  );
}

function RenovationReportApp() {
  const { setFacilities } = useIRSC();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isManager = !!(
    user?.isAdmin ||
    user?.isManagement ||
    user?.roles?.includes('admin') ||
    user?.roles?.includes('management') ||
    user?.roles?.includes('safety')
  );

  // Fetch facilities from the system
  const { data: apiFacilities, isLoading } = useQuery({
    queryKey: ['settings-facilities'],
    queryFn: async () => {
      const res = await api.get('/settings/facilities');
      return res.json();
    },
  });

  useEffect(() => {
    if (apiFacilities && apiFacilities.length > 0) {
      const mapped = apiFacilities.map((f: any) => ({
        id: f.id,
        name: f.name,
        audits: [],
      }));
      setFacilities(mapped);
    }
  }, [apiFacilities, setFacilities]);

  if (isLoading) {
    return (
      <div className="w-full flex-1 bg-background min-h-[calc(100vh-4rem)] p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="space-y-2">
            <Skeleton className="h-3 w-48" />
            <Skeleton className="h-7 w-64" />
          </div>
          <Skeleton className="h-9 w-36" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-lg" />
          <Skeleton className="h-80 rounded-lg" />
        </div>
      </div>
    );
  }

  const pathname = location.pathname;

  return (
    <div className="w-full flex-1 overflow-auto bg-background text-foreground min-h-[calc(100vh-4rem)] pb-16 sm:pb-6">
      <main className="max-w-7xl mx-auto p-4 sm:p-6">
        <Routes>
          <Route index element={<TrackingDashboard />} />
          <Route path="reports" element={<AuditLibrary mode="PUBLISHED" />} />
          <Route path="reports/:id" element={<ReportDetailRouteWrapper />} />
          <Route path="drafts" element={<AuditLibrary mode="DRAFT" />} />
          <Route path="new" element={<WorkspaceRouteWrapper isNew />} />
          <Route path="workspace/:id" element={<WorkspaceRouteWrapper />} />
          <Route path="workspace/:id/findings/new" element={<WorkspaceRouteWrapper findingMode="CREATE" />} />
          <Route path="workspace/:id/findings/:findingId" element={<AuditFindingDetailPage />} />
          <Route path="workspace/:id/findings/:findingId/edit" element={<WorkspaceRouteWrapper findingMode="EDIT" />} />
          <Route path="pool" element={<FindingPoolPage />} />
          <Route path="console" element={<LocationConsole />} />
          <Route path="settings" element={<RenovationReportSettings />} />
        </Routes>
      </main>

      {/* Mobil Alt Sekme Barı */}
      <nav
        aria-label="Mobil Navigasyon"
        className="sm:hidden fixed bottom-0 inset-x-0 z-30 border-t border-border bg-card/95 backdrop-blur-sm px-2 py-1.5 grid grid-cols-4 gap-1"
      >
        <button
          type="button"
          onClick={() => navigate('/renovation-report')}
          className={`flex flex-col items-center justify-center py-1 rounded-lg text-[10px] font-medium transition-colors duration-200 ${
            pathname === '/renovation-report' ? 'text-primary bg-primary/10' : 'text-muted-foreground'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 mb-0.5" />
          Özet
        </button>
        <button
          type="button"
          onClick={() => navigate('/renovation-report/reports')}
          className={`flex flex-col items-center justify-center py-1 rounded-lg text-[10px] font-medium transition-colors duration-200 ${
            pathname.startsWith('/renovation-report/reports') ? 'text-primary bg-primary/10' : 'text-muted-foreground'
          }`}
        >
          <FileText className="w-4 h-4 mb-0.5" />
          Raporlar
        </button>
        {isManager && (
          <button
            type="button"
            onClick={() => navigate('/renovation-report/new')}
            className={`flex flex-col items-center justify-center py-1 rounded-lg text-[10px] font-medium transition-colors duration-200 ${
              pathname.startsWith('/renovation-report/new') ? 'text-primary bg-primary/10' : 'text-muted-foreground'
            }`}
          >
            <Plus className="w-4 h-4 mb-0.5" />
            Yeni
          </button>
        )}
        {isManager && (
          <button
            type="button"
            onClick={() => navigate('/renovation-report/settings')}
            className={`flex flex-col items-center justify-center py-1 rounded-lg text-[10px] font-medium transition-colors duration-200 ${
              pathname.startsWith('/renovation-report/settings') ? 'text-primary bg-primary/10' : 'text-muted-foreground'
            }`}
          >
            <Settings className="w-4 h-4 mb-0.5" />
            Ayarlar
          </button>
        )}
      </nav>
    </div>
  );
}

export default function RenovationReportPage() {
  return (
    <IRSCProvider>
      <RenovationReportApp />
    </IRSCProvider>
  );
}
