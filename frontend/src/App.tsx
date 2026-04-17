import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import SettingsLayout from './pages/settings/SettingsLayout';
import LoginPage from './pages/Login';

// Real Pages for Settings
import FacilitiesPage from './pages/settings/FacilitiesPage';
import UsersPage from './pages/settings/UsersPage';
import ParametersPage from './pages/settings/ParametersPage';
import DefinitionsPage from './pages/settings/DefinitionsPage';

const queryClient = new QueryClient();

const PanelLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex h-screen bg-background text-foreground">
    <aside className="w-64 border-r bg-card p-4">
      <h2 className="text-xl font-bold mb-8 px-2 tracking-tight">SEÇ PORTALI</h2>
      <nav className="space-y-1">
        <div className="px-2 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Menü</div>
        <a href="/panel" className="block px-2 py-2 text-sm font-medium hover:bg-accent rounded-md">Dashboard</a>
        <a href="/settings/facilities" className="block px-2 py-2 text-sm font-medium hover:bg-accent rounded-md">Sistem Ayarları</a>
      </nav>
    </aside>
    <main className="flex-1 p-8 overflow-y-auto bg-slate-50/50">
      {children}
    </main>
  </div>
);

const Dashboard = () => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      <div className="text-sm text-muted-foreground">Hoş Geldiniz, {new Date().toLocaleDateString('tr-TR')}</div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-sm font-medium text-slate-500">Aktif Tesisler</h3>
        <p className="text-3xl font-bold mt-2 text-slate-900">12</p>
      </div>
      <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-sm font-medium text-slate-500">Açık Tespit Defteri</h3>
        <p className="text-3xl font-bold mt-2 text-slate-900">45</p>
      </div>
    </div>
  </div>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            
            <Route path="/panel" element={
              <ProtectedRoute>
                <PanelLayout>
                  <Dashboard />
                </PanelLayout>
              </ProtectedRoute>
            } />

            <Route path="/settings" element={
              <ProtectedRoute requireAdmin>
                <PanelLayout>
                  <SettingsLayout />
                </PanelLayout>
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="facilities" replace />} />
              <Route path="facilities" element={<FacilitiesPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="parameters" element={<ParametersPage />} />
              <Route path="definitions" element={<DefinitionsPage />} />
            </Route>
            
            <Route path="/" element={<Navigate to="/panel" replace />} />
            <Route path="*" element={<Navigate to="/panel" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
