import { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';

/* ─── Iconos SVG inline ligeros ─── */
const Icon = {
  menu: (c) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c||'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12h18M3 6h18M3 18h18"/>
    </svg>
  ),
  search: (c) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c||'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
    </svg>
  ),
  cart: (active) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'none' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 01-8 0"/>
    </svg>
  ),
  check: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline className="animated-check" points="20 6 9 17 4 12"/>
    </svg>
  ),
  copy: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
    </svg>
  ),
  chevron: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
  whatsapp: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884"/>
    </svg>
  ),
};

/* ─── Datos de fallback para modo offline / demo ─── */
const FALLBACK_RESTAURANT = {
  id: '8c7a6e1a-1d5b-43ad-8d99-c990263f45bb',
  nombre: 'Suna Gourmet', direccion: 'Av. Miraflores 1245, Lima, Perú', telefono: '+51 987 654 321',
};
const FALLBACK_CATS = [
  { id: '11111111-1111-1111-1111-111111111111', nombre: 'Hamburguesas', icon: '🍔' },
  { id: '22222222-2222-2222-2222-222222222222', nombre: 'Bowls', icon: '🥗' },
  { id: '33333333-3333-3333-3333-333333333333', nombre: 'Bebidas', icon: '🥤' },
  { id: '44444444-4444-4444-4444-444444444444', nombre: 'Postres', icon: '🍰' },
];
const FALLBACK_ITEMS = [
  { id:'b1111111-1111-1111-1111-111111111111', nombre:'Hamburguesa Suna Smash', descripcion:'Triple smash plant-based, queso cheddar vegano fundido, cebolla caramelizada, lechuga hidropónica y salsa secreta en pan brioche vegano.', precio:32, imagen_url:'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400&q=80', categoria_id:'11111111-1111-1111-1111-111111111111' },
  { id:'b2222222-2222-2222-2222-222222222222', nombre:'Bosque Ahumado', descripcion:'Medallón de soya y lentejas, portobello asado, salsa BBQ artesanal, rúcula y mozzarella vegana fundida.', precio:34, imagen_url:'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&q=80', categoria_id:'11111111-1111-1111-1111-111111111111' },
  { id:'b3333333-3333-3333-3333-333333333333', nombre:'Andes Veggie', descripcion:'Croqueta de quinua roja y camote, aliño de ají amarillo, palta fresca, cebolla roja curtida y espinaca baby.', precio:29, imagen_url:'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=400&q=80', categoria_id:'11111111-1111-1111-1111-111111111111' },
  { id:'a1111111-1111-1111-1111-111111111111', nombre:'Bowl Quinua Fest', descripcion:'Quinua andina tricolor, camote glaseado, palta orgánica, garbanzos al curry, rabanitos y aderezo de tahini.', precio:28, imagen_url:'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80', categoria_id:'22222222-2222-2222-2222-222222222222' },
  { id:'a2222222-2222-2222-2222-222222222222', nombre:'Matcha & Tofu Crispy', descripcion:'Tofu crocante en glaseado de matcha, arroz integral, edamames al vapor, pepino japonés y sésamo negro.', precio:29, imagen_url:'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80', categoria_id:'22222222-2222-2222-2222-222222222222' },
  { id:'a3333333-3333-3333-3333-333333333333', nombre:'Falafel Ancestral', descripcion:'Croquetas de habas y garbanzo, hummus de la casa, cebollitas encurtidas, tomate cherry y oliva.', precio:27, imagen_url:'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&q=80', categoria_id:'22222222-2222-2222-2222-222222222222' },
  { id:'d1111111-1111-1111-1111-111111111111', nombre:'Kombucha Ancestral', descripcion:'Té fermentado artesanalmente con maíz morado peruano, canela y clavo. Refrescante y probiótico.', precio:14, imagen_url:'https://images.unsplash.com/photo-1595981267035-7b04ca84a82d?w=400&q=80', categoria_id:'33333333-3333-3333-3333-333333333333' },
  { id:'d2222222-2222-2222-2222-222222222222', nombre:'Jugo Verde Clorofila', descripcion:'Cold-pressed de kale orgánico, pepino, manzana verde, limón peruano, jengibre y menta.', precio:12, imagen_url:'https://images.unsplash.com/photo-1610970881699-44a5587caa90?w=400&q=80', categoria_id:'33333333-3333-3333-3333-333333333333' },
  { id:'d3333333-3333-3333-3333-333333333333', nombre:'Infusión Dorada', descripcion:'Leche de almendras con cúrcuma fresca, pimienta negra, canela y jarabe de agave.', precio:10, imagen_url:'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=400&q=80', categoria_id:'33333333-3333-3333-3333-333333333333' },
  { id:'e1111111-1111-1111-1111-111111111111', nombre:'Tarta Lúcuma Raw', descripcion:'Base de nueces y nibs de cacao, mousse cruda de lúcuma peruana y finos hilos de chocolate amargo.', precio:18, imagen_url:'https://images.unsplash.com/photo-1488477304112-4944851de03d?w=400&q=80', categoria_id:'44444444-4444-4444-4444-444444444444' },
  { id:'e2222222-2222-2222-2222-222222222222', nombre:'Mousse de Palta & Cacao', descripcion:'Cremosa emulsión de palta fuerte con cacao orgánico 70%, endulzado con miel de dátiles.', precio:16, imagen_url:'https://images.unsplash.com/photo-1541783245831-57d6fb0926d3?w=400&q=80', categoria_id:'44444444-4444-4444-4444-444444444444' },
  { id:'e3333333-3333-3333-3333-333333333333', nombre:'Alfajor Vegano Suna', descripcion:'Galletas de harina de almendras con manjar de leche de coco, espolvoreadas con coco rallado.', precio:12, imagen_url:'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80', categoria_id:'44444444-4444-4444-4444-444444444444' },
];

