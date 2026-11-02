import jwt from 'jsonwebtoken';
import User from '../models/User.js';
export async function requireAuth(req, res, next) {
  try {
    const cookie = req.headers.cookie?.split(';').map(value => value.trim()).find(value => value.startsWith('watchwise_session='));
    const token = cookie ? decodeURIComponent(cookie.slice('watchwise_session='.length)) : req.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (!token) return res.status(401).json({ message: 'Please sign in to continue.' });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).select('-password');
    if (!user) return res.status(401).json({ message: 'Your session is no longer valid.' });
    req.user = user; next();
  } catch { res.status(401).json({ message: 'Invalid or expired session.' }); }
}
export function requireAdmin(req, res, next) { if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Administrator access required.' }); next(); }
