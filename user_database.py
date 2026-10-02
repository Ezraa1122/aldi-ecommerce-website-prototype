"""SQLite user storage for AECWR-15. Run directly for a local demo."""
import getpass
import hashlib
import hmac
import secrets
import sqlite3
from pathlib import Path

DEFAULT_DB = Path(__file__).with_name("users.db")


def connect(db_path):
    connection = sqlite3.connect(db_path)
    connection.execute("""CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )""")
    connection.commit()
    return connection


def normalize_email(email):
    email = email.strip().lower()
    if len(email) > 254 or email.count("@") != 1 or any(c.isspace() for c in email):
        raise ValueError("Enter a valid email address.")
    local, domain = email.split("@")
    if not local or not domain or "." not in domain or domain.startswith(".") or domain.endswith("."):
        raise ValueError("Enter a valid email address.")
    return email


def derive(password, salt):
    return hashlib.scrypt(password.encode("utf-8"), salt=salt, n=16384, r=8, p=1, dklen=32)


def register_user(email, password, db_path=DEFAULT_DB):
    """Return a new user ID; raise ValueError for invalid or duplicate input."""
    email = normalize_email(email)
    if not 8 <= len(password) <= 128:
        raise ValueError("Password must contain 8 to 128 characters.")
    salt = secrets.token_bytes(16)
    stored = "scrypt$16384$8$1$" + salt.hex() + "$" + derive(password, salt).hex()
    connection = connect(db_path)
    try:
        with connection:
            cursor = connection.execute(
                "INSERT INTO users (email, password_hash) VALUES (?, ?)", (email, stored)
            )
        return cursor.lastrowid
    except sqlite3.IntegrityError as error:
        raise ValueError("This email is already registered.") from error
    finally:
        connection.close()


def authenticate_user(email, password, db_path=DEFAULT_DB):
    """Return True when credentials match; otherwise False."""
    try:
        email = normalize_email(email)
    except ValueError:
        return False
    if len(password) > 128:
        return False
    connection = connect(db_path)
    try:
        row = connection.execute("SELECT password_hash FROM users WHERE email = ?", (email,)).fetchone()
    finally:
        connection.close()
    if row is None:
        return False
    algorithm, n, r, p, salt, expected = row[0].split("$")
    if (algorithm, n, r, p) != ("scrypt", "16384", "8", "1"):
        return False
    return hmac.compare_digest(derive(password, bytes.fromhex(salt)), bytes.fromhex(expected))


def main():
    print("AECWR-15: local registration and login demo")
    while True:
        choice = input("\n1 Register | 2 Login | 3 Show saved users | 4 Exit: ").strip()
        if choice == "4":
            break
        if choice == "3":
            connection = connect(DEFAULT_DB)
            try:
                rows = connection.execute("SELECT id, email, created_at FROM users").fetchall()
                for row in rows:
                    print(row)
                if not rows:
                    print("No users registered yet.")
            finally:
                connection.close()
        elif choice in ("1", "2"):
            email = input("Email: ")
            password = getpass.getpass("Password (typing is hidden): ")
            try:
                if choice == "1":
                    print("User created. ID:", register_user(email, password))
                else:
                    print("Login successful." if authenticate_user(email, password) else "Invalid email or password.")
            except ValueError as error:
                print(error)
        else:
            print("Choose 1, 2, 3 or 4.")


if __name__ == "__main__":
    main()
