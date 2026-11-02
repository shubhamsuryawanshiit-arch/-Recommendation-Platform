def remove_duplicates(movies, ratings):
    return movies.drop_duplicates("movieId"), ratings.drop_duplicates(["userId", "movieId"], keep="last")
