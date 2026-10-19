// ---------- Seating & occasions ----------
export const SEATING_AREAS = [
  { id: 'indoor', name: 'Main Dining Room', description: 'Warm, candlelit and classic.' },
  { id: 'terrace', name: 'Garden Terrace', description: 'Open-air, weather permitting.' },
  { id: 'bar', name: "Chef's Counter", description: 'Watch the kitchen at work.' },
  { id: 'private', name: 'Private Dining', description: 'Parties of 6 or more.' },
];

export const OCCASIONS = ['None', 'Birthday', 'Anniversary', 'Business meeting', 'Date night', 'Celebration'];

export const MAX_GUESTS = 12;
export const MAX_ADVANCE_DAYS = 60;

// ---------- Date helpers ----------
export function toISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseISO(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(n, from = new Date()) {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  d.setDate(d.getDate() + n);
  return d;
}

export function todayISO() {
  return toISO(new Date());
}

export function formatDate(iso, opts = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) {
  return parseISO(iso).toLocaleDateString('en-US', opts);
}

export function formatTime(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
}

export function areaName(id) {
  return SEATING_AREAS.find((a) => a.id === id)?.name || id;
}

// ---------- Reservation statuses ----------
export const ACTIVE_STATUSES = ['pending', 'confirmed', 'checked_in', 'seated'];

export const STATUS_META = {
  pending: { label: 'Pending', tone: 'amber' },
  confirmed: { label: 'Confirmed', tone: 'green' },
  rejected: { label: 'Rejected', tone: 'red' },
  cancelled: { label: 'Cancelled', tone: 'red' },
  checked_in: { label: 'Checked In', tone: 'blue' },
  seated: { label: 'Seated', tone: 'blue' },
  completed: { label: 'Completed', tone: 'neutral' },
  no_show: { label: 'No-Show', tone: 'red' },
};
