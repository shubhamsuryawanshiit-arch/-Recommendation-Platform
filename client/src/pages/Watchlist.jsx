import { useEffect, useState } from 'react';
import { Bookmark, Check, Trash2 } from 'lucide-react';
import { api, errorMessage } from '../api';
import MovieCard from '../components/MovieCard';
export default function Watchlist() {
  const [entries, setEntries] = useState([]), [filter, setFilter] = useState('all'), [error, setError] = useState('');
  const load = () => api.get('/watchlist').then(({data}) => setEntries(data.watchlist)).catch(e => setError(errorMessage(e)));
  useEffect(() => { load(); }, []);
  const remove = async id => { await api.delete(`/watchlist/${id}`); setEntries(items => items.filter(item => item.movieId._id !== id)); };
  const markWatched = async entry => { const {data} = await api.put(`/watchlist/${entry.movieId._id}/watched`, { watched: !entry.watched }); setEntries(items => items.map(item => item._id === entry._id ? data.entry : item)); };
  const filtered = entries.filter(entry => filter === 'all' || (filter === 'watched' ? entry.watched : !entry.watched));
  return <div className="content-page"><div className="page-intro"><span className="eyebrow"><Bookmark size={14}/> Saved for later</span><h1>Your <em>watchlist.</em></h1><p>All the movies you're looking forward to, in one place.</p></div><div className="watchlist-tabs">{[['all','All'],['unwatched','To watch'],['watched','Watched']].map(([value,label])=><button className={filter===value?'active':''} key={value} onClick={()=>setFilter(value)}>{label}<span>{value==='all'?entries.length:entries.filter(x=>value==='watched'?x.watched:!x.watched).length}</span></button>)}</div>{error && <div className="notice notice-error">{error}</div>}{filtered.length ? <div className="watchlist-grid">{filtered.map(entry=><div className="watchlist-item" key={entry._id}><MovieCard movie={entry.movieId}/><div className="watch-actions"><button onClick={()=>markWatched(entry)} className={entry.watched?'watched':''}>{entry.watched?<Check size={15}/>:<Check size={15}/>} {entry.watched?'Watched':'Mark watched'}</button><button className="remove-action" onClick={()=>remove(entry.movieId._id)} aria-label="Remove from watchlist"><Trash2 size={15}/></button></div></div>)}</div>:<div className="empty-state"><span>♡</span><h3>{entries.length ? 'Nothing in this filter.' : 'Save a movie for later.'}</h3><p>When a film catches your eye, keep it here for your next movie night.</p><a className="button button-ghost" href="/discover">Find a film</a></div>}</div>;
}
