import { Router } from 'express';
import { z } from 'zod';
import Activity from '../models/Activity.js';
import Notification from '../models/Notification.js';
import Reservation from '../models/Reservation.js';
import Staff from '../models/Staff.js';
import Table from '../models/Table.js';
import User from '../models/User.js';
import {
  HOLDING_STATUSES, RESERVATION_STATUSES, SEATING_AREAS, STAFF_POSITIONS, STAFF_ROLES,
} from '../config.js';
import { authenticate, canManageStaff, requireAdmin, requireStaff, requireStaffManager } from '../middleware/auth.js';
import { HttpError, asyncHandler, validate } from '../utils/http.js';
import { findFreeTable } from '../utils/availability.js';
import { hashPassword, tempPassword } from '../utils/security.js';
import { addDaysISO, isValidISODate, restaurantNow } from '../utils/time.js';
import { logActivity, notify } from '../utils/audit.js';
import { isLiveNow, loadHolding, loadTables } from '../services/reservations.js';
import { emailInUse } from './auth.js';

const router = Router();
router.use(authenticate, requireStaff);

// ------------------------------------------------------------------ helpers
/** Live board: a table is "reserved"/"occupied" only while a booking's dining window is running right now. */
async function tablesBoard() {
  const today = restaurantNow().date;
  const [tables, todays] = await Promise.all([
    loadTables(),
    Reservation.find({ date: today, status: { $in: HOLDING_STATUSES } }).select('table time date status').lean(),
  ]);
  return tables
    .sort((a, b) => a.area.localeCompare(b.area) || a.code.localeCompare(b.code, undefined, { numeric: true }))
    .map((t) => {
      let status = 'available';
      if (t.outOfService) status = 'unavailable';
      else {
        const live = todays.filter((r) => r.table === t.code && isLiveNow(r));
        if (live.some((r) => ['checked_in', 'seated'].includes(r.status))) status = 'occupied';
        else if (live.length) status = 'reserved';
      }
      return { id: t.code, area: t.area, seats: t.seats, status };
    });
}

// Staff accounts see a trimmed list (no contact details or sign-in history).
const redactStaff = (s) => ({
  id: s.id, name: s.name, role: s.role, position: s.position, status: s.status, hiredAt: s.hiredAt,
});

// ------------------------------------------------------------------ dashboard data (one round trip)
router.get(
  '/bootstrap',
  asyncHandler(async (req, res) => {
    const canManage = canManageStaff(req.auth.account);
    const from = addDaysISO(restaurantNow().date, -120);
    const [reservations, activity, notifications, staffDocs, tables, customerCount] = await Promise.all([
      Reservation.find({ date: { $gte: from } }).sort({ date: 1, time: 1 }).limit(3000),
      Activity.find().sort({ at: -1 }).limit(40),
      Notification.find().sort({ at: -1 }).limit(30),
      Staff.find({ isAdmin: false }).sort({ createdAt: -1 }),
      tablesBoard(),
      User.countDocuments(),
    ]);
    const staff = staffDocs.map((s) => s.toClient());
    res.json({
      reservations: reservations.map((r) => r.toAdmin()),
      activity: activity.map((a) => a.toClient()),
      notifications: notifications.map((n) => n.toClient()),
      tables,
      customerCount,
      staff: canManage ? staff : staff.map(redactStaff).map((s) => ({ ...s, signIns: [], email: '', phone: '', lastLogin: null })),
    });
  })
);

// ------------------------------------------------------------------ reservations
router.patch(
  '/reservations/:id/status',
  validate(z.object({ status: z.enum(RESERVATION_STATUSES) })),
  asyncHandler(async (req, res) => {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) throw new HttpError(404, 'Reservation not found.');
    const next = req.body.status;
    const wasHolding = HOLDING_STATUSES.includes(reservation.status);
    const willHold = HOLDING_STATUSES.includes(next);

    // Re-activating a cancelled/rejected booking must find it a table again.
    if (!wasHolding && willHold) {
      const [tables, holding] = await Promise.all([loadTables(), loadHolding(reservation.date, reservation._id)]);
      const table = findFreeTable({
        tables, reservations: holding, time: reservation.time, guests: reservation.guests, area: reservation.area,
      });
      if (!table) throw new HttpError(409, 'No table is free for that time any more, so this booking cannot be re-activated.');
      reservation.table = table.code;
    }
    reservation.status = next;
    try {
      await reservation.save();
    } catch (err) {
      if (err?.code === 11000) throw new HttpError(409, 'That table was just taken by another booking.');
      throw err;
    }
    await logActivity('reservation', `${req.auth.account.name} set ${reservation.reference} to ${next.replace('_', ' ')}`);
    res.json({ reservation: reservation.toAdmin() });
  })
);

