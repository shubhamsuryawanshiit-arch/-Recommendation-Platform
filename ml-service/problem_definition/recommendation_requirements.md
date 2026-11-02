# Model requirements

- Input ratings are numeric and lie in the MovieLens 0.5–5 range.
- Duplicate user/movie ratings resolve to the latest record.
- User-based and item-based cosine collaborative filtering are both available.
- Recommendations exclude rated items, have a bounded result count, and carry support and strategy metadata.
- Cold-start output uses real MovieLens rating counts and means; personalized recommendations are never randomly generated.
- Training/evaluation operations require the private ML service token and are absent from public application navigation.
