import { useState, useEffect, useRef } from 'react';
import { useRouter, useTheme } from '../router.jsx';
import { GrAd } from "react-icons/gr";

/* ── Iconos SVG Inline ── */
const IcoBot = () => (
  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width="40" height="40">
    <rect width="40" height="40" rx="12" fill="rgba(216,243,220,0.15)"/>
    <rect x="10" y="14" width="20" height="16" rx="4" stroke="#D8F3DC" strokeWidth="1.8"/>
    <circle cx="15" cy="21" r="2" fill="#40916C"/>
    <circle cx="25" cy="21" r="2" fill="#40916C"/>
    <path d="M16 27h8" stroke="#D8F3DC" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M20 14v-4M17 10h6" stroke="#D8F3DC" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const IcoStock = () => (
  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width="40" height="40">
    <rect width="40" height="40" rx="12" fill="rgba(216,243,220,0.15)"/>
    <path d="M10 28l7-8 5 4 8-10" stroke="#40916C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="30" cy="12" r="3" fill="#D8F3DC"/>
  </svg>
);
const IcoCocina = () => (
  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width="40" height="40">
    <rect width="40" height="40" rx="12" fill="rgba(216,243,220,0.15)"/>
    <path d="M13 20h14M13 25h10" stroke="#D8F3DC" strokeWidth="1.8" strokeLinecap="round"/>
    <rect x="10" y="13" width="20" height="18" rx="4" stroke="#D8F3DC" strokeWidth="1.8"/>
    <circle cx="20" cy="10" r="2" fill="#40916C"/>
  </svg>
);
const IcoMetrics = () => (
  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width="40" height="40">
    <rect width="40" height="40" rx="12" fill="rgba(216,243,220,0.15)"/>
    <rect x="11" y="22" width="4" height="8" rx="2" fill="#40916C"/>
    <rect x="18" y="16" width="4" height="14" rx="2" fill="#D8F3DC"/>
    <rect x="25" y="12" width="4" height="18" rx="2" fill="#40916C"/>
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
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#40916C" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

/* ── Datos ── */
const FEATURES = [
  { icon: <IcoBot />,     title: 'Comandas con IA',         desc: 'Bot WhatsApp que toma pedidos, responde dudas y confirma pagos de forma autónoma. 24/7.' },
  { icon: <IcoStock />,   title: 'Stock en Tiempo Real',    desc: 'Cada plato vendido descuenta del inventario. Cero desperdicios, cero sorpresas en cocina.' },
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
    <div style={{ textAlign: 'center', padding: '20px 12px' }}>
      <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 36, fontWeight: 900, color: '#D8F3DC', lineHeight: 1 }}>
        {count}{suffix}
      </p>
      <p style={{ fontSize: 11, color: 'rgba(216,243,220,0.6)', marginTop: 6, fontWeight: 600, lineHeight: 1.4 }}>{label}</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   LANDING PAGE
   ═══════════════════════════════════════════════════════════ */
