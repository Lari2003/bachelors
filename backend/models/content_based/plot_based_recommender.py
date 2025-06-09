import pandas as pd
import numpy as np
import pickle
import faiss
from sentence_transformers import SentenceTransformer
from flask import request, jsonify

# === Load Precomputed Data ===
MOVIES_PATH = "backend/data/processed/clean_movies.csv"
EMBEDDINGS_PATH = "backend/models/content_based/bert_embeddings.pkl"
FAISS_INDEX_PATH = "backend/models/content_based/bert_faiss.index"

# Load cleaned movie data
movies_df = pd.read_csv(MOVIES_PATH)
movies_df = movies_df.dropna(subset=["description"])

# Load BERT embeddings
with open(EMBEDDINGS_PATH, "rb") as f:
    movie_embeddings = pickle.load(f)

# Load FAISS index
faiss_index = faiss.read_index(FAISS_INDEX_PATH)

# Load BERT model
bert_model = SentenceTransformer("all-MiniLM-L6-v2")

# === Utility: Apply filters ===
def filter_movies(df, genres, years, age_rating, rating_threshold):
    filtered = df.copy()

    if genres:
        filtered = filtered[filtered["genres"].apply(lambda g: any(gen.lower() in g.lower() for gen in genres))]

    if years == "Last year":
        filtered = filtered[filtered["year"] >= 2024]
    elif years == "Last 5 years":
        filtered = filtered[filtered["year"] >= 2020]
    elif years == "Last 10 years":
        filtered = filtered[filtered["year"] >= 2015]
    elif years == "Older":
        filtered = filtered[filtered["year"] < 2015]

    if age_rating:
        age_map = {
            "All ages": ["G", "PG"],
            "Teens(13+)": ["PG-13"],
            "Mature(16+)": ["R"],
            "Adults(18+)": ["NC-17", "18", "TV-MA"]
        }
        allowed = age_map.get(age_rating, [])
        filtered = filtered[filtered["age_restriction"].isin(allowed)]

    return filtered

# === Main Recommendation Function ===
def recommend_movies_from_plot(user_input):
    plot = user_input.get("plot", "")
    genres = user_input.get("genres", [])
    years = user_input.get("years", "")
    age_rating = user_input.get("age_rating", "")
    threshold = user_input.get("rating_threshold", "")

    if not plot.strip():
        return []

    filtered_movies = filter_movies(movies_df, genres, years, age_rating, threshold)
    if filtered_movies.empty:
        return []

    user_embedding = bert_model.encode([plot], normalize_embeddings=True)

    filtered_indices = filtered_movies.index.tolist()
    filtered_embeddings = movie_embeddings[filtered_indices]

    dim = movie_embeddings.shape[1]
    temp_index = faiss.IndexFlatIP(dim)
    temp_index.add(filtered_embeddings.astype(np.float32))

    D, I = temp_index.search(user_embedding.astype(np.float32), 15)
    recommendations = []
    for i in I[0]:
        movie = filtered_movies.iloc[i]
        recommendations.append({
            "title": str(movie["title"]),
            "genres": str(movie["genres"]),
            "year": int(movie["year"]),
            "description": str(movie["description"]),
            "poster": movie.get("poster_url", "")
        })

    return recommendations

# === Flask Endpoint ===
def register_routes(app):
    @app.route("/api/recommend-by-plot", methods=["POST"])
    def recommend_by_plot():
        data = request.json
        if not data:
            return jsonify({"error": "Missing JSON payload"}), 400

        recommendations = recommend_movies_from_plot(data)
        return jsonify({"recommendations": recommendations})
