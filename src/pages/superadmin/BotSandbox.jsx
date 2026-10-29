// src/pages/superadmin/BotSandbox.jsx
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import { simulateBotResponse } from '../../utils/botSimulatorEngine';

export default function BotSandbox({ restaurantes = [], isDark = false, themePalette = {} }) {
  // 1. Selector de Restaurante Activo - Priorizar el que tiene instancia Evolution o Suna
  const defaultRest = restaurantes.find(r => r.evolution_instance) ||
    restaurantes.find(r => r.slug === 'suna-plant-based') ||
    restaurantes[0] || null;

  const [selectedRestId, setSelectedRestId] = useState(() => defaultRest?.id || '');
  const activeRestaurant = restaurantes.find(r => r.id === selectedRestId) || defaultRest || null;

  // 2. Número de teléfono de prueba / Perfil de cliente
  const [customerPhone, setCustomerPhone] = useState('51999999999');
  const [customerName, setCustomerName] = useState('Cliente WhatsApp');
  const [customerType, setCustomerType] = useState('new'); // 'new' | 'vip' | 'paused'

  // 3. Estado de Chat
  const [messages, setMessages] = useState([]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionState, setSessionState] = useState({ paso_actual: 'INACTIVO' });
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // 4. Modo de Ejecución: 'live_n8n' (100% n8n real + Gemini) | 'simulator' (Local offline)
  const [executionMode, setExecutionMode] = useState('live_n8n');
  const [timeMode, setTimeMode] = useState('real'); // 'real' | 'custom'
  const [customTime, setCustomTime] = useState('13:30');
  const [customDate, setCustomDate] = useState(() => new Date().toISOString().split('T')[0]);

  // 5. Telemetría de la última respuesta
  const [lastTelemetry, setLastTelemetry] = useState({
    intencion: 'En espera de mensaje...',
    tipoRuta: '🌐 n8n Workflow 8xiaIHrcHOTiRAnBav0mj',
    tiempoMs: 0,
    estadoCocina: 'En línea',
    zonaHoraria: activeRestaurant?.zona_horaria || 'America/Lima',
    modelo: 'Gemini 2.5 Flash'
  });

  // 6. Modal de Auditoría
  const [showSuiteModal, setShowSuiteModal] = useState(false);
  const [isSuiteRunning, setIsSuiteRunning] = useState(false);
  const [suiteResults, setSuiteResults] = useState([]);

  // 7. Pestaña Principal: 'chat' | 'triggers'
  const [activeTab, setActiveTab] = useState('chat');
  const [triggerLoading, setTriggerLoading] = useState(false);
  const [triggerFeedback, setTriggerFeedback] = useState(null);
  const [activeTestOrder, setActiveTestOrder] = useState(null);
  const [testDishes, setTestDishes] = useState([]);
  const [networkLogs, setNetworkLogs] = useState([]);

  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Sincronizar selección inicial de restaurante
  useEffect(() => {
    if (restaurantes.length > 0) {
      const current = restaurantes.find(r => r.id === selectedRestId);
      if (!current || !current.evolution_instance) {
        const preferred = restaurantes.find(r => r.evolution_instance) ||
          restaurantes.find(r => r.slug === 'suna-plant-based') ||
          restaurantes[0];
        if (preferred && preferred.id !== selectedRestId) {
          setSelectedRestId(preferred.id);
        }
      }
    }
  }, [restaurantes, selectedRestId]);

  // Cargar historial real desde Supabase cuando cambia el restaurante o el teléfono
  useEffect(() => {
    if (!activeRestaurant?.id) return;
    loadRealHistory();
  }, [activeRestaurant?.id, customerPhone]);

  // Actualizar teléfono según perfil
  const handleCustomerTypeChange = (type) => {
    setCustomerType(type);
    if (type === 'vip') {
      setCustomerPhone('51999999998');
      setCustomerName('Cliente VIP');
    } else if (type === 'paused') {
      setCustomerPhone('51999999997');
      setCustomerName('Cliente Pausado');
    } else {
      setCustomerPhone('51999999999');
      setCustomerName('Cliente WhatsApp');
    }
  };

  // Cargar historial real de conversaciones_whatsapp y estado de sesión de pedido
  const loadRealHistory = async () => {
    if (!activeRestaurant?.id) return;
    setIsLoadingHistory(true);
    try {
      const targetPhone = customerPhone.trim();
      const targetJid = `${targetPhone}@s.whatsapp.net`;

      // Cargar sesión de pedido activa
      const { data: sessionData } = await supabase
        .from('pedidos_sesion_whatsapp')
        .select('*')
        .eq('restaurante_id', activeRestaurant.id)
        .or(`telefono.eq.${targetPhone},telefono.eq.${targetPhone.replace(/^51/, '')}`)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (sessionData && sessionData.length > 0) {
        setSessionState(sessionData[0]);
      } else {
        setSessionState({ paso_actual: 'INACTIVO', items: [], subtotal: 0, total: 0 });
      }

      const { data, error } = await supabase
        .from('conversaciones_whatsapp')
        .select('*')
        .eq('restaurante_id', activeRestaurant.id)
        .or(`telefono_cliente.eq.${targetPhone},telefono_cliente.eq.${targetJid}`)
        .order('created_at', { ascending: true })
        .limit(40);

      if (!error && data && data.length > 0) {
        const loaded = data.map(item => ({
          id: item.id,
          sender: item.tipo_mensaje === 'entrante' ? 'user' : 'bot',
          text: item.contenido || (item.tipo_archivo === 'imagen' ? '📷 [Imagen / Comprobante]' : '🎙️ [Nota de voz]'),
          time: new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          meta: item.tipo_mensaje === 'saliente' ? {
            tipoRuta: '🌐 Historial n8n',
            intencion: 'Respuesta Registrada',
            ms: 0
          } : null
        }));
        setMessages(loaded);
      } else {
        // Mensaje de bienvenida inicial en blanco
        setMessages([
          {
            id: 'msg-welcome',
            sender: 'bot',
            text: `¡Hola! 👋 Bienvenido al WhatsApp oficial de *${activeRestaurant?.nombre || 'Suna'}*.\n\nEscríbeme como un cliente real (pregunta por platos, hamburguesas, horarios, delivery o haz tu pedido) y te responderé en vivo desde el flujo de n8n. 🌿`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            meta: { tipoRuta: '🌐 n8n Live', intencion: 'saludo_bienvenida', ms: 0 }
          }
        ]);
      }
    } catch (err) {
      console.error('Error al cargar historial de chat:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Obtener fecha simulada o actual
  const getEffectiveDate = () => {
    if (timeMode === 'real') return new Date();
    try {
      return new Date(`${customDate}T${customTime}:00`);
    } catch (e) {
      return new Date();
    }
  };

  // Enviar mensaje al bot (100% n8n real)
  const handleSendMessage = async (textToSend = null) => {
    const rawText = (textToSend || inputVal).trim();
    if (!rawText) return;

    const userMsgId = `usr-${Date.now()}`;
    const nowTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 1. Mostrar de inmediato la burbuja del usuario estilo WhatsApp
    const userMessage = {
      id: userMsgId,
      sender: 'user',
      text: rawText,
      time: nowTimeStr
    };

    setMessages(prev => [...prev, userMessage]);
    if (!textToSend) setInputVal('');
    setIsTyping(true);

    const startTime = performance.now();

    try {
      const effectiveDate = getEffectiveDate();

      if (executionMode === 'live_n8n') {
        const targetPhone = customerPhone.trim() || '51999999999';
        const targetJid = `${targetPhone}@s.whatsapp.net`;
        const instanceName = activeRestaurant?.evolution_instance || 'KoratFlow';

        // 1. Obtener el ID del último mensaje saliente antes de disparar a n8n
        const { data: initialLatest } = await supabase
          .from('conversaciones_whatsapp')
          .select('id')
          .eq('tipo_mensaje', 'saliente')
          .or(`telefono_cliente.eq.${targetPhone},telefono_cliente.eq.${targetJid}`)
          .order('created_at', { ascending: false })
          .limit(1);

        const lastSeenId = initialLatest?.[0]?.id || null;

        // 2. Disparar Webhook real a n8n
        const payload = {
          data: {
            key: {
              remoteJid: targetJid,
              fromMe: false,
              id: `SANDBOX-${Date.now()}`
            },
            pushName: customerName,
            messageType: 'conversation',
            message: {
              conversation: rawText
            }
          },
          instance: instanceName,
          sender: targetJid,
          is_sandbox: true,
          simulated_time: timeMode === 'custom' ? effectiveDate.toISOString() : null
        };

        const resp = await fetch('https://hooks.koratflow.agency/webhook/chatbot-green-entrada', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!resp.ok) {
          throw new Error(`n8n Webhook respondió con estado ${resp.status}`);
        }

        // 3. Esperar la respuesta REAL generada por Gemini en n8n
        let n8nReply = null;
        const pollStart = Date.now();
        const maxWaitMs = 25000;

        while (Date.now() - pollStart < maxWaitMs) {
          await new Promise(r => setTimeout(r, 600));

          const { data, error } = await supabase
            .from('conversaciones_whatsapp')
            .select('*')
            .eq('tipo_mensaje', 'saliente')
            .or(`telefono_cliente.eq.${targetPhone},telefono_cliente.eq.${targetJid}`)
            .order('created_at', { ascending: false })
            .limit(1);

          if (!error && data && data.length > 0) {
            // Confirmar que sea un mensaje nuevo (diferente al anterior al envío)
            if (!lastSeenId || data[0].id !== lastSeenId) {
              n8nReply = data[0];
              break;
            }
          }
        }

        const elapsed = Math.round(performance.now() - startTime);

        if (n8nReply) {
          const botMessage = {
            id: n8nReply.id || `bot-${Date.now()}`,
            sender: 'bot',
            text: n8nReply.contenido,
            time: new Date(n8nReply.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            meta: {
              tipoRuta: '🌐 n8n Workflow (Gemini 2.5)',
              intencion: 'Respuesta n8n',
              ms: elapsed
            }
          };

          setMessages(prev => [...prev, botMessage]);
          setLastTelemetry({
            intencion: 'Respuesta Inteligente n8n',
            tipoRuta: '🌐 n8n Live (8xiaIHrcHOTiRAnBav0mj)',
            tiempoMs: elapsed,
            estadoCocina: 'Activo',
            zonaHoraria: activeRestaurant?.zona_horaria || 'America/Lima',
            modelo: 'Gemini 2.5 Flash'
          });
        } else {
          // Timeout de espera de n8n
          throw new Error('n8n procesó el webhook pero tardó más de 20s en registrar la comanda. Verifica la cola de n8n.');
        }
      } else {
        // Modo offline / simulador local
        const res = await simulateBotResponse({
          text: rawText,
          restaurant: activeRestaurant,
          simulatedTime: effectiveDate,
          sessionState,
          customerType
        });

        await new Promise(r => setTimeout(r, 400));
        const elapsed = Math.round(performance.now() - startTime);

        const botMessage = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: res.replyText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          meta: {
            tipoRuta: '⚡ Simulador Local JS',
            intencion: res.intencion,
            ms: elapsed
          }
        };

        setMessages(prev => [...prev, botMessage]);
        setSessionState(res.nextSessionState);
        setLastTelemetry({
          intencion: res.intencion,
          tipoRuta: '⚡ Simulador Local (Offline)',
          tiempoMs: elapsed,
          estadoCocina: res.estadoRestaurante?.badgeText || (res.estadoRestaurante?.isOpen ? 'Abierto' : 'Cerrado'),
          zonaHoraria: activeRestaurant?.zona_horaria || 'America/Lima',
          modelo: 'Local Regex Engine'
        });
      }
    } catch (err) {
      console.error('Error al enviar mensaje:', err);
      const errorMsg = {
        id: `err-${Date.now()}`,
        sender: 'bot',
        text: `⚠️ Error de comunicación con n8n: ${err.message || 'No se recibió respuesta a tiempo'}.\n\n💡 _Tip: Asegúrate de tener seleccionado un restaurante con instancia activa (como Suna Plant Based / KoratFlow) y que el workflow esté activo en n8n._`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        meta: { tipoRuta: 'error', intencion: 'error_conexion', ms: 0 }
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  // Simular envío de Nota de Voz (STT) a n8n
  const handleSendVoiceNote = async () => {
    const audioPrompt = 'Hola buenas tardes, ¿cuál es la hamburguesa más pedida y cuánto cuesta el delivery a Miraflores?';
    handleSendMessage(`🎙️ [Nota de voz de 6 seg]: "${audioPrompt}"`);
  };

  // Simular envío de Voucher / Imagen a n8n
  const handleSendVoucherImage = async () => {
    handleSendMessage('📷 [Comprobante Yape S/. 34.00 enviado] ¿Me confirmas si ya entró mi pedido?');
  };

  // Limpiar pantalla / Nueva conversación
  const handleClearChat = () => {
    setMessages([
      {
        id: `sys-${Date.now()}`,
        sender: 'system',
        text: `🧹 Conversación reiniciada. Puedes escribir un nuevo mensaje para iniciar una interacción fresca con el bot de n8n.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  // Atajos rápidos de tiempo
  const setQuickTime = (hhmm) => {
    setTimeMode('custom');
    setCustomTime(hhmm);
  };

  // 10 Casos Críticos de la Suite de Auditoría
  const SUITE_TEST_CASES = [
    {
      id: 'case-1',
      title: 'Saludo en Pausa de Turnos (17:15)',
      prompt: '¿Atienden hoy?',
      time: '17:15',
      customer: 'new',
      validate: (res) => (res.includes('tarde') || res.includes('pausa') || res.includes('turno')) && !res.includes('noche') && res.includes('cena'),
      description: 'Debe saludar por la tarde, avisar pausa y no decir "linda noche".'
    },
    {
      id: 'case-2',
      title: 'Apertura de Almuerzo (13:30)',
      prompt: '¿Atienden hoy?',
      time: '13:30',
      customer: 'new',
      validate: (res) => res.includes('almuerzo') || res.includes('calientito') || res.includes('abierto') || res.includes('atendiendo'),
      description: 'Debe confirmar atención activa en turno de almuerzo.'
    },
    {
      id: 'case-3',
      title: 'Madrugada Cerrado (03:30 AM)',
      prompt: 'Hola, quiero pedir algo',
      time: '03:30',
      customer: 'new',
      validate: (res) => res.includes('cerró') || res.includes('Mañana') || res.includes('iniciamos') || res.includes('cerrado'),
      description: 'Debe indicar que cocina cerró y avisar horario de mañana.'
    },
    {
      id: 'case-4',
      title: 'Consulta de Hamburguesas',
      prompt: '¿Qué hamburguesas tienen?',
      time: '13:30',
      customer: 'new',
      validate: (res) => res.toLowerCase().includes('burger') || res.toLowerCase().includes('hamburguesa') || res.includes('ordenar'),
      description: 'Debe listar con apetito las opciones de hamburguesas y pasar el link.'
    },
    {
      id: 'case-5',
      title: 'Petición directa de Carta',
      prompt: 'Pásame la carta por favor',
      time: '13:30',
      customer: 'new',
      validate: (res) => res.includes('https://') || res.includes('carta') || res.includes('ordenar'),
      description: 'Debe generar el enlace directo a la Carta Interactiva.'
    },
    {
      id: 'case-6',
      title: 'Escalamiento a Asesor Humano',
      prompt: 'Quiero hablar con una persona urgente',
      time: '13:30',
      customer: 'new',
      validate: (res) => res.includes('humano') || res.includes('persona') || res.includes('asesor') || res.includes('encargado') || res.includes('comunico'),
      description: 'Debe activar el traspaso respetuoso a un humano.'
    }
  ];

  // Ejecutor de Suite
  const handleRunSuite = async () => {
    setIsSuiteRunning(true);
    setShowSuiteModal(true);
    setSuiteResults([]);

    const results = [];

    for (const testCase of SUITE_TEST_CASES) {
      const startTime = performance.now();
      try {
        const testDate = new Date(`${customDate}T${testCase.time}:00`);
        const sim = await simulateBotResponse({
          text: testCase.prompt,
          restaurant: activeRestaurant,
          simulatedTime: testDate,
          sessionState: { paso_actual: 'INACTIVO' },
          customerType: testCase.customer
        });

        const elapsed = Math.round(performance.now() - startTime);
        const passed = testCase.validate(sim.replyText);

        results.push({
          id: testCase.id,
          title: testCase.title,
          passed,
          replyText: sim.replyText,
          time: testCase.time,
          ms: elapsed,
          description: testCase.description
        });
      } catch (err) {
        results.push({
          id: testCase.id,
          title: testCase.title,
          passed: false,
          replyText: `Error: ${err.message}`,
          time: testCase.time,
          ms: 0,
          description: testCase.description
        });
      }

      setSuiteResults([...results]);
      await new Promise(r => setTimeout(r, 100));
    }

    setIsSuiteRunning(false);
  };

  // ── FUNCIONES DEL SIMULADOR DE EVENTOS Y TRIGGERS (FASE 1) ──
  const loadTriggersData = async () => {
    if (!activeRestaurant?.id) return;
    setTriggerLoading(true);
    try {
      const { data: dishes } = await supabase
        .from('items_menu')
        .select('id, nombre, precio')
        .eq('restaurante_id', activeRestaurant.id)
        .eq('disponible', true)
        .limit(6);
      if (dishes) setTestDishes(dishes);

      const { data: lastOrders } = await supabase
        .from('ordenes')
        .select('id, total, estado, tipo_entrega, created_at, clientes(nombre, telefono)')
        .eq('restaurante_id', activeRestaurant.id)
        .order('created_at', { ascending: false })
        .limit(1);
      if (lastOrders && lastOrders.length > 0) {
        setActiveTestOrder(lastOrders[0]);
      }

      await loadNetworkLogs();
    } catch (e) {
      console.error('Error al cargar datos del simulador de triggers:', e);
    } finally {
      setTriggerLoading(false);
    }
  };

  const loadNetworkLogs = async () => {
    if (!activeRestaurant?.id) return;
    try {
      const { data: logs } = await supabase
        .from('conversaciones_whatsapp')
        .select('id, tipo_mensaje, telefono_cliente, nombre_cliente, contenido, created_at')
        .eq('restaurante_id', activeRestaurant.id)
        .order('created_at', { ascending: false })
        .limit(8);
      if (logs) setNetworkLogs(logs);
    } catch (e) {
      console.error('Error al cargar logs:', e);
    }
  };

  const handleCreateTestOrder = async (tipoEntrega = 'delivery') => {
    if (!activeRestaurant?.id) return;
    setTriggerLoading(true);
    setTriggerFeedback(null);
    try {
      const targetPhone = customerPhone.trim() || '51999999999';
      const targetName = customerName || 'Cliente QA WhatsApp';

      let clienteId = null;
      const { data: existingClient } = await supabase
        .from('clientes')
        .select('id')
        .eq('restaurante_id', activeRestaurant.id)
        .eq('telefono', targetPhone)
        .limit(1);

      if (existingClient && existingClient.length > 0) {
        clienteId = existingClient[0].id;
      } else {
        const { data: newClient, error: clientErr } = await supabase
          .from('clientes')
          .insert({
            restaurante_id: activeRestaurant.id,
            nombre: targetName,
            telefono: targetPhone,
            direccion: 'Av. Las Palmeras 123, Miraflores'
          })
          .select('id')
          .single();
        if (clientErr) throw clientErr;
        clienteId = newClient.id;
      }

      let selectedItems = testDishes.slice(0, 2);
      if (selectedItems.length === 0) {
        selectedItems = [{ id: null, nombre: 'Burger Clásica Vegana', precio: 28.00 }];
      }

      const subtotal = selectedItems.reduce((acc, it) => acc + (parseFloat(it.precio) || 0), 0);
      const costoEnvio = tipoEntrega === 'delivery' ? 5.00 : 0.00;
      const total = subtotal + costoEnvio;

      const { data: order, error: orderErr } = await supabase
        .from('ordenes')
        .insert({
          restaurante_id: activeRestaurant.id,
          cliente_id: clienteId,
          total: total,
          tipo_entrega: tipoEntrega,
          estado: 'pendiente',
          estado_pago: 'pendiente',
          metodo_pago: 'efectivo',
          costo_envio: costoEnvio,
          direccion: 'Av. Las Palmeras 123 (Simulador QA)'
        })
        .select('id, total, estado, tipo_entrega, created_at')
        .single();

      if (orderErr) throw orderErr;

      const detallesToInsert = selectedItems
        .filter(it => it.id)
        .map(it => ({
          orden_id: order.id,
          item_id: it.id,
          cantidad: 1,
          precio_unitario: parseFloat(it.precio) || 0
        }));

      if (detallesToInsert.length > 0) {
        await supabase.from('detalles_orden').insert(detallesToInsert);
      }

      setActiveTestOrder({
        ...order,
        clientes: { nombre: targetName, telefono: targetPhone },
        itemsCount: selectedItems.length
      });

      setTriggerFeedback({
        type: 'success',
        title: '¡Orden Creada y Disparada con Éxito!',
        message: `Orden #${order.id.slice(0, 6)} insertada en Supabase. El trigger notificar_orden_nueva() envió el WhatsApp de cocina a ${activeRestaurant.grupo_whatsapp || activeRestaurant.telefono || 'la cocina'}.`
      });

      setTimeout(() => loadNetworkLogs(), 1200);
    } catch (err) {
      console.error('Error al simular orden:', err);
      setTriggerFeedback({
        type: 'error',
        title: 'Error al simular orden',
        message: err.message || 'Ocurrió un error inesperado al insertar la orden.'
      });
    } finally {
      setTriggerLoading(false);
    }
  };

  const handleChangeOrderStatus = async (newStatus) => {
    if (!activeTestOrder?.id) return;
    setTriggerLoading(true);
    setTriggerFeedback(null);
    try {
      const { error } = await supabase
        .from('ordenes')
        .update({ estado: newStatus })
        .eq('id', activeTestOrder.id);

      if (error) throw error;

      setActiveTestOrder(prev => ({ ...prev, estado: newStatus }));

      setTriggerFeedback({
        type: 'success',
        title: `¡Estado actualizado a "${newStatus}"!`,
        message: `El trigger notificar_cambio_estado_orden() despachó el WhatsApp de actualización al cliente (${customerPhone}).`
      });

      setTimeout(() => loadNetworkLogs(), 1200);
    } catch (err) {
      console.error('Error al cambiar estado de orden:', err);
      setTriggerFeedback({
        type: 'error',
        title: 'Error al actualizar estado',
        message: err.message
      });
    } finally {
      setTriggerLoading(false);
    }
  };

  const handleCreateTestReservation = async () => {
    if (!activeRestaurant?.id) return;
    setTriggerLoading(true);
    setTriggerFeedback(null);
    try {
      const targetPhone = customerPhone.trim() || '51999999999';
      const targetName = customerName || 'Cliente Reserva QA';
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const fechaStr = tomorrow.toISOString().split('T')[0];

      const { data: resData, error: resErr } = await supabase
        .from('reservas')
        .insert({
          restaurante_id: activeRestaurant.id,
          cliente_nombre: targetName,
          cliente_telefono: targetPhone,
          fecha: fechaStr,
          hora: '20:30',
          personas: 4,
          estado: 'pendiente'
        })
        .select('*')
        .single();

      if (resErr) throw resErr;

      setTriggerFeedback({
        type: 'success',
        title: '¡Reserva Registrada y Notificada!',
        message: `Reserva para 4 personas el ${fechaStr} a las 20:30 creada. El trigger notificar_reserva_nueva() envió la alerta al WhatsApp del restaurante.`
      });

      setTimeout(() => loadNetworkLogs(), 1200);
    } catch (err) {
      console.error('Error al simular reserva:', err);
      setTriggerFeedback({
        type: 'error',
        title: 'Error al simular reserva',
        message: err.message
      });
    } finally {
      setTriggerLoading(false);
    }
  };

  const hasEvolution = Boolean(activeRestaurant?.evolution_instance);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* ── SELECTOR DE MODO: CHAT VS EVENTOS / TRIGGERS ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        background: isDark ? '#0E1712' : '#FFFFFF',
        border: `1px solid ${isDark ? '#1E2E25' : '#E2EBE5'}`,
        borderRadius: 18,
        padding: '10px 16px',
        boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.35)' : '0 4px 20px rgba(16, 185, 129, 0.05)'
      }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('chat')}
            style={{
              padding: '8px 18px',
              borderRadius: 12,
              border: activeTab === 'chat' ? '1.5px solid #10B981' : `1px solid ${isDark ? '#23372C' : '#CBDAD1'}`,
              background: activeTab === 'chat' ? (isDark ? '#10B98125' : '#ECFDF5') : 'transparent',
              color: activeTab === 'chat' ? '#10B981' : (isDark ? '#94A3B8' : '#64748B'),
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.2s ease'
            }}
          >
            <span>💬</span> Simulador de WhatsApp Chat
          </button>
          <button
            onClick={() => {
              setActiveTab('triggers');
              loadTriggersData();
            }}
            style={{
              padding: '8px 18px',
              borderRadius: 12,
              border: activeTab === 'triggers' ? '1.5px solid #3B82F6' : `1px solid ${isDark ? '#23372C' : '#CBDAD1'}`,
              background: activeTab === 'triggers' ? (isDark ? '#3B82F625' : '#EFF6FF') : 'transparent',
              color: activeTab === 'triggers' ? '#3B82F6' : (isDark ? '#94A3B8' : '#64748B'),
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.2s ease'
            }}
          >
            <span>⚡</span> Simulador de Eventos & Triggers Realtime
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: isDark ? '#64748B' : '#94A3B8' }}>
            Tenant Activo:
          </span>
          <span style={{
            fontSize: 11.5,
            fontWeight: 800,
            padding: '4px 10px',
            borderRadius: 8,
            background: isDark ? '#16241C' : '#F1F5F2',
            color: isDark ? '#34D399' : '#059669',
            border: `1px solid ${isDark ? '#23372C' : '#E2EBE5'}`
          }}>
            🏢 {activeRestaurant?.nombre || 'Suna'}
          </span>
        </div>
      </div>

      {/* ── BARRA SUPERIOR DE CONTROL ── */}
      <div style={{
        background: isDark ? '#0E1712' : '#FFFFFF',
        border: `1px solid ${isDark ? '#1E2E25' : '#E2EBE5'}`,
        borderRadius: 20,
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.35)' : '0 4px 20px rgba(16, 185, 129, 0.05)'
      }}>
        {/* Fila 1: Selección de Negocio & Perfil de Prueba */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Selector de Restaurante */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 260 }}>
            <span style={{ fontSize: 13, fontWeight: 900, color: isDark ? '#34D399' : '#059669', display: 'flex', alignItems: 'center', gap: 4 }}>
              🏢 Restaurante:
            </span>
            <select
              value={selectedRestId}
              onChange={e => setSelectedRestId(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: 12,
                border: `1.5px solid ${isDark ? '#23372C' : '#CBDAD1'}`,
                background: isDark ? '#070C09' : '#F8FAFC',
                color: isDark ? '#F8FAFC' : '#0F172A',
                fontSize: 13,
                fontWeight: 800,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {restaurantes.map(r => (
                <option key={r.id} value={r.id}>
                  {r.nombre} {r.evolution_instance ? `(🟢 ${r.evolution_instance})` : '(⚠️ Sin Evolution)'}
                </option>
              ))}
            </select>
          </div>

          {/* Motor de Ejecución */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: isDark ? '#94A3B8' : '#64748B' }}>
              ⚡ Motor:
            </span>
            <div style={{ display: 'flex', gap: 4, background: isDark ? '#16241C' : '#F1F5F2', padding: 3, borderRadius: 10 }}>
              <button
                onClick={() => setExecutionMode('live_n8n')}
                title="Llama al webhook real de n8n y responde con Gemini 2.5 Flash"
                style={{
                  padding: '6px 12px', borderRadius: 8, border: 'none', fontSize: 11.5, fontWeight: 800, cursor: 'pointer',
                  background: executionMode === 'live_n8n' ? '#10B981' : 'transparent',
                  color: executionMode === 'live_n8n' ? '#fff' : (isDark ? '#94A3B8' : '#64748B'),
                  boxShadow: executionMode === 'live_n8n' ? '0 2px 8px rgba(16, 185, 129, 0.4)' : 'none',
                  display: 'flex', alignItems: 'center', gap: 6
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: executionMode === 'live_n8n' ? '#fff' : '#10B981' }} />
                🌐 n8n + Gemini Real
              </button>
              <button
                onClick={() => setExecutionMode('simulator')}
                title="Respuestas de contingencia en JS para pruebas sin conexión"
                style={{
                  padding: '6px 10px', borderRadius: 8, border: 'none', fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
                  background: executionMode === 'simulator' ? '#64748B' : 'transparent',
                  color: executionMode === 'simulator' ? '#fff' : (isDark ? '#94A3B8' : '#64748B')
                }}
              >
                ⚡ Mock Local
              </button>
            </div>
          </div>

          {/* Perfil de Cliente */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: isDark ? '#94A3B8' : '#64748B' }}>
              👤 Teléfono de Prueba:
            </span>
            <div style={{ display: 'flex', gap: 4, background: isDark ? '#16241C' : '#F1F5F2', padding: 3, borderRadius: 10 }}>
              <button
                onClick={() => handleCustomerTypeChange('new')}
                style={{
                  padding: '5px 10px', borderRadius: 8, border: 'none', fontSize: 11, fontWeight: 800, cursor: 'pointer',
                  background: customerType === 'new' ? '#10B981' : 'transparent',
                  color: customerType === 'new' ? '#fff' : (isDark ? '#94A3B8' : '#64748B')
                }}
              >
                🆕 +51 999 999 999
              </button>
              <button
                onClick={() => handleCustomerTypeChange('vip')}
                style={{
                  padding: '5px 10px', borderRadius: 8, border: 'none', fontSize: 11, fontWeight: 800, cursor: 'pointer',
                  background: customerType === 'vip' ? '#F59E0B' : 'transparent',
                  color: customerType === 'vip' ? '#fff' : (isDark ? '#94A3B8' : '#64748B')
                }}
              >
                ⭐ VIP (+51 999 999 998)
              </button>
            </div>
          </div>

          {/* Acciones */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={loadRealHistory}
              title="Recargar mensajes reales desde Supabase"
              style={{
                padding: '7px 12px',
                borderRadius: 10,
                background: isDark ? '#16241C' : '#E2E8F0',
                border: 'none',
                color: isDark ? '#34D399' : '#0F172A',
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5
              }}
            >
              🔄 Recargar
            </button>
            <button
              onClick={handleClearChat}
              title="Limpiar ventana de chat"
              style={{
                padding: '7px 12px',
                borderRadius: 10,
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#EF4444',
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              🧹 Limpiar
            </button>
          </div>
        </div>

        {/* Fila 2: Máquina del Tiempo & Indicadores */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
          alignItems: 'center',
          paddingTop: 10,
          borderTop: `1px dashed ${isDark ? '#1E2E25' : '#E2EBE5'}`
        }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: isDark ? '#34D399' : '#059669', display: 'flex', alignItems: 'center', gap: 4 }}>
            ⏳ Simular Horario:
          </span>

          <button
            onClick={() => setTimeMode('real')}
            style={{
              padding: '5px 12px', borderRadius: 10, fontSize: 11.5, fontWeight: 800, cursor: 'pointer',
              border: timeMode === 'real' ? '1.5px solid #10B981' : `1px solid ${isDark ? '#23372C' : '#CBDAD1'}`,
              background: timeMode === 'real' ? (isDark ? '#10B98122' : '#ECFDF5') : 'transparent',
              color: timeMode === 'real' ? '#10B981' : (isDark ? '#94A3B8' : '#64748B')
            }}
          >
            ⏱️ Hora Actual Real
          </button>

          <button
            onClick={() => setQuickTime('13:30')}
            style={{
              padding: '5px 10px', borderRadius: 10, fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
              border: `1px solid ${isDark ? '#23372C' : '#CBDAD1'}`,
              background: timeMode === 'custom' && customTime === '13:30' ? '#10B981' : 'transparent',
              color: timeMode === 'custom' && customTime === '13:30' ? '#fff' : (isDark ? '#94A3B8' : '#64748B')
            }}
          >
            🍔 Almuerzo (1:30 PM)
          </button>

          <button
            onClick={() => setQuickTime('17:15')}
            style={{
              padding: '5px 10px', borderRadius: 10, fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
              border: `1px solid ${isDark ? '#23372C' : '#CBDAD1'}`,
              background: timeMode === 'custom' && customTime === '17:15' ? '#8B5CF6' : 'transparent',
              color: timeMode === 'custom' && customTime === '17:15' ? '#fff' : (isDark ? '#94A3B8' : '#64748B')
            }}
          >
            ☕ Pausa (5:15 PM)
          </button>

          <button
            onClick={() => setQuickTime('23:45')}
            style={{
              padding: '5px 10px', borderRadius: 10, fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
              border: `1px solid ${isDark ? '#23372C' : '#CBDAD1'}`,
              background: timeMode === 'custom' && customTime === '23:45' ? '#3B82F6' : 'transparent',
              color: timeMode === 'custom' && customTime === '23:45' ? '#fff' : (isDark ? '#94A3B8' : '#64748B')
            }}
          >
            🌙 Cierre Noche (11:45 PM)
          </button>

          {/* Aviso si el restaurante no tiene instancia Evolution */}
          {!hasEvolution && (
            <span style={{
              marginLeft: 'auto',
              fontSize: 11,
              fontWeight: 800,
              padding: '4px 10px',
              borderRadius: 8,
              background: 'rgba(245, 158, 11, 0.15)',
              color: '#F59E0B',
              border: '1px solid rgba(245, 158, 11, 0.3)'
            }}>
              ⚠️ Usando puente KoratFlow para pruebas
            </span>
          )}
        </div>
      </div>

      {/* ── CUERPO PRINCIPAL CONDICIONAL: CHAT VS SIMULADOR TRIGGERS ── */}
      {activeTab === 'chat' ? (
        <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 320px',
        gap: 16,
        alignItems: 'start'
      }}>
        {/* VENTANA CHAT ESTILO WHATSAPP OFICIAL */}
        <div style={{
          background: isDark ? '#0B141A' : '#EFEAE2',
          border: `1px solid ${isDark ? '#222E35' : '#D1D7DB'}`,
          borderRadius: 24,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          height: '660px',
          boxShadow: isDark ? '0 10px 40px rgba(0,0,0,0.5)' : '0 10px 40px rgba(0, 128, 105, 0.12)',
          position: 'relative'
        }}>
          {/* Header WhatsApp Oficial */}
          <div style={{
            background: isDark ? '#202C33' : '#008069',
            color: '#FFFFFF',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 10,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Avatar con verificación WhatsApp */}
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: isDark ? '#111B21' : '#FFFFFF',
                  color: isDark ? '#34D399' : '#008069',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                  fontWeight: 900,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                }}>
                  🌱
                </div>
                <span style={{
                  position: 'absolute',
                  bottom: -1,
                  right: -1,
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  background: '#25D366',
                  border: '2px solid #FFFFFF'
                }} />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: '#FFFFFF' }}>
                    {activeRestaurant?.nombre || 'Bot Restaurante'}
                  </h4>
                  <span style={{ fontSize: 12 }} title="Cuenta de WhatsApp Verificada">✅</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <span style={{
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: isTyping ? '#25D366' : 'rgba(255,255,255,0.85)'
                  }}>
                    {isTyping ? 'escribiendo respuesta...' : 'en línea'}
                  </span>
                  <span style={{ fontSize: 10, opacity: 0.65 }}>•</span>
                  <span style={{ fontSize: 10.5, opacity: 0.85, background: 'rgba(255,255,255,0.15)', padding: '1px 6px', borderRadius: 4 }}>
                    {customerPhone}
                  </span>
                </div>
              </div>
            </div>

            {/* Badges y Controles del Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                fontSize: 10.5,
                fontWeight: 900,
                padding: '4px 10px',
                borderRadius: 10,
                background: executionMode === 'live_n8n' ? 'rgba(37, 211, 102, 0.25)' : 'rgba(255,255,255,0.2)',
                color: '#FFFFFF',
                border: '1px solid rgba(255,255,255,0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: 5
              }}>
                <span style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: executionMode === 'live_n8n' ? '#25D366' : '#E2E8F0',
                  boxShadow: executionMode === 'live_n8n' ? '0 0 8px #25D366' : 'none'
                }} />
                {executionMode === 'live_n8n' ? 'n8n Live' : 'Mock'}
              </span>
            </div>
          </div>

          {/* Área de Mensajes con textura clásica WhatsApp */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            backgroundImage: isDark
              ? 'radial-gradient(#182229 1px, transparent 1px)'
              : 'radial-gradient(#DFD8CD 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}>
            {/* Píldora de Fecha Estilo WhatsApp */}
            <div style={{ textAlign: 'center', margin: '4px 0 8px' }}>
              <span style={{
                fontSize: 11,
                fontWeight: 700,
                padding: '4px 12px',
                borderRadius: 8,
                background: isDark ? '#182229' : '#FFFFFF',
                color: isDark ? '#8696A0' : '#54656F',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
              }}>
                HOY
              </span>
            </div>

            {isLoadingHistory && (
              <div style={{ textAlign: 'center', color: isDark ? '#8696A0' : '#54656F', fontSize: 12 }}>
                Sincronizando mensajes con WhatsApp...
              </div>
            )}

            {messages.map((msg, idx) => {
              if (msg.sender === 'system') {
                return (
                  <div key={msg.id || idx} style={{ textAlign: 'center', margin: '6px 0' }}>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '5px 14px',
                      borderRadius: 10,
                      background: isDark ? '#182229' : '#FFFFFF',
                      color: isDark ? '#94A3B8' : '#475569',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                    }}>
                      {msg.text}
                    </span>
                  </div>
                );
              }

              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id || idx}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isUser ? 'flex-end' : 'flex-start',
                    maxWidth: '82%',
                    alignSelf: isUser ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div style={{
                    background: isUser
                      ? (isDark ? '#005C4B' : '#D9FDD3')
                      : (isDark ? '#202C33' : '#FFFFFF'),
                    color: isUser
                      ? (isDark ? '#E9EDEF' : '#111B21')
                      : (isDark ? '#E9EDEF' : '#111B21'),
                    padding: '8px 12px 6px',
                    borderRadius: isUser ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                    fontSize: 13.5,
                    lineHeight: 1.45,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                    position: 'relative'
                  }}>
                    {/* Contenido del Mensaje */}
                    <div>{msg.text}</div>

                    {/* Hora y Visto Doble Check */}
                    <div style={{
                      fontSize: 10,
                      textAlign: 'right',
                      marginTop: 3,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      gap: 4,
                      color: isUser
                        ? (isDark ? '#8696A0' : '#667781')
                        : (isDark ? '#8696A0' : '#667781')
                    }}>
                      <span>{msg.time}</span>
                      {isUser && (
                        <span style={{ color: '#53bdeb', fontWeight: 900, fontSize: 12 }}>
                          ✓✓
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Metadata de depuración de n8n bajo la burbuja del bot */}
                  {!isUser && msg.meta && (
                    <div style={{ display: 'flex', gap: 6, marginTop: 3, paddingLeft: 4 }}>
                      <span style={{
                        fontSize: 9.5,
                        fontWeight: 800,
                        color: isDark ? '#34D399' : '#059669',
                        background: isDark ? '#10B98118' : '#DCFCE7',
                        padding: '1px 6px',
                        borderRadius: 6
                      }}>
                        {msg.meta.tipoRuta}
                      </span>
                      {msg.meta.ms > 0 && (
                        <span style={{ fontSize: 9.5, fontWeight: 700, color: isDark ? '#94A3B8' : '#64748B' }}>
                          ⚡ {msg.meta.ms}ms
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Burbuja animada "Escribiendo..." mientras n8n procesa con Gemini */}
            {isTyping && (
              <div style={{
                alignSelf: 'flex-start',
                background: isDark ? '#202C33' : '#FFFFFF',
                padding: '10px 16px',
                borderRadius: '14px 14px 14px 2px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 1px 2px rgba(0,0,0,0.15)'
              }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: isDark ? '#34D399' : '#008069' }}>
                  {activeRestaurant?.nombre || 'Bot'} está escribiendo
                </span>
                <span style={{ display: 'flex', gap: 3 }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#25D366', animation: 'pulse 1s infinite' }} />
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#25D366', animation: 'pulse 1s infinite 0.2s' }} />
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#25D366', animation: 'pulse 1s infinite 0.4s' }} />
                </span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Atajos Rápidos de Preguntas Frecuentes y Pruebas */}
          <div style={{
            padding: '8px 12px',
            background: isDark ? '#111B21' : '#F0F2F5',
            borderTop: `1px solid ${isDark ? '#222E35' : '#E9EDEF'}`,
            display: 'flex',
            gap: 6,
            overflowX: 'auto'
          }}>
            {[
              'No me abre el link, tómame el pedido por acá',
              '2 Hamburguesa Suna Smash',
              'Listo',
              'Av. Larco 743, Miraflores',
              'Frente al parque, portón negro',
              'Yape',
              'CONFIRMAR',
              'Cancelar pedido',
              '¿Atienden hoy?',
              'Pásame la carta',
              'Quiero hablar con un asesor'
            ].map((quickText, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(quickText)}
                disabled={isTyping}
                style={{
                  padding: '5px 11px',
                  borderRadius: 14,
                  border: `1px solid ${isDark ? '#2A3942' : '#D1D7DB'}`,
                  background: isDark ? '#202C33' : '#FFFFFF',
                  color: isDark ? '#E9EDEF' : '#111B21',
                  fontSize: 11.5,
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  cursor: isTyping ? 'not-allowed' : 'pointer',
                  opacity: isTyping ? 0.5 : 1
                }}
              >
                {quickText}
              </button>
            ))}

            {/* Botón para Simular Audio */}
            <button
              onClick={handleSendVoiceNote}
              disabled={isTyping}
              title="Simular envío de nota de voz (Procesada por STT en n8n)"
              style={{
                padding: '5px 11px',
                borderRadius: 14,
                border: '1px solid #10B98140',
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#10B981',
                fontSize: 11.5,
                fontWeight: 800,
                whiteSpace: 'nowrap',
                cursor: 'pointer'
              }}
            >
              🎙️ Probar Audio STT
            </button>

            {/* Botón para Simular Voucher OCR */}
            <button
              onClick={handleSendVoucherImage}
              disabled={isTyping}
              title="Simular envío de comprobante Yape (Procesado por OCR en n8n)"
              style={{
                padding: '5px 11px',
                borderRadius: 14,
                border: '1px solid #8B5CF640',
                background: 'rgba(139, 92, 246, 0.12)',
                color: '#8B5CF6',
                fontSize: 11.5,
                fontWeight: 800,
                whiteSpace: 'nowrap',
                cursor: 'pointer'
              }}
            >
              📷 Probar Voucher OCR
            </button>
          </div>

          {/* Barra de Entrada WhatsApp */}
          <div style={{
            padding: '10px 14px',
            background: isDark ? '#202C33' : '#F0F2F5',
            borderTop: `1px solid ${isDark ? '#2A3942' : '#E9EDEF'}`,
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}>
            <button
              type="button"
              onClick={handleSendVoucherImage}
              title="Adjuntar archivo o comprobante de prueba"
              style={{
                background: 'none',
                border: 'none',
                fontSize: 18,
                cursor: 'pointer',
                opacity: 0.75,
                padding: '4px'
              }}
            >
              📎
            </button>

            <input
              type="text"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSendMessage(); }}
              placeholder="Escribe un mensaje de WhatsApp..."
              disabled={isTyping}
              style={{
                flex: 1,
                padding: '10px 16px',
                borderRadius: 18,
                border: 'none',
                background: isDark ? '#2A3942' : '#FFFFFF',
                color: isDark ? '#E9EDEF' : '#111B21',
                fontSize: 13.5,
                outline: 'none'
              }}
            />

            <button
              onClick={() => handleSendMessage()}
              disabled={!inputVal.trim() || isTyping}
              style={{
                width: 42,
                height: 42,
                borderRadius: '50%',
                background: '#008069',
                border: 'none',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 17,
                cursor: (!inputVal.trim() || isTyping) ? 'not-allowed' : 'pointer',
                opacity: (!inputVal.trim() || isTyping) ? 0.4 : 1,
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 6px rgba(0, 128, 105, 0.3)'
              }}
            >
              ➤
            </button>
          </div>
        </div>

        {/* ── PANEL DERECHO DE TELEMETRÍA (CAJA NEGRA) ── */}
        <div style={{
          background: isDark ? '#0E1712' : '#FFFFFF',
          border: `1px solid ${isDark ? '#1E2E25' : '#E2EBE5'}`,
          borderRadius: 24,
          padding: 18,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.35)' : '0 4px 20px rgba(16, 185, 129, 0.05)'
        }}>
          <h4 style={{ margin: 0, fontSize: 13, fontWeight: 900, color: isDark ? '#34D399' : '#059669', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>🔍</span> Auditoría en Tiempo Real
          </h4>

          {/* Inspector de Carrito y Sesión de Pedido en Supabase */}
          <div style={{
            background: isDark ? '#070C09' : '#F8FAFC',
            border: `1px solid ${sessionState?.paso_actual && sessionState.paso_actual !== 'INACTIVO' ? '#10B981' : (isDark ? '#1E2E25' : '#E2EBE5')}`,
            borderRadius: 14,
            padding: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            boxShadow: sessionState?.paso_actual && sessionState.paso_actual !== 'INACTIVO' ? '0 0 12px rgba(16, 185, 129, 0.2)' : 'none'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: isDark ? '#94A3B8' : '#64748B' }}>
                🛒 SESIÓN PEDIDO (SUPABASE)
              </span>
              <span style={{
                fontSize: 9.5,
                fontWeight: 900,
                padding: '2px 6px',
                borderRadius: 6,
                background: sessionState?.paso_actual === 'INACTIVO' ? 'rgba(148, 163, 184, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                color: sessionState?.paso_actual === 'INACTIVO' ? '#94A3B8' : '#10B981'
              }}>
                {sessionState?.paso_actual || 'INACTIVO'}
              </span>
            </div>

            {Array.isArray(sessionState?.items) && sessionState.items.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ maxHeight: 90, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {sessionState.items.map((it, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: isDark ? '#E2E8F0' : '#1E293B' }}>
                      <span>• {it.cantidad}x {it.nombre}</span>
                      <b style={{ color: '#10B981' }}>S/ {it.subtotal || (it.precio_unitario * it.cantidad) || 0}</b>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, fontWeight: 900, borderTop: `1px dashed ${isDark ? '#23372C' : '#CBDAD1'}`, paddingTop: 4, marginTop: 2 }}>
                  <span>Total estimado:</span>
                  <span style={{ color: '#10B981' }}>S/ {sessionState.total || sessionState.subtotal || 0}</span>
                </div>
                {sessionState.direccion && (
                  <span style={{ fontSize: 10, color: isDark ? '#94A3B8' : '#64748B' }}>
                    📍 {sessionState.direccion}
                  </span>
                )}
              </div>
            ) : (
              <span style={{ fontSize: 11, color: isDark ? '#64748B' : '#94A3B8', fontStyle: 'italic' }}>
                Sin platos agregados al carrito
              </span>
            )}
          </div>

          {/* Tarjeta de Flujo n8n */}
          <div style={{
            background: isDark ? '#070C09' : '#F8FAFC',
            border: `1px solid ${isDark ? '#1E2E25' : '#E2EBE5'}`,
            borderRadius: 14,
            padding: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 6
          }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: isDark ? '#94A3B8' : '#64748B' }}>
              FLUJO DE N8N CONECTADO
            </span>
            <span style={{ fontSize: 12, fontWeight: 900, color: isDark ? '#F8FAFC' : '#0F172A' }}>
              {lastTelemetry.tipoRuta}
            </span>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
              <span style={{ fontSize: 11, color: isDark ? '#94A3B8' : '#64748B' }}>
                Latencia: <b style={{ color: '#10B981' }}>{lastTelemetry.tiempoMs} ms</b>
              </span>
              <span style={{ fontSize: 10.5, fontWeight: 800, color: '#3B82F6', background: 'rgba(59, 130, 246, 0.1)', padding: '2px 6px', borderRadius: 4 }}>
                {lastTelemetry.modelo}
              </span>
            </div>
          </div>

          {/* Instancia de WhatsApp */}
          <div style={{
            background: isDark ? '#070C09' : '#F8FAFC',
            border: `1px solid ${isDark ? '#1E2E25' : '#E2EBE5'}`,
            borderRadius: 14,
            padding: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 6
          }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: isDark ? '#94A3B8' : '#64748B' }}>
              INSTANCIA WHATSAPP EVOLUTION
            </span>
            <span style={{ fontSize: 12, fontWeight: 800, color: hasEvolution ? '#10B981' : '#F59E0B' }}>
              {activeRestaurant?.evolution_instance || 'KoratFlow (Demo Bridge)'}
            </span>
            <span style={{ fontSize: 10.5, color: isDark ? '#94A3B8' : '#64748B' }}>
              Slug: <b>{activeRestaurant?.slug || 'suna-plant-based'}</b>
            </span>
          </div>

          {/* Batería de Pruebas */}
          <button
            onClick={handleRunSuite}
            disabled={isSuiteRunning}
            style={{
              padding: '10px 14px',
              borderRadius: 12,
              background: 'linear-gradient(135deg, #10B981, #059669)',
              border: 'none',
              color: '#FFFFFF',
              fontSize: 12,
              fontWeight: 900,
              cursor: isSuiteRunning ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              boxShadow: '0 2px 10px rgba(16, 185, 129, 0.3)',
              marginTop: 'auto'
            }}
          >
            🚀 Auditoría Rápida de Casos
          </button>
        </div>
      </div>
      ) : (
        /* ── VISTA DEL SIMULADOR DE EVENTOS Y TRIGGERS (FASE 1) ── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Banner de Feedback si hubo acción */}
          {triggerFeedback && (
            <div style={{
              background: triggerFeedback.type === 'success' ? (isDark ? '#064E3B40' : '#ECFDF5') : (isDark ? '#7F1D1D40' : '#FEF2F2'),
              border: `1.5px solid ${triggerFeedback.type === 'success' ? '#10B981' : '#EF4444'}`,
              borderRadius: 16,
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: triggerFeedback.type === 'success' ? '0 4px 16px rgba(16, 185, 129, 0.15)' : '0 4px 16px rgba(239, 68, 68, 0.15)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 24 }}>{triggerFeedback.type === 'success' ? '✅' : '❌'}</span>
                <div>
                  <div style={{ fontWeight: 900, fontSize: 13.5, color: triggerFeedback.type === 'success' ? '#10B981' : '#EF4444' }}>
                    {triggerFeedback.title}
                  </div>
                  <div style={{ fontSize: 12, color: isDark ? '#CBD5E1' : '#334155', marginTop: 2 }}>
                    {triggerFeedback.message}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setTriggerFeedback(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: isDark ? '#94A3B8' : '#64748B' }}
              >
                ✕
              </button>
            </div>
          )}

          {/* Grid de 3 Tarjetas de Pruebas */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 16
          }}>
            {/* TARJETA 1: SIMULAR NUEVA COMPRA */}
            <div style={{
              background: isDark ? '#0E1712' : '#FFFFFF',
              border: `1px solid ${isDark ? '#1E2E25' : '#E2EBE5'}`,
              borderRadius: 20,
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(16, 185, 129, 0.04)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 22 }}>🛍️</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 900, color: isDark ? '#F8FAFC' : '#0F172A' }}>
                      1. Nueva Compra Real
                    </h3>
                    <span style={{ fontSize: 11, color: isDark ? '#94A3B8' : '#64748B' }}>
                      Dispara trigger: <code style={{ color: '#10B981' }}>notificar_orden_nueva()</code>
                    </span>
                  </div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 900, padding: '3px 8px', borderRadius: 8, background: '#10B98120', color: '#10B981' }}>
                  Supabase pg_net
                </span>
              </div>

              <p style={{ margin: 0, fontSize: 12, color: isDark ? '#94A3B8' : '#64748B', lineHeight: 1.5 }}>
                Inserta una orden con platos reales de la carta. Supabase formatea el resumen con platos/precios y lo despacha al WhatsApp del restaurante sin pasar por n8n.
              </p>

              <div style={{
                background: isDark ? '#070C09' : '#F8FAFC',
                border: `1px dashed ${isDark ? '#23372C' : '#CBDAD1'}`,
                borderRadius: 12,
                padding: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                fontSize: 11.5
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: isDark ? '#94A3B8' : '#64748B' }}>Destinatario cocina:</span>
                  <b>{activeRestaurant?.grupo_whatsapp || activeRestaurant?.telefono || 'No configurado'}</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: isDark ? '#94A3B8' : '#64748B' }}>Cliente de prueba:</span>
                  <b>{customerName} ({customerPhone})</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: isDark ? '#94A3B8' : '#64748B' }}>Canal simulado:</span>
                  <span style={{ color: '#10B981', fontWeight: 800 }}>🛵 Delivery a Domicilio</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                <button
                  onClick={() => handleCreateTestOrder('delivery')}
                  disabled={triggerLoading}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #10B981, #059669)',
                    border: 'none',
                    color: '#fff',
                    fontSize: 12.5,
                    fontWeight: 900,
                    cursor: triggerLoading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6
                  }}
                >
                  {triggerLoading ? '⏳ Disparando...' : '🚀 Simular Delivery'}
                </button>
                <button
                  onClick={() => handleCreateTestOrder('salon')}
                  disabled={triggerLoading}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 12,
                    background: isDark ? '#16241C' : '#E2E8F0',
                    border: 'none',
                    color: isDark ? '#E2E8F0' : '#1E293B',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: triggerLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  🍽️ Salón
                </button>
              </div>
            </div>

            {/* TARJETA 2: SIMULAR CAMBIO DE ESTADO */}
            <div style={{
              background: isDark ? '#0E1712' : '#FFFFFF',
              border: `1px solid ${isDark ? '#1E2E25' : '#E2EBE5'}`,
              borderRadius: 20,
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(59, 130, 246, 0.04)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 22 }}>👨‍🍳</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 900, color: isDark ? '#F8FAFC' : '#0F172A' }}>
                      2. Cambio de Estado
                    </h3>
                    <span style={{ fontSize: 11, color: isDark ? '#94A3B8' : '#64748B' }}>
                      Dispara trigger: <code style={{ color: '#3B82F6' }}>notificar_cambio_estado_orden()</code>
                    </span>
                  </div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 900, padding: '3px 8px', borderRadius: 8, background: '#3B82F620', color: '#3B82F6' }}>
                  Aviso Cliente
                </span>
              </div>

              <p style={{ margin: 0, fontSize: 12, color: isDark ? '#94A3B8' : '#64748B', lineHeight: 1.5 }}>
                Actualiza el estado de la orden activa. Supabase notifica al cliente por WhatsApp con el mensaje del nuevo estado sin duplicar envíos.
              </p>

              {/* Orden objetivo activa */}
              <div style={{
                background: isDark ? '#070C09' : '#F8FAFC',
                border: `1px solid ${isDark ? '#1E2E25' : '#CBDAD1'}`,
                borderRadius: 12,
                padding: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                fontSize: 11.5
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: isDark ? '#94A3B8' : '#64748B' }}>Orden seleccionada:</span>
                  {activeTestOrder ? (
                    <span style={{ fontWeight: 900, color: '#3B82F6' }}>
                      #{activeTestOrder.id.slice(0, 8)}
                    </span>
                  ) : (
                    <span style={{ color: '#F59E0B', fontStyle: 'italic' }}>Sin orden activa (Dispara tarjeta 1)</span>
                  )}
                </div>
                {activeTestOrder && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: isDark ? '#94A3B8' : '#64748B' }}>Estado actual:</span>
                    <span style={{
                      fontWeight: 900,
                      padding: '2px 8px',
                      borderRadius: 6,
                      background: activeTestOrder.estado === 'pendiente' ? '#F59E0B20' : '#10B98120',
                      color: activeTestOrder.estado === 'pendiente' ? '#F59E0B' : '#10B981'
                    }}>
                      {activeTestOrder.estado.toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Botones de cambio de estado */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginTop: 'auto' }}>
                <button
                  onClick={() => handleChangeOrderStatus('en_cocina')}
                  disabled={!activeTestOrder || triggerLoading}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 10,
                    border: '1px solid #F59E0B50',
                    background: isDark ? '#F59E0B15' : '#FEF3C7',
                    color: isDark ? '#FBBF24' : '#B45309',
                    fontSize: 11.5,
                    fontWeight: 800,
                    cursor: (!activeTestOrder || triggerLoading) ? 'not-allowed' : 'pointer'
                  }}
                >
                  🔥 En Cocina
                </button>
                <button
                  onClick={() => handleChangeOrderStatus('listo')}
                  disabled={!activeTestOrder || triggerLoading}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 10,
                    border: '1px solid #10B98150',
                    background: isDark ? '#10B98115' : '#ECFDF5',
                    color: isDark ? '#34D399' : '#047857',
                    fontSize: 11.5,
                    fontWeight: 800,
                    cursor: (!activeTestOrder || triggerLoading) ? 'not-allowed' : 'pointer'
                  }}
                >
                  🛍️ Listo
                </button>
                <button
                  onClick={() => handleChangeOrderStatus('en_camino')}
                  disabled={!activeTestOrder || triggerLoading}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 10,
                    border: '1px solid #3B82F650',
                    background: isDark ? '#3B82F615' : '#EFF6FF',
                    color: isDark ? '#60A5FA' : '#1D4ED8',
                    fontSize: 11.5,
                    fontWeight: 800,
                    cursor: (!activeTestOrder || triggerLoading) ? 'not-allowed' : 'pointer'
                  }}
                >
                  🛵 En Camino
                </button>
                <button
                  onClick={() => handleChangeOrderStatus('entregado')}
                  disabled={!activeTestOrder || triggerLoading}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 10,
                    border: '1px solid #10B98150',
                    background: isDark ? '#10B98125' : '#D1FAE5',
                    color: isDark ? '#10B981' : '#065F46',
                    fontSize: 11.5,
                    fontWeight: 900,
                    cursor: (!activeTestOrder || triggerLoading) ? 'not-allowed' : 'pointer'
                  }}
                >
                  🎉 Entregado
                </button>
              </div>
            </div>

            {/* TARJETA 3: SIMULAR SOLICITUD DE RESERVA */}
            <div style={{
              background: isDark ? '#0E1712' : '#FFFFFF',
              border: `1px solid ${isDark ? '#1E2E25' : '#E2EBE5'}`,
              borderRadius: 20,
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(139, 92, 246, 0.04)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 22 }}>📅</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 900, color: isDark ? '#F8FAFC' : '#0F172A' }}>
                      3. Solicitud de Reserva
                    </h3>
                    <span style={{ fontSize: 11, color: isDark ? '#94A3B8' : '#64748B' }}>
                      Dispara trigger: <code style={{ color: '#8B5CF6' }}>notificar_reserva_nueva()</code>
                    </span>
                  </div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 900, padding: '3px 8px', borderRadius: 8, background: '#8B5CF620', color: '#8B5CF6' }}>
                  Aviso Recepción
                </span>
              </div>

              <p style={{ margin: 0, fontSize: 12, color: isDark ? '#94A3B8' : '#64748B', lineHeight: 1.5 }}>
                Inserta una reserva en Supabase. El trigger formatea el aviso con comensales, fecha y hora, despachándolo de inmediato al WhatsApp del restaurante.
              </p>

              <div style={{
                background: isDark ? '#070C09' : '#F8FAFC',
                border: `1px dashed ${isDark ? '#23372C' : '#CBDAD1'}`,
                borderRadius: 12,
                padding: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                fontSize: 11.5
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: isDark ? '#94A3B8' : '#64748B' }}>Cliente:</span>
                  <b>{customerName}</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: isDark ? '#94A3B8' : '#64748B' }}>Horario simulado:</span>
                  <b>Mañana a las 20:30</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: isDark ? '#94A3B8' : '#64748B' }}>Comensales:</span>
                  <span style={{ color: '#8B5CF6', fontWeight: 800 }}>👥 4 personas</span>
                </div>
              </div>

              <button
                onClick={handleCreateTestReservation}
                disabled={triggerLoading}
                style={{
                  marginTop: 'auto',
                  padding: '10px 14px',
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
                  border: 'none',
                  color: '#fff',
                  fontSize: 12.5,
                  fontWeight: 900,
                  cursor: triggerLoading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(139, 92, 246, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6
                }}
              >
                {triggerLoading ? '⏳ Disparando...' : '📅 Simular Solicitud de Reserva'}
              </button>
            </div>
          </div>

          {/* TELEMETRÍA EN VIVO: HISTORIAL DE MENSAJES DISPARADOS */}
          <div style={{
            background: isDark ? '#0E1712' : '#FFFFFF',
            border: `1px solid ${isDark ? '#1E2E25' : '#E2EBE5'}`,
            borderRadius: 20,
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 14
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20 }}>📡</span>
                <h4 style={{ margin: 0, fontSize: 13.5, fontWeight: 900, color: isDark ? '#F8FAFC' : '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Telemetría de Envíos en Tiempo Real (<code style={{ color: '#10B981' }}>conversaciones_whatsapp</code>)
                </h4>
              </div>
              <button
                onClick={loadNetworkLogs}
                style={{
                  padding: '6px 12px',
                  borderRadius: 10,
                  background: isDark ? '#16241C' : '#E2E8F0',
                  border: 'none',
                  color: isDark ? '#34D399' : '#0F172A',
                  fontSize: 11.5,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                🔄 Refrescar Logs
              </button>
            </div>

            {networkLogs.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: isDark ? '#64748B' : '#94A3B8', fontSize: 12, fontStyle: 'italic' }}>
                No hay mensajes recientes registrados aún. Dispara una orden o reserva arriba para ver el tráfico en vivo.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {networkLogs.map((log) => {
                  const isOut = log.tipo_mensaje === 'saliente';
                  return (
                    <div
                      key={log.id}
                      style={{
                        background: isDark ? '#070C09' : '#F8FAFC',
                        border: `1px solid ${isOut ? (isDark ? '#10B98130' : '#A7F3D0') : (isDark ? '#3B82F630' : '#BFDBFE')}`,
                        borderRadius: 12,
                        padding: '10px 14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: 6,
                            fontSize: 9.5,
                            fontWeight: 900,
                            background: isOut ? '#10B98125' : '#3B82F625',
                            color: isOut ? '#10B981' : '#3B82F6'
                          }}>
                            {isOut ? '📤 SALIENTE (EVOLUTION)' : '📥 ENTRANTE'}
                          </span>
                          <span style={{ fontWeight: 800, color: isDark ? '#CBD5E1' : '#475569' }}>
                            Para: {log.telefono_cliente} ({log.nombre_cliente || 'Sin nombre'})
                          </span>
                        </div>
                        <span style={{ color: isDark ? '#64748B' : '#94A3B8' }}>
                          {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                      <div style={{
                        fontSize: 12,
                        color: isDark ? '#E2E8F0' : '#1E293B',
                        whiteSpace: 'pre-wrap',
                        lineHeight: 1.45,
                        fontFamily: 'monospace'
                      }}>
                        {log.contenido}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL: SUITE DE AUDITORÍA ── */}
      {showSuiteModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 200,
          background: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16
        }} onClick={(e) => { if (e.target === e.currentTarget && !isSuiteRunning) setShowSuiteModal(false); }}>
          <div style={{
            background: isDark ? '#0E1712' : '#FFFFFF',
            border: `1.5px solid ${isDark ? '#23372C' : '#CBDAD1'}`,
            borderRadius: 24,
            width: '100%',
            maxWidth: 780,
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
          }}>
            <div style={{
              padding: '18px 24px',
              borderBottom: `1px solid ${isDark ? '#1E2E25' : '#E2EBE5'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: isDark ? '#14221A' : '#F0FDF4'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: isDark ? '#F8FAFC' : '#0F172A' }}>
                  🚀 Batería de Pruebas de Respuestas
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: isDark ? '#34D399' : '#059669', fontWeight: 600 }}>
                  Evaluación de coherencia horaria y calidad conversacional
                </p>
              </div>

              <button
                onClick={() => setShowSuiteModal(false)}
                style={{
                  background: 'none', border: 'none', fontSize: 18, color: isDark ? '#94A3B8' : '#64748B',
                  cursor: 'pointer', padding: 4
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {suiteResults.map((item, idx) => (
                <div
                  key={item.id}
                  style={{
                    background: isDark ? '#070C09' : '#F8FAFC',
                    border: `1.5px solid ${item.passed ? (isDark ? '#10B98140' : '#A7F3D0') : (isDark ? '#EF444440' : '#FECACA')}`,
                    borderRadius: 14,
                    padding: 14,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>{item.passed ? '✅' : '❌'}</span>
                      <span style={{ fontSize: 13, fontWeight: 900, color: isDark ? '#F8FAFC' : '#0F172A' }}>
                        #{idx + 1} {item.title}
                      </span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#10B981' }}>
                      ⚡ {item.ms}ms
                    </span>
                  </div>

                  <div style={{
                    background: isDark ? '#14221A' : '#FFFFFF',
                    border: `1px solid ${isDark ? '#1E2E25' : '#E2EBE5'}`,
                    borderRadius: 10,
                    padding: '8px 12px',
                    fontSize: 12,
                    color: isDark ? '#E2E8F0' : '#1E293B',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {item.replyText}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
