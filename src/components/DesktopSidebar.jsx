import { GrAd } from 'react-icons/gr';
import { useAuth } from '../router.jsx';

/* ── Iconos Vectoriales SVG de Alta Fidelidad ── */
const Icons = {
  inicio: (active) => (
    <svg width="19" height="19" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  ordenes: (active) => (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  pedidos: (active) => (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <path d="M9 12h6" />
      <path d="M9 16h6" />
    </svg>
  ),
  carta: (active) => (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <line x1="9" y1="7" x2="15" y2="7" />
      <line x1="9" y1="11" x2="13" y2="11" />
    </svg>
  ),
  inventario: (active) => (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  ),
  finanzas: (active) => (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  marketing: (active) => (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  clientes: (active) => (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  premios: (active) => (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 12 20 22 4 22 4 12" />
      <rect x="2" y="7" width="20" height="5" />
      <line x1="12" y1="22" x2="12" y2="7" />
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
    </svg>
  ),
  salon: (active) => (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="9" y1="21" x2="9" y2="9" />
    </svg>
  ),
  delivery: (active) => (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" rx="2" ry="2" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  ),
  restaurante: (active) => (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  logout: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
};

/**
 * DesktopSidebar — Panel lateral moderno y limpio para escritorio (≥ 900px)
 */
export default function DesktopSidebar({ restaurant, activeTab, onTabSelect, onLogout, allowedModules: propAllowedModules }) {
  const { allowedModules: authAllowedModules } = useAuth();
  const allowedModules = propAllowedModules || authAllowedModules;

  const rawMenuItems = [
    { id: 'inicio',     label: 'Inicio' },
    { id: 'ordenes',    label: 'Órdenes Live' },
    { id: 'pedidos',    label: 'Pedidos' },
    { id: 'carta',      label: 'Carta Menú' },
    { id: 'inventario', label: 'Inventario' },
    { id: 'finanzas',   label: 'Finanzas' },
    { id: 'marketing',  label: 'Marketing' },
    { id: 'clientes',   label: 'Clientes CRM' },
    { id: 'premios',    label: 'Club Premios' },
    { id: 'salon',      label: 'Salón Mesas' },
    { id: 'delivery',   label: 'Delivery' },
    { id: 'restaurante',label: 'Mi Restaurante' },
  ];

  const menuItems = Array.isArray(allowedModules) && allowedModules.length > 0
    ? rawMenuItems.filter(item => allowedModules.includes(item.id) || item.id === 'ordenes')
    : rawMenuItems;

  return (
    <aside style={{
      width: 240,
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      padding: '24px 16px',
      background: 'var(--color-surface, #FFFFFF)',
      color: 'var(--color-on-surface, #0F172A)',
      height: '100dvh',
      flexShrink: 0,
      borderRight: '1px solid var(--color-surface-3, #E2E8F0)',
      boxSizing: 'border-box',
      transition: 'background 200ms ease, border-color 200ms ease',
      zIndex: 20
    }}>

      {/* Marca / Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 6px', marginBottom: 4 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'var(--color-accent, #ECFDF5)',
          border: '1px solid var(--color-surface-3, #E2E8F0)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <GrAd size={18} color="var(--color-primary, #059669)" />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 15, color: 'var(--color-on-surface, #0F172A)', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
            Suna App
          </p>
          <p style={{ fontSize: 10, color: 'var(--color-muted, #64748B)', fontWeight: 600 }}>SaaS Gastronómico</p>
        </div>
      </div>

      {/* Tarjeta de Local Activo */}
      <div style={{
        background: 'var(--color-surface-2, #F8FAFC)',
        border: '1px solid var(--color-surface-3, #E2E8F0)',
        borderRadius: 14,
        padding: '10px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8
      }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 13, fontWeight: 800, color: 'var(--color-on-surface, #0F172A)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {restaurant?.nombre || 'Tu Restaurante'}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: 'var(--color-primary, #059669)',
              boxShadow: '0 0 0 2px var(--color-accent, #ECFDF5)',
            }} />
            <span style={{ fontSize: 10, color: 'var(--color-muted, #64748B)', fontWeight: 600 }}>
              {restaurant?.nombre_sucursal || 'Sede Principal'}
            </span>
          </div>
        </div>
      </div>

      {/* Navegación Principal */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        overflowY: 'auto',
        flex: 1,
        paddingRight: 2
      }}>
        <p style={{
          fontSize: 10, fontWeight: 800, letterSpacing: '0.06em',
          color: 'var(--color-muted, #94A3B8)', textTransform: 'uppercase', marginBottom: 6, paddingLeft: 8
        }}>
          Módulos
        </p>

        {menuItems.map(({ id, label }) => {
          const active = activeTab === id;
          const IconComp = Icons[id] || Icons.inicio;

          return (
            <button
              key={id}
              onClick={() => onTabSelect(id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 10,
                background: active ? 'var(--color-accent, #ECFDF5)' : 'transparent',
                color: active ? 'var(--color-primary, #059669)' : 'var(--color-muted, #64748B)',
                border: active ? '1px solid var(--color-surface-3, #E2E8F0)' : '1px solid transparent',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'all 140ms ease',
                fontWeight: active ? 700 : 500,
                fontSize: 13
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'var(--color-surface-2, #F8FAFC)';
                  e.currentTarget.style.color = 'var(--color-on-surface, #0F172A)';
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--color-muted, #64748B)';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'inherit' }}>
                {IconComp(active)}
              </div>
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Cerrar Sesión */}
      <button
        onClick={onLogout}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 12px', borderRadius: 10,
          background: 'rgba(239, 68, 68, 0.06)',
          border: '1px solid rgba(239, 68, 68, 0.15)',
          color: '#EF4444',
          cursor: 'pointer',
          textAlign: 'left',
          width: '100%',
          marginTop: 'auto',
          fontSize: 12,
          fontWeight: 700,
          transition: 'all 140ms ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.06)'; }}
      >
        <Icons.logout />
        <span>Cerrar sesión</span>
      </button>
    </aside>
  );
}

