# Phase 5 — Performance evaluation

Evaluation uses a fixed-seed train/test split and removes held-out user/movie targets from each prediction context. It compares user-based and item-based models. RMSE/MAE are calculated only when a held-out item receives a candidate prediction; Precision@K and Recall@K use held-out ratings of 4 or more as relevant. Every run records a generated evaluation ID, model version, timestamp, split counts, prediction counts and measured metrics. Results are saved as JSON and CSV. A metric may be null when no prediction could be evaluated; it is never fabricated.
