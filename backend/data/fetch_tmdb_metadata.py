import pandas as pd
import requests
import os
from tqdm import tqdm
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

# ✅ TMDb API Key
TMDB_API_KEY = "b11fb8ea6a827fb6ae92bbe3e20f0965"

# ✅ File paths
PROCESSED_DATA_PATH = "backend/data/processed/"
TMDB_METADATA_CACHE = os.path.join(PROCESSED_DATA_PATH, "tmdb_metadata_cache.csv")
INVALID_IDS_LOG = os.path.join(PROCESSED_DATA_PATH, "invalid_tmdb_ids.log")

# ✅ Ensure processed folder exists
os.makedirs(PROCESSED_DATA_PATH, exist_ok=True)


def fetch_metadata(movie):
    movie_id = int(movie.tmdbId)
    url = f"https://api.themoviedb.org/3/movie/{movie_id}?api_key={TMDB_API_KEY}&language=en-US"

    try:
        response = requests.get(url)
        if response.status_code != 200:
            raise Exception(f"Status {response.status_code}")

        data = response.json()
        description = data.get("overview", "").strip()
        poster_path = data.get("poster_path")
        poster_url = f"https://image.tmdb.org/t/p/w500{poster_path}" if poster_path else None

        # Age restriction
        age = None
        release_dates_url = f"https://api.themoviedb.org/3/movie/{movie_id}/release_dates?api_key={TMDB_API_KEY}"
        r = requests.get(release_dates_url)
        if r.status_code == 200:
            for result in r.json().get("results", []):
                if result.get("iso_3166_1") == "US":
                    for release in result.get("release_dates", []):
                        cert = release.get("certification")
                        if cert:
                            age = cert
                            break
                    break

        return {
            "tmdbId": movie_id,
            "description": description,
            "age_restriction": age,
            "poster_url": poster_url
        }

    except Exception as e:
        with open(INVALID_IDS_LOG, "a") as log:
            log.write(f"Failed to fetch metadata for TMDb ID {movie_id}: {e}\n")
        return None


def fetch_and_cache_tmdb_metadata(valid_movies_df):
    # ✅ Load existing cache if available
    if os.path.exists(TMDB_METADATA_CACHE):
        metadata_cache = pd.read_csv(TMDB_METADATA_CACHE)
        fetched_ids = set(metadata_cache["tmdbId"].astype(int))
    else:
        metadata_cache = pd.DataFrame(columns=["movieId", "tmdbId", "description", "age_restriction", "poster_url"])
        fetched_ids = set()

    # ✅ Filter movies that need metadata
    valid_movies_df = valid_movies_df.dropna(subset=["tmdbId"])
    valid_movies_df["tmdbId"] = valid_movies_df["tmdbId"].astype(int)

    movies_to_fetch = valid_movies_df[~valid_movies_df["tmdbId"].isin(fetched_ids)]
    print(f"🧠 Need to fetch metadata for {len(movies_to_fetch)} movies...")

    # ✅ Fetch in parallel
    fetched_metadata = []
    start_time = time.time()
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = {executor.submit(fetch_metadata, row): row for _, row in movies_to_fetch.iterrows()}
        for future in tqdm(as_completed(futures), total=len(futures), desc="🔄 Fetching TMDb metadata"):
            result = future.result()
            if result:
                fetched_metadata.append(result)
    elapsed = time.time() - start_time
    print(f"⏱️ Fetching took {elapsed:.2f} seconds.")

    # ✅ Save to cache
    if fetched_metadata:
        new_df = pd.DataFrame(fetched_metadata)
        metadata_cache = pd.concat([metadata_cache, new_df], ignore_index=True)
        metadata_cache.to_csv(TMDB_METADATA_CACHE, index=False)

    print(f"✅ Metadata fetching complete. Cached: {len(metadata_cache)} entries.")
    return metadata_cache
