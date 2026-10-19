import mongoose from 'mongoose';
import { STAFF_POSITIONS, STAFF_ROLES } from '../config.js';

const signInSchema = new mongoose.Schema(
  {
    at: { type: Date, default: Date.now },
    device: { type: String, default: 'Unknown device', maxlength: 120 },
    result: { type: String, enum: ['success', 'failed'], required: true },
  },
  { _id: true }
);

// Employees AND the administrator account (isAdmin = true). The admin is never shown in the staff list.
const staffSchema = new mongoose.Schema(
  {
    employeeId: { type: String, unique: true, sparse: true }, // "EMP-0001"; not set for the admin
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true, maxlength: 40, default: '' },
    passwordHash: { type: String, required: function needsLogin() { return this.isAdmin || this.role === 'Manager'; }, select: false }, // only the admin and Managers have a login
    isAdmin: { type: Boolean, default: false },
    mustChangePassword: { type: Boolean, default: false }, // true for a newly hired account until the temporary password is replaced
    title: { type: String, default: '' }, // admin display title, e.g. "Owner · Administrator"
    position: { type: String, enum: STAFF_POSITIONS },
    role: { type: String, enum: STAFF_ROLES },
    hiredAt: { type: String }, // "YYYY-MM-DD"
    status: { type: String, enum: ['active', 'inactive'], default: 'active' }, // fired or deleted staff are removed from the database, not flagged
    lastLogin: { type: Date, default: null },
    signIns: { type: [signInSchema], default: [] },
  },
  { timestamps: true }
);

const MAX_SIGNINS = 30;
staffSchema.statics.MAX_SIGNINS = MAX_SIGNINS;

staffSchema.methods.toClient = function toClient() {
  return {
    id: this.employeeId,
    name: this.name,
    email: this.email,
    phone: this.phone,
    position: this.position,
    role: this.role,
    hiredAt: this.hiredAt,
    status: this.status,
    lastLogin: this.lastLogin ? this.lastLogin.toISOString() : null,
    signIns: (this.signIns || []).map((s) => ({
      id: String(s._id), at: s.at.toISOString(), device: s.device, result: s.result,
    })),
  };
};

/** Shape the frontend keeps in `session` for the signed-in admin/staff member. */
staffSchema.methods.toSession = function toSession() {
  return this.isAdmin
    ? { type: 'admin', name: this.name, email: this.email, title: this.title, mustChangePassword: false, canManageStaff: true }
    : {
        type: 'staff', staffId: this.employeeId, name: this.name, email: this.email,
        title: `${this.position} · ${this.role}`, mustChangePassword: Boolean(this.mustChangePassword), canManageStaff: this.role === 'Manager',
      };
};

export default mongoose.model('Staff', staffSchema);
