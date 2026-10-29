const meta = $('F7 - Extracción de Metadatos WhatsApp').first().json;
const rest = $('F7 - Obtener Restaurante por Instancia').first().json;
const sesionData = $('F7 - Verificar Sesión Cliente').first().json;
const raw = ($json.texto_limpio || meta.message_content || "").trim();
const text = raw.toLowerCase();
const slug = rest.slug || 'suna';
const telefono = meta.telefono || '';
const linkCarta = "https://pedidos-suna.vercel.app/" + slug + "/ordenar/" + telefono;

let sesion = sesionData?.sesion_pedido || {};
let pasoActual = sesionData?.paso_actual || 'INACTIVO';
const ultimoPedido = sesionData?.ultimo_pedido_historico || {};

// -------------------------------------------------------------------
// EVALUACIÓN DE ESTADO DEL RESTAURANTE (ZONA HORARIA PERÚ GMT-5)
// -------------------------------------------------------------------
let estadoRest = { abierto: true, mensaje: '' };

const now = new Date();
const formatter = new Intl.DateTimeFormat('es-PE', {
  timeZone: 'America/Lima',
  weekday: 'long',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false
});

const parts = formatter.formatToParts(now);
const dateMap = {};
parts.forEach(p => { dateMap[p.type] = p.value; });

