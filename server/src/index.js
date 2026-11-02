import 'dotenv/config';
import app, { connectDatabase } from './app.js';

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error('JWT_SECRET must contain at least 32 characters.');
await connectDatabase();
const port = Number(process.env.PORT || 5000);
app.listen(port, () => console.log(`WatchWise API listening on ${port}`));
