import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../supabaseClient.js';
import { useAuth } from '../../router.jsx';
import DashboardModulos from './DashboardModulos.jsx';
import { NICHOS_CONFIG, getPresetConfig } from '../../config/nichosConfig.js';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const PREDEFINED_CUISINES = [
  '🌱 Plant-Based & Vegano Saludable',
  '☕ Cafetería, Bakery & Desayunos',
  '🍔 Hamburguesería & Fast Food Gourmet',
  '🍗 Pollería & Comida Criolla',
  '🍕 Pizzería & Trattoria Italiana',
  '🥢 Chifa & Comida Asiática',
  '🍣 Sushi & Nikkei Fusión',
  '🥩 Parrilla, Carnes & Asador',
  '🐟 Cevichería & Marisquería',
];

const DIAS_SEMANA = [
  { key: 'lunes', label: 'Lunes' },
  { key: 'martes', label: 'Martes' },
  { key: 'miercoles', label: 'Miércoles' },
  { key: 'jueves', label: 'Jueves' },
  { key: 'viernes', label: 'Viernes' },
  { key: 'sabado', label: 'Sábado' },
  { key: 'domingo', label: 'Domingo' },
];

const PRESET_HORARIOS = {
  cafeteria: {
    lunes:     { activo: true,  t1_open: '07:00', t1_close: '19:00', dosTurnos: false },
    martes:    { activo: true,  t1_open: '07:00', t1_close: '19:00', dosTurnos: false },
    miercoles: { activo: true,  t1_open: '07:00', t1_close: '19:00', dosTurnos: false },
    jueves:    { activo: true,  t1_open: '07:00', t1_close: '19:00', dosTurnos: false },
    viernes:   { activo: true,  t1_open: '07:00', t1_close: '20:00', dosTurnos: false },
    sabado:    { activo: true,  t1_open: '08:00', t1_close: '20:00', dosTurnos: false },
    domingo:   { activo: false, t1_open: '08:00', t1_close: '14:00', dosTurnos: false },
  },
  restaurante: {
    lunes:     { activo: true,  t1_open: '12:00', t1_close: '16:00', t2_open: '19:00', t2_close: '23:00', dosTurnos: true },
    martes:    { activo: true,  t1_open: '12:00', t1_close: '16:00', t2_open: '19:00', t2_close: '23:00', dosTurnos: true },
    miercoles: { activo: true,  t1_open: '12:00', t1_close: '16:00', t2_open: '19:00', t2_close: '23:00', dosTurnos: true },
    jueves:    { activo: true,  t1_open: '12:00', t1_close: '16:00', t2_open: '19:00', t2_close: '23:00', dosTurnos: true },
    viernes:   { activo: true,  t1_open: '12:00', t1_close: '23:30', dosTurnos: false },
    sabado:    { activo: true,  t1_open: '12:00', t1_close: '23:30', dosTurnos: false },
    domingo:   { activo: false, t1_open: '12:00', t1_close: '18:00', dosTurnos: false },
  },
  nocturno: {
    lunes:     { activo: false, t1_open: '17:00', t1_close: '00:00', dosTurnos: false },
    martes:    { activo: true,  t1_open: '17:00', t1_close: '00:00', dosTurnos: false },
    miercoles: { activo: true,  t1_open: '17:00', t1_close: '00:00', dosTurnos: false },
    jueves:    { activo: true,  t1_open: '17:00', t1_close: '00:00', dosTurnos: false },
    viernes:   { activo: true,  t1_open: '17:00', t1_close: '02:00', dosTurnos: false },
    sabado:    { activo: true,  t1_open: '17:00', t1_close: '02:00', dosTurnos: false },
    domingo:   { activo: true,  t1_open: '17:00', t1_close: '23:00', dosTurnos: false },
  }
};

const ALL_MODULES = [
  { id: 'inicio', label: '🏠 Inicio / Métricas' },
  { id: 'pedidos', label: '👨‍🍳 Órdenes Live' },
  { id: 'carta', label: '📋 Carta del Menú' },
  { id: 'inventario', label: '📦 Inventario' },
  { id: 'marketing', label: '🚀 Marketing IA' },
  { id: 'delivery', label: '🛵 Delivery GPS' },
  { id: 'clientes', label: '👥 Clientes (CRM)' },
  { id: 'premios', label: '🎁 Club Premios' },
  { id: 'salon', label: '🪑 Pedidos Salón' },
  { id: 'finanzas', label: '💵 Finanzas & Caja (🔒 Sensible)' },
  { id: 'restaurante', label: '🏪 Mi Restaurante (🔒 Config)' },
];

const DEFAULT_ROLE_PERMISSIONS = {
  admin: ['inicio', 'pedidos', 'carta', 'inventario', 'marketing', 'delivery', 'clientes', 'premios', 'salon', 'finanzas', 'restaurante'],
  camarero: ['inicio', 'pedidos', 'salon'],
  cocina: ['inicio', 'pedidos', 'carta'],
  cajero: ['inicio', 'pedidos', 'finanzas'],
};


