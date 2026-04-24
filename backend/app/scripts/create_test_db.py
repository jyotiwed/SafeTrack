# scripts/create_test_db.py
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# Connect to default 'postgres' database to create new one
conn = psycopg2.connect(
    host="localhost",
    port=5432,
    user="postgres",
    password="your_password",  # Use your actual password
    database="postgres"
)
conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)

cursor = conn.cursor()
cursor.execute("DROP DATABASE IF EXISTS safetrack_test;")
cursor.execute("CREATE DATABASE safetrack_test;")
cursor.close()
conn.close()

print(" Test database 'safetrack_test' created!")