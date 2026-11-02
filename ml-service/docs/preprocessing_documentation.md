# Phase 3 — Preprocessing

Preprocessing removes records without required fields, drops duplicate IDs/pairs, converts and validates ratings in the 0.5–5 range, and normalizes user IDs to strings. `rating_matrix.py` makes a SciPy CSR user-item matrix; `feature_engineering.py` extracts release year and genres. `evaluation/train_test_split.py` separates training and held-out rows before evaluation.
