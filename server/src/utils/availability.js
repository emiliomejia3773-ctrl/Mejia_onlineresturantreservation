// Pure availability logic (no database access) so it can be unit-tested.
import {
  DINING_MINUTES, MIN_ADVANCE_MINUTES, OPENING_HOURS, SLOT_MINUTES,
} from '../config.js';
import { fromMinutes, restaurantNow, toMinutes, weekdayOf } from './time.js';

export const hoursFor = (iso) => OPENING_HOURS.find((h) => h.day === weekdayOf(iso));
export const isOpenOn = (iso) => Boolean(hoursFor(iso)?.open);

/** Every bookable slot time ("HH:MM") for a date, ignoring capacity. */
export function slotTimes(iso) {
  const h = hoursFor(iso);
  if (!h?.open) return [];
  const out = [];
  for (let t = toMinutes(h.open); t <= toMinutes(h.lastSeating); t += SLOT_MINUTES) out.push(fromMinutes(t));
  return out;
}

/** Two bookings clash if their dining windows overlap. */
const overlaps = (a, b) => Math.abs(toMinutes(a) - toMinutes(b)) < DINING_MINUTES;

/**
 * Every bookable table that fits the party and is free at `time`, smallest first.
 * tables: [{ code, area, seats, outOfService }]
 * reservations: holding reservations on the same date: [{ table, time }]
 */
export function freeTables({ tables, reservations, time, guests, area }) {
  const taken = new Set(reservations.filter((r) => r.table && overlaps(r.time, time)).map((r) => r.table));
  return tables
    .filter((t) => !t.outOfService && t.area === area && t.seats >= guests && !taken.has(t.code))
    .sort((a, b) => a.seats - b.seats || a.code.localeCompare(b.code));
}

/** Smallest bookable table that fits the party and is free at `time` (or null). */
export const findFreeTable = (args) => freeTables(args)[0] || null;

/** [{ time, label?, available, reason }] for the booking form. */
export function buildSlots({ date, guests, area, tables, reservations, now = new Date() }) {
  const n = restaurantNow(now);
  const cutoff = n.minutes + MIN_ADVANCE_MINUTES;
  return slotTimes(date).map((time) => {
    if (date === n.date && toMinutes(time) < cutoff) return { time, available: false, reason: 'Passed' };
    const table = findFreeTable({ tables, reservations, time, guests, area });
    return table ? { time, available: true, reason: '' } : { time, available: false, reason: 'Full' };
  });
}
