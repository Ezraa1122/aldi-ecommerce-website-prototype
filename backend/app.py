from flask import Flask, request, jsonify
from flask_cors import CORS
from pathlib import Path
import sys
import json
from datetime import datetime
from order_database import save_order

# Allow importing user_database.py from project root
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(ROOT_DIR))

from user_database import authenticate_user

app = Flask(__name__, static_folder=str(ROOT_DIR / "static"), static_url_path="")
CORS(app)
from catalog import catalog_bp

app.register_blueprint(catalog_bp)

@app.post("/api/login")
def login():
    data = request.get_json(silent=True) or {}

    email = data.get("email", "").strip()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({
            "success": False,
            "message": "Email and password are required."
        }), 400

    if authenticate_user(email, password):
        return jsonify({
            "success": True,
            "message": "Login successful."
        }), 200

    return jsonify({
        "success": False,
        "message": "Invalid email or password."
    }), 401

@app.post("/api/checkout")
def checkout():
    data = request.get_json(silent=True) or {}
    customer = data.get("customer", {})
    items = data.get("items", [])

    # Validate required fields
    required_fields = ["fullName", "email", "address", "city", "postcode"]
    if not customer or not all(customer.get(field) for field in required_fields):
        return jsonify({
            "success": False,
            "message": "Missing or incomplete customer details."
        }), 400

    if not items or not isinstance(items, list):
        return jsonify({
            "success": False,
            "message": "Cart is empty or invalid."
        }), 400

    # Calculate total securely on the backend using integer cents
    total_cents = sum(item.get("unitPriceCents", 0) * item.get("quantity", 0) for item in items)
    
    reference = "ALDI-" + str(uuid.uuid4())[:8].upper()
    created_at = datetime.utcnow().isoformat()

    try:
        save_order(
            reference=reference,
            customer=customer,
            items_json=json.dumps(items),
            total_cents=total_cents,
            created_at=created_at
        )
    except Exception as e:
        return jsonify({
            "success": False,
            "message": "Database error while saving order."
        }), 500

    return jsonify({
        "success": true,
        "message": "Order placed successfully.",
        "reference": reference,
        "createdAt": created_at,
        "totalCents": total_cents
    }), 201


if __name__ == "__main__":
    app.run(debug=True, port=5000)
    