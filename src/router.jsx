import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { getPresetConfig } from './config/nichosConfig';

/* ═══════════════════════════════════════════════════════════
   ROUTER CONTEXT — SPA Navigation sin dependencias externas
   ═══════════════════════════════════════════════════════════ */
const RouterContext = createContext(null);

export const ROUTES = {
  LANDING:           '/',
  LOGIN:             '/login',
  DASHBOARD:         '/dashboard',
  MENU:              '/ordenar',
  ONBOARDING:        '/onboarding',
};

export function parsePath() {
  const p = window.location.pathname;
  const parts = p.split('/').filter(Boolean);
  
  // Extraer parámetros de búsqueda URL (ej: ?mesa=4&canal=salon&token=ABC12345&telefono=51981482289)
  const searchParams = new URLSearchParams(window.location.search);
  const queryPhone = searchParams.get('telefono') || searchParams.get('clientIdentifier') || searchParams.get('phone') || null;
  
  const queryParams = {
    mesa: searchParams.get('mesa') || null,
    canal: searchParams.get('canal') || null,
    token: searchParams.get('token') || null,
    telefono: queryPhone,
  };
  
  if (parts.length === 0) {
    return { slug: null, route: '/', clientIdentifier: queryPhone, queryParams };
  }
  
  // Public/static global routes
  if (['login', 'onboarding', 'superadmin'].includes(parts[0])) {
    return { slug: null, route: '/' + parts[0], clientIdentifier: null, queryParams };
  }
  
  const knownSubRoutes = ['dashboard', 'ordenar', 'pedidos', 'carta', 'finanzas', 'restaurante', 'inventario', 'marketing', 'clientes', 'premios', 'salon', 'delivery', 'modulos'];
  
  // If the first part itself is a known route (e.g., /dashboard/marketing or /dashboard)
  if (knownSubRoutes.includes(parts[0])) {
    const subRoutePath = '/' + parts.join('/');
    return { slug: null, route: subRoutePath, clientIdentifier: queryPhone, queryParams };
  }
  
  // Case 1: /[restaurantSlug]/ordenar/[clientIdentifier]
  if (parts.length >= 3 && parts[1] === 'ordenar') {
    return { slug: parts[0], route: '/ordenar', clientIdentifier: parts[2] || queryPhone, queryParams };
  }
  
  // Case 2: /[restaurantSlug]/[route]
  if (parts.length >= 2 && knownSubRoutes.includes(parts[1])) {
    const subRoutePath = '/' + parts.slice(1).join('/');
    return { slug: parts[0], route: subRoutePath, clientIdentifier: queryPhone, queryParams };
  }
  
  // Case 3: /[restaurantSlug]
  // Treat as /ordenar by default
  return { slug: parts[0], route: '/ordenar', clientIdentifier: queryPhone, queryParams };
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
  const [urlInfo, setUrlInfo]   = useState(parsePath);
  const { slug: tenantSlug, route, clientIdentifier } = urlInfo;
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

  /* ── Popstate listener for back/forward browser navigation ── */
  useEffect(() => {
    const handlePopState = () => {
      setUrlInfo(parsePath());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

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
      const { data, error } = await supabase
        .from('restaurantes')
        .select('*')
        .order('nombre');
      if (!error && data?.length) {
        setRestaurants(data);
        
        // Determinar qué restaurante activar
        const savedId = localStorage.getItem('suna_active_restaurant');
        let active = null;
        
        // 1. Priorizar si el slug de la URL coincide con alguno de los restaurantes del usuario
        if (tenantSlug) {
          active = data.find(r => r.slug === tenantSlug);
        }
        
        // 2. Si no coincide, intentar con el guardado en localStorage
        if (!active && savedId) {
          active = data.find(r => r.id === savedId);
        }
        
        // 3. Fallback al primero
        if (!active) {
          active = data[0];
        }

        setActiveRestaurant(active);
        
        // Redirigir URL si no tiene slug pero el restaurante activo tiene uno
        const currentPathInfo = parsePath();
        if (!currentPathInfo.slug && active.slug) {
          const targetRoute = currentPathInfo.route === '/' ? '/dashboard' : currentPathInfo.route;
          const browserPath = `/${active.slug}${targetRoute}`;
          window.history.pushState({}, '', browserPath);
          setUrlInfo({ slug: active.slug, route: targetRoute, clientIdentifier: null });
        }
      }
    } catch (e) {
      console.error('Error cargando restaurantes:', e);
    } finally {
      setResLoading(false);
    }
  };

  /* ── Aplicación Global Completa de Paleta y Nicho ── */
  useEffect(() => {
    if (!activeRestaurant) return;
    const presetKey = activeRestaurant.nicho_preset || 'plant_based';
    const presetConfig = getPresetConfig(presetKey);
    const paleta = presetConfig.paletaRecomendada;

    const prim = activeRestaurant.color_primario || paleta.primary;
    const sec = activeRestaurant.color_secundario || paleta.secondary;

    const root = document.documentElement;
    root.style.setProperty('--color-primary', prim, 'important');
    root.style.setProperty('--color-primary-dk', paleta.primaryDk || prim, 'important');
    root.style.setProperty('--color-secondary', sec, 'important');
    root.style.setProperty('--color-surface', paleta.surface, 'important');
    root.style.setProperty('--color-surface-2', paleta.surface2 || paleta.bg, 'important');
    root.style.setProperty('--color-surface-3', paleta.surface3, 'important');
    root.style.setProperty('--color-on-surface', paleta.text, 'important');
    root.style.setProperty('--color-muted', paleta.textMuted || '#64748B', 'important');
    root.style.setProperty('--sidebar-bg', paleta.sidebarBg, 'important');
    root.style.setProperty('--sidebar-text', paleta.sidebarText, 'important');
  }, [activeRestaurant]);

  const selectRestaurant = useCallback((restaurant) => {
    setActiveRestaurant(restaurant);
    localStorage.setItem('suna_active_restaurant', restaurant.id);
    if (restaurant.slug) {
      const browserPath = `/${restaurant.slug}${route}`;
      window.history.pushState({}, '', browserPath);
      setUrlInfo({ slug: restaurant.slug, route: route, clientIdentifier: null });
    }
  }, [route]);

  /* ── Navegación ── */
  const navigate = useCallback((newRoute) => {
    const parts = newRoute.split('/').filter(Boolean);
    let nextSlug = tenantSlug;
    let nextRoute = newRoute;
    let nextClient = null;

    if (parts.length === 0 || newRoute === '/') {
      nextSlug = null;
      nextRoute = '/';
    } else if (['login', 'onboarding'].includes(parts[0])) {
      nextSlug = null;
      nextRoute = '/' + parts[0];
    } else {
      if (parts[0] === 'ordenar' && parts[1]) {
        nextRoute = '/ordenar';
        nextClient = parts[1];
      } else {
        nextRoute = '/' + parts.join('/');
      }
    }

    const browserPath = nextSlug 
      ? `/${nextSlug}${nextRoute}${nextClient ? '/' + nextClient : ''}` 
      : nextRoute;

    window.history.pushState({}, '', browserPath);
    setUrlInfo({ slug: nextSlug, route: nextRoute, clientIdentifier: nextClient });
  }, [tenantSlug]);

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
    // Redirigir a dashboard
    navigate(ROUTES.DASHBOARD);
  }, [navigate]);

  /* ── Logout ── */
  const logout = useCallback(async () => {
    localStorage.removeItem('suna_mock_session');
    await supabase.auth.signOut();
    setSession(null);
    navigate(ROUTES.LANDING);
  }, [navigate]);

  /* ── Carga y suscripción en tiempo real de Módulos Habilitados ── */
  const [allowedModules, setAllowedModules] = useState(['inicio', 'ordenes', 'pedidos', 'carta', 'inventario', 'finanzas', 'marketing', 'clientes', 'premios', 'salon', 'delivery', 'restaurante']);

  useEffect(() => {
    if (!activeRestaurant?.id) return;

    const ALL_KEYS = ['inicio', 'ordenes', 'pedidos', 'carta', 'inventario', 'finanzas', 'marketing', 'clientes', 'premios', 'salon', 'delivery', 'restaurante'];

    const fetchAllowedModules = async () => {
      try {
        const { data } = await supabase
          .from('restaurante_modulos')
          .select('*')
          .eq('restaurante_id', activeRestaurant.id);

        if (data && data.length > 0) {
          const disabledKeys = data.filter(m => m.activo === false).map(m => m.modulo);
          const filtered = ALL_KEYS.filter(k => !disabledKeys.includes(k));
          setAllowedModules(filtered);
        } else {
          setAllowedModules(ALL_KEYS);
        }
      } catch (err) {
        setAllowedModules(ALL_KEYS);
      }
    };

    fetchAllowedModules();

    const channel = supabase.channel(`modules_${activeRestaurant.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'restaurante_modulos', filter: `restaurante_id=eq.${activeRestaurant.id}` }, () => {
        fetchAllowedModules();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeRestaurant]);

  const { queryParams } = urlInfo;
  const routerValue = { route, navigate, tenantSlug, clientIdentifier, queryParams };
  const authValue   = {
    session, authLoading, logout, loginAsDev,
    restaurants, activeRestaurant, selectRestaurant, resLoading, fetchRestaurants,
    allowedModules,
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
