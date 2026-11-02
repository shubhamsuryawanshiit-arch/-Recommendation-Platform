import mongoose from 'mongoose';
const schema = new mongoose.Schema({ name: { type: String, required: true, trim: true, maxlength: 80 }, email: { type: String, required: true, unique: true, lowercase: true, trim: true }, password: { type: String, required: true, select: false }, role: { type: String, enum: ['user', 'admin'], default: 'user' }, favoriteGenres: { type: [String], default: [] } }, { timestamps: true });
export default mongoose.model('User', schema);
