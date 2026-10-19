import { Router } from 'express';
import { z } from 'zod';
import Reservation from '../models/Reservation.js';
import { CANCEL_CUTOFF_HOURS, MAX_GUESTS, OCCASIONS, SEATING_AREAS } from '../config.js';
import { authenticate, requireCustomer } from '../middleware/auth.js';
import { HttpError, asyncHandler, validate } from '../utils/http.js';
import { isValidISODate, minutesUntil } from '../utils/time.js';
import { logActivity, notify } from '../utils/audit.js';
import { createReservation, updateReservation } from '../services/reservations.js';

const router = Router();
router.use(authenticate, requireCustomer);

// ---- My reservations ----
router.get(
  '/mine',
  asyncHandler(async (req, res) => {
    const list = await Reservation.find({ user: req.auth.account._id }).sort({ date: -1, time: -1 }).limit(500);
    res.json({ reservations: list.map((r) => r.toClient()) });
  })
);

// ---- Book a table ----
const bookingSchema = z.object({
  date: z.string().refine(isValidISODate, 'Please choose a date.'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Please select an available time.'),
  guests: z.coerce.number().int().min(1).max(MAX_GUESTS, `Parties of 1–${MAX_GUESTS} can book online.`),
  area: z.enum(SEATING_AREAS),
  table: z.string().trim().toUpperCase().regex(/^[A-Z]\d{1,2}$/, 'Please choose a table.').optional(),
  name: z.string().trim().min(2, 'Please enter your full name.').max(100),
  email: z.string().trim().toLowerCase().email('Please enter a valid email address.').max(254),
  phone: z.string().trim().max(40).refine((v) => v.replace(/\D/g, '').length >= 7, 'Please enter a valid phone number.'),
  occasion: z.enum(OCCASIONS).default('None'),
  requests: z.string().trim().max(400).default(''),
  dietary: z.string().trim().max(200).default(''),
});

router.post(
  '/',
  validate(bookingSchema),
  asyncHandler(async (req, res) => {
    const reservation = await createReservation(req.body, req.auth.account._id);
    const pending = reservation.status === 'pending';
    await notify(
      pending
        ? `New request awaiting approval: ${reservation.guests} guests, ${reservation.date} at ${reservation.time} (${reservation.reference}).`
        : `New booking: ${reservation.guests} guests, ${reservation.date} at ${reservation.time} (${reservation.reference}).`,
      'reservation'
    );
    await logActivity('reservation', `Reservation ${reservation.reference} for ${reservation.guests} guests ${pending ? 'requested' : 'confirmed'}`);
    res.status(201).json({ reservation: reservation.toClient() });
  })
);

// ---- Edit / reschedule my reservation ----
const editSchema = bookingSchema.omit({ name: true, email: true });

router.put(
  '/:id',
  validate(editSchema),
  asyncHandler(async (req, res) => {
    const reservation = await Reservation.findOne({ _id: req.params.id, user: req.auth.account._id });
    if (!reservation) throw new HttpError(404, 'Reservation not found.');
    if (!['pending', 'confirmed'].includes(reservation.status)) {
      throw new HttpError(409, 'This reservation can no longer be changed.');
    }
    if (minutesUntil(reservation.date, reservation.time) < CANCEL_CUTOFF_HOURS * 60) {
      throw new HttpError(409, `Reservations can be changed up to ${CANCEL_CUTOFF_HOURS} hours before the booking. Please call us.`);
    }
    const updated = await updateReservation(reservation, req.body);
    await notify(`Reservation ${updated.reference} was changed by the guest (${updated.guests} guests, ${updated.date} at ${updated.time}).`, 'reservation');
    await logActivity('reservation', `Reservation ${updated.reference} was changed by the guest`);
    res.json({ reservation: updated.toClient() });
  })
);

// ---- Cancel my reservation ----
router.patch(
  '/:id/cancel',
  asyncHandler(async (req, res) => {
    const reservation = await Reservation.findOne({ _id: req.params.id, user: req.auth.account._id });
    if (!reservation) throw new HttpError(404, 'Reservation not found.');
    if (!['pending', 'confirmed'].includes(reservation.status)) {
      throw new HttpError(409, 'This reservation can no longer be cancelled.');
    }
    if (minutesUntil(reservation.date, reservation.time) < CANCEL_CUTOFF_HOURS * 60) {
      throw new HttpError(409, `Reservations can be cancelled up to ${CANCEL_CUTOFF_HOURS} hours before the booking. Please call us.`);
    }
    reservation.status = 'cancelled';
    await reservation.save();
    await notify(`Reservation ${reservation.reference} was cancelled by the guest.`, 'reservation');
    await logActivity('reservation', `Reservation ${reservation.reference} was cancelled by the guest`);
    res.json({ reservation: reservation.toClient() });
  })
);

export default router;
