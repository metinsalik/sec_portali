import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import { ThemeProvider } from './components/ThemeProvider';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import { TooltipProvider } from './components/ui/tooltip';
import { Toaster } from 'sonner';

// Auth
import LoginPage from './pages/Login';
import PortalPage from './pages/PortalPage';
import OperationsManagementPage from './pages/OperationsManagementPage';
import SafetyManagementPage from './pages/SafetyManagementPage';
import IsgKurulHome from './pages/isg-kurul/IsgKurulHome';
import IsgKurulAnalytics from './pages/isg-kurul/IsgKurulAnalytics';

import IsgKurulHomeWrapper from './components/IsgKurulHomeWrapper';
import IsgKurulAnalyticsWrapper from './components/IsgKurulAnalyticsWrapper';
import IsgKurulSettings from './pages/isg-kurul/IsgKurulSettings';
import IsgKurulMeetings from './pages/isg-kurul/IsgKurulMeetings';
import IsgKurulDecisions from './pages/isg-kurul/IsgKurulDecisions';
import IsgKurulMeetingDetails from './pages/isg-kurul/IsgKurulMeetingDetails';
import IsgKurulDecisionDetails from './pages/isg-kurul/IsgKurulDecisionDetails';
import ProfilePage from './pages/ProfilePage';
import RenovationReportPage from './pages/build_management/RenovationReportPage';
import FacilityActionsPage from './pages/build_management/FacilityActionsPage';
import NotificationPage from './pages/notifications/NotificationPage';

// Settings
import HazmatKitItemsPage from './pages/settings/HazmatKitItemsPage';
import SettingsLayout from './pages/settings/SettingsLayout';
import FacilityLocationsPage from './pages/settings/FacilityLocationsPage';
import FacilitiesPage from './pages/settings/FacilitiesPage';
import FacilityWizardPage from './pages/settings/facility-wizard/FacilityWizard';
import UsersPage from './pages/settings/UsersPage';
import DefinitionsPage from './pages/settings/DefinitionsPage';
import SmtpSettingsPage from './pages/settings/SmtpSettingsPage';
import TelegramSettingsPage from './pages/settings/TelegramSettingsPage';
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
import BoardList from './pages/operations/board/BoardList';
import BoardForm from './pages/operations/board/BoardForm';
import InspectionsPage from './pages/operations/InspectionsPage';
// Workflow
import WorkflowDashboard from './pages/workflow/WorkflowDashboard';
import WorkflowTasksPage from './pages/workflow/WorkflowTasksPage';
import WorkflowDashboardPage from './pages/workflow/WorkflowDashboardPage';
import WorkflowTaskDetailsPage from './pages/workflow/WorkflowTaskDetailsPage';
import WorkflowPlansPage from './pages/workflow/WorkflowPlansPage';
import WorkflowPlanDetailsPage from './pages/workflow/WorkflowPlanDetailsPage';
import WorkflowCalendarPage from './pages/workflow/WorkflowCalendarPage';
import WorkflowAlertsPage from './pages/workflow/WorkflowAlertsPage';
import WorkflowReportsPage from './pages/workflow/WorkflowReportsPage';
import WorkflowSettings from './pages/workflow/WorkflowSettings';

// Risk Yaşam Döngüsü
import RiskDashboard from './pages/risks/RiskDashboard';
import RiskFacilityPage from './pages/risks/RiskFacilityPage';
import FacilityDepartmentsPage from './pages/risks/FacilityDepartmentsPage';
import FacilityCategoriesPage from './pages/risks/FacilityCategoriesPage';
import FacilityRiskLevelPage from './pages/risks/FacilityRiskLevelPage';
import RiskCategoryPage from './pages/risks/RiskCategoryPage';
import RiskDepartmentPage from './pages/risks/RiskDepartmentPage';
import RiskFormPage from './pages/risks/RiskFormPage';
import RiskViewPage from './pages/risks/RiskViewPage';
import RiskSettings from './pages/risks/RiskSettings';
import { RiskReportsPage } from './pages/risks/RiskReportsPage';

