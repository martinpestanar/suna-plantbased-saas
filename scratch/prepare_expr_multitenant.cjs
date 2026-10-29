const fs = require('fs');

const rawExpr = `={{
  (() => {
    const rawWebhook = $('F7 - Webhook Entrada').first().json.body?.data?.message || {};
    const locMsg = rawWebhook.locationMessage || rawWebhook.liveLocationMessage;
    const rawMsg = $('F7 - Extracción de Metadatos WhatsApp').first().json.message_content || '';
    const msg = rawMsg.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '');
    const rest = $('F7 - Obtener Restaurante por Instancia').first().json;
    const nombre = rest.nombre || 'Restaurante';
    const slug = rest.slug || 'menu';
    const tel = $('F7 - Extracción de Metadatos WhatsApp').first().json.telefono || '';
    const orderLink = '👉 https://pedidos-suna.vercel.app/' + slug + '/ordenar/' + tel;
    const currency = rest.simbolo_moneda || 'S/';

    // A. DETECCIÓN DE UBICACIÓN GPS WHATSAPP DIRECTA (locationMessage)
    if (locMsg && (locMsg.degreesLatitude || locMsg.latitude) && (locMsg.degreesLongitude || locMsg.longitude)) {
      const userLat = Number(locMsg.degreesLatitude || locMsg.latitude);
      const userLng = Number(locMsg.degreesLongitude || locMsg.longitude);
      const restLat = Number(rest.latitud || -12.1215);
      const restLng = Number(rest.longitud || -77.0298);

      const R = 6371;
      const dLat = (userLat - restLat) * Math.PI / 180;
      const dLng = (userLng - restLng) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(restLat * Math.PI / 180) * Math.cos(userLat * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distKm = Math.round((R * c) * 10) / 10;

      const radioMax = Number(rest.delivery_cobertura_maxima_km || 12.0);
      const tarifaBase = Number(rest.delivery_tarifa_base || 5.0);
      const kmBase = Number(rest.delivery_km_base || 3.0);
      const costoKmExtra = Number(rest.delivery_costo_km_adicional || 1.5);
      const gratisDesde = Number(rest.delivery_envio_gratis_desde_global || 50.0);

      if (distKm <= radioMax) {
        let costoEnvio = tarifaBase;
        if (distKm > kmBase) {
          costoEnvio += (distKm - kmBase) * costoKmExtra;
        }
        costoEnvio = Math.round(costoEnvio * 2) / 2;
        const tiempoMin = Math.round(25 + (distKm * 3));
        const tiempoMax = tiempoMin + 12;
        const linkConGps = orderLink + '?lat=' + userLat + '&lng=' + userLng;

        return '¡Ubicación GPS recibida! 📍✨\\n\\n' +
          'Estás a aproximadamente *' + distKm + ' km* de nuestra cocina 🛵💨\\n\\n' +
          '• *Costo de envío exacto:* ' + currency + ' ' + costoEnvio.toFixed(2) + ' (¡*GRATIS* en pedidos desde ' + currency + ' ' + gratisDesde.toFixed(2) + '!)\\n' +
          '• *Tiempo estimado:* ' + tiempoMin + ' a ' + tiempoMax + ' minutos\\n\\n' +
          'Ya guardamos tus coordenadas. Haz clic aquí para armar tu pedido y te llegará calientito:\\n' + linkConGps;
      } else {
        return '¡Recibimos tu ubicación! 📍\\n\\n' +
          'Veo que estás a *' + distKm + ' km*, lo cual queda fuera de nuestro radio habitual de reparto (' + radioMax + ' km) 🛵.\\n\\n' +
          'Permíteme coordinar con un asesor de nuestro equipo para ver si podemos asignarte un motorizado especial o cotizarte el envío. ¡Un momento, por favor! 👨‍🍳🌱';
      }
    }

    // Distritos o zonas mencionadas
    const distritos = ['san isidro', 'miraflores', 'surquillo', 'san borja', 'barranco', 'lince', 'jesus maria', 'magdalena', 'surco', 'lima', 'chapinero', 'usaquen', 'poblado', 'las condes', 'providencia'];
    const distritoMencionado = distritos.find(d => msg.includes(d));

    // Si viene respuesta del subworkflow con contenido
    if ($json.respuesta && $json.respuesta.length > 20) return $json.respuesta;
    if ($json.output && $json.output.length > 20) return $json.output;

    // 1. DELIVERY / ENVÍO / TIEMPO / DISTRITOS
    if (msg.includes('envi') || msg.includes('delivery') || msg.includes('lleg') || msg.includes('repart') || msg.includes('cobertura') || msg.includes('traer') || msg.includes('mandar') || msg.includes('costo') || msg.includes('cuanto cobra') || msg.includes('demor') || msg.includes('tiempo') || distritoMencionado) {
      const tarifaBase = Number(rest.delivery_tarifa_base || 5.0);
      const gratisDesde = Number(rest.delivery_envio_gratis_desde_global || 50.0);

      if (distritoMencionado) {
        const distName = distritoMencionado.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        return '¡Excelente! A *' + distName + '* llegamos sin ningún problema 🛵🌱\\n\\n' +
          '• *Tiempo de entrega:* Aproximadamente 35 a 45 minutos (llega calientito y bien empacado).\\n' +
          '• *Tarifa de delivery estimada:* ' + currency + ' ' + tarifaBase.toFixed(2) + ' aprox. (¡y si tu orden llega a ' + currency + ' ' + gratisDesde.toFixed(2) + ', tu *envío es GRATIS*! ✨)\\n\\n' +
          '¿Qué se te antoja probar hoy? Puedes elegir tus platos y pedir directo aquí:\\n' + orderLink;
      }
      return '¡Sí, claro! Hacemos delivery a domicilio 🛵🌱\\n\\n' +
        '• *Tarifa base:* ' + currency + ' ' + tarifaBase.toFixed(2) + ' según distancia (¡*Envío gratis* en pedidos desde ' + currency + ' ' + gratisDesde.toFixed(2) + '! ✨)\\n' +
        '• *Tiempo de entrega:* 35 a 45 minutos (llega calientito y en empaques biodegradables).\\n\\n' +
        '¿A qué dirección o zona sería para confirmarte cobertura exacta? O si gustas, compárteme tu ubicación GPS por aquí y lo verificamos al instante 📍\\n' + orderLink;
    }

    // 2. HORARIOS / ¿ABIERTO?
    if (msg.includes('hora') || msg.includes('abierto') || msg.includes('cierr') || msg.includes('atiend') || msg.includes('cuando abren')) {
      return '¡Nuestros horarios de atención son ⏰🌿:\\n\\n' +
        (rest.horarios_atencion ? '• ' + rest.horarios_atencion + '\\n\\n' :
        '• *Lunes a Jueves:* 12:00 PM – 10:00 PM\\n' +
        '• *Viernes y Sábado:* 12:00 PM – 2:00 AM (madrugada)\\n' +
        '• *Domingo:* 12:00 PM – 10:00 PM\\n\\n') +
        '¿Deseas que te tome un pedido para delivery o te paso la carta?';
    }

    // 3. UBICACIÓN / DIRECCIÓN
    if (msg.includes('donde') || msg.includes('ubicac') || msg.includes('direccion') || msg.includes('quedan') || msg.includes('local')) {
      return '¡Nos encuentras en *' + (rest.direccion || 'nuestra sede principal') + '*! 📍🌱\\n\\n' +
        'Puedes visitarnos para comer en el local o pedir para llevar/delivery. ¿Te gustaría ver nuestra carta interactiva?\\n' + orderLink;
    }

    // 4. MÉTODOS DE PAGO
    if (msg.includes('pago') || msg.includes('yape') || msg.includes('plin') || msg.includes('tarjeta') || msg.includes('transferencia') || msg.includes('efectivo')) {
      const medioLocal = rest.pais === 'PE' ? 'Yape, Plin, tarjetas y transferencias' : 'Tarjetas de crédito/débito, transferencias y efectivo';
      return 'Aceptamos *' + medioLocal + '* 📲💳.\\n\\n' +
        'El pago se procesa al confirmar tu orden en nuestra webapp donde verás los métodos disponibles de inmediato:\\n' + orderLink;
    }

    // 5. RESERVAS
    if (msg.includes('reserva') || msg.includes('mesa') || msg.includes('cumplean')) {
      return '¡Con gusto te ayudamos con tu reserva en el local! 🌿🍽️\\n\\n' +
        'Por favor confírmanos:\\n' +
        '1. ¿Para qué fecha y hora sería?\\n' +
        '2. ¿Para cuántas personas?\\n' +
        '3. ¿A nombre de quién registramos la reserva?';
    }

    // FALLBACK INTELIGENTE
    return '¡Con mucho gusto te ayudamos! 🌱 En ' + nombre + ' atendemos en ' + (rest.direccion || 'nuestro local') + ' y también contamos con *delivery a domicilio* 🛵.\\n\\n' +
      '¿Deseas conocer nuestras opciones o ver la carta interactiva?\\n' + orderLink;
  })()
}}`;

fs.writeFileSync('scratch/clean_expr_multitenant.txt', rawExpr);
console.log('Saved scratch/clean_expr_multitenant.txt');
