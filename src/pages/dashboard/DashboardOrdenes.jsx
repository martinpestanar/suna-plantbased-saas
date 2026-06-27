import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../supabaseClient.js';
import { useAuth } from '../../router.jsx';

/* ─────────────────────────────── CONSTANTES ─── */
const ESTADOS = [
  { key: 'pendiente',   label: 'Nuevos',      emoji: '🔔', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.3)' },
  { key: 'en_cocina',   label: 'En Cocina',   emoji: '👨‍🍳', color: '#3B82F6', bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.3)' },
  { key: 'listo',       label: 'Listo',       emoji: '✅', color: '#10B981', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.3)' },
  { key: 'en_camino',   label: 'En Camino',   emoji: '🛵', color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)',  border: 'rgba(139,92,246,0.3)' },
  { key: 'entregado',   label: 'Entregados',  emoji: '📦', color: '#1B4332', bg: 'rgba(27,67,50,0.08)',   border: 'rgba(27,67,50,0.2)'  },
  { key: 'cancelado',   label: 'Cancelados',  emoji: '❌', color: '#EF4444', bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.2)'  },
];

const ESTADO_NEXT = {
  pendiente: 'en_cocina',
  en_cocina: 'listo',
  listo:     'en_camino',
  en_camino: 'entregado',
};

const METODO_PAGO_LABEL = {
  yape_plin: '📱 Yape/Plin',
  efectivo:  '💵 Efectivo',
  banco:     '🏦 Banco',
};

