import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import MovieCard from './MovieCard';
export default function MovieRail({ title, eyebrow, movies = [], action, onSave }) {
  return <section className="rail-section"><div className="section-heading"><div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h2>{title}</h2></div>{action && <Link to={action} className="text-link">Explore <ArrowRight size={15} /></Link>}</div>
    {movies.length ? <div className="movie-grid">{movies.map(movie => <MovieCard key={movie._id} movie={movie} onSave={onSave} />)}</div> : <div className="empty-inline">No films to show here yet. Explore the collection or check back after people start rating movies.</div>}
  </section>;
}
