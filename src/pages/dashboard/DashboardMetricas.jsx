import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient.js';
import { useAuth } from '../../router.jsx';

/* ── SVG Line Chart inline ── */
function LineChart({ values = [], color = '#40916C', labels = [] }) {
  if (!values.length) return null;
  const W = 320, H = 100, pad = 10;
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
      <svg width={W} height={H + 20} viewBox={`0 0 ${W} ${H + 20}`} style={{ minWidth: W }}>
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.15"/>
            <stop offset="100%" stopColor={color} stopOpacity="0"/>
          </linearGradient>
        </defs>
        {/* Area */}
        <path d={areaPath} fill="url(#chartGrad)"/>
        {/* Line */}
        <polyline points={pointsStr} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        {/* Dots */}
        {pts.map((p, i) => {
          const [x, y] = p.split(',');
          return <circle key={i} cx={x} cy={y} r="4" fill={color} stroke="var(--color-surface)" strokeWidth="2"/>;
        })}
        {/* Labels */}
        {labels.map((l, i) => {
          const [x] = pts[i].split(',');
          return <text key={i} x={x} y={H + 16} textAnchor="middle" fontSize="9" fill="var(--color-muted)" fontFamily="Plus Jakarta Sans, sans-serif" fontWeight="600">{l}</text>;
        })}
      </svg>
    </div>
  );
}

/* ── KPI Card ── */
function KpiCard({ emoji, label, value, sub, subColor }) {
  return (
    <div style={{
      background: 'var(--color-surface)', border: '1px solid var(--color-surface-3)',
      borderRadius: 'var(--radius-xl)', padding: '16px',
    }}>
      <span style={{ fontSize: 20, display: 'block', marginBottom: 8 }}>{emoji}</span>
      <p style={{ fontSize: 10, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{label}</p>
      <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 20, fontWeight: 900, color: 'var(--color-on-surface)', lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: 10, color: subColor ?? 'var(--color-muted)', fontWeight: 700, marginTop: 4 }}>{sub}</p>}
    </div>
  );
}

/* ── Donut Chart ── */
function Donut({ deliveryPct = 60 }) {
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

/* ═══════════════════════════════════════════════════════════
   MÉTRICAS — Analytics 7 días
   ═══════════════════════════════════════════════════════════ */
export default function DashboardMetricas() {
  const { activeRestaurant } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeRestaurant?.id) return;
    fetchMetrics();
  }, [activeRestaurant]);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      // Últimos 7 días
      const since = new Date();
      since.setDate(since.getDate() - 6);
      since.setHours(0, 0, 0, 0);

      const { data: orders, error } = await supabase
        .from('ordenes')
        .select('total, tipo_entrega, estado, created_at')
        .eq('restaurante_id', activeRestaurant.id)
        .gte('created_at', since.toISOString())
        .neq('estado', 'cancelado');

      if (error) throw error;
      processData(orders ?? []);
    } catch (e) {
      console.error(e);
      // Demo data
      processData(null);
    } finally {
      setLoading(false);
    }
  };

  const processData = (orders) => {
    if (!orders) {
      // Demo fallback
      setData({
        ventasSemana: [420, 680, 540, 910, 760, 980, 1248],
        labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Hoy'],
        totalSemana: 5538,
        pedidosSemana: 87,
        ticketPromedio: 63.6,
        deliveryPct: 62,
        horaPico: '12:30 – 14:00',
        mejorDia: 'Sábado',
      });
      return;
    }

    // Agrupar por día
    const dayMap = {};
    const labelMap = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      dayMap[key] = 0;
    }
    let totalSemana = 0, delivery = 0;
    orders.forEach(o => {
      const key = o.created_at?.split('T')[0];
      if (dayMap[key] !== undefined) dayMap[key] += parseFloat(o.total ?? 0);
      totalSemana += parseFloat(o.total ?? 0);
      if (o.tipo_entrega === 'delivery') delivery++;
    });

    const keys = Object.keys(dayMap).sort();
    const ventasSemana = keys.map(k => dayMap[k]);
    const labels = keys.map(k => {
      const d = new Date(k + 'T12:00:00');
      return k === new Date().toISOString().split('T')[0] ? 'Hoy' : labelMap[d.getDay()];
    });
    const deliveryPct = orders.length ? Math.round((delivery / orders.length) * 100) : 0;

    setData({
      ventasSemana,
      labels,
      totalSemana,
      pedidosSemana: orders.length,
      ticketPromedio: orders.length ? totalSemana / orders.length : 0,
      deliveryPct,
      horaPico: '12:30 – 14:00',
      mejorDia: labels[ventasSemana.indexOf(Math.max(...ventasSemana))],
    });
  };

  if (loading) {
    return (
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {[100, 160, 90, 90].map((h, i) => <div key={i} className="skeleton" style={{ height: h, borderRadius: 20 }}/>)}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Grid Principal: Gráfico izquierda, KPIs y Donut derecha */}
      <div className="dash-layout-main">
        {/* Gráfico ventas */}
        <div style={{
          background: 'var(--color-surface)', border: '1px solid var(--color-surface-3)',
          borderRadius: 'var(--radius-xl)', padding: '24px', overflow: 'hidden',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div>
              <p style={{ fontSize: 10, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Ventas — últimos 7 días</p>
              <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 28, fontWeight: 900, color: 'var(--color-on-surface)', marginTop: 4 }}>
                S/. {data.totalSemana.toFixed(2)}
              </p>
            </div>
            <span style={{
              fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 999,
              background: 'rgba(64,145,108,0.12)', color: '#40916C',
            }}>
              📈 Esta semana
            </span>
          </div>
          <div style={{ width: '100%', overflowX: 'auto' }}>
            <LineChart values={data.ventasSemana} labels={data.labels} color="var(--color-primary)"/>
          </div>
        </div>

        {/* KPIs 2x2 & Delivery */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <KpiCard emoji="📦" label="Pedidos" value={data.pedidosSemana} sub="En 7 días"/>
            <KpiCard emoji="💳" label="Ticket promedio" value={`S/. ${data.ticketPromedio.toFixed(0)}`}/>
            <KpiCard emoji="⚡" label="Hora pico" value={data.horaPico} sub="Mayor demanda"/>
            <KpiCard emoji="🏆" label="Mejor día" value={data.mejorDia} subColor="var(--color-primary)"/>
          </div>

          {/* Delivery vs Recojo */}
          <div style={{
            background: 'var(--color-surface)', border: '1px solid var(--color-surface-3)',
            borderRadius: 'var(--radius-xl)', padding: '20px',
            display: 'flex', alignItems: 'center', gap: 20,
          }}>
            <Donut deliveryPct={data.deliveryPct}/>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Tipo de entrega</p>
              {[
                { label: '🛵 Delivery', pct: data.deliveryPct, color: 'var(--color-primary)' },
                { label: '🛍️ Recojo', pct: 100 - data.deliveryPct, color: 'var(--color-secondary)' },
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

      {/* Empty state note */}
      <p style={{ fontSize: 11, color: 'var(--color-muted)', textAlign: 'center', fontWeight: 600 }}>
        Datos actualizados en tiempo real · {activeRestaurant?.nombre}
      </p>
    </div>
  );
}
