import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { OrganizationProvider } from './contexts/OrganizationContext';
import Sidebar from './components/Sidebar';
import OrgSwitcher from './components/OrgSwitcher';
import { LogoMark } from './components/Logo';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Challenges from './pages/Challenges';
import Gamification from './pages/Gamification';
import CompanyProfile from './pages/CompanyProfile';

const ROUTE_LABELS: Record<string, { title: string; subtitle: string }> = {
  '/dashboard':     { title: '📊 Dashboard',           subtitle: 'Resumen ejecutivo de tu organización' },
  '/students':      { title: '🎓 Integrantes',         subtitle: 'Monitorea el rendimiento del equipo' },
  '/challenges':    { title: '🏆 Retos y Desafíos',    subtitle: 'Crea metas gamificadas para tu equipo' },
  '/gamification':  { title: '🎮 Gamificación',        subtitle: 'Leaderboard, badges y records del equipo' },
  '/profile':       { title: '🏢 Perfil de Empresa',   subtitle: 'Administra los datos corporativos' },
};

function MainLayout() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebar] = useState(false);

  const matchKey = Object.keys(ROUTE_LABELS).find(k => pathname.startsWith(k)) || '/dashboard';
  const { title, subtitle } = ROUTE_LABELS[matchKey];

  const cp = user?.company_profile;
  const initials = (
    (cp?.company_name?.[0] || '') +
    (cp?.company_name?.split(' ')?.[1]?.[0] || '')
  ).toUpperCase() || user?.username?.[0]?.toUpperCase() || 'E';

  return (
    <div className="app-layout">
      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebar(false)} />

      <div className={sidebarOpen ? 'open' : ''}>
        <Sidebar onNavigate={() => setSidebar(false)} />
      </div>

      <div className="mobile-topbar">
        <button className="hamburger" onClick={() => setSidebar(!sidebarOpen)}>
          <span /><span /><span />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <LogoMark size={28} />
          <span style={{ fontWeight: 700, fontSize: 15 }}>CriptoSelf Empresa</span>
        </div>
        <div className="avatar">{initials}</div>
      </div>

      <main className="main-content">
        <div className="topbar">
          <div>
            <div className="topbar-title">{title}</div>
            <div className="topbar-subtitle">{subtitle}</div>
          </div>
          <div className="topbar-actions">
            <OrgSwitcher />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', animation: 'pulse 2s infinite' }} />
              <span className="text-sm text-secondary">Sistema activo</span>
            </div>
            <div className="avatar" style={{ cursor: 'pointer' }} onClick={() => navigate('/profile')}>
              {initials}
            </div>
          </div>
        </div>

        <Routes>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard"    element={<Dashboard />} />
          <Route path="/students"     element={<Students />} />
          <Route path="/challenges"   element={<Challenges />} />
          <Route path="/gamification" element={<Gamification />} />
          <Route path="/profile"      element={<CompanyProfile />} />
          <Route path="*"             element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return (
    <div className="loading-screen">
      <div className="spinner" />
      <p className="text-secondary" style={{ marginTop: 12 }}>Cargando...</p>
    </div>
  );
  return isAuthenticated ? <>{children}</> : <Navigate to="/auth" replace />;
}

function AuthRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return (
    <div className="loading-screen">
      <div className="spinner" />
    </div>
  );
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <AuthPage />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <OrganizationProvider>
          <Routes>
            <Route path="/auth" element={<AuthRoute />} />
            <Route path="/*" element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            } />
          </Routes>
        </OrganizationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
