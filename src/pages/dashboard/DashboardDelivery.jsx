import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../supabaseClient.js';
import { useAuth } from '../../router.jsx';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function DashboardDelivery() {
  const { activeRestaurant } = useAuth();
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState('zonas'); // 'zonas' | 'gps'
  
  // Leaflet refs
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [mapSearch, setMapSearch] = useState('');

  // Form states for new zone
  const [nombre, setNombre] = useState('');
  const [costoEnvio, setCostoEnvio] = useState('');
  const [pedidoMinimo, setPedidoMinimo] = useState('');
  const [envioGratisDesde, setEnvioGratisDesde] = useState('');
  const [saving, setSaving] = useState(false);

  // Editing state
  const [editingId, setEditingId] = useState(null);
  const [editNombre, setEditNombre] = useState('');
  const [editCostoEnvio, setEditCostoEnvio] = useState('');
  const [editPedidoMinimo, setEditPedidoMinimo] = useState('');
  const [editEnvioGratisDesde, setEditEnvioGratisDesde] = useState('');

  // Restaurant GPS config states
  const [tipoCalculo, setTipoCalculo] = useState('zonas');
  const [lat, setLat] = useState(-12.046374);
  const [lng, setLng] = useState(-77.042793);
  const [tarifaBase, setTarifaBase] = useState(5);
  const [kmBase, setKmBase] = useState(3);
  const [costoKmAdicional, setCostoKmAdicional] = useState(1.5);
  const [coberturaMaximaKm, setCoberturaMaximaKm] = useState(10);
  const [pedidoMinimoGlobal, setPedidoMinimoGlobal] = useState(30);
  const [envioGratisDesdeGlobal, setEnvioGratisDesdeGlobal] = useState(100);
  const [savingConfig, setSavingConfig] = useState(false);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  }, []);

  useEffect(() => {
    if (activeSubTab !== 'gps' || !mapContainerRef.current) {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
      return;
    }

    // Fix default marker icon paths in Leaflet
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
      iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
      shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
    });

    const initialLat = parseFloat(lat) || -12.046374;
    const initialLng = parseFloat(lng) || -77.042793;

    if (!mapRef.current) {
      const map = L.map(mapContainerRef.current).setView([initialLat, initialLng], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);

      const marker = L.marker([initialLat, initialLng], { draggable: true }).addTo(map);

      marker.on('dragend', () => {
        const position = marker.getLatLng();
        setLat(position.lat.toFixed(6));
        setLng(position.lng.toFixed(6));
      });

      map.on('click', (e) => {
        const { lat: clickLat, lng: clickLng } = e.latlng;
        marker.setLatLng([clickLat, clickLng]);
        setLat(clickLat.toFixed(6));
        setLng(clickLng.toFixed(6));
      });

      mapRef.current = map;
      markerRef.current = marker;
    } else {
      mapRef.current.setView([initialLat, initialLng]);
      markerRef.current.setLatLng([initialLat, initialLng]);
    }

    return () => {
      // Map cleanup on unmount
    };
  }, [activeSubTab]);

  const handleMapSearch = async (e) => {
    e.preventDefault();
    if (!mapSearch.trim()) return;
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(mapSearch)}&countrycodes=pe&limit=1`);
      const data = await response.json();
      if (data && data.length > 0) {
        const newLat = parseFloat(data[0].lat);
        const newLng = parseFloat(data[0].lon);
        setLat(newLat.toFixed(6));
        setLng(newLng.toFixed(6));
        if (mapRef.current) {
          mapRef.current.setView([newLat, newLng], 16);
        }
        if (markerRef.current) {
          markerRef.current.setLatLng([newLat, newLng]);
        }
      } else {
        showToast('📍 No se encontró la ubicación especificada', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error al buscar dirección', 'error');
    }
  };

  useEffect(() => {
    if (!activeRestaurant?.id) return;
    fetchZones();
    fetchRestaurantConfig();
  }, [activeRestaurant]);

  const fetchRestaurantConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurantes')
        .select('*')
        .eq('id', activeRestaurant.id)
        .single();
      if (error) throw error;
      if (data) {
        setTipoCalculo(data.delivery_tipo_calculo || 'zonas');
        setLat(data.latitud !== null ? parseFloat(data.latitud) : -12.046374);
        setLng(data.longitud !== null ? parseFloat(data.longitud) : -77.042793);
        setTarifaBase(data.delivery_tarifa_base !== null ? parseFloat(data.delivery_tarifa_base) : 5);
        setKmBase(data.delivery_km_base !== null ? parseFloat(data.delivery_km_base) : 3);
        setCostoKmAdicional(data.delivery_costo_km_adicional !== null ? parseFloat(data.delivery_costo_km_adicional) : 1.5);
        setCoberturaMaximaKm(data.delivery_cobertura_maxima_km !== null ? parseFloat(data.delivery_cobertura_maxima_km) : 10);
        setPedidoMinimoGlobal(data.delivery_pedido_minimo_global !== null ? parseFloat(data.delivery_pedido_minimo_global) : 30);
        setEnvioGratisDesdeGlobal(data.delivery_envio_gratis_desde_global !== null ? parseFloat(data.delivery_envio_gratis_desde_global) : 100);
      }
    } catch (err) {
      console.error('Error cargando configuración GPS:', err);
    }
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    if (savingConfig) return;
    setSavingConfig(true);
    try {
      const { error } = await supabase
        .from('restaurantes')
        .update({
          delivery_tipo_calculo: tipoCalculo,
          latitud: parseFloat(lat),
          longitud: parseFloat(lng),
          delivery_tarifa_base: parseFloat(tarifaBase),
          delivery_km_base: parseFloat(kmBase),
          delivery_costo_km_adicional: parseFloat(costoKmAdicional),
          delivery_cobertura_maxima_km: parseFloat(coberturaMaximaKm),
          delivery_pedido_minimo_global: parseFloat(pedidoMinimoGlobal),
          delivery_envio_gratis_desde_global: envioGratisDesdeGlobal ? parseFloat(envioGratisDesdeGlobal) : null
        })
        .eq('id', activeRestaurant.id);
      if (error) throw error;
      showToast('⚙️ Configuración GPS guardada');
      
      if (activeRestaurant) {
        activeRestaurant.delivery_tipo_calculo = tipoCalculo;
        activeRestaurant.latitud = parseFloat(lat);
        activeRestaurant.longitud = parseFloat(lng);
        activeRestaurant.delivery_tarifa_base = parseFloat(tarifaBase);
        activeRestaurant.delivery_km_base = parseFloat(kmBase);
        activeRestaurant.delivery_costo_km_adicional = parseFloat(costoKmAdicional);
        activeRestaurant.delivery_cobertura_maxima_km = parseFloat(coberturaMaximaKm);
        activeRestaurant.delivery_pedido_minimo_global = parseFloat(pedidoMinimoGlobal);
        activeRestaurant.delivery_envio_gratis_desde_global = envioGratisDesdeGlobal ? parseFloat(envioGratisDesdeGlobal) : null;
      }
    } catch (err) {
      console.error(err);
      showToast('Error al guardar configuración', 'error');
    } finally {
      setSavingConfig(false);
    }
  };

  const fetchZones = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('zonas_delivery')
        .select('*')
        .eq('restaurante_id', activeRestaurant.id)
        .order('nombre');
      
      if (error) throw error;
      setZones(data || []);
    } catch (err) {
      console.error(err);
      showToast('Error cargando zonas', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddZone = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) {
      showToast('Ingresa un nombre para la zona', 'error');
      return;
    }
    if (saving) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('zonas_delivery')
        .insert([{
          restaurante_id: activeRestaurant.id,
          nombre: nombre.trim(),
          costo_envio: parseFloat(costoEnvio || 0),
          pedido_minimo: parseFloat(pedidoMinimo || 0),
          envio_gratis_desde: envioGratisDesde ? parseFloat(envioGratisDesde) : null
        }]);

      if (error) throw error;

      showToast('📍 Zona agregada correctamente');
      setNombre('');
      setCostoEnvio('');
      setPedidoMinimo('');
      setEnvioGratisDesde('');
      fetchZones();
    } catch (err) {
      console.error(err);
      showToast('Error al agregar zona', 'error');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (zone) => {
    setEditingId(zone.id);
    setEditNombre(zone.nombre);
    setEditCostoEnvio(zone.costo_envio);
    setEditPedidoMinimo(zone.pedido_minimo);
    setEditEnvioGratisDesde(zone.envio_gratis_desde || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleUpdateZone = async (id) => {
    if (!editNombre.trim()) {
      showToast('El nombre no puede estar vacío', 'error');
      return;
    }

    try {
      const { error } = await supabase
        .from('zonas_delivery')
        .update({
          nombre: editNombre.trim(),
          costo_envio: parseFloat(editCostoEnvio || 0),
          pedido_minimo: parseFloat(editPedidoMinimo || 0),
          envio_gratis_desde: editEnvioGratisDesde ? parseFloat(editEnvioGratisDesde) : null
        })
        .eq('id', id);

      if (error) throw error;

      showToast('💾 Zona actualizada exitosamente');
      setEditingId(null);
      fetchZones();
    } catch (err) {
      console.error(err);
      showToast('Error al actualizar zona', 'error');
    }
  };

  const handleDeleteZone = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta zona de delivery?')) return;

    try {
      const { error } = await supabase
        .from('zonas_delivery')
        .delete()
        .eq('id', id);

      if (error) throw error;

      showToast('🗑️ Zona eliminada');
      fetchZones();
    } catch (err) {
      console.error(err);
      showToast('Error al eliminar zona', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Selector de Sub-Tab */}
      <div style={{ display: 'flex', gap: 10, background: 'var(--color-surface-2)', padding: 4, borderRadius: 16, alignSelf: 'start', border: '1px solid var(--color-surface-3)' }}>
        <button
          type="button"
          onClick={() => { setActiveSubTab('zonas'); if (navigator.vibrate) navigator.vibrate(5); }}
          style={{
            padding: '8px 18px',
            border: 'none',
            borderRadius: 12,
            fontSize: 12,
            fontWeight: 800,
            cursor: 'pointer',
            background: activeSubTab === 'zonas' ? 'var(--color-surface)' : 'transparent',
            color: activeSubTab === 'zonas' ? 'var(--color-primary)' : 'var(--color-muted)',
            boxShadow: activeSubTab === 'zonas' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
            transition: 'all 0.2s'
          }}
        >
          📍 Zonas y Distritos
        </button>
        <button
          type="button"
          onClick={() => { setActiveSubTab('gps'); if (navigator.vibrate) navigator.vibrate(5); }}
          style={{
            padding: '8px 18px',
            border: 'none',
            borderRadius: 12,
            fontSize: 12,
            fontWeight: 800,
            cursor: 'pointer',
            background: activeSubTab === 'gps' ? 'var(--color-surface)' : 'transparent',
            color: activeSubTab === 'gps' ? 'var(--color-primary)' : 'var(--color-muted)',
            boxShadow: activeSubTab === 'gps' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
            transition: 'all 0.2s'
          }}
        >
          📡 Configuración GPS (Km)
        </button>
        <button
          type="button"
          onClick={() => { setActiveSubTab('repartidores'); if (navigator.vibrate) navigator.vibrate(5); }}
          style={{
            padding: '8px 18px',
            border: 'none',
            borderRadius: 12,
            fontSize: 12,
            fontWeight: 800,
            cursor: 'pointer',
            background: activeSubTab === 'repartidores' ? 'var(--color-surface)' : 'transparent',
            color: activeSubTab === 'repartidores' ? 'var(--color-primary)' : 'var(--color-muted)',
            boxShadow: activeSubTab === 'repartidores' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
            transition: 'all 0.2s'
          }}
        >
          🛵 Mis Repartidores
        </button>
      </div>

      {activeSubTab === 'repartidores' ? (
        <RepartidoresTab />
      ) : activeSubTab === 'zonas' ? (
        <>
          {/* Explicación de la funcionalidad */}
          <div style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-surface-3)',
            borderRadius: 'var(--radius-xl)',
            padding: '20px',
          }}>
            <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 16, fontWeight: 800, color: 'var(--color-on-surface)', marginBottom: 6 }}>
              Configuración de Delivery por Distritos 🌱
            </p>
            <p style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.5 }}>
              Gestiona las zonas de Lima a las que realiza envíos tu restaurante. Define el costo de envío, el pedido mínimo requerido para procesar la orden y el monto acumulado para que el delivery sea completamente gratuito.
            </p>
          </div>

          {/* Grid: Formulario Izquierda, Lista Derecha */}
          <div className="dash-layout-main" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
            {/* Formulario Agregar Zona */}
            <div style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-surface-3)',
              borderRadius: 'var(--radius-xl)',
              padding: '24px',
              alignSelf: 'start',
            }}>
              <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
                ➕ Agregar Nueva Zona
              </p>
              <form onSubmit={handleAddZone} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 5 }}>Nombre del Distrito</label>
                  <input
                    type="text"
                    placeholder="Ej. Miraflores, San Borja"
                    value={nombre}
                    onChange={e => setNombre(e.target.value)}
                    className="input-field"
                    required
                    style={{ fontSize: 12, padding: '10px 14px' }}
                  />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 5 }}>Costo Envío (S/.)</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={costoEnvio}
                      onChange={e => setCostoEnvio(e.target.value)}
                      className="input-field"
                      style={{ fontSize: 12, padding: '10px 14px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 5 }}>Pedido Mín. (S/.)</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={pedidoMinimo}
                      onChange={e => setPedidoMinimo(e.target.value)}
                      className="input-field"
                      style={{ fontSize: 12, padding: '10px 14px' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 5 }}>Envío Gratis Desde (S/.)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="Opcional. Ej. 80.00"
                    value={envioGratisDesde}
                    onChange={e => setEnvioGratisDesde(e.target.value)}
                    className="input-field"
                    style={{ fontSize: 12, padding: '10px 14px' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    background: 'var(--color-primary)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 14,
                    padding: '12px',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    textAlign: 'center',
                    marginTop: 6,
                    boxShadow: '0 4px 12px rgba(27,67,50,0.15)'
                  }}
                >
                  {saving ? 'Guardando...' : '💾 Crear Zona de Delivery'}
                </button>
              </form>
            </div>

            {/* Listado de Zonas */}
            <div style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-surface-3)',
              borderRadius: 'var(--radius-xl)',
              padding: '24px',
            }}>
              <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
                📋 Zonas de Reparto Activas ({zones.length})
              </p>

              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[1, 2, 3].map(i => (
                    <div key={i} className="skeleton" style={{ height: 60, borderRadius: 14 }} />
                  ))}
                </div>
              ) : zones.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-muted)' }}>
                  <p style={{ fontSize: 32, marginBottom: 8 }}>🛵</p>
                  <p style={{ fontWeight: 700 }}>No hay zonas configuradas</p>
                  <p style={{ fontSize: 11 }}>Crea tu primera zona a la izquierda</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {zones.map(zone => (
                    <div key={zone.id} style={{
                      padding: '14px',
                      border: '1.5px solid var(--color-surface-3)',
                      borderRadius: 16,
                      background: 'var(--color-surface-2)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}>
                      {editingId === zone.id ? (
                        /* Formulario de Edición */
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <input
                            type="text"
                            value={editNombre}
                            onChange={e => setEditNombre(e.target.value)}
                            className="input-field"
                            style={{ fontSize: 12, padding: '8px 12px', background: 'var(--color-surface)' }}
                          />
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                            <div>
                              <label style={{ fontSize: 9, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase' }}>Costo Envío</label>
                              <input
                                type="number"
                                step="any"
                                value={editCostoEnvio}
                                onChange={e => setEditCostoEnvio(e.target.value)}
                                className="input-field"
                                style={{ fontSize: 11, padding: '6px 10px', background: 'var(--color-surface)' }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: 9, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase' }}>Pedido Mín.</label>
                              <input
                                type="number"
                                step="any"
                                value={editPedidoMinimo}
                                onChange={e => setEditPedidoMinimo(e.target.value)}
                                className="input-field"
                                style={{ fontSize: 11, padding: '6px 10px', background: 'var(--color-surface)' }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: 9, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase' }}>Gratis desde</label>
                              <input
                                type="number"
                                step="any"
                                value={editEnvioGratisDesde}
                                onChange={e => setEditEnvioGratisDesde(e.target.value)}
                                className="input-field"
                                style={{ fontSize: 11, padding: '6px 10px', background: 'var(--color-surface)' }}
                                placeholder="Ninguno"
                              />
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                            <button
                              type="button"
                              onClick={() => handleUpdateZone(zone.id)}
                              style={{ flex: 1, padding: '8px', border: 'none', background: 'var(--color-primary)', color: '#fff', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                            >
                              Guardar
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              style={{ flex: 1, padding: '8px', border: '1px solid var(--color-surface-3)', background: '#fff', color: 'var(--color-muted)', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Vista Normal */
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 14, fontWeight: 800, color: 'var(--color-on-surface)' }}>{zone.nombre}</p>
                            <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                              <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600 }}>
                                🛵 Envío: <strong style={{ color: 'var(--color-primary)' }}>S/. {parseFloat(zone.costo_envio).toFixed(2)}</strong>
                              </span>
                              <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600 }}>
                                🛒 Mín: <strong>S/. {parseFloat(zone.pedido_minimo).toFixed(2)}</strong>
                              </span>
                              {zone.envio_gratis_desde && (
                                <span style={{ fontSize: 11, color: '#40916C', fontWeight: 700 }}>
                                  🎁 Gratis &gt; S/. {parseFloat(zone.envio_gratis_desde).toFixed(0)}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Botones de acción */}
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              onClick={() => startEdit(zone)}
                              title="Editar zona"
                              style={{ width: 32, height: 32, borderRadius: 10, background: '#fff', border: '1px solid var(--color-surface-3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted)' }}
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDeleteZone(zone.id)}
                              title="Eliminar zona"
                              style={{ width: 32, height: 32, borderRadius: 10, background: '#fff', border: '1px solid var(--color-surface-3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-danger)' }}
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        /* Configuración GPS */
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-surface-3)',
          borderRadius: 'var(--radius-xl)',
          padding: '28px',
          display: 'flex',
          flexDirection: 'column',
          gap: 24
        }}>
          <div>
            <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 16, fontWeight: 800, color: 'var(--color-on-surface)', marginBottom: 6 }}>
              Tarifación y Cobertura por Kilometraje (GPS) 📡
            </p>
            <p style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.5 }}>
              Calcula dinámicamente el precio de envío según la distancia en kilómetros desde tu cocina. El cliente ingresa su ubicación GPS o dirección en la PWA y el sistema determina la factibilidad y el costo de manera precisa.
            </p>
          </div>

          <form onSubmit={handleSaveConfig} style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 640 }}>
            {/* Tipo de Cálculo */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 8 }}>TIPO DE CÁLCULO DE DELIVERY</label>
              <div style={{ display: 'flex', gap: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', background: tipoCalculo === 'zonas' ? 'var(--color-accent)' : 'var(--color-surface-2)', border: `1.5px solid ${tipoCalculo === 'zonas' ? 'var(--color-primary)' : 'var(--color-surface-3)'}`, padding: '12px 18px', borderRadius: 12, flex: 1, transition: 'all 0.2s' }}>
                  <input type="radio" name="tipoCalculo" value="zonas" checked={tipoCalculo === 'zonas'} onChange={() => setTipoCalculo('zonas')} style={{ accentColor: 'var(--color-primary)' }} />
                  <div>
                    <span style={{ fontWeight: 700, display: 'block', color: 'var(--color-on-surface)' }}>📍 Por Distritos / Zonas</span>
                    <span style={{ fontSize: 10, color: 'var(--color-muted)' }}>Costo fijo configurado por distritos manuales.</span>
                  </div>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', background: tipoCalculo === 'distancia' ? 'var(--color-accent)' : 'var(--color-surface-2)', border: `1.5px solid ${tipoCalculo === 'distancia' ? 'var(--color-primary)' : 'var(--color-surface-3)'}`, padding: '12px 18px', borderRadius: 12, flex: 1, transition: 'all 0.2s' }}>
                  <input type="radio" name="tipoCalculo" value="distancia" checked={tipoCalculo === 'distancia'} onChange={() => setTipoCalculo('distancia')} style={{ accentColor: 'var(--color-primary)' }} />
                  <div>
                    <span style={{ fontWeight: 700, display: 'block', color: 'var(--color-on-surface)' }}>📏 Por Distancia (GPS)</span>
                    <span style={{ fontSize: 10, color: 'var(--color-muted)' }}>Costo base + tarifa por kilómetro recorrido.</span>
                  </div>
                </label>
              </div>
            </div>

            <div style={{ height: 1, background: 'var(--color-surface-3)' }} />

            {/* Coordenadas del Restaurante */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 5 }}>Latitud del Local</label>
                <input type="number" step="any" required value={lat} onChange={e => setLat(e.target.value)} className="input-field" style={{ fontSize: 12 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 5 }}>Longitud del Local</label>
                <input type="number" step="any" required value={lng} onChange={e => setLng(e.target.value)} className="input-field" style={{ fontSize: 12 }} />
              </div>
            </div>

            {/* Buscador de dirección y Mapa Visual */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase' }}>Ubicación en el Mapa 🗺️</label>
              
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  placeholder="Busca la dirección de tu local (ej. Av. Arequipa 1200, Lima)"
                  value={mapSearch}
                  onChange={e => setMapSearch(e.target.value)}
                  className="input-field"
                  style={{ fontSize: 12, flex: 1 }}
                />
                <button
                  type="button"
                  onClick={handleMapSearch}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 12,
                    background: 'var(--color-surface-2)',
                    border: '1.5px solid var(--color-surface-3)',
                    color: 'var(--color-on-surface)',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  🔍 Buscar
                </button>
              </div>

              <div 
                ref={mapContainerRef} 
                style={{ 
                  height: '260px', 
                  borderRadius: '16px', 
                  border: '1.5px solid var(--color-surface-3)', 
                  overflow: 'hidden',
                  zIndex: 1
                }} 
              />
              <span style={{ fontSize: 10, color: 'var(--color-muted)', fontStyle: 'italic' }}>
                * Arrastra el marcador o haz clic en cualquier parte del mapa para ajustar la ubicación exacta.
              </span>
            </div>

            {/* Tarifas de Envío por Distancia */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 5 }}>Tarifa Base (S/.)</label>
                <input type="number" step="any" required value={tarifaBase} onChange={e => setTarifaBase(e.target.value)} className="input-field" style={{ fontSize: 12 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 5 }}>Kilómetros Base (Km)</label>
                <input type="number" step="any" required value={kmBase} onChange={e => setKmBase(e.target.value)} className="input-field" style={{ fontSize: 12 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 5 }}>Costo Km Extra (S/.)</label>
                <input type="number" step="any" required value={costoKmAdicional} onChange={e => setCostoKmAdicional(e.target.value)} className="input-field" style={{ fontSize: 12 }} />
              </div>
            </div>

            {/* Cobertura y Reglas Globales */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 5 }}>Cobertura Máx (Km)</label>
                <input type="number" step="any" required value={coberturaMaximaKm} onChange={e => setCoberturaMaximaKm(e.target.value)} className="input-field" style={{ fontSize: 12 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 5 }}>Pedido Mínimo (S/.)</label>
                <input type="number" step="any" required value={pedidoMinimoGlobal} onChange={e => setPedidoMinimoGlobal(e.target.value)} className="input-field" style={{ fontSize: 12 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 5 }}>Envío Gratis desde (S/.)</label>
                <input type="number" step="any" value={envioGratisDesdeGlobal} onChange={e => setEnvioGratisDesdeGlobal(e.target.value)} className="input-field" style={{ fontSize: 12 }} placeholder="Ninguno" />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingConfig}
              style={{
                background: 'var(--color-primary)',
                color: '#fff',
                border: 'none',
                borderRadius: 14,
                padding: '14px',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                textAlign: 'center',
                marginTop: 10,
                boxShadow: '0 4px 12px rgba(27,67,50,0.15)',
                alignSelf: 'start',
                width: 240
              }}
            >
              {savingConfig ? 'Guardando...' : '💾 Guardar Configuración GPS'}
            </button>
          </form>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'absolute', bottom: 90, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--color-on-surface)', color: '#fff',
          padding: '10px 20px', borderRadius: 999, fontSize: 12, fontWeight: 700,
          whiteSpace: 'nowrap', zIndex: 99, animation: 'toast-in 250ms ease',
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  );

  /* ── SUBCOMPONENTE DE REPARTIDORES ── */
  function RepartidoresTab() {
    const [repartidoresList, setRepartidoresList] = useState([]);
    const [loadingR, setLoadingR] = useState(true);
    const [newName, setNewName] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [savingR, setSavingR] = useState(false);

    const loadRepartidores = useCallback(async () => {
      if (!activeRestaurant?.id) return;
      setLoadingR(true);
      try {
        const { data, error } = await supabase
          .from('repartidores')
          .select('*')
          .eq('restaurante_id', activeRestaurant.id)
          .order('nombre');
        if (error) throw error;
        setRepartidoresList(data || []);
      } catch (e) {
        console.error(e);
        showToast('Error cargando repartidores', 'error');
      } finally {
        setLoadingR(false);
      }
    }, []);

    useEffect(() => {
      loadRepartidores();
    }, [loadRepartidores]);

    const handleCreateRepartidor = async (e) => {
      e.preventDefault();
      if (!newName.trim() || !newPhone.trim()) {
        showToast('Por favor completa todos los campos', 'error');
        return;
      }
      setSavingR(true);
      try {
        const { error } = await supabase
          .from('repartidores')
          .insert({
            restaurante_id: activeRestaurant.id,
            nombre: newName.trim(),
            telefono: newPhone.trim(),
            activo: true
          });
        if (error) throw error;
        showToast('🛵 Repartidor agregado con éxito');
        setNewName('');
        setNewPhone('');
        loadRepartidores();
      } catch (err) {
        console.error(err);
        showToast('Error agregando repartidor', 'error');
      } finally {
        setSavingR(false);
      }
    };

    const handleDeleteRepartidor = async (id) => {
      if (!window.confirm('¿Deseas eliminar este repartidor?')) return;
      try {
        const { error } = await supabase
          .from('repartidores')
          .delete()
          .eq('id', id);
        if (error) throw error;
        showToast('🗑️ Repartidor eliminado');
        loadRepartidores();
      } catch (err) {
        console.error(err);
        showToast('Error al eliminar', 'error');
      }
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Intro */}
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-surface-3)',
          borderRadius: 'var(--radius-xl)',
          padding: '20px',
        }}>
          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 16, fontWeight: 800, color: 'var(--color-on-surface)', marginBottom: 6 }}>
            Gestión de Repartidores Propios 🛵
          </p>
          <p style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.5 }}>
            Registra tu flota de delivery personal para poder seleccionarlos rápidamente al despachar órdenes en tiempo real. Al seleccionarlos, tu bot de WhatsApp n8n enviará sus datos de contacto directo al cliente de forma automática.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          {/* Formulario */}
          <div style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-surface-3)',
            borderRadius: 'var(--radius-xl)',
            padding: '24px',
            height: 'fit-content'
          }}>
            <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 14, fontWeight: 800, color: 'var(--color-on-surface)', marginBottom: 16 }}>Nuevo Repartidor</p>
            <form onSubmit={handleCreateRepartidor} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Nombre Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Carlos Mendoza"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="input-field"
                  style={{ fontSize: 12, padding: '10px 12px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Número Celular (WhatsApp)</label>
                <input
                  type="tel"
                  required
                  placeholder="Ej. +51982334455"
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                  className="input-field"
                  style={{ fontSize: 12, padding: '10px 12px' }}
                />
              </div>
              <button
                type="submit"
                disabled={savingR}
                style={{
                  background: 'var(--color-primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 12,
                  padding: '12px',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer',
                  marginTop: 6
                }}
              >
                {savingR ? 'Registrando...' : '➕ Registrar Repartidor'}
              </button>
            </form>
          </div>

          {/* Lista */}
          <div style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-surface-3)',
            borderRadius: 'var(--radius-xl)',
            padding: '24px',
          }}>
            <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 14, fontWeight: 800, color: 'var(--color-on-surface)', marginBottom: 16 }}>
              Registrados ({repartidoresList.length})
            </p>

            {loadingR ? (
              <div className="skeleton" style={{ height: 120, borderRadius: 12 }} />
            ) : repartidoresList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--color-muted)' }}>
                <p style={{ fontSize: 24, marginBottom: 6 }}>🛵</p>
                <p style={{ fontSize: 12, fontWeight: 700 }}>No hay repartidores registrados</p>
                <p style={{ fontSize: 10 }}>Usa el formulario para agregar uno</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {repartidoresList.map(rep => (
                  <div key={rep.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 14px',
                    border: '1px solid var(--color-surface-3)',
                    background: 'var(--color-surface-2)',
                    borderRadius: 12
                  }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-on-surface)' }}>{rep.nombre}</p>
                      <p style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 2 }}>📞 {rep.telefono}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteRepartidor(rep.id)}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        border: '1px solid var(--color-surface-3)',
                        background: 'var(--color-surface)',
                        cursor: 'pointer',
                        color: 'var(--color-danger)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}
