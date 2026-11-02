import express from 'express';
import path from 'node:path';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import api from './routes/api.js';
import { notFound, errors } from './middleware/errors.js';

const app = express();
app.disable('x-powered-by');
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',').map(value => value.trim());
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(compression());
app.use(express.json({ limit: '64kb' }));
app.use(mongoSanitize());
const movieAssets = path.resolve(process.cwd(), process.env.IMAGE_UPLOAD_DIR || '../client/public/assets/movies');
app.use('/assets/movies', express.static(movieAssets, { fallthrough: true }));
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false }));
app.get(['/health', '/api/health'], (_req, res) => res.json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }));
// Vercel's catch-all function may pass either the original /api prefix or the
// path relative to api/[...route].js. The second mount supports both forms.
app.use(['/api', '/'], api);
app.use(notFound);
app.use(errors);

let connectionPromise;
export async function connectDatabase() {
  if (mongoose.connection.readyState === 1) return;
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI must be configured');
  if (!connectionPromise) {
    connectionPromise = mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 })
      .catch(error => { connectionPromise = undefined; throw error; });
  }
  await connectionPromise;
}

export default app;
