from sklearn.neighbors import NearestNeighbors

def nearest_neighbors(sparse_matrix, count=30):
    model = NearestNeighbors(metric="cosine", algorithm="brute", n_neighbors=min(count + 1, sparse_matrix.shape[0]))
    return model.fit(sparse_matrix)
