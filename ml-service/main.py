from __future__ import annotations
import os, json, time
from pathlib import Path
from threading import RLock
from dotenv import load_dotenv
load_dotenv(Path(__file__).resolve().parent / ".env")
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field
from .dataset.dataset_loader import load_dataset
from .dataset.dataset_downloader import ensure_dataset
from .preprocessing.clean_data import clean_ratings
from .recommendation.recommendation_engine import recommend as make_recommendations
from .recommendation.collaborative_filtering import CollaborativeFilter
from .recommendation.cold_start import popular_movies
from .evaluation.evaluate_model import evaluate
from .evaluation.evaluation_report import save_report
from .results.recommendation_logs import log_generation
from .optimization.model_config import DEFAULT_CONFIG

app = FastAPI(title="WatchWise Recommendation Service", version="1.0.0")
DATA = None
USER_RATINGS: dict[tuple[str, int], dict] = {}
LOCK = RLock()
CACHE: dict[str, tuple[float, object]] = {}
ROOT = Path(__file__).resolve().parent
RESULTS = Path(os.getenv("RESULTS_DIR", ROOT / "results"))
USER_RATINGS_FILE = Path(os.getenv("USER_RATINGS_FILE", ROOT / "dataset/watchwise-ratings.json"))

def load_user_ratings():
    if USER_RATINGS_FILE.is_file():
        try:
            for row in json.loads(USER_RATINGS_FILE.read_text(encoding="utf-8")):
                USER_RATINGS[(str(row["userId"]), int(row["movieId"]))] = row
        except (ValueError, KeyError, TypeError):
            raise RuntimeError("Stored WatchWise ratings file is invalid")

def persist_user_ratings():
    USER_RATINGS_FILE.parent.mkdir(parents=True, exist_ok=True)
    USER_RATINGS_FILE.write_text(json.dumps(list(USER_RATINGS.values())), encoding="utf-8")

class RatingInput(BaseModel):
    userId: str = Field(min_length=1, max_length=128)
    movieId: int = Field(gt=0)
    rating: float = Field(ge=0.5, le=5)
    timestamp: int | None = None

def get_data():
    global DATA
    if DATA is None:
        try:
            dataset = load_dataset()
            DATA = {"movies": dataset["movies"], "ratings": clean_ratings(dataset["ratings"])}
        except Exception as exc:
            raise HTTPException(503, f"MovieLens dataset unavailable: {exc}") from exc
    return DATA

def all_ratings():
    data = get_data()
    with LOCK:
        additions = list(USER_RATINGS.values())
    if additions:
        import pandas as pd
        merged = pd.concat([data["ratings"], pd.DataFrame(additions)], ignore_index=True)
        return clean_ratings(merged)
    return data["ratings"]

def require_service_token(token: str | None):
    expected = os.getenv("ML_SERVICE_TOKEN", "")
    if not expected or token != expected:
        raise HTTPException(401, "Invalid service credentials")

def movie_neighbors(movie_id: int, limit: int = 10):
    ratings = all_ratings()
    matrix = ratings.pivot_table(index="userId", columns="movieId", values="rating", fill_value=0)
    if movie_id not in matrix.columns: return []
    from sklearn.metrics.pairwise import cosine_similarity
    similarities = cosine_similarity(matrix.T, dense_output=True)[matrix.columns.get_loc(movie_id)]
    return [{"movieId": int(matrix.columns[i]), "score": round(float(similarities[i]), 4), "support": int((matrix.iloc[:, i] > 0).sum()), "strategy": "item-similarity"} for i in similarities.argsort()[::-1] if matrix.columns[i] != movie_id and similarities[i] > 0][:limit]

@app.get("/health")
def health():
    return {"status": "ok", "service": "watchwise-ml", "datasetLoaded": DATA is not None, "modelVersion": DEFAULT_CONFIG["model_version"]}

@app.post("/recommendations/ratings", status_code=202)
def upsert_rating(payload: RatingInput, x_service_token: str | None = Header(default=None)):
    require_service_token(x_service_token)
    get_data()
    timestamp = payload.timestamp or int(time.time())
    with LOCK:
        USER_RATINGS[(payload.userId, payload.movieId)] = {"userId": payload.userId, "movieId": payload.movieId, "rating": payload.rating, "timestamp": timestamp}
        persist_user_ratings()
        CACHE.clear()
    return {"accepted": True}

