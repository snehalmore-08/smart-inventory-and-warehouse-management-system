"""
Database Connection Manager for MySQL.
Provides safe connection handling, dictionary cursor mapping,
and context-managed sessions with automatic resource cleanup.
"""

import pymysql
import pymysql.cursors
from contextlib import contextmanager
from app.config import settings

def get_db_connection():
    """
    Creates and returns a new raw connection to MySQL.
    Uses DictCursor so query results return as key-value dictionaries.
    """
    try:
        connection = pymysql.connect(
            host=settings.DB_HOST,
            port=settings.DB_PORT,
            user=settings.DB_USER,
            password=settings.DB_PASSWORD,
            database=settings.DB_NAME,
            cursorclass=pymysql.cursors.DictCursor,
            autocommit=False  # Requires explicit COMMIT for ACID transaction safety
        )
        return connection
    except pymysql.MySQLError as e:
        print(f"[DB ERROR] Failed to connect to MySQL on {settings.DB_HOST}:{settings.DB_PORT} - {e}")
        raise RuntimeError(
            f"Database connection error. Ensure XAMPP MySQL is running. Details: {e}"
        ) from e

@contextmanager
def get_db():
    """
    Context manager for database sessions.
    Usage:
        with get_db() as conn:
            with conn.cursor() as cursor:
                cursor.execute(...)
            conn.commit()
    Guarantees rollback on exception and always closes the connection.
    """
    conn = get_db_connection()
    try:
        yield conn
    except Exception as exc:
        conn.rollback()
        raise exc
    finally:
        conn.close()

def test_db_connection():
    """
    Diagnostics check: runs a test query against MySQL and counts existing products.
    """
    with get_db() as conn:
        with conn.cursor() as cursor:
            cursor.execute("SELECT VERSION() AS version, DATABASE() AS active_db;")
            info = cursor.fetchone()
            
            cursor.execute("SELECT COUNT(*) AS product_count FROM products;")
            count = cursor.fetchone()
            
            cursor.execute("SELECT id, name, unit_weight_grams, current_stock_qty FROM products ORDER BY id;")
            products = cursor.fetchall()
            
            return {
                "server_info": info,
                "product_count": count["product_count"],
                "sample_products": products
            }

if __name__ == "__main__":
    result = test_db_connection()
    print("MySQL connection successful!")
    print(f"Connected to: {result['server_info']}")
    print(f"Products in DB: {result['product_count']}")
    for p in result["sample_products"]:
        print(f"  [{p['id']}] {p['name']} - Expected Unit: {p['unit_weight_grams']}g, In Stock: {p['current_stock_qty']}")
