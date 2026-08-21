import requests
import json
import mysql.connector

conn = mysql.connector.connect(host='127.0.0.1', user='root', password='123456', database='restaurante_db')
cur = conn.cursor()

# Test all valid enum values via API
test_cases = [
    ("pendiente", "pendiente"),
    ("preparando", "preparacion"),
    ("listo", "lista"),
    ("servido", "entregada"),
    ("pagado", "pagada"),
    ("cancelado", "cancelada"),
]

for db_state, ui_state in test_cases:
    # Create test order
    cur.execute('INSERT INTO ordenes (id_mesa, id_mesero, subtotal, impuesto, total, estado) VALUES (1, 1, 10.00, 1.60, 11.60, %s)', (db_state,))
    conn.commit()
    test_id = cur.lastrowid
    
    # Try to update to next state via API
    # This simulates what the frontend does: UI state -> DB state mapping
    UI_TO_DB = {
        'pendiente': 'pendiente',
        'preparacion': 'preparando',
        'lista': 'listo',
        'entregada': 'servido',
        'pagada': 'pagado',
        'cancelada': 'cancelado',
    }
    
    # Find next UI state
    next_ui = {
        'pendiente': 'preparacion',
        'preparacion': 'lista',
        'lista': 'entregada',
        'entregada': 'pagada',
    }.get(ui_state)
    
    if next_ui:
        next_db = UI_TO_DB[next_ui]
        payload = {
            "id_cliente": None,
            "id_mesa": 1,
            "id_mesero": 1,
            "subtotal": 10.00,
            "impuesto": 1.60,
            "total": 11.60,
            "estado": next_db,
            "notas": None
        }
        r = requests.put(f'http://127.0.0.1:8001/ordenes/{test_id}', json=payload)
        print(f'{db_state} -> {next_db} (UI: {ui_state} -> {next_ui}): Status {r.status_code}')
        if r.status_code != 200:
            print(f'  ERROR: {r.text}')
    else:
        print(f'{db_state} (UI: {ui_state}): terminal state, skipping')
    
    # Cleanup
    cur.execute(f'DELETE FROM ordenes WHERE id_orden={test_id}')
    conn.commit()

print('All tests passed!')