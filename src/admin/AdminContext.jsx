import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

// Admin / staff data, loaded from the API. The signed-in person comes from AuthContext (one shared login).
// The pages only talk to this context, so they did not need to change when the backend was added.
const AdminContext = createContext(null);
let toastCounter = 0;
const POLL_MS = 30000;

export function AdminProvider({ children }) {
  const { staffSession: session, logout } = useAuth();
  const [staff, setStaff] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [activity, setActivity] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [tables, setTables] = useState([]);
  const [customerCount, setCustomerCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const showToast = useCallback((message, tone = 'success') => {
    clearTimeout(toastTimer.current);
    toastCounter += 1;
    setToast({ id: `t${toastCounter}`, message, tone });
    toastTimer.current = setTimeout(() => setToast(null), 5000);
  }, []);
  const dismissToast = useCallback(() => setToast(null), []);

  // ----- Load everything the admin area needs in one request -----
  const load = useCallback(async () => {
    const data = await api.get('/admin/bootstrap');
    setStaff(data.staff);
    setReservations(data.reservations);
    setActivity(data.activity);
    setNotifications(data.notifications);
    setTables(data.tables);
    setCustomerCount(data.customerCount);
  }, []);

  const sessionKey = session ? `${session.type}:${session.email}` : null;
  useEffect(() => {
    if (!sessionKey) {
      setStaff([]); setReservations([]); setActivity([]); setNotifications([]); setTables([]); setCustomerCount(0);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    load()
      .catch((err) => { if (!cancelled && err.status !== 401) showToast(err.message, 'warning'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    // Pick up new bookings and activity without a manual refresh.
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') load().catch(() => {});
    }, POLL_MS);
    return () => { cancelled = true; clearInterval(timer); };
  }, [sessionKey, load, showToast]);

  /** Run an API call, refresh the lists, and turn failures into { ok: false, error }. */
  const act = useCallback(async (call, successMessage, tone) => {
    try {
      const data = await call();
      await load().catch(() => {});
      if (successMessage) showToast(successMessage(data), tone);
      return { ok: true, ...data };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }, [load, showToast]);

  // ----- Staff actions (hire / terminate / delete are administrator only; the server enforces this) -----
  const hireStaff = useCallback(
    (data) => act(() => api.post('/admin/staff', data), (r) => `${r.staff.name} was hired.`),
    [act]
  );

  const updateStaff = useCallback(
    (id, patch) => act(() => api.put(`/admin/staff/${id}`, patch), (r) => `${r.staff.name} was updated.`),
    [act]
  );

  const setStaffActive = useCallback(async (id, active) => {
    const result = await act(
      () => api.patch(`/admin/staff/${id}/active`, { active }),
      (r) => `${r.staff.name}’s account is now ${active ? 'active' : 'inactive'}.`
    );
    if (!result.ok) showToast(result.error, 'warning');
    return result;
  }, [act, showToast]);

  // Firing and deleting both permanently remove the employee's record from the database.
  const terminateStaff = useCallback(async (id, { reason, date }) => {
    const result = await act(
      () => api.post(`/admin/staff/${id}/terminate`, { reason, date }),
      (r) => `${r.name} was terminated and their record was removed.`,
      'warning'
    );
    if (!result.ok) showToast(result.error, 'warning');
    return result;
  }, [act, showToast]);

  const deleteStaff = useCallback(async (id) => {
    const previous = staff;
    setStaff((prev) => prev.filter((s) => s.id !== id)); // disappears from the list straight away
    const result = await act(
      () => api.delete(`/admin/staff/${id}`),
      (r) => `${r.name} was deleted and their record was removed.`,
      'warning'
    );
    if (!result.ok) {
      setStaff(previous); // the server refused: put the row back and say why
      showToast(result.error, 'warning');
    }
    return result;
  }, [act, showToast, staff]);

  // ----- Notifications -----
  const markNotificationRead = useCallback((id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    api.patch(`/admin/notifications/${id}/read`).catch(() => {});
  }, []);
  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    api.post('/admin/notifications/read-all').catch(() => {});
  }, []);

  // ----- Reservations -----
  const updateReservationStatus = useCallback(async (id, status) => {
    const previous = reservations;
    setReservations((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r))); // instant feedback
    try {
      const { reservation } = await api.patch(`/admin/reservations/${id}/status`, { status });
      setReservations((prev) => prev.map((r) => (r.id === id ? reservation : r)));
      api.get('/admin/tables').then((d) => setTables(d.tables)).catch(() => {});
      return { ok: true };
    } catch (err) {
      setReservations(previous);
      showToast(err.message, 'warning');
      return { ok: false, error: err.message };
    }
  }, [reservations, showToast]);

  const deleteReservation = useCallback(async (id) => {
    try {
      await api.delete(`/admin/reservations/${id}`);
      setReservations((prev) => prev.filter((r) => r.id !== id));
      api.get('/admin/tables').then((d) => setTables(d.tables)).catch(() => {});
      showToast('Reservation deleted.');
      return { ok: true };
    } catch (err) {
      showToast(err.message, 'warning');
      return { ok: false, error: err.message };
    }
  }, [showToast]);

  // ----- Tables (administrator only; the server enforces this and refuses changes that would break a booking) -----
  const tableCall = useCallback(async (call, message) => {
    try {
      const data = await call();
      setTables(data.tables);
      if (message) showToast(message);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }, [showToast]);
  const addTable = useCallback((v) => tableCall(() => api.post('/admin/tables', v), 'Table added.'), [tableCall]);
  const updateTable = useCallback((code, v) => tableCall(() => api.put(`/admin/tables/${code}`, v), `Table ${code} updated.`), [tableCall]);
  const removeTable = useCallback((code) => tableCall(() => api.delete(`/admin/tables/${code}`), `Table ${code} removed.`), [tableCall]);

  // ----- Derived counts (update automatically after every action) -----
  const staffCounts = useMemo(() => {
    const active = staff.filter((s) => s.status === 'active').length;
    const inactive = staff.filter((s) => s.status === 'inactive').length;
    return { active, inactive, current: active + inactive, all: staff.length };
  }, [staff]);

  const reservationCounts = useMemo(
    () => ({
      total: reservations.length,
      pending: reservations.filter((r) => r.status === 'pending').length,
      confirmed: reservations.filter((r) => r.status === 'confirmed').length,
    }),
    [reservations]
  );

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const value = useMemo(
    () => ({
      staff, reservations, activity, notifications, tables, customerCount, loading, toast, staffCounts, reservationCounts, unreadCount, session,
      hireStaff, updateStaff, setStaffActive, terminateStaff, deleteStaff, logout, addTable, updateTable, removeTable,
      markNotificationRead, markAllRead, updateReservationStatus, deleteReservation, showToast, dismissToast,
    }),
    [staff, reservations, activity, notifications, tables, customerCount, loading, toast, staffCounts, reservationCounts, unreadCount, session,
      hireStaff, updateStaff, setStaffActive, terminateStaff, deleteStaff, logout, addTable, updateTable, removeTable, markNotificationRead, markAllRead,
      updateReservationStatus, deleteReservation, showToast, dismissToast]
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used inside <AdminProvider>');
  return ctx;
}
