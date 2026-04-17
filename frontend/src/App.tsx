import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './components/ThemeProvider';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import { TooltipProvider } from './components/ui/tooltip';

// Auth
import LoginPage from './pages/Login';
import PortalPage from './pages/PortalPage';

// Settings
import SettingsLayout from './pages/settings/SettingsLayout';
import FacilitiesPage from './pages/settings/FacilitiesPage';
import UsersPage from './pages/settings/UsersPage';
import ParametersPage from './pages/settings/ParametersPage';
import DefinitionsPage from './pages/settings/DefinitionsPage';

// Panel
import PanelDashboard from './pages/panel/PanelDashboard';
import ProfessionalsPage from './pages/panel/ProfessionalsPage';
import OSGBPage from './pages/panel/OSGBPage';
import EmployersPage from './pages/panel/EmployersPage';
import AssignmentsPage from './pages/panel/AssignmentsPage';
import ReconciliationPage from './pages/panel/ReconciliationPage';

// Placeholder for future modules
const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center h-64 bg-card rounded-2xl border-2 border-dashed border-border">
    <p className="text-2xl font-bold text-muted-foreground/30 mb-2">{title}</p>
    <p className="text-sm text-muted-foreground">Bu modül yakında hazır olacak.</p>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="sec-portali-theme">
        <AuthProvider>
        <TooltipProvider>
          <Router>
            <Routes>
              {/* Public */}
              <Route path="/login" element={<LoginPage />} />

              {/* ── PORTAL (Modül Seçimi) ─────────────────────── */}
              <Route
                path="/portal"
                element={
                  <ProtectedRoute>
                    <PortalPage />
                  </ProtectedRoute>
                }
              />

              {/* ── PANEL (Admin + Management) ─────────────────── */}
              <Route
                path="/panel"
                element={<Navigate to="/panel/dashboard" replace />}
              />
              <Route
                path="/panel/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'management']}>
                    <AppLayout><PanelDashboard /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/panel/facilities"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'management']}>
                    <AppLayout><PlaceholderPage title="Panel — Tesis Listesi" /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/panel/professionals"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'management']}>
                    <AppLayout><ProfessionalsPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/panel/employers"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'management']}>
                    <AppLayout><EmployersPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/panel/osgb"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'management']}>
                    <AppLayout><OSGBPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/panel/assignments"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'management']}>
                    <AppLayout><AssignmentsPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/panel/reconciliation"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'management']}>
                    <AppLayout><ReconciliationPage /></AppLayout>
                  </ProtectedRoute>
                }
              />

              {/* ── OPERATIONS (Herkes) ────────────────────────── */}
              <Route
                path="/operations/*"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <PlaceholderPage title="İSG Aylık Veri Sistemi — Faz 4" />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/operations/dashboard"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <PlaceholderPage title="Operasyon Dashboard" />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              {/* ── SETTINGS (Admin + Management) ─────────────── */}
              <Route
                path="/settings"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'management']}>
                    <AppLayout>
                      <SettingsLayout />
                    </AppLayout>
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="facilities" replace />} />
                <Route path="facilities" element={<FacilitiesPage />} />
                <Route path="users" element={<UsersPage />} />
                <Route path="parameters" element={<ParametersPage />} />
                <Route path="definitions" element={<DefinitionsPage />} />
              </Route>

              {/* ── Redirects ──────────────────────────────────── */}
              <Route path="/" element={<Navigate to="/portal" replace />} />
              <Route path="*" element={<Navigate to="/portal" replace />} />
            </Routes>
          </Router>
        </TooltipProvider>
      </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
