from dataclasses import dataclass
from typing import Literal
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity

@dataclass
class CollaborativeFilter:
    ratings: pd.DataFrame
    strategy: Literal["user", "item"] = "item"
    neighbors: int = 30
    min_similarity: float = 0.05

    def recommend(self, user_id: str, limit: int = 10, exclude_movies=None):
        frame = self.ratings
        user_id = str(user_id)
        if user_id not in set(frame.userId.astype(str)): return []
        matrix = frame.pivot_table(index="userId", columns="movieId", values="rating", fill_value=0)
        matrix.index = matrix.index.astype(str)
        if user_id not in matrix.index: return []
        uidx = matrix.index.get_loc(user_id)
        rated = set(frame.loc[frame.userId.astype(str) == user_id, "movieId"].tolist())
        excluded = rated | set(exclude_movies or [])
        observed = matrix.where(matrix > 0)
        user_means = observed.mean(axis=1).fillna(float(frame.rating.mean()))
        centered = observed.sub(user_means, axis=0).fillna(0)
        if self.strategy == "user":
            similarities = cosine_similarity(centered, dense_output=True)[uidx]
            order = similarities.argsort()[::-1]
            order = [i for i in order if i != uidx and similarities[i] >= self.min_similarity][:self.neighbors]
            if not order: return []
            weights = similarities[order]
            neighbor_observed = observed.iloc[order].notna().to_numpy()
            numerator = centered.iloc[order].T.to_numpy() @ weights
            denominator = neighbor_observed.T @ abs(weights)
            scores = float(user_means.iloc[uidx]) + numerator / denominator.clip(1e-9)
            support = neighbor_observed.sum(axis=0)
        else:
            similarities = cosine_similarity(centered.T, dense_output=True)
            user_ratings = matrix.iloc[uidx].to_numpy()
            rated_indices = (user_ratings > 0).nonzero()[0]
            if len(rated_indices) == 0: return []
            user_mean = float(user_means.iloc[uidx])
            residuals = user_ratings[rated_indices] - user_mean
            weighted = similarities[:, rated_indices] @ residuals
            denom = abs(similarities[:, rated_indices]).sum(axis=1)
            scores = user_mean + weighted / denom.clip(1e-9)
            support = (similarities[:, rated_indices] >= self.min_similarity).sum(axis=1)
        output = []
        for idx in scores.argsort()[::-1]:
            movie_id = matrix.columns[idx]
            if movie_id in excluded or support[idx] < 1: continue
            output.append({"movieId": int(movie_id), "score": round(float(min(5, max(0.5, scores[idx]))), 4), "support": int(support[idx]), "strategy": self.strategy})
            if len(output) >= limit: break
        return output

def fit_user_based(ratings, neighbors=30): return CollaborativeFilter(ratings, "user", neighbors)
def fit_item_based(ratings, neighbors=30): return CollaborativeFilter(ratings, "item", neighbors)
