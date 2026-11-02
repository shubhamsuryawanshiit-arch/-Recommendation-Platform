import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './components/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Discover from './pages/Discover';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import MovieDetails from './pages/MovieDetails';
import Watchlist from './pages/Watchlist';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
function NotFound(){return <div className="content-page empty-state"><span>404</span><h3>That page wandered off.</h3><p>Head back to discover something good.</p><a className="button" href="/discover">Explore movies</a></div>}
export default function App(){return <AuthProvider><Layout><Routes><Route path="/" element={<Home/>}/><Route path="/discover" element={<Discover/>}/><Route path="/movie/:id" element={<MovieDetails/>}/><Route path="/login" element={<Auth mode="login"/>}/><Route path="/register" element={<Auth mode="register"/>}/><Route element={<ProtectedRoute/>}><Route path="/dashboard" element={<Dashboard/>}/><Route path="/watchlist" element={<Watchlist/>}/><Route path="/profile" element={<Profile/>}/></Route><Route element={<ProtectedRoute admin/>}><Route path="/admin" element={<Admin/>}/></Route><Route path="/home" element={<Navigate to="/" replace/>}/><Route path="*" element={<NotFound/>}/></Routes></Layout></AuthProvider>}
