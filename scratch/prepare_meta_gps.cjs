const fs = require('fs');

const data = JSON.parse(fs.readFileSync('C:/Users/Martin/.gemini/antigravity/brain/aa99110e-e69a-4f60-a1db-416967196da6/.system_generated/steps/351/output.txt', 'utf8'));
const wf = data.data || data;

const meta = wf.nodes.find(x => x.id === 'f7-extraccion-metadata');
const newContentExpr = `={{ (() => {
  const msg = $('F7 - Webhook Entrada').first().json.body?.data?.message;
  if (msg?.locationMessage || msg?.liveLocationMessage) {
    const loc = msg.locationMessage || msg.liveLocationMessage;
    const lat = loc.degreesLatitude || loc.latitude;
    const lng = loc.degreesLongitude || loc.longitude;
    return '[UBICACION_GPS: ' + lat + ', ' + lng + (loc.name ? ' - ' + loc.name : '') + ']';
  }
  return msg?.conversation || msg?.extendedTextMessage?.text || msg?.imageMessage?.caption || msg?.buttonsResponseMessage?.selectedButtonId || msg?.listResponseMessage?.singleSelectReply?.selectedRowId || msg?.templateButtonReplyMessage?.selectedId || '';
})() }}`;

const assignments = meta.parameters.assignments.assignments.map(a => {
  if (a.name === 'message_content') {
    return {
      ...a,
      value: newContentExpr
    };
  }
  return a;
});

const op = {
  id: '8xiaIHrcHOTiRAnBav0mj',
  operations: [
    {
      type: 'updateNode',
      nodeName: 'F7 - Extracción de Metadatos WhatsApp',
      updates: {
        parameters: {
          assignments: {
            assignments: assignments
          }
        }
      }
    }
  ]
};

fs.writeFileSync('scratch/update_meta_gps.json', JSON.stringify(op, null, 2));
console.log('Saved scratch/update_meta_gps.json successfully.');
