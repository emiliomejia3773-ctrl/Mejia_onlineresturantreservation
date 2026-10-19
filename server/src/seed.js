// Loads demo data. Usage:  npm run seed            (only if the database is empty)
//                          npm run seed -- --reset (wipes the Aurelia collections first)
import mongoose from 'mongoose';
import { config, OPENING_HOURS } from './config.js';
import User from './models/User.js';
import Staff from './models/Staff.js';
import Reservation from './models/Reservation.js';
import Table from './models/Table.js';
import Activity from './models/Activity.js';
import Notification from './models/Notification.js';
import ContactMessage from './models/ContactMessage.js';
import { findFreeTable } from './utils/availability.js';
import { hashPassword, reference } from './utils/security.js';
import { addDaysISO, restaurantNow, weekdayOf } from './utils/time.js';
import { HOLDING_STATUSES } from './config.js';

const env = (k, d) => process.env[k] || d;
const ADMIN = { email: env('SEED_ADMIN_EMAIL', 'admin@aurelia-demo.com'), password: env('SEED_ADMIN_PASSWORD', 'Admin@1234') };
const STAFF_PASSWORD = env('SEED_STAFF_PASSWORD', 'Staff@1234');
const CUSTOMER = { email: 'demo@aurelia.com', password: env('SEED_CUSTOMER_PASSWORD', 'Demo@1234') };

const today = restaurantNow().date;
const isOpen = (iso) => Boolean(OPENING_HOURS.find((h) => h.day === weekdayOf(iso))?.open);
/** Day `offset` from today, nudged forward to a day the restaurant is open. */
const dayAt = (offset) => {
  let d = addDaysISO(today, offset);
  while (!isOpen(d)) d = addDaysISO(d, 1);
  return d;
};
const hoursAgo = (h) => new Date(Date.now() - h * 3600000);

const TABLES = [
  ['T1', 'indoor', 2], ['T2', 'indoor', 2], ['T3', 'indoor', 4], ['T4', 'indoor', 4], ['T5', 'indoor', 4],
  ['T6', 'indoor', 6], ['T7', 'indoor', 4, true], ['P1', 'terrace', 4], ['P2', 'terrace', 6], ['P3', 'terrace', 6],
  ['C1', 'bar', 2], ['C2', 'bar', 2], ['C4', 'bar', 2], ['V1', 'private', 12],
].map(([code, area, seats, outOfService]) => ({ code, area, seats, outOfService: Boolean(outOfService) }));

const STAFF = [
  // Only the Manager has a system login; the other roles are records without an account.
  { n: 1, name: 'Maria Santos', position: 'Restaurant Manager', role: 'Manager', phone: '+1 (555) 010-1100', hiredAt: '2022-11-14', status: 'active', lastLoginH: 2 },
  { n: 2, name: 'Jules Resonable', position: 'Host / Hostess', role: 'Reservations Staff', phone: '+1 (555) 010-1101', hiredAt: '2023-03-06', status: 'active' },
  { n: 3, name: 'John Kenneth', position: 'Server', role: 'Floor Staff', phone: '+1 (555) 010-1102', hiredAt: '2023-09-18', status: 'active' },
];
const DEVICES = ['Chrome · Windows', 'Safari · iPhone', 'Chrome · Android', 'Edge · Windows', 'Safari · macOS'];

// The five sample reservations: [name, guests, area, offset (days from today), time, status]
// (a table is assigned automatically for active bookings)
const GUEST_ROWS = [
  ['Emilio T Mejia', 2, 'indoor', 1, '19:00', 'confirmed'],
  ['John Bompat', 4, 'indoor', 1, '20:00', 'confirmed'],
  ['Kyle Panahon', 2, 'bar', 2, '18:30', 'confirmed'],
  ['Yuuto Herai', 6, 'terrace', 3, '19:30', 'pending'],
  ['Emilio T Mejia', 4, 'terrace', 5, '20:00', 'confirmed'],
];

