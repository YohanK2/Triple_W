import mysql.connector
conn = mysql.connector.connect(host='127.0.0.1', user='root', password='123456', database='restaurante_db')
cur = conn.cursor(dictionary=True)
cur.execute('SELECT * FROM estados_orden')
print('estados_orden:', cur.fetchall())
cur.execute('SHOW COLUMNS FROM ordenes LIKE "estado"')
print('ordenes.estado:', cur.fetchall())
cur.execute('SELECT DISTINCT estado FROM ordenes')
print('valores reales en ordenes:', cur.fetchall())