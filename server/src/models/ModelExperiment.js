import mongoose from 'mongoose';
const schema = new mongoose.Schema({ modelName: { type: String, required: true }, modelVersion: { type: String, required: true }, parameters: mongoose.Schema.Types.Mixed, metrics: mongoose.Schema.Types.Mixed, trainingDate: Date, evaluationDate: Date }, { timestamps: true });
export default mongoose.model('ModelExperiment', schema);
