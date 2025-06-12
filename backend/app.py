from flask import Flask, request, jsonify
from models.content_based.plot_based_recommender import register_routes
from flask_cors import CORS
import pandas as pd
import os

app = Flask(__name__)
CORS(app)

# Set base directory and file paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MOVIES_PATH = os.path.join(BASE_DIR, "data/processed/clean_movies.csv")
RATINGS_PATH = os.path.join(BASE_DIR, "data/processed/clean_ratings.csv")
DELETED_PATH = os.path.join(BASE_DIR, "data/processed/deleted_movies.csv")

# Load movie data once at startup
try:
    movies_df = pd.read_csv(MOVIES_PATH)
    ratings_df = pd.read_csv(RATINGS_PATH)
    rating_counts = ratings_df.groupby("movieId").size().reset_index(name="rating_count")
    movies_df = movies_df.merge(rating_counts, on="movieId", how="left")
    movies_df["rating_count"].fillna(0, inplace=True)
    print("✅ Movie data loaded successfully.")
except Exception as e:
    print("❌ Failed to load movie data:", e)
    movies_df = pd.DataFrame()

def generate_movie_id(row):
    """Generate consistent movie ID format"""
    if pd.notna(row.get("tmdbId")):
        return f"tmdb_{int(row['tmdbId'])}"
    elif pd.notna(row.get("imdbId")):
        return f"imdb_{row['imdbId']}"
    return f"ml_{row['movieId']}"

# Add movie_id column to movies_df if not exists
if not movies_df.empty and 'movie_id' not in movies_df.columns:
    movies_df["movie_id"] = movies_df.apply(generate_movie_id, axis=1)

@app.route("/api/popular-movies", methods=["GET"])
def get_popular_movies():
    genres = request.args.getlist("genres")
    user_feedback = request.args.getlist("user_feedback")  # List of movie_ids user has rated
    
    if not genres:
        return jsonify({"error": "No genres provided"}), 400
    
    if movies_df.empty:
        return jsonify({"error": "Movie data not available"}), 500

    def matches_genres(movie_genres):
        return any(g.lower() in movie_genres.lower() for g in genres)

    # Filter by genres
    filtered = movies_df[movies_df["genres"].apply(matches_genres)]
    
    # Filter out movies user has already rated
    if user_feedback:
        print(f"🚫 Filtering out {len(user_feedback)} previously rated movies")
        filtered = filtered[~filtered["movie_id"].isin(user_feedback)]
    
    top_50 = (
        filtered.sort_values(by="rating_count", ascending=False)
        .drop_duplicates("title")
        .head(50)
    )
    
    final_movies = top_50.sample(n=min(20, len(top_50))) if len(top_50) >= 20 else top_50
    
    print(f"✅ Returning {len(final_movies)} movies after filtering")
    return jsonify({"movies": final_movies["title"].tolist()})

@app.route("/api/all-valid-movies")
def get_all_valid_movies():
    try:
        print("📥 Loading movies CSV...")
        local_movies = pd.read_csv(MOVIES_PATH)
        local_movies = local_movies.dropna(subset=["poster_url"])
        print(f"✅ Loaded {len(local_movies)} movies")

        # Handle deleted movies
        if os.path.exists(DELETED_PATH):
            print("📥 Loading deleted_movies.csv...")
            deleted_df = pd.read_csv(DELETED_PATH)
            excluded_ids = set(deleted_df["movie_id"].dropna())
            print(f"🛑 Excluding {len(excluded_ids)} deleted movies")
        else:
            print("ℹ️ deleted_movies.csv not found, skipping exclusions")
            excluded_ids = set()

        # Generate movie IDs
        local_movies["movie_id"] = local_movies.apply(generate_movie_id, axis=1)
        local_movies = local_movies[~local_movies["movie_id"].isin(excluded_ids)]

        print(f"✅ Returning {len(local_movies)} valid movies")
        return jsonify(local_movies[[
            "title", "genres", "year", "description", "poster_url", "movie_id"
        ]].to_dict(orient="records"))

    except Exception as e:
        print("❌ Error in /api/all-valid-movies:", str(e))
        return jsonify({"error": str(e)}), 500

@app.route("/api/filtered-movies", methods=["POST"])
def get_filtered_movies():
    """Get movies filtered by user feedback"""
    try:
        data = request.json
        user_feedback_ids = data.get("user_feedback", [])  # List of movie_ids user has rated
        genres = data.get("genres", [])
        limit = data.get("limit", 20)
        
        print(f"📥 Filtering movies. User has rated {len(user_feedback_ids)} movies")
        
        if movies_df.empty:
            return jsonify({"error": "Movie data not available"}), 500
        
        # Start with all movies
        filtered_movies = movies_df.copy()
        
        # Filter out user's previously rated movies
        if user_feedback_ids:
            print(f"🚫 Excluding {len(user_feedback_ids)} previously rated movies")
            filtered_movies = filtered_movies[~filtered_movies["movie_id"].isin(user_feedback_ids)]
        
        # Filter by genres if provided
        if genres:
            def matches_genres(movie_genres):
                return any(g.lower() in movie_genres.lower() for g in genres)
            filtered_movies = filtered_movies[filtered_movies["genres"].apply(matches_genres)]
        
        # Sort by rating count and get more movies for better selection
        top_movies = (
            filtered_movies.sort_values(by="rating_count", ascending=False)
            .drop_duplicates("title")
            .head(limit * 3)  # Get 3x more to ensure variety after sampling
        )
        
        # If we have enough movies, sample randomly for variety
        if len(top_movies) >= limit:
            final_movies = top_movies.sample(n=limit)
        else:
            # If not enough, try to get more from all movies (regardless of genre)
            print(f"⚠️ Only {len(top_movies)} movies found with filters, expanding search...")
            all_filtered = movies_df[~movies_df["movie_id"].isin(user_feedback_ids)] if user_feedback_ids else movies_df
            additional_needed = limit - len(top_movies)
            
            # Get additional movies from broader selection
            additional_movies = (
                all_filtered[~all_filtered["movie_id"].isin(top_movies["movie_id"])]
                .sort_values(by="rating_count", ascending=False)
                .head(additional_needed)
            )
            
            final_movies = pd.concat([top_movies, additional_movies]).head(limit)
        
        result = final_movies[[
            "title", "genres", "year", "description", "poster_url", "movie_id"
        ]].to_dict(orient="records")
        
        print(f"✅ Returning {len(result)} filtered movies")
        return jsonify({"movies": result})
        
    except Exception as e:
        print("❌ Error in /api/filtered-movies:", str(e))
        return jsonify({"error": str(e)}), 500

@app.route("/api/delete-movie", methods=["POST"])
def delete_movie():
    try:
        data = request.json
        movie_id = data.get("movie_id")
        
        if not movie_id:
            return jsonify({"error": "Missing movie_id"}), 400

        deleted_df = pd.DataFrame([{"movie_id": movie_id}])
        
        if os.path.exists(DELETED_PATH):
            deleted_df.to_csv(DELETED_PATH, mode='a', index=False, header=False)
        else:
            deleted_df.to_csv(DELETED_PATH, index=False)
            
        return jsonify({"success": True})
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Register all content-based recommender routes
register_routes(app)

if __name__ == "__main__":
    app.run(debug=True, use_reloader=False)