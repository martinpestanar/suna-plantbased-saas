import { useState, useEffect, useRef } from 'react';
import { useAuth, useRouter } from '../router.jsx';
import { supabase } from '../supabaseClient.js';
import { GrAd } from 'react-icons/gr';
import Admin from '../Admin.jsx';
import DashboardHome     from './dashboard/DashboardHome.jsx';
import DashboardCarta    from './dashboard/DashboardCarta.jsx';
import DashboardMetricas from './dashboard/DashboardMetricas.jsx';
import DashboardInventario from './dashboard/DashboardInventario.jsx';
import DashboardMarketing from './dashboard/DashboardMarketing.jsx';
import DesktopSidebar from '../components/DesktopSidebar.jsx';


/* ── Iconos Bottom Nav (reutilizados, colores adaptados vía prop) ── */
const IcoHome = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24"
    fill={active ? '#1B4332' : 'none'}
    stroke={active ? '#1B4332' : '#8A8070'} strokeWidth="2" strokeLinecap="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);
const IcoPedidos = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke={active ? '#1B4332' : '#8A8070'} strokeWidth="2" strokeLinecap="round">
    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
    <rect x="9" y="3" width="6" height="4" rx="2"/>
    <line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>
  </svg>
);
const IcoCarta = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke={active ? '#1B4332' : '#8A8070'} strokeWidth="2" strokeLinecap="round">
    <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
  </svg>
);
const IcoMetricas = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke={active ? '#1B4332' : '#8A8070'} strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
);
const IcoInventario = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke={active ? '#1B4332' : '#8A8070'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
  </svg>
);
const IcoMarketing = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke={active ? '#1B4332' : '#8A8070'} strokeWidth="2" strokeLinecap="round">
    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
  </svg>
);

const IcoMore = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke={active ? '#1B4332' : '#8A8070'} strokeWidth="2.5" strokeLinecap="round">
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

