from flask import Flask, request, jsonify
from models.content_based.plot_based_recommender import register_routes
from flask_pymongo import PyMongo
from werkzeug.security import generate_password_hash, check_password_hash
from flask_cors import CORS
from bson.objectid import ObjectId
import bcrypt
import pandas as pd
import os

app = Flask(__name__)
CORS(app)

# MongoDB URI for local database
app.config["MONGO_URI"] = "mongodb://localhost:27017/your_database_name"
mongo = PyMongo(app)
users_collection = mongo.db.users

# Load movie data once at startup
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

try:
    movies_df = pd.read_csv(os.path.join(BASE_DIR, "data/processed/clean_movies.csv"))
    ratings_df = pd.read_csv(os.path.join(BASE_DIR, "data/processed/clean_ratings.csv"))

    rating_counts = ratings_df.groupby("movieId").size().reset_index(name="rating_count")
    movies_df = movies_df.merge(rating_counts, on="movieId", how="left")
    movies_df["rating_count"].fillna(0, inplace=True)
    print("✅ Movie data loaded successfully.")
except Exception as e:
    print("❌ Failed to load movie data:", e)
    movies_df = pd.DataFrame()  # fallback to empty DataFrame

@app.route("/register", methods=["POST"])
def register():
    data = request.json
    email = data["email"]
    password = data["password"]
    name = data["name"]

    if users_collection.find_one({"email": email}):
        return jsonify({"error": "User already exists"}), 400

    hashed_password = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())

    users_collection.insert_one({
        "email": email,
        "password": hashed_password,
        "name": name,
        "avatar": "",
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

    if bcrypt.checkpw(password.encode("utf-8"), user["password"]):
        return jsonify({
            "message": "Login successful",
            "user": {
                "id": str(user["_id"]),
                "name": user["name"],
                "email": user["email"],
                "avatar": user["avatar"],
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

    users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"avatar": avatar_url}}
    )

    return jsonify({"message": "Avatar updated successfully"}), 200

@app.route("/api/popular-movies", methods=["GET"])
def get_popular_movies():
    genres = request.args.getlist("genres")

    if not genres:
        return jsonify({"error": "No genres provided"}), 400

    if movies_df.empty:
        return jsonify({"error": "Movie data not available"}), 500

    def matches_genres(movie_genres):
        return any(g.lower() in movie_genres.lower() for g in genres)

    filtered = movies_df[movies_df["genres"].apply(matches_genres)]

    top_50 = (
        filtered.sort_values(by="rating_count", ascending=False)
        .drop_duplicates("title")
        .head(50)
    )
    final_movies = top_50.sample(n=min(20, len(top_50))) if len(top_50) >= 20 else top_50

    return jsonify({"movies": final_movies["title"].tolist()})

# Register content-based recommender routes
register_routes(app)

if __name__ == "__main__":
    app.run(debug=True, use_reloader=False)
