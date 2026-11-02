import { Router } from 'express';
import path from 'node:path';
import fs from 'node:fs/promises';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Movie from '../models/Movie.js';
import Rating from '../models/Rating.js';
import Watchlist from '../models/Watchlist.js';
import ViewingHistory from '../models/ViewingHistory.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { syncRating, deleteSyncedRating, getRecommendations, getSimilar } from '../utils/mlClient.js';
import { recommendLocally, similarLocally } from '../utils/localRecommendations.js';

const router = Router();
const asyncRoute = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const publicUser = user => ({ id: user.id, name: user.name, email: user.email, role: user.role, favoriteGenres: user.favoriteGenres, createdAt: user.createdAt });
const tokenFor = user => jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
const sessionCookie = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 7 * 24 * 60 * 60 * 1000 };
const idSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid record id');
const validId = value => idSchema.safeParse(value).success;
async function refreshMovieRatingSummary(movie) {
  const [stats] = await Rating.aggregate([{ $match: { movieId: movie._id } }, { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } }]);
  const appCount = stats?.count || 0, datasetCount = movie.datasetRatingCount || 0;
  movie.ratingCount = appCount + datasetCount;
  movie.averageRating = movie.ratingCount ? (((stats?.average || 0) * appCount) + ((movie.datasetAverageRating || 0) * datasetCount)) / movie.ratingCount : 0;
  await movie.save();
}

router.post('/auth/register', asyncRoute(async (req, res) => {
  const body = z.object({ name: z.string().trim().min(2).max(80), email: z.string().email().max(200), password: z.string().min(8).max(100), favoriteGenres: z.array(z.string().max(30)).max(10).optional() }).parse(req.body);
  const email = body.email.toLowerCase();
  if (await User.exists({ email })) return res.status(409).json({ message: 'Unable to create an account with those details.' });
  const user = await User.create({ name: body.name, email, password: await bcrypt.hash(body.password, 12), favoriteGenres: body.favoriteGenres || [], role: 'user' });
  res.cookie('watchwise_session', tokenFor(user), sessionCookie);
  res.status(201).json({ user: publicUser(user) });
}));
router.post('/auth/login', asyncRoute(async (req, res) => {
  const body = z.object({ email: z.string().email(), password: z.string().min(1) }).parse(req.body);
  const user = await User.findOne({ email: body.email.toLowerCase() }).select('+password');
  if (!user || !(await bcrypt.compare(body.password, user.password))) return res.status(401).json({ message: 'Email or password is incorrect.' });
  res.cookie('watchwise_session', tokenFor(user), sessionCookie);
  res.json({ user: publicUser(user) });
}));
router.post('/auth/logout', (_req, res) => res.clearCookie('watchwise_session', sessionCookie).json({ message: 'Signed out.' }));
router.get('/auth/me', requireAuth, (req, res) => res.json({ user: publicUser(req.user) }));

