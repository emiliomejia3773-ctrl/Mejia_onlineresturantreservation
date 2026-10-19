import { parseISO } from '../data/reservationData';

// Labels and formatting helpers for the admin area. Data itself comes from the API (see AdminContext.jsx).
export const ROLES = ['Manager', 'Reservations Staff', 'Floor Staff', 'Kitchen Staff'];

export const ROLE_INFO = {
  Manager: 'Has a system login. Can open Reservations and Staff Management to view and edit staff records (cannot hire, terminate or delete).',
  'Reservations Staff': 'Staff record only. No system login.',
  'Floor Staff': 'Staff record only. No system login.',
  'Kitchen Staff': 'Staff record only. No system login.',
};

export const POSITIONS = [
  'Restaurant Manager',
  'Head Chef',
  'Sous Chef',
  'Pastry Chef',
  'Line Cook',
  'Host / Hostess',
  'Server',
  'Bartender',
  'Sommelier',
  'Cashier',
  'Busser',
];

export const STATUS_LABEL = { active: 'Active', inactive: 'Inactive' };

// ---------- Time helpers ----------
export function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

/** "YYYY-MM-DD" -> "Mar 15, 2021" */
export function formatDay(isoDate) {
  if (!isoDate) return '—';
  return parseISO(isoDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function timeAgo(iso) {
  if (!iso) return 'Never';
  const seconds = (Date.now() - new Date(iso).getTime()) / 1000;
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
  return formatDateTime(iso);
}

/** Length of employment, e.g. "2 yrs 4 mo". */
export function tenure(startISO, endISO) {
  const start = parseISO(startISO);
  const end = endISO ? parseISO(endISO) : new Date();
  let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  if (end.getDate() < start.getDate()) months -= 1;
  if (months < 1) return 'Less than a month';
  const y = Math.floor(months / 12);
  const m = months % 12;
  return [y ? `${y} yr${y > 1 ? 's' : ''}` : '', m ? `${m} mo` : ''].filter(Boolean).join(' ');
}

export function initials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}
