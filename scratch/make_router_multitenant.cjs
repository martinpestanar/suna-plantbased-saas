const fs = require('fs');

let js = fs.readFileSync('scratch/updated_router_jsCode.js', 'utf8');

// 1. Zona horaria multitenant dinámica por restaurante
js = js.replace("timeZone: 'America/Lima'", "timeZone: rest.zona_horaria || 'America/Lima'");

// 2. Moneda dinámica en los resúmenes y pedidos
js = js.replace(/S\/\.\s*/g, "' + (rest.simbolo_moneda || 'S/') + ' ");

fs.writeFileSync('scratch/updated_router_multitenant.js', js);
console.log('Saved scratch/updated_router_multitenant.js successfully.');
console.log('Contains rest.zona_horaria:', js.includes('rest.zona_horaria'));
