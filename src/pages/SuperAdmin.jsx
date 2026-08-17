import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth, useRouter } from '../router';
import { NICHOS_CONFIG } from '../config/nichosConfig';

const ALL_MODULES = [
  { id: 'pedidos', nombre: 'Pedidos & QR', icon: '📱' },
  { id: 'carta', nombre: 'Carta Digital', icon: '📋' },
  { id: 'inventario', nombre: 'Inventario', icon: '📦' },
  { id: 'fidelizacion', nombre: 'Puntos & CRM', icon: '🎁' },
  { id: 'delivery', nombre: 'Delivery', icon: '🛵' },
  { id: 'marketing', nombre: 'Marketing IA', icon: '⚡' },
  { id: 'reservas', nombre: 'Salón & Mesas', icon: '🪑' },
  { id: 'finanzas', nombre: 'Caja & Finanzas', icon: '💵' },
  { id: 'metricas', nombre: 'Métricas', icon: '📊' },
  { id: 'modulos', nombre: 'Módulos SaaS', icon: '🧩' },
];

export default function SuperAdmin() {
  const { navigate } = useRouter();
  const [activeTab, setActiveTab] = useState('solicitudes'); // 'solicitudes', 'restaurantes'
  const [solicitudes, setSolicitudes] = useState([]);
  const [restaurantes, setRestaurantes] = useState([]);
  const [modulosMap, setModulosMap] = useState({}); // { [restauranteId_modulo]: boolean }
  const [loading, setLoading] = useState(true);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch solicitudes de activación
      const { data: solData } = await supabase
        .from('solicitudes_activacion')
        .select('*, restaurantes(nombre, slug)')
        .order('created_at', { ascending: false });

      if (solData) setSolicitudes(solData);

      // 2. Fetch todos los restaurantes
      const { data: resData } = await supabase
        .from('restaurantes')
        .select('*')
        .order('nombre');

      if (resData) setRestaurantes(resData);

      // 3. Fetch todos los módulos activos
      const { data: modData } = await supabase
        .from('restaurante_modulos')
        .select('*');

      const map = {};
      if (modData) {
        modData.forEach(m => {
          map[`${m.restaurante_id}_${m.modulo}`] = m.activo;
        });
      }
      setModulosMap(map);

    } catch (err) {
      console.error('Error al cargar datos de superadmin:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAprobarSolicitud = async (sol) => {
    setActionLoading(prev => ({ ...prev, [sol.id]: true }));
    try {
      // 1. Marcar la solicitud como aprobada
      await supabase
        .from('solicitudes_activacion')
        .update({ estado: 'aprobado', updated_at: new Date() })
        .eq('id', sol.id);

      // 2. Habilitar o insertar el módulo en restaurante_modulos
      const { data: existing } = await supabase
        .from('restaurante_modulos')
        .select('*')
        .eq('restaurante_id', sol.restaurante_id)
        .eq('modulo', sol.modulo)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('restaurante_modulos')
          .update({ activo: true, updated_at: new Date() })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('restaurante_modulos')
          .insert({
            restaurante_id: sol.restaurante_id,
            modulo: sol.modulo,
            activo: true
          });
      }

      fetchData();
    } catch (err) {
      console.error('Error al aprobar solicitud:', err);
      alert('Error al aprobar la solicitud');
    } finally {
      setActionLoading(prev => ({ ...prev, [sol.id]: false }));
    }
  };

  const handleRechazarSolicitud = async (sol) => {
    const razon = prompt('Ingresa el motivo del rechazo (ej. Pago no figura en cuenta):');
    if (razon === null) return;

    setActionLoading(prev => ({ ...prev, [sol.id]: true }));
    try {
      await supabase
        .from('solicitudes_activacion')
        .update({ estado: 'rechazado', notas_admin: razon, updated_at: new Date() })
        .eq('id', sol.id);

      fetchData();
    } catch (err) {
      console.error('Error al rechazar solicitud:', err);
    } finally {
      setActionLoading(prev => ({ ...prev, [sol.id]: false }));
    }
  };

  const handleToggleModulo = async (restauranteId, moduloKey, currentActive) => {
    const nextState = !currentActive;
    const key = `${restauranteId}_${moduloKey}`;
    setModulosMap(prev => ({ ...prev, [key]: nextState }));

    try {
      const { data: existing } = await supabase
        .from('restaurante_modulos')
        .select('*')
        .eq('restaurante_id', restauranteId)
        .eq('modulo', moduloKey)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('restaurante_modulos')
          .update({ activo: nextState, updated_at: new Date() })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('restaurante_modulos')
          .insert({
            restaurante_id: restauranteId,
            modulo: moduloKey,
            activo: nextState
          });
      }
    } catch (err) {
      console.error('Error al cambiar estado de módulo:', err);
      // Rollback UI
      setModulosMap(prev => ({ ...prev, [key]: currentActive }));
    }
  };

  const filteredRestaurantes = restaurantes.filter(r => 
    r.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.slug && r.slug.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div style={{ minHeight: '100vh', background: '#090F0C', color: '#E2E8F0', paddingBottom: 60 }}>
      {/* Header Mobile-First */}
      <header style={{
        background: '#111C16', borderBottom: '1px solid #1E2E25',
        padding: '16px 20px', sticky: 'top', top: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#090F0C', fontSize: 18 }}>
            👑
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 16, fontWeight: 900, fontFamily: 'Outfit, sans-serif', color: '#F8FAFC' }}>
              Super Admin SaaS
            </h1>
            <p style={{ margin: 0, fontSize: 11, color: '#10B981', fontWeight: 700 }}>
              Control Global de Módulos & Pagos Perú
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/dashboard')}
          style={{ background: '#1E2E25', border: 'none', color: '#94A3B8', padding: '8px 14px', borderRadius: 12, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
        >
          ← Regresar al Dashboard
        </button>
      </header>

      {/* Tabs bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid #1E2E25', background: '#0D1712' }}>
        <button
          onClick={() => setActiveTab('solicitudes')}
          style={{
            flex: 1, padding: '14px', border: 'none', background: 'none',
            color: activeTab === 'solicitudes' ? '#10B981' : '#64748B',
            fontWeight: 800, fontSize: 13, borderBottom: activeTab === 'solicitudes' ? '2.5px solid #10B981' : '2.5px solid transparent',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
          }}
        >
          💳 Solicitudes de Pago ({solicitudes.filter(s => s.estado === 'pendiente').length})
        </button>
        <button
          onClick={() => setActiveTab('restaurantes')}
          style={{
            flex: 1, padding: '14px', border: 'none', background: 'none',
            color: activeTab === 'restaurantes' ? '#10B981' : '#64748B',
            fontWeight: 800, fontSize: 13, borderBottom: activeTab === 'restaurantes' ? '2.5px solid #10B981' : '2.5px solid transparent',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
          }}
        >
          🏢 Gestión por Restaurante ({restaurantes.length})
        </button>
      </div>

      <div style={{ maxWidth: 800, margin: '20px auto', padding: '0 16px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#64748B' }}>Cargando datos del sistema...</div>
        ) : activeTab === 'solicitudes' ? (
          /* TAB 1: SOLICITUDES DE PAGO MANUAL (YAPE/PLIN) */
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 16px', color: '#F8FAFC' }}>
              Comprobantes de Pago por Verificar
            </h2>

            {solicitudes.length === 0 ? (
              <div style={{ background: '#111C16', borderRadius: 16, padding: 32, textAlign: 'center', color: '#64748B', border: '1px solid #1E2E25' }}>
                No hay solicitudes de pago registradas.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {solicitudes.map(sol => (
                  <div key={sol.id} style={{
                    background: '#111C16', border: `1.5px solid ${sol.estado === 'pendiente' ? '#F59E0B60' : sol.estado === 'aprobado' ? '#10B98140' : '#EF444440'}`,
                    borderRadius: 18, padding: 16, display: 'flex', flexDirection: 'column', gap: 12
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 900, color: '#F8FAFC' }}>
                          {sol.restaurantes?.nombre || 'Restaurante Desconocido'}
                        </div>
                        <div style={{ fontSize: 12, color: '#10B981', fontWeight: 800, marginTop: 2 }}>
                          Módulo: {ALL_MODULES.find(m => m.id === sol.modulo)?.nombre || sol.modulo} (S/ {parseFloat(sol.monto).toFixed(2)})
                        </div>
                      </div>

                      <span style={{
                        background: sol.estado === 'pendiente' ? '#F59E0B20' : sol.estado === 'aprobado' ? '#10B98120' : '#EF444420',
                        color: sol.estado === 'pendiente' ? '#F59E0B' : sol.estado === 'aprobado' ? '#10B981' : '#EF4444',
                        padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 800, textTransform: 'uppercase'
                      }}>
                        {sol.estado}
                      </span>
                    </div>

                    <div style={{ background: '#0B130E', borderRadius: 12, padding: 12, fontSize: 12.5, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div>
                        <span style={{ color: '#64748B', display: 'block', fontSize: 11 }}>Método:</span>
                        <strong style={{ color: '#E2E8F0', textTransform: 'uppercase' }}>{sol.metodo_pago}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748B', display: 'block', fontSize: 11 }}>Nº Operación:</span>
                        <strong style={{ color: '#38BDF8', fontFamily: 'monospace', fontSize: 13 }}>{sol.numero_operacion || 'Sin número'}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748B', display: 'block', fontSize: 11 }}>Titular:</span>
                        <span style={{ color: '#E2E8F0' }}>{sol.titular_origen || 'No especificado'}</span>
                      </div>
                      <div>
                        <span style={{ color: '#64748B', display: 'block', fontSize: 11 }}>Fecha:</span>
                        <span style={{ color: '#E2E8F0' }}>{new Date(sol.created_at).toLocaleDateString()} {new Date(sol.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    {/* Voucher preview image if available */}
                    {sol.voucher_url && (
                      <button
                        onClick={() => setSelectedVoucher(sol.voucher_url)}
                        style={{
                          background: '#1E2E25', border: 'none', color: '#10B981',
                          padding: '10px', borderRadius: 12, fontSize: 12, fontWeight: 800,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                        }}
                      >
                        🖼️ Ver Voucher Adjunto
                      </button>
                    )}

                    {sol.notas_admin && (
                      <div style={{ fontSize: 12, color: '#EF4444', fontStyle: 'italic' }}>
                        Motivo rechazo: {sol.notas_admin}
                      </div>
                    )}

                    {/* Action buttons if pending */}
                    {sol.estado === 'pendiente' && (
                      <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                        <button
                          onClick={() => handleAprobarSolicitud(sol)}
                          disabled={actionLoading[sol.id]}
                          style={{
                            flex: 1, padding: '12px', borderRadius: 12,
                            background: '#10B981', border: 'none', color: '#ffffff',
                            fontSize: 13, fontWeight: 900, cursor: 'pointer'
                          }}
                        >
                          ✓ Aprobar y Activar Módulo
                        </button>
                        <button
                          onClick={() => handleRechazarSolicitud(sol)}
                          disabled={actionLoading[sol.id]}
                          style={{
                            padding: '12px 18px', borderRadius: 12,
                            background: '#EF444420', border: '1px solid #EF444440', color: '#EF4444',
                            fontSize: 13, fontWeight: 800, cursor: 'pointer'
                          }}
                        >
                          ✕ Rechazar
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* TAB 2: GESTIÓN DIRECTA DE MÓDULOS POR RESTAURANTE */
          <div>
            <div style={{ marginBottom: 16 }}>
              <input
                type="text"
                placeholder="🔍 Buscar restaurante por nombre o slug..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: 14,
                  background: '#111C16', border: '1.5px solid #1E2E25',
                  color: '#F8FAFC', fontSize: 14, outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {filteredRestaurantes.map(res => (
                <div key={res.id} style={{
                  background: '#111C16', border: '1px solid #1E2E25',
                  borderRadius: 20, padding: 18
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#F8FAFC', fontFamily: 'Outfit, sans-serif' }}>
                        {res.nombre}
                      </h3>
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748B' }}>
                        Slug: <code style={{ color: '#10B981' }}>/{res.slug || res.id.slice(0, 8)}</code>
                      </p>
                    </div>

                    {/* Selector rápido de Nicho Preset en SuperAdmin */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, color: '#64748B', fontWeight: 700 }}>Nicho:</span>
                      <select
                        value={res.nicho_preset || 'plant_based'}
                        onChange={async (e) => {
                          const val = e.target.value;
                          const presetCfg = NICHOS_CONFIG[val] || NICHOS_CONFIG.plant_based;
                          
                          setRestaurantes(prev => prev.map(r => r.id === res.id ? { 
                            ...r, 
                            nicho_preset: val,
                            color_primario: presetCfg.paletaRecomendada.primary,
                            color_secundario: presetCfg.paletaRecomendada.secondary 
                          } : r));

                          const activeSavedId = localStorage.getItem('suna_active_restaurant');
                          if (res.id === activeSavedId || !activeSavedId) {
                            document.documentElement.style.setProperty('--color-primary', presetCfg.paletaRecomendada.primary, 'important');
                            document.documentElement.style.setProperty('--color-secondary', presetCfg.paletaRecomendada.secondary, 'important');
                          }

                          try {
                            const { error } = await supabase.from('restaurantes').update({ 
                              nicho_preset: val,
                              color_primario: presetCfg.paletaRecomendada.primary,
                              color_secundario: presetCfg.paletaRecomendada.secondary
                            }).eq('id', res.id);
                            if (error) throw error;
                          } catch (err) {
                            console.error("Error al actualizar nicho en SuperAdmin:", err);
                          }
                        }}
                        style={{
                          background: '#0B130E', color: '#10B981', border: '1px solid #1E2E25',
                          borderRadius: 8, padding: '4px 8px', fontSize: 12, fontWeight: 800, outline: 'none'
                        }}
                      >
                        {Object.values(NICHOS_CONFIG).map(n => (
                          <option key={n.id} value={n.id}>{n.nombre}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ fontSize: 12, fontWeight: 800, color: '#94A3B8', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Módulos Contratados:
                  </div>

                  {/* Grid de Interruptores Táctiles para Módulos */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
                    {ALL_MODULES.map(mod => {
                      const hasRecord = modulosMap[`${res.id}_${mod.id}`] !== undefined;
                      const isActivo = hasRecord ? modulosMap[`${res.id}_${mod.id}`] : true;

                      return (
                        <button
                          key={mod.id}
                          onClick={() => handleToggleModulo(res.id, mod.id, isActivo)}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '10px 12px', borderRadius: 14,
                            background: isActivo ? '#10B98118' : '#0B130E',
                            border: `1.5px solid ${isActivo ? '#10B98150' : '#1E2E25'}`,
                            cursor: 'pointer', transition: 'all 150ms'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                            <span>{mod.icon}</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: isActivo ? '#F8FAFC' : '#64748B', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                              {mod.nombre}
                            </span>
                          </div>

                          {/* Toggle visual switch */}
                          <div style={{
                            width: 32, height: 18, borderRadius: 9,
                            background: isActivo ? '#10B981' : '#334155',
                            position: 'relative', transition: 'background 200ms', flexShrink: 0
                          }}>
                            <div style={{
                              width: 14, height: 14, borderRadius: '50%', background: '#fff',
                              position: 'absolute', top: 2, left: isActivo ? 16 : 2,
                              transition: 'left 200ms cubic-bezier(0.4, 0, 0.2, 1)'
                            }} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal Zoom del Voucher */}
      {selectedVoucher && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }} onClick={() => setSelectedVoucher(null)}>
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <img src={selectedVoucher} alt="Voucher Full" style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: 16, border: '2px solid #1E2E25' }} />
            <button
              onClick={() => setSelectedVoucher(null)}
              style={{
                position: 'absolute', top: -16, right: -16, width: 36, height: 36,
                borderRadius: '50%', background: '#EF4444', border: 'none', color: '#fff',
                fontWeight: 900, cursor: 'pointer', fontSize: 16
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
