// src/utils/botSimulatorEngine.js
import { checkRestaurantOpen } from './scheduleHelper.js';

/**
 * Simula el motor determinista y las respuestas del bot
 * en base al estado de la conversación, el restaurante y el contexto temporal.
 * 
 * @param {Object} params
 * @param {string} params.text - Mensaje enviado por el usuario
 * @param {Object} params.restaurant - Datos del restaurante actual
 * @param {Date|string} [params.simulatedTime] - Hora y fecha simulada
 * @param {Object} [params.sessionState] - Estado de sesión del cliente (paso_actual, etc.)
 * @param {string} [params.customerType] - 'new' | 'vip' | 'paused'
 * @returns {Promise<Object>} {
 *   replyText: string,
 *   tipoRuta: 'determinista' | 'ia_classifier' | 'subworkflow',
 *   intencion: string,
 *   estadoRestaurante: Object,
 *   nextSessionState: Object,
 *   executionTimeMs: number
 * }
 */
export async function simulateBotResponse({
  text = '',
  restaurant,
  simulatedTime = null,
  sessionState = {},
  customerType = 'new'
}) {
  const startTimer = performance.now();
  const raw = text.trim();
  const lower = raw.toLowerCase();

  const rest = restaurant || {
    nombre: 'Suna Plant Based',
    slug: 'suna-plant-based',
    zona_horaria: 'America/Lima',
    direccion: 'Av. Miraflores 1245, Lima, Perú'
  };

  const targetDate = simulatedTime ? new Date(simulatedTime) : new Date();
  const evalEstado = checkRestaurantOpen(rest, targetDate);

  const slug = rest.slug || 'suna';
  const telefono = '51999999999';
  const linkCarta = `https://pedidos-suna.vercel.app/${slug}/ordenar/${telefono}`;

  let pasoActual = sessionState?.paso_actual || 'INACTIVO';
  let nextSession = { ...sessionState };

  // Hora actual para saludos dinámicos
  const hNow = parseInt((evalEstado.currentTimeFormatted || '12').split(':')[0], 10);
  const saludoDespedida = (hNow >= 12 && hNow < 19) ? '¡Que tengas linda tarde!' : '¡Que tengas linda noche!';

  // Objeto estado restaurante para respuestas
  const estadoRest = {
    abierto: evalEstado.isOpen,
    razon: evalEstado.reason,
    mensaje: ''
  };

  if (!evalEstado.isOpen) {
    if (evalEstado.reason === 'cierre_emergencia') {
      estadoRest.mensaje = `¡Hola! Hoy nos encontramos cerrados por ${rest.cierre_emergencia_motivo || 'mantenimiento o evento privado'}. ¡Volvemos a atenderte muy pronto en nuestro horario habitual! 🙌🌿`;
    } else if (evalEstado.reason === 'feriado') {
      estadoRest.mensaje = `¡Hola! Hoy nos encontramos cerrados por feriado. ¡Te esperamos en nuestra próxima jornada con todo el sabor! 🥑✨`;
    } else if (evalEstado.reason === 'dia_descanso') {
      estadoRest.mensaje = `¡Hola! Hoy nuestro equipo se encuentra en descanso semanal 🌿. Puedes ir mirando nuestra carta aquí 👇📲\n${linkCarta}`;
    } else if (evalEstado.reason === 'pausa_turnos') {
      const nextH = evalEstado.nextOpenTime || '19:00';
      estadoRest.mensaje = `¡Hola! 🌿 Nuestra cocina está en pausa de la tarde. Reabrimos para el turno de cena a las ${nextH}. ¡Te esperamos!`;
    } else if (evalEstado.reason === 'antes_apertura') {
      const openH = evalEstado.nextOpenTime || '12:00';
      estadoRest.mensaje = `¡Hola! 🌿 En este momento estamos preparando todo para la apertura. Hoy iniciamos a las ${openH}. ¡Ya puedes ir revisando nuestra carta interactiva! 👇📲\n${linkCarta}`;
    } else {
      const openH = evalEstado.nextOpenTime || '12:00';
      estadoRest.mensaje = `¡Hola! 🌙 Por hoy nuestra cocina ya cerró. Mañana volvemos con toda la frescura desde las ${openH}. ${saludoDespedida} 🥑`;
    }
  } else {
    // Si está abierto por turnos
    if (evalEstado.turno === 'cena') {
      const closeH = evalEstado.closeTime || '23:00';
      estadoRest.mensaje = `¡Hola! Sí, estamos atendiendo en nuestro turno de cena (hasta las ${closeH}) 👨‍🍳🔥\nPuedes pedir calientito directo a tu domicilio aquí 👇📲\n${linkCarta}`;
    } else if (evalEstado.turno === 'almuerzo') {
      const closeH = evalEstado.closeTime || '16:00';
      estadoRest.mensaje = `¡Hola! Sí, estamos atendiendo en nuestro turno de almuerzo (hasta las ${closeH}) 👨‍🍳🔥\nPuedes pedir calientito directo a tu domicilio aquí 👇📲\n${linkCarta}`;
    } else {
      const closeH = evalEstado.closeTime ? ` (hasta las ${evalEstado.closeTime})` : '';
      estadoRest.mensaje = `¡Hola! Sí, claro que sí estamos atendiendo hoy con toda la frescura${closeH} 🙌⏰🌿\nPuedes pedir calientito directo a tu domicilio aquí 👇📲\n${linkCarta}`;
    }
  }

  // 0. Si el cliente está en modo transferido a humano
  if (customerType === 'paused' || sessionState?.handoff_active) {
    const elapsed = Math.round(performance.now() - startTimer);
    return {
      replyText: '*(El bot está pausado para este comensal porque fue derivado a un asesor humano)* 👤📱',
      tipoRuta: 'subworkflow',
      intencion: 'bot_paused_for_human',
      estadoRestaurante: evalEstado,
      nextSessionState: nextSession,
      executionTimeMs: elapsed
    };
  }

  // 1. Escalamiento Humano / Queja (Prioridad Máxima)
  if (/\b(asesor|humano|persona|queja|reclamo|hablar con alguien|ayuda por favor|comunicarme con un asesor|operador|encargado)\b/i.test(lower)) {
    nextSession.handoff_active = true;
    const elapsed = Math.round(performance.now() - startTimer);
    return {
      replyText: '¡Entendido! Dame solo un momentito, te comunico con el encargado para que te atienda personalmente por aquí. ¡Muchas gracias por tu paciencia! 🙌🛵✨',
      tipoRuta: 'subworkflow',
      intencion: 'human_handoff',
      estadoRestaurante: evalEstado,
      nextSessionState: nextSession,
      executionTimeMs: elapsed
    };
  }

  // 2. Re-insistencia tras haber recibido enlace de carta
  const yaEnvioLink = Boolean(sessionState?.yaEnvioLink);
  const regexPideComida = /\b(quiero|dame|traeme|mandame|anotame|pido|favor|hamburguesa|smash|wrap|combo|papas|nuggets|gaseosa)\b/i;

  if (yaEnvioLink && regexPideComida.test(lower) && pasoActual === 'INACTIVO') {
    const elapsed = Math.round(performance.now() - startTimer);
    if (!estadoRest.abierto) {
      return {
        replyText: `${estadoRest.mensaje}\n\n(Apenas abramos cocina con gusto te lo preparamos calientito) 👨‍🍳🔥`,
        tipoRuta: 'determinista',
        intencion: 'pedido_cerrado',
        estadoRestaurante: evalEstado,
        nextSessionState: nextSession,
        executionTimeMs: elapsed
      };
    }
    return {
      replyText: '¡Buenísimo! 🍔 Anotado. ¿Tuviste algún problema abriendo la carta interactiva o prefieres que te tome el pedido por aquí directamente? 😊📝',
      tipoRuta: 'determinista',
      intencion: 'pregunta_reinsistencia_carta',
      estadoRestaurante: evalEstado,
      nextSessionState: nextSession,
      executionTimeMs: elapsed
    };
  }

  // 3. "Quiero lo mismo de ayer"
  if (/\b(lo mismo|lo de ayer|repite mi pedido|pedir lo mismo|lo que pedi|lo de la ultima vez|lo anterior)\b/i.test(lower)) {
    const elapsed = Math.round(performance.now() - startTimer);
    if (!estadoRest.abierto) {
      return {
        replyText: estadoRest.mensaje,
        tipoRuta: 'determinista',
        intencion: 'pedido_cerrado',
        estadoRestaurante: evalEstado,
        nextSessionState: nextSession,
        executionTimeMs: elapsed
      };
    }

    if (customerType === 'vip') {
      nextSession.paso_actual = 'CONFIRMACION_PENDIENTE';
      nextSession.pedido_mock = { total: 42.00 };
      return {
        replyText: `¡Claro que sí! Conozco tu gusto 🙌🌿✨\n\nTu último pedido fue:\n• *1x Hamburguesa Suna Smash* (S/. 32.00)\n• *1x Kombucha Ancestral* (S/. 10.00)\n━━━━━━━━━━━━━━━━━━\n💰 *Total:* S/. 42.00\n📍 *Dirección:* Misma dirección de entrega habitual\n━━━━━━━━━━━━━━━━━━\n¿Confirmas para mandarlo a preparar de una vez? 👨‍🍳🔥\nEscribe *CONFIRMAR* o *MODIFICAR* si deseas cambiar algo.`,
        tipoRuta: 'determinista',
        intencion: 'cargar_lo_mismo_de_ayer',
        estadoRestaurante: evalEstado,
        nextSessionState: nextSession,
        executionTimeMs: elapsed
      };
    } else {
      return {
        replyText: '¡Hola! Estuve buscando en el sistema pero no encuentro un pedido anterior registrado con este número 🌱🔍.\n\n¿Deseas que te tome tu *pedido directamente por aquí* 📝 o prefieres que te pase el *enlace de la carta*? 📲',
        tipoRuta: 'determinista',
        intencion: 'sin_pedido_anterior',
        estadoRestaurante: evalEstado,
        nextSessionState: nextSession,
        executionTimeMs: elapsed
      };
    }
  }

  // 4. Consulta de Horarios / ¿Abierto?
  if (/\b(horario|horarios|atienden hoy|estan atendiendo|esta abierto|abren hoy|a que hora abren|a que hora cierran|estan abiertos|estan cerrados|atienden|atienden ahora)\b/i.test(lower)) {
    const elapsed = Math.round(performance.now() - startTimer);
    return {
      replyText: estadoRest.mensaje,
      tipoRuta: 'determinista',
      intencion: 'horarios_tiempo_real',
      estadoRestaurante: evalEstado,
      nextSessionState: nextSession,
      executionTimeMs: elapsed
    };
  }

  // 5. Flujo Asistido: Iniciar Pedido
  if (pasoActual === 'INACTIVO') {
    if (/\b(tomame el pedido|pedir por aca|pedir por aqui|no puedo abrir|no me abre|no carga|ayudame a pedir|quiero pedir|hacer pedido|armar pedido|pedir|hacer un pedido)\b/i.test(lower) && !/\b(link|enlace|carta interactiva)\b/i.test(lower)) {
      const elapsed = Math.round(performance.now() - startTimer);
      if (!estadoRest.abierto) {
        return {
          replyText: estadoRest.mensaje,
          tipoRuta: 'determinista',
          intencion: 'pedido_cerrado',
          estadoRestaurante: evalEstado,
          nextSessionState: nextSession,
          executionTimeMs: elapsed
        };
      }
      nextSession.paso_actual = 'PIDIENDO_NOMBRE';
      return {
        replyText: '¡Con mucho gusto! Lo armamos juntos directamente por aquí 📝🌱\n\nPara empezar a registrar tu comanda, ¿a *nombre de quién* anotamos el pedido? (Dime tu nombre y apellido) 😊',
        tipoRuta: 'determinista',
        intencion: 'iniciar_pedido_chat',
        estadoRestaurante: evalEstado,
        nextSessionState: nextSession,
        executionTimeMs: elapsed
      };
    }
  }

  // 6. PIDIENDO_NOMBRE
  if (pasoActual === 'PIDIENDO_NOMBRE') {
    nextSession.cliente_nombre = raw;
    nextSession.paso_actual = 'PIDIENDO_PRODUCTOS';
    const elapsed = Math.round(performance.now() - startTimer);
    return {
      replyText: `¡Excelente, *${raw}*! 🙌✨\n\nCuéntame qué platos o bebidas se te antojan hoy 🍔🥗🥤 (puedes decirme cantidades y platos, ej: *\"2 hamburguesas clásicas y 1 limonada\"*)`,
      tipoRuta: 'determinista',
      intencion: 'guardar_nombre',
      estadoRestaurante: evalEstado,
      nextSessionState: nextSession,
      executionTimeMs: elapsed
    };
  }

  // 7. PIDIENDO_PRODUCTOS
  if (pasoActual === 'PIDIENDO_PRODUCTOS' || pasoActual === 'PREGUNTAR_ALGO_MAS') {
    const elapsed = Math.round(performance.now() - startTimer);
    if (/\b(nada mas|eso es todo|listo|seria todo|ya esta|cerrar|continuar|siguiente|solo eso)\b/i.test(lower)) {
      nextSession.paso_actual = 'PIDIENDO_DIRECCION';
      return {
        replyText: '¡Anotado todo con éxito! ✅ Ya casi lo tenemos listo 🛵💨\n\n¿A qué *dirección completa* te lo llevamos? (Indícanos calle, número y si aplica departamento/oficina) 📍',
        tipoRuta: 'determinista',
        intencion: 'ir_a_direccion',
        estadoRestaurante: evalEstado,
        nextSessionState: nextSession,
        executionTimeMs: elapsed
      };
    }

    nextSession.paso_actual = 'PREGUNTAR_ALGO_MAS';
    return {
      replyText: `¡Buenísima elección! 🥑🌿 Sumado a tu pedido:\n• *${raw}*\n\n¿Se te antoja agregar alguna *bebida fresca* 🍹, *postre* 🍰 o algo más?\n(Dime qué más te gustaría, o escribe *Listo* para continuar 🛵)`,
      tipoRuta: 'determinista',
      intencion: 'agregar_platos_texto',
      estadoRestaurante: evalEstado,
      nextSessionState: nextSession,
      executionTimeMs: elapsed
    };
  }

  // 8. PIDIENDO_DIRECCION
  if (pasoActual === 'PIDIENDO_DIRECCION') {
    nextSession.direccion = raw;
    nextSession.paso_actual = 'PIDIENDO_REFERENCIA';
    const elapsed = Math.round(performance.now() - startTimer);
    return {
      replyText: `¡Perfecto! 📍 Dirección guardada: *${raw}*.\n\n¿Alguna *referencia* para el repartidor? 🛵 (ej: *\"frente al parque\"*, *\"portón negro\"*, o escribe *\"ninguna\"*)`,
      tipoRuta: 'determinista',
      intencion: 'guardar_direccion',
      estadoRestaurante: evalEstado,
      nextSessionState: nextSession,
      executionTimeMs: elapsed
    };
  }

  // 9. PIDIENDO_REFERENCIA
  if (pasoActual === 'PIDIENDO_REFERENCIA') {
    nextSession.referencia = raw;
    nextSession.paso_actual = 'PIDIENDO_METODO_PAGO';
    const elapsed = Math.round(performance.now() - startTimer);
    return {
      replyText: '¡Anotadísima la referencia! 🛵💨\n\n¿Cómo prefieres pagar tu pedido? Elige una opción:\n1️⃣ *Yape / Plin* 📲\n2️⃣ *Tarjeta al repartidor* 💳\n3️⃣ *Efectivo contra entrega* 💵',
      tipoRuta: 'determinista',
      intencion: 'guardar_referencia',
      estadoRestaurante: evalEstado,
      nextSessionState: nextSession,
      executionTimeMs: elapsed
    };
  }

  // 10. PIDIENDO_METODO_PAGO
  if (pasoActual === 'PIDIENDO_METODO_PAGO') {
    let metodo = 'Efectivo contra entrega 💵';
    if (/yape|plin|transferencia|1/i.test(lower)) metodo = 'Yape / Plin 📲';
    else if (/tarjeta|pos|debito|credito|2/i.test(lower)) metodo = 'Tarjeta al repartidor 💳';

    nextSession.metodo_pago = metodo;
    nextSession.paso_actual = 'CONFIRMACION_PENDIENTE';
    const elapsed = Math.round(performance.now() - startTimer);
    return {
      replyText: `📋 *RESUMEN FINAL DE TU PEDIDO* 🌿\n━━━━━━━━━━━━━━━━━━\n👤 *Cliente:* ${nextSession.cliente_nombre || 'Cliente'}\n📍 *Dirección:* ${nextSession.direccion || 'Dirección indicada'}\n🛵 *Modalidad:* Delivery express\n💳 *Método de Pago:* ${metodo}\n⏰ *Tiempo estimado:* 30 - 45 min\n━━━━━━━━━━━━━━━━━━\n¿Todo listo para mandarlo a cocina? 👨‍🍳🔥\nEscribe *CONFIRMAR* para procesarlo o *MODIFICAR* si deseas corregir algo.`,
      tipoRuta: 'determinista',
      intencion: 'guardar_pago',
      estadoRestaurante: evalEstado,
      nextSessionState: nextSession,
      executionTimeMs: elapsed
    };
  }

  // 11. CONFIRMACION_PENDIENTE
  if (pasoActual === 'CONFIRMACION_PENDIENTE') {
    const elapsed = Math.round(performance.now() - startTimer);
    if (/\b(confirmar|si|correcto|dale|conforme|de acuerdo|listo|mandalo)\b/i.test(lower)) {
      nextSession.paso_actual = 'INACTIVO';
      return {
        replyText: '🎉 *¡PEDIDO CONFIRMADO Y ENVIADO A COCINA!* 👨‍🍳🔥🌱\n\nNuestro equipo ya está preparando tus platos con los ingredientes más frescos.\n\nTe avisaremos por aquí cuando tu orden *salga en camino* con el repartidor 🛵💨. ¡Muchas gracias por tu preferencia! 💚',
        tipoRuta: 'determinista',
        intencion: 'confirmar_y_cerrar_pedido',
        estadoRestaurante: evalEstado,
        nextSessionState: nextSession,
        executionTimeMs: elapsed
      };
    } else if (/\b(modificar|cambiar|corregir|no)\b/i.test(lower)) {
      nextSession.paso_actual = 'PIDIENDO_PRODUCTOS';
      return {
        replyText: '¡No te preocupes! 🙌 ¿Qué deseas modificar o qué platos prefieres ordenar? Cuéntame y lo actualizamos de inmediato 📝🥑',
        tipoRuta: 'determinista',
        intencion: 'reiniciar_pedido',
        estadoRestaurante: evalEstado,
        nextSessionState: nextSession,
        executionTimeMs: elapsed
      };
    }
  }

  // 12. Heurísticas regulares inmediatas
  // Ubicación
  if (/\b(donde estan|ubicacion|direccion|como llegar|donde queda|local)\b/i.test(lower)) {
    const elapsed = Math.round(performance.now() - startTimer);
    return {
      replyText: `¡Estamos en *${rest.direccion || 'nuestra sucursal principal'}*! 📍🌿\n\n¿Vienes a visitarnos al local 🍽️ o prefieres que te lo enviemos por *delivery*? 🛵💨`,
      tipoRuta: 'determinista',
      intencion: 'ubicacion',
      estadoRestaurante: evalEstado,
      nextSessionState: nextSession,
      executionTimeMs: elapsed
    };
  }

  // Medios de pago
  if (/\b(yape|plin|tarjeta|transferencia|efectivo|metodos de pago|formas de pago|como puedo pagar)\b/i.test(lower)) {
    nextSession.yaEnvioLink = true;
    const elapsed = Math.round(performance.now() - startTimer);
    return {
      replyText: `Aceptamos *Yape*, *Plin*, *tarjetas* 💳 y *efectivo* al recibir 💵.\n\nPuedes elegir tus platos y pagar rápido desde nuestra carta interactiva aquí 👇📲\n${linkCarta}`,
      tipoRuta: 'determinista',
      intencion: 'pagos',
      estadoRestaurante: evalEstado,
      nextSessionState: nextSession,
      executionTimeMs: elapsed
    };
  }

  // Enlace a Carta
  if (/\b(ver carta|el menu|la carta|link de la carta|enlace|carta web|precios|catalogo|hola|buenas)\b/i.test(lower)) {
    nextSession.yaEnvioLink = true;
    const elapsed = Math.round(performance.now() - startTimer);
    return {
      replyText: `¡Hola! 🌱 Te va a encantar nuestra carta interactiva con fotos y precios en vivo. Pide calientito directo a tu domicilio aquí 👇📲\n${linkCarta}`,
      tipoRuta: 'determinista',
      intencion: 'carta_link',
      estadoRestaurante: evalEstado,
      nextSessionState: nextSession,
      executionTimeMs: elapsed
    };
  }

  // Fallback Inteligente (Clasificador IA Gemini simulado)
  const elapsed = Math.round(performance.now() - startTimer);
  return {
    replyText: `¡Hola! 🌱 Gracias por escribirnos. Puedes explorar toda nuestra carta completa y ordenar calientito aquí 👇📲\n${linkCarta}\n\nO si prefieres, dime *\"Quiero pedir por aquí\"* y te tomo el pedido directamente 📝.`,
    tipoRuta: 'ia_classifier',
    intencion: 'ia_conversacional',
    estadoRestaurante: evalEstado,
    nextSessionState: nextSession,
    executionTimeMs: elapsed
  };
}
