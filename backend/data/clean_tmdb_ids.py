import asyncio
import aiohttp
import pandas as pd
import os
import random
from dotenv import load_dotenv
from tqdm.asyncio import tqdm
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

# ✅ Load API Key
load_dotenv()
TMDB_API_KEY = os.getenv("TMDB_API_KEY", "").strip()

if not TMDB_API_KEY:
    print("🚨 ERROR: API key is missing or invalid. Check your .env file!")
    exit(1)

# ✅ Define Paths
RAW_DATA_PATH = "backend/data/raw/"
PROCESSED_DATA_PATH = "backend/data/processed/"
LINKS_FILE = os.path.join(RAW_DATA_PATH, "links.csv")
CLEAN_MOVIES_FILE = os.path.join(PROCESSED_DATA_PATH, "clean_movies.csv")

os.makedirs(PROCESSED_DATA_PATH, exist_ok=True)

# ✅ Load links.csv
print("🔍 Loading MovieLens TMDb IDs...")
links = pd.read_csv(LINKS_FILE)
links["tmdbId"] = pd.to_numeric(links["tmdbId"], errors="coerce").astype("Int64")
links = links[links["tmdbId"].notna() & (links["tmdbId"] != 0)]
tmdb_ids = links["tmdbId"].tolist()

# ✅ Define Fetching Function with Rate Limit Handling
async def fetch_movie_details(session, tmdb_id):
    """Fetch movie details from TMDb API with rate-limiting & retries."""
    url = f"https://api.themoviedb.org/3/movie/{int(tmdb_id)}?api_key={TMDB_API_KEY}&language=en-US"
    headers = {"User-Agent": "Mozilla/5.0"}

    for attempt in range(5):  # Retry up to 5 times with exponential backoff
        try:
            async with session.get(url, headers=headers, timeout=15) as response:
                if response.status == 200:
                    data = await response.json()
                    return {"tmdbId": tmdb_id, "description": data.get("overview", "")}
                elif response.status == 404:
                    return None  # Skip missing movies
                elif response.status == 429:  # Rate limit hit
                    wait_time = 2 ** attempt  # Exponential backoff
                    print(f"⏳ Rate limited (429) for {tmdb_id}, retrying in {wait_time} sec...")
                    await asyncio.sleep(wait_time)
                else:
                    print(f"⚠️ TMDb ID {tmdb_id} failed (Status: {response.status})")
                    return None
        except asyncio.TimeoutError:
            print(f"⏳ Timeout for {tmdb_id}, retrying...")
            await asyncio.sleep(2 ** attempt)  # Exponential backoff
        except aiohttp.ClientError as e:
            print(f"🚨 Network error for {tmdb_id}: {e}, retrying...")
            await asyncio.sleep(2 ** attempt)

    return None  # Return None if all retries fail

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

    # ✅ Save Updated Movies Data
    movies.to_csv(CLEAN_MOVIES_FILE, index=False)

    print(f"\n✅ Movie descriptions added! Updated dataset saved at {CLEAN_MOVIES_FILE}.")
