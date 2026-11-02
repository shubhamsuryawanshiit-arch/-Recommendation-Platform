"""Stable MovieLens-ID mapping helpers shared by data import and model code."""
def map_movie_ids(movie_ids, movie_records):
    known = set(movie_records)
    return {int(movie_id): movie_id for movie_id in movie_ids if int(movie_id) in known}

def merge_watchwise_ratings(dataset_ratings, user_ratings):
    import pandas as pd
    if user_ratings is None or len(user_ratings) == 0: return dataset_ratings.copy()
    combined = pd.concat([dataset_ratings, user_ratings], ignore_index=True)
    # Prefer the latest application rating for a user/movie pair.
    return combined.sort_values("timestamp").drop_duplicates(["userId", "movieId"], keep="last")