// Admin only: permanently removes a reservation record.
router.delete(
  '/reservations/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const reservation = await Reservation.findByIdAndDelete(req.params.id);
    if (!reservation) throw new HttpError(404, 'Reservation not found.');
    await logActivity('reservation', `${req.auth.account.name} deleted reservation ${reservation.reference} (${reservation.name})`);
    res.json({ ok: true });
  })
);

router.get('/tables', asyncHandler(async (_req, res) => res.json({ tables: await tablesBoard() })));

// ------------------------------------------------------------------ table management (administrator only)
const TABLE_PREFIX = { indoor: 'T', terrace: 'P', bar: 'C', private: 'V' };
const tableFields = z.object({
  area: z.enum(SEATING_AREAS),
  seats: z.number().int('Seats must be a whole number.').min(1, 'A table needs at least 1 seat.').max(20, 'A table can seat at most 20.'),
  outOfService: z.boolean().optional(),
});

/** Bookings from today onward that still hold this table. */
const upcomingFor = (code) =>
  Reservation.find({ table: code, status: { $in: HOLDING_STATUSES }, date: { $gte: restaurantNow().date } })
    .select('guests reference date time')
    .lean();

const nextTableCode = async (area) => {
  const prefix = TABLE_PREFIX[area];
  const codes = (await Table.find({ code: new RegExp(`^${prefix}\\d+$`) }).select('code').lean()).map((t) => Number(t.code.slice(1)));
  const n = (codes.length ? Math.max(...codes) : 0) + 1;
  if (n > 99) throw new HttpError(409, 'No more table numbers are available in this area.');
  return `${prefix}${n}`;
};

router.post(
  '/tables',
  requireAdmin,
  validate(tableFields),
  asyncHandler(async (req, res) => {
    const { area, seats } = req.body;
    let table;
    for (let attempt = 0; attempt < 5 && !table; attempt += 1) {
      try {
        table = await Table.create({ code: await nextTableCode(area), area, seats });
      } catch (err) {
        if (err?.code !== 11000) throw err; // two admins added a table at once: take the next number
      }
    }
    if (!table) throw new HttpError(503, 'Could not add the table. Please try again.');
    await logActivity('edit', `Table ${table.code} (${table.seats} seats, ${table.area}) was added`);
    res.status(201).json({ tables: await tablesBoard() });
  })
);

router.put(
  '/tables/:code',
  requireAdmin,
  validate(tableFields),
  asyncHandler(async (req, res) => {
    const table = await Table.findOne({ code: req.params.code.toUpperCase() });
    if (!table) throw new HttpError(404, 'Table not found.');
    const { area, seats } = req.body;
    const outOfService = req.body.outOfService ?? table.outOfService;
    const upcoming = await upcomingFor(table.code);
    if (upcoming.length) {
      if (area !== table.area) throw new HttpError(409, `${table.code} has upcoming bookings, so it cannot move to another area.`);
      if (outOfService && !table.outOfService) {
        throw new HttpError(409, `${table.code} has ${upcoming.length} upcoming booking(s). Move or cancel them before taking the table out of service.`);
      }
      const biggest = Math.max(...upcoming.map((r) => r.guests));
      if (seats < biggest) throw new HttpError(409, `${table.code} has a booking for ${biggest} guests, so it needs at least ${biggest} seats.`);
    }
    Object.assign(table, { area, seats, outOfService });
    await table.save();
    await logActivity('edit', `Table ${table.code} was updated (${seats} seats, ${area}${outOfService ? ', out of service' : ''})`);
    res.json({ tables: await tablesBoard() });
  })
);

