import mongoose from 'mongoose';
const schema = new mongoose.Schema({ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, movieId: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true }, viewedAt: { type: Date, default: Date.now } });
schema.index({ userId: 1, viewedAt: -1 });
schema.index({ viewedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });
export default mongoose.model('ViewingHistory', schema);
