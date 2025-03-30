import pickle
import pandas as pd

# Define file paths
movies_path = "data/processed/clean_movies.csv"
hybrid_path = "models/content_based/top_k_similarity_hybrid.pkl"

# Load Movie Data
movies_df = pd.read_csv(movies_path)

# Create mappings for quick lookup
movie_id_to_title = dict(zip(movies_df["movieId"], movies_df["title"]))

# Load Hybrid Similarities
with open(hybrid_path, "rb") as f:
    hybrid_similarities = pickle.load(f)

print("\n✅ Hybrid Similarity Data Loaded Successfully!\n")

for i, (movie_id, recommendations) in enumerate(hybrid_similarities.items()):
    if i >= 5:  # Show only first 5 movies
        break

    # **Ensure movie title exists, otherwise display as "Unknown Movie"**
    movie_title = movie_id_to_title.get(movie_id, f"❌ Unknown Movie (ID: {movie_id})")
    print(f"🎬 **{movie_title}** (ID: {movie_id})")

    for rec_id, score in recommendations:
        # **Ensure recommended movie title exists**
        rec_title = movie_id_to_title.get(rec_id, f"❌ Unknown Movie (ID: {rec_id})")
        print(f"    🔹 **{rec_title}** | Score: {score:.4f}")

    print("-" * 50)  # Separator
