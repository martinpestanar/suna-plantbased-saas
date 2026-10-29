const fs = require('fs');

let js = fs.readFileSync('scratch/updated_router_multitenant.js', 'utf8');

// Dinamizar S/ en el bloque GPS del router
js = js.replace(
  "• *Costo de envío exacto:* S/ ' + costoEnvio.toFixed(2) + ' (¡*GRATIS* en pedidos desde S/ ' + gratisDesde.toFixed(2) + '!)",
  "• *Costo de envío exacto:* ' + (rest.simbolo_moneda || 'S/') + ' ' + costoEnvio.toFixed(2) + ' (¡*GRATIS* en pedidos desde ' + (rest.simbolo_moneda || 'S/') + ' ' + gratisDesde.toFixed(2) + '!)"
);

// Quitar la mención fija de 'Miraflores' para hacerlo multitenant
js = js.replace(
  "Estás a aproximadamente *' + distKm + ' km* de nuestra cocina en Miraflores 🛵💨",
  "Estás a aproximadamente *' + distKm + ' km* de nuestra cocina 🛵💨"
);

fs.writeFileSync('scratch/updated_router_multitenant.js', js);
console.log('Router multitenant updated perfectly.');