const movieQuery = async (req, res, fixed = {}) => {
  const pageValue = Number(req.query.page), limitValue = Number(req.query.limit);
  const page = Number.isFinite(pageValue) ? Math.min(10000, Math.max(1, Math.floor(pageValue))) : 1;
  const limit = Number.isFinite(limitValue) ? Math.min(40, Math.max(1, Math.floor(limitValue))) : 20;
  const filter = { ...fixed };
  if (req.query.search) filter.title = { $regex: String(req.query.search).slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
  if (req.query.genre) filter.genres = String(req.query.genre);
  if (req.query.year) filter.releaseYear = Number(req.query.year);
  if (req.query.minRating) filter.averageRating = { $gte: Number(req.query.minRating) };
  const sortMap = { popularity: { popularity: -1, averageRating: -1 }, rating: { averageRating: -1, ratingCount: -1 }, date: { releaseYear: -1, title: 1 }, title: { title: 1 } };
  const [movies, total] = await Promise.all([Movie.find(filter).sort(sortMap[req.query.sort] || sortMap.popularity).skip((page - 1) * limit).limit(limit).lean(), Movie.countDocuments(filter)]);
  res.json({ movies, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
};
router.get('/movies', asyncRoute((req, res) => movieQuery(req, res)));
router.get('/movies/search', asyncRoute((req, res) => movieQuery(req, res)));
router.get('/movies/trending', asyncRoute(async (req, res) => {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), limit = Math.min(40, Math.max(1, Number(req.query.limit) || 20));
  const [ratings, views] = await Promise.all([Rating.aggregate([{ $match: { createdAt: { $gte: since } } }, { $group: { _id: '$movieId', activity: { $sum: 1 } } }]), ViewingHistory.aggregate([{ $match: { viewedAt: { $gte: since } } }, { $group: { _id: '$movieId', activity: { $sum: 1 } } }])]);
  const counts = new Map();
  for (const row of [...ratings, ...views]) counts.set(String(row._id), (counts.get(String(row._id)) || 0) + row.activity);
  const ids = [...counts].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([id]) => new mongoose.Types.ObjectId(id));
  const docs = await Movie.find({ _id: { $in: ids } }).lean(), byId = new Map(docs.map(doc => [String(doc._id), doc]));
  res.json({ movies: ids.map(id => byId.get(String(id))).filter(Boolean), pagination: { page: 1, limit, total: ids.length, pages: ids.length ? 1 : 0 } });
}));
router.get('/movies/popular', asyncRoute((req, res) => movieQuery(req, res, {})));
router.get('/movies/top-rated', asyncRoute((req, res) => movieQuery(req, res, { ratingCount: { $gte: 20 } })));
router.get('/movies/:id', asyncRoute(async (req, res) => {
  const movie = await Movie.findOne(validId(req.params.id) ? { _id: req.params.id } : { movieLensId: Number(req.params.id) }).lean();
  if (!movie) return res.status(404).json({ message: 'Movie not found.' });
  res.json({ movie });
}));

router.post('/ratings', requireAuth, asyncRoute(async (req, res) => {
  const body = z.object({ movieId: idSchema, rating: z.number().min(0.5).max(5).refine(value => Number.isInteger(value * 2), 'Rating must use half-star increments.') }).parse(req.body);
  const movie = await Movie.findById(body.movieId); if (!movie) return res.status(404).json({ message: 'Movie not found.' });
  const rating = await Rating.findOneAndUpdate({ userId: req.user.id, movieId: movie.id }, { rating: body.rating }, { upsert: true, new: true, runValidators: true });
  await refreshMovieRatingSummary(movie);
  syncRating(req.user.id, movie.movieLensId, body.rating).catch(error => console.warn('ML rating sync unavailable:', error.message));
  res.status(201).json({ rating });
}));
router.get('/ratings/user', requireAuth, asyncRoute(async (req, res) => res.json({ ratings: await Rating.find({ userId: req.user.id }).populate('movieId').sort({ updatedAt: -1 }).limit(500).lean() })));
router.put('/ratings/:movieId', requireAuth, asyncRoute(async (req, res) => {
  const body = z.object({ rating: z.number().min(0.5).max(5).refine(value => Number.isInteger(value * 2), 'Rating must use half-star increments.') }).parse(req.body);
  const movie = await Movie.findById(req.params.movieId); if (!movie) return res.status(404).json({ message: 'Movie not found.' });
  const rating = await Rating.findOneAndUpdate({ userId: req.user.id, movieId: movie.id }, { rating: body.rating }, { new: true, runValidators: true });
  if (!rating) return res.status(404).json({ message: 'Rating not found.' });
  await refreshMovieRatingSummary(movie);
  syncRating(req.user.id, movie.movieLensId, body.rating).catch(() => {}); res.json({ rating });
}));
router.delete('/ratings/:movieId', requireAuth, asyncRoute(async (req, res) => {
  const rating = await Rating.findOneAndDelete({ userId: req.user.id, movieId: req.params.movieId });
  if (!rating) return res.status(404).json({ message: 'Rating not found.' });
  const movie = await Movie.findById(req.params.movieId);
  if (movie) await refreshMovieRatingSummary(movie);
  deleteSyncedRating(req.user.id, movie?.movieLensId).catch(() => {}); res.json({ removed: true });
}));

router.post('/watchlist', requireAuth, asyncRoute(async (req, res) => {
  const body = z.object({ movieId: z.string() }).parse(req.body);
  if (!await Movie.exists({ _id: body.movieId })) return res.status(404).json({ message: 'Movie not found.' });
  const entry = await Watchlist.findOneAndUpdate({ userId: req.user.id, movieId: body.movieId }, { $setOnInsert: { userId: req.user.id, movieId: body.movieId } }, { upsert: true, new: true }).populate('movieId');
  res.status(201).json({ entry });
}));
router.get('/watchlist', requireAuth, asyncRoute(async (req, res) => res.json({ watchlist: await Watchlist.find({ userId: req.user.id }).populate('movieId').sort({ addedAt: -1 }).limit(500).lean() })));
router.delete('/watchlist/:movieId', requireAuth, asyncRoute(async (req, res) => { await Watchlist.deleteOne({ userId: req.user.id, movieId: req.params.movieId }); res.json({ removed: true }); }));
router.put('/watchlist/:movieId/watched', requireAuth, asyncRoute(async (req, res) => {
  const { watched } = z.object({ watched: z.boolean() }).parse(req.body);
  const entry = await Watchlist.findOneAndUpdate({ userId: req.user.id, movieId: req.params.movieId }, { watched }, { new: true }).populate('movieId');
  if (!entry) return res.status(404).json({ message: 'Add this movie to your watchlist first.' });
  if (entry.watched) await ViewingHistory.create({ userId: req.user.id, movieId: entry.movieId });
  res.json({ entry });
}));
router.post('/history', requireAuth, asyncRoute(async (req, res) => {
  const body = z.object({ movieId: z.string() }).parse(req.body);
  if (!await Movie.exists({ _id: body.movieId })) return res.status(404).json({ message: 'Movie not found.' });
  await ViewingHistory.create({ userId: req.user.id, movieId: body.movieId }); res.status(201).json({ saved: true });
}));
router.get('/history', requireAuth, asyncRoute(async (req, res) => res.json({ history: await ViewingHistory.find({ userId: req.user.id }).populate('movieId').sort({ viewedAt: -1 }).limit(30).lean() })));
router.delete('/history', requireAuth, asyncRoute(async (req, res) => {
  const result = await ViewingHistory.deleteMany({ userId: req.user.id });
  res.json({ removed: result.deletedCount });
}));

router.get('/recommendations', requireAuth, asyncRoute(async (req, res) => {
  let movies, source, modelVersion, reason;
  try {
    if (process.env.VERCEL) throw new Error('Using the serverless recommendation path.');
    const candidates = await getRecommendations(req.user.id);
    if (!candidates.length) throw new Error('The recommender returned no candidates.');
    const ids = candidates.map(item => item.movieId);
    const lookup = await Movie.find({ movieLensId: { $in: ids } }).lean();
    const byId = new Map(lookup.map(movie => [movie.movieLensId, movie]));
    movies = ids.map(id => byId.get(id)).filter(Boolean);
    source = candidates[0]?.strategy === 'popular' ? 'movielens-popular-cold-start' : 'movielens-collaborative';
    modelVersion = 'watchwise-cf-1.0';
  } catch {
    ({ movies, source, modelVersion, reason } = await recommendLocally(req.user.id, req.user.favoriteGenres));
  }
  const rated = await Rating.find({ userId: req.user.id }).select('movieId').lean();
  const watched = await Watchlist.find({ userId: req.user.id, watched: true }).select('movieId').lean();
  const excluded = new Set([...rated, ...watched].map(item => String(item.movieId)));
  movies = movies.filter(movie => !excluded.has(String(movie._id)));
  res.json({ movies: movies.slice(0, 10), source, modelVersion, reason });
}));
router.get('/recommendations/similar/:movieId', asyncRoute(async (req, res) => {
  const movie = await Movie.findById(req.params.movieId).lean(); if (!movie) return res.status(404).json({ message: 'Movie not found.' });
  let candidates, source;
  try { if (process.env.VERCEL) throw new Error('Using the serverless similarity path.'); candidates = await getSimilar(movie.movieLensId); source = 'movielens-item-collaborative'; }
  catch { const fallback = await similarLocally(movie); candidates = fallback.movies.map(item => ({ _id: item._id, movieId: item.movieLensId })); source = fallback.source; }
  const ids = candidates.map(item => item.movieId);
  const lookup = source === 'genre-similarity' ? await Movie.find({ _id: { $in: candidates.map(item => item._id) } }).lean() : await Movie.find({ movieLensId: { $in: ids } }).lean();
  const byId = new Map(lookup.map(item => [source === 'genre-similarity' ? String(item._id) : item.movieLensId, item]));
  res.json({ movies: candidates.map(item => byId.get(source === 'genre-similarity' ? String(item._id) : item.movieId)).filter(Boolean), source });
}));
router.get('/recommendations/because-you-watched/:movieId', requireAuth, asyncRoute(async (req, res) => {
  const movie = await Movie.findById(req.params.movieId).lean(); if (!movie) return res.status(404).json({ message: 'Movie not found.' });
  try {
    if (process.env.VERCEL) throw new Error('Using the serverless similarity path.');
    const candidates = await getSimilar(movie.movieLensId), ids = candidates.map(item => item.movieId);
    const lookup = await Movie.find({ movieLensId: { $in: ids }, _id: { $ne: movie._id } }).lean();
    const byId = new Map(lookup.map(item => [item.movieLensId, item]));
    return res.json({ movies: ids.map(id => byId.get(id)).filter(Boolean), source: 'movielens-item-collaborative', basedOnMovieId: movie.id });
  } catch {
    const fallback = await similarLocally(movie);
    return res.json({ ...fallback, basedOnMovieId: movie.id });
  }
}));

router.get('/users/profile', requireAuth, asyncRoute(async (req, res) => {
  const [rated, watched, watchlist, history] = await Promise.all([Rating.countDocuments({ userId: req.user.id }), Watchlist.countDocuments({ userId: req.user.id, watched: true }), Watchlist.countDocuments({ userId: req.user.id }), Rating.find({ userId: req.user.id }).populate('movieId').sort({ updatedAt: -1 }).limit(500).lean()]);
  res.json({ user: publicUser(req.user), stats: { rated, watched, watchlist }, ratings: history });
}));
router.put('/users/profile', requireAuth, asyncRoute(async (req, res) => {
  const body = z.object({ name: z.string().trim().min(2).max(80).optional(), favoriteGenres: z.array(z.string().max(30)).max(10).optional() }).parse(req.body);
  Object.assign(req.user, body); await req.user.save(); res.json({ user: publicUser(req.user) });
}));

router.get('/admin/dashboard', requireAuth, requireAdmin, asyncRoute(async (_req, res) => {
  const [users, movies, ratings, watchlists, popular] = await Promise.all([User.countDocuments(), Movie.countDocuments(), Rating.countDocuments(), Watchlist.countDocuments(), Movie.find().sort({ popularity: -1 }).limit(5).lean()]);
  res.json({ users, movies, ratings, watchlists, popular });
}));
router.get('/admin/users', requireAuth, requireAdmin, asyncRoute(async (_req, res) => res.json({ users: await User.find().select('-password').sort({ createdAt: -1 }).limit(200).lean() })));
router.get('/admin/statistics', requireAuth, requireAdmin, asyncRoute(async (_req, res) => {
  const [mostRated, genreCounts] = await Promise.all([Rating.aggregate([{ $group: { _id: '$movieId', count: { $sum: 1 }, average: { $avg: '$rating' } } }, { $sort: { count: -1 } }, { $limit: 10 }, { $lookup: { from: 'movies', localField: '_id', foreignField: '_id', as: 'movie' } }, { $unwind: '$movie' }]), Movie.aggregate([{ $unwind: '$genres' }, { $group: { _id: '$genres', count: { $sum: 1 } } }, { $sort: { count: -1 } }])]);
  res.json({ mostRated, genreCounts });
}));
const uploadRoot = path.resolve(process.cwd(), process.env.IMAGE_UPLOAD_DIR || '../client/public/assets/movies');
const storage = multer.diskStorage({ destination: (req, file, cb) => { const destination = path.join(uploadRoot, file.fieldname === 'backdrop' ? 'backdrops' : 'posters'); fs.mkdir(destination, { recursive: true }).then(() => cb(null, destination), cb); }, filename: (req, file, cb) => { const extension = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/avif': '.avif' }[file.mimetype]; cb(null, `${req.params.id}${extension || ''}`); } });
const upload = multer({ storage, limits: { fileSize: 8 * 1024 * 1024 }, fileFilter: (_req, file, cb) => cb(null, ['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.mimetype)) });
const saveImageMapping = async movie => {
  const filename = path.resolve(process.env.IMAGE_MAPPING_FILE || 'data/movieImageMapping.json');
  await fs.mkdir(path.dirname(filename), { recursive: true });
  const entries = JSON.parse(await fs.readFile(filename, 'utf8'));
  const row = entries.find(entry => Number(entry.movieLensId) === movie.movieLensId) || { movieLensId: movie.movieLensId };
  row.posterPath = movie.posterPath; row.backdropPath = movie.backdropPath;
  const next = entries.filter(entry => Number(entry.movieLensId) !== movie.movieLensId); next.push(row);
  await fs.writeFile(filename, JSON.stringify(next, null, 2));
};
for (const type of ['poster', 'backdrop']) router.post(`/admin/movies/:id/${type}`, requireAuth, requireAdmin, (req, res, next) => {
  if (process.env.VERCEL) return res.status(501).json({ message: 'Image uploads need configured persistent storage. Add licensed images through a persistent storage provider before enabling uploads.' });
  upload.single(type)(req, res, error => error ? next(error) : next());
}, asyncRoute(async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Choose a JPG, PNG, WebP, or AVIF image under 8 MB.' });
  const bytes = await fs.readFile(req.file.path);
  const signatureValid = req.file.mimetype === 'image/jpeg' ? bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])) : req.file.mimetype === 'image/png' ? bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) : req.file.mimetype === 'image/webp' ? bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP' : bytes.subarray(4, 8).toString() === 'ftyp' && ['avif', 'avis'].includes(bytes.subarray(8, 12).toString());
  if (!signatureValid) { await fs.unlink(req.file.path); return res.status(400).json({ message: 'The uploaded file content does not match an allowed image format.' }); }
  const movie = await Movie.findById(req.params.id); if (!movie) { await fs.unlink(req.file.path); return res.status(404).json({ message: 'Movie not found.' }); }
  movie[type === 'poster' ? 'posterPath' : 'backdropPath'] = `/assets/movies/${type === 'poster' ? 'posters' : 'backdrops'}/${req.file.filename}`;
  await movie.save(); await saveImageMapping(movie); res.json({ movie });
}));
router.delete('/admin/movies/:id/:type', requireAuth, requireAdmin, asyncRoute(async (req, res) => {
  if (process.env.VERCEL) return res.status(501).json({ message: 'Image metadata changes require configured persistent storage.' });
  if (!['poster', 'backdrop'].includes(req.params.type)) return res.status(400).json({ message: 'Image type must be poster or backdrop.' });
  const movie = await Movie.findById(req.params.id); if (!movie) return res.status(404).json({ message: 'Movie not found.' });
  const property = req.params.type === 'poster' ? 'posterPath' : 'backdropPath', current = movie[property];
  if (current?.startsWith('/assets/movies/')) {
    const target = path.resolve(uploadRoot, current.slice('/assets/movies/'.length));
    const relative = path.relative(uploadRoot, target);
    if (relative && !relative.startsWith('..') && !path.isAbsolute(relative)) await fs.unlink(target).catch(() => {});
  }
  movie[property] = ''; await movie.save(); await saveImageMapping(movie); res.json({ movie });
}));

export default router;
