const required = (name, fallback) => {
  const v = process.env[name] ?? fallback;
  if (v === undefined || v === '') throw new Error(`Missing required environment variable ${name}`);
  return v;
};

const isProd = process.env.NODE_ENV === 'production';

export const config = {
  isProd,
  port: Number(process.env.PORT) || 5000,
  mongoUri: required('MONGODB_URI', isProd ? undefined : 'mongodb://127.0.0.1:27017/aurelia'),
  // In production a real secret is mandatory; in development we fall back so `npm run dev` works out of the box.
  jwtSecret: required('JWT_SECRET', isProd ? undefined : 'dev-only-secret-change-me'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientOrigins: (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',').map((s) => s.trim()).filter(Boolean),
  timeZone: process.env.RESTAURANT_TZ || undefined, // undefined = server local time
};

if (isProd && config.jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters in production');
}

// ---- Restaurant rules (mirror src/data/siteData.js and src/data/reservationData.js in the frontend) ----
export const SEATING_AREAS = ['indoor', 'terrace', 'bar', 'private'];
export const OCCASIONS = ['None', 'Birthday', 'Anniversary', 'Business meeting', 'Date night', 'Celebration'];
export const MAX_GUESTS = 12;
export const MAX_ADVANCE_DAYS = 60;
export const MIN_ADVANCE_MINUTES = 60;
export const SLOT_MINUTES = 30;
export const DINING_MINUTES = 90; // a booking occupies its table this long
export const CANCEL_CUTOFF_HOURS = 4;
export const AUTO_CONFIRM_MAX_GUESTS = 4;

// 0 = Sunday ... 6 = Saturday
export const OPENING_HOURS = [
  { day: 0, open: '12:00', lastSeating: '19:30' },
  { day: 1, open: null, lastSeating: null },
  { day: 2, open: '17:00', lastSeating: '21:00' },
  { day: 3, open: '17:00', lastSeating: '21:00' },
  { day: 4, open: '17:00', lastSeating: '21:00' },
  { day: 5, open: '12:00', lastSeating: '21:30' },
  { day: 6, open: '12:00', lastSeating: '21:30' },
];

export const STAFF_ROLES = ['Manager', 'Reservations Staff', 'Floor Staff', 'Kitchen Staff'];
export const STAFF_POSITIONS = [
  'Restaurant Manager', 'Head Chef', 'Sous Chef', 'Pastry Chef', 'Line Cook', 'Host / Hostess',
  'Server', 'Bartender', 'Sommelier', 'Cashier', 'Busser',
];
export const RESERVATION_STATUSES = ['pending', 'confirmed', 'rejected', 'cancelled', 'checked_in', 'seated', 'completed', 'no_show'];
// Statuses that keep a table occupied for their slot.
export const HOLDING_STATUSES = ['pending', 'confirmed', 'checked_in', 'seated'];
