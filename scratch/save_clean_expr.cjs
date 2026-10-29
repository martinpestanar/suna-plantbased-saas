const fs = require('fs');

const rawExpr = `={{
  (() => {
    const rawMsg = $('F7 - Extracción de Metadatos WhatsApp').first().json.message_content || '';
    const msg = rawMsg.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '');
    const rest = $('F7 - Obtener Restaurante por Instancia').first().json;
    const nombre = rest.nombre || 'Suna Plant Based';
    const slug = rest.slug || 'suna-demo';
    const tel = $('F7 - Extracción de Metadatos WhatsApp').first().json.telefono || '';
    const orderLink = '👉 https://pedidos-suna.vercel.app/' + slug + '/ordenar/' + tel;
    
    // Si viene respuesta del subworkflow con contenido
    if ($json.respuesta && $json.respuesta.length > 20) return $json.respuesta;
    if ($json.output && $json.output.length > 20) return $json.output;

    // 1. DELIVERY / ENVÍO
    if (msg.includes('envi') || msg.includes('delivery') || msg.includes('lleg') || msg.includes('repart') || msg.includes('cobertura') || msg.includes('traer') || msg.includes('mandar') || msg.includes('costo') || msg.includes('cuanto cobra')) {
      return '¡Sí, claro! Hacemos delivery a domicilio 🛵🌱\\n\\n' +
        '• *Zonas de cobertura:* Miraflores, San Isidro, Surquillo, San Borja, Barranco y Lima Centro.\\n' +
        '• *Tarifa:* Desde S/ 5.00 a S/ 8.00 según distancia (¡*Envío gratis* en pedidos desde S/ 50.00! ✨)\\n' +
        '• *Tiempo de entrega:* 35 a 45 minutos (llega calientito en empaques compostables).\\n\\n' +
        '¿A qué distrito o dirección sería para confirmarte cobertura exacta? O si gustas puedes armar tu pedido directo aquí:\\n' + orderLink;
    }

    // 2. HORARIOS / ¿ABIERTO?
    if (msg.includes('hora') || msg.includes('abierto') || msg.includes('cierr') || msg.includes('atiend') || msg.includes('cuando abren')) {
      return '¡Hola! Nuestros horarios de atención son ⏰🌿:\\n\\n' +
        '• *Lunes a Jueves:* 12:00 PM – 10:00 PM\\n' +
        '• *Viernes y Sábado:* 12:00 PM – 2:00 AM (madrugada)\\n' +
        '• *Domingo:* 12:00 PM – 10:00 PM\\n\\n' +
        '¿Deseas que te tome un pedido para delivery o te paso la carta?';
    }

    // 3. UBICACIÓN / DIRECCIÓN
    if (msg.includes('donde') || msg.includes('ubicac') || msg.includes('direccion') || msg.includes('quedan') || msg.includes('local')) {
      return '¡Nos encuentras en *' + (rest.direccion || 'Av. Miraflores 1245, Lima, Perú') + '*! 📍🌱\\n\\n' +
        'Puedes visitarnos para comer en el local o pedir para llevar/delivery. ¿Te gustaría ver nuestra carta interactiva?\\n' + orderLink;
    }

    // 4. MÉTODOS DE PAGO
    if (msg.includes('pago') || msg.includes('yape') || msg.includes('plin') || msg.includes('tarjeta') || msg.includes('transferencia') || msg.includes('efectivo')) {
      return 'Aceptamos *Yape, Plin y transferencias directas* (BCP e Interbank) 📲💳.\\n\\n' +
        'El pago se procesa al confirmar tu orden en nuestra webapp donde verás los códigos QR de inmediato:\\n' + orderLink;
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
    return '¡Con mucho gusto te ayudamos! 🌱 En ' + nombre + ' atendemos en ' + (rest.direccion || 'Av. Miraflores 1245') + ' y también contamos con *delivery a domicilio* 🛵.\\n\\n' +
      '¿Deseas conocer nuestras opciones de hamburguesas y bowls, o ver la carta interactiva?\\n' + orderLink;
  })()
}}`;

fs.writeFileSync('scratch/clean_expr.txt', rawExpr);
console.log('Clean expr saved. Length:', rawExpr.length);
console.log('Starts with:', rawExpr.substring(0, 10));
console.log('Ends with:', rawExpr.substring(rawExpr.length - 10));
