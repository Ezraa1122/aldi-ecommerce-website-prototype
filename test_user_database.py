import sqlite3
import tempfile
import unittest
from pathlib import Path
from user_database import register_user, authenticate_user


class UserDatabaseTests(unittest.TestCase):
    def setUp(self):
        self.folder = tempfile.TemporaryDirectory()
        self.db = Path(self.folder.name) / "test.db"

    def tearDown(self):
        self.folder.cleanup()

    def test_registration_persists_and_login_checks_password(self):
        register_user(" demo@example.com ", "DemoPass123!", self.db)
        self.assertTrue(authenticate_user("DEMO@example.com", "DemoPass123!", self.db))
        self.assertFalse(authenticate_user("demo@example.com", "WrongPass123!", self.db))
        self.assertFalse(authenticate_user("missing@example.com", "DemoPass123!", self.db))

    def test_duplicate_email_rejected(self):
        register_user("demo@example.com", "DemoPass123!", self.db)
        with self.assertRaises(ValueError):
            register_user("DEMO@example.com", "AnotherPass123!", self.db)

    def test_invalid_inputs_rejected(self):
        for email, password in [("invalid", "DemoPass123!"), ("demo@example.com", "short")]:
            with self.assertRaises(ValueError):
                register_user(email, password, self.db)

    def test_salted_hashes_and_no_plaintext_password(self):
        register_user("one@example.com", "DemoPass123!", self.db)
        register_user("two@example.com", "DemoPass123!", self.db)
        connection = sqlite3.connect(self.db)
        try:
            hashes = [row[0] for row in connection.execute("SELECT password_hash FROM users")]
        finally:
            connection.close()
        self.assertNotEqual(hashes[0], hashes[1])
        self.assertTrue(all(value.startswith("scrypt$") for value in hashes))
        self.assertTrue(all("DemoPass123!" not in value for value in hashes))


if __name__ == "__main__":
    unittest.main(verbosity=2)
