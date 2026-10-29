import json

with open(r'scratch\backup_wf_8xiaIHrcHOTiRAnBav0mj_before_order_taking.json', 'r', encoding='utf-8') as f:
    wf = json.load(f)

for node in wf['data']['nodes']:
    if 'Inyectar Tracking' in node['name'] and 'F7' in node['name']:
        lines = node['parameters']['jsCode'].splitlines()
        insert_idx = 40
        extra_lines = [
            '',
            'if (!proximoPaso && $json.proximo_paso) {',
            '  proximoPaso = $json.proximo_paso;',
            '  datosSesion = {',
            '    cliente_nombre: $json.cliente_nombre,',
            '    direccion: $json.direccion,',
            '    referencia: $json.referencia,',
            '    metodo_pago: $json.metodo_pago,',
            '    item_texto: $json.item_texto,',
            "    cerrar_orden: $json.intencion === 'confirmar_y_cerrar_pedido'",
            '  };',
            '}'
        ]
        new_lines = lines[:insert_idx] + extra_lines + lines[insert_idx:]
        node['parameters']['jsCode'] = '\n'.join(new_lines)
        with open('scratch/tracking_node_updates.json', 'w', encoding='utf-8') as out:
            json.dump({'parameters': node['parameters']}, out, ensure_ascii=False)
        print('Saved tracking_node_updates.json successfully')
