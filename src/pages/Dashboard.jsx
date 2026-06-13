import { useState, useEffect, useRef } from 'react';
import { useAuth, useRouter } from '../router.jsx';
import { GrAd } from 'react-icons/gr';
import Admin from '../Admin.jsx';
import DashboardHome    from './dashboard/DashboardHome.jsx';
import DashboardCarta   from './dashboard/DashboardCarta.jsx';
import DashboardMetricas from './dashboard/DashboardMetricas.jsx';
import DashboardInventario from './dashboard/DashboardInventario.jsx';
import DashboardMarketing from './dashboard/DashboardMarketing.jsx';

/* ── Iconos Bottom Nav ── */
const IcoHome = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'var(--color-primary)' : 'none'}
    stroke={active ? 'var(--color-primary)' : 'var(--color-muted)'} strokeWidth="2" strokeLinecap="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);
const IcoPedidos = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke={active ? 'var(--color-primary)' : 'var(--color-muted)'} strokeWidth="2" strokeLinecap="round">
    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
    <rect x="9" y="3" width="6" height="4" rx="2"/>
    <line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>
  </svg>
);
const IcoCarta = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke={active ? 'var(--color-primary)' : 'var(--color-muted)'} strokeWidth="2" strokeLinecap="round">
    <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
  </svg>
);
const IcoMetricas = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke={active ? 'var(--color-primary)' : 'var(--color-muted)'} strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" height="14"/>
  </svg>
);
const IcoInventario = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke={active ? 'var(--color-primary)' : 'var(--color-muted)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
  </svg>
);
const IcoMarketing = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke={active ? 'var(--color-primary)' : 'var(--color-muted)'} strokeWidth="2" strokeLinecap="round">
    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
  </svg>
);
const IcoMore = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke={active ? 'var(--color-primary)' : 'var(--color-muted)'} strokeWidth="2.5" strokeLinecap="round">
    <circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/><circle cx="5" cy="12" r="1.5"/>
  </svg>
);

const MOBILE_TABS = [
  { id: 'inicio',     label: 'Inicio',      Icon: IcoHome },
  { id: 'pedidos',    label: 'Pedidos',     Icon: IcoPedidos },
  { id: 'carta',      label: 'Carta',       Icon: IcoCarta },
];

const TABS = [
  { id: 'inicio',     label: 'Inicio',      Icon: IcoHome },
  { id: 'pedidos',    label: 'Pedidos',     Icon: IcoPedidos },
  { id: 'carta',      label: 'Carta',       Icon: IcoCarta },
  { id: 'inventario', label: 'Inventario',  Icon: IcoInventario },
  { id: 'marketing',  label: 'Marketing',   Icon: IcoMarketing },
  { id: 'metricas',   label: 'Métricas',    Icon: IcoMetricas },
];

/* ── Selector de Restaurante (Multi-Tenant) ── */
function RestaurantPicker({ open, onClose, restaurants, active, onSelect }) {
  if (!open) return null;
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 60,
      background: 'rgba(15,26,21,0.72)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'flex-end',
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        width: '100%', background: 'var(--color-surface)',
        borderRadius: '28px 28px 0 0',
        padding: '20px 20px 32px',
        animation: 'sheet-up 350ms cubic-bezier(0.34,1.56,0.64,1) both',
      }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--color-surface-3)', margin: '0 auto 20px' }}/>
        <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 16, fontWeight: 800, color: 'var(--color-on-surface)', marginBottom: 16 }}>
          Seleccionar Restaurante
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '55vh', overflowY: 'auto' }}>
          {restaurants.map(r => (
            <button key={r.id}
              onClick={() => { onSelect(r); onClose(); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                background: active?.id === r.id ? 'var(--color-accent)' : 'var(--color-surface-2)',
                border: `1.5px solid ${active?.id === r.id ? 'var(--color-secondary)' : 'var(--color-surface-3)'}`,
                borderRadius: 16, cursor: 'pointer', textAlign: 'left',
                transition: 'all 150ms',
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: active?.id === r.id ? 'var(--color-clay)' : 'var(--color-surface-3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                border: active?.id === r.id ? '1px solid var(--color-surface-3)' : 'none'
              }}>
                <GrAd style={{ fontSize: 20, color: active?.id === r.id ? 'var(--color-primary)' : 'var(--color-muted)' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-on-surface)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.nombre}</p>
                {r.direccion && <p style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.direccion}</p>}
              </div>
              {active?.id === r.id && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Clock ── */
function Clock() {
  const [t, setT] = useState('');
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setT(`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`);
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);
  return <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 12 }}>{t}</span>;
}

