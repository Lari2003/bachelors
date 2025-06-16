import pandas as pd
import os
from tqdm import tqdm
from validation_checks import validate_schema, validate_foreign_keys
from schemas import MOVIES_SCHEMA, RATINGS_SCHEMA
from fetch_tmdb_metadata import fetch_and_cache_tmdb_metadata

#  Define Paths
PROCESSED_DATA_PATH = "backend/data/processed/"
RAW_DATA_PATH = "backend/data/raw/"
VALID_LINKS_FILE = os.path.join(PROCESSED_DATA_PATH, "valid_links.csv")
MOVIES_FILE = os.path.join(RAW_DATA_PATH, "movies.csv")
RATINGS_FILE = os.path.join(RAW_DATA_PATH, "ratings.csv")
LINKS_FILE = os.path.join(RAW_DATA_PATH, "links.csv")
TMDB_METADATA_CACHE_FILE = os.path.join(PROCESSED_DATA_PATH, "tmdb_metadata_cache.csv")

#  Ensure processed folder exists
os.makedirs(PROCESSED_DATA_PATH, exist_ok=True)

#  Load Valid TMDb IDs (WITH FALLBACK)
print(" Loading valid TMDb IDs...")
try:
    valid_links = pd.read_csv(VALID_LINKS_FILE)
    print(" Using existing valid_links.csv")
except FileNotFoundError:
    print(" valid_links.csv not found. Using all links from links.csv")
    valid_links = pd.read_csv(LINKS_FILE)
    valid_links = valid_links[["movieId", "tmdbId"]]
    valid_links.to_csv(VALID_LINKS_FILE, index=False)
    print(f" Created placeholder {VALID_LINKS_FILE}")

#  Load raw datasets
print(" Loading raw movies and ratings...")
movies = pd.read_csv(MOVIES_FILE)
ratings = pd.read_csv(RATINGS_FILE)
print(f" Total movies loaded: {len(movies)}")

#  Merge Valid TMDb IDs with Movies Dataset
print(" Merging valid TMDb IDs with movies...")
movies = movies.merge(valid_links, on="movieId", how="left")

# Extract year and tmdbId as floats (nullable)
movies["year"] = pd.to_numeric(movies["title"].str.extract(r"\((\d{4})\)")[0], errors="coerce")
movies["tmdbId"] = pd.to_numeric(movies["tmdbId"], errors="coerce")

#  Filter incomplete movies
before_filtering = len(movies)
movies = movies[movies["tmdbId"].notna() & movies["year"].notna()]
after_filtering = len(movies)
print(f" Movies after filtering for valid TMDb ID and year: {after_filtering} (removed {before_filtering - after_filtering})")

#  Convert to non-nullable integers after filtering
movies = movies[movies["tmdbId"].notna()]
movies["tmdbId"] = movies["tmdbId"].astype("int64")
movies["valid_tmdb"] = True
movies["year"] = movies["year"].astype("int64")

#  Fetch metadata from TMDb and merge
print(" Fetching metadata from TMDb for valid movies...")
metadata = fetch_and_cache_tmdb_metadata(movies)
movies = pd.merge(movies, metadata, on="tmdbId", how="left", suffixes=('', '_meta'))

# Schema Validation (AFTER metadata is included)
schema_errors = validate_schema(movies, MOVIES_SCHEMA)
if schema_errors:
    print(" Schema errors in movies data:")
    for error in schema_errors:
        print(f" - {error}")
    exit()

#  Drop rows missing any required metadata
required_columns = ["title", "year", "genres", "tmdbId", "description", "poster_url", "age_restriction"]
movies = movies.dropna(subset=required_columns)

#  Filter ratings for valid movies only
print(" Filtering ratings for valid movies...")
ratings = ratings[ratings["movieId"].isin(movies["movieId"])]

#  Foreign Key Validation (optional)
rating_errors = validate_foreign_keys(ratings, movies)
if rating_errors:
    print(" Foreign key errors:")
    for error in rating_errors:
        print(f" - {error}")

#  Save Cleaned Data
CLEAN_MOVIES_FILE = os.path.join(PROCESSED_DATA_PATH, "clean_movies.csv")
CLEAN_RATINGS_FILE = os.path.join(PROCESSED_DATA_PATH, "clean_ratings.csv")

movies.to_csv(CLEAN_MOVIES_FILE, index=False)
ratings.to_csv(CLEAN_RATINGS_FILE, index=False)

#  Summary
print(f"\n Processed Movies: {len(movies)}")
print(f" Processed Ratings: {len(ratings)}")
print(f" Cleaned movies saved to: {CLEAN_MOVIES_FILE}")
print(f" Cleaned ratings saved to: {CLEAN_RATINGS_FILE}")