router.delete(
  '/tables/:code',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const table = await Table.findOne({ code: req.params.code.toUpperCase() });
    if (!table) throw new HttpError(404, 'Table not found.');
    if ((await upcomingFor(table.code)).length) {
      throw new HttpError(409, `${table.code} has upcoming bookings and cannot be removed. Take it out of service instead once they are moved.`);
    }
    await table.deleteOne();
    await logActivity('edit', `Table ${table.code} was removed`);
    res.json({ tables: await tablesBoard() });
  })
);

// ------------------------------------------------------------------ notifications
router.post(
  '/notifications/read-all',
  asyncHandler(async (_req, res) => {
    await Notification.updateMany({ read: false }, { read: true });
    res.json({ ok: true });
  })
);
router.patch(
  '/notifications/:id/read',
  asyncHandler(async (req, res) => {
    await Notification.updateOne({ _id: req.params.id }, { read: true });
    res.json({ ok: true });
  })
);

// ------------------------------------------------------------------ staff management
// Managers may view and edit staff records and (de)activate accounts. Hiring, firing (terminate) and deleting are administrator-only.
const staffFields = z.object({
  name: z.string().trim().min(2, 'Please enter the full name.').max(100),
  email: z.string().trim().toLowerCase().email('Please enter a valid email address.').max(254),
  phone: z.string().trim().max(40).refine((v) => v.replace(/\D/g, '').length >= 7, 'Please enter a valid phone number.'),
  position: z.enum(STAFF_POSITIONS),
  role: z.enum(STAFF_ROLES),
  hiredAt: z.string().refine(isValidISODate, 'Please choose the hiring date.'),
});

/** Managers may edit non-Manager staff records; only the administrator may create, change, or remove Manager accounts. */
function assertMayManage(req, person, newRole) {
  if (req.auth.account.isAdmin) return;
  if (person?.role === 'Manager' || newRole === 'Manager') {
    throw new HttpError(403, 'Only the administrator can create or change Manager accounts.');
  }
}
const assertNotSelf = (req, person) => {
  if (String(person._id) === String(req.auth.account._id)) throw new HttpError(409, 'You cannot do this to your own account.');
};

const nextEmployeeId = async () => {
  const last = await Staff.findOne({ employeeId: { $exists: true, $ne: null } }).sort({ employeeId: -1 }).select('employeeId').lean();
  const n = last ? Number(last.employeeId.slice(4)) + 1 : 1;
  return `EMP-${String(n).padStart(4, '0')}`;
};

const findStaff = async (employeeId) => {
  const person = await Staff.findOne({ employeeId, isAdmin: false });
  if (!person) throw new HttpError(404, 'Staff member not found.');
  return person;
};

router.post(
  '/staff',
  requireAdmin,
  validate(staffFields),
  asyncHandler(async (req, res) => {
    const d = req.body;
    assertMayManage(req, null, d.role);
    if (d.hiredAt > restaurantNow().date) throw new HttpError(400, 'The hiring date cannot be in the future.');
    if (await emailInUse(d.email)) throw new HttpError(409, 'A staff account with this email already exists.');

    // Only Managers get a login. Other roles are saved as records without a password.
    const hasLogin = d.role === 'Manager';
    const password = hasLogin ? tempPassword() : null;
    const passwordHash = hasLogin ? await hashPassword(password) : undefined;
    let person;
    for (let attempt = 0; attempt < 5 && !person; attempt += 1) {
      try {
        person = await Staff.create({ ...d, employeeId: await nextEmployeeId(), passwordHash, mustChangePassword: hasLogin });
      } catch (err) {
        if (err?.code !== 11000) throw err;
        if (err.keyPattern?.email) throw new HttpError(409, 'A staff account with this email already exists.');
        // otherwise two hires raced for the same EMP number: loop and take the next one
      }
    }
    if (!person) throw new HttpError(503, 'Could not create the account. Please try again.');

    await logActivity('hire', `${person.name} was hired as ${person.position}`, person.employeeId);
    await notify(
      hasLogin ? `Manager account created for ${person.name}.` : `${person.name} was added to the staff list (${person.role}, no system login).`,
      'staff'
    );
    // The temporary password is shown to the admin exactly once and is never stored in readable form.
    res.status(201).json({ staff: person.toClient(), tempPassword: password }); // null unless the new hire is a Manager
  })
);

