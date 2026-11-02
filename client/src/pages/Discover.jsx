import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { api, errorMessage } from '../api';
import MovieCard from '../components/MovieCard';

const GENRES = ['Action', 'Adventure', 'Animation', 'Children', 'Comedy', 'Crime', 'Documentary', 'Drama', 'Fantasy', 'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Thriller'];
export default function Discover() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('search') || ''), [movies, setMovies] = useState([]), [page, setPage] = useState(1), [pages, setPages] = useState(1), [loading, setLoading] = useState(true), [error, setError] = useState('');
  const genre = params.get('genre') || '', sort = params.get('sort') || 'popularity';
  useEffect(() => { let active = true; setLoading(true); setError(''); api.get('/movies', { params: { page, limit: 24, genre: genre || undefined, search: params.get('search') || undefined, sort, year: params.get('year') || undefined, minRating: params.get('minRating') || undefined } }).then(({ data }) => { if (active) { setMovies(data.movies); setPages(data.pagination.pages || 1); } }).catch(e => active && setError(errorMessage(e))).finally(() => active && setLoading(false)); return () => { active = false; }; }, [page, genre, sort, params]);
  const update = (key, value) => { const next = new URLSearchParams(params); if (value) next.set(key, value); else next.delete(key); setParams(next); setPage(1); };
  const submit = e => { e.preventDefault(); update('search', search.trim()); };
  return <div className="content-page"><div className="page-intro"><span className="eyebrow">The whole collection</span><h1>Find your <em>next watch.</em></h1><p>Explore films, filter by mood, and follow the stories that catch your eye.</p></div>
    <div className="discover-toolbar"><form className="search-form" onSubmit={submit}><Search size={18}/><input placeholder="Search movie titles…" value={search} onChange={e => setSearch(e.target.value)} /><button type="submit">Search</button></form><label className="sort-select"><SlidersHorizontal size={16}/><span>Sort</span><select value={sort} onChange={e => update('sort', e.target.value)}><option value="popularity">Popular</option><option value="rating">Top rated</option><option value="date">Release date</option><option value="title">A–Z</option></select></label></div>
    <div className="filter-row"><span className="filter-label">Genre</span>{GENRES.map(item => <button key={item} className={`filter-chip ${genre === item ? 'active' : ''}`} onClick={() => update('genre', genre === item ? '' : item)}>{item}</button>)}<label className="filter-input-label">Year <input type="number" min="1900" max="2100" placeholder="Any" value={params.get('year')||''} onChange={e=>update('year',e.target.value)}/></label><label className="filter-input-label">Rating <select value={params.get('minRating')||''} onChange={e=>update('minRating',e.target.value)}><option value="">Any</option><option value="3">3+</option><option value="4">4+</option><option value="4.5">4.5+</option></select></label>{genre && <button className="clear-filter" onClick={() => update('genre', '')}><X size={14}/> Clear</button>}</div>
    {params.get('search') && <div className="result-for">Results for <strong>“{params.get('search')}”</strong></div>}
    {loading ? <div className="movie-grid">{Array.from({length: 8}, (_, i) => <div key={i} className="skeleton-card"><div className="skeleton-poster"/><div className="skeleton-line"/></div>)}</div> : error ? <div className="notice notice-error">{error}</div> : movies.length ? <div className="movie-grid">{movies.map(movie => <MovieCard key={movie._id} movie={movie}/>)}</div> : <div className="empty-state"><span>✳</span><h3>No films found here.</h3><p>Try a different search or clear the active filters.</p><Link to="/discover" className="text-link">Clear search</Link></div>}
    {!loading && pages > 1 && <div className="pagination"><button disabled={page <= 1} onClick={() => { setPage(page - 1); window.scrollTo(0, 0); }}>Previous</button><span>Page {page} of {pages}</span><button disabled={page >= pages} onClick={() => { setPage(page + 1); window.scrollTo(0, 0); }}>Next</button></div>}
  </div>;
}
