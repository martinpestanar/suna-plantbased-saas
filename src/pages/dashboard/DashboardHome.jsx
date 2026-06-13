import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient.js';
import { useAuth, useRouter } from '../../router.jsx';

/* ── Mini Bar Chart SVG inline ── */
function MiniBar({ values = [], color = '#40916C', height = 40 }) {
  const max = Math.max(...values, 1);
  const w = 20;
  const gap = 6;
  const totalW = values.length * w + (values.length - 1) * gap;
  return (
    <svg width={totalW} height={height} viewBox={`0 0 ${totalW} ${height}`}>
      {values.map((v, i) => {
        const barH = Math.max(4, (v / max) * height);
        const x = i * (w + gap);
        const y = height - barH;
        return (
          <rect key={i} x={x} y={y} width={w} height={barH}
            rx="4" fill={color} opacity={i === values.length - 1 ? 1 : 0.45}/>
        );
      })}
    </svg>
  );
}

/* ── Metric Card ── */
function MetricCard({ icon, label, value, sub, subColor = '#40916C', trend, trendUp, children }) {
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-surface-3)',
      borderRadius: 'var(--radius-xl)',
      padding: '18px',
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>{icon}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
        </div>
        {trend !== undefined && (
          <span style={{
            fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 999,
            background: trendUp ? 'rgba(64,145,108,0.12)' : 'rgba(217,4,41,0.1)',
            color: trendUp ? '#40916C' : '#D90429',
          }}>
            {trendUp ? '↑' : '↓'} {trend}%
          </span>
        )}
      </div>
      <div>
        <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 26, fontWeight: 900, color: 'var(--color-on-surface)', lineHeight: 1 }}>{value}</p>
        {sub && <p style={{ fontSize: 11, color: subColor, fontWeight: 700, marginTop: 4 }}>{sub}</p>}
      </div>
      {children}
    </div>
  );
}

