import User from '../models/User.js';
import Staff from '../models/Staff.js';
import { HttpError, asyncHandler } from '../utils/http.js';
import { verifyToken } from '../utils/security.js';

/** Only the administrator and Manager-role staff have a system login; other roles are records only. */
export const canManageStaff = (account) => Boolean(account?.isAdmin || account?.role === 'Manager');

/**
 * Reads "Authorization: Bearer <jwt>", loads the account from the database and attaches it:
 *   req.auth = { kind: 'customer' | 'staff', account }  (staff includes the admin; check account.isAdmin)
 * The account is re-read on every request, so deactivating a staff member, or firing/deleting them (which removes their record), takes effect immediately.
 */
export const authenticate = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new HttpError(401, 'Please log in to continue.');

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    throw new HttpError(401, 'Your session has expired. Please log in again.');
  }

  if (payload.kind === 'customer') {
    const account = await User.findById(payload.sub);
    if (!account) throw new HttpError(401, 'Your session is no longer valid. Please log in again.');
    req.auth = { kind: 'customer', account };
  } else if (payload.kind === 'staff') {
    const account = await Staff.findById(payload.sub);
    if (!account || account.status !== 'active' || !canManageStaff(account)) {
      throw new HttpError(401, 'This account can no longer sign in.');
    }
    req.auth = { kind: 'staff', account };
  } else {
    throw new HttpError(401, 'Invalid session.');
  }
  next();
});

export const requireCustomer = (req, _res, next) =>
  req.auth?.kind === 'customer' ? next() : next(new HttpError(403, 'This action is for customer accounts.'));

export const requireStaff = (req, _res, next) =>
  req.auth?.kind === 'staff' ? next() : next(new HttpError(403, 'Staff access only.'));

export const requireStaffManager = (req, _res, next) =>
  req.auth?.kind === 'staff' && canManageStaff(req.auth.account)
    ? next()
    : next(new HttpError(403, 'Manager or administrator access only.'));

export const requireAdmin = (req, _res, next) =>
  req.auth?.kind === 'staff' && req.auth.account.isAdmin
    ? next()
    : next(new HttpError(403, 'Administrator access only.'));