/* ═══════════════════════════════════════════════════════════
   DASHBOARD — Shell Multi-Módulo
   ═══════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const { session, logout, restaurants, activeRestaurant, selectRestaurant, resLoading } = useAuth();
  const { route, navigate } = useRouter();
  
  const getTabFromRoute = (r) => {
    if (r.startsWith('/dashboard/pedidos'))    return 'pedidos';
    if (r.startsWith('/dashboard/carta'))      return 'carta';
    if (r.startsWith('/dashboard/inventario')) return 'inventario';
    if (r.startsWith('/dashboard/marketing'))  return 'marketing';
    if (r.startsWith('/dashboard/metricas'))   return 'metricas';
    return 'inicio';
  };

  const activeTab = getTabFromRoute(route);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const prevTab = useRef('inicio');
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 900);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 900);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!resLoading && restaurants.length > 1 && !activeRestaurant) {
      setPickerOpen(true);
    }
  }, [resLoading, restaurants, activeRestaurant]);

  const switchTab = (id) => {
    if (navigator.vibrate) navigator.vibrate(5);
    prevTab.current = activeTab;
    if (id === 'inicio') {
      navigate('/dashboard');
    } else {
      navigate(`/dashboard/${id}`);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'inicio':   return <DashboardHome onNavigate={switchTab}/>;
      case 'pedidos':  return <Admin key={activeRestaurant?.id}/>;
      case 'carta':    return <DashboardCarta/>;
      case 'inventario': return <DashboardInventario/>;
      case 'marketing':  return <DashboardMarketing/>;
      case 'metricas': return <DashboardMetricas/>;
      default:         return <DashboardHome onNavigate={switchTab}/>;
    }
  };

  // VISTA ESCRITORIO PREMIUM
  if (isDesktop) {
    return (
      <div className="dashboard-shell" style={{ width: '100vw', height: '100vh', display: 'flex', background: 'var(--color-surface-2)', overflow: 'hidden' }}>
        <DesktopSidebar 
          restaurant={activeRestaurant} 
          activeTab={activeTab} 
          onTabSelect={switchTab} 
          onLogout={logout} 
        />
        
        <div className="desktop-main-layout">
          {/* Topbar */}
          <header className="desktop-header-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 18, fontWeight: 900, color: 'var(--color-on-surface)' }}>
                {TABS.find(t => t.id === activeTab)?.label || 'Dashboard'}
              </h2>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {/* Branch Picker */}
              <button
                onClick={() => restaurants.length > 0 && setPickerOpen(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: 'var(--color-surface)', border: '1px solid var(--color-surface-3)',
                  borderRadius: 12, padding: '8px 14px', cursor: 'pointer',
                  fontSize: 13, fontWeight: 700, color: 'var(--color-on-surface)',
                  transition: 'all 150ms'
                }}
              >
                🏢 {activeRestaurant?.nombre || 'Seleccionar sucursal'} ▾
              </button>
              
              <Clock />
            </div>
          </header>

          {/* Area de contenido responsivo */}
          <main className="desktop-content-area">
            <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }} className="animate-fade-up">
              {renderContent()}
            </div>
          </main>
        </div>

        {/* Picker modal */}
        <RestaurantPicker
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          restaurants={restaurants}
          active={activeRestaurant}
          onSelect={selectRestaurant}
        />
      </div>
    );
  }

  // VISTA MÓVIL CLÁSICA
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifySelf: 'center' }}>
      <div className="app-shell dashboard-shell no-select" style={{ maxWidth: 'none', width: '100%', height: '100%', borderRadius: 0, boxShadow: 'none' }}>

        {/* ── STATUS BAR ── */}
        <div className="status-bar">
          <Clock />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="14" height="10" viewBox="0 0 14 10" fill="currentColor" opacity="0.7">
              <rect x="0" y="4" width="2" height="6" rx="1"/>
              <rect x="3" y="2.5" width="2" height="7.5" rx="1"/>
              <rect x="6" y="1" width="2" height="9" rx="1"/>
              <rect x="9" y="0" width="2" height="10" rx="1"/>
            </svg>
            <svg width="18" height="10" viewBox="0 0 18 10" fill="none">
              <rect x="0.5" y="0.5" width="15" height="9" rx="2" stroke="currentColor" strokeOpacity="0.6"/>
              <rect x="16" y="3" width="2" height="4" rx="1" fill="currentColor" fillOpacity="0.5"/>
              <rect x="1.5" y="1.5" width="11" height="7" rx="1.5" fill="currentColor" fillOpacity="0.7"/>
            </svg>
          </div>
        </div>

        {/* ── HEADER ── */}
        <div className="shell-header" style={{ padding: '10px 20px 14px', borderBottom: '1px solid var(--color-surface-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

            {/* Restaurant Selector */}
            <button
              onClick={() => restaurants.length > 0 && setPickerOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'var(--color-surface-2)', border: '1.5px solid var(--color-surface-3)',
                borderRadius: 16, padding: '8px 12px', cursor: 'pointer',
                flex: 1, minWidth: 0, marginRight: 10,
                transition: 'background 150ms',
              }}
              onMouseDown={e => { e.currentTarget.style.background = 'var(--color-clay)'; }}
              onMouseUp={e => { e.currentTarget.style.background = 'var(--color-surface-2)'; }}
            >
              <div style={{
                width: 34, height: 34, borderRadius: 10, background: 'var(--color-clay)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                border: '1px solid var(--color-surface-3)'
              }}>
                <GrAd style={{ fontSize: 18, color: 'var(--color-primary)', animation: 'vibrate-slow 3s infinite ease-in-out' }} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{
                  fontFamily: 'Outfit, sans-serif', fontSize: 13, fontWeight: 800,
                  color: 'var(--color-on-surface)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {resLoading ? 'Cargando...' : (activeRestaurant?.nombre ?? 'Seleccionar restaurante')}
                </p>
                {restaurants.length > 1 && (
                  <p style={{ fontSize: 10, color: 'var(--color-secondary)', fontWeight: 700 }}>
                    {restaurants.length} sucursales · Cambiar ▾
                  </p>
                )}
              </div>
            </button>

            {/* Avatar + logout */}
            <button
              onClick={logout}
              title="Cerrar sesión"
              style={{
                width: 40, height: 40, borderRadius: 14,
                background: 'var(--color-surface-2)', border: '1.5px solid var(--color-surface-3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                color: 'var(--color-muted)', flexShrink: 0, transition: 'all 150ms',
              }}
              onMouseDown={e => { e.currentTarget.style.background = 'var(--color-clay)'; }}
              onMouseUp={e => { e.currentTarget.style.background = 'var(--color-surface-2)'; }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </div>

        {/* ── CONTENT ── */}
        <div className="shell-content">
          <div key={activeTab} className="animate-fade-up">
            {activeTab === 'pedidos' ? renderContent() : (
              <div style={{ padding: '20px 20px 40px' }}>
                {renderContent()}
              </div>
            )}
          </div>
        </div>

        {/* ── BOTTOM NAV ── */}
        <div className="shell-nav" style={{ background: 'transparent' }}>
          <div className="bottom-nav" style={{
            gap: 0,
            margin: '8px 16px calc(6px + env(safe-area-inset-bottom))',
            borderRadius: '24px',
            background: 'rgba(27, 45, 36, 0.9)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 8px 32px rgba(10, 20, 15, 0.5)',
            padding: '8px 12px',
          }}>
            {MOBILE_TABS.map(({ id, label, Icon }) => {
              const active = activeTab === id;
              return (
                <button key={id} className="nav-item" onClick={() => { switchTab(id); setMoreOpen(false); }}>
                  <div
                    className={`nav-pill ${active ? 'active' : 'inactive'}`}
                    style={{ position: 'relative', color: active ? 'var(--color-primary)' : 'var(--color-muted)' }}
                  >
                    <Icon active={active}/>
                    {/* Badge para Pedidos */}
                    {id === 'pedidos' && pendingCount > 0 && (
                      <span style={{
                        position: 'absolute', top: 2, right: 2,
                        width: 8, height: 8, borderRadius: '50%',
                        background: 'var(--color-danger)',
                        border: '2px solid var(--color-surface)',
                        animation: 'pulse-dot 2s ease-in-out infinite',
                      }}/>
                    )}
                  </div>
                  <span className={`nav-label ${active ? 'active' : 'inactive'}`} style={{ color: active ? 'var(--color-accent)' : 'var(--color-muted)' }}>{label}</span>
                </button>
              );
            })}
            
            {/* Botón Más */}
            <button className="nav-item" onClick={() => setMoreOpen(true)}>
              <div className="nav-pill inactive" style={{ color: 'var(--color-muted)' }}>
                <IcoMore active={false}/>
              </div>
              <span className="nav-label inactive" style={{ color: 'var(--color-muted)' }}>Más</span>
            </button>
          </div>
          <div className="home-indicator" style={{ background: 'transparent' }}>
            <div className="home-indicator-bar" style={{ background: 'rgba(255,255,255,0.15)' }}/>
          </div>
        </div>

        {/* ── BOTTOM SHEET MÁS ── */}
        {moreOpen && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 70,
            background: 'rgba(15,26,21,0.72)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'flex-end',
          }} onClick={e => { if (e.target === e.currentTarget) setMoreOpen(false); }}>
            <div style={{
              width: '100%', background: 'var(--color-surface)',
              borderRadius: '28px 28px 0 0',
              padding: '20px 20px 32px',
              animation: 'sheet-up 350ms cubic-bezier(0.34,1.56,0.64,1) both',
              boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 14
            }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--color-surface-3)', margin: '0 auto 6px' }}/>
              <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 16, fontWeight: 900, color: 'var(--color-on-surface)', marginBottom: 6 }}>
                Más Módulos
              </p>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 10,
                marginTop: 6
              }}>
                {[
                  { id: 'inventario', label: 'Inventario', icon: '📦', desc: 'Insumos' },
                  { id: 'marketing',  label: 'Marketing',   icon: '🚀', desc: 'Copiloto' },
                  { id: 'metricas',   label: 'Métricas',    icon: '📊', desc: 'Ventas' },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => { switchTab(item.id); setMoreOpen(false); }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      padding: '16px 8px',
                      background: 'var(--color-surface-2)',
                      border: '1px solid var(--color-surface-3)',
                      borderRadius: 18,
                      cursor: 'pointer',
                      textAlign: 'center',
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                      transition: 'all 150ms',
                    }}
                    onMouseDown={e => { e.currentTarget.style.background = 'var(--color-surface-3)'; }}
                    onMouseUp={e => { e.currentTarget.style.background = 'var(--color-surface-2)'; }}
                  >
                    <span style={{ fontSize: 24 }}>{item.icon}</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <p style={{ fontSize: 12, fontWeight: 800, color: 'var(--color-on-surface)', margin: 0 }}>{item.label}</p>
                      <p style={{ fontSize: 9, color: 'var(--color-muted)', margin: 0 }}>{item.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                style={{
                  width: '100%', padding: '12px', background: 'none', border: '1px solid var(--color-surface-3)',
                  borderRadius: 14, color: 'var(--color-muted)', fontSize: 12, fontWeight: 700, cursor: 'pointer', marginTop: 6
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        {/* ── RESTAURANT PICKER SHEET ── */}
        <RestaurantPicker
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          restaurants={restaurants}
          active={activeRestaurant}
          onSelect={selectRestaurant}
        />
      </div>
    </div>
  );
}
