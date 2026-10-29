import json

with open(r'scratch\backup_wf_8xiaIHrcHOTiRAnBav0mj_before_order_taking.json', 'r', encoding='utf-8') as f:
    wf = json.load(f)

for node in wf['data']['nodes']:
    name = node['name']
    
    # 1. Update Inyectar Tracking so proximo_paso passes from input if needed
    if 'Inyectar Tracking' in name and 'F7' in name:
        tracking_code = """// Extraer el texto generado por la ruta previa
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
  textoFinal = textoFinal.replace(/suna\\.green(\\/ordenar)?/gi, `suna.green/ordenar?c=${campanaId}`);
}

return [{
  json: {
    output: textoFinal,
    texto_ia: textoFinal,
    proximo_paso: proximoPaso,
    datos_sesion: datosSesion
  }
}];"""
        node['parameters']['jsCode'] = tracking_code

    # 2. Update Clasificador de Intención IA prompt
    if 'Clasificador de Intenci' in name and 'F7' in name:
        new_prompt = """=Eres el clasificador de intenciones de WhatsApp para el restaurante "{{ $('F7 - Obtener Restaurante por Instancia').first().json.nombre }}".

CONTEXTO PREVIO:
- Último mensaje del restaurante: "{{ $('F7 - Verificar Sesión Cliente').first().json.ultimo_mensaje_bot || 'Ninguno' }}"
- Mensaje previo del cliente: "{{ $('F7 - Verificar Sesión Cliente').first().json.ultimo_mensaje_cliente || 'Ninguno' }}"

MENSAJE ACTUAL DEL CLIENTE:
"{{ $json.mensaje_cliente || $('F7 - Extracción de Metadatos WhatsApp').first().json.message_content }}"

Clasifica el mensaje en exactamente UNA de estas 4 categorías:
1. "menu_query": Preguntas sobre platos específicos, qué opciones tienen ("cuáles", "qué hamburguesas hay", "cuánto cuesta"), ingredientes, opciones sin gluten/veganas, recomendaciones o si el cliente dice que quiere pedir por aquí o armar un pedido por chat.
2. "order_status": Preguntas sobre un pedido ya realizado ("¿dónde está mi pedido?", "¿ya salió el delivery?").
3. "restaurant_info": Dudas sobre zonas de reparto/cobertura, políticas de reservas de mesas o dudas generales del local.
4. "human_handoff": ÚNICAMENTE si el cliente está explícitamente molesto, o pide hablar con un asesor/humano de carne y hueso ("quiero hablar con una persona", "pásame con alguien").

REGLA ESTRICTA:
Responde ÚNICAMENTE un bloque JSON válido, sin comillas invertidas de código markdown (sin ```json):
{
  "intent": "menu_query" | "order_status" | "restaurant_info" | "human_handoff",
  "query": "resumen conciso de lo que busca en máximo 6 palabras"
}"""
        node['parameters']['messages']['values'][0]['content'] = new_prompt

    # 3. Update Enrutador Heurístico Determinista
    if 'Enrutador Heur' in name and 'F7' in name:
        lines = node['parameters']['jsCode'].splitlines()
        
        # Locate step 4
        start_idx = None
        end_idx = None
        for i, l in enumerate(lines):
            if '// 4. FLUJO ASISTIDO DE PEDIDO' in l:
                start_idx = i
            elif start_idx is not None and '// 5. PIDIENDO_NOMBRE' in l:
                end_idx = i
                break
        
        if start_idx is not None and end_idx is not None:
            new_lines = [
                "// 4. FLUJO ASISTIDO DE PEDIDO (RESPETA MODO TOMA PEDIDOS)",
                "// -------------------------------------------------------------------",
                "const modoPedidos = rest.modo_toma_pedidos || 'bot';",
                "",
                "if (pasoActual === 'INACTIVO') {",
                "  const quierePedir = /(tomame el pedido|pedir por aca|pedir por aqui|quisiera pedirlo por aqui|quiero pedirlo por aqui|quisiera pedir por aca|quiero pedir por aca|quisiera pedir|quiero pedir|no puedo abrir|no me abre|no carga|ayudame a pedir|hacer pedido|armar pedido|hacer un pedido)/i.test(text) && !/(link|enlace|carta interactiva)/i.test(text);",
                "",
                "  if (quierePedir) {",
                "    if (!estadoRest.abierto) {",
                "      return [{ json: {",
                "        tipo_ruta: 'determinista',",
                "        intencion: 'pedido_cerrado',",
                "        texto_ia: estadoRest.mensaje",
                "      } }];",
                "    }",
                "",
                "    // Si el negocio configuró modo 'humano', transferir al asesor humano",
                "    if (modoPedidos === 'humano') {",
                "      return [{ json: {",
                "        tipo_ruta: 'subworkflow',",
                "        intencion: 'derivar_a_humano',",
                "        razon: 'Cliente solicitó tomar pedido directamente por WhatsApp'",
                "      } }];",
                "    }",
                "",
                "    // Modo 'bot': iniciar pedido guiado y empático",
                "    return [{ json: {",
                "      tipo_ruta: 'determinista',",
                "      intencion: 'iniciar_pedido_chat',",
                "      proximo_paso: 'PIDIENDO_NOMBRE',",
                "      texto_ia: '¡Con mucho gusto! Lo armamos juntos directamente por aquí 📝🌱\\n\\nPara empezar a registrar tu comanda, ¿a *nombre de quién* anotamos el pedido? (Dime tu nombre y apellido) 😊'",
                "    } }];",
                "  }",
                "}",
                ""
            ]
            lines = lines[:start_idx] + new_lines + lines[end_idx:]
            node['parameters']['jsCode'] = '\n'.join(lines)
            print("Successfully patched line replacement in Enrutador Heurístico!")
        else:
            print("Error: Could not locate bounds of step 4")

with open(r'scratch\wf_patch_ready.json', 'w', encoding='utf-8') as out:
    json.dump(wf['data'], out, ensure_ascii=False, indent=2)

print("Saved scratch\\wf_patch_ready.json successfully!")
