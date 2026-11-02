def validate_ratings(ratings):
    if not ratings.rating.between(0.5, 5).all(): raise ValueError("Ratings must be between 0.5 and 5")
    if ratings[["userId", "movieId", "rating"]].isna().any().any(): raise ValueError("Ratings contain null required fields")
    return True
