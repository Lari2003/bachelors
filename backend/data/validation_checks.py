import pandas as pd
from schemas import MOVIES_SCHEMA, RATINGS_SCHEMA

def validate_schema(df, schema):
    errors = []
    for col, expected_type in schema.items():
        if col not in df.columns:
            errors.append(f"Missing column: {col}")
            continue
            
        actual_type = str(df[col].dtype)
        if expected_type not in actual_type:
            errors.append(f"{col}: Expected {expected_type}, got {actual_type}")
    return errors

def validate_foreign_keys(ratings, movies):
    movie_ids = set(movies["movieId"])
    foreign_key_errors = []
    
    missing_movies = ratings[~ratings["movieId"].isin(movie_ids)]
    if not missing_movies.empty:
        foreign_key_errors.append(f"{len(missing_movies)} ratings reference missing movies")
    
    return foreign_key_errors