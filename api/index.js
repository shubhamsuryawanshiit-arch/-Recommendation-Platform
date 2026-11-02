import 'dotenv/config';
import app, { connectDatabase } from '../server/src/app.js';

export default async function handler(req, res) {
  try {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error('JWT_SECRET must contain at least 32 characters.');
    // The Vercel rewrite sends /api/<route> here as /api?__path=<route>.
    // Restore the Express URL while preserving the endpoint's own query values.
    const requestUrl = new URL(req.url || '/', 'http://watchwise.local');
    const rewrittenPath = requestUrl.searchParams.get('__path');
    if (rewrittenPath) {
      requestUrl.searchParams.delete('__path');
      req.url = `/api/${rewrittenPath}${requestUrl.search}`;
    }
    await connectDatabase();
    return app(req, res);
  } catch {
    console.error('WatchWise API could not connect to its database.');
    return res.status(503).json({ message: 'WatchWise is temporarily unavailable.' });
  }
}
