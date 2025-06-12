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
movies_df = movies_df.reset_index(drop=True)

# Load BERT embeddings
with open(EMBEDDINGS_PATH, "rb") as f:
    movie_embeddings = pickle.load(f)

# Load FAISS index
faiss_index = faiss.read_index(FAISS_INDEX_PATH)

# Load BERT model
bert_model = SentenceTransformer("all-MiniLM-L6-v2")

# === Utility: Generate movie ID ===
def generate_movie_id(movie):
    """Generate a consistent movie ID from movie data."""
    if pd.notna(movie.get("tmdbId")) and movie.get("valid_tmdb", True):
        return f"tmdb_{int(movie['tmdbId'])}"
    elif pd.notna(movie.get("imdbId")):
        return f"imdb_{movie['imdbId']}"
    else:
        return f"ml_{movie['movieId']}"

# === Utility: Apply filters ===
def filter_movies(df, genres, years, age_rating, rating_threshold, exclude_movies=None):
    """Filter movies based on user preferences and exclude specified movies."""
    filtered = df.copy()

    # Apply genre filter
    if genres:
        filtered = filtered[filtered["genres"].apply(lambda g: any(gen.lower() in g.lower() for gen in genres))]

    # Apply year filter
    if years == "Last year":
        filtered = filtered[filtered["year"] >= 2024]
    elif years == "Last 5 years":
        filtered = filtered[filtered["year"] >= 2020]
    elif years == "Last 10 years":
        filtered = filtered[filtered["year"] >= 2015]
    elif years == "Older":
        filtered = filtered[filtered["year"] < 2015]

    # Apply age rating filter
    if age_rating:
        age_map = {
            "All ages": ["G", "PG"],
            "Teens(13+)": ["PG-13"],
            "Mature(16+)": ["R"],
            "Adults(18+)": ["NC-17", "18", "TV-MA"]
        }
        allowed = age_map.get(age_rating, [])
        filtered = filtered[filtered["age_restriction"].isin(allowed)]

    # Exclude liked and disliked movies
    if exclude_movies:
        excluded_movie_ids = []
        if "liked" in exclude_movies and exclude_movies["liked"]:
            excluded_movie_ids.extend(exclude_movies["liked"])
            print(f"[DEBUG] Liked movies to exclude: {exclude_movies['liked']}")
        if "disliked" in exclude_movies and exclude_movies["disliked"]:
            excluded_movie_ids.extend(exclude_movies["disliked"])
            print(f"[DEBUG] Disliked movies to exclude: {exclude_movies['disliked']}")
        
        if excluded_movie_ids:
            print(f"[DEBUG] Total movies to exclude: {len(excluded_movie_ids)}")
            # Create movie IDs for all movies in filtered dataset
            filtered_movie_ids = filtered.apply(generate_movie_id, axis=1)
            print(f"[DEBUG] Sample generated movie IDs: {filtered_movie_ids.head(10).tolist()}")
            # Filter out excluded movies
            mask = ~filtered_movie_ids.isin(excluded_movie_ids)
            movies_before = len(filtered)
            filtered = filtered[mask]
            movies_after = len(filtered)
            print(f"[DEBUG] Movies before exclusion: {movies_before}, after: {movies_after}")
            print(f"[DEBUG] Successfully excluded {movies_before - movies_after} movies from dataset")

    return filtered

# === Fallback Recommendation Function ===
def recommend_fallback(plot, num_recommendations, exclude_movies=None):
    """Fallback recommendations based on the full dataset without filters."""
    user_embedding = bert_model.encode([plot], normalize_embeddings=True)
    D, I = faiss_index.search(user_embedding.astype(np.float32), num_recommendations * 5)  # Search more to account for exclusions

    recommendations = []
    seen_ids = set()
    
    # Prepare exclusion set
    excluded_movie_ids = set()
    if exclude_movies:
        if "liked" in exclude_movies and exclude_movies["liked"]:
            excluded_movie_ids.update(exclude_movies["liked"])
        if "disliked" in exclude_movies and exclude_movies["disliked"]:
            excluded_movie_ids.update(exclude_movies["disliked"])
    
    print(f"[DEBUG] Fallback - Excluding {len(excluded_movie_ids)} movies")

    for idx in I[0]:
        if idx >= len(movies_df):
            continue  # Skip invalid index

        if len(recommendations) >= num_recommendations:
            break

        movie = movies_df.iloc[idx]
        movie_id = generate_movie_id(movie)

        # Skip if already seen or in exclusion list
        if movie_id in seen_ids:
            continue
        if movie_id in excluded_movie_ids:
            print(f"[DEBUG] Fallback - Skipping excluded movie: {movie_id} - {movie['title']}")
            continue
        seen_ids.add(movie_id)

        # Validate poster
        poster = movie.get("poster_url", "")
        if pd.isna(poster) or not str(poster).startswith(("http://", "https://")):
            continue

        recommendations.append({
            "title": str(movie["title"]),
            "genres": str(movie["genres"]),
            "year": int(movie["year"]),
            "description": str(movie["description"]),
            "poster": poster,
            "movie_id": movie_id
        })

    print(f"[DEBUG] Fallback generated {len(recommendations)} recommendations")
    return recommendations

