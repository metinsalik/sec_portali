import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './components/ThemeProvider';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import { TooltipProvider } from './components/ui/tooltip';
import { Toaster } from 'sonner';

// Auth
import LoginPage from './pages/Login';
import PortalPage from './pages/PortalPage';
import ProfilePage from './pages/ProfilePage';
import NotificationPage from './pages/notifications/NotificationPage';

// Settings
import HazmatKitItemsPage from './pages/settings/HazmatKitItemsPage';
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
import ReconciliationDetailsPage from './pages/panel/ReconciliationDetailsPage';
import PanelSettings from './pages/panel/PanelSettings';

// Operations
import OperationsDashboard from './pages/operations/OperationsDashboard';
import HRDataPage from './pages/operations/HRDataPage';
import AccidentsPage from './pages/operations/AccidentsPage';
import ExtraordinaryIncidentsPage from './pages/operations/ExtraordinaryIncidentsPage';
import NotebooksPage from './pages/operations/NotebooksPage';
import TrainingPage from './pages/operations/TrainingPage';
import BoardPage from './pages/operations/BoardPage';
import InspectionsPage from './pages/operations/InspectionsPage';
import OperationsFacilityPage from './pages/operations/OperationsFacilityPage';

// Workflow
import WorkflowDashboard from './pages/workflow/WorkflowDashboard';
import BoardView from './pages/workflow/BoardView';
import PoolView from './pages/workflow/PoolView';
import TeamOverview from './pages/workflow/TeamOverview';
import WorkflowSettings from './pages/workflow/WorkflowSettings';

// Risk Yaşam Döngüsü
import RiskDashboard from './pages/risks/RiskDashboard';
import RiskFacilityPage from './pages/risks/RiskFacilityPage';
import FacilityDepartmentsPage from './pages/risks/FacilityDepartmentsPage';
import FacilityCategoriesPage from './pages/risks/FacilityCategoriesPage';
import RiskCategoryPage from './pages/risks/RiskCategoryPage';
import RiskDepartmentPage from './pages/risks/RiskDepartmentPage';
import RiskFormPage from './pages/risks/RiskFormPage';
import RiskViewPage from './pages/risks/RiskViewPage';
import RiskSettings from './pages/risks/RiskSettings';

