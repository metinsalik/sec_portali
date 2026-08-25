import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { IRSCProvider, useIRSC } from './context/IRSCContext';
import TrackingDashboard from './views/TrackingDashboard';
import AuditLibrary from './views/AuditLibrary';
import LocationConsole from './views/LocationConsole';
import AuditWorkspace from './views/AuditWorkspace';
import RenovationReportSettings from './views/RenovationReportSettings';

function RenovationReportApp() {
  const { currentView, setCurrentView, setFacilities } = useIRSC();
  const location = useLocation();
  const navigate = useNavigate();

  // Sync view with route
  useEffect(() => {
    if (location.pathname.includes('/settings')) {
      setCurrentView('SETTINGS');
    } else if (currentView === 'SETTINGS') {
      setCurrentView('TRACKING');
    }
  }, [location.pathname, setCurrentView]);

  // Fetch facilities from the system
  const { data: apiFacilities, isLoading } = useQuery({
    queryKey: ['settings-facilities'],
    queryFn: async () => {
      const res = await api.get('/settings/facilities');
      return res.json();
    }
  });

  useEffect(() => {
    if (apiFacilities && apiFacilities.length > 0) {
      const mapped = apiFacilities.map((f: any) => ({
        id: f.id,
        name: f.name,
        audits: []
      }));
      setFacilities(mapped);
    }
  }, [apiFacilities, setFacilities]);

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Tesisler yükleniyor...</div>;
  }

  return (
    <div className="w-full flex-1 overflow-auto bg-slate-50 dark:bg-slate-900 min-h-[calc(100vh-4rem)]">
      {/* Topbar/Navigation simulation */}
      <div className="border-b bg-white px-6 py-4 flex items-center justify-between dark:bg-slate-800 dark:border-slate-700">
        <div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Entegre Risk ve Güvenlik Denetimi</div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">IRSC Yönetimi</h1>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="p-6">
        {currentView === 'TRACKING' && <TrackingDashboard />}
        {currentView === 'LIBRARY' && <AuditLibrary />}
        {currentView === 'CONSOLE' && <LocationConsole />}
        {currentView === 'WORKSPACE' && <AuditWorkspace />}
        {currentView === 'SETTINGS' && <RenovationReportSettings />}
      </main>
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
