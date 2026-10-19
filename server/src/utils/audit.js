import Activity from '../models/Activity.js';
import Notification from '../models/Notification.js';

const KEEP_ACTIVITY = 200;
const KEEP_NOTIFICATIONS = 100;

export async function logActivity(type, text, staffId = null) {
  await Activity.create({ type, text, staffId });
  // keep the collections small
  const old = await Activity.find().sort({ at: -1 }).skip(KEEP_ACTIVITY).select('_id').lean();
  if (old.length) await Activity.deleteMany({ _id: { $in: old.map((d) => d._id) } });
}

export async function notify(text, kind = 'system') {
  await Notification.create({ text, kind });
  const old = await Notification.find().sort({ at: -1 }).skip(KEEP_NOTIFICATIONS).select('_id').lean();
  if (old.length) await Notification.deleteMany({ _id: { $in: old.map((d) => d._id) } });
}
