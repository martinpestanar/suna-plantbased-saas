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

  // Si alguien entra a /{cualquier-negocio}/superadmin, forzar y limpiar a la ruta global /superadmin
  if (parts.length >= 2 && parts[1] === 'superadmin') {
    if (typeof window !== 'undefined' && window.history?.replaceState) {
      window.history.replaceState({}, '', '/superadmin' + (window.location.search || ''));
    }
    return { slug: null, route: '/superadmin', clientIdentifier: null, queryParams };
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
      const userId = session?.user?.id;
      const userEmail = session?.user?.email;

      if (!userId) {
        setRestaurants([]);
        setActiveRestaurant(null);
        return;
      }

      let data = [];

      const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);

      let userAssignments = [];
      if (isValidUUID) {
        // 1. Consultar a qué restaurantes/negocios está asignado este usuario en `restaurante_usuarios`
        const { data, error: assignErr } = await supabase
          .from('restaurante_usuarios')
          .select('restaurante_id, rol')
          .eq('user_id', userId);

        if (assignErr) {
          console.error('Error al consultar restaurante_usuarios:', assignErr);
        } else if (data) {
          userAssignments = data;
        }
      }

      let directIds = userAssignments?.map(a => a.restaurante_id) || [];

      // Si es una sesión mock dev o sin asignación encontrada, verificamos si es dev
      if (directIds.length === 0 && (userId === 'mock-dev-user-id' || userEmail?.includes('dev@') || userEmail?.includes('suna'))) {
        const devTarget = localStorage.getItem('suna_dev_target'); // 'santos' o 'suna'
        const isSantos = devTarget === 'santos' || tenantSlug === 'santos';
        const defaultSlug = isSantos ? 'santos' : 'suna-plant-based';
        
        const { data: devRes } = await supabase
          .from('restaurantes')
          .select('id')
          .eq('slug', defaultSlug)
          .maybeSingle();

        if (devRes) {
          directIds = [devRes.id];
        }
      }

      if (directIds.length > 0) {
        // Obtenemos los restaurantes asignados directamente
        const { data: assignedRestaurants } = await supabase
          .from('restaurantes')
          .select('*')
          .in('id', directIds);

        if (assignedRestaurants && assignedRestaurants.length > 0) {
          // Identificar las matrices de los negocios asignados
          // Si un restaurante tiene parent_id, la matriz es parent_id. Si no, su propio id es la matriz.
          const matrizIds = [...new Set(assignedRestaurants.map(r => r.parent_id || r.id))];

          // Traer la matriz y TODAS las sucursales que pertenezcan ÚNICAMENTE a esa matriz
          const { data: allBranches, error: branchesErr } = await supabase
            .from('restaurantes')
            .select('*')
            .or(`id.in.(${matrizIds.join(',')}),parent_id.in.(${matrizIds.join(',')})`)
            .order('created_at', { ascending: true });

          if (!branchesErr && allBranches && allBranches.length > 0) {
            data = allBranches;
          } else {
            data = assignedRestaurants;
          }
        }
      }

      if (data.length > 0) {
        setRestaurants(data);

        // Determinar qué sucursal activar
        const savedId = localStorage.getItem('suna_active_restaurant');
        let active = null;

        // 1. Priorizar si el slug de la URL coincide con alguna de las sucursales permitidas
        if (tenantSlug) {
          active = data.find(r => r.slug === tenantSlug);
        }

        // 2. Si no coincide, intentar con el guardado en localStorage (siempre que pertenezca a este negocio)
        if (!active && savedId) {
          active = data.find(r => r.id === savedId);
        }

        // 3. Fallback al primero (matriz)
        if (!active) {
          active = data[0];
        }

        setActiveRestaurant(active);

        // Redirigir URL si no tiene slug o si el slug actual no pertenece a las sucursales de este usuario
        const currentPathInfo = parsePath();
        const isProtectedDashboard = !['login', 'onboarding', 'superadmin'].includes(currentPathInfo.route.replace('/', ''));
        if (isProtectedDashboard && (!currentPathInfo.slug || currentPathInfo.slug !== active.slug)) {
          const targetRoute = currentPathInfo.route === '/' ? '/dashboard' : currentPathInfo.route;
          const browserPath = `/${active.slug}${targetRoute}`;
          window.history.pushState({}, '', browserPath);
          setUrlInfo({ slug: active.slug, route: targetRoute, clientIdentifier: null });
        }
      } else {
        setRestaurants([]);
        setActiveRestaurant(null);
      }
    } catch (e) {
      console.error('Error cargando restaurantes del negocio:', e);
    } finally {
      setResLoading(false);
    }
  };

  /* ── Aplicación Global Completa de Paleta Clean Light ── */
  useEffect(() => {
    const root = document.documentElement;

    // Colores limpios estándar Clean Light 2026
    const primary = '#059669';
    const primaryDk = '#047857';
    const secondary = '#10B981';
    const accent = '#ECFDF5';

    root.style.setProperty('--color-primary', primary, 'important');
    root.style.setProperty('--color-primary-dk', primaryDk, 'important');
    root.style.setProperty('--color-secondary', secondary, 'important');
    root.style.setProperty('--color-accent', accent, 'important');
    root.style.setProperty('--color-surface', '#FFFFFF', 'important');
    root.style.setProperty('--color-surface-2', '#F8FAFC', 'important');
    root.style.setProperty('--color-surface-3', '#E2E8F0', 'important');
    root.style.setProperty('--color-on-surface', '#0F172A', 'important');
    root.style.setProperty('--color-muted', '#64748B', 'important');
    root.style.setProperty('--sidebar-bg', '#FFFFFF', 'important');
    root.style.setProperty('--sidebar-text', '#0F172A', 'important');
    root.style.setProperty('--dock-bg', 'rgba(255, 255, 255, 0.92)', 'important');
    root.style.setProperty('--dock-border', 'rgba(226, 232, 240, 0.85)', 'important');
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
    const [pathPart, queryPart] = newRoute.split('?');
    const parts = pathPart.split('/').filter(Boolean);
    let nextSlug = tenantSlug;
    let nextRoute = pathPart;
    let nextClient = null;

    if (parts.length === 0 || pathPart === '/') {
      nextSlug = null;
      nextRoute = '/';
    } else if (['login', 'onboarding', 'superadmin'].includes(parts[0])) {
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

    const baseBrowserPath = nextSlug 
      ? `/${nextSlug}${nextRoute}${nextClient ? '/' + nextClient : ''}` 
      : nextRoute;

    const browserPath = queryPart ? `${baseBrowserPath}?${queryPart}` : baseBrowserPath;

    window.history.pushState({}, '', browserPath);
    setUrlInfo(parsePath());
  }, [tenantSlug]);

  /* ── Dev Login Bypass ── */
  const loginAsDev = useCallback((target = 'suna') => {
    const isSantos = target === 'santos';
    const mockSession = {
      user: {
        id: isSantos ? '7500b39d-9a67-4a47-b451-c373ac3d3b6f' : 'de2387cf-1e22-4e65-9be6-d3913b208cdc',
        email: isSantos ? 'santos@suna.app' : 'demo@sunagreen.com',
      },
      access_token: 'mock-dev-token',
    };
    localStorage.setItem('suna_mock_session', JSON.stringify(mockSession));
    localStorage.setItem('suna_dev_target', isSantos ? 'santos' : 'suna');
    localStorage.removeItem('suna_active_restaurant');
    setSession(mockSession);
    const targetSlug = isSantos ? 'santos' : 'suna-plant-based';
    navigate(`/${targetSlug}/dashboard`);
  }, [navigate]);

  /* ── Logout ── */
  const logout = useCallback(async () => {
    localStorage.removeItem('suna_mock_session');
    localStorage.removeItem('suna_active_restaurant');
    localStorage.removeItem('suna_dev_target');
    await supabase.auth.signOut();
    setSession(null);
    setRestaurants([]);
    setActiveRestaurant(null);
    navigate(ROUTES.LANDING);
  }, [navigate]);

  /* ── Carga y suscripción en tiempo real de Módulos Habilitados ── */
  const ALL_KEYS = ['inicio', 'ordenes', 'pedidos', 'carta', 'inventario', 'finanzas', 'marketing', 'clientes', 'premios', 'salon', 'delivery', 'metricas', 'modulos', 'restaurante'];
  const [allowedModules, setAllowedModules] = useState(ALL_KEYS);

  useEffect(() => {
    if (!activeRestaurant?.id) return;

    // Mapa de módulos de la BD (restaurante_modulos.modulo) a los tabs/módulos de la UI
    const DB_TO_NAV_MAP = {
      pedidos: ['pedidos'],
      carta: ['carta'],
      inventario: ['inventario'],
      fidelizacion: ['clientes', 'premios'],
      delivery: ['delivery'],
      marketing: ['marketing'],
      reservas: ['salon'],
      finanzas: ['finanzas'],
      metricas: ['metricas'],
      modulos: ['modulos'],
    };

    const fetchAllowedModules = async () => {
      try {
        const { data, error } = await supabase
          .from('restaurante_modulos')
          .select('*')
          .eq('restaurante_id', activeRestaurant.id);

        if (!error && data && data.length > 0) {
          const disabledTabs = new Set();
          data.forEach(m => {
            if (m.activo === false) {
              const mapped = DB_TO_NAV_MAP[m.modulo] || [m.modulo];
              mapped.forEach(tab => disabledTabs.add(tab));
            }
          });
          const filtered = ALL_KEYS.filter(k => !disabledTabs.has(k));
          setAllowedModules(filtered);
        } else {
          setAllowedModules(ALL_KEYS);
        }
      } catch (err) {
        console.error('Error fetching allowed modules:', err);
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
  }, [activeRestaurant?.id]);

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
