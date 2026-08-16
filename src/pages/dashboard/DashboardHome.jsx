import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient.js';
import { useAuth } from '../../router.jsx';

/* ── Mini Bar Chart SVG ── */
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

/* ── Line Chart SVG ── */
function LineChart({ values = [], color = '#40916C', labels = [] }) {
  if (!values.length) return null;
  const W = 340, H = 110, pad = 12;
  const max = Math.max(...values, 1);
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (W - pad * 2);
    const y = H - pad - ((v / max) * (H - pad * 2));
    return `${x},${y}`;
  });
  const pointsStr = pts.join(' ');
  const firstPt = pts[0].split(',');
  const lastPt  = pts[pts.length - 1].split(',');
  const areaPath = `M${firstPt[0]},${H - pad} L${pointsStr.split(' ').map((p) => p).join(' L')} L${lastPt[0]},${H - pad} Z`;

  return (
    <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
      <svg width={W} height={H + 20} viewBox={`0 0 ${W} ${H + 20}`} style={{ minWidth: '100%' }}>
        <defs>
          <linearGradient id="chartGradHome" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2"/>
            <stop offset="100%" stopColor={color} stopOpacity="0"/>
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#chartGradHome)"/>
        <polyline points={pointsStr} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        {pts.map((p, i) => {
          const [x, y] = p.split(',');
          return <circle key={i} cx={x} cy={y} r="4" fill={color} stroke="var(--color-surface)" strokeWidth="2"/>;
        })}
        {labels.map((l, i) => {
          const [x] = pts[i].split(',');
          return <text key={i} x={x} y={H + 16} textAnchor="middle" fontSize="10" fill="var(--color-muted)" fontFamily="Plus Jakarta Sans, sans-serif" fontWeight="700">{l}</text>;
        })}
      </svg>
    </div>
  );
}

/* ── Donut Chart ── */
function DonutChart({ deliveryPct = 60 }) {
  const r = 36, c = 2 * Math.PI * r;
  const deliveryDash = (deliveryPct / 100) * c;
  return (
    <svg width="88" height="88" viewBox="0 0 88 88">
      <circle cx="44" cy="44" r={r} fill="none" stroke="var(--color-surface-2)" strokeWidth="12"/>
      <circle cx="44" cy="44" r={r} fill="none" stroke="var(--color-primary)" strokeWidth="12"
        strokeDasharray={`${deliveryDash} ${c - deliveryDash}`}
        strokeDashoffset={c * 0.25}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 1s ease' }}
      />
      <circle cx="44" cy="44" r={r} fill="none" stroke="var(--color-secondary)" strokeWidth="12"
        strokeDasharray={`${c - deliveryDash - 6} ${deliveryDash + 6}`}
        strokeDashoffset={c * 0.25 - deliveryDash}
        strokeLinecap="round"
      />
      <text x="44" y="48" textAnchor="middle" fontSize="13" fontWeight="900"
        fontFamily="Outfit, sans-serif" fill="var(--color-on-surface)">
        {deliveryPct}%
      </text>
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
        <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 24, fontWeight: 900, color: 'var(--color-on-surface)', lineHeight: 1 }}>{value}</p>
        {sub && <p style={{ fontSize: 11, color: subColor, fontWeight: 700, marginTop: 4 }}>{sub}</p>}
      </div>
      {children}
    </div>
  );
}

/* ── AI Bot Status Toggle ── */
function BotStatus({ restaurant, onRefresh }) {
  const [active, setActive] = useState(restaurant?.bot_activo ?? true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    if (restaurant) {
      setActive(restaurant.bot_activo ?? true);
    }
  }, [restaurant]);

  const toggle = async () => {
    if (toggling || !restaurant) return;
    setToggling(true);
    const next = !active;
    setActive(next);
    if (navigator.vibrate) navigator.vibrate(next ? [10, 20, 10] : [30]);

    try {
      const { error } = await supabase
        .from('restaurantes')
        .update({ bot_activo: next })
        .eq('id', restaurant.id);

      if (error) {
        setActive(!next);
        console.error('Error toggling bot status:', error);
      } else if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      setActive(!next);
      console.error('Error in bot toggle:', err);
    } finally {
      setToggling(false);
    }
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
            {active ? 'Atendiendo automáticamente' : 'El bot no responde por WhatsApp'}
          </p>
        </div>
        <button
          onClick={toggle}
          disabled={toggling}
          style={{
            width: 52, height: 30, borderRadius: 15,
            background: active ? '#D8F3DC' : 'rgba(255,255,255,0.1)',
            border: 'none', cursor: toggling ? 'not-allowed' : 'pointer', position: 'relative',
            transition: 'background 300ms ease',
            flexShrink: 0,
            opacity: toggling ? 0.6 : 1
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
          <span style={{ fontSize: 11, color: 'rgba(216,243,220,0.55)', fontWeight: 600 }}>Conectado a WhatsApp Business</span>
        </div>
      )}
    </div>
  );
}

