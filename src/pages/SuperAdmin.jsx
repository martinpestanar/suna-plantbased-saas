import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth, useRouter, useTheme } from '../router';
import { NICHOS_CONFIG } from '../config/nichosConfig';

export const ALL_MODULES = [
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

// Presets estratégicos de activación
export const PRESETS = {
  DIGITAL: {
    name: 'Solo Digital (WhatsApp & Growth)',
    desc: 'Bot WhatsApp, Menú digital, Campañas masivas, Audiencias CRM, Premios y Despachos. Sin tocar salón físico.',
    activeIds: ['pedidos', 'carta', 'fidelizacion', 'marketing', 'delivery', 'metricas', 'modulos'],
    inactiveIds: ['inventario', 'reservas', 'finanzas']
  },
  COMPLETO: {
    name: 'Plan Completo (Físico + Digital)',
    desc: 'Todos los módulos habilitados incluyendo Salón, Mesas, Mozos, Caja Chica e Inventario de Insumos.',
    activeIds: ALL_MODULES.map(m => m.id),
    inactiveIds: []
  }
};

export default function SuperAdmin() {
  const { navigate } = useRouter();
  const { selectRestaurant } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  // Paleta dinámica Light (Default) / Dark
  const c = {
    bg: isDark ? '#070C09' : '#F6F9F6',
    headerBg: isDark ? '#0E1712' : '#FFFFFF',
    cardBg: isDark ? '#0E1712' : '#FFFFFF',
    innerBg: isDark ? '#070C09' : '#F1F5F2',
    border: isDark ? '#1E2E25' : '#E2EBE5',
    borderStrong: isDark ? '#23372C' : '#CBDAD1',
    text: isDark ? '#F8FAFC' : '#0F172A',
    textMuted: isDark ? '#94A3B8' : '#64748B',
    primary: '#10B981',
    primaryDark: '#059669',
    primaryLight: isDark ? '#10B98118' : '#ECFDF5',
    primaryBorder: isDark ? '#10B98140' : '#A7F3D0',
    primaryText: isDark ? '#34D399' : '#059669',
    tabsBg: isDark ? '#0B130E' : '#FFFFFF',
    inputBg: isDark ? '#070C09' : '#FFFFFF',
    inputBorder: isDark ? '#1E2E25' : '#CBD5E1',
    cardShadow: isDark ? '0 4px 20px rgba(0,0,0,0.35)' : '0 4px 20px rgba(16, 185, 129, 0.06)',
    btnSecondaryBg: isDark ? '#16241C' : '#F1F5F2',
    btnSecondaryBorder: isDark ? '#1E2E25' : '#E2E8F0',
    btnSecondaryText: isDark ? '#94A3B8' : '#475569',
  };

  const [activeTab, setActiveTab] = useState('restaurantes'); // 'restaurantes', 'solicitudes'
  const [solicitudes, setSolicitudes] = useState([]);
  const [restaurantes, setRestaurantes] = useState([]);
  const [modulosMap, setModulosMap] = useState({}); // { [restauranteId_modulo]: boolean }
  const [loading, setLoading] = useState(true);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  // Modal Nuevo Restaurante
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newRes, setNewRes] = useState({
    nombre: '',
    slug: '',
    telefono: '',
    direccion: '',
    nicho_preset: 'plant_based',
    modalidad: 'DIGITAL' // 'DIGITAL' | 'COMPLETO'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Solicitudes de activación
      const { data: solData } = await supabase
        .from('solicitudes_activacion')
        .select('*, restaurantes(nombre, slug)')
        .order('created_at', { ascending: false });

      if (solData) setSolicitudes(solData);

      // 2. Todos los restaurantes
      const { data: resData } = await supabase
        .from('restaurantes')
        .select('*')
        .order('nombre');

      if (resData) setRestaurantes(resData);

      // 3. Módulos activos
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
      await supabase
        .from('solicitudes_activacion')
        .update({ estado: 'aprobado', updated_at: new Date() })
        .eq('id', sol.id);

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
      setModulosMap(prev => ({ ...prev, [key]: currentActive }));
    }
  };

  // Aplicar preset en un solo toque
  const handleApplyPreset = async (restauranteId, presetKey) => {
    const preset = PRESETS[presetKey];
    if (!preset) return;

    const actionKey = `preset_${restauranteId}`;
    setActionLoading(prev => ({ ...prev, [actionKey]: true }));

    try {
      const updates = [];
      const newMapChanges = {};

      ALL_MODULES.forEach(mod => {
        const shouldBeActive = preset.activeIds.includes(mod.id);
        newMapChanges[`${restauranteId}_${mod.id}`] = shouldBeActive;
        updates.push({
          restaurante_id: restauranteId,
          modulo: mod.id,
          activo: shouldBeActive,
          updated_at: new Date()
        });
      });

      // Optimistic update
      setModulosMap(prev => ({ ...prev, ...newMapChanges }));

      // Upsert masivo a Supabase
      const { error } = await supabase
        .from('restaurante_modulos')
        .upsert(updates, { onConflict: 'restaurante_id, modulo' });

      if (error) throw error;
    } catch (err) {
      console.error('Error al aplicar preset:', err);
      alert('Error al aplicar el perfil de módulos');
      fetchData();
    } finally {
      setActionLoading(prev => ({ ...prev, [actionKey]: false }));
    }
  };

  // Crear Nuevo Restaurante
  const handleCreateRestaurant = async (e) => {
    e.preventDefault();
    if (!newRes.nombre.trim()) return alert('Por favor ingresa el nombre del restaurante');

    const cleanSlug = (newRes.slug || newRes.nombre)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    setCreating(true);
    try {
      const presetCfg = NICHOS_CONFIG[newRes.nicho_preset] || NICHOS_CONFIG.plant_based;

      // 1. Insertar Restaurante
      const { data: createdRes, error: resErr } = await supabase
        .from('restaurantes')
        .insert({
          nombre: newRes.nombre.trim(),
          slug: cleanSlug,
          telefono: newRes.telefono.trim() || null,
          direccion: newRes.direccion.trim() || null,
          nicho_preset: newRes.nicho_preset,
          color_primario: presetCfg.paletaRecomendada.primary,
          color_secundario: presetCfg.paletaRecomendada.secondary
        })
        .select()
        .single();

      if (resErr) throw resErr;

      // 2. Configurar módulos según modalidad elegida
      const selectedPreset = PRESETS[newRes.modalidad] || PRESETS.DIGITAL;
      const initialModules = ALL_MODULES.map(mod => ({
        restaurante_id: createdRes.id,
        modulo: mod.id,
        activo: selectedPreset.activeIds.includes(mod.id),
        updated_at: new Date()
      }));

      const { error: modErr } = await supabase
        .from('restaurante_modulos')
        .upsert(initialModules, { onConflict: 'restaurante_id, modulo' });

      if (modErr) {
        console.warn('Advertencia al insertar módulos iniciales:', modErr);
      }

      // Reset y recarga
      setNewRes({
        nombre: '',
        slug: '',
        telefono: '',
        direccion: '',
        nicho_preset: 'plant_based',
        modalidad: 'DIGITAL'
      });
      setShowCreateModal(false);
      await fetchData();

      const shouldConfigureNow = window.confirm(
        `✅ ¡Restaurante "${createdRes.nombre}" creado exitosamente!\n\n¿Deseas entrar al Dashboard de este restaurante ahora mismo para configurarle el menú, bot y ajustes desde cero?`
      );

      if (shouldConfigureNow && selectRestaurant) {
        selectRestaurant(createdRes);
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Error al crear restaurante:', err);
      alert('Error al crear restaurante: ' + (err.message || 'Verifica los campos'));
    } finally {
      setCreating(false);
    }
  };

  const filteredRestaurantes = restaurantes.filter(r => 
    r.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.slug && r.slug.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (r.telefono && r.telefono.includes(searchTerm))
  );

  return (
    <div style={{ minHeight: '100vh', background: c.bg, color: c.text, paddingBottom: 80, fontFamily: 'Plus Jakarta Sans, sans-serif', transition: 'background 200ms, color 200ms' }}>
      
      {/* ── HEADER MOBILE-FIRST STICKY ── */}
      <header style={{
        background: c.headerBg,
        borderBottom: `1px solid ${c.border}`,
        padding: '14px 16px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 2px 10px rgba(0,0,0,0.04)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #10B981, #059669)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            flexShrink: 0,
            boxShadow: '0 2px 10px rgba(16,185,129,0.3)'
          }}>
            👑
          </div>
          <div style={{ minWidth: 0 }}>
            <h1 style={{
              margin: 0,
              fontSize: 15,
              fontWeight: 900,
              fontFamily: 'Outfit, sans-serif',
              color: c.text,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              Super Admin SaaS
            </h1>
            <p style={{ margin: 0, fontSize: 11, color: c.primaryText, fontWeight: 700 }}>
              Gestión Multitenant & Activación
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Toggle Theme Light/Dark */}
          <button
            onClick={toggleTheme}
            title={isDark ? 'Cambiar a modo Claro (Light)' : 'Cambiar a modo Oscuro (Dark)'}
            style={{
              background: c.btnSecondaryBg,
              border: `1px solid ${c.btnSecondaryBorder}`,
              color: c.btnSecondaryText,
              padding: '8px 10px',
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              transition: 'all 150ms'
            }}
          >
            <span>{isDark ? '☀️' : '🌙'}</span>
            <span style={{ fontSize: 11, fontWeight: 700 }}>{isDark ? 'Light' : 'Dark'}</span>
          </button>

          {/* Botón Ir a Dashboard */}
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              background: c.btnSecondaryBg,
              border: `1px solid ${c.btnSecondaryBorder}`,
              color: c.btnSecondaryText,
              padding: '8px 12px',
              borderRadius: 12,
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <span>←</span> <span>Dashboard</span>
          </button>
        </div>
      </header>

      {/* ── TABS BAR MOBILE FIRST ── */}
      <div style={{
        display: 'flex',
        borderBottom: `1px solid ${c.border}`,
        background: c.tabsBg,
        position: 'sticky',
        top: 67,
        zIndex: 40
      }}>
        <button
          onClick={() => setActiveTab('restaurantes')}
          style={{
            flex: 1,
            padding: '14px 8px',
            border: 'none',
            background: 'none',
            color: activeTab === 'restaurantes' ? c.primaryText : c.textMuted,
            fontWeight: 800,
            fontSize: 13,
            borderBottom: activeTab === 'restaurantes' ? `2.5px solid ${c.primary}` : '2.5px solid transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6
          }}
        >
          🏢 Negocios ({restaurantes.length})
        </button>
        <button
          onClick={() => setActiveTab('solicitudes')}
          style={{
            flex: 1,
            padding: '14px 8px',
            border: 'none',
            background: 'none',
            color: activeTab === 'solicitudes' ? c.primaryText : c.textMuted,
            fontWeight: 800,
            fontSize: 13,
            borderBottom: activeTab === 'solicitudes' ? `2.5px solid ${c.primary}` : '2.5px solid transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6
          }}
        >
          💳 Solicitudes ({solicitudes.filter(s => s.estado === 'pendiente').length})
        </button>
      </div>

      <main style={{ maxWidth: 840, margin: '0 auto', padding: '16px' }}>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: c.textMuted }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚡</div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>Cargando ecosistema multitenant...</p>
          </div>
        ) : activeTab === 'restaurantes' ? (
          <div>
            {/* Botón de Acción Principal Mobile-First */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
              <button
                onClick={() => setShowCreateModal(true)}
                style={{
                  width: '100%',
                  padding: '14px 18px',
                  borderRadius: 16,
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: 14,
                  fontWeight: 900,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  boxShadow: '0 6px 20px rgba(16,185,129,0.35)',
                  transition: 'transform 100ms'
                }}
              >
                <span style={{ fontSize: 18 }}>➕</span>
                <span>Crear Nuevo Restaurante / Cliente</span>
              </button>

              {/* Barra de Búsqueda Táctil */}
              <input
                type="text"
                placeholder="🔍 Buscar por nombre, slug o teléfono..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '13px 16px',
                  borderRadius: 14,
                  background: c.cardBg,
                  border: `1.5px solid ${c.borderStrong}`,
                  color: c.text,
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box',
                  boxShadow: isDark ? 'none' : '0 2px 8px rgba(0,0,0,0.03)'
                }}
              />
            </div>

            {/* Listado de Restaurantes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {filteredRestaurantes.length === 0 ? (
                <div style={{
                  background: c.cardBg,
                  borderRadius: 18,
                  padding: 32,
                  textAlign: 'center',
                  color: c.textMuted,
                  border: `1px solid ${c.border}`
                }}>
                  No se encontraron restaurantes con "{searchTerm}".
                </div>
              ) : (
                filteredRestaurantes.map(res => {
                  const isActionBusy = actionLoading[`preset_${res.id}`];

                  // Evaluar si coincide con Solo Digital
                  const isPresetDigital = PRESETS.DIGITAL.activeIds.every(id => modulosMap[`${res.id}_${id}`] !== false) &&
                    PRESETS.DIGITAL.inactiveIds.every(id => modulosMap[`${res.id}_${id}`] === false);

                  // Evaluar si es Completo
                  const isPresetCompleto = ALL_MODULES.every(id => modulosMap[`${res.id}_${id}`] !== false);

                  return (
                    <div
                      key={res.id}
                      style={{
                        background: c.cardBg,
                        border: `1.5px solid ${c.border}`,
                        borderRadius: 20,
                        padding: '18px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 14,
                        boxShadow: c.cardShadow
                      }}
                    >
                      {/* Cabecera Restaurante */}
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                          <div style={{ minWidth: 0 }}>
                            <h3 style={{
                              margin: 0,
                              fontSize: 16,
                              fontWeight: 900,
                              color: c.text,
                              fontFamily: 'Outfit, sans-serif'
                            }}>
                              {res.nombre}
                            </h3>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4, alignItems: 'center' }}>
                              <span style={{ fontSize: 11, color: c.textMuted }}>
                                Slug: <code style={{ color: c.primaryText, fontWeight: 800 }}>/{res.slug || res.id.slice(0, 8)}</code>
                              </span>
                              {res.telefono && (
                                <span style={{ fontSize: 11, color: '#0284C7', background: isDark ? '#38BDF815' : '#E0F2FE', padding: '1px 6px', borderRadius: 6, fontWeight: 700 }}>
                                  📞 {res.telefono}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Badge de Modalidad Actual */}
                          <div style={{
                            padding: '4px 8px',
                            borderRadius: 10,
                            fontSize: 11,
                            fontWeight: 800,
                            background: isPresetDigital ? (isDark ? '#8B5CF620' : '#F3E8FF') : isPresetCompleto ? (isDark ? '#10B98120' : '#D1FAE5') : (isDark ? '#F59E0B20' : '#FEF3C7'),
                            color: isPresetDigital ? (isDark ? '#C084FC' : '#7C3AED') : isPresetCompleto ? (isDark ? '#34D399' : '#059669') : (isDark ? '#FBBF24' : '#D97706'),
                            border: `1px solid ${isPresetDigital ? (isDark ? '#8B5CF640' : '#DDD6FE') : isPresetCompleto ? (isDark ? '#10B98140' : '#A7F3D0') : (isDark ? '#F59E0B40' : '#FDE68A')}`,
                            whiteSpace: 'nowrap'
                          }}>
                            {isPresetDigital ? '⚡ Solo Digital' : isPresetCompleto ? '👑 Completo' : '⚙️ Custom'}
                          </div>
                        </div>

                        {/* Fila de Controles Rápidos: Nicho y Presets */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: 10,
                          paddingTop: 10,
                          borderTop: `1px solid ${c.border}`
                        }}>
                          {/* Selector de Nicho */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 11, color: c.textMuted, fontWeight: 700 }}>Nicho:</span>
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

                                try {
                                  await supabase.from('restaurantes').update({ 
                                    nicho_preset: val,
                                    color_primario: presetCfg.paletaRecomendada.primary,
                                    color_secundario: presetCfg.paletaRecomendada.secondary
                                  }).eq('id', res.id);
                                } catch (err) {
                                  console.error("Error al actualizar nicho:", err);
                                }
                              }}
                              style={{
                                background: c.innerBg,
                                color: c.primaryText,
                                border: `1px solid ${c.border}`,
                                borderRadius: 8,
                                padding: '4px 8px',
                                fontSize: 11.5,
                                fontWeight: 800,
                                outline: 'none'
                              }}
                            >
                              {Object.values(NICHOS_CONFIG).map(n => (
                                <option key={n.id} value={n.id}>{n.nombre}</option>
                              ))}
                            </select>
                          </div>

                          {/* Botones de Preset 1 Clic */}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            <button
                              onClick={() => handleApplyPreset(res.id, 'DIGITAL')}
                              disabled={isActionBusy}
                              title="Activa WhatsApp, bot, audiencias y pedidos. Oculta salón, mesas e inventario pesado."
                              style={{
                                background: isPresetDigital ? (isDark ? '#8B5CF630' : '#F3E8FF') : (isDark ? '#141E18' : '#F8FAFC'),
                                border: `1px solid ${isPresetDigital ? '#8B5CF6' : c.border}`,
                                color: isPresetDigital ? (isDark ? '#E9D5FF' : '#6D28D9') : (isDark ? '#A7F3D0' : '#334155'),
                                padding: '6px 10px',
                                borderRadius: 10,
                                fontSize: 11,
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4
                              }}
                            >
                              ⚡ Solo Digital
                            </button>

                            <button
                              onClick={() => handleApplyPreset(res.id, 'COMPLETO')}
                              disabled={isActionBusy}
                              title="Activa todos los módulos para un restaurante integral físico y digital."
                              style={{
                                background: isPresetCompleto ? (isDark ? '#10B98130' : '#DCFCE7') : (isDark ? '#141E18' : '#F8FAFC'),
                                border: `1px solid ${isPresetCompleto ? '#10B981' : c.border}`,
                                color: isPresetCompleto ? (isDark ? '#A7F3D0' : '#15803D') : (isDark ? '#94A3B8' : '#64748B'),
                                padding: '6px 10px',
                                borderRadius: 10,
                                fontSize: 11,
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4
                              }}
                            >
                              👑 Completo
                            </button>

                            <button
                              onClick={() => {
                                if (selectRestaurant) selectRestaurant(res);
                                navigate('/dashboard');
                              }}
                              title="Entrar como administrador de este restaurante para configurar su menú, bot y ajustes desde cero."
                              style={{
                                background: isDark ? '#10B9811A' : '#ECFDF5',
                                border: `1px solid ${isDark ? '#10B98160' : '#A7F3D0'}`,
                                color: c.primaryText,
                                padding: '6px 10px',
                                borderRadius: 10,
                                fontSize: 11,
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4
                              }}
                            >
                              🛠️ Entrar y Configurar
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Lista de Módulos (Mobile Responsive Grid) */}
                      <div>
                        <div style={{
                          fontSize: 11,
                          fontWeight: 800,
                          color: c.textMuted,
                          marginBottom: 8,
                          textTransform: 'uppercase',
                          letterSpacing: 0.5
                        }}>
                          Módulos Habilitados:
                        </div>

                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                          gap: 8
                        }}>
                          {ALL_MODULES.map(mod => {
                            const hasRecord = modulosMap[`${res.id}_${mod.id}`] !== undefined;
                            const isActivo = hasRecord ? modulosMap[`${res.id}_${mod.id}`] : true;

                            return (
                              <button
                                key={mod.id}
                                onClick={() => handleToggleModulo(res.id, mod.id, isActivo)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '8px 10px',
                                  borderRadius: 12,
                                  background: isActivo ? (isDark ? '#10B98114' : '#F0FDF4') : (isDark ? '#070C09' : '#F8FAFC'),
                                  border: `1.5px solid ${isActivo ? (isDark ? '#10B98140' : '#BBF7D0') : c.border}`,
                                  cursor: 'pointer',
                                  transition: 'all 150ms'
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                                  <span style={{ fontSize: 14 }}>{mod.icon}</span>
                                  <span style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: isActivo ? c.text : c.textMuted,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                  }}>
                                    {mod.nombre}
                                  </span>
                                </div>

                                {/* Switch táctil */}
                                <div style={{
                                  width: 28,
                                  height: 16,
                                  borderRadius: 8,
                                  background: isActivo ? '#10B981' : (isDark ? '#334155' : '#CBD5E1'),
                                  position: 'relative',
                                  transition: 'background 200ms',
                                  flexShrink: 0
                                }}>
                                  <div style={{
                                    width: 12,
                                    height: 12,
                                    borderRadius: '50%',
                                    background: '#ffffff',
                                    position: 'absolute',
                                    top: 2,
                                    left: isActivo ? 14 : 2,
                                    transition: 'left 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                                  }} />
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          /* TAB 2: SOLICITUDES DE PAGO */
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 14px', color: c.text }}>
              Comprobantes de Pago (Yape / Plin / Transferencias)
            </h2>

            {solicitudes.length === 0 ? (
              <div style={{ background: c.cardBg, borderRadius: 16, padding: 32, textAlign: 'center', color: c.textMuted, border: `1px solid ${c.border}` }}>
                No hay solicitudes de pago registradas.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {solicitudes.map(sol => (
                  <div key={sol.id} style={{
                    background: c.cardBg,
                    border: `1.5px solid ${sol.estado === 'pendiente' ? (isDark ? '#F59E0B60' : '#FCD34D') : sol.estado === 'aprobado' ? (isDark ? '#10B98140' : '#A7F3D0') : (isDark ? '#EF444440' : '#FECACA')}`,
                    borderRadius: 18,
                    padding: 14,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    boxShadow: c.cardShadow
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 900, color: c.text }}>
                          {sol.restaurantes?.nombre || 'Restaurante Desconocido'}
                        </div>
                        <div style={{ fontSize: 11.5, color: c.primaryText, fontWeight: 800, marginTop: 2 }}>
                          Módulo: {ALL_MODULES.find(m => m.id === sol.modulo)?.nombre || sol.modulo} (S/ {parseFloat(sol.monto || 0).toFixed(2)})
                        </div>
                      </div>

                      <span style={{
                        background: sol.estado === 'pendiente' ? (isDark ? '#F59E0B20' : '#FEF3C7') : sol.estado === 'aprobado' ? (isDark ? '#10B98120' : '#D1FAE5') : (isDark ? '#EF444420' : '#FEE2E2'),
                        color: sol.estado === 'pendiente' ? (isDark ? '#F59E0B' : '#D97706') : sol.estado === 'aprobado' ? (isDark ? '#10B981' : '#059669') : (isDark ? '#EF4444' : '#DC2626'),
                        padding: '3px 8px',
                        borderRadius: 10,
                        fontSize: 10,
                        fontWeight: 800,
                        textTransform: 'uppercase'
                      }}>
                        {sol.estado}
                      </span>
                    </div>

                    <div style={{ background: c.innerBg, borderRadius: 12, padding: 10, fontSize: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                      <div>
                        <span style={{ color: c.textMuted, display: 'block', fontSize: 10 }}>Método:</span>
                        <strong style={{ color: c.text, textTransform: 'uppercase' }}>{sol.metodo_pago}</strong>
                      </div>
                      <div>
                        <span style={{ color: c.textMuted, display: 'block', fontSize: 10 }}>Nº Operación:</span>
                        <strong style={{ color: '#0284C7', fontFamily: 'monospace' }}>{sol.numero_operacion || 'Sin número'}</strong>
                      </div>
                      <div>
                        <span style={{ color: c.textMuted, display: 'block', fontSize: 10 }}>Titular:</span>
                        <span style={{ color: c.text }}>{sol.titular_origen || 'No especificado'}</span>
                      </div>
                      <div>
                        <span style={{ color: c.textMuted, display: 'block', fontSize: 10 }}>Fecha:</span>
                        <span style={{ color: c.text }}>{new Date(sol.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {sol.voucher_url && (
                      <button
                        onClick={() => setSelectedVoucher(sol.voucher_url)}
                        style={{
                          background: isDark ? '#16241C' : '#ECFDF5',
                          border: `1px solid ${isDark ? '#1E2E25' : '#A7F3D0'}`,
                          color: c.primaryText,
                          padding: '8px',
                          borderRadius: 10,
                          fontSize: 11.5,
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        🖼️ Ver Voucher Adjunto
                      </button>
                    )}

                    {sol.notas_admin && (
                      <div style={{ fontSize: 11, color: '#EF4444', fontStyle: 'italic' }}>
                        Motivo rechazo: {sol.notas_admin}
                      </div>
                    )}

                    {sol.estado === 'pendiente' && (
                      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                        <button
                          onClick={() => handleAprobarSolicitud(sol)}
                          disabled={actionLoading[sol.id]}
                          style={{
                            flex: 1,
                            padding: '10px',
                            borderRadius: 10,
                            background: '#10B981',
                            border: 'none',
                            color: '#ffffff',
                            fontSize: 12,
                            fontWeight: 900,
                            cursor: 'pointer'
                          }}
                        >
                          ✓ Aprobar Módulo
                        </button>
                        <button
                          onClick={() => handleRechazarSolicitud(sol)}
                          disabled={actionLoading[sol.id]}
                          style={{
                            padding: '10px 14px',
                            borderRadius: 10,
                            background: isDark ? '#EF444420' : '#FEE2E2',
                            border: `1px solid ${isDark ? '#EF444440' : '#FECACA'}`,
                            color: '#EF4444',
                            fontSize: 12,
                            fontWeight: 800,
                            cursor: 'pointer'
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
        )}
      </main>

      {/* ── MODAL MOBILE-FIRST: CREAR NUEVO RESTAURANTE ── */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 100,
          background: isDark ? 'rgba(5, 10, 7, 0.85)' : 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center'
        }} onClick={(e) => { if (e.target === e.currentTarget) setShowCreateModal(false); }}>
          
          <div style={{
            width: '100%',
            maxWidth: 540,
            background: c.cardBg,
            borderTop: `1px solid ${c.borderStrong}`,
            borderRadius: '24px 24px 0 0',
            padding: '20px 20px calc(24px + env(safe-area-inset-bottom))',
            boxSizing: 'border-box',
            maxHeight: '90vh',
            overflowY: 'auto',
            animation: 'sheet-up 300ms cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: '0 -10px 30px rgba(0,0,0,0.2)'
          }}>
            <div style={{ width: 40, height: 4, background: c.borderStrong, borderRadius: 2, margin: '0 auto 16px' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: c.text, fontFamily: 'Outfit, sans-serif' }}>
                  Dar de Alta Negocio
                </h2>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: c.primaryText, fontWeight: 600 }}>
                  Nuevo tenant para tu amigo o cliente
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{
                  background: c.innerBg,
                  border: 'none',
                  color: c.textMuted,
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  cursor: 'pointer',
                  fontWeight: 900
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRestaurant} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              
              {/* Selector de Modalidad */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: c.textMuted, textTransform: 'uppercase', marginBottom: 6 }}>
                  Modalidad de Servicio:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {/* Opción Solo Digital */}
                  <div
                    onClick={() => setNewRes({ ...newRes, modalidad: 'DIGITAL' })}
                    style={{
                      padding: 12,
                      borderRadius: 14,
                      background: newRes.modalidad === 'DIGITAL' ? (isDark ? '#8B5CF618' : '#F5F3FF') : c.innerBg,
                      border: `2px solid ${newRes.modalidad === 'DIGITAL' ? '#8B5CF6' : c.border}`,
                      cursor: 'pointer',
                      transition: 'all 150ms'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 18 }}>⚡</span>
                      <strong style={{ fontSize: 12.5, color: newRes.modalidad === 'DIGITAL' ? (isDark ? '#E9D5FF' : '#6D28D9') : c.text }}>
                        Solo Digital
                      </strong>
                    </div>
                    <p style={{ margin: 0, fontSize: 10.5, color: c.textMuted, lineHeight: 1.3 }}>
                      Bot WhatsApp, menú digital, campañas y audiencias. Salón físico oculto.
                    </p>
                  </div>

                  {/* Opción Completo */}
                  <div
                    onClick={() => setNewRes({ ...newRes, modalidad: 'COMPLETO' })}
                    style={{
                      padding: 12,
                      borderRadius: 14,
                      background: newRes.modalidad === 'COMPLETO' ? (isDark ? '#10B98118' : '#ECFDF5') : c.innerBg,
                      border: `2px solid ${newRes.modalidad === 'COMPLETO' ? '#10B981' : c.border}`,
                      cursor: 'pointer',
                      transition: 'all 150ms'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 18 }}>👑</span>
                      <strong style={{ fontSize: 12.5, color: newRes.modalidad === 'COMPLETO' ? c.primaryText : c.text }}>
                        Plan Completo
                      </strong>
                    </div>
                    <p style={{ margin: 0, fontSize: 10.5, color: c.textMuted, lineHeight: 1.3 }}>
                      Todos los módulos: Salón, inventario, finanzas y suite digital completa.
                    </p>
                  </div>
                </div>
              </div>

              {/* Nombre del Restaurante */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: c.textMuted, textTransform: 'uppercase', marginBottom: 4 }}>
                  Nombre Comercial *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Restobar El Gaucho"
                  value={newRes.nombre}
                  onChange={e => {
                    const val = e.target.value;
                    const autoSlug = val
                      .toLowerCase()
                      .normalize('NFD')
                      .replace(/[\u0300-\u036f]/g, '')
                      .replace(/[^a-z0-9]/g, '-')
                      .replace(/-+/g, '-')
                      .replace(/^-|-$/g, '');
                    setNewRes({ ...newRes, nombre: val, slug: newRes.slug ? newRes.slug : autoSlug });
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 12,
                    background: c.inputBg,
                    border: `1.5px solid ${c.borderStrong}`,
                    color: c.text,
                    fontSize: 13,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Slug URL */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: c.textMuted, textTransform: 'uppercase', marginBottom: 4 }}>
                  Slug para Carta / Bot (URL)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', background: c.inputBg, border: `1.5px solid ${c.borderStrong}`, borderRadius: 12, padding: '0 12px' }}>
                  <span style={{ color: c.textMuted, fontSize: 12 }}>.../</span>
                  <input
                    type="text"
                    required
                    placeholder="elgaucho"
                    value={newRes.slug}
                    onChange={e => setNewRes({ ...newRes, slug: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 6px',
                      background: 'transparent',
                      border: 'none',
                      color: c.primaryText,
                      fontSize: 13,
                      fontWeight: 700,
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Teléfono WhatsApp */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: c.textMuted, textTransform: 'uppercase', marginBottom: 4 }}>
                  WhatsApp del Negocio (Bot & Avisos)
                </label>
                <input
                  type="text"
                  placeholder="Ej: +51 987 654 321"
                  value={newRes.telefono}
                  onChange={e => setNewRes({ ...newRes, telefono: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 12,
                    background: c.inputBg,
                    border: `1.5px solid ${c.borderStrong}`,
                    color: c.text,
                    fontSize: 13,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Nicho / Tema visual */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: c.textMuted, textTransform: 'uppercase', marginBottom: 4 }}>
                  Tipo de Negocio (Estilo Visual)
                </label>
                <select
                  value={newRes.nicho_preset}
                  onChange={e => setNewRes({ ...newRes, nicho_preset: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 12,
                    background: c.inputBg,
                    border: `1.5px solid ${c.borderStrong}`,
                    color: c.text,
                    fontSize: 13,
                    fontWeight: 700,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                >
                  {Object.values(NICHOS_CONFIG).map(n => (
                    <option key={n.id} value={n.id}>{n.nombre} ({n.id})</option>
                  ))}
                </select>
              </div>

              {/* Botón Guardar */}
              <button
                type="submit"
                disabled={creating}
                style={{
                  marginTop: 6,
                  padding: '14px',
                  borderRadius: 14,
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: 14,
                  fontWeight: 900,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  opacity: creating ? 0.7 : 1,
                  boxShadow: '0 4px 14px rgba(16,185,129,0.3)'
                }}
              >
                {creating ? 'Creando restaurante...' : '🚀 Dar de Alta y Activar Módulos'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Zoom del Voucher */}
      {selectedVoucher && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          background: 'rgba(0,0,0,0.92)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20
        }} onClick={() => setSelectedVoucher(null)}>
          <div style={{ position: 'relative', maxWidth: '95vw', maxHeight: '90vh' }}>
            <img
              src={selectedVoucher}
              alt="Voucher Full"
              style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: 16, border: `2px solid ${c.border}` }}
            />
            <button
              onClick={() => setSelectedVoucher(null)}
              style={{
                position: 'absolute',
                top: -16,
                right: -16,
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: '#EF4444',
                border: 'none',
                color: '#fff',
                fontWeight: 900,
                cursor: 'pointer',
                fontSize: 16
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

