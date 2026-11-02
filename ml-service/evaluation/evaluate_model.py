from datetime import datetime, timezone
from uuid import uuid4
from ..preprocessing.clean_data import clean_ratings
from ..recommendation.recommendation_engine import recommend
from .train_test_split import split_ratings
from .metrics import regression_metrics, precision_recall_at_k

def evaluate(ratings, k=10):
    clean = clean_ratings(ratings)
    train, test = split_ratings(clean)
    results = {}
    for strategy in ("user", "item"):
        actual, predicted, precisions, recalls = [], [], [], []
        for row in test.itertuples(index=False):
            # Mask the held-out row before scoring to prevent target leakage.
            known = train[~((train.userId.astype(str) == str(row.userId)) & (train.movieId == row.movieId))]
            from ..recommendation.collaborative_filtering import CollaborativeFilter
            model = CollaborativeFilter(known, strategy)
            recs = model.recommend(str(row.userId), limit=k)
            match = next((item for item in recs if item["movieId"] == row.movieId), None)
            # Regression metrics use only ratings the model can predict; no synthetic fallback.
            if match:
                actual.append(float(row.rating)); predicted.append(float(match["score"]))
            if float(row.rating) >= 4:
                relevant = test[(test.userId.astype(str) == str(row.userId)) & (test.rating >= 4)].movieId.tolist()
                scores = precision_recall_at_k([x["movieId"] for x in recs], relevant, k)
                precisions.append(scores["precision_at_k"]); recalls.append(scores["recall_at_k"])
        results[strategy] = {
            **(regression_metrics(actual, predicted) if actual else {"rmse": None, "mae": None}),
            "precision_at_k": sum(precisions) / len(precisions) if precisions else 0.0,
            "recall_at_k": sum(recalls) / len(recalls) if recalls else 0.0,
            "predictions_evaluated": len(actual), "test_ratings": len(test)
        }
    return {"modelVersion": "watchwise-cf-1.0", "evaluationId": str(uuid4()), "evaluationDate": datetime.now(timezone.utc).isoformat(), "split": {"train": len(train), "test": len(test)}, "results": results}
