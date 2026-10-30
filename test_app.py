import sys
from pathlib import Path

# Add the backend folder to Python's path so local database modules can be found
BACKEND_DIR = Path(__file__).resolve().parent / "backend"
sys.path.insert(0, str(BACKEND_DIR))

import pytest
from app import app

@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client

def test_catalog_page(client):
    response = client.get("/products")
    assert response.status_code == 200

def test_catalog_endpoint(client):
    """Test that the products page loads successfully."""
    response = client.get("/products")
    assert response.status_code == 200

def test_user_registration_and_login(client):
    """Test user registration and subsequent login via API[cite: 9]."""
    test_email = "teststudent@example.com"
    test_password = "SecurePassword123"

    # 1. Register a new user
    reg_response = client.post("/api/register", json={
        "email": test_email,
        "password": test_password
    })
    # Might be 201 Created or 400 if already exists from a previous run
    assert reg_response.status_code in [201, 400]

    # 2. Login with the credentials
    login_response = client.post("/api/login", json={
        "email": test_email,
        "password": test_password
    })
    assert login_response.status_code == 200
    data = login_response.get_json()
    assert data["success"] is True

def test_checkout_validation_empty_cart(client):
    """Test that checkout fails when required customer details or items are missing[cite: 9]."""
    response = client.post("/api/checkout", json={
        "customer": {},
        "items": []
    })
    assert response.status_code == 400
    data = response.get_json()
    assert data["success"] is False

def test_checkout_server_side_pricing(client):
    """Test that checkout validates product IDs and quantities securely[cite: 9]."""
    response = client.post("/api/checkout", json={
        "customer": {
            "fullName": "Max Mustermann",
            "email": "max@example.com",
            "address": "Musterstraße 1",
            "city": "Berlin",
            "postcode": "10115"
        },
        "items": [
            {"productId": 1, "quantity": 2}
        ]
    })
    # If product ID 1 exists, this should succeed (201) and calculate totals server-side
    assert response.status_code == 201
    data = response.get_json()
    assert data["success"] is True
    assert "reference" in data
    assert "totalCents" in data
