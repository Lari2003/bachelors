import pandas as pd
import os

# ✅ Define Paths
PROCESSED_DATA_PATH = "backend/data/processed/"
RAW_DATA_PATH = "backend/data/raw/"
VALID_LINKS_FILE = os.path.join(PROCESSED_DATA_PATH, "valid_links.csv")
MOVIES_FILE = os.path.join(RAW_DATA_PATH, "movies.csv")
RATINGS_FILE = os.path.join(RAW_DATA_PATH, "ratings.csv")

# ✅ Ensure processed folder exists
os.makedirs(PROCESSED_DATA_PATH, exist_ok=True)

# ✅ Load Valid TMDb IDs
print("🔍 Loading valid TMDb IDs...")
valid_links = pd.read_csv(VALID_LINKS_FILE)

# ✅ Load MovieLens Movies & Ratings
print("🔍 Loading MovieLens datasets...")
movies = pd.read_csv(MOVIES_FILE)
ratings = pd.read_csv(RATINGS_FILE)

# ✅ Merge Valid TMDb IDs with Movies Dataset
print("🔄 Merging valid TMDb IDs with movies...")
movies = movies.merge(valid_links, on="movieId", how="inner")

# ✅ Extract Year from Titles (e.g., "Toy Story (1995)" → 1995)
movies["year"] = movies["title"].str.extract(r"\((\d{4})\)")

# ✅ Convert Year to Numeric
movies["year"] = pd.to_numeric(movies["year"], errors="coerce")

# ✅ Drop Missing Data
movies.dropna(inplace=True)

# ✅ Keep only ratings for valid movies
print("🔄 Filtering ratings for valid movies...")
ratings = ratings[ratings["movieId"].isin(movies["movieId"])]

# ✅ Save Cleaned Data
CLEAN_MOVIES_FILE = os.path.join(PROCESSED_DATA_PATH, "clean_movies.csv")
CLEAN_RATINGS_FILE = os.path.join(PROCESSED_DATA_PATH, "clean_ratings.csv")

movies.to_csv(CLEAN_MOVIES_FILE, index=False)
ratings.to_csv(CLEAN_RATINGS_FILE, index=False)

# ✅ Summary
print(f"\n✅ Processed Movies: {len(movies)}")
print(f"✅ Processed Ratings: {len(ratings)}")
print(f"📂 Cleaned movies saved to: {CLEAN_MOVIES_FILE}")
print(f"📂 Cleaned ratings saved to: {CLEAN_RATINGS_FILE}")
