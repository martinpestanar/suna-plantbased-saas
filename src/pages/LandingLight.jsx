import { useState, useEffect, useRef } from 'react';
import { useRouter, useTheme } from '../router.jsx';
import { GrAd } from "react-icons/gr";

/* ── Custom Hook for Responsiveness ── */
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return isMobile;
}

/* ── Iconos SVG Inline con Gradientes y Colores Vivos ── */
const IcoBot = () => (
  <svg viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" width="44" height="44">
    <rect width="44" height="44" rx="14" fill="url(#gradBot)" />
    <rect x="11" y="15" width="22" height="17" rx="5" stroke="#1B4332" strokeWidth="1.8"/>
    <circle cx="16.5" cy="22.5" r="2.5" fill="#40916C"/>
    <circle cx="27.5" cy="22.5" r="2.5" fill="#40916C"/>
    <path d="M17 28h10" stroke="#1B4332" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M22 15v-4M19 11h6" stroke="#1B4332" strokeWidth="1.5" strokeLinecap="round"/>
    <defs>
      <linearGradient id="gradBot" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#D8F3DC" />
        <stop offset="100%" stopColor="#B7E4C7" />
      </linearGradient>
    </defs>
  </svg>
);
const IcoStock = () => (
  <svg viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" width="44" height="44">
    <rect width="44" height="44" rx="14" fill="url(#gradStock)" />
    <path d="M11 30l8-9 5 5 9-11" stroke="#2D6246" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="33" cy="13" r="3.5" fill="#1B4332"/>
    <defs>
      <linearGradient id="gradStock" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#E8F5E9" />
        <stop offset="100%" stopColor="#C8E6C9" />
      </linearGradient>
    </defs>
  </svg>
);
const IcoCocina = () => (
  <svg viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" width="44" height="44">
    <rect width="44" height="44" rx="14" fill="url(#gradCocina)" />
    <rect x="11" y="14" width="22" height="19" rx="4" stroke="#1B4332" strokeWidth="1.8"/>
    <path d="M15 22h14M15 27h10" stroke="#1B4332" strokeWidth="1.6" strokeLinecap="round"/>
    <circle cx="22" cy="10" r="2.5" fill="#40916C"/>
    <defs>
      <linearGradient id="gradCocina" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#E0F2F1" />
        <stop offset="100%" stopColor="#B2DFDB" />
      </linearGradient>
    </defs>
  </svg>
);
const IcoMetrics = () => (
  <svg viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" width="44" height="44">
    <rect width="44" height="44" rx="14" fill="url(#gradMetrics)" />
    <rect x="12" y="24" width="5" height="9" rx="2.5" fill="#40916C"/>
    <rect x="20" y="18" width="5" height="15" rx="2.5" fill="#1B4332"/>
    <rect x="28" y="13" width="5" height="20" rx="2.5" fill="#40916C"/>
    <defs>
      <linearGradient id="gradMetrics" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFF3E0" />
        <stop offset="100%" stopColor="#FFE0B2" />
      </linearGradient>
    </defs>
  </svg>
);
const IcoStar = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="#F59E0B">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
);
const IcoArrow = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
);
const IcoCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D8F3DC" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

/* ── Datos Optimizado para Dolores ── */
const FEATURES = [
  { icon: <IcoBot />,     title: 'Pedidos Directos con IA',  desc: 'Un bot de WhatsApp fluido que responde al instante, toma pedidos complejos, ofrece extras saludables y confirma pagos sin demoras.' },
  { icon: <IcoStock />,   title: 'Protección de Insumos',     desc: 'Ideal para ingredientes frescos y costosos (aguacate, leches vegetales). Si un ingrediente clave se agota, la IA actualiza tu carta al instante.' },
  { icon: <IcoCocina />,  title: 'Cocina en Sincronía',      desc: 'Adiós al desorden de comandas en papel. El chef gestiona el flujo de trabajo en tiempo real desde una pantalla interactiva.' },
  { icon: <IcoMetrics />, title: 'Márgenes sin Intermediarios', desc: 'Recupera hasta el 30% que hoy pagas a apps de delivery tradicionales. Todo tu margen vuelve directamente a tu bolsillo.' },
];

