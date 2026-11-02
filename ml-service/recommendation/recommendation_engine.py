from .collaborative_filtering import CollaborativeFilter
from .cold_start import popular_movies

def recommend(ratings, user_id, limit=10, strategy="item", exclude_movies=None):
    user_ratings = ratings[ratings.userId.astype(str) == str(user_id)]
    if len(user_ratings) < 3:
        excluded = set(user_ratings.movieId.tolist()) | set(exclude_movies or [])
        candidates = popular_movies(ratings, limit=ratings.movieId.nunique())
        return [item for item in candidates if item["movieId"] not in excluded][:limit]
    return CollaborativeFilter(ratings, strategy).recommend(str(user_id), limit, exclude_movies)
