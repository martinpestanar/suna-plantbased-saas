import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient.js';
import { useAuth } from '../../router.jsx';

export default function DashboardMarketing() {
  const { activeRestaurant } = useAuth();
  const [segments, setSegments] = useState({
    vip: 0,
    inactivo_15d: 0,
    nuevo: 0,
    frecuente: 0,
    total: 0
  });
  const [loading, setLoading] = useState(true);
  
  // Estados de Formulario de Campaña
  const [selectedSegment, setSelectedSegment] = useState('inactivo_15d');
  const [promoTitle, setPromoTitle] = useState('');
  const [promoMessageIdea, setPromoMessageIdea] = useState('');
  const [sending, setSending] = useState(false);
  const [campaignSuccess, setCampaignSuccess] = useState(false);

  // Estados de Triggers Automáticos (Local State Simulado)
  const [autoMermas, setAutoMermas] = useState(true);
  const [autoStockOut, setAutoStockOut] = useState(true);
  const [discountPct, setDiscountPct] = useState(15);

  useEffect(() => {
    fetchSegments();
  }, []);

  const fetchSegments = async () => {
    setLoading(true);
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
            counts.nuevo++; // fallback
          }
        });
        setSegments(counts);
      }
    } catch (err) {
      console.error('Error fetching segments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLaunchCampaign = async (e) => {
    e.preventDefault();
    if (!promoTitle.trim() || !promoMessageIdea.trim()) return;
    setSending(true);
    setCampaignSuccess(false);

    try {
      // 1. Registrar campaña en base de datos
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

      // 2. Simular o llamar Webhook de n8n
      // n8n Webhook: En un escenario real, haríamos un fetch a la URL del webhook de n8n
      // pasándole los datos de los clientes del segmento y el prompt.
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulación de procesamiento de la IA

      if (navigator.vibrate) navigator.vibrate([40, 80, 40]);
      setCampaignSuccess(true);
      setPromoTitle('');
      setPromoMessageIdea('');
    } catch (err) {
      console.error(err);
      alert('Error al lanzar la campaña: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  const getEstimatedReach = () => {
    return segments[selectedSegment] || 0;
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
    <div style={{ padding: '20px 20px calc(80px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', gap: 18 }}>
      
      {/* Encabezado */}
      <div>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 22, fontWeight: 900, color: 'var(--color-on-surface)', lineHeight: 1.2 }}>
          Campañas y Automatización
        </h1>
        <p style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600, marginTop: 2 }}>
          Segmentación de clientes y disparadores de marketing inteligente
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
          <div key={seg.label} style={{ background: seg.bg, border: `1px solid ${seg.color}30`, borderRadius: 16, padding: 14, textAlign: 'center' }}>
            <p style={{ fontSize: 9, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{seg.label}</p>
            <p style={{ fontSize: 22, fontWeight: 900, color: seg.color, marginTop: 4 }}>{loading ? '...' : seg.count}</p>
          </div>
        ))}
      </div>

      {/* Grid de Secciones */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
        
        {/* SECCIÓN 1: Triggers Automáticos */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-surface-3)', borderRadius: 24, padding: 18 }}>
          <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 14, fontWeight: 900, color: 'var(--color-on-surface)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
            ⚡ Automatizaciones de Base de Datos (Postgres Triggers)
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Trigger Mermas */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-on-surface)' }}>Autopromocionar Mermas Próximas</p>
                <p style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: 2 }}>
                  Al detectar ingredientes que vencen en menos de 48h, se aplica descuento en la PWA automáticamente.
                </p>
              </div>
              <button
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
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-on-surface)' }}>Ocultación Automática por Quiebre</p>
                <p style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: 2 }}>
                  Si un insumo crítico llega a 0, se inactiva el plato en la PWA y se añade a la lista de agotados del Bot de WhatsApp.
                </p>
              </div>
              <button
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

            {/* Porcentaje Descuento */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, borderTop: '1px dashed var(--color-surface-3)', paddingTop: 14 }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-on-surface)' }}>Descuento Base de Ofertas</p>
                <p style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: 2 }}>Descuento aplicado por defecto a los excedentes de stock.</p>
              </div>
              <select
                value={discountPct}
                onChange={e => setDiscountPct(Number(e.target.value))}
                style={{ padding: '6px 12px', background: 'var(--color-surface-2)', border: '1px solid var(--color-surface-3)', borderRadius: 10, fontSize: 12, fontWeight: 800 }}
              >
                <option value="10">10%</option>
                <option value="15">15%</option>
                <option value="20">20%</option>
                <option value="30">30%</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECCIÓN 2: Campañas Masivas con IA */}
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

      </div>

    </div>
  );
}
