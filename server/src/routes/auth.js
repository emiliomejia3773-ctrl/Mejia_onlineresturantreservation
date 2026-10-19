import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import User from '../models/User.js';
import Staff from '../models/Staff.js';
import { authenticate } from '../middleware/auth.js';
import { HttpError, asyncHandler, validate } from '../utils/http.js';
import { burnPasswordCheck, checkPassword, deviceFrom, hashPassword, signToken } from '../utils/security.js';
import { logActivity } from '../utils/audit.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please wait a few minutes and try again.' },
});

const email = z.string().trim().toLowerCase().email('Please enter a valid email address.').max(254);
const password = z
  .string()
  .min(8, 'Use at least 8 characters, including a letter and a number.')
  .max(128)
  .regex(/[A-Za-z]/, 'Use at least 8 characters, including a letter and a number.')
  .regex(/\d/, 'Use at least 8 characters, including a letter and a number.');
const phone = z.string().trim().max(40).refine((v) => v.replace(/\D/g, '').length >= 7, 'Please enter a valid phone number.');

export const emailInUse = async (value, exceptStaffId = null) => {
  const [u, s] = await Promise.all([
    User.exists({ email: value }),
    Staff.exists({ email: value, ...(exceptStaffId ? { _id: { $ne: exceptStaffId } } : {}) }),
  ]);
  return Boolean(u || s);
};

// ---- Register (customers only) ----
router.post(
  '/register',
  authLimiter,
  validate(z.object({ name: z.string().trim().min(2, 'Please enter your full name.').max(100), email, phone, password })),
  asyncHandler(async (req, res) => {
    const { name, email: mail, phone: tel, password: pw } = req.body;
    if (await emailInUse(mail)) throw new HttpError(409, 'An account with this email already exists.');
    try {
      await User.create({ name, email: mail, phone: tel, passwordHash: await hashPassword(pw) });
    } catch (err) {
      if (err?.code === 11000) throw new HttpError(409, 'An account with this email already exists.');
      throw err;
    }
    // Like the original flow, the visitor is sent to the login page afterwards.
    res.status(201).json({ ok: true });
  })
);

// ---- Login (customers, staff and the administrator all use this one endpoint) ----
const BAD = 'Incorrect email or password.';
router.post(
  '/login',
  authLimiter,
  validate(z.object({ email, password: z.string().min(1).max(128) }), 'body'),
  asyncHandler(async (req, res) => {
    const { email: mail, password: pw } = req.body;

    const user = await User.findOne({ email: mail }).select('+passwordHash');
    if (user) {
      if (!(await checkPassword(pw, user.passwordHash))) throw new HttpError(401, BAD);
      return res.json({ kind: 'customer', token: signToken(user, 'customer'), user: user.toClient() });
    }

    const staff = await Staff.findOne({ email: mail }).select('+passwordHash');
    if (!staff) {
      await burnPasswordCheck(pw);
      throw new HttpError(401, BAD);
    }

    // Only the administrator and Managers have accounts; other staff roles are records without a login.
    if (!staff.isAdmin && staff.role !== 'Manager') {
      await burnPasswordCheck(pw);
      throw new HttpError(403, 'This staff role does not have a system account. Only managers can sign in.');
    }

    const device = deviceFrom(req.headers['user-agent']);
    const record = (result) =>
      Staff.updateOne(
        { _id: staff._id },
        {
          ...(result === 'success' ? { $set: { lastLogin: new Date() } } : {}),
          $push: { signIns: { $each: [{ at: new Date(), device, result }], $position: 0, $slice: Staff.MAX_SIGNINS } },
        }
      );

    if (!(await checkPassword(pw, staff.passwordHash))) {
      if (!staff.isAdmin) await record('failed');
      throw new HttpError(401, BAD);
    }
    if (staff.status === 'inactive') {
      await record('failed');
      throw new HttpError(403, 'This account is deactivated. Please contact an administrator.');
    }

    if (!staff.isAdmin) {
      await record('success');
      await logActivity('signin', `${staff.name} signed in`, staff.employeeId);
    }
    return res.json({ kind: staff.isAdmin ? 'admin' : 'staff', token: signToken(staff, 'staff'), session: staff.toSession() });
  })
);

// ---- Who am I? (used on page load to restore the session) ----
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const { kind, account } = req.auth;
    if (kind === 'customer') return res.json({ kind: 'customer', user: account.toClient() });
    return res.json({ kind: account.isAdmin ? 'admin' : 'staff', session: account.toSession() });
  })
);

// ---- Change own password ----
router.post(
  '/change-password',
  authenticate,
  authLimiter,
  validate(z.object({ currentPassword: z.string().min(1).max(128), newPassword: password })),
  asyncHandler(async (req, res) => {
    const Model = req.auth.kind === 'customer' ? User : Staff;
    const account = await Model.findById(req.auth.account._id).select('+passwordHash');
    if (!(await checkPassword(req.body.currentPassword, account.passwordHash))) {
      throw new HttpError(400, 'Your current password is incorrect.');
    }
    if (req.body.newPassword === req.body.currentPassword) {
      throw new HttpError(400, 'Choose a new password that is different from the current one.');
    }
    account.passwordHash = await hashPassword(req.body.newPassword);
    if (req.auth.kind === 'staff') account.mustChangePassword = false;
    await account.save();
    res.json({ ok: true });
  })
);

export default router;
