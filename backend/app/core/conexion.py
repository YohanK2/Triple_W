import mysql.connector
from Triple_W.backend.app.core.configuracion import DB_HOST, DB_USER, DB_PASSWORD, DB_NAME


def get_conn():
    return mysql.connector.connect(
        host= "localhost",
        user= "root",           # tu usuario MySQL
        password= "",       # tu contraseña
        database= "triplew"      # tu base de datos
    )