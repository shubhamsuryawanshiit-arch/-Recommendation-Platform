import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownRight, ArrowRight, Sparkles } from 'lucide-react';
import { api } from '../api';
import MovieRail from '../components/MovieRail';
import { useAuth } from '../components/AuthContext';
import { localMovieImage, movieImageFallback } from '../utils/images';

const genres = ['Adventure', 'Animation', 'Comedy', 'Crime', 'Drama', 'Fantasy', 'Horror', 'Romance', 'Sci-Fi', 'Thriller'];
export default function Home() {
  const [movies, setMovies] = useState([]), [trending, setTrending] = useState([]), [topRated, setTopRated] = useState([]), { user } = useAuth();
  useEffect(() => { Promise.all([api.get('/movies/popular?limit=8&sort=popularity'),api.get('/movies/trending?limit=8&sort=popularity'),api.get('/movies/top-rated?limit=8')]).then(([popular,hot,rated])=>{setMovies(popular.data.movies);setTrending(hot.data.movies);setTopRated(rated.data.movies);}).catch(() => {}); }, []);
  return <>
    <section className="hero"><div className="hero-glow" /><div className="hero-copy"><span className="eyebrow"><Sparkles size={14} /> A little more you</span><h1>Find the film<br />that <em>finds you.</em></h1><p>Great movie nights start with a good recommendation. Explore a library shaped by real ratings and the stories you love.</p><div className="hero-actions"><Link to={user ? '/dashboard' : '/register'} className="button">{user ? 'Your recommendations' : 'Make it personal'} <ArrowRight size={17} /></Link><Link to="/discover" className="button button-ghost">Browse the collection</Link></div><div className="hero-proof"><span className="proof-stars">★★★★★</span><span>Recommendations learn from what you rate</span></div></div>
      <div className="hero-art"><div className="orbit orbit-one"/><div className="orbit orbit-two"/>{movies.slice(0, 5).map((movie, i) => <Link key={movie._id} to={`/movie/${movie._id}`} className={`floating-poster fp-${i}`}><img src={localMovieImage(movie.posterPath)} alt={`${movie.title} poster`} onError={e => {e.currentTarget.onerror=null;e.currentTarget.src=movieImageFallback('poster');}} /></Link>)}<div className="hero-note"><span className="note-icon"><Sparkles size={15}/></span><div><strong>Your next favorite</strong><small>is waiting to be found</small></div></div></div>
      <a href="#discover-more" className="scroll-cue">Scroll to explore <ArrowDownRight size={15}/></a>
    </section>
    <div id="discover-more" className="home-content"><MovieRail eyebrow="The collection" title="Popular right now" movies={movies} action="/discover" /><MovieRail eyebrow="Your movie community" title="Trending in the collection" movies={trending} action="/discover"/><MovieRail eyebrow="Loved by movie fans" title="Top rated" movies={topRated} action="/discover?sort=rating"/>
      <section className="genre-section"><div className="section-heading"><div><span className="eyebrow">Pick a mood</span><h2>Explore by genre</h2></div><p>A good place to start when you don't know what you're in the mood for.</p></div><div className="genre-chips">{genres.map((genre, index) => <Link key={genre} to={`/discover?genre=${encodeURIComponent(genre)}`} className={`genre-chip chip-${index % 5}`}><span>{genre}</span><ArrowRight size={15}/></Link>)}</div></section>
      <section className="personal-callout"><div className="callout-spark"><Sparkles size={24}/></div><div><span className="eyebrow">Your taste, in the lead</span><h2>Better picks start with your ratings.</h2><p>Rate a few movies you know. WatchWise finds patterns in real viewer ratings to surface films you might love.</p></div><Link to={user ? '/discover' : '/register'} className="button button-ghost">{user ? 'Rate a movie' : 'Create your account'} <ArrowRight size={16}/></Link></section>
    </div>
  </>;
}
