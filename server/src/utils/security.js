import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { config } from '../config.js';

const ROUNDS = 12;
export const hashPassword = (plain) => bcrypt.hash(plain, ROUNDS);
export const checkPassword = (plain, hash) => bcrypt.compare(plain, hash);

// Compared against when no account matches, so response time does not reveal whether an email exists.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', ROUNDS);
export const burnPasswordCheck = (plain) => bcrypt.compare(plain, DUMMY_HASH);

export const signToken = (account, kind) =>
  jwt.sign({ kind }, config.jwtSecret, { subject: String(account._id), expiresIn: config.jwtExpiresIn });

export const verifyToken = (token) => jwt.verify(token, config.jwtSecret);

export function tempPassword(length = 12) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes, (b) => chars[b % chars.length]).join('') + '1a'; // guarantees a digit and a letter
}

export function reference() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.randomBytes(6);
  return `AUR-${Array.from(bytes, (b) => chars[b % chars.length]).join('')}`;
}

export function deviceFrom(userAgent = '') {
  const os = /iPhone|iPad/.test(userAgent) ? 'iPhone' : /Android/.test(userAgent) ? 'Android'
    : /Windows/.test(userAgent) ? 'Windows' : /Mac OS X|Macintosh/.test(userAgent) ? 'macOS'
    : /Linux/.test(userAgent) ? 'Linux' : 'Unknown OS';
  const browser = /Edg\//.test(userAgent) ? 'Edge' : /Chrome\//.test(userAgent) ? 'Chrome'
    : /Safari\//.test(userAgent) ? 'Safari' : /Firefox\//.test(userAgent) ? 'Firefox' : 'Browser';
  return `${browser} · ${os}`;
}
