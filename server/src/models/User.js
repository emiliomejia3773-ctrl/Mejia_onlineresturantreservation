import mongoose from 'mongoose';

// Customers (people who book tables). Staff and the administrator live in Staff.js.
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true, maxlength: 40 },
    passwordHash: { type: String, required: true, select: false },
  },
  { timestamps: true }
);

const memberSince = (d) => d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

userSchema.methods.toClient = function toClient() {
  return {
    id: String(this._id),
    name: this.name,
    email: this.email,
    phone: this.phone,
    memberSince: memberSince(this.createdAt),
  };
};

export default mongoose.model('User', userSchema);
