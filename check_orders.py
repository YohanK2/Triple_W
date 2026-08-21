import mysql.connector
conn = mysql.connector.connect(host='127.0.0.1', user='root', password='123456', database='restaurante_db')
cur = conn.cursor(dictionary=True)
cur.execute('SELECT * FROM ordenes LIMIT 5')
for row in cur.fetchall():
    print(row)