export default function DashboardMiRestaurante() {
  const { activeRestaurant } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState('perfil'); // 'perfil' | 'ia' | 'horarios' | 'delivery' | 'personal' | 'pagos'
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // Form State: Perfil Negocio
  const [nombre, setNombre] = useState('');
  const [ruc, setRuc] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [aceptaReservas, setAceptaReservas] = useState(false);

  // Form State: Apariencia & Nicho
  const [nichoSeleccionado, setNichoSeleccionado] = useState('plant_based');
  const [colorPrimario, setColorPrimario] = useState('#10B981');
  const [colorSecundario, setColorSecundario] = useState('#059669');
  const [modoOscuro, setModoOscuro] = useState(false);
  const [estiloCards, setEstiloCards] = useState('rounded');

  // Form State: Configuración IA
  const [botNombre, setBotNombre] = useState('Mr. Green');
  const [botTono, setBotTono] = useState('cercano_informal');
  const [botEmojis, setBotEmojis] = useState('moderado');
  const [tipoCocinaPreset, setTipoCocinaPreset] = useState('🌱 Plant-Based & Vegano Saludable');
  const [tipoCocinaCustom, setTipoCocinaCustom] = useState('');
  const [valoresDiferenciales, setValoresDiferenciales] = useState('');
  const [politicasNegocio, setPoliticasNegocio] = useState('');
  const [instruccionesIa, setInstruccionesIa] = useState('');

  // Form State: Horarios & Cierre Emergencia
  const [horariosSemanales, setHorariosSemanales] = useState(PRESET_HORARIOS.restaurante);
  const [diasFeriados, setDiasFeriados] = useState([]);
  const [mensajeFueraHorario, setMensajeFueraHorario] = useState('Nuestra cocina se encuentra actualmente en horario de descanso. Te responderemos apenas abramos.');
  const [cierreEmergenciaActivo, setCierreEmergenciaActivo] = useState(false);
  const [cierreEmergenciaMotivo, setCierreEmergenciaMotivo] = useState('Hoy nos encontramos cerrados por evento privado / mantenimiento. ¡Volvemos mañana en nuestro horario habitual!');

  const [newFeriadoFecha, setNewFeriadoFecha] = useState('');
  const [newFeriadoMotivo, setNewFeriadoMotivo] = useState('');

  // Form State: Delivery & GPS
  const [tipoCalculo, setTipoCalculo] = useState('zonas');
  const [lat, setLat] = useState(-12.046374);
  const [lng, setLng] = useState(-77.042793);
  const [tarifaBase, setTarifaBase] = useState(5);
  const [kmBase, setKmBase] = useState(3);
  const [costoKmAdicional, setCostoKmAdicional] = useState(1.5);
  const [coberturaMaximaKm, setCoberturaMaximaKm] = useState(10);
  const [pedidoMinimoGlobal, setPedidoMinimoGlobal] = useState(30);
  const [envioGratisDesdeGlobal, setEnvioGratisDesdeGlobal] = useState(100);

  // Leaflet refs
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [mapSearch, setMapSearch] = useState('');

  // Form State: Pagos
  const [yapeNumero, setYapeNumero] = useState('');
  const [yapeTitular, setYapeTitular] = useState('');
  const [plinNumero, setPlinNumero] = useState('');

  // State: Personal
  const [staffList, setStaffList] = useState([]);
  const [newStaffNombre, setNewStaffNombre] = useState('');
  const [newStaffTelefono, setNewStaffTelefono] = useState('');
  const [newStaffRol, setNewStaffRol] = useState('camarero');
  const [newStaffPin, setNewStaffPin] = useState('1234');
  const [newStaffPermisos, setNewStaffPermisos] = useState(DEFAULT_ROLE_PERMISSIONS.camarero);
  const [addingStaff, setAddingStaff] = useState(false);

  const handleRoleChange = (role) => {
    setNewStaffRol(role);
    if (DEFAULT_ROLE_PERMISSIONS[role]) {
      setNewStaffPermisos(DEFAULT_ROLE_PERMISSIONS[role]);
    }
  };

  const toggleModulePermission = (modId) => {
    setNewStaffPermisos(prev =>
      prev.includes(modId) ? prev.filter(m => m !== modId) : [...prev, modId]
    );
  };


  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Cargar datos desde Supabase
  const loadRestaurantData = useCallback(async () => {
    if (!activeRestaurant?.id) return;
    setLoading(true);
    try {
      const { data: resData, error: resError } = await supabase
        .from('restaurantes')
        .select('*')
        .eq('id', activeRestaurant.id)
        .maybeSingle();

      if (resError) console.warn("Supabase fetch warning:", resError);

      const target = resData || activeRestaurant;
      if (target) {
        setNombre(target.nombre || '');
        setRuc(target.ruc || '');
        setTelefono(target.telefono || '');
        setDireccion(target.direccion || '');
        setAceptaReservas(!!target.acepta_reservas);

        setBotNombre(target.bot_nombre || 'Mr. Green');
        setBotTono(target.bot_tono || 'cercano_informal');
        setBotEmojis(target.bot_emojis || 'moderado');

        const cuisine = target.tipo_cocina || '🌱 Plant-Based & Vegano Saludable';
        if (PREDEFINED_CUISINES.includes(cuisine)) {
          setTipoCocinaPreset(cuisine);
          setTipoCocinaCustom('');
        } else {
          setTipoCocinaPreset('OTRO');
          setTipoCocinaCustom(cuisine);
        }

        setValoresDiferenciales(target.valores_diferenciales || '');
        setPoliticasNegocio(target.politicas_negocio || 'No se admiten cancelaciones si la orden ya está en la cocina.');
        setInstruccionesIa(target.instrucciones_ia || '');

        // Horarios & Cierres
        if (target.horarios_semanales && typeof target.horarios_semanales === 'object') {
          setHorariosSemanales({ ...PRESET_HORARIOS.restaurante, ...target.horarios_semanales });
        }
        if (Array.isArray(target.dias_feriados)) {
          setDiasFeriados(target.dias_feriados);
        }
        setMensajeFueraHorario(target.mensaje_fuera_horario || 'Nuestra cocina se encuentra actualmente en descanso.');
        setCierreEmergenciaActivo(!!target.cierre_emergencia_activo);
        setCierreEmergenciaMotivo(target.cierre_emergencia_motivo || 'Hoy nos encontramos cerrados por evento privado / mantenimiento.');

        // Pagos
        setYapeNumero(target.yape_numero || '');
        setYapeTitular(target.yape_titular || '');
        setPlinNumero(target.plin_numero || '');

        // Apariencia & Nicho
        const presetKey = target.nicho_preset || 'plant_based';
        setNichoSeleccionado(presetKey);
        const presetConfig = getPresetConfig(presetKey);

        const prim = target.color_primario || presetConfig.paletaRecomendada.primary;
        const sec = target.color_secundario || presetConfig.paletaRecomendada.secondary;
        setColorPrimario(prim);
        setColorSecundario(sec);

        // Aplicar variables CSS globales dinámicamente
        document.documentElement.style.setProperty('--color-primary', prim, 'important');
        document.documentElement.style.setProperty('--color-secondary', sec, 'important');

        // Delivery
        setTipoCalculo(target.delivery_tipo_calculo || 'zonas');
        setLat(target.latitud !== null ? parseFloat(target.latitud) : -12.046374);
        setLng(target.longitud !== null ? parseFloat(target.longitud) : -77.042793);
        setTarifaBase(target.delivery_tarifa_base !== null ? parseFloat(target.delivery_tarifa_base) : 5);
        setKmBase(target.delivery_km_base !== null ? parseFloat(target.delivery_km_base) : 3);
        setCostoKmAdicional(target.delivery_costo_km_adicional !== null ? parseFloat(target.delivery_costo_km_adicional) : 1.5);
        setCoberturaMaximaKm(target.delivery_cobertura_maxima_km !== null ? parseFloat(target.delivery_cobertura_maxima_km) : 10);
        setPedidoMinimoGlobal(target.delivery_pedido_minimo_global !== null ? parseFloat(target.delivery_pedido_minimo_global) : 30);
        setEnvioGratisDesdeGlobal(target.delivery_envio_gratis_desde_global !== null ? parseFloat(target.delivery_envio_gratis_desde_global) : 100);
      }

      // Cargar personal
      try {
        const { data: staffData, error: staffError } = await supabase
          .from('personal')
          .select('*')
          .eq('restaurante_id', activeRestaurant.id)
          .order('created_at', { ascending: true });

        if (!staffError && staffData) {
          setStaffList(staffData);
        }
      } catch (e) {
        console.warn("Tabla personal no disponible:", e);
      }
    } catch (err) {
      console.error("Error al cargar datos:", err);
    } finally {
      setLoading(false);
    }
  }, [activeRestaurant]);

  useEffect(() => {
    loadRestaurantData();
  }, [loadRestaurantData]);

  // Leaflet map setup
  useEffect(() => {
    if (activeSubTab !== 'delivery' || !mapContainerRef.current) {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
      return;
    }

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
        const pos = marker.getLatLng();
        setLat(pos.lat.toFixed(6));
        setLng(pos.lng.toFixed(6));
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
  }, [activeSubTab, lat, lng]);

  const handleMapSearch = async (e) => {
    e.preventDefault();
    if (!mapSearch.trim()) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(mapSearch)}&countrycodes=pe&limit=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        const newLat = parseFloat(data[0].lat);
        const newLng = parseFloat(data[0].lon);
        setLat(newLat.toFixed(6));
        setLng(newLng.toFixed(6));
        if (mapRef.current) mapRef.current.setView([newLat, newLng], 16);
        if (markerRef.current) markerRef.current.setLatLng([newLat, newLng]);
      } else {
        showToast('📍 No se encontró la dirección', 'error');
      }
    } catch (err) {
      showToast('Error al buscar dirección', 'error');
    }
  };

  // Handlers para Horarios
  const updateHorarioDay = (dayKey, field, val) => {
    setHorariosSemanales(prev => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        [field]: val
      }
    }));
  };

  const applyPresetHorarios = (presetKey) => {
    if (PRESET_HORARIOS[presetKey]) {
      setHorariosSemanales(PRESET_HORARIOS[presetKey]);
      showToast(`Plantilla "${presetKey.toUpperCase()}" aplicada a la semana 🕒`);
    }
  };

  // Handlers Feriados
  const handleAddFeriado = (e) => {
    e.preventDefault();
    if (!newFeriadoFecha) return showToast("Selecciona una fecha", "error");
    if (!newFeriadoMotivo.trim()) return showToast("Ingresa el motivo del cierre", "error");

    const updated = [...diasFeriados, { fecha: newFeriadoFecha, motivo: newFeriadoMotivo.trim() }];
    setDiasFeriados(updated);
    setNewFeriadoFecha('');
    setNewFeriadoMotivo('');
    showToast("Fecha de cierre programada 📅");
  };

  const handleDeleteFeriado = (index) => {
    setDiasFeriados(diasFeriados.filter((_, i) => i !== index));
    showToast("Fecha de cierre eliminada");
  };

  // Guardar configuración general
  const handleSave = async (e) => {
    e?.preventDefault();
    if (!activeRestaurant?.id) return;

    setSaving(true);
    try {
      const finalCuisine = tipoCocinaPreset === 'OTRO' ? tipoCocinaCustom.trim() : tipoCocinaPreset;

      const payload = {
        nombre,
        ruc,
        telefono,
        direccion,
        acepta_reservas: aceptaReservas,
        bot_nombre: botNombre,
        bot_tono: botTono,
        bot_emojis: botEmojis,
        tipo_cocina: finalCuisine,
        valores_diferenciales: valoresDiferenciales,
        politicas_negocio: politicasNegocio,
        instrucciones_ia: instruccionesIa,
        horarios_semanales: horariosSemanales,
        dias_feriados: diasFeriados,
        mensaje_fuera_horario: mensajeFueraHorario,
        cierre_emergencia_activo: cierreEmergenciaActivo,
        cierre_emergencia_motivo: cierreEmergenciaMotivo,
        yape_numero: yapeNumero,
        yape_titular: yapeTitular,
        plin_numero: plinNumero,
        color_primario: colorPrimario,
        color_secundario: colorSecundario,
        delivery_tipo_calculo: tipoCalculo,
        latitud: parseFloat(lat),
        longitud: parseFloat(lng),
        delivery_tarifa_base: parseFloat(tarifaBase),
        delivery_km_base: parseFloat(kmBase),
        delivery_costo_km_adicional: parseFloat(costoKmAdicional),
        delivery_cobertura_maxima_km: parseFloat(coberturaMaximaKm),
        delivery_pedido_minimo_global: parseFloat(pedidoMinimoGlobal),
        delivery_envio_gratis_desde_global: parseFloat(envioGratisDesdeGlobal),
      };

      // Actualizar CSS global al guardar
      document.documentElement.style.setProperty('--color-primary', colorPrimario);
      document.documentElement.style.setProperty('--color-secondary', colorSecundario);

      const { error } = await supabase
        .from('restaurantes')
        .update(payload)
        .eq('id', activeRestaurant.id);

      if (error) throw error;
      showToast("¡Configuración guardada correctamente! 🌿");
    } catch (err) {
      console.error(err);
      showToast("Error al guardar cambios: " + err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  // Agregar personal
  const handleAddStaff = async (e) => {
    e.preventDefault();
    if (!newStaffNombre.trim()) return showToast("Ingresa el nombre del trabajador", "error");
    if (!activeRestaurant?.id) return;

    setAddingStaff(true);
    try {
      const { data, error } = await supabase
        .from('personal')
        .insert([{
          restaurante_id: activeRestaurant.id,
          nombre: newStaffNombre.trim(),
          telefono: newStaffTelefono.trim(),
          rol: newStaffRol,
          pin_acceso: newStaffPin.trim() || '1234',
          modulos_permitidos: newStaffPermisos,
          activo: true
        }])
        .select()
        .single();

      if (error) throw error;

      setStaffList([...staffList, data]);
      setNewStaffNombre('');
      setNewStaffTelefono('');
      setNewStaffRol('camarero');
      setNewStaffPin('1234');
      setNewStaffPermisos(DEFAULT_ROLE_PERMISSIONS.camarero);
      showToast("Trabajador agregado con éxito 👥");

    } catch (err) {
      console.error(err);
      showToast("Error al agregar personal: " + err.message, "error");
    } finally {
      setAddingStaff(false);
    }
  };

  const handleToggleStaff = async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from('personal')
        .update({ activo: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      setStaffList(staffList.map(s => s.id === id ? { ...s, activo: !currentStatus } : s));
      showToast("Estado de trabajador actualizado");
    } catch (err) {
      showToast("Error al actualizar personal", "error");
    }
  };

  const handleDeleteStaff = async (id) => {
    if (!confirm("¿Eliminar este registro de personal?")) return;
    try {
      const { error } = await supabase
        .from('personal')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setStaffList(staffList.filter(s => s.id !== id));
      showToast("Personal eliminado");
    } catch (err) {
      showToast("Error al eliminar", "error");
    }
  };

  // Generar vista previa del simulador del Bot
  const getBotPreview = () => {
    const finalCuisine = tipoCocinaPreset === 'OTRO' ? (tipoCocinaCustom || 'Especialidades culinarias') : tipoCocinaPreset;
    const emojiMap = { ninguno: '', moderado: '🌱 🥑', alto: '🌱 🥑 🥗 🍔 💚' };
    const emojis = emojiMap[botEmojis] || '🌱';
    const isFormal = botTono === 'cercano_formal' || botTono === 'elegante';

    if (cierreEmergenciaActivo) {
      return `🛑 Atento aviso: ${cierreEmergenciaMotivo}`;
    }

    return isFormal
      ? `¡Buenas tardes! Le saluda ${botNombre}, su asistente de atención en ${nombre || 'el restaurante'}. Nos especializamos en ${finalCuisine}. ¿En qué le podemos atender el día de hoy? ${emojis}`
      : `¡Hola! 👋 Soy ${botNombre}, tu sumiller y asistente en ${nombre || 'el restaurante'}. ¡Qué gusto saludarte! ${emojis} Nos especializamos en ${finalCuisine}. ¿Qué se te antoja pedir hoy?`;
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-muted)' }}>
        <p style={{ fontWeight: 700 }}>Cargando información de Mi Restaurante...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 60 }}>
      {/* Toast alert */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          background: toast.type === 'error' ? '#D90429' : 'var(--color-primary)',
          color: '#fff', padding: '12px 20px', borderRadius: 14,
          fontWeight: 800, fontSize: 13, boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          animation: 'fade-in 0.2s ease-out'
        }}>
          {toast.msg}
        </div>
      )}

      {/* Header del Módulo */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 26 }}>🏪</span>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 24, fontWeight: 900, color: 'var(--color-on-surface)', margin: 0 }}>
            Mi Restaurante
          </h1>
        </div>
        <p style={{ fontSize: 13, color: 'var(--color-muted)', margin: 0 }}>
          Administra el perfil de tu negocio, ajusta la personalidad de tu Asistente IA, configura Horarios por turnos y Delivery GPS.
        </p>
      </div>

      {/* Alerta de Cierre de Emergencia Activo */}
      {cierreEmergenciaActivo && (
        <div style={{
          background: 'rgba(217,4,41,0.15)', border: '1.5px solid #D90429',
          borderRadius: 16, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 22 }}>🚨</span>
            <div>
              <p style={{ fontSize: 14, fontWeight: 900, color: '#D90429', margin: 0 }}>
                CIERRE DE EMERGENCIA ACTIVO
              </p>
              <p style={{ fontSize: 12, color: 'var(--color-on-surface)', margin: 0 }}>
                El Bot pausará la toma de pedidos informando: "{cierreEmergenciaMotivo}"
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { setCierreEmergenciaActivo(false); handleSave(); }}
            style={{
              padding: '8px 14px', borderRadius: 10, background: '#D90429', color: '#fff',
              border: 'none', fontWeight: 800, fontSize: 12, cursor: 'pointer', flexShrink: 0
            }}
          >
            Reabrir Ahora
          </button>
        </div>
      )}

      {/* Navegación por Sub-pestañas */}
      <div style={{
        display: 'flex', gap: 8, background: 'var(--color-surface-2)',
        padding: 6, borderRadius: 16, border: '1px solid var(--color-surface-3)',
        overflowX: 'auto'
      }}>
        {[
          { id: 'perfil', label: '🏢 Datos Negocio' },
          { id: 'apariencia', label: '🎨 Apariencia & Nicho' },
          { id: 'modulos', label: '🧩 Módulos SaaS' },
          { id: 'ia', label: '🤖 Perfil IA' },
          { id: 'horarios', label: '🕒 Horarios & Calendario' },
          { id: 'delivery', label: '🛵 Delivery & GPS' },
          { id: 'personal', label: '👥 Personal & Equipo' },
          { id: 'pagos', label: '💳 Métodos de Pago' },
        ].map(tab => {
          const active = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              style={{
                flex: 1, minWidth: 120, padding: '10px 14px', borderRadius: 12,
                background: active ? 'var(--color-surface)' : 'transparent',
                border: active ? '1px solid var(--color-surface-3)' : '1px solid transparent',
                color: active ? 'var(--color-primary)' : 'var(--color-muted)',
                fontWeight: active ? 800 : 600, fontSize: 13, cursor: 'pointer',
                transition: 'all 150ms', whiteSpace: 'nowrap'
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* PESTAÑA 1: DATOS DEL NEGOCIO */}
      {/* ────────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'perfil' && (
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{
            background: 'var(--color-surface-2)', padding: 24, borderRadius: 20,
            border: '1px solid var(--color-surface-3)', display: 'flex', flexDirection: 'column', gap: 16
          }}>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--color-on-surface)' }}>
              Información Comercial y Operativa
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                  Nombre del Restaurante
                </label>
                <input
                  className="input-field"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  placeholder="Ej. Suna Gourmet"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                  RUC / NIT
                </label>
                <input
                  className="input-field"
                  value={ruc}
                  onChange={e => setRuc(e.target.value)}
                  placeholder="Ej. 20600000001"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                  WhatsApp Oficial de Pedidos
                </label>
                <input
                  className="input-field"
                  value={telefono}
                  onChange={e => setTelefono(e.target.value)}
                  placeholder="Ej. +51900000000"
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                Dirección Física del Local
              </label>
              <input
                className="input-field"
                value={direccion}
                onChange={e => setDireccion(e.target.value)}
                placeholder="Ej. Av. Primavera 456, San Borja, Lima"
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8, padding: 12, background: 'var(--color-surface)', borderRadius: 14, border: '1px solid var(--color-surface-3)' }}>
              <input
                type="checkbox"
                id="aceptaReservas"
                checked={aceptaReservas}
                onChange={e => setAceptaReservas(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: 'var(--color-primary)', cursor: 'pointer' }}
              />
              <label htmlFor="aceptaReservas" style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-on-surface)', cursor: 'pointer' }}>
                Habilitar sistema de Reservas de Mesas vía WhatsApp
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="btn-primary"
            style={{ padding: '14px 24px', alignSelf: 'flex-end', fontWeight: 800 }}
          >
            {saving ? 'Guardando...' : 'Guardar Cambios del Perfil'}
          </button>
        </form>
      )}

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* PESTAÑA 2: ASISTENTE IA Y PROMPT */}
      {/* ────────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'ia' && (
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{
            background: 'var(--color-surface-2)', padding: 24, borderRadius: 20,
            border: '1px solid var(--color-surface-3)', display: 'flex', flexDirection: 'column', gap: 16
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--color-on-surface)' }}>
                Personalidad del Chatbot IA (WhatsApp)
              </h3>
              <span style={{ fontSize: 11, padding: '4px 10px', background: 'rgba(216,243,220,0.15)', color: 'var(--color-primary)', borderRadius: 20, fontWeight: 800 }}>
                En Vivo con Supabase & n8n
              </span>
            </div>

            {/* Simulador de Respuesta */}
            <div style={{
              background: 'linear-gradient(135deg, #1B4332 0%, #0F2A1F 100%)',
              padding: 16, borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex', flexDirection: 'column', gap: 6
            }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(216,243,220,0.6)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                🤖 Simulador en Tiempo Real de Saludo
              </span>
              <p style={{ fontSize: 13, color: '#D8F3DC', fontWeight: 600, margin: 0, lineHeight: 1.5 }}>
                "{getBotPreview()}"
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                  Nombre del Asistente Virtual
                </label>
                <input
                  className="input-field"
                  value={botNombre}
                  onChange={e => setBotNombre(e.target.value)}
                  placeholder="Ej. Mr. Green"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                  Tono de Conversación
                </label>
                <select
                  className="input-field"
                  value={botTono}
                  onChange={e => setBotTono(e.target.value)}
                >
                  <option value="cercano_informal">💬 Cercano e Informal (Cálido y amigable)</option>
                  <option value="cercano_formal">👔 Cercano y Formal (Respetuoso / Usted)</option>
                  <option value="juvenil_divertido">⚡ Juvenil y Divertido (Dinámico y entusiasta)</option>
                  <option value="elegante">✨ Elegante & Gourmet (Distinguido y refinado)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                  Uso de Emojis
                </label>
                <select
                  className="input-field"
                  value={botEmojis}
                  onChange={e => setBotEmojis(e.target.value)}
                >
                  <option value="ninguno">🚫 Ninguno (Texto corporativo estándar)</option>
                  <option value="moderado">🌿 Moderado / Balanceado (1 a 2 por mensaje)</option>
                  <option value="alto">🥑 Alto / Expresivo (Abundante temática gastronómica)</option>
                </select>
              </div>
            </div>

            {/* Tipo de Cocina */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                Tipo de Cocina / Concepto del Negocio
              </label>
              <select
                className="input-field"
                value={tipoCocinaPreset}
                onChange={e => setTipoCocinaPreset(e.target.value)}
                style={{ marginBottom: tipoCocinaPreset === 'OTRO' ? 10 : 0 }}
              >
                {PREDEFINED_CUISINES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
                <option value="OTRO">✏️ Otro (Especificar concepto personalizado...)</option>
              </select>

              {tipoCocinaPreset === 'OTRO' && (
                <input
                  className="input-field"
                  value={tipoCocinaCustom}
                  onChange={e => setTipoCocinaCustom(e.target.value)}
                  placeholder="Escribe tu concepto exacto (Ej: Poke Bowls & Comida Hawayana, Dark Kitchen Tex-Mex...)"
                  required
                />
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                Valores & Diferenciales Destacados
              </label>
              <textarea
                className="input-field"
                rows="3"
                value={valoresDiferenciales}
                onChange={e => setValoresDiferenciales(e.target.value)}
                placeholder="Ej. Insumos 100% orgánicos de agricultores locales, empaques eco-friendly biodegradables, sin azúcar refinada."
                style={{ resize: 'vertical' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                Políticas del Negocio & Reclamos (El Bot las leerá para responder)
              </label>
              <textarea
                className="input-field"
                rows="3"
                value={politicasNegocio}
                onChange={e => setPoliticasNegocio(e.target.value)}
                placeholder="Ej. No se admiten cancelaciones si la orden ya está en la cocina. Ante insumos con alérgenos, siempre derivar con la cocina."
                style={{ resize: 'vertical' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                Instrucciones & Reglas Especiales para la IA
              </label>
              <textarea
                className="input-field"
                rows="3"
                value={instruccionesIa}
                onChange={e => setInstruccionesIa(e.target.value)}
                placeholder="Ej. Recordar a los clientes ofrecer la bebida de temporada. Si piden opciones celíacas, destacar la sección sin gluten de la carta."
                style={{ resize: 'vertical' }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="btn-primary"
            style={{ padding: '14px 24px', alignSelf: 'flex-end', fontWeight: 800 }}
          >
            {saving ? 'Actualizando IA...' : 'Guardar Perfil de IA'}
          </button>
        </form>
      )}

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* PESTAÑA 3: HORARIOS Y CALENDARIO */}
      {/* ────────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'horarios' && (
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Botón Cierre Inmediato de Emergencia */}
          <div style={{
            background: cierreEmergenciaActivo ? 'rgba(217,4,41,0.15)' : 'var(--color-surface-2)',
            padding: 20, borderRadius: 20, border: `1.5px solid ${cierreEmergenciaActivo ? '#D90429' : 'var(--color-surface-3)'}`,
            display: 'flex', flexDirection: 'column', gap: 14
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 16, fontWeight: 800, margin: 0, color: cierreEmergenciaActivo ? '#D90429' : 'var(--color-on-surface)' }}>
                  🚨 Cierre Inmediato de Emergencia / Evento Privado
                </h3>
                <p style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 2 }}>
                  Usa este botón si debes cerrar la cocina de golpe por hoy (lluvia, falla eléctrica, evento privado o falta de insumos).
                </p>
              </div>

              <button
                type="button"
                onClick={() => setCierreEmergenciaActivo(!cierreEmergenciaActivo)}
                style={{
                  padding: '10px 18px', borderRadius: 12, cursor: 'pointer', fontWeight: 900, fontSize: 13, border: 'none',
                  background: cierreEmergenciaActivo ? '#D90429' : 'rgba(217,4,41,0.1)',
                  color: cierreEmergenciaActivo ? '#fff' : '#D90429', transition: 'all 150ms'
                }}
              >
                {cierreEmergenciaActivo ? '🔴 Cierre Activo (Click para Reabrir)' : '⚪ Activar Cierre Temporal Hoy'}
              </button>
            </div>

            {cierreEmergenciaActivo && (
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#D90429', textTransform: 'uppercase', marginBottom: 6 }}>
                  Motivo que la IA comunicará a los clientes
                </label>
                <input
                  className="input-field"
                  value={cierreEmergenciaMotivo}
                  onChange={e => setCierreEmergenciaMotivo(e.target.value)}
                  placeholder="Ej. Hoy estamos cerrados por evento privado. ¡Volvemos mañana!"
                />
              </div>
            )}
          </div>

          {/* Plantillas Rápidas de Horario */}
          <div style={{
            background: 'var(--color-surface-2)', padding: 20, borderRadius: 20,
            border: '1px solid var(--color-surface-3)', display: 'flex', flexDirection: 'column', gap: 12
          }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              ⚡ Plantillas Rápidas de Horarios por Tipo de Negocio
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
              <button
                type="button"
                onClick={() => applyPresetHorarios('cafeteria')}
                style={{
                  padding: '12px 14px', borderRadius: 14, background: 'var(--color-surface)',
                  border: '1px solid var(--color-surface-3)', cursor: 'pointer', textAlign: 'left',
                  transition: 'all 150ms'
                }}
              >
                <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-on-surface)', margin: 0 }}>☕ Cafetería / Bakery</p>
                <p style={{ fontSize: 10, color: 'var(--color-muted)', margin: 0, marginTop: 2 }}>7:00 AM – 7:00 PM (Corrido)</p>
              </button>

              <button
                type="button"
                onClick={() => applyPresetHorarios('restaurante')}
                style={{
                  padding: '12px 14px', borderRadius: 14, background: 'var(--color-surface)',
                  border: '1px solid var(--color-surface-3)', cursor: 'pointer', textAlign: 'left',
                  transition: 'all 150ms'
                }}
              >
                <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-on-surface)', margin: 0 }}>🍲 Restaurante Tradicional</p>
                <p style={{ fontSize: 10, color: 'var(--color-muted)', margin: 0, marginTop: 2 }}>12 PM-4 PM / 7 PM-11 PM (2 Turnos)</p>
              </button>

              <button
                type="button"
                onClick={() => applyPresetHorarios('nocturno')}
                style={{
                  padding: '12px 14px', borderRadius: 14, background: 'var(--color-surface)',
                  border: '1px solid var(--color-surface-3)', cursor: 'pointer', textAlign: 'left',
                  transition: 'all 150ms'
                }}
              >
                <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-on-surface)', margin: 0 }}>🍕 Fast Food Nocturno</p>
                <p style={{ fontSize: 10, color: 'var(--color-muted)', margin: 0, marginTop: 2 }}>5:00 PM – 12:00 AM (Corrido)</p>
              </button>
            </div>
          </div>

          {/* Horarios por Día de la Semana */}
          <div style={{
            background: 'var(--color-surface-2)', padding: 24, borderRadius: 20,
            border: '1px solid var(--color-surface-3)', display: 'flex', flexDirection: 'column', gap: 16
          }}>
            <div>
              <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--color-on-surface)' }}>
                Horarios Semanales & Días Fijos de Descanso
              </h3>
              <p style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 4 }}>
                Soporta desde aperturas tempranas (06:00 AM) hasta cierres nocturnos, con turnos divididos o jornadas corridas.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {DIAS_SEMANA.map(({ key, label }) => {
                const dayConfig = horariosSemanales[key] || { activo: true, t1_open: '08:00', t1_close: '20:00', dosTurnos: false };
                return (
                  <div key={key} style={{
                    background: 'var(--color-surface)', padding: 16, borderRadius: 16,
                    border: `1.5px solid ${dayConfig.activo ? 'var(--color-surface-3)' : 'rgba(239,68,68,0.25)'}`,
                    display: 'flex', flexDirection: 'column', gap: 12
                  }}>
                    {/* Header Día + Switch */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-on-surface)' }}>{label}</span>
                        <span style={{
                          fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 10,
                          background: dayConfig.activo ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                          color: dayConfig.activo ? '#10B981' : '#EF4444'
                        }}>
                          {dayConfig.activo ? 'Abierto 🟢' : '🔒 Día Fijo de Descanso del Personal'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {dayConfig.activo && (
                          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={!!dayConfig.dosTurnos}
                              onChange={e => updateHorarioDay(key, 'dosTurnos', e.target.checked)}
                              style={{ marginRight: 6, accentColor: 'var(--color-primary)' }}
                            />
                            Turno Dividido (Pausa de Almuerzo / Descanso)
                          </label>
                        )}

                        <button
                          type="button"
                          onClick={() => updateHorarioDay(key, 'activo', !dayConfig.activo)}
                          style={{
                            padding: '6px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
                            background: dayConfig.activo ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
                            color: dayConfig.activo ? '#EF4444' : '#10B981', fontWeight: 800, fontSize: 12
                          }}
                        >
                          {dayConfig.activo ? 'Marcar Descanso Fijo' : 'Habilitar Día'}
                        </button>
                      </div>
                    </div>

                    {/* Inputs de Horas de Turno */}
                    {dayConfig.activo && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 6, borderTop: '1px dashed var(--color-surface-3)' }}>
                        {/* Turno 1 */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-muted)', width: 110 }}>
                            {dayConfig.dosTurnos ? 'Turno 1 (Mañana/Almuerzo):' : 'Jornada Completa:'}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>Abre:</span>
                            <input
                              type="time" className="input-field" style={{ width: 115, padding: '6px 10px' }}
                              value={dayConfig.t1_open || '08:00'}
                              onChange={e => updateHorarioDay(key, 't1_open', e.target.value)}
                            />
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>Cierra/Pausa:</span>
                            <input
                              type="time" className="input-field" style={{ width: 115, padding: '6px 10px' }}
                              value={dayConfig.t1_close || '16:00'}
                              onChange={e => updateHorarioDay(key, 't1_close', e.target.value)}
                            />
                          </div>
                        </div>

                        {/* Turno 2 (si aplica) */}
                        {dayConfig.dosTurnos && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-muted)', width: 110 }}>
                              Turno 2 (Tarde/Cena):
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>Reabre:</span>
                              <input
                                type="time" className="input-field" style={{ width: 115, padding: '6px 10px' }}
                                value={dayConfig.t2_open || '19:00'}
                                onChange={e => updateHorarioDay(key, 't2_open', e.target.value)}
                              />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>Cierra final:</span>
                              <input
                                type="time" className="input-field" style={{ width: 115, padding: '6px 10px' }}
                                value={dayConfig.t2_close || '23:00'}
                                onChange={e => updateHorarioDay(key, 't2_close', e.target.value)}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Mensaje Automático Fuera de Horario */}
            <div style={{ marginTop: 12 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                Mensaje Automático de la IA fuera de Horario
              </label>
              <textarea
                className="input-field"
                rows="3"
                value={mensajeFueraHorario}
                onChange={e => setMensajeFueraHorario(e.target.value)}
                placeholder="Ej. ¡Gracias por escribirnos! Nuestra cocina está actualmente en descanso. Te responderemos apenas abramos a primera hora."
                style={{ resize: 'vertical' }}
              />
            </div>
          </div>

          {/* Días Feriados / Cierres Especiales */}
          <div style={{
            background: 'var(--color-surface-2)', padding: 24, borderRadius: 20,
            border: '1px solid var(--color-surface-3)', display: 'flex', flexDirection: 'column', gap: 16
          }}>
            <div>
              <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--color-on-surface)' }}>
                Días Feriados & Cierres Programados 🗓️
              </h3>
              <p style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 4 }}>
                Programa fechas específicas donde el local permanecerá cerrado (Navidad, Año Nuevo, mantenimiento, etc.).
              </p>
            </div>

            {/* Agregar Feriado */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <input
                type="date"
                className="input-field"
                style={{ width: 180 }}
                value={newFeriadoFecha}
                onChange={e => setNewFeriadoFecha(e.target.value)}
              />
              <input
                className="input-field"
                style={{ flex: 1, minWidth: 200 }}
                placeholder="Motivo del cierre (Ej. Feriado de Navidad)"
                value={newFeriadoMotivo}
                onChange={e => setNewFeriadoMotivo(e.target.value)}
              />
              <button type="button" onClick={handleAddFeriado} className="btn-primary" style={{ padding: '10px 18px', fontSize: 13 }}>
                + Agregar Fecha
              </button>
            </div>

            {/* Lista de Feriados */}
            {diasFeriados.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                {diasFeriados.map((f, idx) => (
                  <div key={idx} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', background: 'var(--color-surface)', borderRadius: 12,
                    border: '1px solid var(--color-surface-3)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-primary)' }}>{f.fecha}</span>
                      <span style={{ fontSize: 13, color: 'var(--color-on-surface)', fontWeight: 600 }}>— {f.motivo}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteFeriado(idx)}
                      style={{ background: 'transparent', border: 'none', color: '#EF4444', fontWeight: 800, cursor: 'pointer', fontSize: 12 }}
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="btn-primary"
            style={{ padding: '14px 24px', alignSelf: 'flex-end', fontWeight: 800 }}
          >
            {saving ? 'Guardando...' : 'Guardar Horarios & Calendario'}
          </button>
        </form>
      )}

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* PESTAÑA 4: DELIVERY & GPS */}
      {/* ────────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'delivery' && (
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{
            background: 'var(--color-surface-2)', padding: 24, borderRadius: 20,
            border: '1px solid var(--color-surface-3)', display: 'flex', flexDirection: 'column', gap: 20
          }}>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--color-on-surface)' }}>
              Configuración de Logística de Envíos & GPS
            </h3>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
                Modo de Cálculo de Tarifa de Envío
              </label>
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setTipoCalculo('zonas')}
                  style={{
                    flex: 1, padding: '12px', borderRadius: 14, cursor: 'pointer',
                    background: tipoCalculo === 'zonas' ? 'var(--color-surface)' : 'transparent',
                    border: `1.5px solid ${tipoCalculo === 'zonas' ? 'var(--color-primary)' : 'var(--color-surface-3)'}`,
                    color: tipoCalculo === 'zonas' ? 'var(--color-primary)' : 'var(--color-muted)',
                    fontWeight: 800, fontSize: 13
                  }}
                >
                  📍 Por Zonas / Distritos
                </button>
                <button
                  type="button"
                  onClick={() => setTipoCalculo('distancia')}
                  style={{
                    flex: 1, padding: '12px', borderRadius: 14, cursor: 'pointer',
                    background: tipoCalculo === 'distancia' ? 'var(--color-surface)' : 'transparent',
                    border: `1.5px solid ${tipoCalculo === 'distancia' ? 'var(--color-primary)' : 'var(--color-surface-3)'}`,
                    color: tipoCalculo === 'distancia' ? 'var(--color-primary)' : 'var(--color-muted)',
                    fontWeight: 800, fontSize: 13
                  }}
                >
                  📏 Por Distancia GPS (Km)
                </button>
              </div>
            </div>

            {/* Mapa Leaflet GPS */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                Ubicación del Local en el Mapa (Lat: {lat}, Lng: {lng})
              </label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <input
                  className="input-field"
                  value={mapSearch}
                  onChange={e => setMapSearch(e.target.value)}
                  placeholder="Buscar dirección en el mapa..."
                  style={{ flex: 1 }}
                />
                <button type="button" onClick={handleMapSearch} className="btn-primary" style={{ padding: '8px 16px', fontSize: 13 }}>
                  Buscar 🔍
                </button>
              </div>
              <div
                ref={mapContainerRef}
                style={{ width: '100%', height: 260, borderRadius: 16, border: '1px solid var(--color-surface-3)', overflow: 'hidden' }}
              />
            </div>

            {/* Parámetros de envío por Km */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                  Tarifa Base (S/.)
                </label>
                <input
                  type="number" step="0.5" className="input-field"
                  value={tarifaBase} onChange={e => setTarifaBase(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                  Km Base Incluidos
                </label>
                <input
                  type="number" step="0.5" className="input-field"
                  value={kmBase} onChange={e => setKmBase(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                  Costo por Km Adicional (S/.)
                </label>
                <input
                  type="number" step="0.5" className="input-field"
                  value={costoKmAdicional} onChange={e => setCostoKmAdicional(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                  Cobertura Máxima (Km)
                </label>
                <input
                  type="number" step="1" className="input-field"
                  value={coberturaMaximaKm} onChange={e => setCoberturaMaximaKm(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                  Pedido Mínimo Global (S/.)
                </label>
                <input
                  type="number" step="5" className="input-field"
                  value={pedidoMinimoGlobal} onChange={e => setPedidoMinimoGlobal(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                  Envío Gratis Desde (S/.)
                </label>
                <input
                  type="number" step="10" className="input-field"
                  value={envioGratisDesdeGlobal} onChange={e => setEnvioGratisDesdeGlobal(e.target.value)}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="btn-primary"
            style={{ padding: '14px 24px', alignSelf: 'flex-end', fontWeight: 800 }}
          >
            {saving ? 'Guardando...' : 'Guardar Parámetros de Delivery'}
          </button>
        </form>
      )}

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* PESTAÑA 5: PERSONAL Y EQUIPO */}
      {/* ────────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'personal' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <form onSubmit={handleAddStaff} style={{
            background: 'var(--color-surface-2)', padding: 20, borderRadius: 20,
            border: '1px solid var(--color-surface-3)', display: 'flex', flexDirection: 'column', gap: 14
          }}>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--color-on-surface)' }}>
              Agregar Miembro al Equipo & Configurar Permisos
            </h3>


            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                  Nombre Completo
                </label>
                <input
                  className="input-field"
                  value={newStaffNombre}
                  onChange={e => setNewStaffNombre(e.target.value)}
                  placeholder="Ej. Juan Pérez"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                  Teléfono / WhatsApp
                </label>
                <input
                  className="input-field"
                  value={newStaffTelefono}
                  onChange={e => setNewStaffTelefono(e.target.value)}
                  placeholder="Ej. 987654321"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                  Rol Base
                </label>
                <select
                  className="input-field"
                  value={newStaffRol}
                  onChange={e => handleRoleChange(e.target.value)}
                >
                  <option value="admin">👑 Administrador (Acceso Total)</option>
                  <option value="camarero">🏃 Mozo / Camarero (Salón & Comandas)</option>
                  <option value="cocina">👨‍🍳 Jefe de Cocina (KDS & Carta)</option>
                  <option value="cajero">💵 Cajero (Órdenes & Arqueo)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                  PIN de Acceso Rápido (4 dígitos)
                </label>
                <input
                  type="text"
                  maxLength={4}
                  className="input-field"
                  value={newStaffPin}
                  onChange={e => setNewStaffPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Ej. 1234"
                  required
                />
              </div>
            </div>

            {/* Matriz Granular de Módulos (Mobile-First Grid) */}
            <div style={{
              background: 'var(--color-surface)', padding: 16, borderRadius: 16,
              border: '1px solid var(--color-surface-3)', display: 'flex', flexDirection: 'column', gap: 10
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-on-surface)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  🔒 Matriz de Permisos por Módulo ({newStaffPermisos.length}/{ALL_MODULES.length})
                </span>
                <span style={{ fontSize: 10, color: 'var(--color-muted)' }}>
                  Tilda los módulos que podrá ver este empleado
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 8 }}>
                {ALL_MODULES.map(m => {
                  const checked = newStaffPermisos.includes(m.id);
                  const isSensitive = m.id === 'finanzas' || m.id === 'restaurante';
                  return (
                    <label key={m.id} style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 10,
                      background: checked ? (isSensitive ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)') : 'var(--color-surface-2)',
                      border: `1px solid ${checked ? (isSensitive ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)') : 'var(--color-surface-3)'}`,
                      cursor: 'pointer', transition: 'all 120ms'
                    }}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleModulePermission(m.id)}
                        style={{ accentColor: isSensitive ? '#EF4444' : 'var(--color-primary)', width: 16, height: 16 }}
                      />
                      <span style={{ fontSize: 11, fontWeight: checked ? 800 : 500, color: checked ? 'var(--color-on-surface)' : 'var(--color-muted)' }}>
                        {m.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={addingStaff}
              className="btn-primary"
              style={{ alignSelf: 'flex-end', padding: '10px 20px', fontWeight: 800 }}
            >
              {addingStaff ? 'Guardando...' : '+ Guardar Trabajador'}
            </button>
          </form>

          {/* Listado de Personal Registrado */}
          <div style={{
            background: 'var(--color-surface-2)', padding: 20, borderRadius: 20,
            border: '1px solid var(--color-surface-3)', display: 'flex', flexDirection: 'column', gap: 14
          }}>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--color-on-surface)' }}>
              Equipo Registrado & Accesos ({staffList.length})
            </h3>

            {staffList.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--color-muted)', margin: 0, textAlign: 'center', padding: 20 }}>
                Aún no has registrado trabajadores para este restaurante.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {staffList.map(s => {
                  const allowedMods = Array.isArray(s.modulos_permitidos) ? s.modulos_permitidos : [];
                  return (
                    <div key={s.id} style={{
                      display: 'flex', flexDirection: 'column', gap: 10,
                      padding: '14px 16px', background: 'var(--color-surface)', borderRadius: 16,
                      border: '1px solid var(--color-surface-3)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{
                            width: 40, height: 40, borderRadius: 12, background: 'var(--color-surface-3)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20
                          }}>
                            {s.rol === 'admin' ? '👑' : s.rol === 'cocina' ? '👨‍🍳' : s.rol === 'cajero' ? '💵' : '🏃'}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-on-surface)', margin: 0 }}>
                                {s.nombre}
                              </p>
                              <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 8, background: 'var(--color-surface-3)', color: 'var(--color-primary)' }}>
                                PIN: {s.pin_acceso || '1234'}
                              </span>
                            </div>
                            <p style={{ fontSize: 11, color: 'var(--color-muted)', margin: 0, marginTop: 2 }}>
                              Rol: <span style={{ fontWeight: 700, textTransform: 'capitalize' }}>{s.rol}</span> · {s.telefono || 'Sin teléfono'}
                            </p>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <button
                            onClick={() => handleToggleStaff(s.id, s.activo)}
                            style={{
                              padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                              background: s.activo ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                              color: s.activo ? '#10B981' : '#EF4444', fontWeight: 800, fontSize: 11
                            }}
                          >
                            {s.activo ? 'Activo' : 'Inactivo'}
                          </button>
                          <button
                            onClick={() => handleDeleteStaff(s.id)}
                            style={{
                              padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)',
                              background: 'transparent', color: '#EF4444', fontWeight: 800, fontSize: 12, cursor: 'pointer'
                            }}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>

                      {/* Lista de Módulos Habilitados para este Empleado */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, paddingTop: 6, borderTop: '1px dashed var(--color-surface-3)' }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--color-muted)', marginRight: 4 }}>
                          Módulos visibles:
                        </span>
                        {allowedMods.length === 0 ? (
                          <span style={{ fontSize: 10, color: '#EF4444', fontWeight: 700 }}>Ningún módulo asignado</span>
                        ) : (
                          allowedMods.map(mId => {
                            const modObj = ALL_MODULES.find(m => m.id === mId);
                            return (
                              <span key={mId} style={{
                                fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 6,
                                background: 'var(--color-surface-2)', color: 'var(--color-on-surface)',
                                border: '1px solid var(--color-surface-3)'
                              }}>
                                {modObj ? modObj.label.split(' ')[0] + ' ' + modObj.label.split(' ')[1] : mId}
                              </span>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      )}

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* PESTAÑA: APARIENCIA & NICHO */}
      {/* ────────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'apariencia' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Bloque 1: Nicho de Negocio (Asignado por el Plan / SuperAdmin) */}
          <div style={{
            background: 'var(--color-surface-2)', padding: 24, borderRadius: 20,
            border: '1px solid var(--color-surface-3)', display: 'flex', flexDirection: 'column', gap: 16
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--color-on-surface)' }}>
                  📌 Nicho y Preset de tu Negocio
                </h3>
                <span style={{
                  fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 8,
                  background: '#10B98120', color: '#10B981', border: '1px solid #10B98140'
                }}>
                  🔒 Asignado por Administración / Plan
                </span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--color-muted)', margin: '6px 0 0' }}>
                Tu cuenta está configurada en la modalidad <strong>{getPresetConfig(nichoSeleccionado).nombre}</strong>. Los términos de menú, botones y flujos del sistema están optimizados para este sector.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              {Object.values(NICHOS_CONFIG).map(nicho => {
                const isSelected = nichoSeleccionado === nicho.id;
                return (
                  <div
                    key={nicho.id}
                    style={{
                      padding: 16, borderRadius: 16,
                      background: isSelected ? 'var(--color-surface)' : 'rgba(0,0,0,0.1)',
                      border: `2px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-surface-3)'}`,
                      display: 'flex', flexDirection: 'column', gap: 8, transition: 'all 200ms ease',
                      opacity: isSelected ? 1 : 0.55,
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 14, fontWeight: 900, color: 'var(--color-on-surface)' }}>
                        {nicho.nombre}
                      </span>
                      {isSelected && (
                        <span style={{
                          fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 8,
                          background: 'var(--color-primary)', color: '#fff'
                        }}>
                          ACTIVO
                        </span>
                      )}
                    </div>

                    <p style={{ fontSize: 11, color: 'var(--color-muted)', margin: 0, lineHeight: 1.4 }}>
                      {nicho.descripcion}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <div style={{ width: 14, height: 14, borderRadius: '50%', background: nicho.paletaRecomendada.primary }} />
                      <div style={{ width: 14, height: 14, borderRadius: '50%', background: nicho.paletaRecomendada.secondary }} />
                      <div style={{ width: 14, height: 14, borderRadius: '50%', background: nicho.paletaRecomendada.bg, border: '1px solid #ccc' }} />
                      <span style={{ fontSize: 10, color: 'var(--color-muted)', marginLeft: 4 }}>
                        {nicho.paletaRecomendada.mode === 'dark' ? '🌙 Modo Oscuro' : '☀️ Modo Claro'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bloque 2: Personalización Manual de Marca */}
          <div style={{
            background: 'var(--color-surface-2)', padding: 24, borderRadius: 20,
            border: '1px solid var(--color-surface-3)', display: 'flex', flexDirection: 'column', gap: 16
          }}>
            <div>
              <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--color-on-surface)' }}>
                🎛️ 2. Tuneo Manual de Paleta & Colores
              </h3>
              <p style={{ fontSize: 12, color: 'var(--color-muted)', margin: '4px 0 0' }}>
                Ajusta los colores exactos de tu marca. Estos colores se reflejarán en tu Carta Digital QR y Dashboard.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                  Color Primario (Botones / Destacados)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type="color"
                    value={colorPrimario}
                    onChange={e => setColorPrimario(e.target.value)}
                    style={{ width: 44, height: 38, border: 'none', borderRadius: 8, cursor: 'pointer', background: 'transparent' }}
                  />
                  <input
                    className="input-field"
                    value={colorPrimario}
                    onChange={e => setColorPrimario(e.target.value)}
                    style={{ textTransform: 'uppercase' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                  Color Secundario / Acentos
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type="color"
                    value={colorSecundario}
                    onChange={e => setColorSecundario(e.target.value)}
                    style={{ width: 44, height: 38, border: 'none', borderRadius: 8, cursor: 'pointer', background: 'transparent' }}
                  />
                  <input
                    className="input-field"
                    value={colorSecundario}
                    onChange={e => setColorSecundario(e.target.value)}
                    style={{ textTransform: 'uppercase' }}
                  />
                </div>
              </div>
            </div>

            {/* Aplicar Paleta Automática Sugerida y Guardar */}
            <div style={{ marginTop: 8, display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  const cfg = getPresetConfig(nichoSeleccionado);
                  setColorPrimario(cfg.paletaRecomendada.primary);
                  setColorSecundario(cfg.paletaRecomendada.secondary);
                  setModoOscuro(cfg.paletaRecomendada.mode === 'dark');
                  showToast('Paleta recomendada restaurada');
                }}
                style={{ fontSize: 12, padding: '8px 14px' }}
              >
                ✨ Restablecer Paleta Recomendada del Nicho
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="btn-primary"
                style={{ padding: '10px 20px', fontWeight: 800, fontSize: 13 }}
              >
                {saving ? 'Guardando...' : '💾 Guardar Cambios de Apariencia'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* PESTAÑA 6: MÉTODOS DE PAGO */}
      {/* ────────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'pagos' && (
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{
            background: 'var(--color-surface-2)', padding: 24, borderRadius: 20,
            border: '1px solid var(--color-surface-3)', display: 'flex', flexDirection: 'column', gap: 16
          }}>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--color-on-surface)' }}>
              Cuentas para Pagos Digitales (Yape / Plin)
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                  Número Yape
                </label>
                <input
                  className="input-field"
                  value={yapeNumero}
                  onChange={e => setYapeNumero(e.target.value)}
                  placeholder="Ej. 900000000"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                  Titular de la Cuenta Yape
                </label>
                <input
                  className="input-field"
                  value={yapeTitular}
                  onChange={e => setYapeTitular(e.target.value)}
                  placeholder="Ej. Suna Gourmet S.A.C."
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                  Número Plin
                </label>
                <input
                  className="input-field"
                  value={plinNumero}
                  onChange={e => setPlinNumero(e.target.value)}
                  placeholder="Ej. 900000000"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="btn-primary"
            style={{ padding: '14px 24px', alignSelf: 'flex-end', fontWeight: 800 }}
          >
            {saving ? 'Guardando...' : 'Guardar Datos de Pago'}
          </button>
        </form>
      )}

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* PESTAÑA MÓDULOS SAAS */}
      {/* ────────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'modulos' && <DashboardModulos />}
    </div>
  );
}
