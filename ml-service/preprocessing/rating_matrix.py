import pandas as pd
from scipy.sparse import csr_matrix

def create_rating_matrix(ratings: pd.DataFrame):
    users = pd.Index(ratings.userId.astype(str).unique())
    movies = pd.Index(ratings.movieId.unique())
    matrix = csr_matrix((ratings.rating.astype(float), (users.get_indexer(ratings.userId.astype(str)), movies.get_indexer(ratings.movieId))), shape=(len(users), len(movies)))
    return matrix, users, movies