// HazMat
import HazmatDashboardPage from './pages/hazmat/HazmatDashboardPage';
import MaterialsListPage from './pages/hazmat/MaterialsListPage';
import MaterialFormPage from './pages/hazmat/MaterialFormPage';
import MaterialViewPage from './pages/hazmat/MaterialViewPage';
import HazmatSettingsPage from './pages/hazmat/HazmatSettingsPage';
import FacilityInventoryListPage from './pages/hazmat/FacilityInventoryListPage';
import FacilityInventoryFormPage from './pages/hazmat/FacilityInventoryFormPage';
import HazmatDepartmentsPage from './pages/hazmat/HazmatDepartmentsPage';
import HazmatDepartmentViewPage from './pages/hazmat/HazmatDepartmentViewPage';
import SpillKitsPage from './pages/hazmat/SpillKitsPage';
import EyewashRiskAnalysisPage from './pages/hazmat/EyewashRiskAnalysisPage';
import EyewashRiskAnalysisFormPage from './pages/hazmat/EyewashRiskAnalysisFormPage';
import EyewashRiskAnalysisViewPage from './pages/hazmat/EyewashRiskAnalysisViewPage';
import EyewashRiskAnalysisReportPage from './pages/hazmat/EyewashRiskAnalysisReportPage';

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
                  path="/panel/reconciliation/:id"
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'management']}>
                      <AppLayout><ReconciliationDetailsPage /></AppLayout>
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
                  path="/operations/facility"
                  element={
                    <ProtectedRoute>
                      <AppLayout><OperationsFacilityPage /></AppLayout>
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
                  path="/operations/incidents"
                  element={
                    <ProtectedRoute>
                      <AppLayout><ExtraordinaryIncidentsPage /></AppLayout>
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
                
                {/* ── RISK (RİSK YAŞAM DÖNGÜSÜ) ───────────────── */}
                <Route
                  path="/risks"
                  element={
                    <ProtectedRoute>
                      <AppLayout><RiskDashboard /></AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/risks/facility/:facilityId"
                  element={
                    <ProtectedRoute>
                      <AppLayout><RiskFacilityPage /></AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/risks/facility/:facilityId/departments"
                  element={
                    <ProtectedRoute>
                      <AppLayout><FacilityDepartmentsPage /></AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/risks/facility/:facilityId/categories"
                  element={
                    <ProtectedRoute>
                      <AppLayout><FacilityCategoriesPage /></AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/risks/facility/:facilityId/category-details"
                  element={
                    <ProtectedRoute>
                      <AppLayout><RiskCategoryPage /></AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/risks/department/:departmentId"
                  element={
                    <ProtectedRoute>
                      <AppLayout><RiskDepartmentPage /></AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/risks/department/:departmentId/create"
                  element={
                    <ProtectedRoute>
                      <AppLayout><RiskFormPage /></AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/risks/department/:departmentId/view/:riskId"
                  element={
                    <ProtectedRoute>
                      <AppLayout><RiskViewPage /></AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/risks/department/:departmentId/edit/:riskId"
                  element={
                    <ProtectedRoute>
                      <AppLayout><RiskFormPage /></AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/risks/settings"
                  element={
                    <ProtectedRoute>
                      <AppLayout><RiskSettings /></AppLayout>
                    </ProtectedRoute>
                  }
                />

                {/* ── WORKFLOW (İŞ TAKİP) ─────────────────────────── */}
                <Route
                  path="/workflow"
                  element={<Navigate to="/workflow/dashboard" replace />}
                />
                <Route
                  path="/workflow/dashboard"
                  element={
                    <ProtectedRoute>
                      <AppLayout><WorkflowDashboard /></AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/workflow/board"
                  element={
                    <ProtectedRoute>
                      <AppLayout><BoardView /></AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/workflow/pool"
                  element={
                    <ProtectedRoute>
                      <AppLayout><PoolView /></AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/workflow/team"
                  element={
                    <ProtectedRoute>
                      <AppLayout><TeamOverview /></AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/workflow/settings"
                  element={
                    <ProtectedRoute>
                      <AppLayout><WorkflowSettings /></AppLayout>
                    </ProtectedRoute>
                  }
                />

                {/* ── HAZMAT (TEHLİKELİ MADDE YÖNETİMİ) ────────────── */}
                <Route
                  path="/hazmat"
                  element={<Navigate to="/hazmat/dashboard" replace />}
                />
                <Route
                  path="/hazmat/dashboard"
                  element={
                    <ProtectedRoute>
                      <AppLayout><HazmatDashboardPage /></AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/hazmat/materials"
                  element={
                    <ProtectedRoute>
                      <AppLayout><MaterialsListPage /></AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/hazmat/materials/new"
                  element={
                    <ProtectedRoute>
                      <AppLayout><MaterialFormPage /></AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/hazmat/materials/edit/:id"
                  element={
                    <ProtectedRoute>
                      <AppLayout><MaterialFormPage /></AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/hazmat/materials/view/:id"
                  element={
                    <ProtectedRoute>
                      <MaterialViewPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/hazmat/inventory"
                  element={
                    <ProtectedRoute>
                      <AppLayout><FacilityInventoryListPage /></AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/hazmat/inventory/new"
                  element={
                    <ProtectedRoute>
                      <AppLayout><FacilityInventoryFormPage /></AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/hazmat/departments"
                  element={
                    <ProtectedRoute>
                      <AppLayout><HazmatDepartmentsPage /></AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/hazmat/departments/:id"
                  element={
                    <ProtectedRoute>
                      <AppLayout><HazmatDepartmentViewPage /></AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/hazmat/eyewash-risk"
                  element={
                    <ProtectedRoute>
                      <AppLayout><EyewashRiskAnalysisPage /></AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/hazmat/eyewash-risk/new"
                  element={
                    <ProtectedRoute>
                      <AppLayout><EyewashRiskAnalysisFormPage /></AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/hazmat/eyewash-risk/edit/:id"
                  element={
                    <ProtectedRoute>
                      <AppLayout><EyewashRiskAnalysisFormPage /></AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/hazmat/eyewash-risk/view/:id"
                  element={
                    <ProtectedRoute>
                      <AppLayout><EyewashRiskAnalysisViewPage /></AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/hazmat/eyewash-risk/report"
                  element={
                    <ProtectedRoute>
                      <AppLayout><EyewashRiskAnalysisReportPage /></AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/hazmat/spill-kits"
                  element={
                    <ProtectedRoute>
                      <AppLayout><SpillKitsPage /></AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/hazmat/settings/units"
                  element={
                    <ProtectedRoute>
                      <AppLayout><HazmatSettingsPage /></AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/hazmat/settings/departments"
                  element={
                    <ProtectedRoute>
                      <AppLayout><HazmatSettingsPage /></AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/hazmat/settings/labels"
                  element={
                    <ProtectedRoute>
                      <AppLayout><HazmatSettingsPage /></AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/hazmat/settings/ppe"
                  element={
                    <ProtectedRoute>
                      <AppLayout><HazmatSettingsPage /></AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/hazmat/settings/categories"
                  element={
                    <ProtectedRoute>
                      <AppLayout><HazmatSettingsPage /></AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/hazmat/settings/kit-items"
                  element={
                    <ProtectedRoute>
                      <AppLayout><HazmatKitItemsPage /></AppLayout>
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
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;