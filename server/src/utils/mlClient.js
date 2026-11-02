import axios from 'axios';
const client = axios.create({ baseURL: process.env.ML_SERVICE_URL || 'http://localhost:8000', timeout: 12000, headers: { 'x-service-token': process.env.ML_SERVICE_TOKEN } });
export async function syncRating(userId, movieLensId, rating, timestamp = Math.floor(Date.now() / 1000)) {
  if (!movieLensId) return;
  await client.post('/recommendations/ratings', { userId: String(userId), movieId: movieLensId, rating, timestamp });
}
export async function deleteSyncedRating(userId, movieLensId) {
  if (!movieLensId) return;
  await client.delete(`/recommendations/ratings/${encodeURIComponent(userId)}/${movieLensId}`);
}
export async function getRecommendations(userId, strategy = 'item') {
  const { data } = await client.get(`/recommendations/user/${encodeURIComponent(userId)}`, { params: { strategy, limit: 50 } });
  return data.recommendations || [];
}
export async function getSimilar(movieLensId) {
  const { data } = await client.get(`/recommendations/movie/${movieLensId}`, { params: { limit: 8 } });
  return data.recommendations || [];
}
