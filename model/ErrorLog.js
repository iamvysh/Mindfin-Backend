
import mongoose from 'mongoose';

const errorLogSchema = new mongoose.Schema({
  message: String,
  stack: String,
  statusCode: Number,
  method: String,
  url: String,
  ip: String,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  payload: mongoose.Schema.Types.Mixed,
  timestamp: {
    type: Date,
    default: Date.now,
    expires: '30d'
  }
});

export default mongoose.model('ErrorLog', errorLogSchema);
