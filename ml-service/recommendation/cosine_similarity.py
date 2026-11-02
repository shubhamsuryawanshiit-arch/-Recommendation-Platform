from sklearn.metrics.pairwise import cosine_similarity as sklearn_cosine

def cosine_similarity(matrix, axis=0):
    return sklearn_cosine(matrix if axis == 0 else matrix.T, dense_output=False)