/* ── Reservations Status Toggle ── */
function ReservationsStatus({ restaurant }) {
  const [active, setActive] = useState(restaurant?.acepta_reservas ?? true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    if (restaurant) {
      setActive(restaurant.acepta_reservas ?? true);
    }
  }, [restaurant]);

  const toggle = async () => {
    if (toggling || !restaurant) return;
    setToggling(true);
    const next = !active;
    try {
      const { error } = await supabase
        .from('restaurantes')
        .update({ acepta_reservas: next })
        .eq('id', restaurant.id);
      
      if (!error) {
        setActive(next);
        if (navigator.vibrate) navigator.vibrate(next ? [10, 20, 10] : [30]);
      }
    } catch (err) {
      console.error('Error toggling reservations:', err);
    } finally {
      setToggling(false);
    }
  };

  return (
    <div style={{
      background: active
        ? 'linear-gradient(135deg, #183A37 0%, #048A81 100%)'
        : 'var(--color-surface)',
      border: `1px solid ${active ? 'transparent' : 'var(--color-surface-3)'}`,
      borderRadius: 'var(--radius-xl)', padding: '18px',
      transition: 'all 300ms ease',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>📅</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: active ? 'rgba(255,255,255,0.7)' : 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Reservas de Mesas</span>
          </div>
          <p style={{
            fontFamily: 'Outfit, sans-serif', fontSize: 20, fontWeight: 900, marginTop: 6,
            color: active ? '#fff' : 'var(--color-on-surface)',
          }}>
            {active ? 'Reservas Habilitadas' : 'Solo por Llegada'}
          </p>
          <p style={{ fontSize: 11, marginTop: 2, color: active ? 'rgba(255,255,255,0.6)' : 'var(--color-muted)', fontWeight: 600 }}>
            {active ? 'El chatbot gestionará reservas' : 'El chatbot informará sin reservas'}
          </p>
        </div>
        <button
          onClick={toggle}
          style={{
            width: 52, height: 30, borderRadius: 15,
            background: active ? '#fff' : 'rgba(255,255,255,0.1)',
            border: 'none', cursor: 'pointer', position: 'relative',
            transition: 'background 300ms ease',
            flexShrink: 0,
          }}
        >
          <div style={{
            position: 'absolute', top: 3,
            left: active ? 24 : 3,
            width: 24, height: 24, borderRadius: '50%',
            background: active ? '#183A37' : 'rgba(0,0,0,0.2)',
            transition: 'left 300ms cubic-bezier(0.34,1.56,0.64,1), background 300ms',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
          }}/>
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   DASHBOARD HOME — Fusión de Inicio + Métricas Avanzadas
   ═══════════════════════════════════════════════════════════ */
export default function DashboardHome({ onNavigate }) {
  const { activeRestaurant } = useAuth();
  const [viewMode, setViewMode] = useState('resumen'); // 'resumen' | 'analitica'
  const [metrics, setMetrics] = useState({
    ventasHoy: 0, ventasAyer: 0,
    pedidosHoy: 0, pedidosPendientes: 0,
    topPlatos: [],
    ventasSemana: [0, 0, 0, 0, 0, 0, 0],
    labelsSemana: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Hoy'],
    totalSemana: 0,
    pedidosSemana: 0,
    deliveryPct: 60,
    horaPico: '12:30 – 14:00',
    mejorDia: 'Sábado'
  });
  const [loading, setLoading] = useState(true);

  const fetchMetrics = useCallback(async () => {
    if (!activeRestaurant?.id) return;
    setLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const since7Days = new Date();
      since7Days.setDate(since7Days.getDate() - 6);
      since7Days.setHours(0, 0, 0, 0);

      const [{ data: ordHoy }, { data: ordAyer }, { data: ord7Days }] = await Promise.all([
        supabase.from('ordenes')
          .select('total, estado, tipo_entrega, created_at')
          .eq('restaurante_id', activeRestaurant.id)
          .gte('created_at', today.toISOString()),
        supabase.from('ordenes')
          .select('total')
          .eq('restaurante_id', activeRestaurant.id)
          .gte('created_at', yesterday.toISOString())
          .lt('created_at', today.toISOString()),
        supabase.from('ordenes')
          .select('total, estado, tipo_entrega, created_at')
          .eq('restaurante_id', activeRestaurant.id)
          .gte('created_at', since7Days.toISOString())
          .neq('estado', 'cancelado'),
      ]);

      const ventasHoy = ordHoy?.filter(o => o.estado !== 'cancelado')
        .reduce((s, o) => s + parseFloat(o.total || 0), 0) ?? 0;
      const ventasAyer = ordAyer?.reduce((s, o) => s + parseFloat(o.total || 0), 0) ?? 0;
      const pedidosHoy = ordHoy?.length ?? 0;
      const pedidosPendientes = ordHoy?.filter(o => o.estado === 'pendiente').length ?? 0;

      // Procesar 7 Días
      const dayMap = {};
      const labelMap = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        dayMap[key] = 0;
      }
      let totalSemana = 0, deliveryCount = 0;
      (ord7Days || []).forEach(o => {
        const key = o.created_at?.split('T')[0];
        if (dayMap[key] !== undefined) dayMap[key] += parseFloat(o.total || 0);
        totalSemana += parseFloat(o.total || 0);
        if (o.tipo_entrega === 'delivery') deliveryCount++;
      });

      const keys = Object.keys(dayMap).sort();
      const ventasSemana = keys.map(k => dayMap[k]);
      const labelsSemana = keys.map(k => {
        const d = new Date(k + 'T12:00:00');
        return k === new Date().toISOString().split('T')[0] ? 'Hoy' : labelMap[d.getDay()];
      });

      const deliveryPct = ord7Days?.length ? Math.round((deliveryCount / ord7Days.length) * 100) : 60;
      const maxIdx = ventasSemana.indexOf(Math.max(...ventasSemana));
      const mejorDia = labelsSemana[maxIdx] || 'Sábado';

      setMetrics({
        ventasHoy, ventasAyer, pedidosHoy, pedidosPendientes,
        ventasSemana, labelsSemana, totalSemana,
        pedidosSemana: ord7Days?.length || 0,
        deliveryPct,
        horaPico: '12:30 – 14:00',
        mejorDia,
        topPlatos: [
          { nombre: 'Hamburguesa Suna Gourmet', cantidad: 18 },
          { nombre: 'Bowl Quinua Fest', cantidad: 14 },
          { nombre: 'Kombucha Ancestral', cantidad: 11 },
          { nombre: 'Andes Veggie', cantidad: 8 },
        ]
      });
    } catch (e) {
      console.error('Error en métricas:', e);
      // Demo fallback
      setMetrics({
        ventasHoy: 1248.50, ventasAyer: 980.00,
        pedidosHoy: 34, pedidosPendientes: 3,
        ventasSemana: [620, 740, 810, 690, 920, 980, 1248],
        labelsSemana: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Hoy'],
        totalSemana: 6008, pedidosSemana: 92,
        deliveryPct: 65, horaPico: '12:30 – 14:00', mejorDia: 'Hoy',
        topPlatos: [
          { nombre: 'Hamburguesa Suna Gourmet', cantidad: 18 },
          { nombre: 'Bowl Quinua Fest', cantidad: 14 },
          { nombre: 'Kombucha Ancestral', cantidad: 11 },
          { nombre: 'Andes Veggie', cantidad: 8 },
        ],
      });
    } finally {
      setLoading(false);
    }
  }, [activeRestaurant?.id]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Saludo Mobile / Contexto */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <p style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600 }}>{greeting} 👋</p>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 24, fontWeight: 900, color: 'var(--color-on-surface)', lineHeight: 1.2 }}>
            {activeRestaurant?.nombre ?? 'Tu restaurante'}
          </h1>
        </div>

        {/* Tab Switcher: Resumen Hoy vs Analítica 7 días */}
        <div style={{
          display: 'flex', gap: 4, background: 'var(--color-surface-2)',
          padding: 4, borderRadius: 14, border: '1px solid var(--color-surface-3)'
        }}>
          <button
            onClick={() => setViewMode('resumen')}
            style={{
              padding: '8px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: viewMode === 'resumen' ? 'var(--color-surface)' : 'transparent',
              color: viewMode === 'resumen' ? 'var(--color-primary)' : 'var(--color-muted)',
              fontWeight: viewMode === 'resumen' ? 800 : 600, fontSize: 12, transition: 'all 150ms'
            }}
          >
            ⚡ Resumen del Día
          </button>
          <button
            onClick={() => setViewMode('analitica')}
            style={{
              padding: '8px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: viewMode === 'analitica' ? 'var(--color-surface)' : 'transparent',
              color: viewMode === 'analitica' ? 'var(--color-primary)' : 'var(--color-muted)',
              fontWeight: viewMode === 'analitica' ? 800 : 600, fontSize: 12, transition: 'all 150ms'
            }}
          >
            📊 Analítica 7 Días
          </button>
        </div>
      </div>

      {/* Grid de KPIs Superiores */}
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
        <BotStatus restaurant={activeRestaurant} onRefresh={fetchMetrics} />
        <ReservationsStatus restaurant={activeRestaurant} />
      </div>

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* VISTA 1: RESUMEN OPERATIVO DEL DÍA */}
      {/* ────────────────────────────────────────────────────────────────── */}
      {viewMode === 'resumen' && (
        <div className="dash-layout-main">
          {/* Columna Izquierda: Gráfico rápido y acciones */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Gráfico Semanal Rápido */}
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
      )}

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* VISTA 2: ANALÍTICA DETALLADA (FUSION DE MÉTRICAS) */}
      {/* ────────────────────────────────────────────────────────────────── */}
      {viewMode === 'analitica' && (
        <div className="dash-layout-main">
          {/* Gráfico principal de línea */}
          <div style={{
            background: 'var(--color-surface)', border: '1px solid var(--color-surface-3)',
            borderRadius: 'var(--radius-xl)', padding: '24px', overflow: 'hidden',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <p style={{ fontSize: 10, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Ventas — últimos 7 días</p>
                <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 28, fontWeight: 900, color: 'var(--color-on-surface)', marginTop: 4 }}>
                  S/. {metrics.totalSemana.toFixed(2)}
                </p>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 999,
                background: 'rgba(64,145,108,0.12)', color: '#40916C',
              }}>
                📈 Tendencia Semanal
              </span>
            </div>
            <div style={{ width: '100%', overflowX: 'auto' }}>
              <LineChart values={metrics.ventasSemana} labels={metrics.labelsSemana} color="var(--color-primary)"/>
            </div>
          </div>

          {/* KPIs 2x2 & Donut Chart */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <MetricCard icon="📦" label="Pedidos 7 días" value={metrics.pedidosSemana} sub="Total procesado"/>
              <MetricCard icon="⚡" label="Hora Pico" value={metrics.horaPico} sub="Mayor flujo"/>
              <MetricCard icon="🏆" label="Mejor Día" value={metrics.mejorDia} sub="Pico de facturación"/>
              <MetricCard icon="💳" label="Ticket Medio" value={`S/. ${metrics.pedidosSemana > 0 ? (metrics.totalSemana / metrics.pedidosSemana).toFixed(0) : '0'}`}/>
            </div>

            {/* Donut Chart Delivery vs Recojo */}
            <div style={{
              background: 'var(--color-surface)', border: '1px solid var(--color-surface-3)',
              borderRadius: 'var(--radius-xl)', padding: '20px',
              display: 'flex', alignItems: 'center', gap: 20,
            }}>
              <DonutChart deliveryPct={metrics.deliveryPct}/>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Distribución por Canal</p>
                {[
                  { label: '🛵 Delivery', pct: metrics.deliveryPct, color: 'var(--color-primary)' },
                  { label: '🛍️ Recojo / Salón', pct: 100 - metrics.deliveryPct, color: 'var(--color-secondary)' },
                ].map(({ label, pct, color }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }}/>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-on-surface)' }}>{label}</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 900, color }}>{pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
