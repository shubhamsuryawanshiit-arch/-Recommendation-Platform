import pandas as pd

def handle_missing_values(movies: pd.DataFrame, ratings: pd.DataFrame):
    movies = movies.dropna(subset=["movieId", "title"]).copy()
    movies["genres"] = movies["genres"].fillna("")
    ratings = ratings.dropna(subset=["userId", "movieId", "rating"]).copy()
    return movies, ratings
