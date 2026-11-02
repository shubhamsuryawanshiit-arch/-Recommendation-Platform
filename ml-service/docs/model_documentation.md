# Phase 4 — Model development

`recommendation/collaborative_filtering.py` implements user-based and item-based cosine similarity. A user's rated items are excluded from results. New accounts with fewer than three ratings receive dataset-derived popular movies; after sufficient ratings, the requested collaborative filter ranks candidates. Scores are calculated from rating data, and each output includes the strategy and observed support. Movie IDs are joined against the catalog by the Node API.
