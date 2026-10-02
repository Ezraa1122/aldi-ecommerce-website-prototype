from flask import Flask, request, jsonify
from flask_cors import CORS
from pathlib import Path
import sys

# Allow importing user_database.py from project root
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(ROOT_DIR))

from user_database import authenticate_user

app = Flask(__name__)
CORS(app)


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


if __name__ == "__main__":
    app.run(debug=True, port=5000)
    