import numpy as np

def regression_metrics(actual, predicted):
    errors = np.asarray(actual, dtype=float) - np.asarray(predicted, dtype=float)
    return {"rmse": float(np.sqrt(np.mean(errors ** 2))), "mae": float(np.mean(np.abs(errors)))}

def precision_recall_at_k(recommended, relevant, k=10):
    rec = list(recommended)[:k]
    relevant = set(relevant)
    hits = sum(item in relevant for item in rec)
    return {"precision_at_k": hits / max(k, 1), "recall_at_k": hits / max(len(relevant), 1)}
