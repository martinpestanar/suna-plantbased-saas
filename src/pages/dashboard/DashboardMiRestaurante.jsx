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
  const { activeRestaurant, restaurants, fetchRestaurants, selectRestaurant, session } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState('perfil'); // 'perfil' | 'ia' | 'horarios' | 'delivery' | 'personal' | 'pagos' | 'sucursales'
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // Form State: Sucursales
  const [nombreSucursal, setNombreSucursal] = useState('');
  const [direccionSucursal, setDireccionSucursal] = useState('');
  const [telefonoSucursal, setTelefonoSucursal] = useState('');
  const [slugSucursal, setSlugSucursal] = useState('');
  const [creandoSucursal, setCreandoSucursal] = useState(false);
  const [showNuevaSucursalModal, setShowNuevaSucursalModal] = useState(false);

  // Form State: Perfil Negocio
  const [nombre, setNombre] = useState('');
  const [ruc, setRuc] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [aceptaReservas, setAceptaReservas] = useState(false);

  // Form State: Marca & Multimedia QR
  const [logoUrl, setLogoUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [eslogan, setEslogan] = useState('');
  const [nichoSeleccionado, setNichoSeleccionado] = useState('plant_based');
  const [colorPrimario, setColorPrimario] = useState('#059669');
  const [colorSecundario, setColorSecundario] = useState('#10B981');

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
  const [zonaHoraria, setZonaHoraria] = useState('America/Lima');
  const [pais, setPais] = useState('PE');
  const [moneda, setMoneda] = useState('PEN');
  const [simboloMoneda, setSimboloMoneda] = useState('S/');
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
        setZonaHoraria(target.zona_horaria || 'America/Lima');
        setPais(target.pais || 'PE');
        setMoneda(target.moneda || 'PEN');
        setSimboloMoneda(target.simbolo_moneda || 'S/');
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

        // Marca & Multimedia
        setLogoUrl(target.logo_url || target.logo || '');
        setBannerUrl(target.banner_url || target.portada_url || '');
        setEslogan(target.eslogan || target.descripcion || '');

        const presetKey = target.nicho_preset || 'plant_based';
        setNichoSeleccionado(presetKey);
        const presetConfig = getPresetConfig(presetKey);

        const prim = target.color_primario || presetConfig.paletaRecomendada.primary;
        const sec = target.color_secundario || presetConfig.paletaRecomendada.secondary;
        setColorPrimario(prim);
        setColorSecundario(sec);

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

  // Handler Crear Sucursal
  const handleCrearSucursal = async (e) => {
    e.preventDefault();
    if (!nombreSucursal.trim()) {
      showToast('Ingresa el nombre de la sede', 'error');
      return;
    }
    setCreandoSucursal(true);
    try {
      const matrizId = activeRestaurant.parent_id || activeRestaurant.id;
      const cleanSlug = (slugSucursal || `${activeRestaurant.slug}-${nombreSucursal}`)
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-');

      const { data: nuevaRes, error: errRes } = await supabase
        .from('restaurantes')
        .insert([{
          nombre: activeRestaurant.nombre,
          nombre_sucursal: nombreSucursal.trim(),
          parent_id: matrizId,
          slug: cleanSlug,
          direccion: direccionSucursal.trim() || activeRestaurant.direccion || '',
          telefono: telefonoSucursal.trim() || activeRestaurant.telefono || '',
          nicho_preset: activeRestaurant.nicho_preset || 'plant_based',
          color_primario: activeRestaurant.color_primario || '#059669',
          color_secundario: activeRestaurant.color_secundario || '#10B981',
          logo_url: activeRestaurant.logo_url || null,
          bot_nombre: activeRestaurant.bot_nombre || 'Mr. Green',
          bot_tono: activeRestaurant.bot_tono || 'cercano_informal',
          bot_emojis: activeRestaurant.bot_emojis || 'moderado',
          tipo_cocina: activeRestaurant.tipo_cocina || 'Plant-based & Saludable',
          delivery_tarifa_base: activeRestaurant.delivery_tarifa_base || 5,
          delivery_km_base: activeRestaurant.delivery_km_base || 3,
          delivery_costo_km_adicional: activeRestaurant.delivery_costo_km_adicional || 1.5,
          delivery_cobertura_maxima_km: activeRestaurant.delivery_cobertura_maxima_km || 10,
        }])
        .select()
        .single();

      if (errRes) throw errRes;

      // Vincular al usuario en restaurante_usuarios
      if (session?.user?.id) {
        await supabase.from('restaurante_usuarios').insert([{
          user_id: session.user.id,
          restaurante_id: nuevaRes.id,
          rol: 'owner'
        }]);
      }

      showToast(`¡Sede "${nombreSucursal}" creada con éxito!`, 'success');
      setNombreSucursal('');
      setDireccionSucursal('');
      setTelefonoSucursal('');
      setSlugSucursal('');
      setShowNuevaSucursalModal(false);

      if (fetchRestaurants) await fetchRestaurants();
    } catch (err) {
      console.error('Error al crear sucursal:', err);
      showToast('Error al crear la sucursal: ' + (err.message || 'Intenta de nuevo'), 'error');
    } finally {
      setCreandoSucursal(false);
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
  const handleSave = async (e, overrides = {}) => {
    e?.preventDefault?.();
    if (!activeRestaurant?.id) return;

    setSaving(true);
    try {
      const finalCuisine = tipoCocinaPreset === 'OTRO' ? tipoCocinaCustom.trim() : tipoCocinaPreset;

      const currentCierreActivo = overrides.cierre_emergencia_activo !== undefined
        ? overrides.cierre_emergencia_activo
        : cierreEmergenciaActivo;
      const currentCierreMotivo = overrides.cierre_emergencia_motivo !== undefined
        ? overrides.cierre_emergencia_motivo
        : cierreEmergenciaMotivo;

      const payload = {
        nombre,
        ruc,
        telefono,
        direccion,
        acepta_reservas: aceptaReservas,
        logo_url: logoUrl,
        eslogan: eslogan,
        bot_nombre: botNombre,
        bot_tono: botTono,
        bot_emojis: botEmojis,
        tipo_cocina: finalCuisine,
        valores_diferenciales: valoresDiferenciales,
        politicas_negocio: politicasNegocio,
        instrucciones_ia: instruccionesIa,
        horarios_semanales: overrides.horarios_semanales || horariosSemanales,
        zona_horaria: zonaHoraria,
        pais,
        moneda,
        simbolo_moneda: simboloMoneda,
        horarios_atencion: (() => {
          try {
            const h = overrides.horarios_semanales || horariosSemanales;
            const diasActivos = DIAS_SEMANA.filter(d => h[d.key]?.activo);
            if (!diasActivos.length) return 'Cerrado temporalmente';
            const primerDia = h[diasActivos[0].key];
            const t1 = `${primerDia.t1_open || '12:00'} - ${primerDia.t1_close || '22:00'}`;
            const t2 = primerDia.dosTurnos && primerDia.t2_open ? ` / ${primerDia.t2_open} - ${primerDia.t2_close}` : '';
            return `${diasActivos[0].label} a ${diasActivos[diasActivos.length - 1].label}: ${t1}${t2}`;
          } catch (e) {
            return 'Lunes a Sábado: 12:00 PM - 10:00 PM';
          }
        })(),
        dias_feriados: diasFeriados,
        mensaje_fuera_horario: mensajeFueraHorario,
        cierre_emergencia_activo: currentCierreActivo,
        cierre_emergencia_motivo: currentCierreMotivo,
        yape_numero: yapeNumero,
        yape_titular: yapeTitular,
        plin_numero: plinNumero,
        color_primario: colorPrimario,
        color_secundario: colorSecundario,
        delivery_tipo_calculo: tipoCalculo,
        latitud: parseFloat(lat) || 0,
        longitud: parseFloat(lng) || 0,
        delivery_tarifa_base: parseFloat(tarifaBase) || 0,
        delivery_km_base: parseFloat(kmBase) || 0,
        delivery_costo_km_adicional: parseFloat(costoKmAdicional) || 0,
        delivery_cobertura_maxima_km: parseFloat(coberturaMaximaKm) || 0,
        delivery_pedido_minimo_global: parseFloat(pedidoMinimoGlobal) || 0,
        delivery_envio_gratis_desde_global: parseFloat(envioGratisDesdeGlobal) || 0,
        ...overrides
      };

      // Si el schema no tiene banner_url, no lo enviamos
      delete payload.banner_url;

      const { error } = await supabase
        .from('restaurantes')
        .update(payload)
        .eq('id', activeRestaurant.id);

      if (error) throw error;
      showToast("¡Configuración guardada correctamente! 🌿");
      if (fetchRestaurants) fetchRestaurants();
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
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'var(--color-accent, #ECFDF5)',
            border: '1px solid var(--color-surface-3, #E2E8F0)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--color-primary, #059669)', flexShrink: 0
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 20, fontWeight: 900, color: 'var(--color-on-surface, #0F172A)', margin: 0, letterSpacing: '-0.02em' }}>
            Mi Restaurante
          </h1>
        </div>
        <p style={{ fontSize: 13, color: 'var(--color-muted, #64748B)', margin: 0, lineHeight: 1.4 }}>
          Administra el perfil de tu local, identidad visual de marca, horarios operativos y configuración general.
        </p>
      </div>

      {/* Alerta de Cierre de Emergencia Activo */}
      {cierreEmergenciaActivo && (
        <div style={{
          background: 'rgba(217,4,41,0.1)', border: '1.5px solid #D90429',
          borderRadius: 14, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>🚨</span>
            <div>
              <p style={{ fontSize: 13, fontWeight: 900, color: '#D90429', margin: 0 }}>
                CIERRE DE EMERGENCIA ACTIVO
              </p>
              <p style={{ fontSize: 11, color: 'var(--color-on-surface)', margin: 0 }}>
                El Bot pausará la toma de pedidos informando: "{cierreEmergenciaMotivo}"
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={async () => {
              setCierreEmergenciaActivo(false);
              await handleSave(null, { cierre_emergencia_activo: false });
            }}
            style={{
              padding: '8px 14px', borderRadius: 10, background: '#D90429', color: '#fff',
              border: 'none', fontWeight: 800, fontSize: 12, cursor: 'pointer', flexShrink: 0
            }}
          >
            {saving ? 'Reabriendo...' : 'Reabrir Ahora'}
          </button>
        </div>
      )}

      {/* Navegación por Sub-pestañas (Pill Scroll Bar 100% Mobile-First) */}
      <div style={{
        display: 'flex',
        gap: 6,
        background: 'var(--color-surface-2, #F8FAFC)',
        padding: '5px',
        borderRadius: 14,
        border: '1px solid var(--color-surface-3, #E2E8F0)',
        overflowX: 'auto',
        whiteSpace: 'nowrap',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}>
        {[
          { 
            id: 'perfil', 
            label: 'Datos Negocio', 
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="2" width="16" height="20" rx="2" />
                <path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01" />
              </svg>
            ) 
          },
          { 
            id: 'marca', 
            label: 'Logo & Portada', 
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            ) 
          },
          { 
            id: 'modulos', 
            label: 'Módulos SaaS', 
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/>
              </svg>
            ) 
          },
          { 
            id: 'ia', 
            label: 'Perfil IA', 
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
            ) 
          },
          { 
            id: 'horarios', 
            label: 'Horarios', 
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            ) 
          },
          { 
            id: 'delivery', 
            label: 'Delivery & GPS', 
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13" rx="2" ry="2" /><polygon points="16 8 20 8 23 11 23 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
            ) 
          },
          { 
            id: 'personal', 
            label: 'Equipo', 
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            ) 
          },
          { 
            id: 'pagos', 
            label: 'Pagos', 
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
            ) 
          },
          { 
            id: 'sucursales', 
            label: 'Sucursales / Sedes', 
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 21h18M9 8h1M9 12h1M9 16h1M14 8h1M14 12h1M14 16h1M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
              </svg>
            ) 
          },
        ].map(tab => {
          const active = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              style={{
                flexShrink: 0,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '8px 14px',
                borderRadius: 10,
                background: active ? 'var(--color-surface, #FFFFFF)' : 'transparent',
                border: active ? '1px solid var(--color-surface-3, #E2E8F0)' : '1px solid transparent',
                color: active ? 'var(--color-primary, #059669)' : 'var(--color-muted, #64748B)',
                fontWeight: active ? 800 : 600,
                fontSize: 12,
                cursor: 'pointer',
                boxShadow: active ? '0 2px 6px rgba(15, 23, 42, 0.05)' : 'none',
                transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', color: active ? 'var(--color-primary, #059669)' : 'var(--color-muted, #94A3B8)' }}>
                {tab.icon}
              </span>
              <span>{tab.label}</span>
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
      {/* PESTAÑA 3: HORARIOS Y CALENDARIO (100% FIRST MOBILE ADAPTIVE) */}
      {/* ────────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'horarios' && (
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Card Cierre de Emergencia */}
          <div style={{
            background: cierreEmergenciaActivo ? '#FFF1F2' : 'var(--color-surface, #FFFFFF)',
            padding: 18, borderRadius: 16,
            border: `1.5px solid ${cierreEmergenciaActivo ? '#E11D48' : 'var(--color-surface-3, #E2E8F0)'}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            display: 'flex', flexDirection: 'column', gap: 14
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: cierreEmergenciaActivo ? '#FFE4E6' : 'rgba(225,29,72,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20, flexShrink: 0
                  }}>
                    🚨
                  </div>
                  <div>
                    <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 15, fontWeight: 800, margin: 0, color: cierreEmergenciaActivo ? '#BE123C' : 'var(--color-on-surface, #0F172A)' }}>
                      Cierre Temporal de Emergencia
                    </h3>
                    <p style={{ fontSize: 12, color: 'var(--color-muted, #64748B)', margin: '3px 0 0', lineHeight: 1.35 }}>
                      Pausa inmediatamente la toma de pedidos en carta QR y WhatsApp.
                    </p>
                  </div>
                </div>

                <span style={{
                  fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 20, flexShrink: 0,
                  background: cierreEmergenciaActivo ? '#E11D48' : 'rgba(100,116,139,0.12)',
                  color: cierreEmergenciaActivo ? '#FFFFFF' : 'var(--color-muted, #64748B)'
                }}>
                  {cierreEmergenciaActivo ? '🔴 CERRADO' : '🟢 ABIERTO'}
                </span>
              </div>

              {/* Botón Acción Rápida (Toggle) */}
              <button
                type="button"
                disabled={saving}
                onClick={async () => {
                  const nuevoEstado = !cierreEmergenciaActivo;
                  setCierreEmergenciaActivo(nuevoEstado);
                  await handleSave(null, {
                    cierre_emergencia_activo: nuevoEstado,
                    cierre_emergencia_motivo: cierreEmergenciaMotivo
                  });
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 12,
                  cursor: 'pointer',
                  fontWeight: 800,
                  fontSize: 13,
                  border: 'none',
                  background: cierreEmergenciaActivo ? '#E11D48' : 'rgba(225,29,72,0.1)',
                  color: cierreEmergenciaActivo ? '#FFFFFF' : '#E11D48',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transition: 'all 150ms'
                }}
              >
                <span>{cierreEmergenciaActivo ? '🔓 Click para Reabrir Restaurante' : '🔒 Activar Cierre Temporal Hoy'}</span>
              </button>
            </div>

            {cierreEmergenciaActivo && (
              <div style={{ paddingTop: 10, borderTop: '1px dashed rgba(225,29,72,0.3)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#BE123C', textTransform: 'uppercase' }}>
                  Motivo comunicado a los clientes por la IA
                </label>
                <input
                  className="input-field"
                  value={cierreEmergenciaMotivo}
                  onChange={e => setCierreEmergenciaMotivo(e.target.value)}
                  placeholder="Ej. Hoy nos encontramos cerrados por evento privado / mantenimiento."
                  style={{ background: '#FFFFFF', borderColor: '#FDA4AF' }}
                />
              </div>
            )}
          </div>

          {/* Card Zona Horaria y Moneda */}
          <div style={{
            background: 'var(--color-surface, #FFFFFF)', padding: 18, borderRadius: 16,
            border: '1px solid var(--color-surface-3, #E2E8F0)', display: 'flex', flexDirection: 'column', gap: 14
          }}>
            <div>
              <h4 style={{ margin: 0, fontFamily: 'Outfit, sans-serif', fontSize: 14, fontWeight: 800, color: 'var(--color-on-surface, #0F172A)' }}>
                🌍 País, Zona Horaria & Moneda Operativa
              </h4>
              <p style={{ fontSize: 12, color: 'var(--color-muted, #64748B)', margin: '3px 0 0' }}>
                Define la hora local y la moneda con la que el bot de WhatsApp, la carta y las tarifas de delivery operan en tiempo real.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--color-muted, #64748B)', textTransform: 'uppercase' }}>
                  País y Zona Horaria
                </label>
                <select
                  className="input-field"
                  style={{ width: '100%', fontWeight: 700, fontSize: 13 }}
                  value={zonaHoraria}
                  onChange={e => {
                    const tz = e.target.value;
                    setZonaHoraria(tz);
                    // Mapeo automático de país y moneda
                    const countryPresets = {
                      'America/Lima': { pais: 'PE', moneda: 'PEN', simbolo: 'S/' },
                      'America/Bogota': { pais: 'CO', moneda: 'COP', simbolo: '$' },
                      'America/Santiago': { pais: 'CL', moneda: 'CLP', simbolo: '$' },
                      'America/Mexico_City': { pais: 'MX', moneda: 'MXN', simbolo: '$' },
                      'America/Buenos_Aires': { pais: 'AR', moneda: 'ARS', simbolo: '$' },
                      'America/Guayaquil': { pais: 'EC', moneda: 'USD', simbolo: '$' },
                      'America/La_Paz': { pais: 'BO', moneda: 'BOB', simbolo: 'Bs' },
                      'America/Montevideo': { pais: 'UY', moneda: 'UYU', simbolo: '$' },
                      'America/Asuncion': { pais: 'PY', moneda: 'PYG', simbolo: 'Gs' },
                      'America/Caracas': { pais: 'VE', moneda: 'USD', simbolo: '$' },
                      'America/Costa_Rica': { pais: 'CR', moneda: 'CRC', simbolo: '₡' },
                      'America/Panama': { pais: 'PA', moneda: 'USD', simbolo: '$' },
                      'Europe/Madrid': { pais: 'ES', moneda: 'EUR', simbolo: '€' },
                      'America/New_York': { pais: 'US', moneda: 'USD', simbolo: '$' },
                    };
                    const preset = countryPresets[tz];
                    if (preset) {
                      setPais(preset.pais);
                      setMoneda(preset.moneda);
                      setSimboloMoneda(preset.simbolo);
                    }
                  }}
                >
                  <option value="America/Lima">🇵🇪 Perú (Lima - GMT-5 | Sol S/)</option>
                  <option value="America/Bogota">🇨🇴 Colombia (Bogotá - GMT-5 | Peso $)</option>
                  <option value="America/Santiago">🇨🇱 Chile (Santiago - GMT-4 | Peso $)</option>
                  <option value="America/Mexico_City">🇲🇽 México (CDMX - GMT-6 | Peso $)</option>
                  <option value="America/Buenos_Aires">🇦🇷 Argentina (Buenos Aires - GMT-3 | Peso $)</option>
                  <option value="America/Guayaquil">🇪🇨 Ecuador (Quito - GMT-5 | Dólar $)</option>
                  <option value="America/La_Paz">🇧🇴 Bolivia (La Paz - GMT-4 | Boliviano Bs)</option>
                  <option value="America/Montevideo">🇺🇾 Uruguay (Montevideo - GMT-3 | Peso $)</option>
                  <option value="America/Asuncion">🇵🇾 Paraguay (Asunción - GMT-4 | Guaraní Gs)</option>
                  <option value="America/Caracas">🇻🇪 Venezuela (Caracas - GMT-4 | Dólar $)</option>
                  <option value="America/Costa_Rica">🇨🇷 Costa Rica (San José - GMT-6 | Colón ₡)</option>
                  <option value="America/Panama">🇵🇦 Panamá (Panamá - GMT-5 | Dólar $)</option>
                  <option value="Europe/Madrid">🇪🇸 España (Madrid - GMT+1 | Euro €)</option>
                  <option value="America/New_York">🇺🇸 EE.UU. (Miami / New York - EST | USD $)</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--color-muted, #64748B)', textTransform: 'uppercase' }}>
                    Código Moneda
                  </label>
                  <input
                    className="input-field"
                    style={{ width: '100%', fontWeight: 700, fontSize: 13 }}
                    value={moneda}
                    onChange={e => setMoneda(e.target.value.toUpperCase())}
                    placeholder="COP, CLP, PEN..."
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--color-muted, #64748B)', textTransform: 'uppercase' }}>
                    Símbolo Visual
                  </label>
                  <input
                    className="input-field"
                    style={{ width: '100%', fontWeight: 700, fontSize: 13 }}
                    value={simboloMoneda}
                    onChange={e => setSimboloMoneda(e.target.value)}
                    placeholder="$, S/, €..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Plantillas Rápidas */}
          <div style={{
            background: 'var(--color-surface, #FFFFFF)', padding: 18, borderRadius: 16,
            border: '1px solid var(--color-surface-3, #E2E8F0)', display: 'flex', flexDirection: 'column', gap: 10
          }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-muted, #64748B)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              ⚡ Plantillas Rápidas para toda la semana
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: 8 }}>
              <button
                type="button"
                onClick={() => applyPresetHorarios('cafeteria')}
                style={{
                  padding: '10px 12px', borderRadius: 12, background: 'var(--color-surface-2, #F8FAFC)',
                  border: '1px solid var(--color-surface-3, #E2E8F0)', cursor: 'pointer', textAlign: 'left',
                  transition: 'all 150ms'
                }}
              >
                <p style={{ fontSize: 12, fontWeight: 800, color: 'var(--color-on-surface, #0F172A)', margin: 0 }}>☕ Cafetería</p>
                <p style={{ fontSize: 10, color: 'var(--color-muted, #64748B)', margin: '2px 0 0' }}>7 AM – 7 PM (Corrido)</p>
              </button>

              <button
                type="button"
                onClick={() => applyPresetHorarios('restaurante')}
                style={{
                  padding: '10px 12px', borderRadius: 12, background: 'var(--color-surface-2, #F8FAFC)',
                  border: '1px solid var(--color-surface-3, #E2E8F0)', cursor: 'pointer', textAlign: 'left',
                  transition: 'all 150ms'
                }}
              >
                <p style={{ fontSize: 12, fontWeight: 800, color: 'var(--color-on-surface, #0F172A)', margin: 0 }}>🍲 Tradicional</p>
                <p style={{ fontSize: 10, color: 'var(--color-muted, #64748B)', margin: '2px 0 0' }}>Almuerzo & Cena (2 Turnos)</p>
              </button>

              <button
                type="button"
                onClick={() => applyPresetHorarios('nocturno')}
                style={{
                  padding: '10px 12px', borderRadius: 12, background: 'var(--color-surface-2, #F8FAFC)',
                  border: '1px solid var(--color-surface-3, #E2E8F0)', cursor: 'pointer', textAlign: 'left',
                  transition: 'all 150ms'
                }}
              >
                <p style={{ fontSize: 12, fontWeight: 800, color: 'var(--color-on-surface, #0F172A)', margin: 0 }}>🍕 Nocturno</p>
                <p style={{ fontSize: 10, color: 'var(--color-muted, #64748B)', margin: '2px 0 0' }}>5 PM – 12 AM (Corrido)</p>
              </button>
            </div>
          </div>

          {/* Horarios por Día de la Semana (Mobile First) */}
          <div style={{
            background: 'var(--color-surface, #FFFFFF)', padding: 18, borderRadius: 16,
            border: '1px solid var(--color-surface-3, #E2E8F0)', display: 'flex', flexDirection: 'column', gap: 14
          }}>
            <div>
              <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 15, fontWeight: 800, margin: 0, color: 'var(--color-on-surface, #0F172A)' }}>
                Horarios Semanales & Días de Descanso
              </h3>
              <p style={{ fontSize: 12, color: 'var(--color-muted, #64748B)', margin: '3px 0 0' }}>
                Configura cada día de apertura con 1 o 2 turnos (horario partido almuerzo / cena).
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {DIAS_SEMANA.map(({ key, label }) => {
                const dayConfig = horariosSemanales[key] || { activo: true, t1_open: '08:00', t1_close: '20:00', dosTurnos: false };
                const isActivo = !!dayConfig.activo;

                return (
                  <div key={key} style={{
                    background: isActivo ? 'var(--color-surface-2, #F8FAFC)' : 'rgba(239,68,68,0.03)',
                    padding: 14, borderRadius: 14,
                    border: `1px solid ${isActivo ? 'var(--color-surface-3, #E2E8F0)' : 'rgba(239,68,68,0.2)'}`,
                    display: 'flex', flexDirection: 'column', gap: 10,
                    transition: 'all 150ms ease-in-out'
                  }}>
                    {/* Fila Principal de Día */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 15, fontWeight: 800, color: isActivo ? 'var(--color-on-surface, #0F172A)' : '#EF4444' }}>
                          {label}
                        </span>
                        <span style={{
                          fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 8,
                          background: isActivo ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                          color: isActivo ? '#059669' : '#EF4444'
                        }}>
                          {isActivo ? 'Abierto' : 'Descanso'}
                        </span>
                      </div>

                      {/* Botón Switch Activo / Descanso */}
                      <button
                        type="button"
                        onClick={() => updateHorarioDay(key, 'activo', !isActivo)}
                        style={{
                          padding: '6px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
                          background: isActivo ? 'rgba(239,68,68,0.1)' : 'var(--color-primary, #059669)',
                          color: isActivo ? '#EF4444' : '#FFFFFF', fontWeight: 800, fontSize: 11,
                          flexShrink: 0
                        }}
                      >
                        {isActivo ? 'Marcar Descanso' : 'Habilitar Día'}
                      </button>
                    </div>

                    {/* Controles de Horas si está Activo */}
                    {isActivo && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 6, borderTop: '1px solid var(--color-surface-3, #E2E8F0)' }}>
                        {/* Checkbox Turno Dividido */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                          <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--color-muted, #64748B)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <input
                              type="checkbox"
                              checked={!!dayConfig.dosTurnos}
                              onChange={e => updateHorarioDay(key, 'dosTurnos', e.target.checked)}
                              style={{ width: 16, height: 16, accentColor: 'var(--color-primary, #059669)', cursor: 'pointer' }}
                            />
                            Turno dividido (pausa de almuerzo / cena)
                          </label>
                        </div>

                        {/* Turno 1 */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-on-surface, #0F172A)' }}>
                            {dayConfig.dosTurnos ? 'Turno 1 (Mañana / Almuerzo):' : 'Jornada Continua:'}
                          </span>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted, #64748B)' }}>Abre</label>
                              <input
                                type="time"
                                className="input-field"
                                style={{ width: '100%', padding: '6px 8px', fontSize: 13, fontWeight: 700 }}
                                value={dayConfig.t1_open || '08:00'}
                                onChange={e => updateHorarioDay(key, 't1_open', e.target.value)}
                              />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted, #64748B)' }}>
                                {dayConfig.dosTurnos ? 'Pausa' : 'Cierra'}
                              </label>
                              <input
                                type="time"
                                className="input-field"
                                style={{ width: '100%', padding: '6px 8px', fontSize: 13, fontWeight: 700 }}
                                value={dayConfig.t1_close || '16:00'}
                                onChange={e => updateHorarioDay(key, 't1_close', e.target.value)}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Turno 2 si aplica */}
                        {dayConfig.dosTurnos && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 6, borderTop: '1px dashed var(--color-surface-3, #E2E8F0)' }}>
                            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-on-surface, #0F172A)' }}>
                              Turno 2 (Tarde / Noche):
                            </span>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted, #64748B)' }}>Reabre</label>
                                <input
                                  type="time"
                                  className="input-field"
                                  style={{ width: '100%', padding: '6px 8px', fontSize: 13, fontWeight: 700 }}
                                  value={dayConfig.t2_open || '19:00'}
                                  onChange={e => updateHorarioDay(key, 't2_open', e.target.value)}
                                />
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted, #64748B)' }}>Cierre final</label>
                                <input
                                  type="time"
                                  className="input-field"
                                  style={{ width: '100%', padding: '6px 8px', fontSize: 13, fontWeight: 700 }}
                                  value={dayConfig.t2_close || '23:00'}
                                  onChange={e => updateHorarioDay(key, 't2_close', e.target.value)}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Mensaje Fuera de Horario */}
            <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-muted, #64748B)', textTransform: 'uppercase' }}>
                Mensaje Automático de la IA fuera de Horario
              </label>
              <textarea
                className="input-field"
                rows="3"
                value={mensajeFueraHorario}
                onChange={e => setMensajeFueraHorario(e.target.value)}
                placeholder="Ej. ¡Gracias por escribirnos! Nuestra cocina está actualmente en descanso. Te responderemos apenas abramos a primera hora."
                style={{ resize: 'vertical', width: '100%' }}
              />
            </div>
          </div>

          {/* Días Feriados / Cierres Programados */}
          <div style={{
            background: 'var(--color-surface, #FFFFFF)', padding: 18, borderRadius: 16,
            border: '1px solid var(--color-surface-3, #E2E8F0)', display: 'flex', flexDirection: 'column', gap: 14
          }}>
            <div>
              <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 15, fontWeight: 800, margin: 0, color: 'var(--color-on-surface, #0F172A)' }}>
                Días Feriados & Cierres Programados 🗓️
              </h3>
              <p style={{ fontSize: 12, color: 'var(--color-muted, #64748B)', margin: '3px 0 0' }}>
                Fechas específicas donde el restaurante estará cerrado (Navidad, mantenimiento, feriados).
              </p>
            </div>

            {/* Formulario Mobile-Friendly Agregar Feriado */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8 }}>
                <input
                  type="date"
                  className="input-field"
                  style={{ width: '100%', fontSize: 13 }}
                  value={newFeriadoFecha}
                  onChange={e => setNewFeriadoFecha(e.target.value)}
                />
                <input
                  className="input-field"
                  style={{ width: '100%', fontSize: 13 }}
                  placeholder="Motivo (Ej. Feriado Nacional)"
                  value={newFeriadoMotivo}
                  onChange={e => setNewFeriadoMotivo(e.target.value)}
                />
              </div>
              <button
                type="button"
                onClick={handleAddFeriado}
                className="btn-primary"
                style={{ width: '100%', padding: '10px 16px', fontSize: 13, fontWeight: 800, borderRadius: 10 }}
              >
                + Agregar Fecha de Cierre
              </button>
            </div>

            {/* Lista de Feriados */}
            {diasFeriados.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                {diasFeriados.map((f, idx) => (
                  <div key={idx} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                    padding: '10px 12px', background: 'var(--color-surface-2, #F8FAFC)', borderRadius: 12,
                    border: '1px solid var(--color-surface-3, #E2E8F0)'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, overflow: 'hidden' }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-primary, #059669)' }}>{f.fecha}</span>
                      <span style={{ fontSize: 12, color: 'var(--color-on-surface, #0F172A)', fontWeight: 600, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {f.motivo}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteFeriado(idx)}
                      style={{ background: 'transparent', border: 'none', color: '#EF4444', fontWeight: 800, cursor: 'pointer', fontSize: 12, flexShrink: 0 }}
                    >
                      🗑️ Borrar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botón Guardar Flotante / Sticky en Mobile */}
          <div style={{
            position: 'sticky', bottom: 16, zIndex: 10,
            background: 'var(--color-surface, #FFFFFF)',
            padding: 12, borderRadius: 16,
            border: '1px solid var(--color-surface-3, #E2E8F0)',
            boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)'
          }}>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary"
              style={{ width: '100%', padding: '14px 20px', fontWeight: 800, fontSize: 14, borderRadius: 12 }}
            >
              {saving ? 'Guardando Cambios...' : '💾 Guardar Horarios y Calendario'}
            </button>
          </div>
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
      {/* ────────────────────────────────────────────────────────────────── */}
      {/* PESTAÑA: LOGO & PORTADA (BRAND ASSETS HUB) */}
      {/* ────────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'marca' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Bloque 1: Logo Oficial del Restaurante */}
          <div style={{
            background: 'var(--color-surface, #FFFFFF)', padding: 22, borderRadius: 16,
            border: '1px solid var(--color-surface-3, #E2E8F0)', display: 'flex', flexDirection: 'column', gap: 16
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--color-on-surface, #0F172A)' }}>
                  🖼️ Logo Oficial del Local
                </h3>
                <p style={{ fontSize: 12, color: 'var(--color-muted, #64748B)', margin: '4px 0 0' }}>
                  Este logo aparecerá en la cabecera de tu Carta Digital QR y en los comprobantes de pedido.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
              {/* Preview del Logo */}
              <div style={{
                width: 76, height: 76, borderRadius: 18,
                background: 'var(--color-surface-2, #F8FAFC)',
                border: '2px dashed var(--color-surface-3, #E2E8F0)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', flexShrink: 0, position: 'relative',
                boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)'
              }}>
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Logo Restaurante"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                ) : (
                  <span style={{ fontSize: 28, color: 'var(--color-muted, #94A3B8)' }}>🏢</span>
                )}
              </div>

              {/* Input URL y sugerencias */}
              <div style={{ flex: 1, minWidth: 240, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-muted, #64748B)', textTransform: 'uppercase' }}>
                  URL de Imagen del Logo (PNG o WebP transparente recomendado)
                </label>
                <input
                  type="url"
                  className="input-field"
                  placeholder="https://ejemplo.com/mi-logo.png"
                  value={logoUrl}
                  onChange={e => setLogoUrl(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>

          {/* Bloque 2: Portada / Banner de la Carta Digital */}
          <div style={{
            background: 'var(--color-surface, #FFFFFF)', padding: 22, borderRadius: 16,
            border: '1px solid var(--color-surface-3, #E2E8F0)', display: 'flex', flexDirection: 'column', gap: 16
          }}>
            <div>
              <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--color-on-surface, #0F172A)' }}>
                🌄 Banner de Portada (Carta Digital QR)
              </h3>
              <p style={{ fontSize: 12, color: 'var(--color-muted, #64748B)', margin: '4px 0 0' }}>
                Imagen panorámica que da la bienvenida a tus clientes al escanear el QR en mesa o abrir el enlace de Delivery.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Preview Panorámico */}
              <div style={{
                width: '100%', height: 140, borderRadius: 14,
                background: bannerUrl ? `url(${bannerUrl}) center/cover no-repeat` : 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                border: '1px solid var(--color-surface-3, #E2E8F0)',
                position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'flex-end', padding: 14
              }}>
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.65) 100%)'
                }} />
                <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10, background: '#FFFFFF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid rgba(255,255,255,0.8)', overflow: 'hidden'
                  }}>
                    {logoUrl ? <img src={logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <span>🍽️</span>}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: '#FFFFFF' }}>{nombre || 'Tu Restaurante'}</p>
                    <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>{eslogan || 'Menú Digital QR'}</p>
                  </div>
                </div>
              </div>

              {/* Input URL Portada */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-muted, #64748B)', textTransform: 'uppercase' }}>
                  URL de Imagen de Portada (Recomendado: 1200x500 px)
                </label>
                <input
                  type="url"
                  className="input-field"
                  placeholder="https://images.unsplash.com/photo-restaurante.jpg"
                  value={bannerUrl}
                  onChange={e => setBannerUrl(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>

          {/* Bloque 3: Eslogan y Mensaje de Bienvenida */}
          <div style={{
            background: 'var(--color-surface, #FFFFFF)', padding: 22, borderRadius: 16,
            border: '1px solid var(--color-surface-3, #E2E8F0)', display: 'flex', flexDirection: 'column', gap: 14
          }}>
            <div>
              <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--color-on-surface, #0F172A)' }}>
                ✍️ Eslogan de Marca / Mensaje al Comensal
              </h3>
              <p style={{ fontSize: 12, color: 'var(--color-muted, #64748B)', margin: '4px 0 0' }}>
                Frase breve o propuesta de valor que se visualiza debajo del nombre del restaurante.
              </p>
            </div>

            <input
              type="text"
              className="input-field"
              placeholder="Ej: Hamburguesas artesanales, papas rústicas y cervezas de autor 🍔🍺"
              value={eslogan}
              onChange={e => setEslogan(e.target.value)}
              style={{ width: '100%' }}
            />

            <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="btn-primary"
                style={{ padding: '10px 24px', fontWeight: 800, fontSize: 13, borderRadius: 10 }}
              >
                {saving ? 'Guardando...' : '💾 Guardar Logo & Portada'}
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

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* PESTAÑA SUCURSALES & SEDES */}
      {/* ────────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'sucursales' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Header Sucursales */}
          <div style={{
            background: 'var(--color-surface, #FFFFFF)', padding: 22, borderRadius: 16,
            border: '1px solid var(--color-surface-3, #E2E8F0)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 17, fontWeight: 800, margin: 0, color: 'var(--color-on-surface, #0F172A)' }}>
                  🏢 Sedes de {activeRestaurant?.nombre || 'tu Negocio'}
                </h3>
                <span style={{
                  fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 20,
                  background: 'var(--color-accent, #ECFDF5)', color: 'var(--color-primary, #059669)',
                  border: '1px solid var(--color-surface-3, #E2E8F0)'
                }}>
                  {restaurants.length} {restaurants.length === 1 ? 'Sede' : 'Sedes'}
                </span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--color-muted, #64748B)', margin: '4px 0 0' }}>
                Cada sucursal opera de forma autónoma con su propio stock, mesas, delivery y personal, compartiendo tu marca matriz.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowNuevaSucursalModal(true)}
              className="btn-primary"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '10px 18px', borderRadius: 12, fontWeight: 800, fontSize: 13
              }}
            >
              ➕ Registrar Nueva Sede
            </button>
          </div>

          {/* Listado de Sucursales */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
            {restaurants.map(r => {
              const isCurrent = r.id === activeRestaurant?.id;
              const isMatriz = !r.parent_id;
              return (
                <div key={r.id} style={{
                  background: isCurrent ? 'var(--color-surface, #FFFFFF)' : 'var(--color-surface-2, #F8FAFC)',
                  border: `1.5px solid ${isCurrent ? 'var(--color-primary, #059669)' : 'var(--color-surface-3, #E2E8F0)'}`,
                  borderRadius: 16, padding: 18,
                  boxShadow: isCurrent ? '0 4px 14px rgba(5, 150, 105, 0.08)' : 'none',
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 14
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
                      <div>
                        <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 16, fontWeight: 800, color: 'var(--color-on-surface, #0F172A)', margin: 0 }}>
                          {r.nombre_sucursal || 'Sede Principal'}
                        </p>
                        <p style={{ fontSize: 12, color: 'var(--color-muted, #64748B)', fontWeight: 600, margin: '2px 0 0' }}>
                          {r.nombre}
                        </p>
                      </div>

                      <span style={{
                        fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 6,
                        background: isMatriz ? '#ECFDF5' : '#F1F5F9',
                        color: isMatriz ? '#059669' : '#475569',
                        border: `1px solid ${isMatriz ? '#A7F3D0' : '#E2E8F0'}`
                      }}>
                        {isMatriz ? 'Casa Matriz' : 'Sucursal'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12, color: 'var(--color-muted, #64748B)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>📍</span>
                        <span style={{ color: 'var(--color-on-surface, #0F172A)', fontWeight: 600 }}>{r.direccion || 'Sin dirección registrada'}</span>
                      </div>
                      {r.telefono && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>📞</span>
                          <span>{r.telefono}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>🔗</span>
                        <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--color-primary, #059669)' }}>/{r.slug}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ paddingTop: 10, borderTop: '1px solid var(--color-surface-3, #E2E8F0)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {isCurrent ? (
                      <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--color-primary, #059669)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-primary, #059669)' }} />
                        Sede Activa en el Panel
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => { selectRestaurant(r); showToast(`Cambiaste a sede ${r.nombre_sucursal}`); }}
                        style={{
                          background: 'var(--color-surface, #FFFFFF)',
                          border: '1px solid var(--color-surface-3, #E2E8F0)',
                          borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700,
                          color: 'var(--color-on-surface, #0F172A)', cursor: 'pointer',
                          transition: 'all 150ms ease'
                        }}
                      >
                        Cambiar a esta sede →
                      </button>
                    )}

                    <a
                      href={`/${r.slug}/ordenar`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted, #64748B)', textDecoration: 'none' }}
                    >
                      Ver Menú QR ↗
                    </a>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Modal Nueva Sucursal */}
          {showNuevaSucursalModal && (
            <div style={{
              position: 'fixed', inset: 0, zIndex: 100,
              background: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
            }}>
              <div style={{
                background: 'var(--color-surface, #FFFFFF)',
                borderRadius: 20, maxWidth: 500, width: '100%', padding: 24,
                boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                animation: 'fade-in 200ms ease'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div>
                    <h4 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--color-on-surface, #0F172A)' }}>
                      ➕ Nueva Sede / Sucursal
                    </h4>
                    <p style={{ fontSize: 12, color: 'var(--color-muted, #64748B)', margin: '3px 0 0' }}>
                      Negocio: <strong>{activeRestaurant?.nombre}</strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNuevaSucursalModal(false)}
                    style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--color-muted, #64748B)' }}
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCrearSucursal} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--color-muted, #64748B)', textTransform: 'uppercase', marginBottom: 5 }}>
                      Nombre de la Sede *
                    </label>
                    <input
                      required
                      className="input-field"
                      placeholder="Ej: Sede Miraflores, Sede Barranco, Express Mall..."
                      value={nombreSucursal}
                      onChange={e => {
                        setNombreSucursal(e.target.value);
                        if (!slugSucursal) {
                          setSlugSucursal(`${activeRestaurant?.slug || 'rest'}-${e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-')}`);
                        }
                      }}
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--color-muted, #64748B)', textTransform: 'uppercase', marginBottom: 5 }}>
                      Dirección Física
                    </label>
                    <input
                      className="input-field"
                      placeholder="Ej: Av. Larco 456, Miraflores"
                      value={direccionSucursal}
                      onChange={e => setDireccionSucursal(e.target.value)}
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--color-muted, #64748B)', textTransform: 'uppercase', marginBottom: 5 }}>
                        Teléfono WhatsApp
                      </label>
                      <input
                        className="input-field"
                        placeholder="Ej: 51987654321"
                        value={telefonoSucursal}
                        onChange={e => setTelefonoSucursal(e.target.value)}
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--color-muted, #64748B)', textTransform: 'uppercase', marginBottom: 5 }}>
                        Slug URL (Único)
                      </label>
                      <input
                        className="input-field"
                        placeholder="ej: santos-barranco"
                        value={slugSucursal}
                        onChange={e => setSlugSucursal(e.target.value)}
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                    <button
                      type="button"
                      onClick={() => setShowNuevaSucursalModal(false)}
                      style={{
                        padding: '10px 16px', borderRadius: 10, border: '1px solid var(--color-surface-3, #E2E8F0)',
                        background: 'transparent', color: 'var(--color-muted, #64748B)', fontWeight: 700, cursor: 'pointer'
                      }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={creandoSucursal}
                      className="btn-primary"
                      style={{ padding: '10px 20px', borderRadius: 10, fontWeight: 800, cursor: creandoSucursal ? 'not-allowed' : 'pointer' }}
                    >
                      {creandoSucursal ? 'Creando Sede...' : 'Guardar y Crear Sede'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
