from .collaborative_filtering import CollaborativeFilter

def recommend_for_user(ratings, user_id, limit=10, neighbors=30):
    return CollaborativeFilter(ratings, "user", neighbors).recommend(user_id, limit)
