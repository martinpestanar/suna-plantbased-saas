// Extraer el texto generado por la ruta previa
let textoFinal = "";
let proximoPaso = null;
let datosSesion = {};

const posiblesFuentes = [
  'F7 - Saludo Determinista Directo',
  'F7 - Formatear Respuesta Carta',
  'F7 - Formatear Info Restaurante',
  'F7 - Formatear Estado Pedido',
  'F7 - Formatear Respuesta Voucher',
  'F7 - Formatear Respuesta Derivación',
  'F7 - Imagen Casual Respuesta',
  'F7 - Enrutador Heurístico Determinista'
];

for (const fuente of posiblesFuentes) {
  try {
    const nodeOutput = $(fuente).first()?.json;
    if (nodeOutput && nodeOutput.texto_ia) {
      textoFinal = nodeOutput.texto_ia;
      if (nodeOutput.proximo_paso) {
        proximoPaso = nodeOutput.proximo_paso;
        datosSesion = {
          cliente_nombre: nodeOutput.cliente_nombre,
          direccion: nodeOutput.direccion,
          referencia: nodeOutput.referencia,
          metodo_pago: nodeOutput.metodo_pago,
          item_texto: nodeOutput.item_texto,
          cerrar_orden: nodeOutput.intencion === 'confirmar_y_cerrar_pedido'
        };
      }
      break;
    }
  } catch (e) {}
}

if (!textoFinal && $json.texto_ia) {
  textoFinal = $json.texto_ia;
}

if (!proximoPaso && $json.proximo_paso) {
  proximoPaso = $json.proximo_paso;
  datosSesion = {
    cliente_nombre: $json.cliente_nombre,
    direccion: $json.direccion,
    referencia: $json.referencia,
    metodo_pago: $json.metodo_pago,
    item_texto: $json.item_texto,
    cerrar_orden: $json.intencion === 'confirmar_y_cerrar_pedido'
  };
}

// Inyección de campaña si existe
let campanaId = null;
try {
  const campana = $('F7 - Buscar Campaña Reciente').first()?.json;
  campanaId = campana ? campana.campana_id : null;
} catch (e) {}

if (campanaId && (textoFinal.includes("suna.green/ordenar") || textoFinal.includes("suna.green"))) {
  textoFinal = textoFinal.replace(/suna\.green(\/ordenar)?/gi, `suna.green/ordenar?c=${campanaId}`);
}

return [{
  json: {
    output: textoFinal,
    texto_ia: textoFinal,
    proximo_paso: proximoPaso,
    datos_sesion: datosSesion
  }
}];