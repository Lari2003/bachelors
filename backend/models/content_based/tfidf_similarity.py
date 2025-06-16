import pandas as pd
import numpy as np
import faiss
import pickle
import os
from tqdm import tqdm
from sklearn.feature_extraction.text import TfidfVectorizer

# Load preprocessed movie data
movies_path = "../../data/processed/clean_movies.csv"
movies_df = pd.read_csv(movies_path)

# Fill NaN descriptions with empty strings
movies_df["description"] = movies_df["description"].fillna("")

#  Reduce max_features to 20,000 (optional if memory is still an issue)
vectorizer = TfidfVectorizer(stop_words="english", max_features=20000)
tfidf_matrix = vectorizer.fit_transform(movies_df["description"])  # Stays sparse

# Get matrix shape
num_movies, num_features = tfidf_matrix.shape

# FAISS Index Setup (Using Product Quantization for efficiency)
nlist = 100  # Number of clusters
quantizer = faiss.IndexFlatIP(num_features)  # Inner Product for cosine similarity
index = faiss.IndexIVFFlat(quantizer, num_features, nlist)

# Train FAISS on small sample (avoid memory crash)
train_sample_size = min(5000, num_movies)  # Reduced to 5000 for efficiency
train_sample = tfidf_matrix[:train_sample_size].toarray().astype(np.float32)  # Small batch only
faiss.normalize_L2(train_sample)
index.train(train_sample)

#  Process in **smaller** batches to save memory
batch_size = 256  #  Reduced batch size to prevent RAM issues
print(" Adding TF-IDF vectors to FAISS index...")

pbar_add = tqdm(total=num_movies, desc="Processing movies")
for start in range(0, num_movies, batch_size):
    try:
        batch = np.vstack([tfidf_matrix[i].toarray().astype(np.float32) for i in range(start, min(start + batch_size, num_movies))])
        faiss.normalize_L2(batch)
        index.add(batch)
    except Exception as e:
        print(f" Error processing batch {start} to {start + batch_size}: {e}")
    pbar_add.update(len(batch))
pbar_add.close()

# Create mapping from FAISS index to movieId
faiss_to_movie_id = {i: movies_df.iloc[i]["movieId"] for i in range(num_movies)}
movie_id_to_title = {row["movieId"]: row["title"] for _, row in movies_df.iterrows()}

# Search for similar movies
K = 20
print(" Searching for similar movies...")

top_k_similarities = {}

# Enable multi-threading in FAISS
faiss.omp_set_num_threads(4)  # Use 4 threads (adjust as needed)

pbar_search = tqdm(total=num_movies, desc="Finding similar movies")
for start in range(0, num_movies, batch_size):
    try:
        batch = np.vstack([tfidf_matrix[i].toarray().astype(np.float32) for i in range(start, min(start + batch_size, num_movies))])
        faiss.normalize_L2(batch)
        distances, indices = index.search(batch, K + 1)  # +1 to exclude itself

        # Store top-K similar movies (excluding itself)
        for i, movie_idx in enumerate(range(start, min(start + batch_size, num_movies))):
            movie_id = faiss_to_movie_id.get(movie_idx, None)
            if movie_id is None:
                continue  # Skip missing IDs

            # Retrieve top-K similar movies
            similar_movies = [
                (faiss_to_movie_id.get(int(indices[i, k]), None), float(distances[i, k]))
                for k in range(1, K + 1)  # Exclude itself
                if faiss_to_movie_id.get(int(indices[i, k]), None) is not None
            ]

            # Store results
            top_k_similarities[movie_id] = similar_movies

        # Save temporary progress every 100 batches
        if (start // batch_size) % 100 == 0:
            with open("top_k_similarities_temp.pkl", "wb") as f:
                pickle.dump(top_k_similarities, f)
            print(f" Progress saved at batch {start}!")
    except Exception as e:
        print(f" Error searching in batch {start} to {start + batch_size}: {e}")
    
    pbar_search.update(len(batch))
pbar_search.close()

print(" TF-IDF Similarities computed successfully!")

# Save final results for Hybrid model usage
output_path = "top_k_similarity.pkl"
try:
    with open(output_path, "wb") as f:
        pickle.dump(top_k_similarities, f)
    print(" TF-IDF Similarity data saved as 'top_k_similarity.pkl'!")
except Exception as e:
    print(f" Error saving final results: {e}")

# Function to display recommendations with movie titles
def display_recommendations(movie_id, top_k_similarities, movie_id_to_title):
    if movie_id not in top_k_similarities:
        print(f" Movie ID {movie_id} not found in similarities.")
        return

    movie_title = movie_id_to_title.get(movie_id, f"Unknown Movie (ID: {movie_id})")
    print(f"\n Recommendations for **{movie_title}** (ID: {movie_id}):")

    for similar_movie_id, similarity_score in top_k_similarities[movie_id]:
        rec_title = movie_id_to_title.get(similar_movie_id, f"Unknown Movie (ID: {similar_movie_id})")
        print(f"  - {rec_title} (ID: {similar_movie_id}, Similarity: {similarity_score:.4f})")

# Example usage
example_movie_id = movies_df.iloc[0]["movieId"]  # Use the first movie as an example
display_recommendations(example_movie_id, top_k_similarities, movie_id_to_title)
