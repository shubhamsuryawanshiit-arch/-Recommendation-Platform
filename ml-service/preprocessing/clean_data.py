import pandas as pd

def clean_movies(movies: pd.DataFrame) -> pd.DataFrame:
    result = movies.dropna(subset=["movieId", "title"]).copy()
    result["movieId"] = pd.to_numeric(result["movieId"], errors="coerce")
    result = result.dropna(subset=["movieId"]).drop_duplicates("movieId", keep="last")
    result["genres"] = result["genres"].fillna("").astype(str)
    return result

def clean_ratings(ratings: pd.DataFrame) -> pd.DataFrame:
    result = ratings.copy()
    result["rating"] = pd.to_numeric(result["rating"], errors="coerce")
    result = result.dropna(subset=["userId", "movieId", "rating"])
    result = result[result.rating.between(0.5, 5.0)]
    result = result.drop_duplicates(["userId", "movieId"], keep="last")
    if "timestamp" not in result: result["timestamp"] = 0
    result["timestamp"] = pd.to_numeric(result["timestamp"], errors="coerce").fillna(0).astype("int64")
    result["userId"] = result.userId.astype(str)
    return result