// HazMat
import HazmatDashboardPage from './pages/hazmat/HazmatDashboardPage';
import MaterialsListPage from './pages/hazmat/MaterialsListPage';
import MaterialFormPage from './pages/hazmat/MaterialFormPage';
import MaterialViewPage from './pages/hazmat/MaterialViewPage';
import HazmatSettingsPage from './pages/hazmat/HazmatSettingsPage';
import FacilityInventoryListPage from './pages/hazmat/FacilityInventoryListPage';
import FacilityInventoryFormPage from './pages/hazmat/FacilityInventoryFormPage';
import HazmatFacilityMaterialPage from './pages/hazmat/HazmatFacilityMaterialPage';
import HazmatDepartmentsPage from './pages/hazmat/HazmatDepartmentsPage';
import HazmatDepartmentViewPage from './pages/hazmat/HazmatDepartmentViewPage';
import HazmatCleaningCartsPage from './pages/hazmat/HazmatCleaningCartsPage';
import SpillKitsPage from './pages/hazmat/SpillKitsPage';
import EyewashRiskAnalysisPage from './pages/hazmat/EyewashRiskAnalysisPage';
import EyewashRiskAnalysisFormPage from './pages/hazmat/EyewashRiskAnalysisFormPage';
import EyewashRiskAnalysisViewPage from './pages/hazmat/EyewashRiskAnalysisViewPage';
import EyewashRiskAnalysisReportPage from './pages/hazmat/EyewashRiskAnalysisReportPage';
import HazmatIncidentsPage from './pages/hazmat/HazmatIncidentsPage';

// Fire Equipment
import FireEquipmentDashboard from './pages/fire_equipment/FireEquipmentDashboard';
import FireEquipmentListPage from './pages/fire_equipment/FireEquipmentListPage';
import FireEquipmentFormPage from './pages/fire_equipment/FireEquipmentFormPage';
import FireEquipmentDetailPage from './pages/fire_equipment/FireEquipmentDetailPage';
import FireEquipmentMaintenancePage from './pages/fire_equipment/FireEquipmentMaintenancePage';
import FireEquipmentMaintenanceDashboardPage from './pages/fire_equipment/FireEquipmentMaintenanceDashboardPage';
import FireEquipmentSettingsPage from './pages/fire_equipment/FireEquipmentSettingsPage';
import QRScannerPage from './pages/fire_equipment/QRScannerPage';

// Fire Doors
import FireDoorsList from './pages/FireDoors/List/FireDoorsList';
import FireDoorDetail from './pages/FireDoors/Detail/FireDoorDetail';
import FireDoorInspectionForm from './pages/FireDoors/Inspection/FireDoorInspectionForm';
import FireDoorSettings from './pages/FireDoors/Settings/FireDoorSettings';
import FireDoorWizard from './pages/FireDoors/Inspection/FireDoorWizard';

// Build Management
import BuildDashboard from './pages/build_management/BuildDashboard';
import BuildProjectList from './pages/build_management/BuildProjectList';
import BuildProjectDetail from './pages/build_management/BuildProjectDetail';
import BuildProjectForm from './pages/build_management/BuildProjectForm';
import BuildDesignFormPage from './pages/build_management/BuildDesignFormPage';
import BuildInspectionsPage from './pages/build_management/BuildInspectionsPage';
import BuildProjectInspectionsDashboard from './pages/build_management/BuildProjectInspectionsDashboard';
import BuildInspectionOHSFormPage from './pages/build_management/BuildInspectionOHSFormPage';
import BuildInspectionInfectionFormPage from './pages/build_management/BuildInspectionInfectionFormPage';
import BuildFindingsPage from './pages/build_management/BuildFindingsPage';
import BuildRiskAssessmentPage from './pages/build_management/BuildRiskAssessmentPage';
import BuildProjectHandoverPage from './pages/build_management/BuildProjectHandoverPage';
import BuildHandoverListPage from './pages/build_management/BuildHandoverListPage';
import BuildReportsPage from './pages/build_management/BuildReportsPage';
import BuildSettings from './pages/build_management/BuildSettings';

