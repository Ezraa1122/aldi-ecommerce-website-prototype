import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent / "orders.db"

def init_order_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            reference TEXT UNIQUE NOT NULL,
            full_name TEXT NOT NULL,
            email TEXT NOT NULL,
            address TEXT NOT NULL,
            city TEXT NOT NULL,
            postcode TEXT NOT NULL,
            items_json TEXT NOT NULL,
            total_cents INTEGER NOT NULL,
            created_at TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()

def save_order(reference, customer, items_json, total_cents, created_at):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO orders (reference, full_name, email, address, city, postcode, items_json, total_cents, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        reference,
        customer.get("fullName"),
        customer.get("email"),
        customer.get("address"),
        customer.get("city"),
        customer.get("postcode"),
        items_json,
        total_cents,
        created_at
    ))
    conn.commit()
    conn.close()

# Initialize table on startup
init_order_db()