/* ── Selector de Restaurante ── */
function RestaurantPickerLight({ open, onClose, restaurants, active, onSelect }) {
  if (!open) return null;
  return (
    <div
      style={{
        position: 'absolute', inset: 0, zIndex: 60,
        background: 'rgba(45,42,38,0.4)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'flex-end',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: '100%', background: '#fff',
        borderRadius: '24px 24px 0 0',
        padding: '20px 20px 32px',
        animation: 'sheet-up 350ms cubic-bezier(0.34,1.56,0.64,1) both',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.1)',
      }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: '#EBE7DC', margin: '0 auto 18px' }}/>
        <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 16, fontWeight: 800, color: '#2D2A26', marginBottom: 14 }}>
          Seleccionar Restaurante
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '55vh', overflowY: 'auto' }}>
          {restaurants.map(r => (
            <button key={r.id}
              onClick={() => { onSelect(r); onClose(); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                background: active?.id === r.id ? '#EBF5EF' : '#F5F2EB',
                border: `1.5px solid ${active?.id === r.id ? '#40916C' : '#EBE7DC'}`,
                borderRadius: 14, cursor: 'pointer', textAlign: 'left',
                transition: 'all 150ms',
              }}
            >
              <div style={{
                width: 38, height: 38, borderRadius: 11,
                background: active?.id === r.id ? '#F5F2EA' : '#EBE7DC',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                border: active?.id === r.id ? '1px solid #EBE7DC' : 'none'
              }}>
                <GrAd style={{ fontSize: 18, color: active?.id === r.id ? '#1B4332' : '#8A8070' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#2D2A26', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.nombre}</p>
                {r.direccion && <p style={{ fontSize: 11, color: '#8A8070', fontWeight: 600, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.direccion}</p>}
              </div>
              {active?.id === r.id && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1B4332" strokeWidth="2.5" strokeLinecap="round">
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
  return <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 12, color: '#2D2A26' }}>{t}</span>;
}

/* ═══════════════════════════════════════════════════════════
   DASHBOARD LIGHT — Shell con tema claro
   ═══════════════════════════════════════════════════════════ */
export default function DashboardLight() {
  const { restaurants, activeRestaurant, selectRestaurant, resLoading } = useAuth();
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
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 900);
  const [moreOpen, setMoreOpen] = useState(false);

  // Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

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

  // VISTA ESCRITORIO LIGHT PREMIUM
  if (isDesktop) {
    return (
      <div className="dashboard-shell" style={{ width: '100vw', height: '100vh', display: 'flex', background: 'var(--color-surface-2)', overflow: 'hidden' }}>
        <DesktopSidebar 
          restaurant={activeRestaurant} 
          activeTab={activeTab} 
          onTabSelect={switchTab} 
          onLogout={handleLogout} 
        />
        
        <div className="desktop-main-layout">
          {/* Topbar */}
          <header className="desktop-header-bar" style={{ background: '#FCFBF9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 18, fontWeight: 900, color: '#2D2A26' }}>
                {TABS.find(t => t.id === activeTab)?.label || 'Dashboard'}
              </h2>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {/* Branch Picker */}
              <button
                onClick={() => restaurants.length > 0 && setPickerOpen(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: '#fff', border: '1px solid #EBE7DC',
                  borderRadius: 12, padding: '8px 14px', cursor: 'pointer',
                  fontSize: 13, fontWeight: 700, color: '#2D2A26',
                  transition: 'all 150ms'
                }}
              >
                🏢 {activeRestaurant?.nombre || 'Seleccionar sucursal'} ▾
              </button>
              
              <Clock />
            </div>
          </header>

          {/* Area de contenido responsivo */}
          <main className="desktop-content-area" style={{ background: '#FCFBF9' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }} className="animate-fade-up">
              {renderContent()}
            </div>
          </main>
        </div>

        {/* Picker modal */}
        <RestaurantPickerLight
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          restaurants={restaurants}
          active={activeRestaurant}
          onSelect={selectRestaurant}
        />
      </div>
    );
  }

  // Override: usar --color-surface = #FCFBF9 que ya está en el design system (versión light nativa)
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#EBE7DC' }}>
      <div
        className="app-shell dashboard-shell no-select animate-fade-up"
        style={{
          position: 'relative',
          width: '100%',
          height: '100dvh',
          display: 'flex', flexDirection: 'column',
          background: '#FCFBF9',
          overflow: 'hidden',
        }}
      >

        {/* STATUS BAR */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 22px 0', flexShrink: 0,
        }}>
          <Clock/>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#2D2A26' }}>
            <svg width="14" height="10" viewBox="0 0 14 10" fill="#2D2A26" opacity="0.5">
              <rect x="0" y="4" width="2" height="6" rx="1"/>
              <rect x="3" y="2.5" width="2" height="7.5" rx="1"/>
              <rect x="6" y="1" width="2" height="9" rx="1"/>
              <rect x="9" y="0" width="2" height="10" rx="1"/>
            </svg>
            <svg width="18" height="10" viewBox="0 0 18 10" fill="none">
              <rect x="0.5" y="0.5" width="15" height="9" rx="2" stroke="#2D2A26" strokeOpacity="0.4"/>
              <rect x="16" y="3" width="2" height="4" rx="1" fill="#2D2A26" fillOpacity="0.4"/>
              <rect x="1.5" y="1.5" width="11" height="7" rx="1.5" fill="#2D2A26" fillOpacity="0.6"/>
            </svg>
          </div>
        </div>

        {/* HEADER */}
        <div style={{
          padding: '10px 20px 14px', flexShrink: 0,
          borderBottom: '1px solid #EBE7DC', background: '#FCFBF9',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Restaurant selector */}
            <button
              onClick={() => restaurants.length > 0 && setPickerOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: '#fff', border: '1.5px solid #EBE7DC',
                borderRadius: 14, padding: '8px 12px', cursor: 'pointer',
                flex: 1, minWidth: 0, marginRight: 8,
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                transition: 'background 150ms',
              }}
              onMouseDown={e => { e.currentTarget.style.background = '#F5F2EB'; }}
              onMouseUp={e => { e.currentTarget.style.background = '#fff'; }}
            >
              <div style={{
                width: 34, height: 34, borderRadius: 10, background: '#F5F2EA',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                border: '1px solid #EBE7DC'
              }}>
                <GrAd style={{ fontSize: 18, color: '#1B4332', animation: 'vibrate-slow 3s infinite ease-in-out' }} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{
                  fontFamily: 'Outfit, sans-serif', fontSize: 13, fontWeight: 800,
                  color: '#2D2A26', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {resLoading ? 'Cargando...' : (activeRestaurant?.nombre ?? 'Seleccionar restaurante')}
                </p>
                {restaurants.length > 1 && (
                  <p style={{ fontSize: 10, color: '#40916C', fontWeight: 700 }}>
                    {restaurants.length} sucursales · Cambiar ▾
                  </p>
                )}
              </div>
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              title="Cerrar sesión"
              style={{
                width: 40, height: 40, borderRadius: 12,
                background: '#fff', border: '1.5px solid #EBE7DC',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                color: '#8A8070', flexShrink: 0,
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                transition: 'all 150ms',
              }}
              onMouseDown={e => { e.currentTarget.style.background = '#F5F2EB'; }}
              onMouseUp={e => { e.currentTarget.style.background = '#fff'; }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', position: 'relative' }}>
          <div key={activeTab} className="animate-fade-up">
            {activeTab === 'pedidos' ? renderContent() : (
              <div style={{ padding: '20px 20px 40px' }}>
                {renderContent()}
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM NAV */}
        <div style={{
          flexShrink: 0, background: 'transparent',
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-around', alignItems: 'center',
            padding: '8px 12px',
            margin: '8px 16px calc(6px + env(safe-area-inset-bottom))',
            borderRadius: '24px',
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(20px)',
            border: '1.5px solid #EBE7DC',
            boxShadow: '0 8px 32px rgba(138, 128, 112, 0.12)',
          }}>
            {MOBILE_TABS.map(({ id, label, Icon }) => {
              const active = activeTab === id;
              return (
                <button key={id}
                  onClick={() => { switchTab(id); setMoreOpen(false); }}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    flex: 1, cursor: 'pointer', padding: '4px 0',
                    border: 'none', background: 'transparent',
                  }}
                >
                  <div style={{
                    width: 56, height: 30, borderRadius: 999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: active ? '#EBF5EF' : 'transparent',
                    transition: 'all 200ms ease',
                  }}>
                    <Icon active={active}/>
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
                    color: active ? '#1B4332' : '#8A8070',
                    transition: 'color 200ms',
                  }}>
                    {label}
                  </span>
                </button>
              );
            })}

            {/* Botón Más */}
            <button
              onClick={() => setMoreOpen(true)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                flex: 1, cursor: 'pointer', padding: '4px 0',
                border: 'none', background: 'transparent',
              }}
            >
              <div style={{
                width: 56, height: 30, borderRadius: 999,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'transparent',
                transition: 'all 200ms ease',
              }}>
                <IcoMore active={false}/>
              </div>
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
                color: '#8A8070',
                transition: 'color 200ms',
              }}>
                Más
              </span>
            </button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 'calc(6px + env(safe-area-inset-bottom))', background: 'transparent' }}>
            <div style={{ width: 120, height: 4, borderRadius: 2, background: '#EBE7DC' }}/>
          </div>
        </div>

        {/* ── BOTTOM SHEET MÁS (LIGHT THEME GRID) ── */}
        {moreOpen && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 70,
            background: 'rgba(45,42,38,0.4)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'flex-end',
          }} onClick={e => { if (e.target === e.currentTarget) setMoreOpen(false); }}>
            <div style={{
              width: '100%', background: '#FCFBF9',
              borderRadius: '28px 28px 0 0',
              padding: '20px 20px 32px',
              animation: 'sheet-up 350ms cubic-bezier(0.34,1.56,0.64,1) both',
              boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 14,
              borderTop: '1px solid #EBE7DC',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.08)',
            }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: '#EBE7DC', margin: '0 auto 6px' }}/>
              <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 16, fontWeight: 900, color: '#2D2A26', marginBottom: 6 }}>
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
                      background: '#fff',
                      border: '1.5px solid #EBE7DC',
                      borderRadius: 18,
                      cursor: 'pointer',
                      textAlign: 'center',
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                      transition: 'all 150ms',
                    }}
                    onMouseDown={e => { e.currentTarget.style.background = '#F5F2EB'; }}
                    onMouseUp={e => { e.currentTarget.style.background = '#fff'; }}
                  >
                    <span style={{ fontSize: 24 }}>{item.icon}</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <p style={{ fontSize: 12, fontWeight: 800, color: '#2D2A26', margin: 0 }}>{item.label}</p>
                      <p style={{ fontSize: 9, color: '#8A8070', margin: 0 }}>{item.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                style={{
                  width: '100%', padding: '12px', background: 'none', border: '1px solid #EBE7DC',
                  borderRadius: 14, color: '#8A8070', fontSize: 12, fontWeight: 700, cursor: 'pointer', marginTop: 6
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        {/* RESTAURANT PICKER */}
        <RestaurantPickerLight
          open={pickerOpen} onClose={() => setPickerOpen(false)}
          restaurants={restaurants} active={activeRestaurant} onSelect={selectRestaurant}
        />
      </div>
    </div>
  );
}