/* ─── COMPONENTE PRINCIPAL ─── */
export default function App() {
  // ── Estado general ──
  const [tab, setTab]         = useState('menu');  // 'menu' | 'buscar' | 'carrito'
  const [catId, setCatId]     = useState('all');
  const [query, setQuery]     = useState('');

  // ── Datos de Supabase ──
  const [restaurant, setRestaurant] = useState(FALLBACK_RESTAURANT);
  const [cats, setCats]             = useState(FALLBACK_CATS);
  const [items, setItems]           = useState(FALLBACK_ITEMS);
  const [loading, setLoading]       = useState(true);

  // ── Carrito ──
  const [cart, setCart] = useState({});  // { id: qty }
  const [badgePop, setBadgePop]     = useState(false);
  const [pulsedItemId, setPulsedItemId] = useState(null);

  // ── Checkout ──
  const [sheetOpen, setSheetOpen]   = useState(false);
  const [name, setName]             = useState('');
  const [phone, setPhone]           = useState('');
  const [delivery, setDelivery]     = useState('recojo');
  const [payMethodCheckout, setPayMethodCheckout] = useState('yape_plin'); // 'yape_plin' | 'efectivo'
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult]         = useState(null);  // { orden_id, total, metodo_pago }

  // ── Pantalla de éxito ──
  const [payMode, setPayMode] = useState('yape');  // 'yape' | 'plin' | 'banco'
  const [displayPrice, setDisplayPrice] = useState(0);

  // ── UI ──
  const [toast, setToast]   = useState(null);
  const [clock, setClock]   = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const contentRef          = useRef(null);

  // ── Desktop layout detection ──
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 900);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 900px)');
    const handler = (e) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Drag-to-close Bottom Sheet
  const touchStartY = useRef(0);

  /* ──────────────────────────────────── Reloj nativo ── */
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const h = String(d.getHours()).padStart(2,'0');
      const m = String(d.getMinutes()).padStart(2,'0');
      setClock(`${h}:${m}`);
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

  /* ──────────────────────────────────── Carga inicial ── */
  useEffect(() => {
    (async () => {
      try {
        const [{ data: res }, { data: catData }, { data: itemData }] = await Promise.all([
          supabase.from('restaurantes').select('*').limit(1),
          supabase.from('categorias_menu').select('*'),
          supabase.from('items_menu').select('*').eq('disponible', true),
        ]);
        if (res?.[0])   setRestaurant(res[0]);
        if (catData?.length) { setCats(catData); setCatId(catData[0].id); }
        if (itemData?.length) {
          setItems(itemData.map(i => ({
            ...i,
            precio: parseFloat(i.precio),
            precio_oferta: i.precio_oferta ? parseFloat(i.precio_oferta) : null
          })));
        }
      } catch (e) {
        console.error('DB offline, usando datos demo', e);
        setCatId(FALLBACK_CATS[0].id);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ──────────────────────────────────── Scroll Handler ── */
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const handleScroll = () => {
      if (el.scrollTop > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, [loading, tab]);

  /* ──────────────────────────────────── Count-up para precio de éxito ── */
  useEffect(() => {
    if (result) {
      const target = parseFloat(result.total);
      let current = 0;
      const step = target / 30; // 30 frames animation
      const interval = setInterval(() => {
        current += step;
        if (current >= target) {
          setDisplayPrice(target);
          clearInterval(interval);
        } else {
          setDisplayPrice(current);
        }
      }, 16);
      return () => clearInterval(interval);
    } else {
      setDisplayPrice(0);
    }
  }, [result]);

  /* ──────────────────────────────────── Theme color ── */
  useEffect(() => {
    const meta = document.getElementById('theme-color-meta');
    if (!meta) return;
    if (result)     meta.content = '#1B4332';
    else if (sheetOpen) meta.content = '#EBE7DC';
    else            meta.content = '#FCFBF9';
  }, [result, sheetOpen]);

  /* ──────────────────────────────────── Toast helper ── */
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  /* ──────────────────────────────────── Filtrado ── */
  const filtered = items.filter(it => {
    const inCat = catId === 'all' || it.categoria_id === catId;
    const inQ   = !query
      || it.nombre.toLowerCase().includes(query.toLowerCase())
      || it.descripcion.toLowerCase().includes(query.toLowerCase());
    return inCat && inQ;
  });

  /* ──────────────────────────────────── Carrito ── */
  const totalQty   = Object.values(cart).reduce((s,q) => s+q, 0);
  const totalPrice = Object.entries(cart).reduce((s,[id,q]) => {
    const it = items.find(i => i.id === id);
    if (!it) return s;
    const price = it.en_oferta && it.precio_oferta ? it.precio_oferta : it.precio;
    return s + (price * q);
  }, 0);

  const addItem = (id) => {
    setCart(p => ({ ...p, [id]: (p[id]||0)+1 }));
    setPulsedItemId(id);
    setBadgePop(true);
    setTimeout(() => setBadgePop(false), 450);
    setTimeout(() => setPulsedItemId(null), 350);

    if (navigator.vibrate) navigator.vibrate(8);
    showToast('Añadido al carrito');
  };
  const setQty = (id, delta) => {
    setCart(p => {
      const next = (p[id]||0) + delta;
      if (next <= 0) { const n={...p}; delete n[id]; return n; }
      return { ...p, [id]: next };
    });
    if (delta > 0) {
      setBadgePop(true);
      setTimeout(() => setBadgePop(false), 450);
    }
    if (navigator.vibrate) navigator.vibrate(6);
  };

  /* ──────────────────────────────────── Checkout RPC ── */
  const handleOrder = async (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) { showToast('Ingresa nombre y celular', 'error'); return; }
    if (!totalQty) { showToast('El carrito está vacío', 'error'); return; }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc('crear_orden_restaurante', {
        p_restaurante_id: restaurant.id,
        p_cliente_nombre: name,
        p_cliente_telefono: phone,
        p_tipo_entrega: delivery,
        p_metodo_pago: payMethodCheckout,
        p_items: Object.entries(cart).map(([item_id, cantidad]) => ({ item_id, cantidad })),
      });
      if (error) throw error;
      if (data?.success) {
        setResult(data);
        setSheetOpen(false);
        if (navigator.vibrate) navigator.vibrate([40,80,40]);
        showToast('¡Pedido confirmado! 🥑');
      } else throw new Error('RPC no retornó success');
    } catch (err) {
      console.error('Error al procesar orden en Supabase:', err);
      // Modo demo / fallback
      setResult({ orden_id: 'DEMO-'+Math.random().toString(36).substr(2,6).toUpperCase(), total: totalPrice, metodo_pago: payMethodCheckout });
      setSheetOpen(false);
      showToast('Pedido simulado en modo demo', 'info');
    } finally {
      setSubmitting(false);
    }
  };

  /* ──────────────────────────────────── WhatsApp ── */
  const waUrl = () => {
    if (!result) return '';
    const lines = Object.entries(cart).map(([id,q]) => {
      const it = items.find(i=>i.id===id);
      const price = it && it.en_oferta && it.precio_oferta ? it.precio_oferta : (it ? it.precio : 0);
      return `• ${q}x ${it?.nombre} (S/. ${(price*q).toFixed(2)})`;
    }).join('\n');
    const msg = `🌱 *SUNA GOURMET*\n─────────────────\n*Pedido #${result.orden_id.slice(-6).toUpperCase()}*\nCliente: ${name} | ${phone}\nEntrega: ${delivery === 'delivery' ? '🛵 Delivery' : '🛍️ Recojo'}\n─────────────────\n${lines}\n─────────────────\n*TOTAL: S/. ${parseFloat(result.total).toFixed(2)}*\nMétodo: ${result.metodo_pago === 'efectivo' ? '💵 Efectivo contraentrega' : (payMode === 'banco' ? '🏦 Transferencia' : '📱 '+payMode.toUpperCase())}`;
    return `https://wa.me/51987654321?text=${encodeURIComponent(msg)}`;
  };

  const copyText = (text, label) => {
    navigator.clipboard?.writeText(text);
    showToast(`${label} copiado ✓`);
    if (navigator.vibrate) navigator.vibrate([12,12]);
  };

  const resetAll = () => { setCart({}); setResult(null); setName(''); setPhone(''); setTab('menu'); };

  // Bottom Sheet drag handlers
  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    const deltaY = e.touches[0].clientY - touchStartY.current;
    if (deltaY > 100) {
      setSheetOpen(false);
    }
  };

  /* ════════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════════ */
  return (
    <div className={isDesktop ? 'desktop-root' : 'mobile-root'}>
      {/* ── ORBES ANIMADOS (solo desktop) ── */}
      {isDesktop && <span className="desktop-orb-3" />}

      {/* ── SIDEBAR DESKTOP ── */}
      {isDesktop && (
        <aside className="desktop-sidebar">
          {/* Logo grande */}
          <div className="ds-logo">
            <div className="ds-logo-icon">
              <span>S</span>
            </div>
            <div>
              <p className="ds-logo-name">{restaurant.nombre}</p>
              <p className="ds-logo-tag">Plant-Based · Perú 🌱</p>
            </div>
          </div>

          {/* Separador */}
          <div className="ds-divider" />

          {/* Info del restaurante */}
          <div className="ds-info-block">
            <p className="ds-info-label">📍 Dirección</p>
            <p className="ds-info-value">{restaurant.direccion || 'Av. Miraflores 1245, Lima'}</p>
          </div>
          <div className="ds-info-block">
            <p className="ds-info-label">📞 Teléfono</p>
            <p className="ds-info-value">{restaurant.telefono || '+51 987 654 321'}</p>
          </div>
          <div className="ds-info-block">
            <p className="ds-info-label">🕐 Horario</p>
            <p className="ds-info-value">Lun–Dom · 12:00 – 22:00</p>
          </div>

          <div className="ds-divider" />

          {/* Estadísticas */}
          <div className="ds-stats">
            <div className="ds-stat">
              <span className="ds-stat-value">{items.length}</span>
              <span className="ds-stat-label">Platos</span>
            </div>
            <div className="ds-stat">
              <span className="ds-stat-value">{cats.length}</span>
              <span className="ds-stat-label">Categorías</span>
            </div>
            <div className="ds-stat">
              <span className="ds-stat-value">100%</span>
              <span className="ds-stat-label">Plant-Based</span>
            </div>
          </div>

          <div className="ds-divider" />

          {/* Chips de categoría en desktop */}
          <p className="ds-section-title">Explorar menú</p>
          <div className="ds-cat-list">
            <button
              className={`ds-cat-btn ${catId === 'all' ? 'ds-cat-btn--active' : ''}`}
              onClick={() => { setCatId('all'); setTab('menu'); }}
            >
              ✨ Todo el menú
            </button>
            {cats.map(c => (
              <button
                key={c.id}
                className={`ds-cat-btn ${catId === c.id ? 'ds-cat-btn--active' : ''}`}
                onClick={() => { setCatId(c.id); setTab('menu'); }}
              >
                {c.icon || '🌿'} {c.nombre}
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="ds-footer">
            <p className="ds-footer-brand">Powered by Suna Tech</p>
            <p className="ds-footer-sub">🌿 Gastronomía Consciente</p>
          </div>
        </aside>
      )}

      {/* ── APP SHELL (iPhone frame en desktop, full-viewport en mobile) ── */}
      <div className="app-shell no-select">

        {/* ── PANTALLA ÉXITO ───────────────────────────────── */}
        {result ? (
          <div style={{ flex:1, display:'flex', flexDirection:'column', background:'#1B4332', color:'#fff', overflowY:'auto' }} className="no-scrollbar animate-fade-up">
            
            {/* Confetti decoration */}
            <div className="confetti-wrap">
              {Array.from({ length: 12 }).map((_, i) => (
                <span
                  key={i}
                  className="confetti-dot"
                  style={{
                    left: `${Math.random() * 90 + 5}%`,
                    top: `${-20 - Math.random() * 20}px`,
                    background: i % 3 === 0 ? '#D8F3DC' : i % 3 === 1 ? '#40916C' : '#FFB703',
                    animationDelay: `${Math.random() * 0.8}s`
                  }}
                />
              ))}
            </div>

            {/* Header éxito */}
            <div style={{ padding:'28px 20px 0', display:'flex', alignItems:'center', gap:14 }}>
              <div className="success-check-circle">
                {Icon.check()}
              </div>
              <div>
                <p style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:900, lineHeight:1.2, color: 'var(--color-accent)' }}>¡Pedido Confirmado!</p>
                <p style={{ fontSize:12, color:'rgba(216,243,220,0.7)', marginTop:2, display:'flex', gap:6, alignItems:'center' }}>
                  Código: <span className="typewriter font-mono bg-black/20 px-2 py-0.5 rounded border border-white/5 font-bold text-white tracking-wider">#{result.orden_id.slice(-8).toUpperCase()}</span>
                </p>
              </div>
            </div>

            {/* Resumen */}
            <div className="glass-dark" style={{ margin:'24px 20px 20px', padding:'20px', borderRadius:24, border:'1px solid rgba(255,255,255,0.08)' }}>
              {[
                ['Cliente', name],
                ['Celular', phone],
                ['Entrega', delivery === 'delivery' ? '🛵 Delivery' : '🛍️ Recojo'],
              ].map(([k,v]) => (
                <div key={k} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize:12, color:'rgba(255,255,255,0.55)' }}>{k}</span>
                  <span style={{ fontSize:13, fontWeight:600 }}>{v}</span>
                </div>
              ))}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 0 0' }}>
                <span style={{ fontSize:13, color:'rgba(255,255,255,0.8)' }}>Total</span>
                <span style={{ fontFamily:'var(--font-display)', fontSize:24, fontWeight:900, color:'#D8F3DC' }}>S/. {displayPrice.toFixed(2)}</span>
              </div>
            </div>

            {/* Sección de Pago */}
            {result.metodo_pago === 'efectivo' ? (
              <div style={{ margin:'0 20px', flex:1, display:'flex', flexDirection:'column', justifyContent:'center' }}>
                <div style={{ padding:'32px 20px', background:'rgba(0,0,0,0.15)', borderRadius:20, textAlign:'center', border:'1px solid rgba(255,255,255,0.08)' }}>
                  <span style={{ fontSize:40, display:'block', marginBottom:12 }}>💵</span>
                  <p style={{ fontSize:18, fontWeight:800, color:'#D8F3DC', marginBottom:8 }}>Pago en efectivo</p>
                  <p style={{ fontSize:13, color:'rgba(216,243,220,0.7)', lineHeight:1.5 }}>
                    Tu pedido ya está en cocina.<br/>
                    Por favor prepara el monto exacto (S/. {parseFloat(result.total).toFixed(2)}) para agilizar la entrega.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Tabs pago */}
                <div style={{ margin:'0 20px 16px' }}>
                  <p style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.45)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>Método de Pago</p>
                  <div style={{ display:'flex', gap:6, background:'rgba(0,0,0,0.2)', padding:4, borderRadius:16 }}>
                    {[['yape','Yape'],['plin','Plin'],['banco','Banco']].map(([k,l]) => (
                      <button key={k} onClick={() => setPayMode(k)} className={`pay-tab ${payMode===k?'active':'inactive'}`}>{l}</button>
                    ))}
                  </div>
                </div>

                {/* Panel de pago digital */}
                <div style={{ margin:'0 20px', flex:1 }}>
                  {payMode !== 'banco' ? (
                    <div style={{ textAlign:'center' }}>
                      {/* QR visual */}
                      <div style={{ width:140, height:140, background:'#fff', borderRadius:16, margin:'0 auto 12px', padding:10, display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
                        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2, width:'100%', height:'100%' }}>
                          {Array.from({length:49}).map((_,i) => {
                            const corners = [0,1,2,7,8,9,14,15,16,  32,33,34,39,40,41,46,47,48,  4,5,6,11,12,13];
                            const center  = [24];
                            const fill = corners.includes(i) ? '#1B4332' : center.includes(i) ? '#40916C' : (i%3===0||i%5===0) ? '#1B4332' : 'transparent';
                            return <div key={i} style={{ borderRadius:2, background:fill }} />;
                          })}
                        </div>
                        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <div style={{ width:32, height:32, background:'#fff', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 0 2px #1B4332' }}>
                            <span style={{ fontFamily:'var(--font-display)', fontSize:8, fontWeight:900, color:'#1B4332' }}>SUNA</span>
                          </div>
                        </div>
                      </div>
                      <p style={{ fontSize:11, color:'rgba(216,243,220,0.6)', marginBottom:4 }}>Escanea con {payMode === 'yape' ? 'Yape' : 'Plin'}</p>
                      <div className="copy-row" style={{ margin:'8px 0' }} onClick={() => copyText('+51987654321','Número')}>
                        <div>
                          <p style={{ fontSize:10, color:'rgba(216,243,220,0.5)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:2 }}>Número {payMode === 'yape' ? 'Yape' : 'Plin'}</p>
                          <p style={{ fontSize:15, fontWeight:700 }}>+51 987 654 321</p>
                        </div>
                        <span style={{ color:'rgba(216,243,220,0.6)' }}>{Icon.copy()}</span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      {[
                        { banco:'BCP', cta:'191-98765432-1-01', cci:'00219198765432101', color:'#FFB703' },
                        { banco:'Interbank', cta:'200-300123456-78', cci:'00320030012345678', color:'#D8F3DC' },
                      ].map(({ banco, cta, cci, color }) => (
                        <div key={banco} className="copy-row" onClick={() => copyText(cta, `Cuenta ${banco}`)}>
                          <div>
                            <p style={{ fontSize:10, fontWeight:800, color, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:2 }}>{banco}</p>
                            <p style={{ fontSize:14, fontWeight:700, fontFamily:'monospace' }}>{cta}</p>
                            <p style={{ fontSize:10, color:'rgba(216,243,220,0.45)' }}>CCI {cci}</p>
                          </div>
                          <span style={{ color:'rgba(216,243,220,0.5)', flexShrink:0 }}>{Icon.copy()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Botones acción */}
            <div style={{ padding:'20px', display:'flex', flexDirection:'column', gap:10 }}>
              <a href={waUrl()} target="_blank" rel="noreferrer" onClick={() => setTimeout(resetAll,300)}
                style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'16px', background:'#25D366', color:'#fff', fontWeight:700, fontSize:14, borderRadius:20, textDecoration:'none', letterSpacing:'0.02em', boxShadow: '0 4px 12px rgba(37,211,102,0.2)' }}>
                {Icon.whatsapp()} {result.metodo_pago === 'efectivo' ? 'Enviar pedido por WhatsApp' : 'Enviar comprobante por WhatsApp'}
              </a>
              <button onClick={resetAll}
                style={{ padding:'13px', background:'rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.7)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:16, fontSize:13, fontWeight:600, cursor:'pointer' }}>
                Volver al menú
              </button>
            </div>

            <div style={{ padding:'8px 0 12px', textAlign:'center' }}>
              <div style={{ width:120, height:4, background:'rgba(255,255,255,0.15)', borderRadius:2, margin:'0 auto' }} />
            </div>
          </div>

        ) : (
          /* ── FLUJO PRINCIPAL ─────────────────────────────── */
          <>
            {/* SHELL HEADER */}
            <div className={`shell-header ${isScrolled ? 'scrolled' : ''}`}>
              {/* Status bar nativa */}
              <div className="status-bar">
                <span style={{ fontFamily:'var(--font-display)', fontWeight:700 }}>{clock}</span>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <svg width="14" height="10" viewBox="0 0 14 10" fill="currentColor" opacity="0.7">
                    <rect x="0" y="4" width="2" height="6" rx="1"/><rect x="3" y="2.5" width="2" height="7.5" rx="1"/><rect x="6" y="1" width="2" height="9" rx="1"/><rect x="9" y="0" width="2" height="10" rx="1"/>
                  </svg>
                  <svg width="18" height="10" viewBox="0 0 18 10" fill="none">
                    <rect x="0.5" y="0.5" width="15" height="9" rx="2" stroke="currentColor" strokeOpacity="0.6"/>
                    <rect x="16" y="3" width="2" height="4" rx="1" fill="currentColor" fillOpacity="0.5"/>
                    <rect x="1.5" y="1.5" width="11" height="7" rx="1.5" fill="currentColor" fillOpacity="0.7"/>
                  </svg>
                </div>
              </div>

              {/* Top App Bar */}
              <div className="top-app-bar">
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div className="logo-icon">
                    <span>S</span>
                  </div>
                  <div>
                    <p style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:16, color:'var(--color-on-surface)', lineHeight:1.1 }}>
                      {restaurant.nombre}
                    </p>
                    <p style={{ fontSize:10, color:'var(--color-secondary)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em' }}>
                      Plant-Based • Perú 🌱
                    </p>
                  </div>
                </div>

                {/* Cart button */}
                <button
                  onClick={() => setSheetOpen(true)}
                  className="cart-btn"
                  aria-label="Abrir carrito"
                >
                  {Icon.cart()}
                  {totalQty > 0 && <div className={`cart-badge ${badgePop ? 'badge-pop' : ''}`}>{totalQty}</div>}
                </button>
              </div>

              {/* Barra de búsqueda (cuando tab=buscar) */}
              {tab === 'buscar' && (
                <div style={{ padding:'0 20px 14px' }}>
                  <div style={{ position:'relative' }}>
                    <div style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'var(--color-muted)', pointerEvents:'none' }}>
                      {Icon.search()}
                    </div>
                    <input
                      autoFocus
                      type="text"
                      placeholder="Buscar platos, bowls, bebidas..."
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                      className="input-field"
                      style={{ paddingLeft:44, borderRadius:16 }}
                    />
                  </div>
                </div>
              )}

              {/* Category chips (solo en tab=menu) */}
              {tab === 'menu' && (
                <div className="category-strip-wrapper">
                  <div className="category-strip">
                    <button onClick={() => { setCatId('all'); if(navigator.vibrate) navigator.vibrate(5); }}
                      className={`chip ${catId==='all'?'chip-active':'chip-default'}`}>
                      ✨ Todo
                    </button>
                    {cats.map(c => (
                      <button key={c.id}
                        onClick={() => { setCatId(c.id); if(navigator.vibrate) navigator.vibrate(5); }}
                        className={`chip ${catId===c.id?'chip-active':'chip-default'}`}>
                        {c.icon || '🌿'} {c.nombre}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* SHELL CONTENT — ZONA DE SCROLL */}
            <div className="shell-content" ref={contentRef}>
              {loading ? (
                /* Skeleton loader */
                <div style={{ padding:'16px 20px', display:'flex', flexDirection:'column', gap:12 }}>
                  {Array.from({length:4}).map((_,i) => (
                    <div key={i} style={{ display:'flex', gap:14, padding:'14px 0', borderBottom:'1px solid var(--color-surface-3)' }}>
                      <div className="skeleton" style={{ width:80, height:80, borderRadius:16, flexShrink:0 }} />
                      <div style={{ flex:1, display:'flex', flexDirection:'column', gap:8 }}>
                        <div className="skeleton" style={{ height:14, borderRadius:8, width:'70%' }} />
                        <div className="skeleton" style={{ height:11, borderRadius:8, width:'90%' }} />
                        <div className="skeleton" style={{ height:11, borderRadius:8, width:'55%' }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding:'12px 20px calc(20px + env(safe-area-inset-bottom))', display:'flex', flexDirection:'column', gap:10 }}>
                  {/* Banner hero solo en menu sin filtro */}
                  {tab === 'menu' && catId === 'all' && !query && (
                    <div className="hero-banner">
                      <div className="hero-banner__bg" />
                      <img
                        className="hero-banner__img"
                        src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80"
                        alt="Plato del dia"
                      />
                      <div className="hero-banner__overlay" />
                      <div className="hero-banner__circle-1" />
                      <div className="hero-banner__circle-2" />
                      
                      <div className="hero-banner__content">
                        <span className="hero-banner__chip">
                          100% Sostenible
                        </span>
                        <p className="hero-banner__title">
                          Gastronomía<br/>Consciente 🥑
                        </p>
                        <p className="hero-banner__subtitle">
                          Cultivado localmente, cocinado con arte peruano.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Contador de resultados */}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:2 }}>
                    <span style={{ fontFamily:'var(--font-display)', fontSize:13, fontWeight:800, color:'var(--color-on-surface)', textTransform:'uppercase', letterSpacing:'0.04em' }}>
                      {tab === 'buscar' && query ? `"${query}"` : cats.find(c=>c.id===catId)?.nombre ?? 'Todo el menú'}
                    </span>
                    <span style={{ fontSize:11, color:'var(--color-muted)', fontWeight:600 }}>{filtered.length} platos</span>
                  </div>

                  {filtered.length === 0 && (
                    <div style={{ textAlign:'center', padding:'40px 0', color:'var(--color-muted)' }}>
                      <p style={{ fontSize:32, marginBottom:8 }}>🌿</p>
                      <p style={{ fontSize:13, fontWeight:600 }}>Ningún plato encontrado</p>
                    </div>
                  )}

                  {/* Lista de productos */}
                  {filtered.map((item, idx) => {
                    const isNew = idx === 0 || idx === 6;
                    const isPopular = idx === 1 || idx === 3;
                    return (
                      <div key={item.id} className={`product-card animate-fade-up ${item.en_oferta ? 'product-card--promo' : ''}`} style={{ animationDelay:`${idx*30}ms` }}>
                        {/* Imagen contenida y sin salirse */}
                        <div className="product-card__img-wrap">
                          <img
                            src={item.imagen_url}
                            alt={item.nombre}
                            className={`product-card__img ${pulsedItemId === item.id ? 'img-pulse-once' : ''}`}
                            loading="lazy"
                            onError={e => { e.target.src='https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&q=60'; }}
                          />
                          {item.en_oferta ? (
                            item.etiqueta_promo && <span className="product-card__badge product-card__badge--promo">{item.etiqueta_promo}</span>
                          ) : (
                            <>
                              {isNew && <span className="product-card__badge badge-new">Nuevo</span>}
                              {isPopular && <span className="product-card__badge badge-popular">Popular</span>}
                            </>
                          )}
                        </div>

                        {/* Info */}
                        <div className="product-card__body">
                          <p className="product-card__name">{item.nombre}</p>
                          <p className="product-card__desc">{item.descripcion}</p>

                          <div className="product-card__footer">
                            {item.en_oferta && item.precio_oferta ? (
                              <span className="product-card__price" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 4 }}>
                                <span style={{ textDecoration: 'line-through', color: 'var(--color-muted)', fontSize: 12, fontWeight: 500 }}>
                                  S/. {item.precio.toFixed(2)}
                                </span>
                                <span style={{ color: 'var(--color-danger)' }}>
                                  S/. {item.precio_oferta.toFixed(2)}
                                </span>
                              </span>
                            ) : (
                              <span className="product-card__price">S/. {item.precio.toFixed(2)}</span>
                            )}

                            {cart[item.id] ? (
                              <div className="qty-control">
                                <button className="qty-btn" onClick={() => setQty(item.id,-1)}>−</button>
                                <span className="qty-value">{cart[item.id]}</span>
                                <button className="qty-btn" onClick={() => setQty(item.id,+1)}>+</button>
                              </div>
                            ) : (
                              <button className="btn-add" onClick={() => addItem(item.id)} aria-label={`Añadir ${item.nombre}`}>
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                                  <line x1="8" y1="2" x2="8" y2="14"/>
                                  <line x1="2" y1="8" x2="14" y2="8"/>
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* SHELL NAV — Bottom Navigation MD3 con Sticky Cart */}
            <div className="shell-nav">
              {/* STICKY CART BAR */}
              {!sheetOpen && totalQty > 0 && (
                <button
                  className="sticky-cart-bar"
                  onClick={() => { setSheetOpen(true); if(navigator.vibrate) navigator.vibrate(10); }}
                  aria-label={`Ver carrito con ${totalQty} productos`}
                >
                  <div className="sticky-cart-info">
                    <div className="sticky-cart-badge">{totalQty}</div>
                    <div className="sticky-cart-text">
                      <p>Ver carrito</p>
                    </div>
                  </div>
                  <span className="sticky-cart-price">S/. {totalPrice.toFixed(2)}</span>
                </button>
              )}

              <div className="bottom-nav">
                {[
                  { id:'menu',    label:'Menú',   icon: () => (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                  )},
                  { id:'buscar',  label:'Buscar',  icon: () => Icon.search() },
                  { id:'carrito', label:'Carrito', badge: totalQty, icon: () => Icon.cart() },
                ].map(({ id, label, icon, badge }) => {
                  const active = id === 'carrito' ? false : tab === id;
                  return (
                    <button key={id} className="nav-item"
                      onClick={() => {
                        if (id === 'carrito') { setSheetOpen(true); return; }
                        setTab(id);
                        if (id !== 'buscar') setQuery('');
                        if (navigator.vibrate) navigator.vibrate(5);
                      }}>
                      <div className={`nav-pill ${active?'active':'inactive'}`} style={{ position:'relative', color: active ? 'var(--color-primary)' : 'var(--color-muted)' }}>
                        {icon()}
                        {badge > 0 && id === 'carrito' && (
                          <div style={{ position:'absolute', top:2, right:2, width:8, height:8, borderRadius:'50%', background:'var(--color-danger)', border:'2px solid var(--color-surface)' }} />
                        )}
                      </div>
                      <span className={`nav-label ${active?'active':'inactive'}`}>{label}</span>
                    </button>
                  );
                })}
              </div>
              <div className="home-indicator">
                <div className="home-indicator-bar" />
              </div>
            </div>
          </>
        )}



        {/* ── BOTTOM SHEET CARRITO ─────────────────────────── */}
        {sheetOpen && (
          <div className="sheet-overlay" onClick={e => { if(e.target===e.currentTarget) setSheetOpen(false); }}>
            <div
              className="sheet-container"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
            >
              <div className="sheet-handle" />

              {/* Sheet header */}
              <div style={{ padding:'16px 20px 12px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <p style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:800, color:'var(--color-on-surface)' }}>Mi Carrito</p>
                  <p style={{ fontSize:12, color:'var(--color-muted)', fontWeight:600, marginTop:2 }}>{totalQty} productos</p>
                </div>
                <button onClick={() => setSheetOpen(false)}
                  style={{ width:36, height:36, borderRadius:12, background:'var(--color-surface-2)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--color-muted)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>

              <div className="sheet-body">
                {/* Items del carrito */}
                {totalQty > 0 ? (
                  <>
                    <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:16 }}>
                      {Object.entries(cart).map(([id,qty]) => {
                        const it = items.find(i=>i.id===id);
                        if (!it) return null;
                        return (
                          <div key={id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 12px', background:'var(--color-surface-2)', borderRadius:16, border:'1px solid var(--color-surface-3)' }}>
                            <img src={it.imagen_url} alt={it.nombre} style={{ width:52, height:52, borderRadius:12, objectFit:'cover', flexShrink:0, background:'var(--color-surface-3)' }}
                              onError={e => { e.target.src='https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=100&q=60'; }} />
                            <div style={{ flex:1, minWidth:0 }}>
                              <p style={{ fontWeight:700, fontSize:13, color:'var(--color-on-surface)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{it.nombre}</p>
                              <p style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:13, color:'var(--color-primary)', marginTop:2 }}>
                                S/. {((it.en_oferta && it.precio_oferta ? it.precio_oferta : it.precio)*qty).toFixed(2)}
                              </p>
                            </div>
                            <div className="qty-control" style={{ flexShrink:0 }}>
                              <button className="qty-btn" onClick={() => setQty(id,-1)}>−</button>
                              <span className="qty-value">{qty}</span>
                              <button className="qty-btn" onClick={() => setQty(id,+1)}>+</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Total preview */}
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 16px', background:'var(--color-surface-2)', borderRadius:16, marginBottom:20, border:'1.5px solid var(--color-surface-3)' }}>
                      <span style={{ fontSize:13, fontWeight:700, color:'var(--color-muted)', textTransform:'uppercase', letterSpacing:'0.04em' }}>Subtotal</span>
                      <span style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:900, color:'var(--color-primary)' }}>S/. {totalPrice.toFixed(2)}</span>
                    </div>

                    {/* Formulario */}
                    <form onSubmit={handleOrder} style={{ display:'flex', flexDirection:'column', gap:12 }}>
                      <div>
                        <label style={{ display:'block', fontSize:11, fontWeight:800, color:'var(--color-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>Nombre completo</label>
                        <input type="text" required placeholder="Ej. Valeria Torres" value={name} onChange={e=>setName(e.target.value)} className="input-field" />
                      </div>
                      <div>
                        <label style={{ display:'block', fontSize:11, fontWeight:800, color:'var(--color-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>Celular</label>
                        <input type="tel" required placeholder="Ej. 987 654 321" value={phone} onChange={e=>setPhone(e.target.value)} className="input-field" />
                      </div>
                      <div>
                        <label style={{ display:'block', fontSize:11, fontWeight:800, color:'var(--color-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>Tipo de entrega</label>
                        <div className="segmented">
                          <button type="button" onClick={() => setDelivery('recojo')} className={`seg-btn ${delivery==='recojo'?'active':'inactive'}`}>🛍️ Recojo</button>
                          <button type="button" onClick={() => setDelivery('delivery')} className={`seg-btn ${delivery==='delivery'?'active':'inactive'}`}>🛵 Delivery</button>
                        </div>
                      </div>
                      <div>
                        <label style={{ display:'block', fontSize:11, fontWeight:800, color:'var(--color-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>Método de pago</label>
                        <div className="segmented">
                          <button type="button" onClick={() => setPayMethodCheckout('yape_plin')} className={`seg-btn ${payMethodCheckout==='yape_plin'?'active':'inactive'}`}>📱 Yape/Plin</button>
                          <button type="button" onClick={() => setPayMethodCheckout('efectivo')} className={`seg-btn ${payMethodCheckout==='efectivo'?'active':'inactive'}`}>💵 Efectivo</button>
                        </div>
                      </div>
                      <div style={{ marginTop:8 }}>
                        <button type="submit" className="btn-primary" disabled={submitting}>
                          {submitting ? (
                            <>
                              <div style={{ width:16, height:16, border:'2px solid rgba(255,255,255,0.4)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
                              Procesando...
                            </>
                          ) : `Confirmar pedido · S/. ${totalPrice.toFixed(2)}`}
                        </button>
                      </div>
                    </form>
                  </>
                ) : (
                  <div style={{ textAlign:'center', padding:'40px 0', color:'var(--color-muted)' }}>
                    <p style={{ fontSize:36, marginBottom:12 }}>🛒</p>
                    <p style={{ fontSize:14, fontWeight:700, marginBottom:6 }}>Tu carrito está vacío</p>
                    <p style={{ fontSize:12 }}>Agrega platos desde el menú</p>
                    <button onClick={() => setSheetOpen(false)}
                      style={{ marginTop:20, padding:'12px 28px', background:'var(--color-primary)', color:'#fff', border:'none', borderRadius:20, fontWeight:700, fontSize:13, cursor:'pointer' }}>
                      Ver menú
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── TOAST ───────────────────────────────────────── */}
        {toast && (
          <div className={`toast ${toast.type==='error'?'toast-error':toast.type==='info'?'toast-info':'toast-success'}`}>
            {toast.type==='error' && '⚠️ '}
            {toast.msg}
          </div>
        )}

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
