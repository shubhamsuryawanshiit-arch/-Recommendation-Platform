import 'dotenv/config';
import mongoose from 'mongoose';
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'csv-parse/sync';
import Movie from '../src/models/Movie.js';
import Rating from '../src/models/Rating.js';

const root = path.resolve(process.cwd(), '../ml-service/dataset/ml-latest-small');
const csv = name => parse(fs.readFileSync(path.join(root, name), 'utf8'), { columns: true, skip_empty_lines: true, bom: true });
await mongoose.connect(process.env.MONGODB_URI);
try {
  const ratingStats = new Map();
  for (const row of csv('ratings.csv')) {
    const id = Number(row.movieId), current = ratingStats.get(id) || { total: 0, count: 0 };
    current.total += Number(row.rating); current.count += 1; ratingStats.set(id, current);
  }
  const mappingFile = path.resolve(process.env.IMAGE_MAPPING_FILE || 'data/movieImageMapping.json');
  const existing = JSON.parse(fs.readFileSync(mappingFile, 'utf8'));
  const byMovie = new Map(existing.map(entry => [Number(entry.movieLensId), entry]));
  const operations = [];
  for (const row of csv('movies.csv')) {
    const id = Number(row.movieId), stats = ratingStats.get(id) || { total: 0, count: 0 };
    const match = row.title.match(/\((\d{4})\)\s*$/);
    const images = byMovie.get(id) || {};
    operations.push({ updateOne: { filter: { movieLensId: id }, update: { $set: { movieLensId: id, title: row.title, genres: row.genres.split('|').filter(g => g && g !== '(no genres listed)'), releaseYear: match ? Number(match[1]) : undefined, averageRating: stats.count ? stats.total / stats.count : 0, ratingCount: stats.count, datasetAverageRating: stats.count ? stats.total / stats.count : 0, datasetRatingCount: stats.count, popularity: stats.count, posterPath: images.posterPath || '', backdropPath: images.backdropPath || '' } }, upsert: true } });
  }
  if (operations.length) await Movie.bulkWrite(operations, { ordered: false });
  const appStats = await Rating.aggregate([{ $group: { _id: '$movieId', total: { $sum: '$rating' }, count: { $sum: 1 } } }, { $lookup: { from: 'movies', localField: '_id', foreignField: '_id', as: 'movie' } }, { $unwind: '$movie' }, { $project: { movieLensId: '$movie.movieLensId', total: 1, count: 1 } }]);
  for (const row of appStats) {
    const dataset = ratingStats.get(row.movieLensId) || { total: 0, count: 0 }, totalCount = dataset.count + row.count;
    await Movie.updateOne({ movieLensId: row.movieLensId }, { averageRating: totalCount ? (dataset.total + row.total) / totalCount : 0, ratingCount: totalCount });
  }
  console.log(`Imported ${operations.length} MovieLens movie records.`);
} finally { await mongoose.disconnect(); }
