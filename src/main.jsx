import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { AppProvider, useRouter, useAuth, useTheme, ROUTES, ProtectedRoute } from './router.jsx';
import DesktopSidebar from './components/DesktopSidebar.jsx';

// Páginas DARK (originales)
import App          from './App.jsx';
import Admin        from './Admin.jsx';
import Onboarding   from './Onboarding.jsx';
import Landing      from './pages/Landing.jsx';
import Login        from './pages/Login.jsx';
import Dashboard    from './pages/Dashboard.jsx';

// Páginas LIGHT (nueva versión)
import LandingLight   from './pages/LandingLight.jsx';
import LoginLight     from './pages/LoginLight.jsx';
import DashboardLight from './pages/DashboardLight.jsx';

/* ── Componente Raíz ── */
function RootRouter() {
  const { route }             = useRouter();
  const { session, activeRestaurant } = useAuth();
  const { theme }             = useTheme();

  // Páginas que muestran el sidebar de escritorio
  const isDashboard = route.startsWith(ROUTES.DASHBOARD);
  const showSidebar = isDashboard && !!session;

  // ── RUTAS LEGACY / CLIENTE ───────────────────────────────
  if (route === ROUTES.MENU) {
    return (
      <div className={theme === 'light' ? 'desktop-root light' : 'desktop-root'}>
        <App />
      </div>
    );
  }
  if (route === ROUTES.ONBOARDING)  return <Onboarding />;

  // ── Renderizado principal envuelto en desktop-root ─────────
  const renderPage = () => {
    if (route === ROUTES.LOGIN) {
      if (session) return theme === 'light' ? <DashboardLight /> : <Dashboard />;
      return theme === 'light' ? <LoginLight /> : <Login />;
    }
    if (isDashboard) {
      return (
        <ProtectedRoute>
          {theme === 'light' ? <DashboardLight /> : <Dashboard />}
        </ProtectedRoute>
      );
    }
    return theme === 'light' ? <LandingLight /> : <Landing />;
  };

  const isLanding = route === ROUTES.LANDING;

  return (
    <div className={`${theme === 'light' ? 'desktop-root light' : 'desktop-root'} ${isLanding ? 'landing-root' : ''}`}>
      {renderPage()}
    </div>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppProvider>
      <RootRouter />
    </AppProvider>
  </StrictMode>
);