// Bina Turu Yönetimi
import BinaToruDashboard from './pages/bina-turu/BinaToruDashboard';
import BinaToruListesi from './pages/bina-turu/BinaToruListesi';
import BinaToruOlustur from './pages/bina-turu/BinaToruOlustur';
import DenetimYap from './pages/bina-turu/DenetimYap';
import UygunsuzlukTakibi from './pages/bina-turu/UygunsuzlukTakibi';
import AyarlarIndex from './pages/bina-turu/ayarlar/AyarlarIndex';
import BinaTuruRaporu from "./pages/bina-turu/BinaTuruRaporu";
import BinaTuruYillikRaporu from "./pages/bina-turu/BinaTuruYillikRaporu";
import UygunsuzlukRaporu from './pages/bina-turu/UygunsuzlukRaporu';
import UygunsuzlukYillikRaporu from './pages/bina-turu/UygunsuzlukYillikRaporu';

// İSG Kontrol Listeleri
import TemplateListPage from './pages/checklists/TemplateListPage';
import TemplateBuilderPage from './pages/checklists/TemplateBuilderPage';
import TemplateViewPage from './pages/checklists/TemplateViewPage';
import TemplatePreviewPage from './pages/checklists/TemplatePreviewPage';
import SubmissionListPage from './pages/checklists/SubmissionListPage';
import SubmissionFormPage from './pages/checklists/SubmissionFormPage';
import ReportsPage from './pages/checklists/ReportsPage';
import ChecklistSettingsPage from './pages/settings/ChecklistSettingsPage';
import ChecklistDashboardPage from './pages/checklists/ChecklistDashboardPage';

