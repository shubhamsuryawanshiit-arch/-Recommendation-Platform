import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Bookmark, Clock3, Star, Trash2 } from 'lucide-react';
import { api, errorMessage } from '../api';
import { useAuth } from '../components/AuthContext';
import MovieRail from '../components/MovieRail';
export default function Dashboard() {
  const { user } = useAuth(); const [recommendations, setRecommendations] = useState([]), [recommendationInfo, setRecommendationInfo] = useState(null), [popular, setPopular] = useState([]), [history, setHistory] = useState([]), [because, setBecause] = useState([]), [watchlist, setWatchlist] = useState([]), [error, setError] = useState('');
  useEffect(() => { Promise.allSettled([api.get('/recommendations'), api.get('/movies/top-rated?limit=8'), api.get('/history'), api.get('/watchlist')]).then(async ([rec, top, recent, saved]) => { if (rec.status === 'fulfilled') { setRecommendations(rec.value.data.movies); setRecommendationInfo(rec.value.data); } else setError(errorMessage(rec.reason)); if (top.status === 'fulfilled') setPopular(top.value.data.movies); if (recent.status === 'fulfilled') { const items=recent.value.data.history.map(x => x.movieId).filter(Boolean); setHistory(items); if(items[0]) api.get(`/recommendations/because-you-watched/${items[0]._id}`).then(({data})=>setBecause(data.movies)).catch(()=>{}); } if (saved.status === 'fulfilled') setWatchlist(saved.value.data.watchlist.map(x => x.movieId).filter(Boolean)); }); }, []);
  const clearHistory = async () => { try { await api.delete('/history'); setHistory([]); setBecause([]); } catch (e) { setError(errorMessage(e)); } };
  return <div className="content-page dashboard-page"><div className="dash-welcome"><div><span className="eyebrow">Your WatchWise</span><h1>Welcome back, <em>{user.name.split(' ')[0]}.</em></h1><p>Your next movie night is taking shape.</p></div><Link to="/profile" className="profile-shortcut">{user.name.slice(0,1)} <span>Your profile</span> <ArrowRight size={15}/></Link></div>
    <section className="recommendation-banner"><div className="recommend-mark">✳</div><div><span className="eyebrow">Made for your movie taste</span><h2>Recommended for you</h2><p>Suggestions use your ratings when enough overlap is available, then fall back to clearly labeled popular picks.</p></div><span className="model-chip">Your recommendations</span></section>
    {error && <div className="notice notice-warn">We couldn't load recommendations: {error} Please try again shortly.</div>}
    <MovieRail eyebrow={recommendationInfo?.source === 'watchwise-user-collaborative' || recommendationInfo?.source === 'movielens-collaborative' ? 'From rating patterns' : 'Cold-start picks'} title="Picked for you" movies={recommendations}/>
    {recommendationInfo?.reason && <p className="preference-note">{recommendationInfo.reason}</p>}
    {user.favoriteGenres?.length > 0 && <div className="preference-note"><span>✦</span> Guided by your favorite genres: {user.favoriteGenres.join(' · ')}</div>}
    <div className="dash-quicklinks"><Link to="/discover"><span className="quick-icon"><Star size={18}/></span><div><strong>Rate a few films</strong><small>Help us understand what you enjoy</small></div><ArrowRight size={16}/></Link><Link to="/watchlist"><span className="quick-icon pink-icon"><Bookmark size={18}/></span><div><strong>Your watchlist</strong><small>{watchlist.length} {watchlist.length === 1 ? 'film' : 'films'} saved for later</small></div><ArrowRight size={16}/></Link></div>
    {history.length > 0 && <><MovieRail eyebrow="Pick up where you left off" title="Recently viewed" movies={history.slice(0, 8)} action="/profile"/><button className="text-link history-clear" onClick={clearHistory}><Trash2 size={14}/> Clear viewing history</button></>}
    {because.length > 0 && history[0] && <MovieRail eyebrow={`Since you watched ${history[0].title}`} title="Because you watched" movies={because}/>}
    <MovieRail eyebrow="Voted highly by viewers" title="Top rated" movies={popular} action="/discover?sort=rating"/>
    {watchlist.length > 0 && <MovieRail eyebrow="Saved for another night" title="Your watchlist" movies={watchlist.slice(0, 8)} action="/watchlist"/>}
  </div>;
}
