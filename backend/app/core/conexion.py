import mysql.connector

# Ajusta estos datos con los de tu servidor MySQL/MariaDB
DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "123456789",
    "database": "restaurante",
}


def get_conn():
    """Crea y devuelve una nueva conexión a la base de datos."""
    return mysql.connector.connect(**DB_CONFIG)
