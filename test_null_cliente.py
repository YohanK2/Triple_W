import requests
import json
import mysql.connector

conn = mysql.connector.connect(host='127.0.0.1', user='root', password='123456', database='restaurante_db')
cur = conn.cursor()

# Test with id_cliente = NULL
cur.execute('INSERT INTO ordenes (id_mesa, id_mesero, subtotal, impuesto, total, estado) VALUES (1, 1, 10.00, 1.60, 11.60, "listo")')
conn.commit()
test_id = cur.lastrowid
print(f'Created test order {test_id} with id_cliente NULL')

payload = {
    "id_cliente": None,
    "id_mesa": 1,
    "id_mesero": 1,
    "subtotal": 10.00,
    "impuesto": 1.60,
    "total": 11.60,
    "estado": "servido",
    "notas": None
}

r = requests.put(f'http://127.0.0.1:8001/ordenes/{test_id}', json=payload)
print(f'Status: {r.status_code}')
print(f'Response: {r.text}')

cur.execute(f'DELETE FROM ordenes WHERE id_orden={test_id}')
conn.commit()