/* ── AI Bot Status Toggle ── */
function BotStatus({ restaurantId }) {
  const [active, setActive] = useState(true);
  const [toggling, setToggling] = useState(false);

  const toggle = async () => {
    if (toggling) return;
    setToggling(true);
    const next = !active;
    // TODO: actualizar en Supabase campo bot_activo en restaurantes
    setActive(next);
    if (navigator.vibrate) navigator.vibrate(next ? [10, 20, 10] : [30]);
    setTimeout(() => setToggling(false), 400);
  };

  return (
    <div style={{
      background: active
        ? 'linear-gradient(135deg, #1B4332 0%, #2C6246 100%)'
        : 'var(--color-surface)',
      border: `1px solid ${active ? 'transparent' : 'var(--color-surface-3)'}`,
      borderRadius: 'var(--radius-xl)', padding: '18px',
      transition: 'all 300ms ease',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>🤖</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: active ? 'rgba(216,243,220,0.6)' : 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Agente IA WhatsApp</span>
          </div>
          <p style={{
            fontFamily: 'Outfit, sans-serif', fontSize: 20, fontWeight: 900, marginTop: 6,
            color: active ? '#D8F3DC' : 'var(--color-on-surface)',
          }}>
            {active ? 'En línea' : 'Pausado'}
          </p>
          <p style={{ fontSize: 11, marginTop: 2, color: active ? 'rgba(216,243,220,0.5)' : 'var(--color-muted)', fontWeight: 600 }}>
            {active ? 'Atendiendo pedidos automáticamente' : 'El bot no responde por WhatsApp'}
          </p>
        </div>
        {/* Toggle iOS */}
        <button
          onClick={toggle}
          style={{
            width: 52, height: 30, borderRadius: 15,
            background: active ? '#D8F3DC' : 'rgba(255,255,255,0.1)',
            border: 'none', cursor: 'pointer', position: 'relative',
            transition: 'background 300ms ease',
            flexShrink: 0,
          }}
        >
          <div style={{
            position: 'absolute', top: 3,
            left: active ? 24 : 3,
            width: 24, height: 24, borderRadius: '50%',
            background: active ? '#1B4332' : 'rgba(255,255,255,0.4)',
            transition: 'left 300ms cubic-bezier(0.34,1.56,0.64,1), background 300ms',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
          }}/>
        </button>
      </div>
      {active && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#D8F3DC', boxShadow: '0 0 0 3px rgba(216,243,220,0.2)', animation: 'pulse-dot 2s ease-in-out infinite' }}/>
          <span style={{ fontSize: 11, color: 'rgba(216,243,220,0.55)', fontWeight: 600 }}>Tiempo real · Conectado a WhatsApp Business</span>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   DASHBOARD HOME — Vista de métricas multi-tenant
   ═══════════════════════════════════════════════════════════ */
export default function DashboardHome({ onNavigate }) {
  const { activeRestaurant } = useAuth();
  const [metrics, setMetrics] = useState({
    ventasHoy: 0, ventasAyer: 0,
    pedidosHoy: 0, pedidosPendientes: 0,
    topPlatos: [],
    ventasSemana: [0, 0, 0, 0, 0, 0, 0],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeRestaurant?.id) return;
    fetchMetrics();
  }, [activeRestaurant]);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const todayStr = today.toISOString();
      const yesterdayStr = yesterday.toISOString();

      const [{ data: ordHoy }, { data: ordAyer }] = await Promise.all([
        supabase.from('ordenes')
          .select('total, estado')
          .eq('restaurante_id', activeRestaurant.id)
          .gte('created_at', todayStr),
        supabase.from('ordenes')
          .select('total')
          .eq('restaurante_id', activeRestaurant.id)
          .gte('created_at', yesterdayStr)
          .lt('created_at', todayStr),
      ]);

      const ventasHoy = ordHoy?.filter(o => o.estado !== 'cancelado')
        .reduce((s, o) => s + parseFloat(o.total || 0), 0) ?? 0;
      const ventasAyer = ordAyer?.reduce((s, o) => s + parseFloat(o.total || 0), 0) ?? 0;
      const pedidosHoy = ordHoy?.length ?? 0;
      const pedidosPendientes = ordHoy?.filter(o => o.estado === 'pendiente').length ?? 0;

      setMetrics(prev => ({ ...prev, ventasHoy, ventasAyer, pedidosHoy, pedidosPendientes }));
    } catch (e) {
      console.error('Error en métricas:', e);
      // Demo fallback
      setMetrics({
        ventasHoy: 1248.50, ventasAyer: 980.00,
        pedidosHoy: 34, pedidosPendientes: 3,
        topPlatos: [
          { nombre: 'Hamburguesa Suna', cantidad: 18 },
          { nombre: 'Bowl Quinua Fest', cantidad: 12 },
          { nombre: 'Kombucha Ancestral', cantidad: 9 },
          { nombre: 'Andes Veggie', cantidad: 7 },
        ],
        ventasSemana: [620, 740, 810, 690, 920, 980, 1248],
      });
    } finally {
      setLoading(false);
    }
  };

  const trendPct = metrics.ventasAyer > 0
    ? Math.round(((metrics.ventasHoy - metrics.ventasAyer) / metrics.ventasAyer) * 100)
    : 0;

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Buenos días' : now.getHours() < 19 ? 'Buenas tardes' : 'Buenas noches';

  if (loading) {
    return (
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {[1,2,3,4].map(i => (
          <div key={i} className="skeleton" style={{ height: i === 1 ? 100 : 90, borderRadius: 20 }}/>
        ))}
      </div>
    );
  }

  // Renderizado Premium
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Saludo Mobile / Contexto */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <p style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600 }}>{greeting} 👋</p>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 24, fontWeight: 900, color: 'var(--color-on-surface)', lineHeight: 1.2 }}>
            {activeRestaurant?.nombre ?? 'Tu restaurante'}
          </h1>
        </div>
      </div>

      {/* Grid de KPIs - 4 Columnas en Desktop / Adaptive en Mobile */}
      <div className="dash-grid-top">
        <MetricCard
          icon="💰" label="Ventas de hoy"
          value={`S/. ${metrics.ventasHoy.toFixed(2)}`}
          sub={`Ayer: S/. ${metrics.ventasAyer.toFixed(2)}`}
          trend={Math.abs(trendPct)} trendUp={trendPct >= 0}
        />
        <MetricCard icon="📦" label="Pedidos hoy" value={metrics.pedidosHoy}
          sub={metrics.pedidosPendientes > 0 ? `${metrics.pedidosPendientes} pendiente${metrics.pedidosPendientes > 1 ? 's' : ''}` : 'Todo al día ✅'}
          subColor={metrics.pedidosPendientes > 0 ? '#D90429' : '#40916C'}
        />
        <MetricCard icon="⏱️" label="Ticket promedio" value={`S/. ${metrics.pedidosHoy > 0 ? (metrics.ventasHoy / metrics.pedidosHoy).toFixed(0) : '0'}`}
          sub="Por pedido hoy"
        />
        <BotStatus restaurantId={activeRestaurant?.id} />
      </div>

      {/* Layout Principal de 2 Columnas en Desktop */}
      <div className="dash-layout-main">
        {/* Columna Izquierda: Gráfico principal y accesos rápidos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Gráfico Semanal */}
          <div style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-surface-3)',
            borderRadius: 'var(--radius-xl)',
            padding: '24px',
          }}>
            <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
              📈 Ventas acumuladas de la semana
            </p>
            <div style={{ width: '100%', overflowX: 'auto' }}>
              <MiniBar values={metrics.ventasSemana} color="#40916C" height={80}/>
            </div>
          </div>

          {/* Accesos rápidos */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Acciones Operativas</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              {[
                { icon: '👨‍🍳', label: 'Panel de Cocina', sub: 'Pedidos en tiempo real', tab: 'pedidos', color: '#1B4332' },
                { icon: '📋', label: 'Gestión de Carta', sub: 'Disponibilidad de platos', tab: 'carta', color: '#40916C' },
              ].map(({ icon, label, sub, tab, color }) => (
                <button key={tab}
                  onClick={() => onNavigate(tab)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                    padding: '20px', borderRadius: 'var(--radius-xl)',
                    background: color, border: 'none', cursor: 'pointer',
                    transition: 'all 200ms ease',
                    textAlign: 'left',
                  }}
                  onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.97)'; }}
                  onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  <span style={{ fontSize: 26, marginBottom: 10 }}>{icon}</span>
                  <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 14, fontWeight: 800, color: '#D8F3DC', lineHeight: 1.2 }}>{label}</p>
                  <p style={{ fontSize: 11, color: 'rgba(216,243,220,0.6)', fontWeight: 600, marginTop: 4 }}>{sub}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Columna Derecha: Platos más vendidos */}
        <div>
          {metrics.topPlatos?.length > 0 && (
            <div style={{
              background: 'var(--color-surface)', border: '1px solid var(--color-surface-3)',
              borderRadius: 'var(--radius-xl)', padding: '24px',
              height: '100%'
            }}>
              <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>
                🏆 Platos más vendidos hoy
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {metrics.topPlatos.map(({ nombre, cantidad }, i) => {
                  const max = metrics.topPlatos[0]?.cantidad ?? 1;
                  const pct = Math.round((amount => (amount / max) * 100)(cantidad));
                  return (
                    <div key={nombre}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-on-surface)' }}>
                          {['🥇','🥈','🥉','4️⃣'][i] || '•'} {nombre}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-primary)' }}>{cantidad} uds.</span>
                      </div>
                      <div style={{ height: 6, background: 'var(--color-surface-2)', borderRadius: 99 }}>
                        <div style={{
                          height: '100%', width: `${pct}%`,
                          background: i === 0 ? 'var(--color-primary)' : 'var(--color-secondary)',
                          borderRadius: 99, transition: 'width 0.8s ease',
                        }}/>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
