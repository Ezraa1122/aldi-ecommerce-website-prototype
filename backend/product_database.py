import sqlite3
from contextlib import closing
from decimal import Decimal
from pathlib import Path

DB_PATH = Path(__file__).resolve().with_name("products.db")

# Prices are stored as integer cents to avoid rounding errors.
SAMPLE_PRODUCTS = [
    (1, "Fresh Bananas", 129, "1 kg", "Fruit", "🍌",
     "Fresh bananas for breakfast, snacks and smoothies."),
    (2, "Whole Milk", 115, "1 litre", "Dairy", "🥛",
     "Whole milk for your breakfast cereal, coffee and cooking."),
    (3, "Sourdough Bread", 249, "500 g", "Bakery", "🍞",
     "A sourdough loaf with a crisp crust. Contains wheat."),
    (4, "Red Apples", 219, "1 kg", "Fruit", "🍎",
     "Crisp red apples for snacking and baking."),
    (5, "Free Range Eggs", 279, "6 eggs", "Dairy & Eggs", "🥚",
     "A pack of six free range eggs for everyday cooking."),
    (6, "Fresh Broccoli", 139, "500 g", "Vegetables", "🥦",
     "Fresh broccoli for steaming, roasting and stir-fries."),
]


def connect():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_database():
    """Create and seed the table once, preserving later data changes."""
    with closing(connect()) as connection:
        with connection:
            exists = connection.execute(
                "SELECT 1 FROM sqlite_master "
                "WHERE type = 'table' AND name = 'products'"
            ).fetchone()

            if exists:
                return

            connection.execute("""
                CREATE TABLE products (
                    id INTEGER PRIMARY KEY,
                    name TEXT NOT NULL,
                    price_cents INTEGER NOT NULL
                        CHECK(price_cents >= 0),
                    size TEXT NOT NULL,
                    category TEXT NOT NULL,
                    image TEXT NOT NULL,
                    description TEXT NOT NULL
                )
            """)

            connection.executemany("""
                INSERT INTO products
                    (id, name, price_cents, size,
                     category, image, description)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, SAMPLE_PRODUCTS)


def to_product(row):
    product = dict(row)
    product["price"] = format(
        Decimal(product["price_cents"]) / Decimal(100), ".2f"
    )
    return product


def get_all_products():
    with closing(connect()) as connection:
        rows = connection.execute(
            "SELECT * FROM products ORDER BY id"
        ).fetchall()
        return [to_product(row) for row in rows]


def get_product(product_id):
    with closing(connect()) as connection:
        row = connection.execute(
            "SELECT * FROM products WHERE id = ?",
            (product_id,)
        ).fetchone()
        return to_product(row) if row else None


if __name__ == "__main__":
    initialize_database()
    print(f"Database ready: {DB_PATH}")
    print(f"Products stored: {len(get_all_products())}")