import Reservation from '../models/Reservation.js';
import Table from '../models/Table.js';
import {
  AUTO_CONFIRM_MAX_GUESTS, DINING_MINUTES, HOLDING_STATUSES, MAX_ADVANCE_DAYS, MAX_GUESTS, MIN_ADVANCE_MINUTES,
} from '../config.js';
import { freeTables, isOpenOn, slotTimes } from '../utils/availability.js';
import { HttpError } from '../utils/http.js';
import { reference } from '../utils/security.js';
import { addDaysISO, minutesUntil, restaurantNow, toMinutes } from '../utils/time.js';

export const loadTables = () => Table.find().lean();
export const loadHolding = (date, excludeId = null) =>
  Reservation.find({ date, status: { $in: HOLDING_STATUSES }, ...(excludeId ? { _id: { $ne: excludeId } } : {}) })
    .select('table time')
    .lean();

/** Throws HttpError(400) with a customer-friendly message if the request breaks a booking rule. */
export function assertBookable({ date, time, guests, area }, now = new Date()) {
  const today = restaurantNow(now).date;
  if (date < today) throw new HttpError(400, 'That date has already passed.', { field: 'date' });
  if (date > addDaysISO(today, MAX_ADVANCE_DAYS)) {
    throw new HttpError(400, `Bookings open up to ${MAX_ADVANCE_DAYS} days ahead.`, { field: 'date' });
  }
  if (!isOpenOn(date)) throw new HttpError(400, 'We are closed on that day. Please choose another date.', { field: 'date' });
  if (!slotTimes(date).includes(time)) throw new HttpError(400, 'Please select a valid time.', { field: 'time' });
  if (minutesUntil(date, time, now) < MIN_ADVANCE_MINUTES) {
    throw new HttpError(400, 'That time is too soon. Please choose a later slot.', { field: 'time' });
  }
  if (guests < 1 || guests > MAX_GUESTS) throw new HttpError(400, `Parties of 1–${MAX_GUESTS} can book online.`, { field: 'guests' });
  if (area === 'private' && guests < 6) throw new HttpError(400, 'Private Dining is for parties of 6 or more.', { field: 'area' });
}

const isDuplicateKey = (err) => err?.code === 11000;

/**
 * Creates a reservation on the table the guest picked (or the smallest free table if none was picked). Two people booking the last table at once is
 * handled by the unique index on (date, time, table): the loser gets a duplicate-key error and we look again.
 */
export async function createReservation(data, userId) {
  assertBookable(data);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const [tables, holding] = await Promise.all([loadTables(), loadHolding(data.date)]);
    const free = freeTables({ tables, reservations: holding, time: data.time, guests: data.guests, area: data.area });
    const table = data.table ? free.find((t) => t.code === data.table) : free[0];
    if (!table) {
      throw new HttpError(
        409,
        data.table
          ? 'Sorry, that table was just taken. Please choose another table or time.'
          : 'Sorry, that time was just taken. Please choose another time or seating area.',
        { field: data.table ? 'table' : 'time' }
      );
    }
    try {
      return await Reservation.create({
        ...data,
        user: userId,
        reference: reference(),
        table: table.code,
        status: data.guests <= AUTO_CONFIRM_MAX_GUESTS ? 'confirmed' : 'pending',
      });
    } catch (err) {
      if (!isDuplicateKey(err)) throw err; // duplicate reference or table race: try again
    }
  }
  throw new HttpError(503, 'We are very busy right now. Please try again in a moment.');
}

/**
 * Edits a customer's own booking: reschedule, change party size / seating, or update notes.
 * The booking keeps its table when date, time, party size and area are unchanged; otherwise a free table is found
 * (ignoring the booking's own current table). Crossing the auto-confirm party size changes pending/confirmed.
 */
export async function updateReservation(reservation, data) {
  const key = (r) => `${r.date}|${r.time}|${r.guests}|${r.area}`;
  const slotMoved = key(reservation) !== key(data);
  const tableChanged = Boolean(data.table) && data.table !== reservation.table;
  if (slotMoved) assertBookable(data);

  let table = reservation.table;
  if (slotMoved || tableChanged) {
    const [tables, holding] = await Promise.all([loadTables(), loadHolding(data.date, reservation._id)]);
    const free = freeTables({ tables, reservations: holding, time: data.time, guests: data.guests, area: data.area });
    const pick = data.table ? free.find((t) => t.code === data.table) : free[0];
    if (!pick) throw new HttpError(409, 'Sorry, that table is not available. Please choose another table or time.', { field: 'table' });
    table = pick.code;
  }

  const before = reservation.guests;
  Object.assign(reservation, data, { table });
  if (data.guests !== before) {
    reservation.status = data.guests <= AUTO_CONFIRM_MAX_GUESTS ? 'confirmed' : 'pending';
  }
  try {
    return await reservation.save();
  } catch (err) {
    if (isDuplicateKey(err)) throw new HttpError(409, 'That table was just taken. Please choose another time.', { field: 'time' });
    throw err;
  }
}

/** True while a booking still keeps its table occupied "right now" (used for the live table board). */
export const isLiveNow = (r, now = new Date()) => {
  const n = restaurantNow(now);
  if (r.date !== n.date) return false;
  const start = toMinutes(r.time);
  return n.minutes >= start && n.minutes < start + DINING_MINUTES;
};
