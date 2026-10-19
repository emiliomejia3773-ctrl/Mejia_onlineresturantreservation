import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    kind: { type: String, enum: ['reservation', 'staff', 'alert', 'system', 'message'], default: 'system' },
    text: { type: String, required: true, maxlength: 300 },
    read: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: 'at', updatedAt: false } }
);
notificationSchema.index({ at: -1 });

notificationSchema.methods.toClient = function toClient() {
  return { id: String(this._id), kind: this.kind, text: this.text, at: this.at.toISOString(), read: this.read };
};

export default mongoose.model('Notification', notificationSchema);