export default function Landing() {
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
      background: '#0F1A15',
      overflowY: 'auto', overflowX: 'hidden',
      display: 'flex', justifyContent: 'center',
    }}>
      <div style={{
        width: '100%', maxWidth: 480,
      }}>

        {/* ── NAV ── */}
        <nav style={{
          position: 'sticky', top: 0, zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 24px',
          background: 'rgba(15,26,21,0.88)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
            }}>
              <GrAd className="logo-vibrate" size={20} color="var(--color-primary)" />
            </div>
            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, color: '#fff', fontSize: 16 }}>Suna GreenApp</span>
          </div>
          <button
            onClick={() => navigate('/login')}
            style={{
              padding: '8px 18px', borderRadius: 999,
              background: 'transparent', border: '1.5px solid rgba(216,243,220,0.3)',
              color: '#D8F3DC', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              transition: 'all 180ms ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(216,243,220,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            Ingresar
          </button>
          {/* Theme switcher */}
          <button
            onClick={toggleTheme}
            title="Cambiar a tema claro"
            style={{
              width: 34, height: 34, borderRadius: 999,
              background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.12)',
              color: '#D8F3DC', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, transition: 'all 180ms',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
          >
            ☀️
          </button>
        </nav>

        {/* ── HERO ── */}
        <section style={{ padding: '56px 24px 48px', position: 'relative', overflow: 'hidden' }}>
          {/* BG gradient orbs */}
          <div style={{
            position: 'absolute', top: -60, right: -60,
            width: 280, height: 280, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(64,145,108,0.18) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}/>
          <div style={{
            position: 'absolute', bottom: -40, left: -80,
            width: 200, height: 200, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(27,67,50,0.3) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}/>

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(64,145,108,0.2)', border: '1px solid rgba(64,145,108,0.4)',
            borderRadius: 999, padding: '6px 14px', marginBottom: 24,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#40916C', display: 'inline-block', boxShadow: '0 0 0 3px rgba(64,145,108,0.3)', animation: 'pulse-dot 2s ease-in-out infinite' }}/>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#40916C', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Para restaurantes plant-based
            </span>
          </div>

          <h1 style={{
            fontFamily: 'Outfit, sans-serif', fontSize: 38, fontWeight: 900,
            color: '#fff', lineHeight: 1.15, marginBottom: 20,
            letterSpacing: '-0.02em',
          }}>
            Tu restaurante en piloto{' '}
            <span style={{
              background: 'linear-gradient(135deg, #40916C 0%, #D8F3DC 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>automático</span> 🌱
          </h1>

          <p style={{
            fontSize: 15, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7,
            marginBottom: 36, maxWidth: 380,
          }}>
            Un agente de IA toma los pedidos por WhatsApp, tu cocina los ve en tiempo real y tú duermes tranquilo.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button
              onClick={() => navigate('/onboarding')}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                padding: '18px 32px', borderRadius: 20,
                background: 'linear-gradient(135deg, #1B4332 0%, #2C6246 100%)',
                color: '#D8F3DC', border: '1px solid rgba(216,243,220,0.15)',
                fontSize: 15, fontWeight: 800, cursor: 'pointer', letterSpacing: '0.01em',
                boxShadow: '0 8px 32px rgba(27,67,50,0.5)',
                transition: 'transform 150ms cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
              onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.97)'; }}
              onMouseUp={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
            >
              Lanzar mi Restaurante 🌱
              <IcoArrow />
            </button>
            <button
              onClick={() => navigate('/login')}
              style={{
                padding: '16px', borderRadius: 20,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Ya tengo cuenta — Ingresar
            </button>
          </div>

          {/* Mini trust indicators */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 28 }}>
            <div style={{ display: 'flex' }}>
              {['🌿','🥑','🍃'].map((e,i) => (
                <div key={i} style={{
                  width: 28, height: 28, borderRadius: '50%', border: '2px solid #0F1A15',
                  background: '#1B4332', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, marginLeft: i > 0 ? -8 : 0,
                }}>{e}</div>
              ))}
            </div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
              +120 restaurantes activos en Perú
            </p>
          </div>
        </section>

        {/* ── MOCKUP VISUAL ── */}
        <section style={{ padding: '0 24px 48px' }}>
          <div style={{
            background: 'linear-gradient(160deg, #1B4332 0%, #123024 100%)',
            borderRadius: 28, padding: '24px 20px',
            border: '1px solid rgba(255,255,255,0.06)',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }}/>

            {/* Simulated app card preview */}
            <p style={{ fontSize: 10, fontWeight: 800, color: 'rgba(216,243,220,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>PANEL LIVE — HOY</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              {[
                { label: 'Ventas', value: 'S/. 1,248', icon: '💰', color: '#D8F3DC' },
                { label: 'Pedidos', value: '34 total', icon: '📦', color: '#D8F3DC' },
                { label: 'Bot IA', value: 'Activo', icon: '🤖', color: '#40916C' },
                { label: 'En cocina', value: '3 ahora', icon: '👨‍🍳', color: '#D8F3DC' },
              ].map(({ label, value, icon, color }) => (
                <div key={label} style={{
                  background: 'rgba(0,0,0,0.2)', borderRadius: 16, padding: '14px',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <p style={{ fontSize: 18, marginBottom: 4 }}>{icon}</p>
                  <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 16, fontWeight: 800, color }}>{value}</p>
                  <p style={{ fontSize: 10, color: 'rgba(216,243,220,0.45)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
                </div>
              ))}
            </div>
            {/* Mini bar chart */}
            <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(216,243,220,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Platos más vendidos hoy</p>
            {[
              { name: 'Hamburguesa Suna', pct: 88 },
              { name: 'Bowl Quinua Fest', pct: 72 },
              { name: 'Kombucha Ancestral', pct: 55 },
            ].map(({ name, pct }) => (
              <div key={name} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: 'rgba(216,243,220,0.7)', fontWeight: 600 }}>{name}</span>
                  <span style={{ fontSize: 11, color: '#40916C', fontWeight: 800 }}>{pct}%</span>
                </div>
                <div style={{ height: 5, background: 'rgba(255,255,255,0.07)', borderRadius: 99 }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#40916C,#D8F3DC)', borderRadius: 99, transition: 'width 1s ease' }}/>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── STATS ── */}
        <section ref={statsRef} style={{
          background: 'linear-gradient(160deg, #1B4332 0%, #0F2318 100%)',
          padding: '40px 24px',
        }}>
          <p style={{ textAlign: 'center', fontSize: 10, fontWeight: 800, color: 'rgba(216,243,220,0.4)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>RESULTADOS REALES</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)' }}>
            {STATS.map((s, i) => (
              <div key={i} style={{
                borderRight: i % 2 === 0 ? '1px solid rgba(255,255,255,0.07)' : 'none',
                borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.07)' : 'none',
              }}>
                <Counter {...s} visible={statsVisible} />
              </div>
            ))}
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section style={{ padding: '52px 24px' }}>
          <div style={{ marginBottom: 32 }}>
            <p style={{ fontSize: 10, fontWeight: 800, color: '#40916C', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>FUNCIONALIDADES</p>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 28, fontWeight: 900, color: '#fff', lineHeight: 1.2 }}>
              Todo lo que necesitas,{' '}
              <span style={{ color: '#40916C' }}>sin fricciones</span>
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {FEATURES.map(({ icon, title, desc }) => (
              <div key={title} style={{
                display: 'flex', gap: 16, alignItems: 'flex-start',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 20, padding: '20px',
                transition: 'background 200ms',
              }}>
                <div style={{ flexShrink: 0 }}>{icon}</div>
                <div>
                  <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{title}</p>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CÓMO FUNCIONA ── */}
        <section style={{ padding: '0 24px 52px' }}>
          <div style={{ marginBottom: 32 }}>
            <p style={{ fontSize: 10, fontWeight: 800, color: '#40916C', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>PROCESO</p>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 28, fontWeight: 900, color: '#fff', lineHeight: 1.2 }}>
              Online en{' '}
              <span style={{ color: '#40916C' }}>3 pasos</span>
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {STEPS.map(({ num, title, desc }, i) => (
              <div key={num} style={{ display: 'flex', gap: 16 }}>
                {/* Timeline */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: 'linear-gradient(135deg,#1B4332,#2C6246)',
                    border: '1px solid rgba(64,145,108,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'Outfit, sans-serif', fontSize: 12, fontWeight: 900, color: '#D8F3DC',
                  }}>{num}</div>
                  {i < STEPS.length - 1 && (
                    <div style={{ width: 2, flex: 1, background: 'rgba(64,145,108,0.2)', margin: '4px 0', minHeight: 32 }}/>
                  )}
                </div>
                <div style={{ paddingBottom: i < STEPS.length - 1 ? 28 : 0, paddingTop: 8 }}>
                  <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{title}</p>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── TESTIMONIOS ── */}
        <section style={{ padding: '0 0 52px', overflow: 'hidden' }}>
          <div style={{ padding: '0 24px', marginBottom: 24 }}>
            <p style={{ fontSize: 10, fontWeight: 800, color: '#40916C', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>TESTIMONIOS</p>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 28, fontWeight: 900, color: '#fff', lineHeight: 1.2 }}>
              Ellos ya{' '}
              <span style={{ color: '#40916C' }}>confían en Suna</span>
            </h2>
          </div>
          <div style={{
            display: 'flex', gap: 12, paddingLeft: 24, paddingRight: 24,
            overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4,
          }}>
            {TESTIMONIALS.map(({ name, role, quote, rating }) => (
              <div key={name} style={{
                flexShrink: 0, width: 280,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 24, padding: '20px',
              }}>
                <div style={{ display: 'flex', gap: 2, marginBottom: 12 }}>
                  {Array.from({ length: rating }).map((_, i) => <IcoStar key={i} />)}
                </div>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, marginBottom: 16, fontStyle: 'italic' }}>"{quote}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'linear-gradient(135deg,#1B4332,#40916C)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16,
                  }}>{name[0]}</div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{name}</p>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{role}</p>
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
          border: '1px solid rgba(216,243,220,0.1)',
          textAlign: 'center', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }}/>
          <p style={{ fontSize: 36, marginBottom: 16 }}>🌱</p>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 26, fontWeight: 900, color: '#fff', marginBottom: 12, lineHeight: 1.2 }}>
            Tu restaurante merece tecnología de primer nivel
          </h2>
          <p style={{ fontSize: 13, color: 'rgba(216,243,220,0.65)', lineHeight: 1.6, marginBottom: 32 }}>
            Únete a los restaurantes plant-based que ya automatizaron sus pedidos. Sin contratos, sin permanencia.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              'Alta gratuita con IA en 5 minutos',
              'Bot WhatsApp activo desde el día 1',
              'Panel de cocina incluido',
            ].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <IcoCheck />
                <span style={{ fontSize: 13, color: 'rgba(216,243,220,0.8)', fontWeight: 600 }}>{item}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate('/onboarding')}
            style={{
              marginTop: 28, width: '100%',
              padding: '18px', borderRadius: 20,
              background: '#D8F3DC', color: '#1B4332',
              fontSize: 15, fontWeight: 900, cursor: 'pointer', border: 'none',
              boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
              transition: 'transform 150ms cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
            onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.97)'; }}
            onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            Lanzar mi Restaurante 🌱
          </button>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{ padding: '24px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', fontWeight: 600 }}>
            © 2025 Suna GreenApp · Korat Flow Agencia · Hecho en Perú 🌿
          </p>
        </footer>
      </div>
    </div>
  );
}
