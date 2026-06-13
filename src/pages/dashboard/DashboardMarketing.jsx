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
    total: 0
  });
  const [loading, setLoading] = useState(true);
  const [proposalsLoading, setProposalsLoading] = useState(true);

  // Estados de Formulario de Campaña
  const [selectedSegment, setSelectedSegment] = useState('inactivo_15d');
  const [promoTitle, setPromoTitle] = useState('');
  const [promoMessageIdea, setPromoMessageIdea] = useState('');
  const [sending, setSending] = useState(false);
  const [campaignSuccess, setCampaignSuccess] = useState(false);

  // Estados de Triggers Automáticos (Simulado/Config)
  const [autoMermas, setAutoMermas] = useState(true);
  const [autoStockOut, setAutoStockOut] = useState(true);
  const [discountPct, setDiscountPct] = useState(15);

  // Toast
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchSegments(), fetchProposals()]);
    setLoading(false);
  };

  const fetchSegments = async () => {
    try {
      const { data, error } = await supabase
        .from('clientes_segmentos')
        .select('segmento_principal');

      if (!error && data) {
        const counts = { vip: 0, inactivo_15d: 0, nuevo: 0, frecuente: 0, total: data.length };
        data.forEach(item => {
          const seg = item.segmento_principal;
          if (counts[seg] !== undefined) {
            counts[seg]++;
          } else {
            counts.nuevo++;
          }
        });
        setSegments(counts);
      }
    } catch (err) {
      console.error('Error fetching segments:', err);
    }
  };

  const fetchProposals = async () => {
    setProposalsLoading(true);
    try {
      // Filtrar propuestas pendientes y no expiradas
      const { data, error } = await supabase
        .from('propuestas_sistema')
        .select('*')
        .eq('estado', 'pendiente')
        .order('created_at', { ascending: false });

      if (!error && data) {
        // Filtrar localmente propuestas expiradas por tiempo
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

      // Realizar la acción en Supabase según el tipo de propuesta
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
        
        // También inyectar la instrucción en el contexto del bot
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

      // Marcar propuesta como aprobada
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

  const handleLaunchCampaign = async (e) => {
    e.preventDefault();
    if (!promoTitle.trim() || !promoMessageIdea.trim()) return;
    setSending(true);
    setCampaignSuccess(false);

    try {
      const { error: dbErr } = await supabase
        .from('propuestas_sistema')
        .insert([{
          tipo_propuesta: 'campana_marketing_ia',
          descripcion: `Campaña: ${promoTitle} - Segmento: ${selectedSegment}`,
          estado: 'activo',
          meta_data: {
            titulo: promoTitle,
            idea_mensaje: promoMessageIdea,
            segmento: selectedSegment,
            lanzado_at: new Date().toISOString()
          }
        }]);

      if (dbErr) throw dbErr;

      // Simulación de envío a n8n
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (navigator.vibrate) navigator.vibrate([40, 80, 40]);
      setCampaignSuccess(true);
      setPromoTitle('');
      setPromoMessageIdea('');
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

      {/* Tarjetas de Segmentación */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
        {[
          { label: '⭐ Clientes VIP', count: segments.vip, color: '#D8A020', bg: 'rgba(216,160,32,0.08)' },
          { label: '💤 Inactivos (>15d)', count: segments.inactivo_15d, color: '#EF4444', bg: 'rgba(239,68,68,0.08)' },
          { label: '🌱 Clientes Nuevos', count: segments.nuevo, color: 'var(--color-secondary)', bg: 'rgba(64,145,108,0.08)' },
          { label: '🔄 Frecuentes', count: segments.frecuente, color: 'var(--color-primary)', bg: 'rgba(27,67,50,0.08)' }
        ].map(seg => (
          <div key={seg.label} style={{ background: seg.bg, border: `1px solid ${seg.color}30`, borderRadius: 16, padding: 12, textAlign: 'center' }}>
            <p style={{ fontSize: 9, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{seg.label}</p>
            <p style={{ fontSize: 20, fontWeight: 900, color: seg.color, marginTop: 4 }}>{loading ? '...' : seg.count}</p>
          </div>
        ))}
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
            <p style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 4 }}>El copiloto no tiene recomendaciones pendientes en este momento.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {proposals.map(prop => {
              // Colores y badges por tipo de propuesta
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
                    animation: 'scale-up 200ms ease'
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
                    
                    {/* Visualizador de MetaData según el tipo */}
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

      {/* SECCIÓN 3: Triggers Automáticos */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-surface-3)', borderRadius: 24, padding: 18 }}>
        <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 14, fontWeight: 900, color: 'var(--color-on-surface)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
          ⚡ Automatizaciones de Base de Datos (Postgres Triggers)
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Trigger Mermas */}
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

          {/* Trigger Stock Cero */}
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

      {/* SECCIÓN 4: Campañas Masivas con IA */}
      <div style={{ background: 'linear-gradient(135deg, rgba(64,145,108,0.08) 0%, rgba(27,67,50,0.03) 100%)', border: '1.5px solid rgba(64,145,108,0.25)', borderRadius: 24, padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: 20 }}>🤖</span>
          <div>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 14, fontWeight: 900, color: 'var(--color-on-surface)' }}>
              Envío de Campañas Masivas por WhatsApp
            </h3>
            <p style={{ fontSize: 10, color: 'var(--color-muted)', fontWeight: 600 }}>
              La IA personalizará el mensaje basándose en el segmento y consumo histórico del cliente
            </p>
          </div>
        </div>

        <form onSubmit={handleLaunchCampaign} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 5 }}>Nombre de la Campaña</label>
            <input
              required type="text"
              placeholder="Ej. Promo Reactivación Jun"
              value={promoTitle}
              onChange={e => setPromoTitle(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 5 }}>Segmento Objetivo</label>
              <select
                value={selectedSegment}
                onChange={e => setSelectedSegment(e.target.value)}
                style={inputStyle}
              >
                <option value="vip">⭐ Clientes VIP</option>
                <option value="inactivo_15d">💤 Inactivos (&gt;15 días)</option>
                <option value="nuevo">🌱 Clientes Nuevos</option>
                <option value="frecuente">🔄 Clientes Frecuentes</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 5 }}>Alcance Estimado</label>
              <div style={{ ...inputStyle, background: 'rgba(255,255,255,0.4)', fontWeight: 800, display: 'flex', alignItems: 'center' }}>
                {loading ? 'Calculando...' : `${getEstimatedReach()} clientes`}
              </div>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 5 }}>Instrucción/Idea de la Promo para la IA</label>
            <textarea
              required rows="3"
              placeholder="Ej. Ofrecerles un postre de regalo si piden una hamburguesa o dar 15% de descuento en bowls..."
              value={promoMessageIdea}
              onChange={e => setPromoMessageIdea(e.target.value)}
              style={{ ...inputStyle, resize: 'none', lineHeight: 1.5 }}
            />
          </div>

          {campaignSuccess && (
            <div style={{ background: '#D1FAE5', border: '1px solid #10B981', color: '#065F46', padding: 10, borderRadius: 12, fontSize: 11, fontWeight: 700, textAlign: 'center' }}>
              🎉 ¡Campaña iniciada! La IA en n8n está personalizando y enviando los mensajes de WhatsApp.
            </div>
          )}

          <button
            type="submit"
            disabled={sending}
            style={{
              background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 14,
              padding: '12px', fontSize: 12, fontWeight: 800, cursor: sending ? 'not-allowed' : 'pointer',
              opacity: sending ? 0.7 : 1, textAlign: 'center', width: '100%', marginTop: 6,
              boxShadow: '0 4px 12px rgba(27,67,50,0.2)'
            }}
          >
            {sending ? 'Procesando con IA...' : '🚀 Lanzar Campaña Personalizada'}
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
