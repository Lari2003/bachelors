MOVIES_SCHEMA = {
    "movieId": "int64",
    "title": "object",
    "genres": "object",
    "tmdbId": "int64",
    "valid_tmdb": "bool",
    "year": "int64",
    "description": "object"
}

RATINGS_SCHEMA = {
    "userId": "int64",
    "movieId": "int64",
    "rating": "float64",
    "timestamp": "int64"
}