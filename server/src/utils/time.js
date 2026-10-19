import { config } from '../config.js';

const pad = (n) => String(n).padStart(2, '0');

/** Current date ("YYYY-MM-DD") and minutes-since-midnight in the restaurant's time zone. */
export function restaurantNow(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: config.timeZone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(now);
  const get = (t) => Number(parts.find((p) => p.type === t).value);
  const y = get('year'), m = get('month'), d = get('day');
  return { date: `${y}-${pad(m)}-${pad(d)}`, minutes: get('hour') * 60 + get('minute') };
}

export const isValidISODate = (iso) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
};

/** Day of week (0 = Sunday) of a calendar date, independent of any time zone. */
export const weekdayOf = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
};

export const addDaysISO = (iso, n) => {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
};

export const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};
export const fromMinutes = (t) => `${pad(Math.floor(t / 60))}:${pad(t % 60)}`;

/** Whole minutes from "now" (restaurant time) until the given date + time. Negative if in the past. */
export function minutesUntil(iso, hhmm, now = new Date()) {
  const n = restaurantNow(now);
  const days = (Date.UTC(...iso.split('-').map((v, i) => (i === 1 ? Number(v) - 1 : Number(v)))) -
    Date.UTC(...n.date.split('-').map((v, i) => (i === 1 ? Number(v) - 1 : Number(v))))) / 86400000;
  return days * 1440 + toMinutes(hhmm) - n.minutes;
}
