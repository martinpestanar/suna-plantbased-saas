import { useState, useEffect, useRef } from 'react';
import { useRouter, useTheme } from '../router.jsx';
import { GrAd } from "react-icons/gr";

/* ── Iconos SVG Inline ── */
const IcoBot = () => (
  <svg viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" width="44" height="44">
    <rect width="44" height="44" rx="14" fill="#EBF5EF"/>
    <rect x="11" y="15" width="22" height="17" rx="5" stroke="#1B4332" strokeWidth="1.8"/>
    <circle cx="16.5" cy="22.5" r="2.5" fill="#40916C"/>
    <circle cx="27.5" cy="22.5" r="2.5" fill="#40916C"/>
    <path d="M17 28h10" stroke="#1B4332" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M22 15v-4M19 11h6" stroke="#1B4332" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const IcoStock = () => (
  <svg viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" width="44" height="44">
    <rect width="44" height="44" rx="14" fill="#EBF5EF"/>
    <path d="M11 30l8-9 5 5 9-11" stroke="#40916C" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="33" cy="13" r="3.5" fill="#1B4332"/>
  </svg>
);
const IcoCocina = () => (
  <svg viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" width="44" height="44">
    <rect width="44" height="44" rx="14" fill="#EBF5EF"/>
    <rect x="11" y="14" width="22" height="19" rx="4" stroke="#1B4332" strokeWidth="1.8"/>
    <path d="M15 22h14M15 27h10" stroke="#1B4332" strokeWidth="1.6" strokeLinecap="round"/>
    <circle cx="22" cy="10" r="2.5" fill="#40916C"/>
  </svg>
);
const IcoMetrics = () => (
  <svg viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" width="44" height="44">
    <rect width="44" height="44" rx="14" fill="#EBF5EF"/>
    <rect x="12" y="24" width="5" height="9" rx="2.5" fill="#40916C"/>
    <rect x="20" y="18" width="5" height="15" rx="2.5" fill="#1B4332"/>
    <rect x="28" y="13" width="5" height="20" rx="2.5" fill="#40916C"/>
  </svg>
);
const IcoStar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="#F59E0B">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
);
const IcoArrow = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
);
const IcoCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1B4332" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

/* ── Datos ── */
const FEATURES = [
  { icon: <IcoBot />,     title: 'Comandas con IA',        desc: 'Bot WhatsApp que toma pedidos, responde dudas y confirma pagos de forma autónoma. 24/7.' },
  { icon: <IcoStock />,   title: 'Stock en Tiempo Real',   desc: 'Cada plato vendido descuenta del inventario. Cero desperdicios, cero sorpresas en cocina.' },
  { icon: <IcoCocina />,  title: 'Panel de Cocina Live',   desc: 'El chef ve los pedidos en tiempo real. Acepta, prepara y despacha con un tap.' },
  { icon: <IcoMetrics />, title: 'Métricas Inteligentes',  desc: 'Ventas del día, platos estrella, hora pico y ticket promedio en tarjetas ejecutivas.' },
];

const STEPS = [
  { num: '01', title: 'Alta en 5 minutos', desc: 'Ingresa tus ingredientes. Nuestra IA redacta las descripciones y sube el menú automáticamente.' },
  { num: '02', title: 'Bot activo al instante', desc: 'Tu agente WhatsApp empieza a atender pedidos desde el primer minuto, sin configuración adicional.' },
  { num: '03', title: 'Métricas en vivo', desc: 'Accede al panel desde tu celular. Ventas, pedidos activos y rendimiento del bot en un vistazo.' },
];

