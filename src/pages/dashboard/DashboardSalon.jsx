import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient.js';
import { useAuth } from '../../router.jsx';
import { 
  RiRestaurant2Line, 
  RiUserStarLine, 
  RiCloseLine, 
  RiCheckDoubleLine, 
  RiAddLine, 
  RiSubtractLine, 
  RiDeleteBin7Line, 
  RiLockPasswordLine, 
  RiSettings4Line, 
  RiShutDownLine,
  RiGroupLine,
  RiInboxArchiveLine,
  RiShoppingCartLine,
  RiUserLine,
  RiGridLine,
  RiExchangeFundsLine,
  RiSparklingLine,
  RiAlertLine,
  RiNotification3Line,
  RiCheckFill
} from 'react-icons/ri';

export default function DashboardSalon() {
  const { activeRestaurant } = useAuth();

  // Estados principales
  const [mozos, setMozos] = useState([]);
  const [mesas, setMesas] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [menuCats, setMenuCats] = useState([]);
  const [activeMozo, setActiveMozo] = useState(null);
  const [weeklyPlanner, setWeeklyPlanner] = useState([]);
  const [tableActiveTimes, setTableActiveTimes] = useState({});
  const [loading, setLoading] = useState(true);

  // Estados de navegación interna (Mobile-First)
  const [currentView, setCurrentView] = useState('pin_selection'); 
  const [selectedTable, setSelectedTable] = useState(null);
  const [showMobileCart, setShowMobileCart] = useState(false); 
  const [tableFilter, setTableFilter] = useState('mis_mesas'); // 'mis_mesas' | 'todas'
  
  // PIN de seguridad
  const [pinInput, setPinInput] = useState('');
  const [pinMozoTarget, setPinMozoTarget] = useState(null);
  const [pinError, setPinError] = useState('');

  // Estados del Pedido Activo
  const [orderCart, setOrderCart] = useState([]); 
  const [selectedCatId, setSelectedCatId] = useState('all');
  const [itemNoteInput, setItemNoteInput] = useState('');
  const [noteTargetItemId, setNoteTargetItemId] = useState(null);

  // Estado de División de Cuenta (Idea 2)
  const [isSplitMode, setIsSplitMode] = useState(false);
  const [splitCount, setSplitCount] = useState(2);
  const [paidParts, setPaidParts] = useState([]); 

  // Estado de Cancelación de Mesa (Seguridad de Auditoría)
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelPinInput, setCancelPinInput] = useState('');
  const [cancelReasonInput, setCancelReasonInput] = useState('');
  const [cancelError, setCancelError] = useState('');



  // Estado de Alertas de Cocina en Tiempo Real (Idea 4)
  const [kitchenAlerts, setKitchenAlerts] = useState([]); 

  // Administración básica
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminNombreMozo, setAdminNombreMozo] = useState('');
  const [adminPinMozo, setAdminPinMozo] = useState('');
  const [adminMesaNumero, setAdminMesaNumero] = useState('');
  const [adminMesaCapacidad, setAdminMesaCapacidad] = useState('4');

  // Sintetizador de campana de cocina (Idea 4 - Sonido nativo sin archivos externos)
  const playKitchenChime = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(987.77, ctx.currentTime); // B5 (Tono de campana de servicio)
      
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1318.51, ctx.currentTime); // E6 (Armónico brillante)
      
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
      
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      
      osc1.start();
      osc2.start();
      
      osc1.stop(ctx.currentTime + 1.6);
      osc2.stop(ctx.currentTime + 1.6);
    } catch (err) {
      console.warn('AudioContext chimes blocked by browser policies until user interaction.', err);
    }
  };

  // Carga de Datos desde Supabase
  const fetchData = useCallback(async () => {
    if (!activeRestaurant?.id) return;
    setLoading(true);
    try {
      const { data: mozosData } = await supabase
        .from('mozos')
        .select('*')
        .eq('restaurante_id', activeRestaurant.id)
        .eq('activo', true)
        .order('nombre');
      setMozos(mozosData || []);

      const { data: mesasData } = await supabase
        .from('mesas')
        .select('*')
        .eq('restaurante_id', activeRestaurant.id)
        .order('numero');
      setMesas(mesasData || []);

      const { data: itemsData } = await supabase
        .from('items_menu')
        .select('*')
        .eq('restaurante_id', activeRestaurant.id)
        .eq('disponible', true);
      setMenuItems(itemsData || []);

      const { data: catsData } = await supabase
        .from('categorias_menu')
        .select('*')
        .eq('restaurante_id', activeRestaurant.id);
      setMenuCats(catsData || []);

      const { data: plannerData } = await supabase
        .from('planificador_semanal')
        .select('*')
        .eq('restaurante_id', activeRestaurant.id);
      setWeeklyPlanner(plannerData || []);

      const { data: activeOrders } = await supabase
        .from('ordenes')
        .select('mesa_id, created_at')
        .eq('restaurante_id', activeRestaurant.id)
        .eq('estado_pago', 'pendiente');
      
      const timesMapping = {};
      if (activeOrders) {
        activeOrders.forEach(o => {
          if (o.mesa_id) {
            timesMapping[o.mesa_id] = o.created_at;
          }
        });
      }
      setTableActiveTimes(timesMapping);
    } catch (err) {
      console.error('Error fetching salon data:', err);
    } finally {
      setLoading(false);
    }
  }, [activeRestaurant]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Consultar periódicamente órdenes listas en cocina para mis mesas (Idea 4)
  const checkKitchenReadyOrders = useCallback(async () => {
    if (!activeMozo || !activeRestaurant) return;
    try {
      const { data: readyOrders } = await supabase
        .from('ordenes')
        .select('id, mesa_id, mesas(numero), total')
        .eq('restaurante_id', activeRestaurant.id)
        .eq('mozo_id', activeMozo.id)
        .eq('estado', 'listo'); // 'listo' = Listo en cocina

      if (readyOrders && readyOrders.length > 0) {
        // Encontrar nuevas alertas que no estén en el estado local actual
        const newAlerts = readyOrders.filter(order => !kitchenAlerts.some(a => a.id === order.id));
        if (newAlerts.length > 0) {
          // Disparar Chime de campana y vibración de celular
          playKitchenChime();
          if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200]); 
          }
          setKitchenAlerts(readyOrders);
        }
      } else {
        setKitchenAlerts([]);
      }
    } catch (err) {
      console.error('Error checking kitchen ready orders:', err);
    }
  }, [activeMozo, activeRestaurant, kitchenAlerts]);

  // Escuchar en tiempo real cambios de cocina mediante Supabase Realtime Channels
  useEffect(() => {
    if (!activeMozo || !activeRestaurant) return;
    
    // Carga inicial al iniciar sesión del mozo
    checkKitchenReadyOrders();

    // Crear canal de escucha en tiempo real filtrado por mozo activo
    const channel = supabase
      .channel(`alertas-cocina-${activeMozo.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'ordenes',
          filter: `mozo_id=eq.${activeMozo.id}`
        },
        (payload) => {
          if (payload.new.estado === 'listo') {
            playKitchenChime();
            if (navigator.vibrate) {
              navigator.vibrate([200, 100, 200]);
            }
          }
          // Recargar estados de alerta locales inmediatamente
          checkKitchenReadyOrders();
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeMozo, activeRestaurant, checkKitchenReadyOrders, fetchData]);
  const [, setForceUpdate] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setForceUpdate(tick => tick + 1);
    }, 60000);
    return () => clearInterval(timer);
  }, []);
  // Inicializar partes de pago
  useEffect(() => {
    const parts = [];
    for (let i = 1; i <= splitCount; i++) {
      parts.push({ id: i, paid: false, method: '' });
    }
    setPaidParts(parts);
  }, [splitCount]);

  // Selección de Mozo y PIN
  const handleSelectMozo = (mozo) => {
    setPinMozoTarget(mozo);
    setPinInput('');
    setPinError('');
  };

  const handleKeyPress = (num) => {
    if (pinInput.length < 4) {
      const nextPin = pinInput + num;
      setPinInput(nextPin);
      if (nextPin.length === 4) {
        if (nextPin === pinMozoTarget.pin) {
          setActiveMozo(pinMozoTarget);
          setCurrentView('tables_grid');
          setPinInput('');
          setPinMozoTarget(null);
          // Habilitar contexto de audio tras interacción
          playKitchenChime(); 
        } else {
          setPinError('PIN incorrecto. Reintente.');
          setPinInput('');
        }
      }
    }
  };

  const handleBackspace = () => {
    setPinInput(prev => prev.slice(0, -1));
  };

  const handleExitMozo = () => {
    setActiveMozo(null);
    setCurrentView('pin_selection');
    setSelectedTable(null);
    setOrderCart([]);
    setKitchenAlerts([]);
  };

  // Agregar Items al Carrito
  const handleAddToCart = (item) => {
    setOrderCart(prev => {
      const idx = prev.findIndex(i => i.item.id === item.id);
      if (idx > -1) {
        const next = [...prev];
        next[idx].cantidad += 1;
        return next;
      }
      return [...prev, { item, cantidad: 1, notas: '' }];
    });
  };

  const handleRemoveFromCart = (itemId) => {
    setOrderCart(prev => {
      const idx = prev.findIndex(i => i.item.id === itemId);
      if (idx > -1) {
        const next = [...prev];
        if (next[idx].cantidad > 1) {
          next[idx].cantidad -= 1;
          return next;
        } else {
          return prev.filter(i => i.item.id !== itemId);
        }
      }
      return prev;
    });
  };

  const handleSaveItemNote = () => {
    setOrderCart(prev => prev.map(c => {
      if (c.item.id === noteTargetItemId) {
        return { ...c, notas: itemNoteInput };
      }
      return c;
    }));
    setNoteTargetItemId(null);
    setItemNoteInput('');
  };

  // Asignar Mozo a Mesa
  const assignWaiterToTable = async (tableId, mozoId) => {
    try {
      await supabase
        .from('mesas')
        .update({ mozo_asignado_id: mozoId })
        .eq('id', tableId);
    } catch (err) {
      console.error('Error assigning waiter:', err);
    }
  };

  // Confirmar comanda
  const handleConfirmOrder = async () => {
    if (orderCart.length === 0 || !selectedTable || !activeMozo || !activeRestaurant) return;
    try {
      const totalOrder = orderCart.reduce((acc, c) => acc + (c.item.precio * c.cantidad), 0);
      
      const { data: newOrder, error: orderErr } = await supabase
        .from('ordenes')
        .insert([{
          restaurante_id: activeRestaurant.id,
          total: totalOrder,
          tipo_entrega: 'salon',
          estado: 'preparando',
          estado_pago: 'pendiente',
          mesa_id: selectedTable.id,
          mozo_id: activeMozo.id,
          metodo_pago: 'efectivo'
        }])
        .select()
        .single();

      if (orderErr) throw orderErr;

      const details = orderCart.map(c => ({
        orden_id: newOrder.id,
        item_id: c.item.id,
        cantidad: c.cantidad,
        precio_unitario: c.item.precio,
        notas: c.notas || null
      }));

      const { error: detailsErr } = await supabase
        .from('detalles_orden')
        .insert(details);

      if (detailsErr) throw detailsErr;

      await supabase
        .from('mesas')
        .update({ 
          estado: 'ocupada',
          mozo_asignado_id: activeMozo.id
        })
        .eq('id', selectedTable.id);

      setOrderCart([]);
      setSelectedTable(null);
      setShowMobileCart(false);
      setCurrentView('tables_grid');
      fetchData();
    } catch (err) {
      console.error('Error al registrar pedido de salon:', err);
      alert('Ocurrió un error al registrar el pedido: ' + err.message);
    }
  };

  // Pagar Cuenta
  const handlePayTable = async (tableId, method) => {
    if (!window.confirm(`¿Liberar mesa y registrar pago por ${method.toUpperCase()}?`)) return;
    try {
      const { data: activeOrders } = await supabase
        .from('ordenes')
        .select('*')
        .eq('mesa_id', tableId)
        .eq('estado_pago', 'pendiente')
        .order('created_at', { ascending: false });

      if (activeOrders && activeOrders.length > 0) {
        const lastOrderId = activeOrders[0].id;
        
        await supabase
          .from('ordenes')
          .update({ 
            estado_pago: 'pagado', 
            estado: 'entregado',
            metodo_pago: method
          })
          .eq('id', lastOrderId);
      }

      await supabase
        .from('mesas')
        .update({ 
          estado: 'libre',
          mozo_asignado_id: null
        })
        .eq('id', tableId);

      setSelectedTable(null);
      setIsSplitMode(false);
      setCurrentView('tables_grid');
      fetchData();
    } catch (err) {
      console.error('Error al cerrar mesa:', err);
    }
  };

  // Simular Plato Listo desde Cocina (Idea 4 - Para facilitar testeo sin KDS secundario)
  const handleSimulateDishReady = async (tableId) => {
    try {
      const { data: activeOrders } = await supabase
        .from('ordenes')
        .select('*')
        .eq('mesa_id', tableId)
        .eq('estado_pago', 'pendiente')
        .order('created_at', { ascending: false });

      if (activeOrders && activeOrders.length > 0) {
        await supabase
          .from('ordenes')
          .update({ estado: 'listo' })
          .eq('id', activeOrders[0].id);

        checkKitchenReadyOrders();
        alert('Simulación exitosa: Plato marcado como LISTO en Cocina. Esperando sondeo (máx. 10s)...');
      } else {
        alert('Esta mesa no tiene comandas activas preparándose.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Despachar / Retirar plato listo de cocina
  const handleDeliverReadyOrder = async (orderId) => {
    try {
      await supabase
        .from('ordenes')
        .update({ estado: 'entregado' })
        .eq('id', orderId);
      
      setKitchenAlerts(prev => prev.filter(a => a.id !== orderId));
      fetchData();
    } catch (err) {
      console.error('Error delivering order:', err);
    }
  };

  // Cancelar Mesa por Emergencia
  const handleCancelTableEmergency = async (e) => {
    e.preventDefault();
    if (!selectedTable) return;
    
    if (cancelPinInput !== '9999') {
      setCancelError('PIN de Supervisor no autorizado (Prueba con 9999).');
      return;
    }

    try {
      const { data: activeOrders } = await supabase
        .from('ordenes')
        .select('*')
        .eq('mesa_id', selectedTable.id)
        .eq('estado_pago', 'pendiente')
        .order('created_at', { ascending: false });

      if (activeOrders && activeOrders.length > 0) {
        await supabase
          .from('ordenes')
          .update({ 
            estado: 'cancelado',
            estado_pago: 'pendiente'
          })
          .eq('id', activeOrders[0].id);
      }

      await supabase
        .from('mesas')
        .update({ 
          estado: 'libre',
          mozo_asignado_id: null
        })
        .eq('id', selectedTable.id);

      setShowCancelModal(false);
      setCancelPinInput('');
      setCancelReasonInput('');
      setCancelError('');
      setSelectedTable(null);
      setIsSplitMode(false);
      setCurrentView('tables_grid');
      fetchData();
    } catch (err) {
      console.error('Error al cancelar mesa:', err);
      alert('Error: ' + err.message);
    }
  };

  // Registrar pago parcial de división
  const handlePayPartialPart = (partId, method) => {
    setPaidParts(prev => prev.map(p => {
      if (p.id === partId) {
        return { ...p, paid: true, method };
      }
      return p;
    }));
  };

  const handleResetPartialPart = (partId) => {
    setPaidParts(prev => prev.map(p => {
      if (p.id === partId) {
        return { ...p, paid: false, method: '' };
      }
      return p;
    }));
  };

  // Finalizar el Split Bill
  const handleCompleteSplitBill = async (tableId) => {
    const methodsUsed = paidParts.map(p => p.method).filter(Boolean);
    const primaryMethod = methodsUsed.includes('yape_plin') ? 'yape_plin' : 'efectivo';

    try {
      const { data: activeOrders } = await supabase
        .from('ordenes')
        .select('*')
        .eq('mesa_id', tableId)
        .eq('estado_pago', 'pendiente')
        .order('created_at', { ascending: false });

      if (activeOrders && activeOrders.length > 0) {
        const lastOrderId = activeOrders[0].id;
        
        await supabase
          .from('ordenes')
          .update({ 
            estado_pago: 'pagado', 
            estado: 'entregado',
            metodo_pago: primaryMethod
          })
          .eq('id', lastOrderId);
      }

      await supabase
        .from('mesas')
        .update({ 
          estado: 'libre',
          mozo_asignado_id: null
        })
        .eq('id', tableId);

      setSelectedTable(null);
      setIsSplitMode(false);
      setSplitCount(2);
      setCurrentView('tables_grid');
      fetchData();
    } catch (err) {
      console.error('Error al cerrar mesa dividida:', err);
    }
  };

  const handleRequestAccount = async (tableId) => {
    try {
      await supabase
        .from('mesas')
        .update({ estado: 'esperando_cuenta' })
        .eq('id', tableId);
      
      setSelectedTable(prev => prev ? { ...prev, estado: 'esperando_cuenta' } : null);
      fetchData();
    } catch (err) {
      console.error('Error al solicitar cuenta:', err);
    }
  };

  // Gestión Admin
  const handleAddMozo = async (e) => {
    e.preventDefault();
    if (!adminNombreMozo || !adminPinMozo || !activeRestaurant) return;
    try {
      const { error } = await supabase
        .from('mozos')
        .insert([{
          nombre: adminNombreMozo,
          pin: adminPinMozo,
          restaurante_id: activeRestaurant.id
        }]);
      if (error) throw error;
      setAdminNombreMozo('');
      setAdminPinMozo('');
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddMesa = async (e) => {
    e.preventDefault();
    if (!adminMesaNumero || !activeRestaurant) return;
    try {
      const { error } = await supabase
        .from('mesas')
        .insert([{
          numero: `Mesa ${adminMesaNumero}`,
          capacidad: parseInt(adminMesaCapacidad),
          estado: 'libre',
          restaurante_id: activeRestaurant.id
        }]);
      if (error) throw error;
      setAdminMesaNumero('');
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteMozo = async (mozoId) => {
    if (!window.confirm('¿Desactivar este mozo?')) return;
    try {
      await supabase
        .from('mozos')
        .update({ activo: false })
        .eq('id', mozoId);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const [activeTableOrderItems, setActiveTableOrderItems] = useState([]);
  const loadActiveTableOrder = useCallback(async () => {
    if (!selectedTable || selectedTable.estado === 'libre') {
      setActiveTableOrderItems([]);
      return;
    }
    try {
      const { data: activeOrders } = await supabase
        .from('ordenes')
        .select('*')
        .eq('mesa_id', selectedTable.id)
        .eq('estado_pago', 'pendiente')
        .order('created_at', { ascending: false });

      if (activeOrders && activeOrders.length > 0) {
        const { data: items } = await supabase
          .from('detalles_orden')
          .select('id, cantidad, precio_unitario, notas, items_menu(nombre)')
          .eq('orden_id', activeOrders[0].id);
        setActiveTableOrderItems(items || []);
      } else {
        setActiveTableOrderItems([]);
      }
    } catch (err) {
      console.error('Error loading active table order:', err);
    }
  }, [selectedTable]);

  useEffect(() => {
    loadActiveTableOrder();
  }, [loadActiveTableOrder]);

  const totalCartPrice = orderCart.reduce((acc, c) => acc + (c.item.precio * c.cantidad), 0);
  const totalCartQty = orderCart.reduce((acc, c) => acc + c.cantidad, 0);

  // Filtrado de mesas por "Mis Mesas"
  const filteredMesas = mesas.filter(table => {
    if (tableFilter === 'mis_mesas' && activeMozo) {
      return table.mozo_asignado_id === activeMozo.id;
    }
    return true; 
  });

  const misMesasQty = mesas.filter(t => activeMozo && t.mozo_asignado_id === activeMozo.id).length;

  // Cálculos de pre-cuenta y división
  const activeTableTotal = activeTableOrderItems.reduce((acc, c) => acc + (c.precio_unitario * c.cantidad), 0);
  const pricePerSplitPart = activeTableTotal > 0 ? (activeTableTotal / splitCount) : 0;
  
  const allPartsPaid = paidParts.length > 0 && paidParts.every(p => p.paid);
  const paidPartsCount = paidParts.filter(p => p.paid).length;
  const progressPercent = paidParts.length > 0 ? Math.round((paidPartsCount / splitCount) * 100) : 0;

  // Filtrar sugerencias de venta cruzada (Prioriza: 1. Planificación semanal del día actual, 2. Aprobados en Marketing, 3. Fallback)
  let sugerenciasUpsell = [];
  
  const diasIngles = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  const hoyDia = diasIngles[new Date().getDay()];
  const planificadoHoy = weeklyPlanner.find(p => p.dia_semana === hoyDia);

  if (planificadoHoy) {
    const plannedItem = menuItems.find(item => item.id === planificadoHoy.item_id);
    if (plannedItem) {
      sugerenciasUpsell.push(plannedItem);
    }
  }

  const otrosDestacados = menuItems.filter(item => item.upsell_destacado && (!planificadoHoy || item.id !== planificadoHoy.item_id));
  sugerenciasUpsell = [...sugerenciasUpsell, ...otrosDestacados];

  if (sugerenciasUpsell.length < 4) {
    const fallbacks = menuItems.filter(item => {
      const catName = menuCats.find(c => c.id === item.categoria_id)?.nombre?.toLowerCase() || '';
      const yaIncluido = sugerenciasUpsell.some(s => s.id === item.id);
      return !yaIncluido && (catName.includes('bebida') || catName.includes('postre') || catName.includes('dulce') || item.precio < 16);
    }).slice(0, 4 - sugerenciasUpsell.length);

    sugerenciasUpsell = [...sugerenciasUpsell, ...fallbacks];
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      minHeight: '82dvh',
      fontFamily: 'Outfit, sans-serif',
      padding: '8px 4px',
      position: 'relative'
    }}>
      <style>{`
        @keyframes pulse-amber {
          0% { box-shadow: 0 0 0 0 rgba(216,160,32,0.45); }
          70% { box-shadow: 0 0 0 8px rgba(216,160,32,0); }
          100% { box-shadow: 0 0 0 0 rgba(216,160,32,0); }
        }
        @keyframes blink {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
      
      {/* 🛎️ BANNER DE AVISOS DE COCINA EN TIEMPO REAL (Idea 4) */}
      {activeMozo && kitchenAlerts.length > 0 && (
        <div style={{
          position: 'absolute', top: 0, left: 4, right: 4, zIndex: 99999,
          display: 'flex', flexDirection: 'column', gap: 6,
          animation: 'fade-in 200ms ease-out'
        }}>
          {kitchenAlerts.map(alert => (
            <div
              key={alert.id}
              style={{
                background: 'linear-gradient(135deg, #1B4332 0%, #081C15 100%)',
                color: '#fff',
                borderRadius: 16,
                padding: '12px 14px',
                border: '1.5px solid #40916C',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 8px 24px rgba(27,67,50,0.3)',
                gap: 10
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', background: 'rgba(64,145,108,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  animation: 'pulse 1.5s infinite'
                }}>
                  <RiNotification3Line size={18} style={{ color: '#40916C' }} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 11, fontWeight: 900, color: '#40916C', margin: 0 }}>¡PEDIDO LISTO EN COCINA!</p>
                  <p style={{ fontSize: 12, fontWeight: 800, margin: '2px 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {alert.mesas?.numero || 'Mesa'} · S/. {parseFloat(alert.total).toFixed(2)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDeliverReadyOrder(alert.id)}
                style={{
                  background: '#40916C',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  padding: '6px 12px',
                  fontSize: 10.5,
                  fontWeight: 900,
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                ✓ Entregado
              </button>
            </div>
          ))}
        </div>
      )}

      {/* HEADER CONTROL */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#fff',
        border: '1.5px solid #EBE7DC',
        borderRadius: 20,
        padding: '12px 16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
        gap: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 12,
            background: 'rgba(64,145,108,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <RiRestaurant2Line size={18} style={{ color: '#1B4332' }} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h2 style={{ fontSize: 13, fontWeight: 900, color: '#1B4332', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Terminal Móvil Salón
            </h2>
            {activeMozo ? (
              <p style={{ fontSize: 11, color: '#40916C', fontWeight: 800, margin: '1px 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Atendiendo: 👤 {activeMozo.nombre}
              </p>
            ) : (
              <p style={{ fontSize: 10, color: '#8A8070', fontWeight: 700, margin: '1px 0 0 0' }}>
                Ingresa PIN de mozo
              </p>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button
            onClick={() => setIsAdminMode(!isAdminMode)}
            style={{
              padding: '6px 10px',
              borderRadius: 10,
              border: '1.5px solid #EBE7DC',
              background: '#F5F2EB',
              fontSize: 11,
              fontWeight: 800,
              cursor: 'pointer',
              color: '#1B4332',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <RiSettings4Line size={14} />
          </button>
          {activeMozo && (
            <button
              onClick={handleExitMozo}
              style={{
                padding: '6px 10px',
                borderRadius: 10,
                border: 'none',
                background: '#EF4444',
                color: '#fff',
                fontSize: 11,
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              Cerrar
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: 12 }}>
          <div className="spinner" style={{ width: 28, height: 28, border: '3px solid #EBE7DC', borderTopColor: '#1B4332', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: 11, color: '#8A8070', fontWeight: 700 }}>Cargando datos...</span>
        </div>
      ) : isAdminMode ? (
        
        /* ════ ADMIN PANEL ════ */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#fff', border: '1.5px solid #EBE7DC', borderRadius: 20, padding: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 900, color: '#1B4332', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <RiGroupLine style={{ color: '#1B4332' }} /> Personal de Salón
            </h3>
            <form onSubmit={handleAddMozo} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
              <input
                type="text"
                required
                placeholder="Nombre del Mozo"
                value={adminNombreMozo}
                onChange={e => setAdminNombreMozo(e.target.value)}
                className="input-field"
                style={{ fontSize: 12, padding: '8px 10px', color: '#1B4332', background: '#FCFBF9', border: '1px solid #EBE7DC' }}
              />
              <input
                type="text"
                required
                pattern="[0-9]{4}"
                placeholder="PIN (4 números)"
                value={adminPinMozo}
                onChange={e => setAdminPinMozo(e.target.value)}
                className="input-field"
                style={{ fontSize: 12, padding: '8px 10px', color: '#1B4332', background: '#FCFBF9', border: '1px solid #EBE7DC' }}
              />
              <button type="submit" style={{ background: '#1B4332', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 0', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
                + Registrar Mozo
              </button>
            </form>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {mozos.map(m => (
                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 10, background: '#F5F2EB', borderRadius: 10, border: '1.5px solid #EBE7DC' }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#1B4332' }}>
                    👤 {m.nombre} <b style={{ color: '#40916C' }}>(PIN: {m.pin})</b>
                  </span>
                  <button onClick={() => handleDeleteMozo(m.id)} style={{ border: 'none', background: 'none', color: '#EF4444', cursor: 'pointer', padding: 4 }}>
                    <RiDeleteBin7Line size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: '#fff', border: '1.5px solid #EBE7DC', borderRadius: 20, padding: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 900, color: '#1B4332', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <RiInboxArchiveLine style={{ color: '#1B4332' }} /> Mesas del Local
            </h3>
            <form onSubmit={handleAddMesa} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
              <input
                type="number"
                required
                placeholder="Número de mesa (Ej. 12)"
                value={adminMesaNumero}
                onChange={e => setAdminMesaNumero(e.target.value)}
                className="input-field"
                style={{ fontSize: 12, padding: '8px 10px', color: '#1B4332', background: '#FCFBF9', border: '1px solid #EBE7DC' }}
              />
              <select
                value={adminMesaCapacidad}
                onChange={e => setAdminMesaCapacidad(e.target.value)}
                className="input-field"
                style={{ fontSize: 12, padding: '8px 10px', color: '#1B4332', background: '#FCFBF9', border: '1px solid #EBE7DC' }}
              >
                <option value="2">Capacidad: 2 Personas</option>
                <option value="4">Capacidad: 4 Personas</option>
                <option value="6">Capacidad: 6 Personas</option>
                <option value="8">Capacidad: 8 Personas</option>
              </select>
              <button type="submit" style={{ background: '#40916C', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 0', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
                + Crear Mesa
              </button>
            </form>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 6 }}>
              {mesas.map(t => (
                <div key={t.id} style={{ padding: '8px 4px', background: '#F5F2EB', border: '1px solid #EBE7DC', borderRadius: 10, fontSize: 11, fontWeight: 900, color: '#1B4332', textAlign: 'center' }}>
                  {t.numero}
                  <span style={{ display: 'block', fontSize: 9, color: '#8A8070', fontWeight: 700, marginTop: 2 }}>{t.capacidad}p</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      ) : currentView === 'pin_selection' ? (

        /* ════ VIEW 1: PIN SELECTION ════ */
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px 0', flex: 1 }}>
          {!pinMozoTarget ? (
            <div style={{ width: '100%', maxWidth: 360, background: '#fff', border: '1.5px solid #EBE7DC', borderRadius: 24, padding: 20, textAlign: 'center' }}>
              <div style={{
                width: 50, height: 50, borderRadius: '50%',
                background: 'rgba(64,145,108,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 12px'
              }}>
                <RiUserStarLine size={24} style={{ color: '#1B4332' }} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 900, marginBottom: 4, color: '#1B4332' }}>Ingreso de Mozos</h3>
              <p style={{ fontSize: 11, color: '#8A8070', fontWeight: 600, marginBottom: 20 }}>Toca tu nombre para digitar tu PIN.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {mozos.length === 0 ? (
                  <p style={{ fontSize: 12, color: '#8A8070', fontWeight: 600 }}>No hay mozos configurados. Ve al botón ⚙️ arriba para crearlos.</p>
                ) : (
                  mozos.map(m => (
                    <button
                      key={m.id}
                      onClick={() => handleSelectMozo(m)}
                      style={{
                        padding: '14px 16px',
                        borderRadius: 14,
                        border: '1.5px solid #EBE7DC',
                        background: '#F5F2EB',
                        color: '#1B4332',
                        fontWeight: 900,
                        fontSize: 13,
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>👤 {m.nombre}</span>
                      <span style={{ fontSize: 11, color: '#8A8070', fontWeight: 800 }}>Entrar ➔</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div style={{ width: '100%', maxWidth: 320, background: '#fff', border: '1.5px solid #EBE7DC', borderRadius: 24, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <button onClick={() => setPinMozoTarget(null)} style={{ alignSelf: 'flex-end', border: 'none', background: 'none', cursor: 'pointer', color: '#8A8070' }}>
                <RiCloseLine size={22} />
              </button>
              <RiLockPasswordLine size={28} style={{ color: '#40916C', marginBottom: 10 }} />
              <h3 style={{ fontSize: 14, fontWeight: 900, marginBottom: 2, textAlign: 'center', color: '#1B4332' }}>Ingresar PIN</h3>
              <p style={{ fontSize: 12, color: '#1B4332', fontWeight: 800, marginBottom: 16 }}>{pinMozoTarget.nombre}</p>

              <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
                {[0, 1, 2, 3].map(i => (
                  <div key={i} style={{
                    width: 14, height: 14, borderRadius: '50%',
                    background: pinInput.length > i ? '#1B4332' : '#EBE7DC',
                    border: '1.5px solid #EBE7DC',
                    transition: 'all 0.1s'
                  }} />
                ))}
              </div>

              {pinError && <p style={{ fontSize: 11, color: '#EF4444', fontWeight: 800, marginBottom: 14 }}>{pinError}</p>}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, width: '100%' }}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                  <button 
                    key={num} 
                    onClick={() => handleKeyPress(String(num))} 
                    style={{ 
                      height: 52, borderRadius: 14, border: '1.5px solid #EBE7DC', background: '#F5F2EB', 
                      fontSize: 20, fontWeight: 900, color: '#1B4332', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
                    }}
                  >
                    {num}
                  </button>
                ))}
                <button onClick={() => setPinInput('')} style={{ height: 52, borderRadius: 14, border: 'none', background: 'none', fontSize: 14, fontWeight: 900, color: '#8A8070', cursor: 'pointer' }}>C</button>
                <button onClick={() => handleKeyPress('0')} style={{ height: 52, borderRadius: 14, border: '1.5px solid #EBE7DC', background: '#F5F2EB', fontSize: 20, fontWeight: 900, color: '#1B4332', cursor: 'pointer' }}>0</button>
                <button onClick={handleBackspace} style={{ height: 52, borderRadius: 14, border: 'none', background: 'none', fontSize: 18, fontWeight: 900, color: '#8A8070', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⌫</button>
              </div>
            </div>
          )}
        </div>

      ) : currentView === 'tables_grid' ? (

        /* ════ VIEW 2: TABLES GRID ════ */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
          <div style={{
            display: 'flex',
            background: '#F5F2EB',
            borderRadius: 16,
            padding: 4,
            border: '1px solid #EBE7DC',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
          }}>
            <button
              onClick={() => setTableFilter('mis_mesas')}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 12, border: 'none',
                background: tableFilter === 'mis_mesas' ? '#1B4332' : 'transparent',
                color: tableFilter === 'mis_mesas' ? '#fff' : '#8A8070',
                fontSize: 12, fontWeight: 900, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              👤 Mis Mesas ({misMesasQty})
            </button>
            <button
              onClick={() => setTableFilter('todas')}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 12, border: 'none',
                background: tableFilter === 'todas' ? '#1B4332' : 'transparent',
                color: tableFilter === 'todas' ? '#fff' : '#8A8070',
                fontSize: 12, fontWeight: 900, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              🌐 Todas ({mesas.length})
            </button>
          </div>

          {filteredMesas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', background: '#fff', border: '1.5px solid #EBE7DC', borderRadius: 20 }}>
              <span style={{ fontSize: 32 }}>🪑</span>
              <p style={{ fontSize: 13, color: '#1B4332', fontWeight: 900, marginTop: 8, marginBottom: 4 }}>No tienes mesas asignadas</p>
              <p style={{ fontSize: 11, color: '#8A8070', margin: 0 }}>Ve a la pestaña "Todas" para tomar una comanda.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {filteredMesas.map(table => {
                const isLibre = table.estado === 'libre';
                const isOcupada = table.estado === 'ocupada' || table.estado === 'atendiendo';
                const isWaiting = table.estado === 'esperando_cuenta';
                const isMine = activeMozo && table.mozo_asignado_id === activeMozo.id;

                const orderCreatedAt = tableActiveTimes[table.id];
                const elapsedMinutes = orderCreatedAt 
                  ? Math.floor((Date.now() - new Date(orderCreatedAt).getTime()) / (1000 * 60)) 
                  : 0;

                const isInactiveAlert = isOcupada && elapsedMinutes >= 20;

                let borderColor = '#EBE7DC';
                let statusBg = '#fff';
                let accentColor = '#8A8070';
                
                if (isLibre) {
                  borderColor = '#40916C';
                  statusBg = 'rgba(64,145,108,0.02)';
                  accentColor = '#1B4332';
                } else if (isOcupada) {
                  borderColor = isInactiveAlert ? '#D8A020' : '#EF4444';
                  statusBg = isInactiveAlert ? 'rgba(216,160,32,0.02)' : 'rgba(239,68,68,0.02)';
                  accentColor = isInactiveAlert ? '#D8A020' : '#EF4444';
                } else if (isWaiting) {
                  borderColor = '#D8A020';
                  statusBg = 'rgba(216,160,32,0.04)';
                  accentColor = '#D8A020';
                }

                const assignedMozo = mozos.find(m => m.id === table.mozo_asignado_id);

                return (
                  <div
                    key={table.id}
                    onClick={() => {
                      setSelectedTable(table);
                      if (isLibre) {
                        setOrderCart([]);
                        setCurrentView('order_entry');
                      } else {
                        setCurrentView('table_detail');
                      }
                    }}
                    style={{
                      background: statusBg,
                      border: `2px solid ${borderColor}`,
                      borderRadius: 20,
                      padding: '16px 12px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 6,
                      cursor: 'pointer',
                      position: 'relative',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.01)',
                      transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                      animation: isInactiveAlert ? 'pulse-amber 1.8s infinite' : 'none'
                    }}
                  >
                    {table.mozo_asignado_id && (
                      <span style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        fontSize: 9,
                        fontWeight: 900,
                        padding: '2px 6px',
                        borderRadius: 8,
                        background: isMine ? '#EBF5EF' : '#F5F2EB',
                        color: isMine ? '#1B4332' : '#8A8070',
                        border: `1px solid ${isMine ? '#40916C' : '#EBE7DC'}`
                      }}>
                        {isMine ? 'Mía' : assignedMozo ? assignedMozo.nombre.split(' ')[0] : 'Mozo'}
                      </span>
                    )}

                    <span style={{ fontSize: 24, marginTop: 4 }}>🪑</span>
                    <p style={{ fontSize: 13, fontWeight: 900, color: '#1B4332', margin: 0 }}>{table.numero}</p>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <span style={{
                        fontSize: 8, fontWeight: 900, padding: '2px 8px', borderRadius: 999,
                        background: isLibre ? 'rgba(64,145,108,0.1)' : isOcupada ? 'rgba(239,68,68,0.1)' : 'rgba(216,160,32,0.15)',
                        color: accentColor,
                        textTransform: 'uppercase'
                      }}>
                        {isLibre ? 'Libre' : isOcupada ? 'Ocupada' : 'Pre-Cuenta'}
                      </span>

                      {isOcupada && (
                        <span style={{
                          fontSize: 9,
                          fontWeight: 900,
                          padding: '2px 6px',
                          borderRadius: 6,
                          background: isInactiveAlert ? 'rgba(216,160,32,0.15)' : '#F5F2EB',
                          color: isInactiveAlert ? '#B5800E' : '#8A8070',
                          border: `1px solid ${isInactiveAlert ? '#D8A020' : '#EBE7DC'}`,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          animation: isInactiveAlert ? 'blink 1.5s infinite' : 'none'
                        }}>
                          {isInactiveAlert ? '⚠️ Inactiva: ' : '⏰ '} {elapsedMinutes}m
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      ) : currentView === 'order_entry' ? (

        /* ════ VIEW 3: ORDER ENTRY ════ */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, paddingBottom: 60 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 900, color: '#1B4332' }}>
              Mesa: {selectedTable?.numero}
            </span>
            <button onClick={() => setCurrentView('tables_grid')} style={{ background: 'none', border: 'none', fontSize: 12, fontWeight: 800, color: '#EF4444', cursor: 'pointer' }}>
              Volver
            </button>
          </div>

          {/* SECCIÓN: SUGERENCIAS DE VENTA CRUZADA */}
          {sugerenciasUpsell.length > 0 && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(64,145,108,0.08) 0%, rgba(27,67,50,0.02) 100%)',
              border: '1.5px solid rgba(64,145,108,0.2)',
              borderRadius: 20,
              padding: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 8
            }}>
              <span style={{ fontSize: 10, fontWeight: 900, color: '#1B4332', display: 'flex', alignItems: 'center', gap: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <RiSparklingLine style={{ color: '#40916C' }} /> Sugerencias de Venta Rápida (Upsell)
              </span>
              
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                {sugerenciasUpsell.map(item => (
                  <div
                    key={item.id}
                    style={{
                      background: '#fff',
                      border: '1px solid #EBE7DC',
                      borderRadius: 14,
                      padding: 8,
                      minWidth: 150,
                      maxWidth: 150,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                      flexShrink: 0
                    }}
                  >
                    <span style={{ fontSize: 9, fontWeight: 900, background: 'rgba(64,145,108,0.1)', color: '#1B4332', padding: '2px 6px', borderRadius: 6, alignSelf: 'flex-start' }}>
                      🔥 Popular
                    </span>
                    <p style={{ fontSize: 11, fontWeight: 800, color: '#1B4332', margin: '2px 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.nombre}</p>
                    <p style={{ fontSize: 11, fontWeight: 900, color: '#40916C', margin: 0 }}>S/. {item.precio.toFixed(2)}</p>
                    
                    <button
                      onClick={() => handleAddToCart(item)}
                      style={{
                        marginTop: 4,
                        background: '#1B4332',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        padding: '6px 0',
                        fontSize: 10,
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 2
                      }}
                    >
                      <RiAddLine size={12} /> Sugerir
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Categorías */}
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
            <button
              onClick={() => setSelectedCatId('all')}
              style={{
                padding: '6px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 800,
                background: selectedCatId === 'all' ? '#1B4332' : '#F5F2EB',
                color: selectedCatId === 'all' ? '#fff' : '#8A8070',
                border: '1.5px solid #EBE7DC',
                whiteSpace: 'nowrap'
              }}
            >
              🔍 Todo
            </button>
            {menuCats.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCatId(cat.id)}
                style={{
                  padding: '6px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 800,
                  background: selectedCatId === cat.id ? '#1B4332' : '#F5F2EB',
                  color: selectedCatId === cat.id ? '#fff' : '#8A8070',
                  border: '1.5px solid #EBE7DC',
                  whiteSpace: 'nowrap'
                }}
              >
                {cat.icon || '🍲'} {cat.nombre}
              </button>
            ))}
          </div>

          {/* Lista de Platos */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '45dvh', overflowY: 'auto' }}>
            {menuItems
              .filter(item => selectedCatId === 'all' ? true : item.categoria_id === selectedCatId)
              .map(item => {
                const cartItem = orderCart.find(c => c.item.id === item.id);
                const qty = cartItem ? cartItem.cantidad : 0;
                
                return (
                  <div
                    key={item.id}
                    style={{
                      background: '#fff',
                      border: '1.5px solid #EBE7DC',
                      borderRadius: 16,
                      padding: 10,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10
                    }}
                  >
                    {item.imagen_url && (
                      <img src={item.imagen_url} alt={item.nombre} style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 10 }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 800, color: '#1B4332', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.nombre}</p>
                      <p style={{ fontSize: 11, fontWeight: 900, color: '#40916C', margin: '2px 0 0 0' }}>S/. {item.precio.toFixed(2)}</p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {qty > 0 ? (
                        <>
                          <button onClick={() => handleRemoveFromCart(item.id)} style={{ width: 24, height: 24, borderRadius: 8, border: 'none', background: '#F5F2EB', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#1B4332' }}>
                            <RiSubtractLine size={14} />
                          </button>
                          <span style={{ fontSize: 12, fontWeight: 900, minWidth: 16, textAlign: 'center', color: '#1B4332' }}>{qty}</span>
                        </>
                      ) : null}
                      <button onClick={() => handleAddToCart(item)} style={{ width: 24, height: 24, borderRadius: 8, border: 'none', background: '#1B4332', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <RiAddLine size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>

          {totalCartQty > 0 && (
            <div style={{
              position: 'fixed', bottom: 12, left: 12, right: 12,
              background: '#1B4332', color: '#fff', borderRadius: 16, padding: '12px 16px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              boxShadow: '0 8px 24px rgba(64,145,108,0.3)', cursor: 'pointer', zIndex: 99
            }}
            onClick={() => setShowMobileCart(true)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <RiShoppingCartLine size={18} />
                <span style={{ fontSize: 12, fontWeight: 800 }}>Ver Comanda ({totalCartQty})</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 900 }}>S/. {totalCartPrice.toFixed(2)} ➔</span>
            </div>
          )}
        </div>

      ) : (

        /* ════ VIEW 4: TABLE ACTIVE CONTEXT & CHECKOUT ════ */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 14, fontWeight: 900, color: '#1B4332', margin: 0 }}>Consumo: {selectedTable?.numero}</h3>
            <button onClick={() => { setCurrentView('tables_grid'); setIsSplitMode(false); }} style={{ background: 'none', border: 'none', fontSize: 12, color: '#8A8070', cursor: 'pointer', fontWeight: 800 }}>Volver</button>
          </div>
          
          {!isSplitMode ? (
            <>
              <div style={{ background: '#fff', border: '1.5px solid #EBE7DC', borderRadius: 20, padding: 14 }}>
                {selectedTable?.mozo_asignado_id && (
                  <div style={{
                    background: '#F5F2EB', border: '1px solid #EBE7DC', borderRadius: 12, padding: '8px 12px', fontSize: 11, fontWeight: 800, color: '#1B4332', marginBottom: 12,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <span>👤 Atendido por: <b>{mozos.find(m => m.id === selectedTable.mozo_asignado_id)?.nombre || 'Mozo'}</b></span>
                    {activeMozo && selectedTable.mozo_asignado_id !== activeMozo.id && (
                      <button
                        onClick={() => {
                          if(window.confirm('¿Deseas auto-asignarte esta mesa?')) {
                            assignWaiterToTable(selectedTable.id, activeMozo.id);
                            setSelectedTable(prev => ({ ...prev, mozo_asignado_id: activeMozo.id }));
                            fetchData();
                          }
                        }}
                        style={{ background: '#1B4332', color: '#fff', border: 'none', borderRadius: 8, padding: '4px 8px', fontSize: 10, fontWeight: 800, cursor: 'pointer' }}
                      >
                        Tomar Mesa
                      </button>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                  {activeTableOrderItems.length === 0 ? (
                    <p style={{ fontSize: 12, color: '#8A8070', fontWeight: 700, textAlign: 'center', padding: '10px 0' }}>Cargando consumo activo...</p>
                  ) : (
                    activeTableOrderItems.map(item => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #EBE7DC', paddingBottom: 6 }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: 12, fontWeight: 800, color: '#1B4332' }}>{item.items_menu?.nombre} <span style={{ color: '#8A8070', fontWeight: 700 }}>x{item.cantidad}</span></span>
                          {item.notes && <span style={{ fontSize: 10, color: '#40916C', fontWeight: 800 }}>📝 {item.notes}</span>}
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 900, color: '#40916C' }}>S/. {(item.precio_unitario * item.cantidad).toFixed(2)}</span>
                      </div>
                    ))
                  )}
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => handleRequestAccount(selectedTable.id)}
                    disabled={selectedTable.estado === 'esperando_cuenta'}
                    style={{
                      flex: 1, background: '#D8A020', color: '#fff', border: 'none', borderRadius: 12, padding: '10px 0', fontSize: 11, fontWeight: 900, cursor: 'pointer',
                      opacity: selectedTable.estado === 'esperando_cuenta' ? 0.6 : 1
                    }}
                  >
                    🛎️ Pre-Cuenta
                  </button>
                  <button
                    onClick={() => {
                      setOrderCart([]);
                      setCurrentView('order_entry');
                    }}
                    style={{ flex: 1, background: '#1B4332', color: '#fff', border: 'none', borderRadius: 12, padding: '10px 0', fontSize: 11, fontWeight: 900, cursor: 'pointer' }}
                  >
                    ➕ Agregar Más
                  </button>
                </div>
              </div>

              <div style={{ background: '#fff', border: '1.5px solid #EBE7DC', borderRadius: 20, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F5F2EB', border: '1px solid #EBE7DC', padding: 10, borderRadius: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#1B4332' }}>Total de la Cuenta:</span>
                  <span style={{ fontSize: 14, fontWeight: 900, color: '#40916C' }}>S/. {activeTableTotal.toFixed(2)}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <button onClick={() => handlePayTable(selectedTable.id, 'yape_plin')} style={{ padding: '11px 0', borderRadius: 12, border: '1.5px solid rgba(64,145,108,0.2)', background: 'rgba(64,145,108,0.04)', color: '#1b4332', fontWeight: 900, fontSize: 11, cursor: 'pointer' }}>
                    📱 Yape / Plin
                  </button>
                  <button onClick={() => handlePayTable(selectedTable.id, 'efectivo')} style={{ padding: '11px 0', borderRadius: 12, border: '1.5px solid #EBE7DC', background: '#F5F2EB', color: '#1B4332', fontWeight: 900, fontSize: 11, cursor: 'pointer' }}>
                    💵 Efectivo
                  </button>
                </div>

                <button
                  onClick={() => setIsSplitMode(true)}
                  style={{
                    padding: '12px 0', borderRadius: 12, border: 'none', background: '#40916C', color: '#fff', fontWeight: 900, fontSize: 12, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 4,
                    boxShadow: '0 4px 10px rgba(64,145,108,0.15)'
                  }}
                >
                  <RiExchangeFundsLine size={16} /> ⚖️ Dividir Cuenta (Split Bill)
                </button>

                {/* BOTÓN DE ANULACIÓN */}
                <button
                  onClick={() => setShowCancelModal(true)}
                  style={{
                    padding: '12px 0', borderRadius: 12, border: '1.5px solid #EF4444', background: 'rgba(239,68,68,0.03)', color: '#EF4444', fontWeight: 900, fontSize: 12, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 4
                  }}
                >
                  <RiAlertLine size={16} /> Anular Servicio / Cancelar Mesa
                </button>

                {/* 🛎️ BOTÓN PARA SIMULAR PLATO LISTO (Para Testing del Paso 4) */}
                <button
                  onClick={() => handleSimulateDishReady(selectedTable.id)}
                  style={{
                    padding: '12px 0', borderRadius: 12, border: '1.5px dashed #40916C', background: '#EBF5EF', color: '#1B4332', fontWeight: 900, fontSize: 12, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 4
                  }}
                >
                  🛎️ Test: Simular Plato Listo en Cocina
                </button>
              </div>
            </>
          ) : (
            
            /* ════ MODO DIVIDIR CUENTA INTERACTIVO ════ */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ background: '#fff', border: '1.5px solid #EBE7DC', borderRadius: 20, padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 900, color: '#8A8070', textTransform: 'uppercase' }}>Configurar División</span>
                  <button onClick={() => setIsSplitMode(false)} style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>Cancelar</button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F5F2EB', padding: '10px 14px', borderRadius: 14, border: '1px solid #EBE7DC' }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#1B4332' }}>Número de Personas:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button 
                      onClick={() => setSplitCount(prev => Math.max(2, prev - 1))}
                      style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: '#fff', color: '#1B4332', fontWeight: 900, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #EBE7DC' }}
                    >
                      -
                    </button>
                    <span style={{ fontSize: 15, fontWeight: 900, color: '#1B4332', minWidth: 20, textAlign: 'center' }}>{splitCount}</span>
                    <button 
                      onClick={() => setSplitCount(prev => Math.min(10, prev + 1))}
                      style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: '#fff', color: '#1B4332', fontWeight: 900, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #EBE7DC' }}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div style={{ textAlign: 'center', padding: '12px 0', borderBottom: '1px solid #EBE7DC' }}>
                  <p style={{ fontSize: 11, color: '#8A8070', fontWeight: 700, margin: 0 }}>CADA PERSONA PAGA:</p>
                  <p style={{ fontSize: 24, fontWeight: 950, color: '#40916C', margin: '4px 0 0 0' }}>S/. {pricePerSplitPart.toFixed(2)}</p>
                  <p style={{ fontSize: 10, color: '#8A8070', fontWeight: 600, margin: '2px 0 0 0' }}>De un total de S/. {activeTableTotal.toFixed(2)}</p>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 800, color: '#1B4332', marginBottom: 6 }}>
                    <span>Progreso del Pago:</span>
                    <span>{progressPercent}% ({paidPartsCount}/{splitCount})</span>
                  </div>
                  <div style={{ width: '100%', height: 8, background: '#EBE7DC', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${progressPercent}%`, height: '100%', background: '#40916C', borderRadius: 4, transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '25dvh', overflowY: 'auto' }}>
                  {paidParts.map(part => (
                    <div 
                      key={part.id} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between', 
                        padding: 10, 
                        background: part.paid ? 'rgba(64,145,108,0.04)' : '#FCFBF9', 
                        border: `1.5px solid ${part.paid ? '#40916C' : '#EBE7DC'}`, 
                        borderRadius: 14 
                      }}
                    >
                      <div>
                        <span style={{ fontSize: 12, fontWeight: 900, color: '#1B4332' }}>Persona {part.id}</span>
                        <p style={{ fontSize: 11, color: '#40916C', fontWeight: 800, margin: '2px 0 0 0' }}>S/. {pricePerSplitPart.toFixed(2)}</p>
                      </div>

                      {part.paid ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 10, fontWeight: 900, color: '#40916C', textTransform: 'uppercase', background: 'rgba(64,145,108,0.1)', padding: '2px 6px', borderRadius: 6 }}>
                            ✓ {part.method === 'yape_plin' ? 'Yape/Plin' : 'Efectivo'}
                          </span>
                          <button 
                            onClick={() => handleResetPartialPart(part.id)}
                            style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: 10, fontWeight: 800, cursor: 'pointer', textDecoration: 'underline' }}
                          >
                            Editar
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button 
                            onClick={() => handlePayPartialPart(part.id, 'yape_plin')}
                            style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(64,145,108,0.2)', background: '#fff', color: '#1B4332', fontSize: 10, fontWeight: 800, cursor: 'pointer' }}
                          >
                            📱 Celular
                          </button>
                          <button 
                            onClick={() => handlePayPartialPart(part.id, 'efectivo')}
                            style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #EBE7DC', background: '#fff', color: '#1B4332', fontSize: 10, fontWeight: 800, cursor: 'pointer' }}
                          >
                            💵 Efectivo
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {allPartsPaid && (
                  <button
                    onClick={() => handleCompleteSplitBill(selectedTable.id)}
                    style={{
                      width: '100%', padding: '12px 0', borderRadius: 14, background: '#1B4332', color: '#fff', fontWeight: 950, fontSize: 13, border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      boxShadow: '0 4px 12px rgba(27,67,50,0.25)',
                    }}
                  >
                    <RiCheckDoubleLine size={18} /> Confirmar Pago Total & Liberar
                  </button>
                )}

              </div>
            </div>

          )}

        </div>

      )}

      {/* MODAL: MOBILE CART DETAIL */}
      {showMobileCart && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(45,42,38,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'flex-end', zIndex: 99999
        }}
        onClick={e => { if (e.target === e.currentTarget) setShowMobileCart(false); }}
        >
          <div style={{
            background: '#fff',
            borderTop: '1.5px solid #EBE7DC',
            borderRadius: '24px 24px 0 0',
            padding: 20,
            width: '100%',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            boxShadow: '0 -8px 30px rgba(0,0,0,0.08)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ fontSize: 14, fontWeight: 900, color: '#1B4332', margin: 0 }}>Revisar Comanda - {selectedTable?.numero}</h4>
              <button onClick={() => setShowMobileCart(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#8A8070' }}>
                <RiCloseLine size={24} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', flex: 1, paddingRight: 4 }}>
              {orderCart.map(c => (
                <div key={c.item.id} style={{ borderBottom: '1px solid #EBE7DC', paddingBottom: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#1B4332' }}>{c.item.nombre}</span>
                    <span style={{ fontSize: 12, fontWeight: 900, color: '#40916C' }}>S/. {(c.item.precio * c.cantidad).toFixed(2)}</span>
                  </div>
                  {c.notes && (
                    <span style={{ fontSize: 10, color: '#1B4332', fontWeight: 800 }}>📝 {c.notes}</span>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                    <button onClick={() => { setNoteTargetItemId(c.item.id); setItemNoteInput(c.notes || ''); }} style={{ border: 'none', background: 'none', color: '#8A8070', fontSize: 11, cursor: 'pointer', textDecoration: 'underline', fontWeight: 700 }}>
                      {c.notes ? 'Editar nota' : '+ Comentario'}
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button onClick={() => handleRemoveFromCart(c.item.id)} style={{ width: 24, height: 24, borderRadius: 8, border: 'none', background: '#F5F2EB', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#1B4332' }}><RiSubtractLine size={12} /></button>
                      <span style={{ fontSize: 12, fontWeight: 900, color: '#1B4332' }}>{c.cantidad}</span>
                      <button onClick={() => handleAddToCart(c.item)} style={{ width: 24, height: 24, borderRadius: 8, border: 'none', background: '#F5F2EB', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#1B4332' }}><RiAddLine size={12} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1.5px solid #EBE7DC', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#1B4332' }}>Total a Enviar:</span>
                <span style={{ fontSize: 15, fontWeight: 900, color: '#40916C' }}>
                  S/. {totalCartPrice.toFixed(2)}
                </span>
              </div>
              <button
                onClick={handleConfirmOrder}
                style={{
                  background: '#1B4332',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 12,
                  padding: '12px 0',
                  fontSize: 12,
                  fontWeight: 900,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6
                }}
              >
                <RiCheckDoubleLine size={18} /> Confirmar & Enviar a Cocina
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NOTAS DE PREPARACION */}
      {noteTargetItemId && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(45,42,38,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999999
        }}>
          <div style={{ background: '#fff', border: '1.5px solid #EBE7DC', borderRadius: 20, padding: 16, width: '85%', maxWidth: 300, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h4 style={{ fontSize: 13, fontWeight: 900, color: '#1B4332', margin: 0 }}>Instrucción de Cocina</h4>
            <input
              type="text"
              placeholder="Ej. Sin cebolla / Poco picante"
              value={itemNoteInput}
              onChange={e => setItemNoteInput(e.target.value)}
              className="input-field"
              style={{ fontSize: 12, padding: '8px 10px', color: '#1B4332', background: '#FCFBF9', border: '1px solid #EBE7DC' }}
            />
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setNoteTargetItemId(null)} style={{ flex: 1, padding: '8px 0', background: '#F5F2EB', border: '1px solid #EBE7DC', borderRadius: 10, cursor: 'pointer', fontSize: 11, fontWeight: 800, color: '#8A8070' }}>Cerrar</button>
              <button onClick={handleSaveItemNote} style={{ flex: 1, padding: '8px 0', background: '#1B4332', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 11, fontWeight: 800 }}>Agregar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SEGURIDAD ANULACIÓN / CANCELAR SERVICIO */}
      {showCancelModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(45,42,38,0.6)', backdropFilter: 'blur(6px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999999
        }}>
          <form 
            onSubmit={handleCancelTableEmergency}
            style={{ background: '#fff', border: '1.5px solid #EF4444', borderRadius: 24, padding: 20, width: '90%', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 14, boxShadow: '0 10px 30px rgba(239,68,68,0.1)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#EF4444' }}>
              <RiAlertLine size={26} />
              <h3 style={{ fontSize: 14, fontWeight: 950, margin: 0 }}>Autorizar Anulación</h3>
            </div>
            
            <p style={{ fontSize: 11, color: '#8A8070', fontWeight: 600, margin: 0, lineHeight: 1.4 }}>
              Esta acción anulará el pedido de la mesa y la liberará de inmediato. Requiere clave de supervisor para auditoría.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 10, fontWeight: 800, color: '#1B4332' }}>PIN de Supervisor</label>
              <input
                type="password"
                required
                maxLength={4}
                placeholder="Clave Autorizada (9999)"
                value={cancelPinInput}
                onChange={e => setCancelPinInput(e.target.value)}
                className="input-field"
                style={{ fontSize: 13, padding: '10px 12px', textAlign: 'center', letterSpacing: '0.2em', color: '#1B4332', background: '#FCFBF9', border: '1px solid #EBE7DC' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 10, fontWeight: 800, color: '#1B4332' }}>Motivo de Emergencia</label>
              <input
                type="text"
                required
                placeholder="Ej. Clientes se retiraron por retraso"
                value={cancelReasonInput}
                onChange={e => setCancelReasonInput(e.target.value)}
                className="input-field"
                style={{ fontSize: 12, padding: '9px 12px', color: '#1B4332', background: '#FCFBF9', border: '1px solid #EBE7DC' }}
              />
            </div>

            {cancelError && <p style={{ fontSize: 10, color: '#EF4444', fontWeight: 800, margin: 0 }}>{cancelError}</p>}

            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button 
                type="button" 
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelPinInput('');
                  setCancelReasonInput('');
                  setCancelError('');
                }} 
                style={{ flex: 1, padding: '10px 0', background: '#F5F2EB', border: '1px solid #EBE7DC', borderRadius: 12, cursor: 'pointer', fontSize: 12, fontWeight: 800, color: '#8A8070' }}
              >
                Cerrar
              </button>
              <button 
                type="submit" 
                style={{ flex: 1, padding: '10px 0', background: '#EF4444', color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontSize: 12, fontWeight: 800 }}
              >
                Anular Mesa
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
