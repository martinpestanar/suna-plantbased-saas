const fs = require('fs');

const data = JSON.parse(fs.readFileSync('C:/Users/Martin/.gemini/antigravity/brain/aa99110e-e69a-4f60-a1db-416967196da6/.system_generated/steps/351/output.txt', 'utf8'));
const wf = data.data || data;

// 1. Modificar nodo f7-subwf-info-rest para convertirlo en Gemini
const targetNode = wf.nodes.find(n => n.id === 'f7-subwf-info-rest');
if (targetNode) {
  targetNode.name = 'F7 - Generador Info y Delivery IA';
  targetNode.type = '@n8n/n8n-nodes-langchain.googleGemini';
  targetNode.typeVersion = 1;
  targetNode.credentials = {
    googlePalmApi: {
      id: 'ntyTZb1Yq3RYtumN',
      name: 'Google korat Gemini_pago'
    }
  };

  const prompt = `=Eres el anfitrión de atención por WhatsApp de "{{ $('F7 - Obtener Restaurante por Instancia').first().json.nombre }}", un restaurante 100% plant-based y artesanal en Lima.
Hablas con cercanía, calidez, rapidez y hospitalidad, como un excelente asesor de atención.

## CONTEXTO DE LA CONVERSACIÓN:
- Mensaje previo del cliente: "{{ $('F7 - Verificar Sesión Cliente').first().json.ultimo_mensaje_cliente || 'Ninguno' }}"
- Tu última respuesta: "{{ $('F7 - Verificar Sesión Cliente').first().json.ultimo_mensaje_bot || 'Ninguno' }}"
- Mensaje actual del cliente: "{{ $('F7 - Extracción de Metadatos WhatsApp').first().json.message_content }}"

## INFORMACIÓN OPERATIVA Y OFICIAL DE SUNA PLANT BASED:
• DELIVERY Y ENVÍOS A DOMICILIO:
  - ¿Hacen envíos / delivery?: ¡Sí, por supuesto! Contamos con delivery a domicilio.
  - Zonas de cobertura directa: Miraflores, San Isidro, Surquillo, San Borja, Barranco, Lince y Lima Centro.
  - Tarifa aproximada de envío: S/ 5.00 a S/ 8.00 dependiendo de la distancia.
  - ¡ENVÍO GRATIS!: En todos los pedidos a partir de S/ 50.00.
  - Tiempo de entrega estimado: De 35 a 45 minutos (llega calientito y en empaques biodegradables 🌱).
  - Pedido mínimo: S/ 30.00.
• HORARIOS DE ATENCIÓN:
  - Lunes a Jueves: 12:00 PM – 10:00 PM
  - Viernes y Sábado: 12:00 PM – 2:00 AM (madrugada)
  - Domingo: 12:00 PM – 10:00 PM
• DIRECCIÓN DEL LOCAL:
  - Av. Miraflores 1245, Lima, Perú.
• MÉTODOS DE PAGO:
  - Aceptamos Yape, Plin y transferencias directas (BCP e Interbank). Al hacer el pedido por el enlace salen los códigos QR listos.

## REGLAS DE CONVERSACIÓN (OBLIGATORIAS):
1. REGLA ESTRICTA ANTI-SALUDO REPETITIVO:
   - Si "Tu última respuesta" NO está vacía o ya hubo interacción previa: ¡ESTÁ TOTALMENTE PROHIBIDO VOLVER A SALUDAR! NO digas "¡Hola!", "¡Hola de nuevo!", "¡Qué tal!". Ve directo al grano con entusiasmo y calidez.
   - Solo di "¡Hola! 🌱" si la conversación está vacía (primer contacto).
2. ENFÓCATE EN LO QUE EL CLIENTE PREGUNTA:
   - Si pregunta por envíos o delivery ("hacen envio?", "¿tienen delivery?", "¿llegan a Surco?"):
     * Confirma alegremente que sí hacemos delivery 🛵🌱.
     * Menciona los distritos principales de cobertura (Miraflores, San Isidro, Surquillo, San Borja, etc.).
     * Menciona la tarifa base (desde S/ 5.00), el beneficio de ENVÍO GRATIS desde S/ 50 y el tiempo estimado (35 a 45 min).
     * Pregúntale amablemente a qué distrito o dirección sería para confirmarle cobertura al instante, o si prefiere compartir su ubicación por WhatsApp.
     * ¡NO menciones horarios a menos que pregunte expresamente por horarios!
   - Si pregunta por horarios: responde los horarios exactos.
   - Si pregunta por la dirección física: indícale la dirección en Miraflores.
3. TONO Y FORMATO WHATSAPP:
   - Formato ágil: de 3 a 5 líneas cortas, limpias y bien estructuradas con viñetas y negritas clave (*S/ 5.00*, *35 a 45 min*, *envío gratis*).
   - Emojis pertinentes (🛵, 🌱, ✨).
4. CIERRE PROACTIVO:
   - Termina invitando al siguiente paso y deja el link oficial para pedir:
   👇📲 https://pedidos-suna.vercel.app/{{ $('F7 - Obtener Restaurante por Instancia').first().json.slug }}/ordenar/{{ $('F7 - Extracción de Metadatos WhatsApp').first().json.telefono }}`;

  targetNode.parameters = {
    messages: {
      values: [
        {
          content: prompt
        }
      ]
    },
    modelId: {
      __rl: true,
      cachedResultName: 'models/gemini-2.5-flash-lite',
      mode: 'list',
      value: 'models/gemini-2.5-flash-lite'
    }
  };
}

// 2. Modificar nodo f7-format-info-rest para extraer el texto generado por Gemini
const formatNode = wf.nodes.find(n => n.id === 'f7-format-info-rest');
if (formatNode) {
  formatNode.parameters = {
    assignments: {
      assignments: [
        {
          id: 'f7-info-text',
          name: 'texto_ia',
          type: 'string',
          value: '={{ $json.text || $json.content?.parts?.[0]?.text || "¡Sí, claro! Hacemos delivery a Miraflores, San Isidro, Surquillo y alrededores 🛵🌱. La tarifa va desde S/ 5.00 (¡envío gratis desde S/ 50!). ¿A qué distrito o dirección sería tu pedido?" }}'
        }
      ]
    },
    options: {}
  };
}

const payload = {
  name: wf.name,
  nodes: wf.nodes,
  connections: wf.connections,
  settings: wf.settings,
  staticData: wf.staticData
};

fs.writeFileSync('scratch/full_wf_update.json', JSON.stringify(payload, null, 2));
console.log('Update script prepared successfully.');
