import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import ContactMessage from '../models/ContactMessage.js';
import { MAX_GUESTS, SEATING_AREAS } from '../config.js';
import { buildSlots, freeTables, hoursFor, isOpenOn } from '../utils/availability.js';
import { asyncHandler, validate } from '../utils/http.js';
import { isValidISODate } from '../utils/time.js';
import { notify } from '../utils/audit.js';
import { loadHolding, loadTables } from '../services/reservations.js';

const router = Router();

// ---- Available time slots for the booking form ----
router.get(
  '/availability',
  validate(
    z.object({
      date: z.string().refine(isValidISODate, 'Please choose a valid date.'),
      guests: z.coerce.number().int().min(1).max(MAX_GUESTS).default(2),
      area: z.enum(SEATING_AREAS).default('indoor'),
      exclude: z.string().regex(/^[a-f0-9]{24}$/).optional(), // a booking being edited: its own table counts as free
    }),
    'query'
  ),
  asyncHandler(async (req, res) => {
    const { date, guests, area, exclude } = req.query;
    if (!isOpenOn(date)) return res.json({ date, open: false, lastSeating: null, slots: [] });
    const [tables, reservations] = await Promise.all([loadTables(), loadHolding(date, exclude)]);
    res.json({
      date,
      open: true,
      lastSeating: hoursFor(date).lastSeating,
      slots: buildSlots({ date, guests, area, tables, reservations }),
    });
  })
);

// ---- Free tables for a chosen slot (the guest picks one on the booking form) ----
router.get(
  '/tables/available',
  validate(
    z.object({
      date: z.string().refine(isValidISODate, 'Please choose a valid date.'),
      time: z.string().regex(/^\d{2}:\d{2}$/),
      guests: z.coerce.number().int().min(1).max(MAX_GUESTS).default(2),
      area: z.enum(SEATING_AREAS).default('indoor'),
      exclude: z.string().regex(/^[a-f0-9]{24}$/).optional(),
    }),
    'query'
  ),
  asyncHandler(async (req, res) => {
    const { date, time, guests, area, exclude } = req.query;
    if (!isOpenOn(date)) return res.json({ tables: [] });
    const [tables, reservations] = await Promise.all([loadTables(), loadHolding(date, exclude)]);
    res.json({
      tables: freeTables({ tables, reservations, time, guests, area }).map((t) => ({ code: t.code, area: t.area, seats: t.seats })),
    });
  })
);

// ---- Contact form ----
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many messages. Please try again later.' },
});

router.post(
  '/contact',
  contactLimiter,
  validate(
    z.object({
      name: z.string().trim().min(2, 'Please enter your name.').max(100),
      email: z.string().trim().email('Please enter a valid email address.').max(254),
      subject: z.string().trim().min(1, 'Please add a subject.').max(150),
      message: z.string().trim().min(10, 'Your message should be at least 10 characters.').max(4000),
    })
  ),
  asyncHandler(async (req, res) => {
    await ContactMessage.create(req.body);
    await notify(`New message from ${req.body.name}: “${req.body.subject.slice(0, 80)}”`, 'message');
    res.status(201).json({ ok: true });
  })
);

export default router;
