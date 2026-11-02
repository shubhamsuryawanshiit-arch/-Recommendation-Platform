from .collaborative_filtering import CollaborativeFilter

def predict_ratings(ratings, user_id, movie_ids, strategy="item"):
    model = CollaborativeFilter(ratings, strategy)
    recommendations = {item["movieId"]: item["score"] for item in model.recommend(str(user_id), limit=len(movie_ids))}
    return {movie_id: recommendations.get(movie_id) for movie_id in movie_ids}