const STEPS = [
  { num: '01', title: 'Sube tu menú con IA', desc: 'Ingresa tus platos e ingredientes. Nuestra IA estructurará tu carta con descripciones irresistibles en minutos.' },
  { num: '02', title: 'Activa tu WhatsApp', desc: 'Tus clientes te escriben o escanean tu código QR. La IA atiende, procesa y guarda el pedido automáticamente.' },
  { num: '03', title: 'Domina tus números', desc: 'Supervisa tus ventas diarias, platos estrella y rendimiento del bot desde cualquier dispositivo.' },
];

const TESTIMONIALS = [
  { name: 'Camila Rivas', role: 'Dueña · Verde Alma, Miraflores', quote: 'El 30% de comisión de Rappi nos ahogaba. Con Suna, nuestros clientes piden directo por WhatsApp y las ventas subieron 340% este mes sin pagar intermediarios.', rating: 5 },
  { name: 'Diego Soto',   role: 'Chef · Raíz Viva, Barranco',     quote: 'Antes los meseros apuntaban mal los pedidos especiales. Ahora la IA envía cada personalización sin errores directo al panel de cocina.', rating: 5 },
  { name: 'Sofía Arce',  role: 'Gerente · Broots, San Isidro',    quote: 'Configuramos el menú de almuerzos en 5 minutos. El primer sábado procesamos 23 pedidos en automático mientras nos enfocábamos en servir.', rating: 5 },
];