/* ─────────────────────────────── HELPERS ─── */
function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`;
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
}

/* ─────────────────────────────── COMPONENTES ─── */

/* Tooltip de sonido de notificación */
function playNotif() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch (_) { /* sin audio en algunos navegadores */ }
}

/* Badge de estado */
function EstadoBadge({ estado }) {
  const e = ESTADOS.find(s => s.key === estado) || ESTADOS[0];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 999,
      background: e.bg, color: e.color, border: `1px solid ${e.border}`,
      textTransform: 'uppercase', letterSpacing: '0.06em',
      whiteSpace: 'nowrap',
    }}>
      {e.emoji} {e.label}
    </span>
  );
}

/* Modal de detalle de orden */
function OrdenModal({ orden, onClose, onUpdateEstado, onAsignarRepartidor }) {
  const [repartidorNombre, setRepartidorNombre] = useState(orden.repartidor_nombre || '');
  const [repartidorTelefono, setRepartidorTelefono] = useState(orden.repartidor_telefono || '');
  const [tiempoEst, setTiempoEst] = useState(orden.tiempo_estimado_minutos || '');
  const [notasC, setNotasC] = useState(orden.notas_cocina || '');
  const [saving, setSaving] = useState(false);

  const estadoInfo = ESTADOS.find(s => s.key === orden.estado) || ESTADOS[0];
  const nextEstado = ESTADO_NEXT[orden.estado];
  const nextInfo = nextEstado ? ESTADOS.find(s => s.key === nextEstado) : null;

  const [repartidoresList, setRepartidoresList] = useState([]);

  useEffect(() => {
    const fetchRepartidores = async () => {
      try {
        const { data, error } = await supabase
          .from('repartidores')
          .select('*')
          .eq('activo', true)
          .order('nombre');
        if (error) throw error;
        setRepartidoresList(data || []);
      } catch (err) {
        console.error('Error fetching delivery drivers:', err);
      }
    };
    fetchRepartidores();
  }, []);

  const handleSaveRepartidor = async () => {
    setSaving(true);
    await onAsignarRepartidor(orden.id, repartidorNombre, repartidorTelefono, tiempoEst, notasC);
    setSaving(false);
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
        animation: 'fade-in 200ms ease',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: 24, width: '100%', maxWidth: 540,
        maxHeight: '90vh', overflow: 'auto',
        boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
        border: '1px solid var(--color-surface-3)',
        animation: 'slide-up 250ms cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid var(--color-surface-3)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
              Pedido #{orden.id.slice(-8).toUpperCase()}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <EstadoBadge estado={orden.estado} />
              <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>
                {formatTime(orden.created_at)} · hace {timeAgo(orden.created_at)}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: 10, border: '1px solid var(--color-surface-3)', background: 'var(--color-surface-2)', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted)', flexShrink: 0 }}
          >✕</button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Info del Cliente */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: 'var(--color-surface-2)', borderRadius: 14, padding: '12px 14px', border: '1px solid var(--color-surface-3)' }}>
              <p style={{ fontSize: 10, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Cliente</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-on-surface)' }}>{orden.clientes?.nombre || 'Cliente'}</p>
              <p style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 2 }}>📞 {orden.clientes?.telefono || '—'}</p>
            </div>
            <div style={{ background: 'var(--color-surface-2)', borderRadius: 14, padding: '12px 14px', border: '1px solid var(--color-surface-3)' }}>
              <p style={{ fontSize: 10, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Entrega</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-on-surface)' }}>
                {orden.tipo_entrega === 'delivery' ? '🛵 Delivery' : '🛍️ Recojo'}
              </p>
              {orden.direccion && <p style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 2, lineHeight: 1.4 }}>{orden.direccion.slice(0, 50)}{orden.direccion.length > 50 ? '…' : ''}</p>}
            </div>
          </div>

          {/* Items del Pedido */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 10 }}>🍽️ Detalle del Pedido</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(orden.detalles_orden || []).map((d, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 12px', background: 'var(--color-surface-2)', borderRadius: 10,
                  border: '1px solid var(--color-surface-3)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 900, background: 'var(--color-primary)', color: '#fff', width: 22, height: 22, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{d.cantidad}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-on-surface)' }}>{d.items_menu?.nombre || '—'}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary)' }}>
                    S/. {(d.precio_unitario * d.cantidad).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Totales */}
          <div style={{ background: 'var(--color-surface-2)', borderRadius: 14, padding: '14px 16px', border: '1px solid var(--color-surface-3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>Subtotal</span>
              <span style={{ fontSize: 12, fontWeight: 600 }}>S/. {(parseFloat(orden.total) - parseFloat(orden.costo_envio || 0)).toFixed(2)}</span>
            </div>
            {parseFloat(orden.costo_envio) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>Envío</span>
                <span style={{ fontSize: 12, fontWeight: 600 }}>S/. {parseFloat(orden.costo_envio).toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--color-surface-3)' }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-on-surface)' }}>TOTAL</span>
              <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 20, fontWeight: 900, color: 'var(--color-primary)' }}>S/. {parseFloat(orden.total).toFixed(2)}</span>
            </div>
            <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
              <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600 }}>{METODO_PAGO_LABEL[orden.metodo_pago] || orden.metodo_pago}</span>
            </div>
          </div>

          {/* Asignar Repartidor (solo si es delivery) */}
          {orden.tipo_entrega === 'delivery' && (
            <div style={{
              background: 'var(--color-surface-2)',
              borderRadius: 16,
              padding: '16px',
              border: '1px solid var(--color-surface-3)',
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', margin: 0 }}>🛵 Despacho & Repartidor</p>
                <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--color-primary)', background: 'rgba(27,67,50,0.1)', padding: '2px 8px', borderRadius: 999 }}>PRO</span>
              </div>

              {/* Selector de modo de despacho */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 6,
                background: 'var(--color-surface-3)',
                padding: 3,
                borderRadius: 10,
              }}>
                <button
                  type="button"
                  onClick={() => {
                    if (!repartidorNombre.includes('PedidosYa') && !repartidorNombre.includes('Rappi')) {
                      // mantener actual
                    } else {
                      setRepartidorNombre('');
                      setRepartidorTelefono('');
                    }
                  }}
                  style={{
                    padding: '6px',
                    borderRadius: 8,
                    border: 'none',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: (!repartidorNombre.startsWith('PedidosYa') && !repartidorNombre.startsWith('Rappi')) ? 'var(--color-surface)' : 'transparent',
                    color: (!repartidorNombre.startsWith('PedidosYa') && !repartidorNombre.startsWith('Rappi')) ? 'var(--color-on-surface)' : 'var(--color-muted)',
                    transition: 'all 0.15s',
                  }}
                >
                  🚶‍♂️ Flota Propia / Manual
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const randomId = Math.floor(100 + Math.random() * 900);
                    setRepartidorNombre(`PedidosYa Envíos (Rider #${randomId})`);
                    setRepartidorTelefono('+51988123456');
                    setTiempoEst('25');
                  }}
                  style={{
                    padding: '6px',
                    borderRadius: 8,
                    border: 'none',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: (repartidorNombre.startsWith('PedidosYa') || repartidorNombre.startsWith('Rappi')) ? 'var(--color-surface)' : 'transparent',
                    color: (repartidorNombre.startsWith('PedidosYa') || repartidorNombre.startsWith('Rappi')) ? 'var(--color-primary)' : 'var(--color-muted)',
                    transition: 'all 0.15s',
                  }}
                >
                  ⚡ PedidosYa / Rappi
                </button>
              </div>

              {/* Contenido según el modo */}
              {!(repartidorNombre.startsWith('PedidosYa') || repartidorNombre.startsWith('Rappi')) ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {/* Selector rápido de repartidores comunes */}
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>Selección Rápida</label>
                    <select
                      onChange={e => {
                        const val = e.target.value;
                        const selectedRep = repartidoresList.find(r => r.id === val);
                        if (selectedRep) {
                          setRepartidorNombre(selectedRep.nombre);
                          setRepartidorTelefono(selectedRep.telefono);
                          setTiempoEst('30');
                        }
                      }}
                      className="input-field"
                      style={{ fontSize: 12, padding: '8px 10px', width: '100%', background: 'var(--color-surface)' }}
                    >
                      <option value="">-- Seleccionar repartidor frecuente --</option>
                      {repartidoresList.map(rep => (
                        <option key={rep.id} value={rep.id}>
                          🛵 {rep.nombre} ({rep.telefono})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>Nombre del Repartidor</label>
                      <input
                        type="text"
                        placeholder="Ej. Juan Pérez"
                        value={repartidorNombre}
                        onChange={e => setRepartidorNombre(e.target.value)}
                        className="input-field"
                        style={{ fontSize: 12, padding: '9px 12px', background: 'var(--color-surface)' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>Teléfono Celular</label>
                      <input
                        type="tel"
                        placeholder="+51 9xx xxx xxx"
                        value={repartidorTelefono}
                        onChange={e => setRepartidorTelefono(e.target.value)}
                        className="input-field"
                        style={{ fontSize: 12, padding: '9px 12px', background: 'var(--color-surface)' }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{
                  background: 'rgba(139,92,246,0.06)',
                  border: '1px dashed rgba(139,92,246,0.2)',
                  borderRadius: 12,
                  padding: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 20 }}>🚗</span>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-on-surface)', margin: 0 }}>PedidosYa Envíos Activo (Simulación)</p>
                      <p style={{ fontSize: 10, color: 'var(--color-muted)', margin: 0 }}>B2B Logistics API integration mockup</p>
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8, marginTop: 4 }}>
                    <button
                      type="button"
                      onClick={() => {
                        const riders = ['Juan Carlos (PedidosYa)', 'Rider Daniel (Rappi)', 'Esteban Soto (PedidosYa)', 'Diana Ramos (Rappi Cargo)'];
                        const selected = riders[Math.floor(Math.random() * riders.length)];
                        const randomPhone = '+519' + Math.floor(10000000 + Math.random() * 90000000);
                        const randomTime = Math.floor(15 + Math.random() * 30).toString();
                        
                        setRepartidorNombre(selected);
                        setRepartidorTelefono(randomPhone);
                        setTiempoEst(randomTime);
                      }}
                      style={{
                        background: '#e21b3c', // Rojo PedidosYa
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        padding: '8px',
                        fontSize: 11,
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6
                      }}
                    >
                      🔄 Re-cotizar y Solicitar Motorizado
                    </button>
                    <div style={{
                      background: 'var(--color-surface)',
                      borderRadius: 8,
                      border: '1px solid var(--color-surface-3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 10,
                      fontWeight: 700,
                      color: 'var(--color-primary)'
                    }}>
                      S/. 7.90 est.
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>Tiempo Estimado (min)</label>
                <input
                  type="number"
                  placeholder="Ej. 35"
                  value={tiempoEst}
                  onChange={e => setTiempoEst(e.target.value)}
                  className="input-field"
                  style={{ fontSize: 12, padding: '9px 12px', background: 'var(--color-surface)' }}
                />
              </div>
            </div>
          )}

          {/* Notas de cocina */}
          <div>
            <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>📋 Notas de Cocina</label>
            <textarea
              placeholder="Instrucciones especiales, alergias, etc."
              value={notasC}
              onChange={e => setNotasC(e.target.value)}
              className="input-field"
              rows={2}
              style={{ fontSize: 12, padding: '9px 12px', resize: 'vertical' }}
            />
          </div>

          {/* Botón guardar cambios */}
          <button
            onClick={handleSaveRepartidor}
            disabled={saving}
            style={{
              background: 'var(--color-primary)', color: '#fff', border: 'none',
              borderRadius: 14, padding: '12px', fontSize: 13, fontWeight: 700,
              cursor: 'pointer', transition: 'opacity 0.2s',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Guardando...' : '💾 Guardar Datos Repartidor'}
          </button>

          {/* Acciones de cambio de estado */}
          {orden.estado !== 'entregado' && orden.estado !== 'cancelado' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase' }}>⚡ Avanzar Estado</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {nextInfo && (
                  <button
                    onClick={() => { onUpdateEstado(orden.id, nextEstado); onClose(); }}
                    style={{
                      flex: 1,
                      padding: '11px 16px',
                      background: nextInfo.color, color: '#fff',
                      border: 'none', borderRadius: 12, fontSize: 12, fontWeight: 800,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      transition: 'transform 0.15s',
                    }}
                    onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
                    onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    {nextInfo.emoji} Pasar a "{nextInfo.label}"
                  </button>
                )}
                <button
                  onClick={() => { onUpdateEstado(orden.id, 'cancelado'); onClose(); }}
                  style={{
                    padding: '11px 16px',
                    background: 'rgba(239,68,68,0.1)', color: '#EF4444',
                    border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, fontSize: 12, fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  ❌ Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────── TARJETA DE ORDEN ─── */
function OrdenCard({ orden, onSelect, onUpdateEstado }) {
  const estadoInfo = ESTADOS.find(s => s.key === orden.estado) || ESTADOS[0];
  const nextEstado = ESTADO_NEXT[orden.estado];
  const nextInfo = nextEstado ? ESTADOS.find(s => s.key === nextEstado) : null;
  const isNew = (Date.now() - new Date(orden.created_at)) < 120000; // < 2 min = "nueva"

  return (
    <div
      style={{
        background: 'var(--color-surface)',
        border: `1.5px solid ${isNew && orden.estado === 'pendiente' ? estadoInfo.border : 'var(--color-surface-3)'}`,
        borderRadius: 16,
        padding: '14px',
        cursor: 'pointer',
        transition: 'transform 0.15s, box-shadow 0.15s',
        position: 'relative',
        overflow: 'hidden',
        animation: isNew ? 'pulse-border 2s infinite' : 'none',
      }}
      onClick={() => onSelect(orden)}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      {/* Franja de color superior */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: estadoInfo.color, borderRadius: '16px 16px 0 0' }} />

      {/* Header de la card */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 900, color: 'var(--color-muted)', letterSpacing: '0.04em' }}>
            #{orden.id.slice(-6).toUpperCase()}
          </p>
          <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-on-surface)', marginTop: 2 }}>
            {orden.clientes?.nombre || 'Cliente'}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 16, fontWeight: 900, color: 'var(--color-primary)' }}>
            S/. {parseFloat(orden.total).toFixed(2)}
          </p>
          <p style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: 2 }}>
            {formatTime(orden.created_at)} · {timeAgo(orden.created_at)} atrás
          </p>
        </div>
      </div>

      {/* Tipo de entrega + items */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
          background: orden.tipo_entrega === 'delivery' ? 'rgba(139,92,246,0.12)' : 'rgba(27,67,50,0.08)',
          color: orden.tipo_entrega === 'delivery' ? '#8B5CF6' : '#1B4332',
          border: `1px solid ${orden.tipo_entrega === 'delivery' ? 'rgba(139,92,246,0.25)' : 'rgba(27,67,50,0.15)'}`,
        }}>
          {orden.tipo_entrega === 'delivery' ? '🛵 Delivery' : '🛍️ Recojo'}
        </span>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
          background: 'var(--color-surface-2)', color: 'var(--color-muted)',
          border: '1px solid var(--color-surface-3)',
        }}>
          {(orden.detalles_orden || []).reduce((s, d) => s + d.cantidad, 0)} items
        </span>
        {orden.repartidor_nombre && (
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
            background: 'rgba(16,185,129,0.1)', color: '#10B981',
            border: '1px solid rgba(16,185,129,0.25)',
          }}>
            🛵 {orden.repartidor_nombre}
          </span>
        )}
        {orden.tiempo_estimado_minutos && (
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
            background: 'rgba(59,130,246,0.1)', color: '#3B82F6',
            border: '1px solid rgba(59,130,246,0.25)',
          }}>
            ⏱ {orden.tiempo_estimado_minutos}min
          </span>
        )}
      </div>

      {/* Botón de avance rápido */}
      {nextInfo && orden.estado !== 'cancelado' && (
        <button
          onClick={e => { e.stopPropagation(); onUpdateEstado(orden.id, nextEstado); }}
          style={{
            width: '100%', padding: '8px',
            background: nextInfo.bg, color: nextInfo.color,
            border: `1px solid ${nextInfo.border}`, borderRadius: 10, fontSize: 11, fontWeight: 800,
            cursor: 'pointer', transition: 'transform 0.1s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          }}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          {nextInfo.emoji} {nextInfo.label}
        </button>
      )}
    </div>
  );
}

