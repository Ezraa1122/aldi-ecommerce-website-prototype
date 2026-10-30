from flask import Flask, request, jsonify, redirect  # type: ignore[reportMissingImports]
from flask_cors import CORS  # type: ignore[reportMissingImports]
from pathlib import Path
import sys
import json
import uuid
from datetime import datetime, timezone
from order_database import save_order

# Allow importing user_database.py from project root
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(ROOT_DIR))

from user_database import authenticate_user, register_user
from product_database import get_product

app = Flask(__name__, static_folder=str(ROOT_DIR / "static"), static_url_path="")
CORS(app)
from catalog import catalog_bp

app.register_blueprint(catalog_bp)


@app.get("/")
def home():
    """The site root opens the shop (product catalog)."""
    return redirect("/products")


@app.errorhandler(404)
def not_found(_error):
    """Friendly page instead of the default Flask 404."""
    return (
        '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">'
        '<meta name="viewport" content="width=device-width, initial-scale=1">'
        '<title>Page not found | ALDI E-Commerce</title>'
        '<link rel="stylesheet" href="/css/theme.css"></head><body>'
        '<div id="site-header"></div>'
        '<main class="not-found"><div class="not-found__box">'
        '<p class="not-found__code">404</p><h1>Page not found</h1>'
        '<p>The page you are looking for does not exist.</p>'
        '<a class="not-found__btn" href="/products">Back to products</a></div></main>'
        '<div id="site-footer"></div><script src="/js/site.js"></script>'
        '</body></html>',
        404,
    )


@app.post("/api/register")
def register():
    """Create an account with register_user() from user_database.py (AECWR-15)."""
    data = request.get_json(silent=True) or {}
    email = str(data.get("email", "")).strip()
    password = str(data.get("password", ""))

    if not email or not password:
        return jsonify({
            "success": False,
            "message": "Email and password are required."
        }), 400

    try:
        register_user(email, password)
    except ValueError as error:
        return jsonify({"success": False, "message": str(error)}), 400

    return jsonify({"success": True, "message": "Account created."}), 201

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

    # Price every item from the product database, in integer cents,
    # so the browser cannot change prices or totals.
    priced_items = []
    for item in items:
        product_id = item.get("productId") if isinstance(item, dict) else None
        quantity = item.get("quantity") if isinstance(item, dict) else None
        product = get_product(product_id) if isinstance(product_id, int) else None
        if product is None or not isinstance(quantity, int) or not 1 <= quantity <= 99:
            return jsonify({
                "success": False,
                "message": "Your cart contains an invalid product or quantity."
            }), 400
        priced_items.append({
            "productId": product_id,
            "name": product["name"],
            "unitPriceCents": product["price_cents"],
            "quantity": quantity
        })

    items = priced_items
    total_cents = sum(item["unitPriceCents"] * item["quantity"] for item in items)

    reference = "ALDI-" + str(uuid.uuid4())[:8].upper()
    created_at = datetime.now(timezone.utc).isoformat()

    try:
        save_order(
            reference=reference,
            customer=customer,
            items_json=json.dumps(items),
            total_cents=total_cents,
            created_at=created_at
        )
    except Exception:
        return jsonify({
            "success": False,
            "message": "Database error while saving order."
        }), 500

    return jsonify({
        "success": True,
        "message": "Order placed successfully.",
        "reference": reference,
        "createdAt": created_at,
        "items": items,
        "totalCents": total_cents
    }), 201


if __name__ == "__main__":
    app.run(debug=True, port=5000)
    