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
import ProfilePage from './pages/ProfilePage';
import NotificationPage from './pages/notifications/NotificationPage';

// Settings
import SettingsLayout from './pages/settings/SettingsLayout';
import FacilitiesPage from './pages/settings/FacilitiesPage';
import UsersPage from './pages/settings/UsersPage';
import DefinitionsPage from './pages/settings/DefinitionsPage';
import SmtpSettingsPage from './pages/settings/SmtpSettingsPage';
import NotificationSettingsPage from './pages/settings/NotificationSettingsPage';
import EmailTemplatesPage from './pages/settings/EmailTemplatesPage';
import ReportTemplatesPage from './pages/settings/ReportTemplatesPage';
import ReportEditorPage from './pages/settings/ReportEditorPage';
import OperationsSettings from './pages/operations/OperationsSettings';

// Panel
import PanelDashboard from './pages/panel/PanelDashboard';
import PanelFacilitiesPage from './pages/panel/PanelFacilitiesPage';
import PanelFacilityLifeCardPage from './pages/panel/PanelFacilityLifeCardPage';
import ProfessionalsPage from './pages/panel/ProfessionalsPage';
import PanelProfessionalLifeCardPage from './pages/panel/PanelProfessionalLifeCardPage';
import OSGBPage from './pages/panel/OSGBPage';
import PanelOSGBLifeCardPage from './pages/panel/PanelOSGBLifeCardPage';
import EmployersPage from './pages/panel/EmployersPage';
import AssignmentsPage from './pages/panel/AssignmentsPage';
import ReconciliationPage from './pages/panel/ReconciliationPage';
import PanelSettings from './pages/panel/PanelSettings';

// Operations
import OperationsDashboard from './pages/operations/OperationsDashboard';
import HRDataPage from './pages/operations/HRDataPage';
import AccidentsPage from './pages/operations/AccidentsPage';
import NotebooksPage from './pages/operations/NotebooksPage';
import TrainingPage from './pages/operations/TrainingPage';
import BoardPage from './pages/operations/BoardPage';
import InspectionsPage from './pages/operations/InspectionsPage';

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

              {/* ── PROFIL ─────────────────────────────────────── */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <AppLayout><ProfilePage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              {/* ── BILDIRIMLER ───────────────────────────────── */}
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <AppLayout><NotificationPage /></AppLayout>
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
                    <AppLayout><PanelFacilitiesPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/panel/facilities/:id"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'management']}>
                    <AppLayout><PanelFacilityLifeCardPage /></AppLayout>
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
                path="/panel/professionals/:id"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'management']}>
                    <AppLayout><PanelProfessionalLifeCardPage /></AppLayout>
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
                path="/panel/osgb/:id"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'management']}>
                    <AppLayout><PanelOSGBLifeCardPage /></AppLayout>
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
              <Route
                path="/panel/settings"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'management']}>
                    <AppLayout><PanelSettings /></AppLayout>
                  </ProtectedRoute>
                }
              />

              {/* ── OPERATIONS (Herkes) ────────────────────────── */}
              <Route
                path="/operations"
                element={<Navigate to="/operations/dashboard" replace />}
              />
              <Route
                path="/operations/dashboard"
                element={
                  <ProtectedRoute>
                    <AppLayout><OperationsDashboard /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/operations/hr-data"
                element={
                  <ProtectedRoute>
                    <AppLayout><HRDataPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/operations/accidents"
                element={
                  <ProtectedRoute>
                    <AppLayout><AccidentsPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/operations/notebooks"
                element={
                  <ProtectedRoute>
                    <AppLayout><NotebooksPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/operations/training"
                element={
                  <ProtectedRoute>
                    <AppLayout><TrainingPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/operations/board"
                element={
                  <ProtectedRoute>
                    <AppLayout><BoardPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/operations/inspections"
                element={
                  <ProtectedRoute>
                    <AppLayout><InspectionsPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/operations/settings"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'management']}>
                    <AppLayout><OperationsSettings /></AppLayout>
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
                <Route path="definitions" element={<DefinitionsPage />} />
                <Route path="smtp" element={<SmtpSettingsPage />} />
                <Route path="notifications" element={<NotificationSettingsPage />} />
                <Route path="templates" element={<EmailTemplatesPage />} />
                <Route path="reports" element={<ReportTemplatesPage />} />
                <Route path="reports/edit/:id" element={<ReportEditorPage />} />
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