@app.delete("/recommendations/ratings/{user_id}/{movie_id}")
def delete_rating(user_id: str, movie_id: int, x_service_token: str | None = Header(default=None)):
    require_service_token(x_service_token)
    with LOCK:
        USER_RATINGS.pop((user_id, movie_id), None)
        persist_user_ratings()
        CACHE.clear()
    return {"removed": True}

@app.get("/recommendations/user/{user_id}")
def recommendations(user_id: str, limit: int = 10, strategy: str = "item", x_service_token: str | None = Header(default=None)):
    require_service_token(x_service_token)
    if strategy not in ("item", "user"): raise HTTPException(422, "strategy must be item or user")
    limit = max(1, min(limit, 50))
    started = time.perf_counter()
    key = f"{user_id}:{strategy}:{limit}"
    now = time.monotonic()
    if key in CACHE and CACHE[key][0] > now:
        return {"userId": user_id, "modelVersion": DEFAULT_CONFIG["model_version"], "recommendations": CACHE[key][1], "cached": True}
    ratings = all_ratings()
    rows = make_recommendations(ratings, user_id, limit=limit, strategy=strategy)
    with LOCK:
        rows = [r for r in rows if (user_id, r["movieId"]) not in USER_RATINGS]
    CACHE[key] = (now + DEFAULT_CONFIG["cache_seconds"], rows)
    log_generation(RESULTS, user_id, strategy, (time.perf_counter() - started) * 1000, len(rows))
    return {"userId": user_id, "modelVersion": DEFAULT_CONFIG["model_version"], "recommendations": rows, "cached": False}

@app.get("/recommendations/movie/{movie_id}")
def similar_movies(movie_id: int, limit: int = 10, x_service_token: str | None = Header(default=None)):
    require_service_token(x_service_token)
    rows = movie_neighbors(movie_id, max(1, min(limit, 50)))
    if not rows: raise HTTPException(404, "Movie has no collaborative similarity data")
    return {"movieId": movie_id, "recommendations": rows}

@app.post("/recommendations/train")
def train(x_service_token: str | None = Header(default=None)):
    require_service_token(x_service_token)
    try:
        ensure_dataset(update=False)
        data = get_data()
        return {"modelVersion": DEFAULT_CONFIG["model_version"], "ratingsLoaded": int(len(data["ratings"])), "trainedAt": int(time.time()), "strategy": "memory-backed collaborative filtering"}
    except HTTPException: raise
    except Exception as exc: raise HTTPException(500, str(exc)) from exc

@app.post("/recommendations/evaluate")
def evaluate_models(x_service_token: str | None = Header(default=None)):
    require_service_token(x_service_token)
    try:
        report = evaluate(all_ratings())
        save_report(report, RESULTS)
        return report
    except Exception as exc: raise HTTPException(422, f"Evaluation could not be completed: {exc}") from exc

@app.get("/recommendations/model-info")
def model_info(x_service_token: str | None = Header(default=None)):
    require_service_token(x_service_token)
    return {"modelVersion": DEFAULT_CONFIG["model_version"], "defaultStrategy": DEFAULT_CONFIG["strategy"], "parameters": DEFAULT_CONFIG, "datasetLoaded": DATA is not None}

@app.get("/recommendations/similar-users/{user_id}")
def similar_users(user_id: str, limit: int = 10, x_service_token: str | None = Header(default=None)):
    require_service_token(x_service_token)
    ratings = all_ratings()
    from sklearn.metrics.pairwise import cosine_similarity
    matrix = ratings.pivot_table(index="userId", columns="movieId", values="rating", fill_value=0)
    matrix.index = matrix.index.astype(str)
    if user_id not in matrix.index: return {"userId": user_id, "similarUsers": []}
    scores = cosine_similarity(matrix, dense_output=True)[matrix.index.get_loc(user_id)]
    order = scores.argsort()[::-1]
    results = [{"userId": str(matrix.index[i]), "similarity": round(float(scores[i]), 4)} for i in order if str(matrix.index[i]) != user_id and scores[i] > 0][:max(1, min(limit, 50))]
    return {"userId": user_id, "similarUsers": results}

@app.on_event("startup")
def startup():
    # Download only when files are missing. Network failure leaves health available;
    # data endpoints return 503 and can recover once the dataset is installed.
    load_user_ratings()
    try: get_data()
    except HTTPException: pass
