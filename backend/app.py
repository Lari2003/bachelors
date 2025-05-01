from flask import Flask, request, jsonify
from flask_pymongo import PyMongo
from werkzeug.security import generate_password_hash, check_password_hash
import bcrypt

app = Flask(__name__)

# MongoDB URI for local database
app.config["MONGO_URI"] = "mongodb://localhost:27017/your_database_name"
mongo = PyMongo(app)

# Users Collection
users_collection = mongo.db.users

@app.route("/register", methods=["POST"])
def register():
    data = request.json
    email = data["email"]
    password = data["password"]
    name = data["name"]

    # Check if user already exists
    if users_collection.find_one({"email": email}):
        return jsonify({"error": "User already exists"}), 400

    hashed_password = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())

    # Insert new user
    users_collection.insert_one({
        "email": email,
        "password": hashed_password,
        "name": name,
        "avatar": "",  # Initialize avatar to empty (could be updated later)
    })

    return jsonify({"message": "User registered successfully"}), 201


@app.route("/login", methods=["POST"])
def login():
    data = request.json
    email = data["email"]
    password = data["password"]

    user = users_collection.find_one({"email": email})

    if not user:
        return jsonify({"error": "User not found"}), 404

    # Verify password
    if bcrypt.checkpw(password.encode("utf-8"), user["password"]):
        return jsonify({
            "message": "Login successful",
            "user": {
                "id": str(user["_id"]),
                "name": user["name"],
                "email": user["email"],
                "avatar": user["avatar"],  # Send avatar URL
            }
        })
    else:
        return jsonify({"error": "Invalid password"}), 400


@app.route("/update-avatar", methods=["POST"])
def update_avatar():
    data = request.json
    user_id = data["user_id"]
    avatar_url = data["avatar_url"]

    user = users_collection.find_one({"_id": ObjectId(user_id)})

    if not user:
        return jsonify({"error": "User not found"}), 404

    # Update avatar URL
    users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"avatar": avatar_url}}
    )

    return jsonify({"message": "Avatar updated successfully"}), 200


if __name__ == "__main__":
    app.run(debug=True)