const STATS = [
  { value: 30,  suffix: '%',  label: 'Margen recuperado sin comisiones' },
  { value: 92,  suffix: '%',  label: 'Reducción en tiempo de espera' },
  { value: 5,   suffix: 'min', label: 'Tiempo de configuración inicial' },
  { value: 24,  suffix: '/7', label: 'Atención automática sin pausas' },
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
    <div style={{ textAlign: 'center', padding: '28px 16px' }}>
      <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 38, fontWeight: 900, color: '#D8F3DC', lineHeight: 1 }}>
        {count}{suffix}
      </p>
      <p style={{ fontSize: 12, color: 'rgba(216,243,220,0.6)', marginTop: 8, fontWeight: 600, lineHeight: 1.4 }}>{label}</p>
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
  const isMobile = useIsMobile();

  // Estados de Hover interactivos
  const [hoveredFeature, setHoveredFeature] = useState(null);
  const [hoveredStep, setHoveredStep] = useState(null);
  const [hoveredTestimonial, setHoveredTestimonial] = useState(null);

  // Smooth scroll
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStatsVisible(true); }, { threshold: 0.2 });
    if (statsRef.current) obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      background: '#FAF9F6',
      backgroundImage: 'radial-gradient(rgba(27,67,50,0.035) 1.5px, transparent 1.5px), radial-gradient(circle at 10% 20%, rgba(64,145,108,0.06) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(216,243,220,0.35) 0%, transparent 50%)',
      backgroundSize: '24px 24px, 100% 100%, 100% 100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      
      {/* ── NAV (Rediseñado para alto contraste y distinción) ── */}
      <nav style={{
        width: '100%',
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
        display: 'flex',
        justifyContent: 'center',
        boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
      }}>
        <div style={{
          width: '100%',
          maxWidth: 1200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: '#1B4332', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
            }}>
              <GrAd className="logo-vibrate" size={20} color="#fff" />
            </div>
            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, color: '#111', fontSize: 18 }}>Suna GreenApp</span>
          </div>

          {/* Menú de Navegación en Desktop */}
          {!isMobile && (
            <div style={{ display: 'flex', gap: 32 }}>
              {[
                { label: 'Funcionalidades', id: 'features' },
                { label: 'Proceso', id: 'process' },
                { label: 'Testimonios', id: 'testimonials' }
              ].map(link => (
                <button
                  key={link.id}
                  onClick={() => scrollTo(link.id)}
                  style={{
                    background: 'none', border: 'none',
                    color: '#4B5563', fontSize: 14, fontWeight: 700,
                    cursor: 'pointer', transition: 'all 180ms ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#1B4332'}
                  onMouseLeave={e => e.currentTarget.style.color = '#4B5563'}
                >
                  {link.label}
                </button>
              ))}
            </div>
          )}
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button
              onClick={() => navigate('/login')}
              style={{
                padding: '10px 22px', borderRadius: 999,
                background: 'transparent', border: '1.5px solid #1B4332',
                color: '#1B4332', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#1B4332'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#1B4332'; }}
            >
              Ingresar
            </button>
            {/* Theme switcher */}
            <button
              onClick={toggleTheme}
              title="Cambiar a tema oscuro"
              style={{
                width: 38, height: 38, borderRadius: 999,
                background: '#F3F4F6', border: '1px solid #E5E7EB',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, transition: 'background 180ms',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#E5E7EB'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#F3F4F6'; }}
            >
              🌙
            </button>
          </div>
        </div>
      </nav>

      {/* Container Principal */}
      <div style={{ width: '100%', maxWidth: 1200, boxSizing: 'border-box' }}>
        
        {/* ── HERO ── */}
        <section style={{ 
          padding: isMobile ? '56px 24px 48px' : '90px 24px 72px', 
          position: 'relative', 
          overflow: 'hidden',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: 'center',
          gap: isMobile ? '40px' : '64px',
        }}>
          {/* Orbs decorativos */}
          <div style={{ position: 'absolute', top: -60, right: -40, width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(64,145,108,0.08) 0%, transparent 70%)', pointerEvents: 'none' }}/>
          <div style={{ position: 'absolute', bottom: 0, left: -60, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(216,243,220,0.5) 0%, transparent 70%)', pointerEvents: 'none' }}/>

          {/* Columna Texto */}
          <div style={{ flex: 1.2, zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: isMobile ? 'center' : 'flex-start', textAlign: isMobile ? 'center' : 'left' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: '#EBF5EF', border: '1px solid rgba(64,145,108,0.25)',
              borderRadius: 999, padding: '6px 14px', marginBottom: 24,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#40916C', display: 'inline-block', animation: 'pulse-dot 2s ease-in-out infinite' }}/>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#40916C', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Para restaurantes plant-based y saludables
              </span>
            </div>

            <h1 style={{
              fontFamily: 'Outfit, sans-serif', fontSize: isMobile ? 38 : 54, fontWeight: 950,
              color: '#2D2A26', lineHeight: 1.15, marginBottom: 20,
              letterSpacing: '-0.02em',
            }}>
              Automatiza tus pedidos por WhatsApp y{' '}
              <span style={{
                background: 'linear-gradient(135deg, #1B4332 0%, #40916C 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>recupera tu margen</span> 🌱
            </h1>

            <p style={{
              fontSize: isMobile ? 15 : 18, color: '#6B7280', lineHeight: 1.7,
              marginBottom: 36, maxWidth: 540,
            }}>
              Suna atiende a tus clientes las 24/7 con Inteligencia Artificial. Toma pedidos, sincroniza cocina y descuenta insumos frescos automáticamente sin pagar comisiones de apps tradicionales.
            </p>

            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 14, width: '100%', maxWidth: 460 }}>
              <button
                onClick={() => navigate('/onboarding')}
                style={{
                  flex: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  padding: '18px 32px', borderRadius: 20,
                  background: '#1B4332', color: '#D8F3DC',
                  border: 'none',
                  fontSize: 15, fontWeight: 800, cursor: 'pointer', letterSpacing: '0.01em',
                  boxShadow: '0 8px 32px rgba(27,67,50,0.22)',
                  transition: 'transform 150ms cubic-bezier(0.34, 1.56, 0.64, 1), background-color 150ms',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.background = '#2C6246'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = '#1B4332'; }}
              >
                Comenzar Gratis 🌱
                <IcoArrow />
              </button>
              <button
                onClick={() => navigate('/login')}
                style={{
                  flex: 1,
                  padding: '18px 32px', borderRadius: 20,
                  background: '#fff', border: '1.5px solid #EBE7DC',
                  color: '#6B7280', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                  transition: 'border-color 200ms, transform 150ms',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#1B4332'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#EBE7DC'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                Ingresar a mi Panel
              </button>
            </div>

            {/* Mini trust indicators */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 36 }}>
              <div style={{ display: 'flex' }}>
                {['🌿','🥑','🍃'].map((e,i) => (
                  <div key={i} style={{
                    width: 30, height: 30, borderRadius: '50%', border: '2px solid #FAF9F6',
                    background: '#EBF5EF', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, marginLeft: i > 0 ? -10 : 0,
                  }}>{e}</div>
                ))}
              </div>
              <p style={{ fontSize: 13, color: '#8A8070', fontWeight: 600 }}>
                Diseñado exclusivamente para la restauración consciente y saludable.
              </p>
            </div>
          </div>

          {/* Columna Visual Mockup */}
          <div style={{ flex: 1, width: '100%', maxWidth: 520, zIndex: 2 }}>
            <div style={{
              background: '#fff',
              borderRadius: 28, padding: '24px 20px',
              border: '1px solid rgba(27,67,50,0.08)',
              position: 'relative', overflow: 'hidden',
              boxShadow: '0 20px 48px rgba(27,67,50,0.08)',
            }}>
              <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(64,145,108,0.03)', pointerEvents: 'none' }}/>

              {/* Simulated app card preview */}
              <p style={{ fontSize: 10, fontWeight: 800, color: '#40916C', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>PANEL LIVE — HOY</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
                {[
                  { label: 'Ventas Directas', value: 'S/. 1,248', icon: '💰', color: '#1B4332' },
                  { label: 'Pedidos por Bot', value: '34 total', icon: '🤖', color: '#2D2A26' },
                  { label: 'WhatsApp Status', value: 'Activo', icon: '⚡', color: '#40916C' },
                  { label: 'Ahorro Comisiones', value: 'S/. 374', icon: '📈', color: '#1B4332' },
                ].map(({ label, value, icon, color }) => (
                  <div key={label} style={{
                    background: '#F5F2EB', borderRadius: 16, padding: '14px',
                    border: '1px solid #EBE7DC',
                  }}>
                    <p style={{ fontSize: 18, marginBottom: 4 }}>{icon}</p>
                    <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 16, fontWeight: 800, color }}>{value}</p>
                    <p style={{ fontSize: 10, color: '#8A8070', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
                  </div>
                ))}
              </div>

              {/* Mini bar chart */}
              <p style={{ fontSize: 10, fontWeight: 700, color: '#8A8070', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Insumos Críticos Controlados</p>
              {[
                { name: 'Palta / Aguacate Fresco', pct: 90, status: 'Disponible' },
                { name: 'Leche de Almendra Local', pct: 45, status: 'Stock Crítico' },
                { name: 'Brotes Orgánicos', pct: 15, status: 'Agotado (Auto-oculto)' },
              ].map(({ name, pct, status }) => (
                <div key={name} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: '#2D2A26', fontWeight: 600 }}>{name}</span>
                    <span style={{ fontSize: 10, color: pct < 30 ? '#EF4444' : pct < 50 ? '#F59E0B' : '#40916C', fontWeight: 800 }}>{status}</span>
                  </div>
                  <div style={{ height: 6, background: '#EBE7DC', borderRadius: 99 }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: pct < 30 ? 'linear-gradient(90deg,#EF4444,#F87171)' : 'linear-gradient(90deg,#1B4332,#40916C)', borderRadius: 99 }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── STATS ── */}
        <section ref={statsRef} style={{
          background: '#1B4332',
          padding: '48px 24px',
          borderRadius: 24,
          margin: '0 24px',
          boxShadow: '0 12px 32px rgba(27,67,50,0.15)',
        }}>
          <p style={{ textAlign: 'center', fontSize: 11, fontWeight: 800, color: 'rgba(216,243,220,0.55)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 16 }}>
            Beneficios comprobados por marcas saludables
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr 1fr', gap: 0, borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
            {STATS.map((s, i) => (
              <div key={i} style={{
                background: i % 2 === 0 ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.05)',
                borderRight: (!isMobile && i < 3) || (isMobile && i % 2 === 0) ? '1px solid rgba(255,255,255,0.08)' : 'none',
                borderBottom: isMobile && i < 2 ? '1px solid rgba(255,255,255,0.08)' : 'none',
              }}>
                <Counter {...s} visible={statsVisible} />
              </div>
            ))}
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section id="features" style={{ padding: '72px 24px' }}>
          <div style={{ marginBottom: 44, textAlign: 'center' }}>
            <p style={{ fontSize: 11, fontWeight: 800, color: '#40916C', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>FUNCIONALIDADES CLAVE</p>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: isMobile ? 28 : 38, fontWeight: 900, color: '#2D2A26', lineHeight: 1.2 }}>
              Todo lo que necesitas para vender directo,{' '}
              <span style={{ color: '#1B4332' }}>sin fricciones</span>
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 24 }}>
            {FEATURES.map(({ icon, title, desc }, i) => (
              <div key={title} style={{
                display: 'flex', gap: 18, alignItems: 'flex-start',
                background: 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(27, 67, 50, 0.08)',
                borderRadius: 22, padding: '28px 24px',
                transition: 'all 320ms cubic-bezier(0.2, 0.8, 0.2, 1)',
                boxShadow: hoveredFeature === i 
                  ? '0 20px 35px -10px rgba(27, 67, 50, 0.12), 0 0 0 1px #1B4332' 
                  : '0 4px 20px -5px rgba(27, 67, 50, 0.03)',
                transform: hoveredFeature === i ? 'translateY(-6px)' : 'translateY(0)',
              }}
              onMouseEnter={() => setHoveredFeature(i)}
              onMouseLeave={() => setHoveredFeature(null)}
              >
                <div style={{ 
                  flexShrink: 0,
                  transform: hoveredFeature === i ? 'scale(1.08)' : 'scale(1)',
                  transition: 'transform 320ms cubic-bezier(0.2, 0.8, 0.2, 1)'
                }}>{icon}</div>
                <div>
                  <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 17, fontWeight: 800, color: '#2D2A26', marginBottom: 6 }}>{title}</p>
                  <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CÓMO FUNCIONA ── */}
        <section id="process" style={{ padding: '0 24px 72px' }}>
          <div style={{ marginBottom: 44, textAlign: 'center' }}>
            <p style={{ fontSize: 11, fontWeight: 800, color: '#40916C', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>PASO A PASO</p>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: isMobile ? 28 : 38, fontWeight: 900, color: '#2D2A26', lineHeight: 1.2 }}>
              Vende en piloto automático en{' '}
              <span style={{ color: '#1B4332' }}>3 pasos sencillos</span>
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 24 }}>
            {STEPS.map(({ num, title, desc }, i) => (
              <div key={num} style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: isMobile ? 'row' : 'column', 
                gap: 18,
                background: 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(27, 67, 50, 0.08)',
                borderRadius: 22,
                padding: '28px 24px',
                transition: 'all 320ms cubic-bezier(0.2, 0.8, 0.2, 1)',
                boxShadow: hoveredStep === i 
                  ? '0 20px 35px -10px rgba(27, 67, 50, 0.12), 0 0 0 1px #1B4332' 
                  : '0 4px 20px -5px rgba(27, 67, 50, 0.03)',
                transform: hoveredStep === i ? 'translateY(-6px)' : 'translateY(0)',
              }}
              onMouseEnter={() => setHoveredStep(i)}
              onMouseLeave={() => setHoveredStep(null)}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: hoveredStep === i ? 'linear-gradient(135deg, #1B4332, #40916C)' : '#1B4332',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Outfit, sans-serif', fontSize: 14, fontWeight: 900, color: '#D8F3DC',
                  flexShrink: 0,
                  transition: 'background 320ms ease, transform 320ms ease',
                  transform: hoveredStep === i ? 'rotate(10deg) scale(1.05)' : 'none',
                }}>{num}</div>
                <div>
                  <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 16, fontWeight: 800, color: '#2D2A26', marginBottom: 6, marginTop: isMobile ? 0 : 8 }}>{title}</p>
                  <p style={{ fontSize: 13.5, color: '#6B7280', lineHeight: 1.6 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── TESTIMONIOS ── */}
        <section id="testimonials" style={{ padding: '0 24px 72px' }}>
          <div style={{ marginBottom: 44, textAlign: 'center' }}>
            <p style={{ fontSize: 11, fontWeight: 800, color: '#40916C', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>TESTIMONIOS DE ÉXITO</p>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: isMobile ? 28 : 38, fontWeight: 900, color: '#2D2A26', lineHeight: 1.2 }}>
              Ya están construyendo su propio{' '}
              <span style={{ color: '#1B4332' }}>canal de ventas directo</span>
            </h2>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr',
            gap: 24
          }}>
            {TESTIMONIALS.map(({ name, role, quote, rating }, i) => (
              <div key={name} style={{
                background: 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(27, 67, 50, 0.08)',
                borderRadius: 24, padding: '28px 24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 320ms cubic-bezier(0.2, 0.8, 0.2, 1)',
                boxShadow: hoveredTestimonial === i 
                  ? '0 20px 35px -10px rgba(27, 67, 50, 0.12), 0 0 0 1px #1B4332' 
                  : '0 4px 20px -5px rgba(27, 67, 50, 0.03)',
                transform: hoveredTestimonial === i ? 'translateY(-6px)' : 'translateY(0)',
              }}
              onMouseEnter={() => setHoveredTestimonial(i)}
              onMouseLeave={() => setHoveredTestimonial(null)}
              >
                <div>
                  <div style={{ display: 'flex', gap: 2, marginBottom: 14 }}>
                    {Array.from({ length: rating }).map((_, i) => <IcoStar key={i} />)}
                  </div>
                  <p style={{ fontSize: 13.5, color: '#4B5563', lineHeight: 1.7, marginBottom: 20, fontStyle: 'italic' }}>
                    "{quote}"
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: '50%',
                    background: 'linear-gradient(135deg,#1B4332,#40916C)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'Outfit, sans-serif', fontWeight: 900, color: '#D8F3DC', fontSize: 16
                  }}>{name[0]}</div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 800, color: '#2D2A26' }}>{name}</p>
                    <p style={{ fontSize: 11, color: '#8A8070', fontWeight: 600 }}>{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA FINAL ── */}
        <section style={{
          margin: '0 24px 56px',
          background: 'linear-gradient(135deg, #1B4332 0%, #2C6246 100%)',
          borderRadius: 28, padding: isMobile ? '40px 24px' : '56px 48px',
          boxShadow: '0 20px 48px rgba(27,67,50,0.25)',
          position: 'relative', overflow: 'hidden',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: 'center',
          gap: 32,
        }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }}/>
          
          <div style={{ flex: 1.2, textAlign: isMobile ? 'center' : 'left' }}>
            <p style={{ fontSize: 36, marginBottom: 16, display: isMobile ? 'block' : 'none' }}>🌱</p>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: isMobile ? 26 : 36, fontWeight: 900, color: '#fff', marginBottom: 16, lineHeight: 1.2 }}>
              Tu restaurante merece tecnología inteligente y rentable
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(216,243,220,0.7)', lineHeight: 1.6, marginBottom: 0 }}>
              Únete a las marcas plant-based que ya automatizan sus pedidos de forma directa por WhatsApp. Sin comisiones, sin intermediarios, sin contratos de permanencia.
            </p>
          </div>

          <div style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left' }}>
              {[
                'Configuración asistida con IA en 5 minutos',
                'Agente WhatsApp inteligente activo desde el día 1',
                'Panel de cocina live e inventario incluido',
              ].map(item => (
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
                marginTop: 12, width: '100%',
                padding: '18px', borderRadius: 20,
                background: '#D8F3DC', color: '#1B4332',
                fontSize: 15, fontWeight: 900, cursor: 'pointer', border: 'none',
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                transition: 'transform 150ms cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              Lanzar mi Restaurante Gratis 🌱
            </button>
          </div>
        </section>

      </div>

      {/* ── FOOTER ── */}
      <footer style={{ width: '100%', padding: '32px 24px', textAlign: 'center', borderTop: '1px solid #EBE7DC', marginTop: 'auto' }}>
        <p style={{ fontSize: 12.5, color: '#8A8070', fontWeight: 600 }}>
          © 2026 Suna GreenApp · Korat Flow Agencia · Hecho con 💚 para la restauración saludable 🌿
        </p>
      </footer>
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
