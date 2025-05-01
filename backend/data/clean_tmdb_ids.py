import asyncio
import aiohttp
import pandas as pd
import os
import random
from dotenv import load_dotenv
from tqdm.asyncio import tqdm
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
import json
from hashlib import md5
import datetime

# ✅ Load API Key
load_dotenv()
TMDB_API_KEY = os.getenv("TMDB_API_KEY", "").strip()

if not TMDB_API_KEY:
    print("🚨 ERROR: API key is missing or invalid. Check your .env file!")
    exit(1)

# ✅ Define Paths FIRST --------------------------------------------------------
current_dir = os.path.dirname(os.path.abspath(__file__))  # Script's directory
RAW_DATA_PATH = os.path.join(current_dir, "raw")
PROCESSED_DATA_PATH = os.path.join(current_dir, "processed")

# File paths using the above directories
LINKS_FILE = os.path.join(RAW_DATA_PATH, "links.csv")
CLEAN_MOVIES_FILE = os.path.join(PROCESSED_DATA_PATH, "clean_movies.csv")
CLEAN_RATINGS_FILE = os.path.join(PROCESSED_DATA_PATH, "clean_ratings.csv")  # Added
INVALID_IDS_LOG = os.path.join(PROCESSED_DATA_PATH, "invalid_tmdb_ids.log")
VALID_LINKS_FILE = os.path.join(PROCESSED_DATA_PATH, "valid_links.csv")

# ✅ Ensure processed folder exists
os.makedirs(PROCESSED_DATA_PATH, exist_ok=True)

# ✅ Load links.csv
print("🔍 Loading MovieLens TMDb IDs...")
links = pd.read_csv(LINKS_FILE)
links["tmdbId"] = pd.to_numeric(links["tmdbId"], errors="coerce").astype("Int64")
links = links[links["tmdbId"].notna() & (links["tmdbId"] != 0)]
tmdb_ids = links["tmdbId"].tolist()

# ✅ Define Fetching Function with Rate Limit Handling
async def fetch_movie_details(session, tmdb_id):
    """Fetch movie details from TMDb API with proper validation"""
    url = f"https://api.themoviedb.org/3/movie/{int(tmdb_id)}?api_key={TMDB_API_KEY}"
    headers = {"User-Agent": f"MyApp/1.0 ({os.getenv('CONTACT_EMAIL', '')})"}
    
    try:
        async with session.get(url, headers=headers, timeout=10) as response:
            if response.status == 200:
                data = await response.json()
                return {
                    "tmdbId": tmdb_id,
                    "valid": True,
                    "description": data.get("overview", ""),
                    "year": data.get("release_date", "")[:4] if data.get("release_date") else None
                }
            elif response.status == 404:
                # Log invalid ID immediately
                with open(INVALID_IDS_LOG, "a") as f:
                    f.write(f"{tmdb_id}\n")
                return {"tmdbId": tmdb_id, "valid": False}
            else:
                return {"tmdbId": tmdb_id, "valid": False}
    except Exception as e:
        print(f"🚨 Error validating {tmdb_id}: {str(e)}")
        return {"tmdbId": tmdb_id, "valid": False}

def generate_metadata(movies_df, ratings_path):
    """Generate dataset metadata and checksums"""
    metadata = {
        "version": datetime.datetime.now().isoformat(),
        "num_movies": int(len(movies_df)),
        "num_valid_tmdb": int(movies_df["valid_tmdb"].sum()),
        "checksum": md5(pd.util.hash_pandas_object(movies_df).values).hexdigest(),
        "ratings_checksum": md5(open(ratings_path, "rb").read()).hexdigest()
    }
    
    metadata_path = os.path.join(PROCESSED_DATA_PATH, "clean_metadata.json")
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"📊 Metadata saved to {metadata_path}")

# ✅ Process TMDb IDs in Batches with Concurrency Control
async def process_tmdb_movies():
    batch_size = 500  # Reduce batch size to avoid rate limits
    concurrency_limit = 5  # Reduce concurrency to avoid overloading TMDb API
    semaphore = asyncio.Semaphore(concurrency_limit)

    async def limited_fetch(session, tmdb_id):
        async with semaphore:
            return await fetch_movie_details(session, tmdb_id)

    all_results = []
    async with aiohttp.ClientSession() as session:
        for i in range(0, len(tmdb_ids), batch_size):
            batch = tmdb_ids[i : i + batch_size]
            print(f"🚀 Fetching batch {i // batch_size + 1}/{len(tmdb_ids) // batch_size + 1}...")

            tasks = [limited_fetch(session, tmdb_id) for tmdb_id in batch]
            results = []

            for future in tqdm(asyncio.as_completed(tasks), total=len(tasks), desc="📦 Fetching Movie Descriptions"):
                result = await future
                if result:
                    results.append(result)

            all_results.extend(results)

    return all_results

async def main():
    print("🔎 Fetching TMDb Movie Descriptions...")
    return await process_tmdb_movies()

if __name__ == "__main__":
    movie_descriptions = asyncio.run(main())

    # ✅ Convert to DataFrame
    descriptions_df = pd.DataFrame(movie_descriptions)

    # ✅ Load Clean Movies Data
    movies = pd.read_csv(CLEAN_MOVIES_FILE)
    
    # ✅ Ensure correct data types
    movies["tmdbId"] = movies["tmdbId"].astype("Int64")
    descriptions_df["tmdbId"] = descriptions_df["tmdbId"].astype("Int64")

    # ✅ Merge Descriptions with Movies
    movies = movies.merge(descriptions_df, on="tmdbId", how="left")

    generate_metadata(movies, CLEAN_RATINGS_FILE) 

    # ✅ Save Updated Movies Data
    movies.to_csv(CLEAN_MOVIES_FILE, index=False)

    # ✅ Save valid TMDb links
    valid_links = links[links["tmdbId"].isin(descriptions_df[descriptions_df["valid"] == True]["tmdbId"])]
    valid_links.to_csv(VALID_LINKS_FILE, index=False)
    print(f"✅ Valid links saved at {VALID_LINKS_FILE}")

    print(f"\n✅ Movie descriptions added! Updated dataset saved at {CLEAN_MOVIES_FILE}.")
