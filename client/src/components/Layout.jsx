import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Clapperboard, Compass, Menu, Search, UserRound, X } from 'lucide-react';
import { useAuth } from './AuthContext';
export default function Layout({ children }) {
  const { user, signOut } = useAuth(), [open, setOpen] = useState(false), navigate = useNavigate();
  const links = user ? [['Discover', '/discover'], ['My space', '/dashboard'], ['Watchlist', '/watchlist']] : [['Discover', '/discover']];
  return <div className="app-shell"><header className="topbar"><div className="nav-inner"><Link to="/" className="brand"><span className="brand-mark"><Clapperboard size={19} /></span><span>watch<span className="brand-accent">wise</span></span></Link>
    <nav className={`main-nav ${open ? 'nav-open' : ''}`}>{links.map(([label, url]) => <NavLink key={url} to={url} onClick={() => setOpen(false)}>{label}</NavLink>)}{user?.role === 'admin' && <NavLink to="/admin" onClick={() => setOpen(false)}>Admin</NavLink>}</nav>
    <div className="nav-actions"><button aria-label="Search movies" className="nav-search" onClick={() => navigate('/discover')}><Search size={17} /><span>Search</span><kbd>/</kbd></button>{user ? <><Link className="avatar-link" to="/profile" aria-label="Profile"><span>{user.name?.slice(0, 1).toUpperCase()}</span></Link><button className="mobile-menu" onClick={() => setOpen(!open)} aria-label="Toggle navigation">{open ? <X /> : <Menu />}</button></> : <><Link to="/login" className="login-link">Log in</Link><Link to="/register" className="button button-small">Join free</Link></>}</div>
  </div></header><main>{children}</main><footer className="site-footer"><div className="footer-inner"><Link to="/" className="brand"><span className="brand-mark"><Clapperboard size={17} /></span><span>watch<span className="brand-accent">wise</span></span></Link><p>Your next favorite is closer than you think.</p><div className="footer-links"><Link to="/discover">Discover</Link>{user ? <button onClick={signOut}>Sign out</button> : <Link to="/login">Sign in</Link>}<span>© {new Date().getFullYear()} WatchWise</span></div></div></footer></div>;
}
