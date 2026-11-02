import Movie from '../models/Movie.js';
import Rating from '../models/Rating.js';

// A bounded, deterministic fallback for deployments without the offline recommender.
// It uses WatchWise ratings only; MovieLens aggregates are used only for cold-start ranking.
export async function recommendLocally(userId, favoriteGenres = [], limit = 10) {
  const own = await Rating.find({ userId }).select('movieId rating').limit(500).lean();
  const ownIds = new Set(own.map(row => String(row.movieId)));
  if (own.length < 3) {
    const filter = own.length ? { _id: { $nin: [...ownIds] } } : {};
    if (favoriteGenres.length) filter.genres = { $in: favoriteGenres };
    let movies = await Movie.find(filter).sort({ averageRating: -1, ratingCount: -1, title: 1 }).limit(limit).lean();
    if (!movies.length && favoriteGenres.length) movies = await Movie.find(own.length ? { _id: { $nin: [...ownIds] } } : {}).sort({ averageRating: -1, ratingCount: -1, title: 1 }).limit(limit).lean();
    return { movies, source: 'popular-cold-start', modelVersion: 'watchwise-fallback-1.0', reason: 'Popular titles, with your favorite genres used when available.' };
  }

  const rows = await Rating.find({ userId: { $ne: userId } }).select('userId movieId rating').sort({ updatedAt: -1 }).limit(20000).lean();
  const target = new Map(own.map(row => [String(row.movieId), row.rating]));
  const neighbors = new Map();
  for (const row of rows) {
    const key = String(row.userId);
    if (!neighbors.has(key)) neighbors.set(key, []);
    neighbors.get(key).push(row);
  }
  const totals = new Map();
  for (const [neighborId, ratings] of neighbors) {
    const overlap = ratings.filter(row => target.has(String(row.movieId)));
    if (overlap.length < 2) continue;
    let dot = 0, targetNorm = 0, neighborNorm = 0;
    for (const row of overlap) {
      const a = target.get(String(row.movieId)) - 3, b = row.rating - 3;
      dot += a * b; targetNorm += a * a; neighborNorm += b * b;
    }
    const similarity = targetNorm && neighborNorm ? dot / Math.sqrt(targetNorm * neighborNorm) : 0;
    if (similarity <= 0) continue;
    const rated = new Set(overlap.map(row => String(row.movieId)));
    for (const row of ratings) {
      const movieId = String(row.movieId);
      if (target.has(movieId) || rated.has(movieId)) continue;
      const item = totals.get(movieId) || { weighted: 0, weight: 0, support: 0 };
      item.weighted += similarity * row.rating; item.weight += similarity; item.support += 1;
      totals.set(movieId, item);
    }
  }
  const ranked = [...totals.entries()].map(([movieId, item]) => ({ movieId, score: item.weighted / item.weight, support: item.support }))
    .sort((a, b) => b.score - a.score || b.support - a.support || a.movieId.localeCompare(b.movieId)).slice(0, limit);
  if (!ranked.length) {
    const movies = await Movie.find({ _id: { $nin: [...ownIds] } }).sort({ averageRating: -1, ratingCount: -1, title: 1 }).limit(limit).lean();
    return { movies, source: 'popular-cold-start', modelVersion: 'watchwise-fallback-1.0', reason: 'Not enough overlapping WatchWise ratings yet; showing highly rated titles.' };
  }
  const docs = await Movie.find({ _id: { $in: ranked.map(item => item.movieId) } }).lean();
  const byId = new Map(docs.map(movie => [String(movie._id), movie]));
  return { movies: ranked.map(item => byId.get(item.movieId)).filter(Boolean), source: 'watchwise-user-collaborative', modelVersion: 'watchwise-fallback-1.0', reason: 'Ranked from similar WatchWise members who rated some of the same movies.' };
}

export async function similarLocally(movie, limit = 8) {
  const genres = movie.genres || [];
  if (!genres.length) return { movies: [], source: 'genre-similarity' };
  const movies = await Movie.find({ _id: { $ne: movie._id }, genres: { $in: genres } })
    .sort({ averageRating: -1, ratingCount: -1, title: 1 }).limit(100).lean();
  const ranked = movies.map(candidate => ({ candidate, overlap: candidate.genres.filter(genre => genres.includes(genre)).length }))
    .sort((a, b) => b.overlap - a.overlap || b.candidate.averageRating - a.candidate.averageRating || b.candidate.ratingCount - a.candidate.ratingCount || a.candidate.title.localeCompare(b.candidate.title))
    .slice(0, limit).map(row => row.candidate);
  return { movies: ranked, source: 'genre-similarity' };
}
