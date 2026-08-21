import mysql.connector
conn = mysql.connector.connect(host='127.0.0.1', user='root', password='123456', database='restaurante_db')
cur = conn.cursor()
cur.execute('UPDATE ordenes SET estado="servido" WHERE id_orden=1')
print('OK servido')
cur.execute('UPDATE ordenes SET estado="pagado" WHERE id_orden=1')
print('OK pagado')