router.put(
  '/staff/:id',
  requireStaffManager,
  validate(staffFields),
  asyncHandler(async (req, res) => {
    const person = await findStaff(req.params.id);
    const d = req.body;
    assertMayManage(req, person, d.role);
    if (d.email !== person.email && (await emailInUse(d.email, person._id))) {
      throw new HttpError(409, 'Another staff account already uses this email.');
    }
    const roleChanged = d.role !== person.role;
    const positionChanged = d.position !== person.position;
    const oldRole = person.role;
    Object.assign(person, d);
    // Promoted to Manager: create their login now (a fresh temporary password, shown once to the admin).
    let password = null;
    if (d.role === 'Manager' && oldRole !== 'Manager') {
      password = tempPassword();
      person.passwordHash = await hashPassword(password);
      person.mustChangePassword = true;
    }
    try {
      await person.save();
    } catch (err) {
      if (err?.code === 11000) throw new HttpError(409, 'Another staff account already uses this email.');
      throw err;
    }
    if (roleChanged) await logActivity('edit', `${person.name}’s role changed from ${oldRole} to ${person.role}`, person.employeeId);
    else if (positionChanged) await logActivity('edit', `${person.name}’s position changed to ${person.position}`, person.employeeId);
    else await logActivity('edit', `${person.name}’s profile was updated`, person.employeeId);
    res.json({ staff: person.toClient(), tempPassword: password });
  })
);

router.patch(
  '/staff/:id/active',
  requireStaffManager,
  validate(z.object({ active: z.boolean() })),
  asyncHandler(async (req, res) => {
    const person = await findStaff(req.params.id);
    assertMayManage(req, person);
    assertNotSelf(req, person);
    person.status = req.body.active ? 'active' : 'inactive';
    await person.save();
    await logActivity(
      req.body.active ? 'activate' : 'deactivate',
      `${person.name}’s account was ${req.body.active ? 'activated' : 'deactivated'}`,
      person.employeeId
    );
    res.json({ staff: person.toClient() });
  })
);

/**
 * Firing (terminate) and deleting both permanently remove the employee's document from MongoDB, so their personal
 * data and sign-in history are gone for good. Only a short line stays in the activity log (name and EMP number,
 * plus the reason when firing) so there is still an audit trail of who removed whom. Any session they hold stops
 * working on the next request because the account can no longer be found.
 */
async function removeStaff(req, person, { verb, reason }) {
  assertMayManage(req, person);
  assertNotSelf(req, person);
  const { name, employeeId } = person;
  const result = await Staff.deleteOne({ _id: person._id, isAdmin: false });
  if (!result.deletedCount) throw new HttpError(404, 'Staff member not found.');
  // The record is already gone, so a failure while writing the audit trail must not turn this into an error.
  try {
    const why = reason ? ` Reason: ${reason}`.slice(0, 200) : '';
    await logActivity('terminate', `${name} (${employeeId}) was ${verb} and their record was removed.${why}`.slice(0, 300), employeeId);
    await notify(`${name} was ${verb}. Their record and account access were removed.`.slice(0, 300), 'alert');
  } catch (err) {
    console.error('Could not write the audit trail for a removed staff member:', err);
  }
  return { removed: true, id: employeeId, name };
}

router.post(
  '/staff/:id/terminate',
  requireAdmin,
  validate(
    z.object({
      reason: z.string().trim().min(10, 'Please enter a reason (at least 10 characters).').max(500),
      date: z.string().refine(isValidISODate, 'Choose a valid termination date.'),
    })
  ),
  asyncHandler(async (req, res) => {
    const person = await findStaff(req.params.id);
    const { reason, date } = req.body;
    if (date < person.hiredAt || date > restaurantNow().date) {
      throw new HttpError(400, 'Choose a date between the hiring date and today.');
    }
    res.json(await removeStaff(req, person, { verb: 'terminated', reason: `${reason} (effective ${date})` }));
  })
);

router.delete(
  '/staff/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const person = await findStaff(req.params.id);
    res.json(await removeStaff(req, person, { verb: 'deleted' }));
  })
);

export default router;
