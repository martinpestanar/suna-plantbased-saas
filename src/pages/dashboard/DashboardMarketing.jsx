import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient.js';
import { useAuth } from '../../router.jsx';

export default function DashboardMarketing() {
  const { activeRestaurant } = useAuth();
  const [proposals, setProposals] = useState([]);
  const [segments, setSegments] = useState({
    vip: 0,
    inactivo_15d: 0,
    nuevo: 0,
    frecuente: 0,
    fin_de_semana: 0,
    hamburguesas_lovers: 0,
    bowls_lovers: 0,
    todas: 0
  });
  const [loading, setLoading] = useState(true);
  const [proposalsLoading, setProposalsLoading] = useState(true);

  // Estados de Formulario de Campaña Avanzada
  const [selectedSegment, setSelectedSegment] = useState('inactivo_15d');
  const [promoTitle, setPromoTitle] = useState('');
  const [promocionVal, setPromocionVal] = useState('');
  const [diaSemanaVal, setDiaSemanaVal] = useState('hoy Viernes');
  const [reachLimit, setReachLimit] = useState(0);
  
  // Banco de Plantillas
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateText, setTemplateText] = useState('');
  
  const [sending, setSending] = useState(false);
  const [campaignSuccess, setCampaignSuccess] = useState(false);
  const [campaignIdCreated, setCampaignIdCreated] = useState(null);

  // Estados de Triggers Automáticos (Simulado/Config)
  const [autoMermas, setAutoMermas] = useState(true);
  const [autoStockOut, setAutoStockOut] = useState(true);
  const [discountPct, setDiscountPct] = useState(15);

  // Toast
  const [toast, setToast] = useState(null);

  // Estados de Combo del Día
  const [menuItems, setMenuItems] = useState([]);
  const [hamburgers, setHamburgers] = useState([]);
  const [drinks, setDrinks] = useState([]);
  const [selectedBurgerId, setSelectedBurgerId] = useState('');
  const [selectedDrinkId, setSelectedDrinkId] = useState('');
  const [comboPromoPrice, setComboPromoPrice] = useState(39.00);
  const [comboOrigPrice, setComboOrigPrice] = useState(46.00);
  const [comboExpiryHours, setComboExpiryHours] = useState(6);
  const [comboActive, setComboActive] = useState(true);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchActiveComboSettings = async () => {
    try {
      const [{ data: itemsData }, { data: activeComboData }] = await Promise.all([
        supabase.from('items_menu').select('*').eq('disponible', true),
        supabase.from('combo_del_dia').select('*').order('created_at', { ascending: false }).limit(1)
      ]);

      if (itemsData) {
        setMenuItems(itemsData);
        setHamburgers(itemsData.filter(i => i.nombre.toLowerCase().includes('hamburguesa') || i.nombre.toLowerCase().includes('burger')));
        setDrinks(itemsData.filter(i => i.nombre.toLowerCase().includes('kombucha') || i.nombre.toLowerCase().includes('jugo') || i.nombre.toLowerCase().includes('limonada') || i.nombre.toLowerCase().includes('bebida')));
      }

      if (activeComboData && activeComboData.length > 0) {
        const active = activeComboData[0];
        setSelectedBurgerId(active.hamburguesa_id);
        setSelectedDrinkId(active.bebida_id);
        setComboPromoPrice(parseFloat(active.precio_oferta));
        setComboOrigPrice(parseFloat(active.precio_original));
        setComboActive(active.activo);
      }
    } catch (err) {
      console.error('Error fetching active combo settings:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchTemplates(selectedSegment);
  }, [selectedSegment]);

  useEffect(() => {
    const size = segments[selectedSegment] || 0;
    setReachLimit(size);
  }, [selectedSegment, segments]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchSegments(), fetchProposals(), fetchActiveComboSettings()]);
    setLoading(false);
  };

  const handleSaveCombo = async (e) => {
    e.preventDefault();
    if (!selectedBurgerId || !selectedDrinkId) {
      showToast('Selecciona una hamburguesa y una bebida');
      return;
    }

    try {
      const burger = menuItems.find(i => i.id === selectedBurgerId);
      const drink = menuItems.find(i => i.id === selectedDrinkId);
      const orig = (burger ? parseFloat(burger.precio) : 0) + (drink ? parseFloat(drink.precio) : 0);

      const { error } = await supabase
        .from('combo_del_dia')
        .insert([
          {
            restaurante_id: activeRestaurant?.id || '8c7a6e1a-1d5b-43ad-8d99-c990263f45bb',
            hamburguesa_id: selectedBurgerId,
            bebida_id: selectedDrinkId,
            precio_oferta: parseFloat(comboPromoPrice),
            precio_original: orig || parseFloat(comboOrigPrice),
            expira_en: new Date(Date.now() + comboExpiryHours * 60 * 60 * 1000).toISOString(),
            activo: comboActive
          }
        ]);

      if (error) throw error;
      showToast('¡Combo del Día publicado en la PWA! 🍔🥤');
    } catch (err) {
      console.error('Error saving combo:', err);
      showToast('Error al guardar el combo');
    }
  };

  // Carga conteos en tiempo real para las 8 audiencias desde la RPC de Supabase
  const fetchSegments = async () => {
    try {
      const segmentsList = ['vip', 'inactivo_15d', 'frecuente', 'nuevo', 'fin_de_semana', 'hamburguesas_lovers', 'bowls_lovers', 'todas'];
      const counts = {};
      
      await Promise.all(segmentsList.map(async (seg) => {
        const { data, error } = await supabase.rpc('get_clientes_by_audiencia', { p_audiencia_id: seg });
        if (!error && data) {
          counts[seg] = data.length;
        } else {
          counts[seg] = 0;
        }
      }));
      
      setSegments(counts);
    } catch (err) {
      console.error('Error fetching segments:', err);
    }
  };

  // Carga plantillas del segmento seleccionado
  const fetchTemplates = async (segmentId) => {
    try {
      const { data, error } = await supabase
        .from('plantillas_mensajes')
        .select('*')
        .eq('segmento_id', segmentId);
      
      if (!error && data) {
        setTemplates(data);
        if (data.length > 0) {
          setSelectedTemplate(data[0]);
          setTemplateText(data[0].mensaje_plantilla);
        } else {
          setSelectedTemplate(null);
          setTemplateText('');
        }
      }
    } catch (err) {
      console.error('Error fetching templates:', err);
    }
  };

  const fetchProposals = async () => {
    setProposalsLoading(true);
    try {
      const { data, error } = await supabase
        .from('propuestas_sistema')
        .select('*')
        .eq('estado', 'pendiente')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const now = new Date();
        const validProposals = data.filter(prop => {
          if (!prop.expires_at) return true;
          return new Date(prop.expires_at) > now;
        });
        setProposals(validProposals);
      }
    } catch (err) {
      console.error('Error fetching proposals:', err);
    } finally {
      setProposalsLoading(false);
    }
  };

  const handleApprove = async (prop) => {
    if (navigator.vibrate) navigator.vibrate(10);
    
    try {
      const { plato_id, precio_sugerido, precio_oferta, etiqueta_promo } = prop.meta_data;

      if (prop.tipo_propuesta === 'sugerencia_oferta') {
        const { error: menuErr } = await supabase
          .from('items_menu')
          .update({
            en_oferta: true,
            precio_oferta: parseFloat(precio_oferta),
            etiqueta_promo: etiqueta_promo
          })
          .eq('id', plato_id);
        if (menuErr) throw menuErr;
        
        const instructionText = `Hoy empuja la venta de ${prop.meta_data.plato_nombre} porque nos queda mucho stock de ${prop.meta_data.insumo_nombre.toLowerCase()}.`;
        await updateBotContext(instructionText);
      } 
      else if (prop.tipo_propuesta === 'ajuste_precio') {
        const { error: menuErr } = await supabase
          .from('items_menu')
          .update({ precio: parseFloat(precio_sugerido) })
          .eq('id', plato_id);
        if (menuErr) throw menuErr;
      } 
      else if (prop.tipo_propuesta === 'quiebre_stock') {
        const { error: menuErr } = await supabase
          .from('items_menu')
          .update({ disponible: false })
          .eq('id', plato_id);
        if (menuErr) throw menuErr;
      }

      const { error: propErr } = await supabase
        .from('propuestas_sistema')
        .update({ estado: 'aprobado' })
        .eq('id', prop.id);
      if (propErr) throw propErr;

      showToast(`✅ Sugerencia aprobada con éxito`);
      setProposals(prev => prev.filter(p => p.id !== prop.id));
    } catch (err) {
      console.error(err);
      showToast(`❌ Error al aprobar: ${err.message}`);
    }
  };

  const handleDiscard = async (propId) => {
    if (navigator.vibrate) navigator.vibrate(5);
    try {
      const { error } = await supabase
        .from('propuestas_sistema')
        .update({ estado: 'descartado' })
        .eq('id', propId);
      if (error) throw error;
      
      showToast(`🗑️ Sugerencia descartada`);
      setProposals(prev => prev.filter(p => p.id !== propId));
    } catch (err) {
      console.error(err);
      showToast(`❌ Error al descartar`);
    }
  };

  const updateBotContext = async (instruction) => {
    try {
      const { data: existingContext } = await supabase
        .from('restaurante_info_contexto')
        .select('*')
        .eq('clave', 'promocion_activa')
        .single();

      if (existingContext) {
        await supabase
          .from('restaurante_info_contexto')
          .update({ contenido: instruction, updated_at: new Date().toISOString() })
          .eq('id', existingContext.id);
      } else {
        await supabase
          .from('restaurante_info_contexto')
          .insert([{
            restaurante_id: activeRestaurant?.id || '8c7a6e1a-1d5b-43ad-8d99-c990263f45bb',
            clave: 'promocion_activa',
            contenido: instruction
          }]);
      }
    } catch (err) {
      console.error('Error updating bot context:', err);
    }
  };

  // Lanza la campaña llamando a la RPC de Supabase y disparando el webhook de n8n
  const handleLaunchCampaign = async (e) => {
    e.preventDefault();
    if (!promoTitle.trim() || !templateText.trim()) return;
    setSending(true);
    setCampaignSuccess(false);

    try {
      // 1. Ejecutar RPC en Supabase para encolar envíos individuales pre-compilados
      const { data: campanaId, error: dbErr } = await supabase.rpc('lanzar_campana_marketing', {
        p_nombre: promoTitle,
        p_audiencia_id: selectedSegment,
        p_promocion: promocionVal || 'un descuento especial',
        p_dia_semana: diaSemanaVal || 'hoy',
        p_plantilla_mensaje: templateText,
        p_reach_limit: parseInt(reachLimit) || 1
      });

      if (dbErr) throw dbErr;

      setCampaignIdCreated(campanaId);

      // 2. Notificar a n8n por Webhook para que despache la cola
      const WEBHOOK_URL = 'https://hooks.koratflow.agency/webhook/campanas/enviar';
      try {
        await fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            campana_id: campanaId,
            business_id: activeRestaurant?.id || '8c7a6e1a-1d5b-43ad-8d99-c990263f45bb'
          })
        });
      } catch (webhookErr) {
        console.warn("n8n Webhook connection warning (campaign created in DB):", webhookErr);
      }

      if (navigator.vibrate) navigator.vibrate([40, 80, 40]);
      setCampaignSuccess(true);
      setPromoTitle('');
      setPromocionVal('');
      setDiaSemanaVal('hoy Viernes');
      
      // Recargar segmentos
      fetchSegments();
    } catch (err) {
      console.error(err);
      showToast('❌ Error al iniciar campaña');
    } finally {
      setSending(false);
    }
  };

  const getEstimatedReach = () => {
    return segments[selectedSegment] || 0;
  };

  const getHoursLeft = (expiresAt) => {
    if (!expiresAt) return '';
    const diff = new Date(expiresAt) - new Date();
    const hours = Math.ceil(diff / (1000 * 60 * 60));
    if (hours <= 0) return 'Vence pronto';
    return `Expira en ${hours}h`;
  };

  // Compila el preview resaltando las variables en HTML
  const getPreviewHtml = () => {
    let text = templateText || 'Elige una plantilla para ver la vista previa...';
    text = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    // Variables dinámicas resaltadas como tags premium
    const nameBadge = `<span style="background: rgba(216, 160, 32, 0.15); color: #B5800E; padding: 2px 6px; border-radius: 6px; font-weight: 800; border: 1px solid rgba(216, 160, 32, 0.25); font-size: 11px;">{nombre}</span>`;
    const dayBadge = `<span style="background: rgba(64, 145, 108, 0.15); color: #2D6A4F; padding: 2px 6px; border-radius: 6px; font-weight: 800; border: 1px solid rgba(64, 145, 108, 0.25); font-size: 11px;">${diaSemanaVal || '{dia}'}</span>`;
    const promoBadge = `<span style="background: rgba(27, 67, 50, 0.15); color: #1B4332; padding: 2px 6px; border-radius: 6px; font-weight: 800; border: 1px solid rgba(27, 67, 50, 0.25); font-size: 11px;">${promocionVal || '{promocion}'}</span>`;
    
    // Reemplazos regex
    text = text.replace(/{nombre}/gi, nameBadge);
    text = text.replace(/{dia}/gi, dayBadge);
    text = text.replace(/{promocion}/gi, promoBadge);
    
    // Saltos de línea
    text = text.replace(/\n/g, '<br/>');
    return text;
  };

  const getSegmentName = (id) => {
    const names = {
      vip: '⭐ VIPs',
      inactivo_15d: '💤 Inactivos',
      frecuente: '🔄 Frecuentes',
      nuevo: '🌱 Nuevos',
      fin_de_semana: '🥳 Fines de Semana',
      hamburguesas_lovers: '🍔 Burger Lovers',
      bowls_lovers: '🥗 Bowl Lovers',
      todas: '✨ Todos'
    };
    return names[id] || id;
  };

  /* ── Estilos compartidos ── */
  const inputStyle = {
    width: '100%', padding: '12px 14px',
    background: 'var(--color-surface-2)',
    border: '1.5px solid var(--color-surface-3)',
    borderRadius: 12, color: 'var(--color-on-surface)',
    outline: 'none', boxSizing: 'border-box',
    fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 13,
  };

  return (
    <div style={{ padding: '20px 20px calc(80px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', gap: 18, position: 'relative' }}>
      
      {/* Encabezado */}
      <div>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 22, fontWeight: 900, color: 'var(--color-on-surface)', lineHeight: 1.2 }}>
          Copiloto de Marketing e IA
        </h1>
        <p style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600, marginTop: 2 }}>
          Gestión inteligente de promociones, mermas y fidelización
        </p>
      </div>

      {/* SUB-MÓDULO 1: Marketplaces y Audiencias */}
      <div>
        <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 14, fontWeight: 900, color: 'var(--color-on-surface)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          👥 Marketplace de Audiencias & Segmentos
        </h3>
        <p style={{ fontSize: 10, color: 'var(--color-muted)', marginBottom: 12, marginTop: -4 }}>
          Selecciona una audiencia haciendo click sobre su tarjeta para configurar tu campaña
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
          {[
            { id: 'vip', label: '⭐ VIPs', count: segments.vip, desc: 'Pedidos >= 5 o gastado >= S/.150', color: '#D8A020', bg: 'rgba(216,160,32,0.06)' },
            { id: 'inactivo_15d', label: '💤 Inactivos (>15d)', count: segments.inactivo_15d, desc: 'Sin compras en 15 días', color: '#EF4444', bg: 'rgba(239,68,68,0.06)' },
            { id: 'frecuente', label: '🔄 Frecuentes', count: segments.frecuente, desc: 'Fieles recurrentes en local', color: '#1B4332', bg: 'rgba(27,67,50,0.06)' },
            { id: 'nuevo', label: '🌱 Nuevos', count: segments.nuevo, desc: 'Registrados con 0 o 1 pedido', color: 'var(--color-secondary)', bg: 'rgba(64,145,108,0.06)' },
            { id: 'fin_de_semana', label: '🥳 Fieles Fin de Semana', count: segments.fin_de_semana, desc: 'Piden Viernes, Sábado o Domingo', color: '#FF7A00', bg: 'rgba(255,122,0,0.06)' },
            { id: 'hamburguesas_lovers', label: '🍔 Burger Lovers', count: segments.hamburguesas_lovers, desc: 'Su plato favorito es Hamburguesa', color: '#B58D3D', bg: 'rgba(181,141,61,0.06)' },
            { id: 'bowls_lovers', label: '🥗 Bowl Lovers', count: segments.bowls_lovers, desc: 'Consumen ensaladas y bowls', color: '#2E7D32', bg: 'rgba(46,125,50,0.06)' },
            { id: 'todas', label: '✨ Todos los Clientes', count: segments.todas, desc: 'Base de datos completa', color: '#6A1B9A', bg: 'rgba(106,27,154,0.06)' }
          ].map(seg => {
            const isSelected = selectedSegment === seg.id;
            return (
              <div
                key={seg.id}
                onClick={() => { setSelectedSegment(seg.id); if (navigator.vibrate) navigator.vibrate(5); }}
                style={{
                  background: seg.bg,
                  border: isSelected ? `2.5px solid ${seg.color}` : '1.5px solid var(--color-surface-3)',
                  borderRadius: 18,
                  padding: '12px 14px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 200ms ease',
                  transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                  boxShadow: isSelected ? '0 6px 16px rgba(0,0,0,0.08)' : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: 96
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-on-surface)' }}>{seg.label}</p>
                    {isSelected && <span style={{ fontSize: 10, color: seg.color }}>●</span>}
                  </div>
                  <p style={{ fontSize: 9, color: 'var(--color-muted)', marginTop: 2, lineHeight: 1.2 }}>{seg.desc}</p>
                </div>
                <p style={{ fontSize: 22, fontWeight: 900, color: seg.color, marginTop: 6, alignSelf: 'flex-end' }}>
                  {loading ? '...' : seg.count}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* BUZÓN DE RECOMENDACIONES (COPILOTO IA) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 14, fontWeight: 900, color: 'var(--color-on-surface)', display: 'flex', alignItems: 'center', gap: 6 }}>
            🧠 Buzón del Copiloto Inteligente
          </h3>
          <span style={{ fontSize: 10, color: 'var(--color-muted)', fontWeight: 700 }} onClick={fetchProposals} style={{ cursor: 'pointer' }}>
            🔄 Actualizar
          </span>
        </div>

        {proposalsLoading ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--color-muted)' }}>Cargando sugerencias de IA...</div>
        ) : proposals.length === 0 ? (
          <div style={{ background: 'var(--color-surface)', border: '1px dashed var(--color-surface-3)', borderRadius: 20, padding: '32px 20px', textAlign: 'center' }}>
            <span style={{ fontSize: 28, display: 'block', marginBottom: 8 }}>✅</span>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-on-surface)' }}>¡Todo en orden!</p>
            <p style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 4 }}>El copiloto no tiene recomendaciones de inventario o precios pendientes.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {proposals.map(prop => {
              let theme = { bg: 'rgba(64,145,108,0.06)', border: 'rgba(64,145,108,0.2)', badge: 'RECOMENDACIÓN', badgeColor: '#40916C', icon: '💡' };
              if (prop.tipo_propuesta === 'sugerencia_oferta') {
                theme = { bg: 'rgba(217,4,41,0.04)', border: 'rgba(217,4,41,0.15)', badge: '🔥 EVITAR MERMA', badgeColor: '#D90429', icon: '🍎' };
              } else if (prop.tipo_propuesta === 'ajuste_precio') {
                theme = { bg: 'rgba(216,160,32,0.04)', border: 'rgba(216,160,32,0.15)', badge: '💸 PRECIO SUGERIDO', badgeColor: '#D8A020', icon: '💰' };
              } else if (prop.tipo_propuesta === 'quiebre_stock') {
                theme = { bg: 'rgba(239,68,68,0.04)', border: 'rgba(239,68,68,0.15)', badge: '⚠️ STOCK CRÍTICO', badgeColor: '#EF4444', icon: '📦' };
              } else if (prop.tipo_propuesta === 'cliente_inactivo') {
                theme = { bg: 'rgba(111,66,193,0.04)', border: 'rgba(111,66,193,0.15)', badge: '💤 CLIENTE INACTIVO', badgeColor: '#6F42C1', icon: '👥' };
              } else if (prop.tipo_propuesta === 'combo_inteligente') {
                theme = { bg: 'rgba(27,67,50,0.04)', border: 'rgba(27,67,50,0.15)', badge: '🎯 COMBO COMPRA', badgeColor: '#1B4332', icon: '🍔' };
              }

              return (
                <div
                  key={prop.id}
                  style={{
                    background: theme.bg, border: `1.5px solid ${theme.border}`,
                    borderRadius: 20, padding: 16, display: 'flex', flexDirection: 'column', gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 16 }}>{theme.icon}</span>
                      <span style={{ fontSize: 9, fontWeight: 800, color: theme.badgeColor, background: '#fff', padding: '3px 8px', borderRadius: 8, border: `1px solid ${theme.border}` }}>
                        {theme.badge}
                      </span>
                    </div>
                    {prop.expires_at && (
                      <span style={{ fontSize: 9, color: 'var(--color-muted)', fontWeight: 700 }}>
                        ⏳ {getHoursLeft(prop.expires_at)}
                      </span>
                    )}
                  </div>

                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-on-surface)', lineHeight: 1.4 }}>
                      {prop.descripcion}
                    </p>
                    
                    {prop.tipo_propuesta === 'sugerencia_oferta' && (
                      <p style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 4 }}>
                        Plato: <strong>{prop.meta_data.plato_nombre}</strong> · Sugerido: <span style={{ color: '#D90429', fontWeight: 800 }}>S/. {parseFloat(prop.meta_data.precio_oferta).toFixed(2)}</span> ({prop.meta_data.etiqueta_promo})
                      </p>
                    )}
                    {prop.tipo_propuesta === 'ajuste_precio' && (
                      <p style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 4 }}>
                        Plato: <strong>{prop.meta_data.plato_nombre}</strong> · Precio actual: S/. {prop.meta_data.precio_actual.toFixed(2)} → <span style={{ color: '#D8A020', fontWeight: 800 }}>Sugerido: S/. {prop.meta_data.precio_sugerido.toFixed(2)}</span>
                      </p>
                    )}
                    {prop.tipo_propuesta === 'quiebre_stock' && (
                      <p style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 4 }}>
                        Plato a pausar: <strong>{prop.meta_data.plato_nombre}</strong> por quiebre de <strong>{prop.meta_data.insumo_nombre}</strong>
                      </p>
                    )}
                    {prop.tipo_propuesta === 'cliente_inactivo' && (
                      <p style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 4 }}>
                        Cliente: <strong>{prop.meta_data.cliente_nombre}</strong> · Plato favorito: <strong>{prop.meta_data.plato_favorito}</strong>
                      </p>
                    )}
                    {prop.tipo_propuesta === 'combo_inteligente' && (
                      <p style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 4 }}>
                        Combo: <strong>{prop.meta_data.combo_nombre}</strong> · Precio Combo sugerido: <span style={{ color: '#1B4332', fontWeight: 800 }}>S/. {prop.meta_data.precio_combo.toFixed(2)}</span>
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 8, borderTop: '1px dashed rgba(0,0,0,0.06)', paddingTop: 10, marginTop: 4 }}>
                    <button
                      type="button"
                      onClick={() => handleApprove(prop)}
                      style={{
                        flex: 1, padding: '8px 12px', background: theme.badgeColor, color: '#fff',
                        border: 'none', borderRadius: 10, fontSize: 11, fontWeight: 800, cursor: 'pointer',
                        textAlign: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                      }}
                    >
                      👍 Aprobar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDiscard(prop.id)}
                      style={{
                        padding: '8px 14px', background: 'var(--color-surface-2)', color: 'var(--color-muted)',
                        border: '1px solid var(--color-surface-3)', borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: 'pointer'
                      }}
                    >
                      Ignorar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* TRIGGERS AUTOMÁTICOS */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-surface-3)', borderRadius: 24, padding: 18 }}>
        <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 14, fontWeight: 900, color: 'var(--color-on-surface)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
          ⚡ Automatizaciones de Base de Datos (Postgres Triggers)
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-on-surface)' }}>Crear Alerta por Merma Próxima</p>
              <p style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: 2 }}>
                Genera alertas sugeridas en el buzón al detectar ingredientes que vencen en menos de 48 horas.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAutoMermas(p => !p)}
              style={{
                width: 44, height: 24, borderRadius: 12,
                background: autoMermas ? 'var(--color-primary)' : 'var(--color-surface-3)',
                border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 250ms'
              }}
            >
              <div style={{ position: 'absolute', top: 3, left: autoMermas ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 250ms' }} />
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, borderTop: '1px dashed var(--color-surface-3)', paddingTop: 14 }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-on-surface)' }}>Alerta por Quiebre de Stock</p>
              <p style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: 2 }}>
                Propone pausar platos cuando un ingrediente fundamental llega a 0 en el almacén.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAutoStockOut(p => !p)}
              style={{
                width: 44, height: 24, borderRadius: 12,
                background: autoStockOut ? 'var(--color-primary)' : 'var(--color-surface-3)',
                border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 250ms'
              }}
            >
              <div style={{ position: 'absolute', top: 3, left: autoStockOut ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 250ms' }} />
            </button>
          </div>
        </div>
      </div>

      {/* CONFIGURACIÓN DEL COMBO DEL DÍA */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-surface-3)', borderRadius: 24, padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: 20 }}>🍔</span>
          <div>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 14, fontWeight: 900, color: 'var(--color-on-surface)' }}>
              Configurar Combo Suna del Día
            </h3>
            <p style={{ fontSize: 10, color: 'var(--color-muted)', fontWeight: 600 }}>
              Elige el plato, la bebida y define el precio de oferta que verán los clientes en la PWA
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveCombo} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 5 }}>Hamburguesa Principal</label>
              {hamburgers.length === 0 ? (
                <p style={{ fontSize: 11, color: 'var(--color-muted)' }}>Cargando hamburguesas...</p>
              ) : (
                <select
                  value={selectedBurgerId}
                  onChange={e => setSelectedBurgerId(e.target.value)}
                  style={inputStyle}
                >
                  <option value="">Selecciona...</option>
                  {hamburgers.map(h => (
                    <option key={h.id} value={h.id}>{h.nombre} (S/. {parseFloat(h.precio).toFixed(2)})</option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 5 }}>Bebida Base</label>
              {drinks.length === 0 ? (
                <p style={{ fontSize: 11, color: 'var(--color-muted)' }}>Cargando bebidas...</p>
              ) : (
                <select
                  value={selectedDrinkId}
                  onChange={e => setSelectedDrinkId(e.target.value)}
                  style={inputStyle}
                >
                  <option value="">Selecciona...</option>
                  {drinks.map(d => (
                    <option key={d.id} value={d.id}>{d.nombre} (S/. {parseFloat(d.precio).toFixed(2)})</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 5 }}>Precio Oferta Combo (S/.)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                placeholder="Ej. 39.00"
                value={comboPromoPrice}
                onChange={e => setComboPromoPrice(e.target.value)}
                style={{ ...inputStyle, background: '#fff' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 5 }}>Duración de la Oferta</label>
              <select
                value={comboExpiryHours}
                onChange={e => setComboExpiryHours(parseInt(e.target.value))}
                style={inputStyle}
              >
                <option value="2">2 Horas</option>
                <option value="4">4 Horas</option>
                <option value="6">6 Horas</option>
                <option value="12">12 Horas</option>
                <option value="24">24 Horas</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--color-surface-3)', paddingTop: 14 }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-on-surface)' }}>Combo Activo en PWA</p>
              <p style={{ fontSize: 9, color: 'var(--color-muted)' }}>Muestra la oferta en la cabecera de la carta de los clientes.</p>
            </div>
            <button
              type="button"
              onClick={() => setComboActive(p => !p)}
              style={{
                width: 44, height: 24, borderRadius: 12,
                background: comboActive ? 'var(--color-primary)' : 'var(--color-surface-3)',
                border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 250ms'
              }}
            >
              <div style={{ position: 'absolute', top: 3, left: comboActive ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 250ms' }} />
            </button>
          </div>

          <button
            type="submit"
            style={{
              background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 12,
              padding: '12px', fontSize: 12, fontWeight: 800, cursor: 'pointer',
              textAlign: 'center', width: '100%', marginTop: 6,
              boxShadow: '0 4px 12px rgba(27,67,50,0.15)'
            }}
          >
            💾 Guardar y Publicar Combo
          </button>
        </form>
      </div>

      {/* PANEL CONTROL: Campañas Masivas con Banco de Plantillas */}
      <div style={{ background: 'linear-gradient(135deg, rgba(64,145,108,0.08) 0%, rgba(27,67,50,0.03) 100%)', border: '1.5px solid rgba(64,145,108,0.25)', borderRadius: 24, padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: 20 }}>🚀</span>
          <div>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 14, fontWeight: 900, color: 'var(--color-on-surface)' }}>
              Lanzador de Campañas Masivas (WhatsApp Gateway)
            </h3>
            <p style={{ fontSize: 10, color: 'var(--color-muted)', fontWeight: 600 }}>
              Crea colas de mensajes en Supabase y dispáralos por WhatsApp usando n8n
            </p>
          </div>
        </div>

        <form onSubmit={handleLaunchCampaign} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          
          {/* Fila: Nombre campaña */}
          <div>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 5 }}>Nombre de la Campaña</label>
            <input
              required type="text"
              placeholder="Ej. Campaña Reactivación de Invierno"
              value={promoTitle}
              onChange={e => setPromoTitle(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Fila: Info Audiencia y Alcance */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <p style={{ fontSize: 10, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Segmento Activo</p>
              <div style={{ ...inputStyle, background: 'rgba(255,255,255,0.4)', fontWeight: 800 }}>
                {getSegmentName(selectedSegment)}
              </div>
            </div>
            <div>
              <p style={{ fontSize: 10, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Tamaño Máximo</p>
              <div style={{ ...inputStyle, background: 'rgba(255,255,255,0.4)', fontWeight: 800 }}>
                {loading ? 'Calculando...' : `${getEstimatedReach()} clientes`}
              </div>
            </div>
          </div>

          {/* Slider de Alcance Personalizado */}
          {getEstimatedReach() > 0 && (
            <div style={{ background: 'rgba(255,255,255,0.3)', padding: 12, borderRadius: 12, border: '1px solid var(--color-surface-3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-on-surface)' }}>Personalizar Límite de Envío</label>
                <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-primary)' }}>
                  {reachLimit} / {getEstimatedReach()} Clientes
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input 
                  type="range" 
                  min={1} 
                  max={getEstimatedReach()} 
                  value={reachLimit} 
                  onChange={e => setReachLimit(parseInt(e.target.value))}
                  style={{ flex: 1, accentColor: 'var(--color-primary)', cursor: 'pointer' }}
                />
                <input
                  type="number"
                  min={1}
                  max={getEstimatedReach()}
                  value={reachLimit}
                  onChange={e => setReachLimit(Math.min(getEstimatedReach(), Math.max(1, parseInt(e.target.value) || 1)))}
                  style={{ ...inputStyle, width: 70, padding: '6px', textAlign: 'center' }}
                />
              </div>
            </div>
          )}

          {/* Banco de Plantillas */}
          <div>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 5 }}>Seleccionar Plantilla Sugerida</label>
            {templates.length === 0 ? (
              <p style={{ fontSize: 11, color: 'var(--color-muted)' }}>Cargando banco de mensajes...</p>
            ) : (
              <select
                value={selectedTemplate?.id || ''}
                onChange={e => {
                  const found = templates.find(t => t.id === e.target.value);
                  if (found) {
                    setSelectedTemplate(found);
                    setTemplateText(found.mensaje_plantilla);
                  }
                }}
                style={inputStyle}
              >
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.titulo}</option>
                ))}
              </select>
            )}
          </div>

          {/* Inputs para Rellenar Variables */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, background: 'rgba(255,255,255,0.2)', padding: 12, borderRadius: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase', marginBottom: 5 }}>1. {`{dia}`} de la promo</label>
              <input
                type="text"
                placeholder="Ej. hoy Viernes"
                value={diaSemanaVal}
                onChange={e => setDiaSemanaVal(e.target.value)}
                style={{ ...inputStyle, background: '#fff' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase', marginBottom: 5 }}>2. {`{promocion}`} sugerida</label>
              <input
                type="text"
                placeholder="Ej. 20% dscto en burgers"
                value={promocionVal}
                onChange={e => setPromocionVal(e.target.value)}
                style={{ ...inputStyle, background: '#fff' }}
              />
            </div>
          </div>

          {/* Editor de Mensaje */}
          <div>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 5 }}>Personalizar Contenido del Mensaje</label>
            <textarea
              required rows="4"
              value={templateText}
              onChange={e => setTemplateText(e.target.value)}
              style={{ ...inputStyle, resize: 'none', lineHeight: 1.5, background: '#fff' }}
            />
            <p style={{ fontSize: 9, color: 'var(--color-muted)', marginTop: 4 }}>
              <strong>Nota:</strong> No elimines las variables `{`{nombre}`}`, `{`{dia}`}` o `{`{promocion}`}` si deseas que se autocompilen.
            </p>
          </div>

          {/* VISTA PREVIA SIMULADA DE WHATSAPP */}
          <div>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Vista Previa en Tiempo Real (WhatsApp)</label>
            <div style={{
              background: '#E5DDD5',
              backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")',
              backgroundSize: 'cover',
              padding: '16px 12px',
              borderRadius: 18,
              minHeight: 100,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <div style={{
                background: '#DCF8C6',
                color: '#303030',
                borderRadius: '12px 12px 0 12px',
                padding: '10px 12px',
                fontSize: 12,
                lineHeight: 1.4,
                alignSelf: 'flex-end',
                maxWidth: '90%',
                boxShadow: '0 1px 2px rgba(0,0,0,0.12)',
                position: 'relative',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}>
                <div dangerouslySetInnerHTML={{ __html: getPreviewHtml() }} />
                <span style={{ fontSize: 8, color: '#727272', float: 'right', marginTop: 4, marginLeft: 16 }}>
                  {new Date().getHours()}:${String(new Date().getMinutes()).padStart(2, '0')} ✔✔
                </span>
              </div>
            </div>
          </div>

          {campaignSuccess && (
            <div style={{ background: '#D1FAE5', border: '1px solid #10B981', color: '#065F46', padding: 12, borderRadius: 14, fontSize: 11, fontWeight: 700, textAlign: 'center' }}>
              🎉 ¡Campaña encolada y lanzada con éxito! Supabase procesó {reachLimit} mensajes y notificó a n8n para el despacho vía WhatsApp. (ID: {campaignIdCreated?.slice(0, 8)})
            </div>
          )}

          <button
            type="submit"
            disabled={sending || reachLimit <= 0}
            style={{
              background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 14,
              padding: '12px', fontSize: 12, fontWeight: 800, cursor: (sending || reachLimit <= 0) ? 'not-allowed' : 'pointer',
              opacity: (sending || reachLimit <= 0) ? 0.7 : 1, textAlign: 'center', width: '100%', marginTop: 4,
              boxShadow: '0 4px 12px rgba(27,67,50,0.2)'
            }}
          >
            {sending ? 'Procesando en Supabase...' : '🚀 Encolar y Despachar Campaña'}
          </button>
        </form>
      </div>

      {/* Floating Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--color-on-surface)', color: '#fff',
          padding: '10px 20px', borderRadius: 999, fontSize: 12, fontWeight: 700,
          whiteSpace: 'nowrap', zIndex: 99999, animation: 'toast-in 250ms ease',
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
        }}>
          {toast}
        </div>
      )}

    </div>
  );
}
