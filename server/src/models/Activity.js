import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema(
  {
    type: { type: String, required: true }, // signin | hire | edit | activate | deactivate | terminate | reservation
    text: { type: String, required: true, maxlength: 300 },
    staffId: { type: String, default: null }, // employeeId of the staff member this is about
  },
  { timestamps: { createdAt: 'at', updatedAt: false } }
);
activitySchema.index({ at: -1 });

activitySchema.methods.toClient = function toClient() {
  return { id: String(this._id), type: this.type, text: this.text, staffId: this.staffId, at: this.at.toISOString() };
};

export default mongoose.model('Activity', activitySchema);