# === Main Recommendation Function ===
def recommend_movies_from_plot(user_input):
    """Generate movie recommendations based on plot and user preferences."""
    plot = user_input.get("plot", "")
    genres = user_input.get("genres", [])
    years = user_input.get("years", "")
    age_rating = user_input.get("age_rating", "")
    threshold = user_input.get("rating_threshold", "")
    exclude_movies = user_input.get("exclude_movies", {})

    if not plot.strip():
        return []

    print(f"[DEBUG] Exclude movies input: {exclude_movies}")

    # Apply filters including exclusions
    filtered_movies = filter_movies(movies_df, genres, years, age_rating, threshold, exclude_movies)

    # Remove duplicates
    if "tmdbId" in filtered_movies.columns:
        filtered_movies = filtered_movies.drop_duplicates(subset=["tmdbId", "title", "year"])
    else:
        filtered_movies = filtered_movies.drop_duplicates(subset=["title", "year"])

    if filtered_movies.empty:
        print("[DEBUG] No movies found after filtering, using fallback")
        return recommend_fallback(plot, 15, exclude_movies)
    
    filtered_movies = filtered_movies.reset_index(drop=True)

    print(f"[DEBUG] Filtered movies: {len(filtered_movies)}")
    print(f"[DEBUG] Unique titles: {filtered_movies['title'].nunique()}")

    # Generate embeddings for filtered movies
    user_embedding = bert_model.encode([plot], normalize_embeddings=True)
    filtered_indices = filtered_movies.index.tolist()
    filtered_embeddings = movie_embeddings[filtered_indices]

    # Create temporary FAISS index for filtered movies
    dim = movie_embeddings.shape[1]
    temp_index = faiss.IndexFlatIP(dim)
    temp_index.add(filtered_embeddings.astype(np.float32))

    # Search for similar movies
    D, I = temp_index.search(user_embedding.astype(np.float32), min(100, len(filtered_movies)))

    recommendations = []
    seen_ids = set()
    
    # Prepare exclusion set
    excluded_movie_ids = set()
    if exclude_movies:
        if "liked" in exclude_movies and exclude_movies["liked"]:
            excluded_movie_ids.update(exclude_movies["liked"])
        if "disliked" in exclude_movies and exclude_movies["disliked"]:
            excluded_movie_ids.update(exclude_movies["disliked"])
    
    print(f"[DEBUG] Final recommendation phase - Excluding {len(excluded_movie_ids)} movies")

    skipped_count = 0
    for idx in I[0]:
        if len(recommendations) >= 15:
            break

        movie = filtered_movies.iloc[idx]
        movie_id = generate_movie_id(movie)

        # Skip if already seen
        if movie_id in seen_ids:
            continue
        
        # Skip if in exclusion list
        if movie_id in excluded_movie_ids:
            print(f"[DEBUG] Skipping excluded movie: {movie_id} - {movie['title']}")
            skipped_count += 1
            continue
            
        seen_ids.add(movie_id)

        # Validate poster
        poster_val = movie.get("poster_url", "")
        if pd.notna(poster_val) and str(poster_val).startswith(("http://", "https://")):
            poster = poster_val
        else:
            continue

        recommendations.append({
            "title": str(movie["title"]),
            "genres": str(movie["genres"]),
            "year": int(movie["year"]),
            "description": str(movie["description"]),
            "poster": poster,
            "movie_id": movie_id
        })

    print(f"[DEBUG] Skipped {skipped_count} excluded movies during recommendation selection")

    # If we don't have enough recommendations, use fallback
    if len(recommendations) < 15:
        print(f"[DEBUG] Only {len(recommendations)} recommendations found, using fallback for remaining")
        fallback = recommend_fallback(plot, 15 - len(recommendations), exclude_movies)
        recommendations.extend(fallback)

    print(f"[DEBUG] Final recommendations count: {len(recommendations)}")
    
    # Final check - log all recommended movie IDs to verify none are in exclusion list
    recommended_ids = [rec["movie_id"] for rec in recommendations]
    overlap = set(recommended_ids) & excluded_movie_ids
    if overlap:
        print(f"[ERROR] Found excluded movies in final recommendations: {overlap}")
    else:
        print(f"[DEBUG] ✅ No excluded movies found in final recommendations")
    
    return recommendations[:15]

# === Flask Endpoint ===
def register_routes(app):
    @app.route("/api/recommend-by-plot", methods=["POST"])
    def recommend_by_plot():
        data = request.json
        if not data:
            return jsonify({"error": "Missing JSON payload"}), 400

        try:
            recommendations = recommend_movies_from_plot(data)
            return jsonify({"recommendations": recommendations})
        except Exception as e:
            print(f"[ERROR] Recommendation failed: {str(e)}")
            return jsonify({"error": "Failed to generate recommendations"}), 500