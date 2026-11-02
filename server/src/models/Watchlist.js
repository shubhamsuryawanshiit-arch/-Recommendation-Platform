import mongoose from 'mongoose';
const schema = new mongoose.Schema({ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, movieId: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true }, watched: { type: Boolean, default: false }, addedAt: { type: Date, default: Date.now } });
schema.index({ userId: 1, movieId: 1 }, { unique: true });
export default mongoose.model('Watchlist', schema);