async function main() {
  await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 8000 });
  const reset = process.argv.includes('--reset');
  const existing = (await Promise.all([User, Staff, Reservation, Table].map((m) => m.estimatedDocumentCount()))).some(Boolean);
  if (existing && !reset) {
    console.log('Database already contains data. Use `npm run seed -- --reset` to wipe it and start over.');
    return;
  }
  if (reset) await Promise.all([User, Staff, Reservation, Table, Activity, Notification, ContactMessage].map((m) => m.deleteMany({})));
  await mongoose.syncIndexes();

  await Table.insertMany(TABLES);

  const customer = await User.create({
    name: 'Eleanor Hayes', email: CUSTOMER.email, phone: '+1 (555) 214-7788',
    passwordHash: await hashPassword(CUSTOMER.password), createdAt: new Date('2024-03-12'),
  });

  await Staff.create({
    name: 'Emilio T Mejia', email: ADMIN.email, passwordHash: await hashPassword(ADMIN.password),
    isAdmin: true, title: 'Owner · Administrator',
  });

  const staffHash = await hashPassword(STAFF_PASSWORD);
  for (const s of STAFF) {
    const employeeId = `EMP-${String(s.n).padStart(4, '0')}`;
    const hasLogin = s.role === 'Manager';
    const lastLogin = hasLogin ? hoursAgo(s.lastLoginH) : null;
    await Staff.create({
      employeeId, name: s.name, email: `${s.name.toLowerCase().replace(/[^a-z]+/g, '.')}@aurelia-demo.com`,
      phone: s.phone, passwordHash: hasLogin ? staffHash : undefined, position: s.position, role: s.role, hiredAt: s.hiredAt, status: s.status,
      lastLogin,
      signIns: !hasLogin ? [] : Array.from({ length: 6 }, (_, i) => ({
        at: new Date(lastLogin.getTime() - i * (20 + i * 9) * 3600000),
        device: DEVICES[(i + s.n) % DEVICES.length],
        result: i === 3 && s.n % 2 === 0 ? 'failed' : 'success',
      })),
    });
  }

  // Reservations: active ones get a real free table, so the availability engine starts consistent.
  const placed = []; // { date, time, table }
  const docs = [];
  const add = (row) => {
    let table = null;
    if (HOLDING_STATUSES.includes(row.status)) {
      const sameDay = placed.filter((p) => p.date === row.date);
      table = findFreeTable({ tables: TABLES, reservations: sameDay, time: row.time, guests: row.guests, area: row.area })?.code ?? null;
      if (!table) return; // sample data does not fit; skip rather than double-book
      placed.push({ date: row.date, time: row.time, table });
    }
    docs.push({ reference: reference(), table, occasion: 'None', requests: '', dietary: '', ...row });
  };
  for (const [name, guests, area, offset, time, status] of GUEST_ROWS) {
    add({
      name, guests, area, time, status, date: dayAt(offset), phone: '+1 (555) 010-0000',
      email: `${name.toLowerCase().replace(/[^a-z]+/g, '.')}@example.com`,
    });
  }
  await Reservation.insertMany(docs);

  const pending = docs.filter((d) => d.status === 'pending').length;
  await Activity.insertMany([
    { type: 'signin', text: 'Maria Santos signed in', staffId: 'EMP-0001', at: hoursAgo(2) },
  ]);
  await Notification.insertMany([
    { kind: 'system', text: 'Weekly reservation summary is ready.', read: true, at: hoursAgo(30) },
    { kind: 'reservation', text: `${pending} reservation requests are waiting for approval.`, read: false, at: hoursAgo(1) },
  ]);

  console.log(`Seeded: ${TABLES.length} tables, ${STAFF.length} staff, 1 admin, 1 customer (no bookings), ${docs.length} reservations.`);
  console.log(`  Customer  ${CUSTOMER.email}  /  ${CUSTOMER.password}`);
  console.log(`  Admin     ${ADMIN.email}  /  ${ADMIN.password}`);
  console.log(`  Manager   maria.santos@aurelia-demo.com  /  ${STAFF_PASSWORD}  (only the manager has a login; other staff are records)`);
  console.log('Change these passwords before putting the site on the internet.');
}

main()
  .catch((err) => { console.error(err); process.exitCode = 1; })
  .finally(() => mongoose.disconnect());