const TESTIMONIALS = [
  { name: 'Camila Rivas', role: 'Dueña · Verde Alma, Miraflores', quote: 'Antes perdíamos pedidos por WhatsApp. Ahora el bot atiende 24/7 y mis ventas subieron 340% en el primer mes.', rating: 5 },
  { name: 'Diego Soto',   role: 'Chef · Raíz Viva, Barranco',     quote: 'El panel de cocina es como tener un segundo cerebro. Cero confusiones, cero platos mal despachados.', rating: 5 },
  { name: 'Sofía Arce',  role: 'Gerente · Broots, San Isidro',    quote: 'Configuramos el menú un viernes y el sábado ya teníamos 23 pedidos desde WhatsApp. Alucinante.', rating: 5 },
];

const STATS = [
  { value: 340, suffix: '%', label: 'Aumento promedio en ventas' },
  { value: 87,  suffix: '%', label: 'Menos tiempo en toma de pedidos' },
  { value: 5,   suffix: 'min', label: 'Para estar online con tu menú' },
  { value: 24,  suffix: '/7', label: 'Atención automática al cliente' },
];

/* ── Animated Counter ── */
function Counter({ value, suffix, label, visible }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const step = Math.ceil(value / 40);
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setCount(value); clearInterval(timer); }
      else setCount(start);
    }, 35);
    return () => clearInterval(timer);
  }, [visible, value]);
  return (
    <div style={{ textAlign: 'center', padding: '24px 12px' }}>
      <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 36, fontWeight: 900, color: '#1B4332', lineHeight: 1 }}>
        {count}{suffix}
      </p>
      <p style={{ fontSize: 11, color: '#6B7280', marginTop: 6, fontWeight: 600, lineHeight: 1.4 }}>{label}</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   LANDING PAGE — VERSIÓN LIGHT
   ═══════════════════════════════════════════════════════════ */
