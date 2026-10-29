// src/utils/scheduleHelper.js

/**
 * Normaliza una cadena de texto (sin acentos, minúsculas)
 */
function normalizeText(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Convierte "HH:MM" a minutos desde medianoche
 */
function toMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Formatea minutos a formato 12 horas amigable (ej: 13:00 -> "1:00 PM")
 */
export function formatTime12h(timeStr) {
  if (!timeStr) return '';
  const [hStr, mStr] = timeStr.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr || '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${ampm}`;
}

/**
 * Evalúa el estado en tiempo real de apertura del restaurante.
 * 
 * @param {Object} rest - Objeto restaurante de Supabase
 * @param {Date} [nowDate] - Fecha opcional para pruebas
 * @returns {Object} {
 *   isOpen: boolean,
 *   reason: 'open' | 'cierre_emergencia' | 'feriado' | 'dia_descanso' | 'antes_apertura' | 'pausa_turnos' | 'despues_cierre',
 *   badgeText: string,
 *   bannerTitle: string,
 *   bannerSubtitle: string,
 *   nextOpenTime: string | null,
 *   currentTimeFormatted: string,
 *   timeZone: string
 * }
 */
export function checkRestaurantOpen(rest, nowDate = null) {
  if (!rest) {
    return {
      isOpen: true,
      reason: 'open',
      badgeText: 'Abierto ahora',
      bannerTitle: '',
      bannerSubtitle: '',
      nextOpenTime: null,
      currentTimeFormatted: '',
      timeZone: 'America/Lima'
    };
  }

  const timeZone = rest.zona_horaria || 'America/Lima';
  const now = nowDate || new Date();

  // Obtener fecha y hora en la zona horaria del restaurante
  let dateMap = {};
  try {
    const formatter = new Intl.DateTimeFormat('es-PE', {
      timeZone,
      weekday: 'long',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    const parts = formatter.formatToParts(now);
    parts.forEach(p => { dateMap[p.type] = p.value; });
  } catch (err) {
    // Si la zona horaria es inválida, fallback seguro a America/Lima
    const fallbackFormatter = new Intl.DateTimeFormat('es-PE', {
      timeZone: 'America/Lima',
      weekday: 'long',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    const parts = fallbackFormatter.formatToParts(now);
    parts.forEach(p => { dateMap[p.type] = p.value; });
  }

  const diaSemanaRaw = normalizeText(dateMap.weekday);
  const fechaYMD = `${dateMap.year}-${dateMap.month}-${dateMap.day}`;
  const horaActual = `${dateMap.hour || '12'}:${dateMap.minute || '00'}`;
  const currMin = toMinutes(horaActual);

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

  // 1. Cierre manual o de emergencia activado por el dueño
  if (rest.cierre_emergencia_activo) {
    const mot = rest.cierre_emergencia_motivo || 'mantenimiento o evento privado';
    return {
      isOpen: false,
      reason: 'cierre_emergencia',
      badgeText: 'Cocina en pausa',
      bannerTitle: 'Cocina cerrada por hoy',
      bannerSubtitle: `Atención pausada por ${mot}. Puedes explorar nuestra carta en modo catálogo.`,
      nextOpenTime: null,
      currentTimeFormatted: horaActual,
      timeZone
    };
  }

  // 2. Feriados / Cierres programados por fecha
  const feriados = Array.isArray(rest.dias_feriados) ? rest.dias_feriados : [];
  const feriadoHoy = feriados.find(f => f.fecha === fechaYMD);
  if (feriadoHoy) {
    const mot = feriadoHoy.motivo || 'feriado';
    return {
      isOpen: false,
      reason: 'feriado',
      badgeText: 'Feriado',
      bannerTitle: `Hoy estamos cerrados por ${mot}`,
      bannerSubtitle: 'Nuestro equipo se encuentra en descanso. ¡Explora nuestros platos y te esperamos pronto!',
      nextOpenTime: null,
      currentTimeFormatted: horaActual,
      timeZone
    };
  }

  // 3. Horarios semanales
  const sem = rest.horarios_semanales || {};
  const configHoy = sem[diaKey];

  if (configHoy && configHoy.activo === false) {
    return {
      isOpen: false,
      reason: 'dia_descanso',
      badgeText: 'Día de descanso',
      bannerTitle: 'Hoy no atendemos pedidos',
      bannerSubtitle: `Los días ${dateMap.weekday || 'de hoy'} nuestro equipo descansa. ¡Mira nuestra carta y antojate para mañana!`,
      nextOpenTime: null,
      currentTimeFormatted: horaActual,
      timeZone
    };
  }

  const t1_open = configHoy?.t1_open || '12:00';
  const t1_close = configHoy?.t1_close || '22:00';
  const t2_open = configHoy?.t2_open;
  const t2_close = configHoy?.t2_close;
  const dosTurnos = Boolean(configHoy?.dosTurnos || (t2_open && t2_close && t2_open !== t1_open));

  const t1OpenMin = toMinutes(t1_open);
  const t1CloseMin = toMinutes(t1_close);

  if (dosTurnos && t2_open && t2_close) {
    const t2OpenMin = toMinutes(t2_open);
    const t2CloseMin = toMinutes(t2_close);

    if (currMin >= t1OpenMin && currMin < t1CloseMin) {
      return {
        isOpen: true,
        reason: 'open',
        turno: 'almuerzo',
        closeTime: t1_close,
        badgeText: `Abierto (Turno 1 hasta ${formatTime12h(t1_close)})`,
        bannerTitle: '',
        bannerSubtitle: '',
        nextOpenTime: null,
        currentTimeFormatted: horaActual,
        timeZone
      };
    }

    if (currMin >= t2OpenMin && currMin < t2CloseMin) {
      return {
        isOpen: true,
        reason: 'open',
        turno: 'cena',
        closeTime: t2_close,
        badgeText: `Abierto (Turno 2 hasta ${formatTime12h(t2_close)})`,
        bannerTitle: '',
        bannerSubtitle: '',
        nextOpenTime: null,
        currentTimeFormatted: horaActual,
        timeZone
      };
    }

    if (currMin < t1OpenMin) {
      return {
        isOpen: false,
        reason: 'antes_apertura',
        badgeText: `Abre a las ${formatTime12h(t1_open)}`,
        bannerTitle: 'Cocina en preparación para el almuerzo',
        bannerSubtitle: `Comenzamos a recibir pedidos hoy a las ${formatTime12h(t1_open)}. ¡Revisa la carta y alista tu antojo!`,
        nextOpenTime: formatTime12h(t1_open),
        currentTimeFormatted: horaActual,
        timeZone
      };
    }

    if (currMin >= t1CloseMin && currMin < t2OpenMin) {
      return {
        isOpen: false,
        reason: 'pausa_turnos',
        badgeText: `Reabrimos a las ${formatTime12h(t2_open)}`,
        bannerTitle: 'Pausa de cocina entre turnos',
        bannerSubtitle: `Reabrimos para el turno de cena a las ${formatTime12h(t2_open)} (hasta las ${formatTime12h(t2_close)}).`,
        nextOpenTime: formatTime12h(t2_open),
        currentTimeFormatted: horaActual,
        timeZone
      };
    }

    return {
      isOpen: false,
      reason: 'despues_cierre',
      badgeText: `Cerrado • Abre mañana a las ${formatTime12h(t1_open)}`,
      bannerTitle: 'Cocina cerrada por hoy',
      bannerSubtitle: `Por hoy cerramos servicio. Mañana volvemos a atender pedidos desde las ${formatTime12h(t1_open)}.`,
      nextOpenTime: formatTime12h(t1_open),
      currentTimeFormatted: horaActual,
      timeZone
    };
  }

  // Turno simple
  let isOpenSimple = false;
  if (t1CloseMin < t1OpenMin) {
    // Horario de trasnoche (ej: 18:00 a 02:00)
    isOpenSimple = (currMin >= t1OpenMin || currMin < t1CloseMin);
  } else {
    isOpenSimple = (currMin >= t1OpenMin && currMin < t1CloseMin);
  }

  if (isOpenSimple) {
    return {
      isOpen: true,
      reason: 'open',
      closeTime: t1_close,
      badgeText: `Abierto hasta las ${formatTime12h(t1_close)}`,
      bannerTitle: '',
      bannerSubtitle: '',
      nextOpenTime: null,
      currentTimeFormatted: horaActual,
      timeZone
    };
  }

  if (currMin < t1OpenMin) {
    return {
      isOpen: false,
      reason: 'antes_apertura',
      badgeText: `Abre a las ${formatTime12h(t1_open)}`,
      bannerTitle: 'Cocina en preparación',
      bannerSubtitle: `Hoy abrimos pedidos a las ${formatTime12h(t1_open)} (hasta las ${formatTime12h(t1_close)}). ¡Puedes explorar la carta en modo catálogo!`,
      nextOpenTime: formatTime12h(t1_open),
      currentTimeFormatted: horaActual,
      timeZone
    };
  }

  return {
    isOpen: false,
    reason: 'despues_cierre',
    badgeText: `Cerrado • Abre mañana a las ${formatTime12h(t1_open)}`,
    bannerTitle: 'Cocina cerrada por hoy',
    bannerSubtitle: `Por hoy finalizamos despacho. Mañana te esperamos desde las ${formatTime12h(t1_open)}. ¡Gracias por tu visita!`,
    nextOpenTime: formatTime12h(t1_open),
    currentTimeFormatted: horaActual,
    timeZone
  };
}