/* ─────────────────────────────── COMPONENTE PRINCIPAL ─── */
export default function DashboardOrdenes() {
  const { activeRestaurant } = useAuth();
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [selectedOrden, setSelectedOrden] = useState(null);
  const [filterEstado, setFilterEstado] = useState('activas'); // 'activas' | 'todas' | key de estado
  const [searchQ, setSearchQ] = useState('');
  const [liveCount, setLiveCount] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const prevCountRef = useRef(0);
  const channelRef = useRef(null);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  /* ── Carga de órdenes con joins ── */
  const fetchOrdenes = useCallback(async () => {
    if (!activeRestaurant?.id) return;
    try {
      const { data, error } = await supabase
        .from('ordenes')
        .select(`
          *,
          clientes (id, nombre, telefono),
          detalles_orden (
            id, cantidad, precio_unitario,
            items_menu (id, nombre)
          )
        `)
        .eq('restaurante_id', activeRestaurant.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setOrdenes(data || []);

      // Contar pendientes para notificación
      const pending = (data || []).filter(o => o.estado === 'pendiente').length;
      if (pending > prevCountRef.current && prevCountRef.current !== 0) {
        playNotif();
        showToast(`🔔 ${pending - prevCountRef.current} nuevo(s) pedido(s)!`, 'info');
      }
      prevCountRef.current = pending;
      setLiveCount(pending);
    } catch (err) {
      console.error('Error cargando órdenes:', err);
    } finally {
      setLoading(false);
    }
  }, [activeRestaurant, showToast]);

  /* ── Supabase Realtime ── */
  useEffect(() => {
    if (!activeRestaurant?.id) return;
    fetchOrdenes();

    const channel = supabase
      .channel(`ordenes-${activeRestaurant.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ordenes',
          filter: `restaurante_id=eq.${activeRestaurant.id}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            // Refetch completo para tener los joins
            await fetchOrdenes();
          } else if (payload.eventType === 'DELETE') {
            setOrdenes(prev => prev.filter(o => o.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [activeRestaurant, fetchOrdenes]);

  /* ── Actualizar estado de una orden ── */
  const handleUpdateEstado = useCallback(async (ordenId, nuevoEstado) => {
    try {
      const { error } = await supabase
        .from('ordenes')
        .update({ estado: nuevoEstado })
        .eq('id', ordenId);
      if (error) throw error;

      setOrdenes(prev => prev.map(o => o.id === ordenId ? { ...o, estado: nuevoEstado } : o));
      const info = ESTADOS.find(s => s.key === nuevoEstado);
      showToast(`${info?.emoji} Orden actualizada: ${info?.label}`);
      if (navigator.vibrate) navigator.vibrate([10, 20, 10]);
    } catch (err) {
      console.error(err);
      showToast('Error actualizando estado', 'error');
    }
  }, [showToast]);

  /* ── Asignar repartidor ── */
  const handleAsignarRepartidor = useCallback(async (ordenId, nombre, telefono, tiempoEst, notas) => {
    try {
      const updates = {
        repartidor_nombre: nombre || null,
        repartidor_telefono: telefono || null,
        tiempo_estimado_minutos: tiempoEst ? parseInt(tiempoEst) : null,
        notas_cocina: notas || null,
      };
      const { error } = await supabase
        .from('ordenes')
        .update(updates)
        .eq('id', ordenId);
      if (error) throw error;

      setOrdenes(prev => prev.map(o => o.id === ordenId ? { ...o, ...updates } : o));
      showToast('✅ Datos del repartidor guardados');
    } catch (err) {
      console.error(err);
      showToast('Error guardando datos del repartidor', 'error');
    }
  }, [showToast]);

  /* ── Filtrado ── */
  const ACTIVAS = ['pendiente', 'en_cocina', 'listo', 'en_camino'];
  const ordenesFiltradas = ordenes.filter(o => {
    const matchEstado = filterEstado === 'todas'
      ? true
      : filterEstado === 'activas'
        ? ACTIVAS.includes(o.estado)
        : o.estado === filterEstado;
    const matchSearch = !searchQ
      ? true
      : (o.clientes?.nombre || '').toLowerCase().includes(searchQ.toLowerCase())
        || o.id.toLowerCase().includes(searchQ.toLowerCase())
        || (o.clientes?.telefono || '').includes(searchQ);
    return matchEstado && matchSearch;
  });

  /* ── Stats rápidas ── */
  const stats = {
    pendiente: ordenes.filter(o => o.estado === 'pendiente').length,
    en_cocina: ordenes.filter(o => o.estado === 'en_cocina').length,
    listo:     ordenes.filter(o => o.estado === 'listo').length,
    en_camino: ordenes.filter(o => o.estado === 'en_camino').length,
    entregado: ordenes.filter(o => o.estado === 'entregado').length,
    total_hoy: ordenes.filter(o => {
      const d = new Date(o.created_at);
      const today = new Date();
      return d.toDateString() === today.toDateString();
    }).length,
    revenue_hoy: ordenes
      .filter(o => {
        const d = new Date(o.created_at);
        const today = new Date();
        return d.toDateString() === today.toDateString() && o.estado !== 'cancelado';
      })
      .reduce((s, o) => s + parseFloat(o.total || 0), 0),
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Encabezado con indicador de live ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 10, height: 10, borderRadius: '50%', background: '#10B981',
            boxShadow: '0 0 0 4px rgba(16,185,129,0.2)',
            animation: 'pulse-live 1.5s infinite ease-in-out',
          }} />
          <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-on-surface)' }}>
            Sistema Activo — Actualizaciones en Tiempo Real
          </p>
        </div>
        {liveCount > 0 && (
          <span style={{
            background: '#EF4444', color: '#fff',
            fontSize: 12, fontWeight: 900, padding: '4px 12px', borderRadius: 999,
            animation: 'pulse-badge 1s infinite alternate',
          }}>
            🔔 {liveCount} pendiente{liveCount > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* ── Info de Ayuda Desplegable ── */}
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-surface-3)',
        borderRadius: 16,
        padding: showInfo ? '16px 20px' : '10px 16px',
        transition: 'all 0.2s ease',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setShowInfo(!showInfo)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>ℹ️</span>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-on-surface)', margin: 0 }}>¿Cómo funciona el módulo de Órdenes Live?</p>
          </div>
          <span style={{ color: 'var(--color-primary)', fontWeight: 800, fontSize: 12, userSelect: 'none' }}>
            {showInfo ? 'Ocultar info ▴' : 'Saber más ▾'}
          </span>
        </div>
        {showInfo && (
          <div style={{ marginTop: 12, fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.5, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={{ margin: 0 }}>Este panel está optimizado para el <strong>Administrador o Cajero</strong> de la sucursal activa:</p>
            <ul style={{ paddingLeft: 20, margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <li><strong>Monitoreo general:</strong> Visualiza ingresos en tiempo real, volumen de ventas diarias y estado actual de los repartos.</li>
              <li><strong>Logística de Delivery:</strong> Abre cualquier pedido para asignar motorizados (flota propia o simulación de APIs B2B de <em>PedidosYa Envíos</em> y <em>Rappi</em>).</li>
              <li><strong>Gestión de Estados:</strong> Supervisa y actualiza los pedidos desde la fase inicial de pago hasta la entrega física final.</li>
            </ul>
          </div>
        )}
      </div>

      {/* ── Stats rápidas ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
        {[
          { label: 'Hoy', value: stats.total_hoy, emoji: '📊', color: '#1B4332' },
          { label: 'Ingresos Hoy', value: `S/. ${stats.revenue_hoy.toFixed(0)}`, emoji: '💰', color: '#40916C' },
          { label: 'Pendientes', value: stats.pendiente, emoji: '🔔', color: '#F59E0B' },
          { label: 'En Cocina', value: stats.en_cocina, emoji: '👨‍🍳', color: '#3B82F6' },
          { label: 'En Camino', value: stats.en_camino, emoji: '🛵', color: '#8B5CF6' },
          { label: 'Entregados', value: stats.entregado, emoji: '✅', color: '#10B981' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-surface-3)',
            borderRadius: 14, padding: '12px 14px',
            display: 'flex', flexDirection: 'column', gap: 4,
          }}>
            <span style={{ fontSize: 18 }}>{s.emoji}</span>
            <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 20, fontWeight: 900, color: s.color }}>{s.value}</p>
            <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Filtros ── */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Buscar */}
        <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 280 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--color-muted)', pointerEvents: 'none' }}>🔍</span>
          <input
            type="text"
            placeholder="Buscar cliente, pedido..."
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            className="input-field"
            style={{ paddingLeft: 36, fontSize: 12, padding: '9px 12px 9px 36px' }}
          />
        </div>

        {/* Tabs de estado */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { key: 'activas', label: '⚡ Activas', count: ordenes.filter(o => ACTIVAS.includes(o.estado)).length },
            { key: 'todas', label: '📋 Todas' },
            ...ESTADOS.slice(0, 4).map(e => ({ key: e.key, label: `${e.emoji} ${e.label}`, count: ordenes.filter(o => o.estado === e.key).length })),
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilterEstado(f.key)}
              style={{
                padding: '6px 12px',
                borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700,
                background: filterEstado === f.key ? 'var(--color-primary)' : 'var(--color-surface)',
                color: filterEstado === f.key ? '#fff' : 'var(--color-muted)',
                border: filterEstado === f.key ? 'none' : '1px solid var(--color-surface-3)',
                transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', gap: 5,
              }}
            >
              {f.label}
              {f.count !== undefined && f.count > 0 && (
                <span style={{
                  fontSize: 9, fontWeight: 900, background: filterEstado === f.key ? 'rgba(255,255,255,0.3)' : 'var(--color-primary)',
                  color: '#fff', borderRadius: 999, padding: '1px 6px', minWidth: 16,
                }}>{f.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Grid de Órdenes ── */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="skeleton" style={{ height: 160, borderRadius: 16 }} />
          ))}
        </div>
      ) : ordenesFiltradas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-muted)' }}>
          <p style={{ fontSize: 48, marginBottom: 12 }}>🛵</p>
          <p style={{ fontSize: 16, fontWeight: 700 }}>
            {searchQ ? 'No se encontraron resultados' : 'Sin pedidos activos'}
          </p>
          <p style={{ fontSize: 12, marginTop: 4 }}>
            {searchQ ? 'Intenta con otro término de búsqueda' : 'Los nuevos pedidos aparecerán aquí automáticamente'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {ordenesFiltradas.map(orden => (
            <OrdenCard
              key={orden.id}
              orden={orden}
              onSelect={setSelectedOrden}
              onUpdateEstado={handleUpdateEstado}
            />
          ))}
        </div>
      )}

      {/* ── Modal de detalle ── */}
      {selectedOrden && (
        <OrdenModal
          orden={ordenes.find(o => o.id === selectedOrden.id) || selectedOrden}
          onClose={() => setSelectedOrden(null)}
          onUpdateEstado={handleUpdateEstado}
          onAsignarRepartidor={handleAsignarRepartidor}
        />
      )}

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 30, left: '50%', transform: 'translateX(-50%)',
          background: toast.type === 'error' ? '#EF4444' : toast.type === 'info' ? '#3B82F6' : '#1B4332',
          color: '#fff', padding: '12px 24px', borderRadius: 999, fontSize: 13, fontWeight: 700,
          zIndex: 2000, whiteSpace: 'nowrap', boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          animation: 'toast-in 250ms ease',
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