export default function LandingLight() {
  const { navigate } = useRouter();
  const { toggleTheme } = useTheme();
  const statsRef = useRef(null);
  const [statsVisible, setStatsVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStatsVisible(true); }, { threshold: 0.3 });
    if (statsRef.current) obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#F5F2EB',
      overflowY: 'auto', overflowX: 'hidden',
      display: 'flex', justifyContent: 'center',
    }}>
      <div style={{ width: '100%', maxWidth: 480 }}>

        {/* ── NAV ── */}
        <nav style={{
          position: 'sticky', top: 0, zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 24px',
          background: 'rgba(245,242,235,0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #EBE7DC',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <GrAd className="logo-vibrate" size={20} color="var(--color-surface)" />
            </div>
            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, color: '#2D2A26', fontSize: 16 }}>Suna GreenApp</span>
          </div>
          <button
            onClick={() => navigate('/login')}
            style={{
              padding: '8px 18px', borderRadius: 999,
              background: '#1B4332', border: 'none',
              color: '#D8F3DC', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(27,67,50,0.25)',
              transition: 'transform 150ms',
            }}
            onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.96)'; }}
            onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            Ingresar
          </button>
          {/* Theme switcher */}
          <button
            onClick={toggleTheme}
            title="Cambiar a tema oscuro"
            style={{
              width: 34, height: 34, borderRadius: 999,
              background: '#EBF5EF', border: '1px solid #D0E8D7',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, transition: 'background 180ms',
            }}
            onMouseDown={e => { e.currentTarget.style.background = '#D8F3DC'; }}
            onMouseUp={e => { e.currentTarget.style.background = '#EBF5EF'; }}
          >
            🌙
          </button>
        </nav>

        {/* ── HERO ── */}
        <section style={{ padding: '52px 24px 44px', position: 'relative', overflow: 'hidden' }}>
          {/* Orbs decorativos */}
          <div style={{ position: 'absolute', top: -60, right: -40, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(64,145,108,0.1) 0%, transparent 70%)', pointerEvents: 'none' }}/>
          <div style={{ position: 'absolute', bottom: 0, left: -60, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(216,243,220,0.5) 0%, transparent 70%)', pointerEvents: 'none' }}/>

          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: '#EBF5EF', border: '1px solid rgba(64,145,108,0.25)',
            borderRadius: 999, padding: '6px 14px', marginBottom: 20,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#40916C', display: 'inline-block', animation: 'pulse-dot 2s ease-in-out infinite' }}/>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#40916C', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Para restaurantes plant-based
            </span>
          </div>

          <h1 style={{
            fontFamily: 'Outfit, sans-serif', fontSize: 36, fontWeight: 900,
            color: '#2D2A26', lineHeight: 1.18, marginBottom: 18,
            letterSpacing: '-0.02em',
          }}>
            Tu restaurante en piloto{' '}
            <span style={{ color: '#1B4332', position: 'relative' }}>
              automático
              <svg style={{ position: 'absolute', bottom: -4, left: 0, width: '100%' }} height="6" viewBox="0 0 100 6" preserveAspectRatio="none">
                <path d="M0 4 Q25 0 50 4 Q75 8 100 4" stroke="#40916C" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
              </svg>
            </span>{' '}🌱
          </h1>

          <p style={{ fontSize: 15, color: '#6B7280', lineHeight: 1.7, marginBottom: 32, maxWidth: 380 }}>
            Un agente de IA toma los pedidos por WhatsApp, tu cocina los ve en tiempo real y tú duermes tranquilo.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              onClick={() => navigate('/onboarding')}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                padding: '17px 28px', borderRadius: 18,
                background: '#1B4332', color: '#D8F3DC',
                border: 'none', fontSize: 15, fontWeight: 800, cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(27,67,50,0.28)',
                transition: 'transform 150ms cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
              onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.97)'; }}
            >
              Lanzar mi Restaurante 🌱
              <IcoArrow />
            </button>
            <button
              onClick={() => navigate('/login')}
              style={{
                padding: '15px', borderRadius: 18,
                background: '#fff', border: '1.5px solid #EBE7DC',
                color: '#6B7280', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                transition: 'border-color 150ms',
              }}
            >
              Ya tengo cuenta — Ingresar
            </button>
          </div>

          {/* Trust bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 24 }}>
            <div style={{ display: 'flex' }}>
              {['🌿','🥑','🍃'].map((e,i) => (
                <div key={i} style={{
                  width: 28, height: 28, borderRadius: '50%', border: '2px solid #F5F2EB',
                  background: '#EBF5EF', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, marginLeft: i > 0 ? -8 : 0,
                }}>{e}</div>
              ))}
            </div>
            <p style={{ fontSize: 12, color: '#8A8070', fontWeight: 600 }}>
              +120 restaurantes activos en Perú
            </p>
          </div>
        </section>

        {/* ── MOCKUP / PREVIEW ── */}
        <section style={{ padding: '0 20px 44px' }}>
          <div style={{
            background: '#fff', borderRadius: 28, padding: '20px',
            border: '1px solid #EBE7DC',
            boxShadow: '0 4px 32px rgba(0,0,0,0.06)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#40916C', animation: 'pulse-dot 2s ease-in-out infinite' }}/>
              <span style={{ fontSize: 10, fontWeight: 800, color: '#40916C', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Panel Live — Hoy</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
              {[
                { label: 'Ventas', value: 'S/. 1,248', icon: '💰', color: '#1B4332' },
                { label: 'Pedidos', value: '34 total', icon: '📦', color: '#2D2A26' },
                { label: 'Bot IA', value: 'Activo', icon: '🤖', color: '#40916C' },
                { label: 'En cocina', value: '3 ahora', icon: '👨‍🍳', color: '#2D2A26' },
              ].map(({ label, value, icon, color }) => (
                <div key={label} style={{ background: '#F5F2EB', borderRadius: 14, padding: '14px', border: '1px solid #EBE7DC' }}>
                  <p style={{ fontSize: 18, marginBottom: 4 }}>{icon}</p>
                  <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 15, fontWeight: 900, color }}>{value}</p>
                  <p style={{ fontSize: 10, color: '#8A8070', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#8A8070', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
              Platos más vendidos hoy
            </p>
            {[
              { name: 'Hamburguesa Suna', pct: 88 },
              { name: 'Bowl Quinua Fest', pct: 72 },
              { name: 'Kombucha Ancestral', pct: 55 },
            ].map(({ name, pct }) => (
              <div key={name} style={{ marginBottom: 9 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: '#2D2A26', fontWeight: 600 }}>{name}</span>
                  <span style={{ fontSize: 11, color: '#1B4332', fontWeight: 800 }}>{pct}%</span>
                </div>
                <div style={{ height: 6, background: '#EBE7DC', borderRadius: 99 }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#1B4332,#40916C)', borderRadius: 99 }}/>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── STATS ── */}
        <section ref={statsRef} style={{ background: '#1B4332', padding: '40px 24px' }}>
          <p style={{ textAlign: 'center', fontSize: 10, fontWeight: 800, color: 'rgba(216,243,220,0.5)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 16 }}>
            Resultados reales
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
            {STATS.map((s, i) => (
              <div key={i} style={{
                background: i % 2 === 0 ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.05)',
                borderRight: i % 2 === 0 ? '1px solid rgba(255,255,255,0.08)' : 'none',
                borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.08)' : 'none',
              }}>
                <div style={{ textAlign: 'center', padding: '22px 12px' }}>
                  <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 34, fontWeight: 900, color: '#D8F3DC', lineHeight: 1 }}>
                    {statsVisible ? <AnimCount value={s.value} suffix={s.suffix}/> : `0${s.suffix}`}
                  </p>
                  <p style={{ fontSize: 11, color: 'rgba(216,243,220,0.55)', marginTop: 6, fontWeight: 600, lineHeight: 1.4 }}>{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section style={{ padding: '48px 20px' }}>
          <p style={{ fontSize: 10, fontWeight: 800, color: '#40916C', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>Funcionalidades</p>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 26, fontWeight: 900, color: '#2D2A26', marginBottom: 24, lineHeight: 1.2 }}>
            Todo lo que necesitas, <span style={{ color: '#1B4332' }}>sin fricciones</span>
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {FEATURES.map(({ icon, title, desc }) => (
              <div key={title} style={{
                display: 'flex', gap: 14, alignItems: 'flex-start',
                background: '#fff', border: '1px solid #EBE7DC',
                borderRadius: 20, padding: '18px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              }}>
                <div style={{ flexShrink: 0 }}>{icon}</div>
                <div>
                  <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 14, fontWeight: 800, color: '#2D2A26', marginBottom: 4 }}>{title}</p>
                  <p style={{ fontSize: 12.5, color: '#6B7280', lineHeight: 1.6 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CÓMO FUNCIONA ── */}
        <section style={{ padding: '0 20px 48px', background: '#fff', borderTop: '1px solid #EBE7DC', borderBottom: '1px solid #EBE7DC' }}>
          <div style={{ paddingTop: 40, marginBottom: 28 }}>
            <p style={{ fontSize: 10, fontWeight: 800, color: '#40916C', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>Proceso</p>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 26, fontWeight: 900, color: '#2D2A26', lineHeight: 1.2 }}>
              Online en <span style={{ color: '#1B4332' }}>3 pasos</span>
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {STEPS.map(({ num, title, desc }, i) => (
              <div key={num} style={{ display: 'flex', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: '#1B4332',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'Outfit, sans-serif', fontSize: 12, fontWeight: 900, color: '#D8F3DC',
                    flexShrink: 0,
                  }}>{num}</div>
                  {i < STEPS.length - 1 && (
                    <div style={{ width: 2, flex: 1, background: '#EBE7DC', margin: '6px 0', minHeight: 32 }}/>
                  )}
                </div>
                <div style={{ paddingBottom: i < STEPS.length - 1 ? 28 : 0, paddingTop: 8 }}>
                  <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 14, fontWeight: 800, color: '#2D2A26', marginBottom: 4 }}>{title}</p>
                  <p style={{ fontSize: 12.5, color: '#6B7280', lineHeight: 1.6 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── TESTIMONIOS ── */}
        <section style={{ padding: '48px 0' }}>
          <div style={{ padding: '0 20px', marginBottom: 20 }}>
            <p style={{ fontSize: 10, fontWeight: 800, color: '#40916C', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>Testimonios</p>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 26, fontWeight: 900, color: '#2D2A26', lineHeight: 1.2 }}>
              Ellos ya <span style={{ color: '#1B4332' }}>confían en Suna</span>
            </h2>
          </div>
          <div style={{
            display: 'flex', gap: 12, paddingLeft: 20, paddingRight: 20,
            overflowX: 'auto', paddingBottom: 8,
          }}>
            {TESTIMONIALS.map(({ name, role, quote, rating }) => (
              <div key={name} style={{
                flexShrink: 0, width: 272,
                background: '#fff', border: '1px solid #EBE7DC',
                borderRadius: 22, padding: '18px',
                boxShadow: '0 2px 16px rgba(0,0,0,0.05)',
              }}>
                <div style={{ display: 'flex', gap: 2, marginBottom: 10 }}>
                  {Array.from({ length: rating }).map((_, i) => <IcoStar key={i} />)}
                </div>
                <p style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.6, marginBottom: 14, fontStyle: 'italic' }}>"{quote}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%',
                    background: 'linear-gradient(135deg,#1B4332,#40916C)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'Outfit, sans-serif', fontWeight: 900, color: '#D8F3DC', fontSize: 16,
                  }}>{name[0]}</div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 800, color: '#2D2A26' }}>{name}</p>
                    <p style={{ fontSize: 10, color: '#8A8070', fontWeight: 600 }}>{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA FINAL ── */}
        <section style={{
          margin: '0 16px 32px',
          background: 'linear-gradient(135deg, #1B4332 0%, #2C6246 100%)',
          borderRadius: 28, padding: '40px 24px',
          textAlign: 'center', position: 'relative', overflow: 'hidden',
          boxShadow: '0 12px 40px rgba(27,67,50,0.25)',
        }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }}/>
          <p style={{ fontSize: 36, marginBottom: 14 }}>🌱</p>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 24, fontWeight: 900, color: '#fff', marginBottom: 10, lineHeight: 1.25 }}>
            Tu restaurante merece tecnología de primer nivel
          </h2>
          <p style={{ fontSize: 13, color: 'rgba(216,243,220,0.7)', lineHeight: 1.6, marginBottom: 28 }}>
            Sin contratos, sin permanencia.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28, textAlign: 'left' }}>
            {['Alta gratuita con IA en 5 minutos', 'Bot WhatsApp activo desde el día 1', 'Panel de cocina incluido'].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(216,243,220,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <IcoCheck />
                </div>
                <span style={{ fontSize: 13, color: 'rgba(216,243,220,0.85)', fontWeight: 600 }}>{item}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate('/onboarding')}
            style={{
              width: '100%', padding: '17px', borderRadius: 18,
              background: '#D8F3DC', color: '#1B4332',
              fontSize: 15, fontWeight: 900, cursor: 'pointer', border: 'none',
              boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
              transition: 'transform 150ms cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
            onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.97)'; }}
            onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            Lanzar mi Restaurante 🌱
          </button>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{ padding: '24px', textAlign: 'center', borderTop: '1px solid #EBE7DC' }}>
          <p style={{ fontSize: 12, color: '#8A8070', fontWeight: 600 }}>
            © 2025 Suna GreenApp · Korat Flow Agencia · Hecho en Perú 🌿
          </p>
        </footer>
      </div>
    </div>
  );
}

/* Helper AnimCount fuera del componente principal */
function AnimCount({ value, suffix }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(value / 40);
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setCount(value); clearInterval(timer); }
      else setCount(start);
    }, 35);
    return () => clearInterval(timer);
  }, [value]);
  return <>{count}{suffix}</>;
}
