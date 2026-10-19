import mongoose from 'mongoose';
import { SEATING_AREAS } from '../config.js';

const tableSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true }, // "T4"
  area: { type: String, enum: SEATING_AREAS, required: true },
  seats: { type: Number, required: true, min: 1 },
  outOfService: { type: Boolean, default: false },
});

export default mongoose.model('Table', tableSchema);
