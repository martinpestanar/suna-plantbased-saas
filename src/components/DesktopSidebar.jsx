import { GrAd } from 'react-icons/gr';

/**
 * DesktopSidebar — Panel lateral que solo aparece en escritorio (≥ 900px)
 */
export default function DesktopSidebar({ restaurant, activeTab, onTabSelect, onLogout }) {
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';

  const menuItems = [
    { id: 'inicio',     icon: '🏠', label: 'Inicio' },
    { id: 'ordenes',    icon: '🔔', label: 'Órdenes Live' },
    { id: 'pedidos',    icon: '👨‍🍳', label: 'Pedidos' },
    { id: 'carta',      icon: '📋', label: 'Carta del Menú' },
    { id: 'inventario', icon: '📦', label: 'Inventario' },
    { id: 'finanzas',   icon: '💵', label: 'Finanzas' },
    { id: 'marketing',  icon: '🚀', label: 'Marketing' },
    { id: 'delivery',   icon: '🛵', label: 'Delivery' },
    { id: 'metricas',   icon: '📊', label: 'Métricas' },
  ];

  return (
    <aside style={{
      width: 260,
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
      padding: '30px 20px',
      background: '#0D2118',
      height: '100dvh',
      flexShrink: 0,
      borderRight: '1px solid rgba(255,255,255,0.08)',
      boxSizing: 'border-box'
    }}>

      {/* Marca */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 12,
          background: 'var(--color-surface)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          cursor: 'pointer', flexShrink: 0,
        }}>
          <GrAd className="logo-vibrate" size={22} color="var(--color-primary)" />
        </div>
        <div>
          <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 16, color: '#fff', lineHeight: 1.1 }}>
            Suna GreenApp
          </p>
          <p style={{ fontSize: 10, color: 'rgba(216,243,220,0.5)', fontWeight: 600 }}>Panel Administrativo</p>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

      {/* Saludo + restaurante activo */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 16,
        padding: '14px 16px',
      }}>
        <p style={{ fontSize: 10, color: 'rgba(216,243,220,0.45)', fontWeight: 600, marginBottom: 4 }}>
          {greeting} 👋
        </p>
        <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 14, fontWeight: 800, color: '#fff', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {restaurant?.nombre || 'Tu Restaurante'}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: '#D8F3DC',
            boxShadow: '0 0 0 3px rgba(216,243,220,0.2)',
            animation: 'pulse-dot 2s ease-in-out infinite',
          }} />
          <span style={{ fontSize: 10, color: 'rgba(216,243,220,0.5)', fontWeight: 600 }}>
            En línea
          </span>
        </div>
      </div>

      {/* Navegación */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <p style={{
          fontSize: 9, fontWeight: 800, letterSpacing: '0.1em',
          color: 'rgba(216,243,220,0.3)', textTransform: 'uppercase', marginBottom: 8, paddingLeft: 8
        }}>
          Navegación
        </p>
        {menuItems.map(({ id, icon, label }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabSelect(id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 14px', borderRadius: 12,
                background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'all 150ms',
              }}
            >
              <span style={{ fontSize: 16, filter: active ? 'none' : 'grayscale(30%)' }}>{icon}</span>
              <span style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? '#fff' : 'rgba(216,243,220,0.6)' }}>{label}</span>
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

      {/* Cerrar Sesión */}
      <button
        onClick={onLogout}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 14px', borderRadius: 12,
          background: 'rgba(217, 4, 41, 0.08)',
          border: '1px solid rgba(217, 4, 41, 0.15)',
          cursor: 'pointer',
          textAlign: 'left',
          width: '100%',
          marginTop: 'auto',
          transition: 'all 150ms',
        }}
      >
        <span style={{ fontSize: 16 }}>🚪</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#FF4D4D' }}>Cerrar sesión</span>
      </button>

      {/* Footer */}
      <div>
        <p style={{ fontSize: 9, color: 'rgba(216,243,220,0.2)', fontWeight: 600, textAlign: 'center' }}>
          Suna GreenApp · v1.2
        </p>
      </div>
    </aside>
  );
}

