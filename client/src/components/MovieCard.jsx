import { Link } from 'react-router-dom';
import { BookmarkPlus, Star } from 'lucide-react';
import { localMovieImage, movieImageFallback } from '../utils/images';
export default function MovieCard({ movie, onSave, saved = false }) {
  const fallback = movieImageFallback('poster'), poster = localMovieImage(movie.posterPath);
  return <article className="movie-card">
    <Link to={`/movie/${movie._id}`} className="poster-wrap"><img src={poster} alt={`${movie.title} poster`} loading="lazy" onError={event => { event.currentTarget.onerror = null; event.currentTarget.src = fallback; }} />
      <span className="poster-rating"><Star size={13} fill="currentColor" /> {Number(movie.averageRating || 0).toFixed(1)}</span></Link>
    <div className="movie-meta"><Link to={`/movie/${movie._id}`} className="movie-title">{movie.title}</Link><div className="movie-subline"><span>{movie.releaseYear || 'Year n/a'}</span><span className="dot">·</span><span>{movie.genres?.[0] || 'Movie'}</span>{onSave && <button className={`icon-button save-card ${saved ? 'saved' : ''}`} aria-label={saved ? 'Saved' : 'Add to watchlist'} onClick={() => onSave(movie)}><BookmarkPlus size={17} /></button>}</div></div>
  </article>;
}