const diaSemanaRaw = (dateMap.weekday || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const fechaYMD = (dateMap.year || '') + '-' + (dateMap.month || '') + '-' + (dateMap.day || '');
const horaActual = (dateMap.hour || '12') + ':' + (dateMap.minute || '00');

const diasMap = {
  'lunes': 'lunes',
  'martes': 'martes',
  'miercoles': 'miercoles',
  'jueves': 'jueves',
  'viernes': 'viernes',
  'sabado': 'sabado',
  'domingo': 'domingo'
};
const diaKey = diasMap[diaSemanaRaw] || 'lunes';

if (rest.cierre_emergencia_activo) {
  const mot = rest.cierre_emergencia_motivo || 'mantenimiento o evento privado';
  estadoRest = {
    abierto: false,
    razon: 'cierre_emergencia',
    mensaje: '¡Hola! Hoy nos encontramos cerrados por ' + mot + '. ¡Volvemos a atenderte muy pronto en nuestro horario habitual! 🙌🌿'
  };
} else {
  const feriados = Array.isArray(rest.dias_feriados) ? rest.dias_feriados : [];
  const feriadoHoy = feriados.find(f => f.fecha === fechaYMD);
  if (feriadoHoy) {
    estadoRest = {
      abierto: false,
      razon: 'feriado',
      mensaje: '¡Hola! Hoy nos encontramos cerrados por ' + (feriadoHoy.motivo || 'feriado') + '. ¡Te esperamos en nuestra próxima jornada con todo el sabor! 🥑✨'
    };
  } else {
    const sem = rest.horarios_semanales || {};
    const configHoy = sem[diaKey];

    if (configHoy && configHoy.activo === false) {
      estadoRest = {
        abierto: false,
        razon: 'dia_descanso',
        mensaje: '¡Hola! Los días ' + (dateMap.weekday || 'de hoy') + ' nuestro equipo se encuentra en descanso semanal 🌿. Puedes ir mirando nuestra carta aquí 👇📲\n' + linkCarta
      };
    } else {
      const t1_open = configHoy?.t1_open || '12:00';
      const t1_close = configHoy?.t1_close || '22:00';
      const dosTurnos = !!configHoy?.dosTurnos;
      const t2_open = configHoy?.t2_open;
      const t2_close = configHoy?.t2_close;

      const [hNow, mNow] = horaActual.split(':').map(Number);
      const currMin = (hNow * 60) + mNow;

      const [h1o, m1o] = t1_open.split(':').map(Number);
      const t1OpenMin = (h1o * 60) + m1o;

      const [h1c, m1c] = t1_close.split(':').map(Number);
      const t1CloseMin = (h1c * 60) + m1c;

      if (dosTurnos && t2_open && t2_close) {
        const [h2o, m2o] = t2_open.split(':').map(Number);
        const t2OpenMin = (h2o * 60) + m2o;

        const [h2c, m2c] = t2_close.split(':').map(Number);
        const t2CloseMin = (h2c * 60) + m2c;

        if (currMin >= t1OpenMin && currMin < t1CloseMin) {
          estadoRest = {
            abierto: true,
            mensaje: '¡Hola! Sí, estamos atendiendo en nuestro turno de almuerzo (hasta las ' + t1_close + ') 👨‍🍳🔥\nPuedes pedir calientito directo a tu domicilio aquí 👇📲\n' + linkCarta
          };
        } else if (currMin >= t2OpenMin && currMin < t2CloseMin) {
          estadoRest = {
            abierto: true,
            mensaje: '¡Hola! Sí, estamos atendiendo en nuestro turno de cena (hasta las ' + t2_close + ') 👨‍🍳🔥\nPuedes pedir calientito directo a tu domicilio aquí 👇📲\n' + linkCarta
          };
        } else if (currMin < t1OpenMin) {
          estadoRest = {
            abierto: false,
            razon: 'antes_apertura',
            mensaje: '¡Hola! 🌿 Aún no abrimos. Hoy iniciamos a las ' + t1_open + '. ¡Ya puedes ir revisando nuestra carta interactiva! 👇📲\n' + linkCarta
          };
        } else if (currMin >= t1CloseMin && currMin < t2OpenMin) {
          estadoRest = {
            abierto: false,
            razon: 'pausa_turnos',
            mensaje: '¡Hola! 🌿 Nuestra cocina está en pausa de la tarde. Reabrimos para el turno de cena a las ' + t2_open + ' (hasta las ' + t2_close + '). ¡Te esperamos!'
          };
        } else {
          estadoRest = {
            abierto: false,
            razon: 'despues_cierre',
            mensaje: '¡Hola! 🌙 Por hoy nuestra cocina ya cerró (atendimos hasta las ' + t2_close + '). Mañana volvemos con toda la frescura desde las ' + t1_open + '. ¡Te esperamos! 🥑'
          };
        }
      } else {
        let estaAbierto = false;
        if (t1CloseMin < t1OpenMin) {
          estaAbierto = (currMin >= t1OpenMin || currMin < t1CloseMin);
        } else {
          estaAbierto = (currMin >= t1OpenMin && currMin < t1CloseMin);
        }

        if (estaAbierto) {
          estadoRest = {
            abierto: true,
            mensaje: '¡Hola! Sí, claro que sí estamos atendiendo hoy con toda la frescura (hasta las ' + t1_close + ') 🙌⏰🌿\nPuedes pedir calientito directo a tu domicilio aquí 👇📲\n' + linkCarta
          };
        } else {
          if (currMin < t1OpenMin) {
            estadoRest = {
              abierto: false,
              razon: 'antes_apertura',
              mensaje: '¡Hola! 🌿 En este momento estamos preparando todo para la apertura. Hoy atendemos desde las ' + t1_open + '. ¡Puedes ir mirando la carta! 👇📲\n' + linkCarta
            };
          } else {
            estadoRest = {
              abierto: false,
              razon: 'despues_cierre',
              mensaje: '¡Hola! 🌙 Por hoy nuestra cocina ya cerró (atendemos hasta las ' + t1_close + '). Mañana volvemos desde las ' + t1_open + '. ¡Que tengas linda noche! 🥑'
            };
          }
        }
      }
    }
  }
}

// -------------------------------------------------------------------
// 0. ESCALAMIENTO HUMANO / QUEJA (Prioridad Máxima)
// -------------------------------------------------------------------
if (/\b(asesor|humano|persona|queja|reclamo|hablar con alguien|ayuda por favor|comunicarme con un asesor|operador|encargado)\b/i.test(text)) {
  return [{ json: {
    tipo_ruta: 'subworkflow',
    intencion: 'human_handoff',
    razon: 'Solicitud explícita de cliente',
    texto_ia: '¡Entendido! Dame solo un momentito, te comunico con el encargado para que te atienda personalmente por aquí. ¡Muchas gracias por tu paciencia! 🙌🛵✨'
  } }];
}

// -------------------------------------------------------------------
// 1. RE-INSISTENCIA TRAS HABER RECIBIDO EL ENLACE DE LA CARTA
// -------------------------------------------------------------------
const historialBot = (sesionData?.ultimo_mensaje_bot || '').toLowerCase();
const yaEnvioLink = historialBot.includes('pedidos-suna.vercel.app') || historialBot.includes('carta interactiva') || historialBot.includes('carta web');
const regexPideComida = /\b(quiero|dame|traeme|mandame|anotame|pido|favor|hamburguesa|smash|wrap|combo|papas|nuggets|gaseosa)\b/i;

if (yaEnvioLink && regexPideComida.test(text) && pasoActual === 'INACTIVO') {
  if (!estadoRest.abierto) {
    return [{ json: {
      tipo_ruta: 'determinista',
      intencion: 'pedido_cerrado',
      texto_ia: estadoRest.mensaje + '\n\n(Apenas abramos cocina con gusto te lo preparamos calientito) 👨‍🍳🔥'
    } }];
  }

  return [{ json: {
    tipo_ruta: 'determinista',
    intencion: 'pregunta_reinsistencia_carta',
    texto_ia: '¡Buenísimo! 🍔 Anotado. ¿Tuviste algún problema abriendo la carta interactiva o prefieres que te tome el pedido por aquí directamente? 😊📝'
  } }];
}

// -------------------------------------------------------------------
// 2. DETECCIÓN DE "QUIERO LO MISMO DE AYER" / "REPETIR MI PEDIDO"
// -------------------------------------------------------------------
if (/\b(lo mismo|lo de ayer|repite mi pedido|pedir lo mismo|lo que pedi|lo de la ultima vez|lo anterior)\b/i.test(text)) {
  if (!estadoRest.abierto) {
    return [{ json: {
      tipo_ruta: 'determinista',
      intencion: 'pedido_cerrado',
      texto_ia: estadoRest.mensaje
    } }];
  }

  if (ultimoPedido.encontrado) {
    const listaPlatos = (ultimoPedido.items || []).map(it => '• *' + it.cantidad + 'x ' + it.nombre + '* (S/. ' + parseFloat(it.precio_unitario).toFixed(2) + ')').join('\n');
    const totalTxt = parseFloat(ultimoPedido.total || 0).toFixed(2);
    
    return [{ json: {
      tipo_ruta: 'determinista',
      intencion: 'cargar_lo_mismo_de_ayer',
      proximo_paso: 'CONFIRMACION_PENDIENTE',
      datos_sesion: {
        cliente_nombre: ultimoPedido.cliente_nombre,
        direccion: ultimoPedido.direccion,
        metodo_pago: ultimoPedido.metodo_pago,
        items: ultimoPedido.items,
        total: ultimoPedido.total
      },
      texto_ia: '¡Claro que sí! Conozco tu gusto 🙌🌿✨\n\nTu último pedido fue:\n' + listaPlatos + '\n━━━━━━━━━━━━━━━━━━\n💰 *Total:* S/. ' + totalTxt + '\n📍 *Dirección:* ' + (ultimoPedido.direccion || 'Misma dirección de entrega') + '\n━━━━━━━━━━━━━━━━━━\n¿Confirmas para mandarlo a preparar de una vez? 👨‍🍳🔥\nEscribe *CONFIRMAR* o *MODIFICAR* si deseas cambiar algo.'
    } }];
  } else {
    return [{ json: {
      tipo_ruta: 'determinista',
      intencion: 'sin_pedido_anterior',
      texto_ia: '¡Hola! Estuve buscando en el sistema pero no encuentro un pedido anterior registrado con este número 🌱🔍.\n\n¿Deseas que te tome tu *pedido directamente por aquí* 📝 o prefieres que te pase el *enlace de la carta*? 📲'
    } }];
  }
}

// -------------------------------------------------------------------
// 3. CONSULTA DE HORARIOS / ¿ATIENDEN HOY? / ¿ABIERTO?
// -------------------------------------------------------------------
if (/\b(horario|horarios|atienden hoy|estan atendiendo|esta abierto|abren hoy|a que hora abren|a que hora cierran|estan abiertos|estan cerrados|atienden|atienden ahora)\b/i.test(text)) {
  return [{ json: {
    tipo_ruta: 'determinista',
    intencion: 'horarios_tiempo_real',
    texto_ia: estadoRest.mensaje
  } }];
}

// -------------------------------------------------------------------
// 4. FLUJO ASISTIDO DE PEDIDO (RESPETA MODO TOMA PEDIDOS)
// -------------------------------------------------------------------
const modoPedidos = rest.modo_toma_pedidos || 'bot';

if (pasoActual === 'INACTIVO') {
  const quierePedir = /(tomame el pedido|pedir por aca|pedir por aqui|quisiera pedirlo por aqui|quiero pedirlo por aqui|quisiera pedir por aca|quiero pedir por aca|quisiera pedir|quiero pedir|no puedo abrir|no me abre|no carga|ayudame a pedir|hacer pedido|armar pedido|hacer un pedido)/i.test(text) && !/(link|enlace|carta interactiva)/i.test(text);

  if (quierePedir) {
    if (!estadoRest.abierto) {
      return [{ json: {
        tipo_ruta: 'determinista',
        intencion: 'pedido_cerrado',
        texto_ia: estadoRest.mensaje
      } }];
    }

    // Si el negocio configuró modo 'humano', transferir al asesor humano
    if (modoPedidos === 'humano') {
      return [{ json: {
        tipo_ruta: 'subworkflow',
        intencion: 'derivar_a_humano',
        razon: 'Cliente solicitó tomar pedido directamente por WhatsApp'
      } }];
    }

    // Modo 'bot': iniciar pedido guiado y empático
    return [{ json: {
      tipo_ruta: 'determinista',
      intencion: 'iniciar_pedido_chat',
      proximo_paso: 'PIDIENDO_NOMBRE',
      texto_ia: '¡Con mucho gusto! Lo armamos juntos directamente por aquí 📝🌱\n\nPara empezar a registrar tu comanda, ¿a *nombre de quién* anotamos el pedido? (Dime tu nombre y apellido) 😊'
    } }];
  }
}
// 5. PIDIENDO_NOMBRE
if (pasoActual === 'PIDIENDO_NOMBRE') {
  const nombreCliente = raw;
  return [{ json: {
    tipo_ruta: 'determinista',
    intencion: 'guardar_nombre',
    proximo_paso: 'PIDIENDO_PRODUCTOS',
    cliente_nombre: nombreCliente,
    texto_ia: '¡Excelente, *' + nombreCliente + '*! 🙌✨\n\nCuéntame qué platos o bebidas se te antojan hoy 🍔🥗🥤 (puedes decirme cantidades y platos, ej: *"2 hamburguesas clásicas y 1 limonada"*)'
  } }];
}

// 6. PIDIENDO_PRODUCTOS o PREGUNTAR_ALGO_MAS
if (pasoActual === 'PIDIENDO_PRODUCTOS' || pasoActual === 'PREGUNTAR_ALGO_MAS') {
  if (/\b(nada mas|eso es todo|listo|seria todo|ya esta|cerrar|continuar|siguiente|solo eso)\b/i.test(text)) {
    return [{ json: {
      tipo_ruta: 'determinista',
      intencion: 'ir_a_direccion',
      proximo_paso: 'PIDIENDO_DIRECCION',
      texto_ia: '¡Anotado todo con éxito! ✅ Ya casi lo tenemos listo 🛵💨\n\n¿A qué *dirección completa* te lo llevamos? (Indícanos calle, número y si aplica departamento/oficina) 📍'
    } }];
  }

  return [{ json: {
    tipo_ruta: 'determinista',
    intencion: 'agregar_platos_texto',
    proximo_paso: 'PREGUNTAR_ALGO_MAS',
    item_texto: raw,
    texto_ia: '¡Buenísima elección! 🥑🌿 Sumado a tu pedido:\n• *' + raw + '*\n\n¿Se te antoja agregar alguna *bebida fresca* 🍹, *postre* 🍰 o algo más?\n(Dime qué más te gustaría, o escribe *Listo* para continuar 🛵)'
  } }];
}

// 7. PIDIENDO_DIRECCION
if (pasoActual === 'PIDIENDO_DIRECCION') {
  return [{ json: {
    tipo_ruta: 'determinista',
    intencion: 'guardar_direccion',
    proximo_paso: 'PIDIENDO_REFERENCIA',
    direccion: raw,
    texto_ia: '¡Perfecto! 📍 Dirección guardada: *' + raw + '*.\n\n¿Alguna *referencia* para el repartidor? 🛵 (ej: *"frente al parque"*, *"portón negro"*, o escribe *"ninguna"*)'
  } }];
}

// 8. PIDIENDO_REFERENCIA
if (pasoActual === 'PIDIENDO_REFERENCIA') {
  return [{ json: {
    tipo_ruta: 'determinista',
    intencion: 'guardar_referencia',
    proximo_paso: 'PIDIENDO_METODO_PAGO',
    referencia: raw,
    texto_ia: '¡Anotadísima la referencia! 🛵💨\n\n¿Cómo prefieres pagar tu pedido? Elige una opción:\n1️⃣ *Yape / Plin* 📲\n2️⃣ *Tarjeta al repartidor* 💳\n3️⃣ *Efectivo contra entrega* 💵'
  } }];
}

// 9. PIDIENDO_METODO_PAGO
if (pasoActual === 'PIDIENDO_METODO_PAGO') {
  let metodo = 'Efectivo contra entrega 💵';
  if (/yape|plin|transferencia|1/i.test(text)) metodo = 'Yape / Plin 📲';
  else if (/tarjeta|pos|debito|credito|2/i.test(text)) metodo = 'Tarjeta al repartidor 💳';
  else metodo = 'Efectivo contra entrega 💵';

  return [{ json: {
    tipo_ruta: 'determinista',
    intencion: 'guardar_pago',
    proximo_paso: 'CONFIRMACION_PENDIENTE',
    metodo_pago: metodo,
    texto_ia: `📋 *RESUMEN FINAL DE TU PEDIDO* 🌿\n━━━━━━━━━━━━━━━━━━\n👤 *Cliente:* ` + (sesion.cliente_nombre || meta.nombre_cliente) + `\n📍 *Dirección:* ` + (sesion.direccion || 'Dirección indicada') + `\n🛵 *Modalidad:* Delivery express\n💳 *Método de Pago:* ` + metodo + `\n⏰ *Tiempo estimado:* 30 - 45 min\n━━━━━━━━━━━━━━━━━━\n¿Todo listo para mandarlo a cocina? 👨‍🍳🔥\nEscribe *CONFIRMAR* para procesarlo o *MODIFICAR* si deseas corregir algo.`
  } }];
}

// 10. CONFIRMACION_PENDIENTE
if (pasoActual === 'CONFIRMACION_PENDIENTE') {
  if (/\b(confirmar|si|correcto|dale|conforme|de acuerdo|listo|mandalo)\b/i.test(text)) {
    return [{ json: {
      tipo_ruta: 'determinista',
      intencion: 'confirmar_y_cerrar_pedido',
      proximo_paso: 'INACTIVO',
      texto_ia: '🎉 *¡PEDIDO CONFIRMADO Y ENVIADO A COCINA!* 👨‍🍳🔥🌱\n\nNuestro equipo ya está preparando tus platos con los ingredientes más frescos.\n\nTe avisaremos por aquí cuando tu orden *salga en camino* con el repartidor 🛵💨. ¡Muchas gracias por tu preferencia! 💚'
    } }];
  } else if (/\b(modificar|cambiar|corregir|no)\b/i.test(text)) {
    return [{ json: {
      tipo_ruta: 'determinista',
      intencion: 'reiniciar_pedido',
      proximo_paso: 'PIDIENDO_PRODUCTOS',
      texto_ia: '¡No te preocupes! 🙌 ¿Qué deseas modificar o qué platos prefieres ordenar? Cuéntame y lo actualizamos de inmediato 📝🥑'
    } }];
  }
}

// -------------------------------------------------------------------
// 11. Heurísticas regulares (Ubicación, Pagos, Carta)
// -------------------------------------------------------------------
// A. Ubicación y Dirección
if (/\b(donde estan|ubicacion|direccion|como llegar|donde queda|local)\b/i.test(text)) {
  return [{ json: {
    tipo_ruta: 'determinista',
    intencion: 'ubicacion',
    texto_ia: '¡Estamos en *' + (rest.direccion || 'nuestra sucursal principal') + '*! 📍🌿\n\n¿Vienes a visitarnos al local 🍽️ o prefieres que te lo enviemos por *delivery*? 🛵💨'
  } }];
}

// B. Medios de Pago
if (/\b(yape|plin|tarjeta|transferencia|efectivo|metodos de pago|formas de pago|como puedo pagar)\b/i.test(text)) {
  return [{ json: {
    tipo_ruta: 'determinista',
    intencion: 'pagos',
    texto_ia: 'Aceptamos *Yape*, *Plin*, *tarjetas* 💳 y *efectivo* al recibir 💵.\n\nPuedes elegir tus platos y pagar rápido desde nuestra carta interactiva aquí 👇📲\n' + linkCarta
  } }];
}

// C. Enlace Directo a Carta / Pedir Online
if (/\b(ver carta|el menu|la carta|link de la carta|enlace|carta web|precios|catalogo)\b/i.test(text)) {
  return [{ json: {
    tipo_ruta: 'determinista',
    intencion: 'carta_link',
    texto_ia: '¡Te va a encantar! 🤤 Pídela calientita directo a tu domicilio aquí 👇📲\n' + linkCarta
  } }];
}

// Si no coincide con ninguna regla determinista, derivamos al Clasificador IA Ligero
return [{ json: {
  tipo_ruta: 'ia_classifier',
  intencion: 'desconocida',
  mensaje_cliente: raw
} }];