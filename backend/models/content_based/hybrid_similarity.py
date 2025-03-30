import pickle
import pandas as pd
import os

# Define file paths
movies_path = "../../data/processed/clean_movies.csv"
tfidf_path = "top_k_similarity.pkl"
bert_path = "top_k_bertSimilarities.pkl"
hybrid_path = "top_k_similarity_hybrid.pkl"

# Load movie data
movies_df = pd.read_csv(movies_path)

# Create a dictionary mapping index positions to `movieId`
index_to_movie_id = dict(zip(movies_df.index, movies_df["movieId"]))

# Check if both similarity files exist
if not os.path.exists(tfidf_path):
    raise FileNotFoundError(f"❌ Error: '{tfidf_path}' not found!")
if not os.path.exists(bert_path):
    raise FileNotFoundError(f"❌ Error: '{bert_path}' not found!")

# Load TF-IDF similarity scores
with open(tfidf_path, "rb") as f:
    tfidf_similarities = pickle.load(f)

# Load BERT similarity scores
with open(bert_path, "rb") as f:
    bert_similarities = pickle.load(f)

# Define weights for combining scores (adjust as needed)
weight_tfidf = 0.5
weight_bert = 0.5

# Combine similarities
hybrid_similarities = {}

for movie_index in set(tfidf_similarities.keys()).union(bert_similarities.keys()):
    # Convert **index** to `movieId`
    movie_id = index_to_movie_id.get(movie_index, None)
    if movie_id is None:
        continue  # Skip if we can't find a valid `movieId`

    # Retrieve TF-IDF and BERT similarity scores
    tfidf_scores = dict(tfidf_similarities.get(movie_index, []))  # Default to empty list
    bert_scores = dict(bert_similarities.get(movie_index, []))    # Default to empty list

    # Merge scores using a weighted sum
    combined_scores = {}
    for neighbor_index in set(tfidf_scores.keys()).union(bert_scores.keys()):
        neighbor_id = index_to_movie_id.get(neighbor_index, None)
        if neighbor_id is None:
            continue  # Skip invalid neighbor IDs

        tfidf_score = tfidf_scores.get(neighbor_index, 0)
        bert_score = bert_scores.get(neighbor_index, 0)
        combined_scores[neighbor_id] = (weight_tfidf * tfidf_score) + (weight_bert * bert_score)

    # Sort by combined score and keep top-K results
    sorted_neighbors = sorted(combined_scores.items(), key=lambda x: x[1], reverse=True)[:20]
    hybrid_similarities[movie_id] = sorted_neighbors  # ✅ Save correct `movieId`

# Save the hybrid similarity results
with open(hybrid_path, "wb") as f:
    pickle.dump(hybrid_similarities, f)

print(f"✅ Hybrid similarity model saved as '{hybrid_path}'!")