// İSG Tespit ve Öneri Defteri
import IsgDefterLayout from './pages/safety-management/isg-defter/IsgDefterLayout';
import IsgDefterDashboard from './pages/safety-management/isg-defter/IsgDefterDashboard';
import IsgDefterRecords from './pages/safety-management/isg-defter/IsgDefterRecords';
import IsgDefterSettings from './pages/safety-management/isg-defter/IsgDefterSettings';
import IsgDefterItemDetail from './pages/safety-management/isg-defter/IsgDefterItemDetail';
import IsgDefterPageBuilder from './pages/safety-management/isg-defter/IsgDefterPageBuilder';


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
      <ThemeProvider defaultTheme="light" storageKey="sec-portali-theme">
        <AuthProvider>
          <ChatProvider>
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

                  {/* ── OPERATIONS MANAGEMENT ─────────────────────── */}
                  <Route
                    path="/operations-management"
                    element={
                      <ProtectedRoute>
                        <OperationsManagementPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/safety-management"
                    element={
                      <ProtectedRoute>
                        <SafetyManagementPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/safety-management/fire-doors"
                    element={<Navigate to="/safety-management/fire-doors/list" replace />}
                  />
                  <Route
                    path="/safety-management/fire-doors/list"
                    element={
                      <ProtectedRoute>
                        <AppLayout><FireDoorsList /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/safety-management/fire-doors/new"
                    element={
                      <ProtectedRoute>
                        <AppLayout><FireDoorWizard /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/safety-management/fire-doors/settings"
                    element={
                      <ProtectedRoute>
                        <AppLayout><FireDoorSettings /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/safety-management/fire-doors/:id"
                    element={
                      <ProtectedRoute>
                        <AppLayout><FireDoorDetail /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/safety-management/fire-doors/:id/inspection"
                    element={
                      <ProtectedRoute>
                        <AppLayout><FireDoorWizard /></AppLayout>
                      </ProtectedRoute>
                    }
                  />

                  {/* ── İSG TESPİT VE ÖNERİ DEFTERİ ────────────────── */}
                  <Route
                    path="/safety-management/isg-defter"
                    element={
                      <ProtectedRoute>
                        <IsgDefterLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<IsgDefterDashboard />} />
                    <Route path="records" element={<IsgDefterRecords />} />
                    <Route path="pages/:pageId/builder" element={<IsgDefterPageBuilder />} />
                    <Route path="items/:itemId" element={<IsgDefterItemDetail />} />
                    <Route path="settings" element={<IsgDefterSettings />} />
                  </Route>

                  {/* ── İSG KURUL YÖNETİMİ ─────────────────────── */}
                  <Route
                    path="/isg-kurul"
                    element={<Navigate to="/isg-kurul/dashboard" replace />}
                  />
                  <Route path="/isg-kurul/dashboard" element={<Navigate to="/isg-kurul/home" replace />} />
                  <Route path="/isg-kurul/home" element={<IsgKurulHomeWrapper />} />
                  <Route path="/isg-kurul/analytics" element={<IsgKurulAnalyticsWrapper />} />
                  <Route
                    path="/isg-kurul/meetings"
                    element={
                      <ProtectedRoute>
                        <AppLayout><IsgKurulMeetings /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/isg-kurul/decisions"
                    element={
                      <ProtectedRoute>
                        <AppLayout><IsgKurulDecisions /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/isg-kurul/meetings/:id"
                    element={
                      <ProtectedRoute>
                        <AppLayout><IsgKurulMeetingDetails /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/isg-kurul/meetings/:id/decisions/:decisionId"
                    element={
                      <ProtectedRoute>
                        <AppLayout><IsgKurulDecisionDetails /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/isg-kurul/settings"
                    element={
                      <ProtectedRoute>
                        <AppLayout><IsgKurulSettings /></AppLayout>
                      </ProtectedRoute>
                    }
                  />

                  {/* ── ENTEGRE RİSK VE GÜVENLİK DENETİMİ ──────────── */}
                  <Route
                    path="/renovation-report"
                    element={
                      <ProtectedRoute>
                        <AppLayout><RenovationReportPage /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/renovation-report/settings"
                    element={
                      <ProtectedRoute>
                        <AppLayout><RenovationReportPage /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/facility-actions"
                    element={
                      <ProtectedRoute>
                        <AppLayout><FacilityActionsPage /></AppLayout>
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
                      <ProtectedRoute>
                        <AppLayout><PanelDashboard /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/panel/facilities"
                    element={
                      <ProtectedRoute>
                        <AppLayout><PanelFacilitiesPage /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/panel/facilities/:id"
                    element={
                      <ProtectedRoute>
                        <AppLayout><PanelFacilityLifeCardPage /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/panel/professionals"
                    element={
                      <ProtectedRoute>
                        <AppLayout><ProfessionalsPage /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/panel/professionals/:id"
                    element={
                      <ProtectedRoute>
                        <AppLayout><PanelProfessionalLifeCardPage /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/panel/employers"
                    element={
                      <ProtectedRoute>
                        <AppLayout><EmployersPage /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/panel/osgb"
                    element={
                      <ProtectedRoute>
                        <AppLayout><OSGBPage /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/panel/osgb/:id"
                    element={
                      <ProtectedRoute>
                        <AppLayout><PanelOSGBLifeCardPage /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/panel/assignments"
                    element={
                      <ProtectedRoute>
                        <AppLayout><AssignmentsPage /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/panel/reconciliation"
                    element={
                      <ProtectedRoute>
                        <AppLayout><ReconciliationPage /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/panel/reconciliation/:id"
                    element={
                      <ProtectedRoute>
                        <AppLayout><ReconciliationDetailsPage /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/panel/settings"
                    element={
                      <ProtectedRoute>
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
                        <AppLayout><BoardList /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/operations/board/new"
                    element={
                      <ProtectedRoute>
                        <AppLayout><BoardForm /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/operations/board/:id/edit"
                    element={
                      <ProtectedRoute>
                        <AppLayout><BoardForm /></AppLayout>
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
                      <ProtectedRoute>
                        <AppLayout><OperationsSettings /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  
                  <Route
                    path="/build-management/project/:id/handover"
                    element={
                      <ProtectedRoute>
                        <AppLayout><BuildProjectHandoverPage /></AppLayout>
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
                    path="/risks/reports"
                    element={
                      <ProtectedRoute>
                        <AppLayout><RiskReportsPage /></AppLayout>
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
                    path="/risks/facility/:facilityId/levels"
                    element={
                      <ProtectedRoute>
                        <AppLayout><FacilityRiskLevelPage /></AppLayout>
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
                        <AppLayout><WorkflowDashboardPage /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/workflow/tasks"
                    element={
                      <ProtectedRoute>
                        <AppLayout><WorkflowTasksPage /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/workflow/tasks/:id"
                    element={
                      <ProtectedRoute module="WORKFLOW">
                        <AppLayout><WorkflowTaskDetailsPage /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route 
                    path="/workflow/plans" 
                    element={
                      <ProtectedRoute moduleName="İş Takibi (Workflow)">
                        <AppLayout><WorkflowPlansPage /></AppLayout>
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/workflow/plans/:id" 
                    element={
                      <ProtectedRoute moduleName="İş Takibi (Workflow)">
                        <AppLayout><WorkflowPlanDetailsPage /></AppLayout>
                      </ProtectedRoute>
                    } 
                  />
                  <Route
                    path="/workflow/calendar"
                    element={
                      <ProtectedRoute>
                        <AppLayout><WorkflowCalendarPage /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/workflow/alerts"
                    element={
                      <ProtectedRoute>
                        <AppLayout><WorkflowAlertsPage /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/workflow/reports"
                    element={
                      <ProtectedRoute>
                        <AppLayout><WorkflowReportsPage /></AppLayout>
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
                      <ProtectedRoute >
                        <AppLayout><HazmatDashboardPage /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/hazmat/materials"
                    element={
                      <ProtectedRoute >
                        <AppLayout><MaterialsListPage /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/hazmat/materials/new"
                    element={
                      <ProtectedRoute >
                        <AppLayout><MaterialFormPage /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/hazmat/materials/edit/:id"
                    element={
                      <ProtectedRoute >
                        <AppLayout><MaterialFormPage /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/hazmat/materials/view/:id"
                    element={
                      <ProtectedRoute >
                        <MaterialViewPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/hazmat/inventory"
                    element={
                      <ProtectedRoute >
                        <AppLayout><FacilityInventoryListPage /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/hazmat/inventory/material/:id"
                    element={
                      <ProtectedRoute >
                        <AppLayout><HazmatFacilityMaterialPage /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/hazmat/inventory/new"
                    element={
                      <ProtectedRoute >
                        <AppLayout><FacilityInventoryFormPage /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/hazmat/departments"
                    element={
                      <ProtectedRoute >
                        <AppLayout><HazmatDepartmentsPage /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/hazmat/departments/:id"
                    element={
                      <ProtectedRoute >
                        <AppLayout><HazmatDepartmentViewPage /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/hazmat/eyewash-risk"
                    element={
                      <ProtectedRoute >
                        <AppLayout><EyewashRiskAnalysisPage /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/hazmat/eyewash-risk/new"
                    element={
                      <ProtectedRoute >
                        <AppLayout><EyewashRiskAnalysisFormPage /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/hazmat/eyewash-risk/edit/:id"
                    element={
                      <ProtectedRoute >
                        <AppLayout><EyewashRiskAnalysisFormPage /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/hazmat/eyewash-risk/view/:id"
                    element={
                      <ProtectedRoute >
                        <AppLayout><EyewashRiskAnalysisViewPage /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/hazmat/eyewash-risk/report"
                    element={
                      <ProtectedRoute >
                        <AppLayout><EyewashRiskAnalysisReportPage /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/hazmat/spill-kits"
                    element={
                      <ProtectedRoute >
                        <AppLayout><SpillKitsPage /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/hazmat/cleaning-carts"
                    element={
                      <ProtectedRoute >
                        <AppLayout><HazmatCleaningCartsPage /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/hazmat/incidents"
                    element={
                      <ProtectedRoute >
                        <AppLayout><HazmatIncidentsPage /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/hazmat/settings/units"
                    element={
                      <ProtectedRoute >
                        <AppLayout><HazmatSettingsPage /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/hazmat/settings/departments"
                    element={
                      <ProtectedRoute >
                        <AppLayout><HazmatSettingsPage /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/hazmat/settings/ghs"
                    element={
                      <ProtectedRoute >
                        <AppLayout><HazmatSettingsPage /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/hazmat/settings/adr"
                    element={
                      <ProtectedRoute >
                        <AppLayout><HazmatSettingsPage /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/hazmat/settings/ppe"
                    element={
                      <ProtectedRoute >
                        <AppLayout><HazmatSettingsPage /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/hazmat/settings/events"
                    element={
                      <ProtectedRoute requiredModules={['hazmat']}>
                        <AppLayout><HazmatSettingsPage /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/hazmat/settings/categories"
                    element={
                      <ProtectedRoute >
                        <AppLayout><HazmatSettingsPage /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/hazmat/settings/kit-items"
                    element={
                      <ProtectedRoute >
                        <AppLayout><HazmatKitItemsPage /></AppLayout>
                      </ProtectedRoute>
                    }
                  />

                  {/* ── FIRE EQUIPMENT (YANGIN EKİPMANLARI) ─────────── */}
                  <Route
                    path="/fire-equipment"
                    element={<Navigate to="/fire-equipment/dashboard" replace />}
                  />
                  <Route
                    path="/fire-equipment/dashboard"
                    element={
                      <ProtectedRoute>
                        <AppLayout><FireEquipmentDashboard /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/fire-equipment/list"
                    element={
                      <ProtectedRoute>
                        <AppLayout><FireEquipmentListPage /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/fire-equipment/new"
                    element={
                      <ProtectedRoute>
                        <AppLayout><FireEquipmentFormPage /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/fire-equipment/edit/:id"
                    element={
                      <ProtectedRoute>
                        <AppLayout><FireEquipmentFormPage /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/fire-equipment/view/:id"
                    element={
                      <ProtectedRoute>
                        <AppLayout><FireEquipmentDetailPage /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/fire-equipment/maintenance/:id"
                    element={
                      <ProtectedRoute>
                        <AppLayout><FireEquipmentMaintenancePage /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/fire-equipment/maintenance"
                    element={
                      <ProtectedRoute>
                        <AppLayout><FireEquipmentMaintenanceDashboardPage /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/fire-equipment/settings"
                    element={
                      <ProtectedRoute>
                        <AppLayout><FireEquipmentSettingsPage /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/fire-equipment/scanner"
                    element={
                      <ProtectedRoute>
                        <AppLayout><QRScannerPage /></AppLayout>
                      </ProtectedRoute>
                    }
                  />

                  {/* ── BUILD MANAGEMENT (İNŞAAT VE RENOVASYON) ─────────── */}
                  <Route
                    path="/build-management"
                    element={<Navigate to="/build-management/dashboard" replace />}
                  />
                  <Route
                    path="/build-management/dashboard"
                    element={
                      <ProtectedRoute>
                        <AppLayout><BuildDashboard /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/build-management/list"
                    element={
                      <ProtectedRoute>
                        <AppLayout><BuildProjectList /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/build-management/new"
                    element={
                      <ProtectedRoute>
                        <AppLayout><BuildProjectForm /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/build-management/project/:id"
                    element={
                      <ProtectedRoute>
                        <AppLayout><BuildProjectDetail /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/build-management/inspections"
                    element={
                      <ProtectedRoute>
                        <AppLayout><BuildInspectionsPage /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/build-management/project/:id/design-form"
                    element={
                      <ProtectedRoute>
                        <AppLayout><BuildDesignFormPage /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/build-management/project/:id/risk-assessment"
                    element={
                      <ProtectedRoute>
                        <AppLayout><BuildRiskAssessmentPage /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/build-management/project/:id/inspections"
                    element={
                      <ProtectedRoute>
                        <AppLayout><BuildProjectInspectionsDashboard /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/build-management/project/:id/inspections/ohs/new"
                    element={
                      <ProtectedRoute>
                        <AppLayout><BuildInspectionOHSFormPage /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/build-management/project/:id/inspections/ohs"
                    element={
                      <ProtectedRoute>
                        <AppLayout><BuildInspectionOHSFormPage /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/build-management/project/:id/inspections/ohs/edit/:inspectionId"
                    element={
                      <ProtectedRoute>
                        <AppLayout><BuildInspectionOHSFormPage /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/build-management/project/:id/inspections/infection/new"
                    element={
                      <ProtectedRoute>
                        <AppLayout><BuildInspectionInfectionFormPage /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/build-management/project/:id/inspections/infection"
                    element={
                      <ProtectedRoute>
                        <AppLayout><BuildInspectionInfectionFormPage /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/build-management/project/:id/inspections/infection/edit/:inspectionId"
                    element={
                      <ProtectedRoute>
                        <AppLayout><BuildInspectionInfectionFormPage /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/build-management/findings"
                    element={
                      <ProtectedRoute>
                        <AppLayout><BuildFindingsPage /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/build-management/project/:id/findings"
                    element={
                      <ProtectedRoute>
                        <AppLayout><BuildProjectDetail defaultTab="bulgular" /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/build-management/handover"
                    element={
                      <ProtectedRoute>
                        <AppLayout><BuildHandoverListPage /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/build-management/reports"
                    element={
                      <ProtectedRoute>
                        <AppLayout><BuildReportsPage /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/build-management/settings"
                    element={
                      <ProtectedRoute>
                        <AppLayout><BuildSettings /></AppLayout>
                      </ProtectedRoute>
                    }
                  />

                  {/* ── SETTINGS (Admin + Management) ─────────────── */}
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute>
                        <AppLayout>
                          <SettingsLayout />
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<Navigate to="facilities" replace />} />
                    <Route path="facilities" element={<FacilitiesPage />} />
                    <Route path="facilities/new" element={<FacilityWizardPage />} />
                    <Route path="facilities/:id/edit" element={<FacilityWizardPage />} />

                    <Route path="locations" element={<FacilityLocationsPage />} />
                    <Route path="users" element={<ProtectedRoute requireAdmin><UsersPage /></ProtectedRoute>} />
                    <Route path="definitions" element={<ProtectedRoute requireAdmin><DefinitionsPage /></ProtectedRoute>} />
                    <Route path="smtp" element={<ProtectedRoute requireAdmin><SmtpSettingsPage /></ProtectedRoute>} />
                    <Route path="telegram" element={<ProtectedRoute requireAdmin><TelegramSettingsPage /></ProtectedRoute>} />
                    <Route path="notifications" element={<ProtectedRoute requireAdmin><NotificationSettingsPage /></ProtectedRoute>} />
                    <Route path="templates" element={<ProtectedRoute requireAdmin><EmailTemplatesPage /></ProtectedRoute>} />
                    <Route path="reports" element={<ProtectedRoute requireAdmin><ReportTemplatesPage /></ProtectedRoute>} />
                    <Route path="reports/edit/:id" element={<ProtectedRoute requireAdmin><ReportEditorPage /></ProtectedRoute>} />
                  </Route>

                  {/* ── BİNA TURU YÖNETİMİ ───────────────────────────── */}
                  <Route path="/bina-turu" element={<ProtectedRoute><AppLayout><BinaToruDashboard /></AppLayout></ProtectedRoute>} />
                  <Route path="/bina-turu/turler" element={<ProtectedRoute><AppLayout><BinaToruListesi /></AppLayout></ProtectedRoute>} />
                  <Route path="/bina-turu/turler/olustur" element={<ProtectedRoute><AppLayout><BinaToruOlustur /></AppLayout></ProtectedRoute>} />
                  <Route path="/bina-turu/denetim/:id" element={<ProtectedRoute><AppLayout><DenetimYap /></AppLayout></ProtectedRoute>} />
                  <Route path="/bina-turu/rapor/:id" element={<ProtectedRoute><BinaTuruRaporu /></ProtectedRoute>} />
                  <Route path="/bina-turu/yillik-rapor/:year" element={<ProtectedRoute><BinaTuruYillikRaporu /></ProtectedRoute>} />
                  <Route path="/bina-turu/uygunsuzluk-rapor/:turId" element={<ProtectedRoute><UygunsuzlukRaporu /></ProtectedRoute>} />
                  <Route path="/bina-turu/uygunsuzluk-yillik-rapor/:year" element={<ProtectedRoute><UygunsuzlukYillikRaporu /></ProtectedRoute>} />
                  <Route path="/bina-turu/uygunsuzluklar" element={<ProtectedRoute><AppLayout><UygunsuzlukTakibi /></AppLayout></ProtectedRoute>} />
                  <Route path="/bina-turu/ayarlar" element={<ProtectedRoute allowedRoles={['admin']}><AppLayout><AyarlarIndex /></AppLayout></ProtectedRoute>} />

                  {/* İSG Kontrol Listeleri */}
                  <Route path="/checklists" element={<ProtectedRoute allowedRoles={['admin','management','specialist']}><AppLayout><ChecklistDashboardPage /></AppLayout></ProtectedRoute>} />
                  <Route path="/checklists/templates" element={<ProtectedRoute allowedRoles={['admin','management','specialist']}><AppLayout><TemplateListPage /></AppLayout></ProtectedRoute>} />
                  <Route path="/checklists/templates/new" element={<ProtectedRoute allowedRoles={['admin','specialist']}><AppLayout><TemplateBuilderPage /></AppLayout></ProtectedRoute>} />
                  <Route path="/checklists/templates/:id" element={<ProtectedRoute allowedRoles={['admin','management','specialist']}><AppLayout><TemplateViewPage /></AppLayout></ProtectedRoute>} />
                  <Route path="/checklists/templates/:id/preview" element={<ProtectedRoute allowedRoles={['admin','management','specialist']}><AppLayout><TemplatePreviewPage /></AppLayout></ProtectedRoute>} />
                  <Route path="/checklists/templates/:id/edit" element={<ProtectedRoute allowedRoles={['admin','specialist']}><AppLayout><TemplateBuilderPage /></AppLayout></ProtectedRoute>} />
                  <Route path="/checklists/submissions" element={<ProtectedRoute allowedRoles={['admin','management','specialist']}><AppLayout><SubmissionListPage /></AppLayout></ProtectedRoute>} />
                  <Route path="/checklists/submissions/new" element={<ProtectedRoute allowedRoles={['admin','management','specialist']}><AppLayout><SubmissionFormPage /></AppLayout></ProtectedRoute>} />
                  <Route path="/checklists/submissions/:id" element={<ProtectedRoute allowedRoles={['admin','management','specialist']}><AppLayout><SubmissionFormPage /></AppLayout></ProtectedRoute>} />
                  <Route path="/checklists/reports" element={<ProtectedRoute allowedRoles={['admin','management']}><AppLayout><ReportsPage /></AppLayout></ProtectedRoute>} />
                  <Route path="/checklists/settings" element={<ProtectedRoute allowedRoles={['admin','management']}><AppLayout><ChecklistSettingsPage /></AppLayout></ProtectedRoute>} />


                  {/* ── Redirects ──────────────────────────────────── */}
                  <Route path="/" element={<Navigate to="/portal" replace />} />
                  <Route path="*" element={<Navigate to="/portal" replace />} />
                </Routes>
              </Router>
            </TooltipProvider>
          </ChatProvider>
        </AuthProvider>
      </ThemeProvider>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;