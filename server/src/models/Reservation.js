import mongoose from 'mongoose';
import { OCCASIONS, RESERVATION_STATUSES, SEATING_AREAS } from '../config.js';

const reservationSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true }, // "AUR-7K4M2P"
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, default: null },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true, maxlength: 40 },
    date: { type: String, required: true }, // "YYYY-MM-DD" (restaurant local date)
    time: { type: String, required: true }, // "HH:MM"
    guests: { type: Number, required: true, min: 1 },
    area: { type: String, enum: SEATING_AREAS, required: true },
    table: { type: String, default: null }, // assigned table code, e.g. "T4"
    status: { type: String, enum: RESERVATION_STATUSES, default: 'pending' },
    occasion: { type: String, enum: OCCASIONS, default: 'None' },
    requests: { type: String, default: '', maxlength: 400 },
    dietary: { type: String, default: '', maxlength: 200 },
  },
  { timestamps: true }
);

reservationSchema.index({ date: 1, time: 1 });

// One table can never be held by two overlapping bookings is enforced in the route (and re-checked inside a
// retry loop). This partial unique index stops two requests from taking the exact same table + slot.
reservationSchema.index(
  { date: 1, time: 1, table: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ['pending', 'confirmed', 'checked_in', 'seated'] }, table: { $type: 'string' } } }
);

const iso = (d) => d.toISOString().slice(0, 10);

/** Customer-facing shape (matches what ReservationContext used to hold in state). */
reservationSchema.methods.toClient = function toClient() {
  return {
    id: String(this._id),
    reference: this.reference,
    name: this.name,
    email: this.email,
    phone: this.phone,
    date: this.date,
    time: this.time,
    guests: this.guests,
    area: this.area,
    table: this.table,
    status: this.status,
    occasion: this.occasion,
    requests: this.requests,
    dietary: this.dietary,
    createdAt: iso(this.createdAt),
  };
};

/** Staff-facing shape adds the table. */
reservationSchema.methods.toAdmin = function toAdmin() {
  return { ...this.toClient(), table: this.table };
};

export default mongoose.model('Reservation', reservationSchema);
