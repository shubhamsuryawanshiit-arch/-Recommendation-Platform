# Phase 6 — Optimization

The service uses a bounded in-process recommendation cache and sparse matrix utilities. The tuning helper compares neighborhood sizes and similarity thresholds with held-out RMSE and selects only among candidates with actual predictions. Database indexes support unique IDs and common catalog/rating lookups. Do not run tuning on ordinary user requests; invoke internal evaluation/tuning as an operator task.
