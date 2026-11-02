# Problem statement

People often have trouble choosing a film from a large catalog. WatchWise uses explicit movie ratings to estimate which unrated catalog items a user may enjoy. It is a decision-support tool: the ranked list is a calculated estimate based on observed rating patterns, not a guarantee of enjoyment.

## Inputs

- MovieLens ratings: user ID, movie ID, 0.5–5 rating, and timestamp.
- WatchWise ratings: registered account ID, MovieLens movie ID, rating, and timestamp.
- Movie catalog metadata: MovieLens ID, title, genres, and release year extracted from title.
- Optional user-selected favorite genres for a light cold-start filter.

## Output

At most ten catalog movie IDs and recommendation scores, excluding items already rated by that account. The API joins IDs to catalog records; the website does not invent a title, rating, cast, plot, or image.
