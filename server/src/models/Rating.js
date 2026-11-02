import mongoose from 'mongoose';
const schema = new mongoose.Schema({ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, movieId: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true }, rating: { type: Number, required: true, min: 0.5, max: 5 } }, { timestamps: true });
schema.index({ userId: 1, movieId: 1 }, { unique: true });
export default mongoose.model('Rating', schema);
