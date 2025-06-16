import pandas as pd
import numpy as np
import faiss
import pickle
import torch
import os
from tqdm import tqdm
from sentence_transformers import SentenceTransformer

# Paths for saving/loading data
movies_path = "../../data/processed/clean_movies.csv"
embeddings_path = "bert_embeddings.pkl"
faiss_index_path = "bert_faiss.index"
similarities_path = "top_k_bertSimilarities.pkl"

# Load movie data
movies_df = pd.read_csv(movies_path)
movies_df["description"] = movies_df["description"].fillna("")

# Ensure consistent indexing (prevents ID mismatches)
movies_df = movies_df.reset_index(drop=True)
movie_descriptions = movies_df["description"].tolist()
movie_ids = movies_df.index.tolist()  # Store correct mapping of IDs

# Load BERT model on CPU
device = "cpu"
print(f" Loading BERT model on: {device.upper()}")
bert_model = SentenceTransformer("all-MiniLM-L6-v2", device=device)

# **🔧 Optimized Settings**
batch_size = 128  #  Adjusted for balanced efficiency
num_workers = 2   #  Prevent CPU overload
fp16 = False      #  Full precision for best accuracy

#  Load or Compute BERT Embeddings
if os.path.exists(embeddings_path):
    print(" Loading precomputed BERT embeddings...")
    with open(embeddings_path, "rb") as f:
        movie_embeddings = pickle.load(f)
else:
    print(" Generating BERT embeddings in batches...")
    movie_embeddings = []
    
    with torch.no_grad():
        for i in tqdm(range(0, len(movie_descriptions), batch_size), desc="Processing descriptions", unit="batch"):
            batch_texts = movie_descriptions[i:i + batch_size]
            batch_embeddings = bert_model.encode(
                batch_texts, 
                convert_to_numpy=True, 
                batch_size=batch_size, 
                num_workers=num_workers,  
                show_progress_bar=False,  
                normalize_embeddings=True,  
                convert_to_tensor=False,    
            )
            movie_embeddings.append(batch_embeddings.astype(np.float16 if fp16 else np.float32))  

    movie_embeddings = np.vstack(movie_embeddings)

    # Save embeddings to avoid recomputation
    with open(embeddings_path, "wb") as f:
        pickle.dump(movie_embeddings, f)
    print(f" BERT embeddings saved as '{embeddings_path}'!")

#  Load or Build FAISS Index
d = movie_embeddings.shape[1]  # Embedding dimension
if os.path.exists(faiss_index_path):
    print(" Loading existing FAISS index...")
    index = faiss.read_index(faiss_index_path)
else:
    print(" Building new FAISS index...")
    index = faiss.IndexFlatIP(d)  
    index.add(movie_embeddings)  
    faiss.write_index(index, faiss_index_path)
    print(f" FAISS index saved as '{faiss_index_path}'!")

#  Search for Similar Movies
K = 20  
top_k_bertSimilarities = {}

print("🔍 Searching for similar movies...")
pbar_search = tqdm(total=len(movie_embeddings), desc="Finding similar movies")
for start in range(0, len(movie_embeddings), batch_size):
    batch = movie_embeddings[start:start + batch_size]
    distances, indices = index.search(batch, K + 1)  #  Keep raw FAISS similarity scores

    #  Store Top-K similar movies with **correct IDs**
    for i, movie_idx in enumerate(range(start, min(start + batch_size, len(movie_embeddings)))):
        original_movie_id = movie_ids[movie_idx]  # Retrieve correct movieId
        top_k_bertSimilarities[original_movie_id] = [
            (movie_ids[int(indices[i, k])], float(distances[i, k])) for k in range(1, K + 1)
        ]
    
    pbar_search.update(batch_size)

pbar_search.close()
print(" BERT Similarities computed successfully!")

#  Save Final Results
with open(similarities_path, "wb") as f:
    pickle.dump(top_k_bertSimilarities, f)
print(f" BERT Similarity data saved as '{similarities_path}'!")
