import pandas as pd

def popular_movies(ratings: pd.DataFrame, limit=10, min_ratings=20):
    summary = ratings.groupby("movieId").rating.agg(["mean", "count"])
    eligible = summary[summary["count"] >= min_ratings]
    if eligible.empty: eligible = summary
    # Bayesian mean shrinks low-support items toward the dataset mean.
    global_mean = float(ratings.rating.mean()) if len(ratings) else 0
    m = max(float(min_ratings), 1)
    eligible = eligible.assign(score=(eligible["count"] / (eligible["count"] + m) * eligible["mean"] + m / (eligible["count"] + m) * global_mean))
    return [{"movieId": int(idx), "score": round(float(row.score), 4), "support": int(row["count"]), "strategy": "popular"} for idx, row in eligible.sort_values("score", ascending=False).head(limit).iterrows()]
