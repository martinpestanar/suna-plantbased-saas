import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';

/* ═══════════════════════════════════════════════════════════
   ROUTER CONTEXT — SPA Navigation sin dependencias externas
   ═══════════════════════════════════════════════════════════ */
const RouterContext = createContext(null);

export const ROUTES = {
  LANDING:           '/',
  LOGIN:             '/login',
  DASHBOARD:         '/dashboard',
  MENU:              '/menu',
  ONBOARDING:        '/onboarding',
};

function getInitialRoute() {
  const p = window.location.pathname;
  if (p.startsWith('/dashboard'))       return '/dashboard';
  if (p.startsWith('/login'))           return '/login';
  if (p.startsWith('/menu'))            return '/menu';
  if (p.startsWith('/onboarding'))      return '/onboarding';
  return '/';
}

/* ═══════════════════════════════════════════════════════════
   THEME CONTEXT
   ═══════════════════════════════════════════════════════════ */
const ThemeContext = createContext(null);

/* ═══════════════════════════════════════════════════════════
   AUTH + RESTAURANT CONTEXT (Multi-Tenant)
   ═══════════════════════════════════════════════════════════ */
const AuthContext = createContext(null);

export function AppProvider({ children }) {
  const [route, setRoute]       = useState(getInitialRoute);
  const [session, setSession]   = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // Tema global
  const [theme, setTheme] = useState(() => localStorage.getItem('suna_theme') || 'light');

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const n = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('suna_theme', n);
      return n;
    });
  }, []);

  // Multi-tenant: restaurante seleccionado actualmente
  const [restaurants, setRestaurants]   = useState([]);
  const [activeRestaurant, setActiveRestaurant] = useState(null);
  const [resLoading, setResLoading]     = useState(false);

  /* ── Sesión Supabase ── */
  useEffect(() => {
    const savedMock = localStorage.getItem('suna_mock_session');
    if (savedMock) {
      try {
        setSession(JSON.parse(savedMock));
        setAuthLoading(false);
        return;
      } catch (e) {
        localStorage.removeItem('suna_mock_session');
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const hasMock = localStorage.getItem('suna_mock_session');
      if (hasMock && !session) return;
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  /* ── Carga restaurantes del usuario logueado (multi-tenant) ── */
  useEffect(() => {
    if (!session) { setRestaurants([]); setActiveRestaurant(null); return; }
    fetchRestaurants();
  }, [session]);

  const fetchRestaurants = async () => {
    setResLoading(true);
    try {
      // Asumimos tabla restaurantes con columna admin_user_id o una tabla pivote
      // Fallback: traer todos si el sistema aún no tiene RLS por usuario
      const { data, error } = await supabase
        .from('restaurantes')
        .select('*')
        .order('nombre');
      if (!error && data?.length) {
        setRestaurants(data);
        // Restaurar último restaurante seleccionado desde localStorage
        const savedId = localStorage.getItem('suna_active_restaurant');
        const found = savedId ? data.find(r => r.id === savedId) : null;
        setActiveRestaurant(found ?? data[0]);
      }
    } catch (e) {
      console.error('Error cargando restaurantes:', e);
    } finally {
      setResLoading(false);
    }
  };

  const selectRestaurant = useCallback((restaurant) => {
    setActiveRestaurant(restaurant);
    localStorage.setItem('suna_active_restaurant', restaurant.id);
  }, []);

  /* ── Navegación ── */
  const navigate = useCallback((newRoute) => {
    setRoute(newRoute);
    window.history.pushState({}, '', newRoute);
  }, []);

  /* ── Dev Login Bypass ── */
  const loginAsDev = useCallback(() => {
    const mockSession = {
      user: {
        id: 'mock-dev-user-id',
        email: 'dev@suna.com',
      },
      access_token: 'mock-dev-token',
    };
    localStorage.setItem('suna_mock_session', JSON.stringify(mockSession));
    setSession(mockSession);
    navigate(ROUTES.DASHBOARD);
  }, [navigate]);

  /* ── Logout ── */
  const logout = useCallback(async () => {
    localStorage.removeItem('suna_mock_session');
    await supabase.auth.signOut();
    setSession(null);
    navigate(ROUTES.LANDING);
  }, [navigate]);

  const routerValue = { route, navigate };
  const authValue   = {
    session, authLoading, logout, loginAsDev,
    restaurants, activeRestaurant, selectRestaurant, resLoading, fetchRestaurants,
  };
  const themeValue  = { theme, toggleTheme };

  return (
    <ThemeContext.Provider value={themeValue}>
      <RouterContext.Provider value={routerValue}>
        <AuthContext.Provider value={authValue}>
          {children}
        </AuthContext.Provider>
      </RouterContext.Provider>
    </ThemeContext.Provider>
  );
}

/* ── Hooks públicos ── */
export const useRouter = () => useContext(RouterContext);
export const useAuth   = () => useContext(AuthContext);
export const useTheme  = () => useContext(ThemeContext);

/* ═══════════════════════════════════════════════════════════
   PROTECTED ROUTE — Redirige a /login si no hay sesión
   ═══════════════════════════════════════════════════════════ */
export function ProtectedRoute({ children }) {
  const { session, authLoading } = useAuth();
  const { navigate } = useRouter();

  useEffect(() => {
    if (!authLoading && !session) {
      navigate(ROUTES.LOGIN);
    }
  }, [session, authLoading, navigate]);

  if (authLoading) {
    return (
      <div style={{
        width: '100%', height: '100dvh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: '#0F1A15', flexDirection: 'column', gap: 16,
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 14,
          background: '#1B4332', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, color: '#D8F3DC', fontSize: 22 }}>S</span>
        </div>
        <div style={{
          width: 28, height: 28, border: '3px solid rgba(216,243,220,0.2)',
          borderTopColor: '#40916C', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
      </div>
    );
  }

  if (!session) return null;
  return children;
}
