from ..recommendation.collaborative_filtering import CollaborativeFilter
from ..evaluation.train_test_split import split_ratings
from ..evaluation.metrics import regression_metrics

def tune(ratings, neighborhoods=(10, 20, 30, 50), thresholds=(0.0, 0.05, 0.1)):
    train, test = split_ratings(ratings)
    rows = []
    for neighbors in neighborhoods:
        for threshold in thresholds:
            errors = []
            for row in test.itertuples(index=False):
                masked = train[~((train.userId.astype(str) == str(row.userId)) & (train.movieId == row.movieId))]
                model = CollaborativeFilter(masked, "item", neighbors, threshold)
                result = next((r for r in model.recommend(str(row.userId), 500) if r["movieId"] == row.movieId), None)
                if result: errors.append((float(row.rating), result["score"]))
            metrics = regression_metrics([p[0] for p in errors], [p[1] for p in errors]) if errors else {"rmse": None, "mae": None}
            rows.append({"neighbors": neighbors, "minimum_similarity": threshold, **metrics, "predictions_evaluated": len(errors)})
    valid = [row for row in rows if row["rmse"] is not None]
    return {"candidates": rows, "selected": min(valid, key=lambda row: row["rmse"]) if valid else None}
