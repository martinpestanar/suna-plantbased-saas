const fs = require('fs');

const original = fs.readFileSync('scratch/original_router_jsCode.js', 'utf8');

const gpsCode = `
// -------------------------------------------------------------------
// DETECCIÓN DE UBICACIÓN GPS WHATSAPP (locationMessage / liveLocationMessage)
// -------------------------------------------------------------------
const rawWebhook = $('F7 - Webhook Entrada').first().json.body?.data?.message || {};
const locMsg = rawWebhook.locationMessage || rawWebhook.liveLocationMessage;

if (locMsg && (locMsg.degreesLatitude || locMsg.latitude) && (locMsg.degreesLongitude || locMsg.longitude)) {
  const userLat = Number(locMsg.degreesLatitude || locMsg.latitude);
  const userLng = Number(locMsg.degreesLongitude || locMsg.longitude);
  
  // Coordenadas base del local (Suna Miraflores por defecto)
  const restLat = Number(rest.latitud || -12.1215);
  const restLng = Number(rest.longitud || -77.0298);

  // Haversine formula en km
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

    const linkConGps = linkCarta + '?lat=' + userLat + '&lng=' + userLng;

    const respuestaGps = '¡Ubicación GPS recibida! 📍✨\\n\\n' +
      'Estás a aproximadamente *' + distKm + ' km* de nuestra cocina en Miraflores 🛵💨\\n\\n' +
      '• *Costo de envío exacto:* S/ ' + costoEnvio.toFixed(2) + ' (¡*GRATIS* en pedidos desde S/ ' + gratisDesde.toFixed(2) + '!)\\n' +
      '• *Tiempo estimado:* ' + tiempoMin + ' a ' + tiempoMax + ' minutos\\n\\n' +
      'Ya guardamos tus coordenadas. Haz clic aquí para armar tu pedido y te llegará calientito:\\n' +
      '👉 ' + linkConGps;

    return [{ json: {
      tipo_ruta: 'determinista',
      intencion: 'cobertura_gps_confirmada',
      texto_ia: respuestaGps,
      ubicacion_gps: { lat: userLat, lng: userLng, distancia_km: distKm, costo_envio: costoEnvio }
    } }];
  } else {
    const respuestaFuera = '¡Recibimos tu ubicación! 📍\\n\\n' +
      'Veo que estás a *' + distKm + ' km*, lo cual queda fuera de nuestro radio habitual de reparto (' + radioMax + ' km) 🛵.\\n\\n' +
      'Permíteme coordinar con un asesor de nuestro equipo para ver si podemos asignarte un motorizado especial o cotizarte el envío. ¡Un momento, por favor! 👨‍🍳🌱';

    return [{ json: {
      tipo_ruta: 'subworkflow',
      intencion: 'gps_fuera_cobertura',
      texto_ia: respuestaFuera,
      ubicacion_gps: { lat: userLat, lng: userLng, distancia_km: distKm, fuera_cobertura: true }
    } }];
  }
}
`;

const searchStr = '// 0. ESCALAMIENTO HUMANO / QUEJA (Prioridad Máxima)';
const newJs = original.replace(searchStr, gpsCode + '\n' + searchStr);

fs.writeFileSync('scratch/updated_router_jsCode.js', newJs);
console.log('Original length:', original.length);
console.log('New length:', newJs.length);
console.log('Success:', newJs.length > original.length);
