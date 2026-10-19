import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { useAuth } from './AuthContext';

// The signed-in customer's reservations, loaded from and saved to the API.
const ReservationContext = createContext(null);

export function ReservationProvider({ children }) {
  const { user } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    const data = await api.get('/reservations/mine');
    setReservations(data.reservations);
  }, []);

  useEffect(() => {
    if (!user) {
      setReservations([]);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    api.get('/reservations/mine')
      .then((data) => { if (!cancelled) setReservations(data.reservations); })
      .catch(() => { /* the dashboard shows an empty list; 401s sign the user out via api.js */ })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user]);

  /** Resolves with the saved reservation; rejects with an ApiError (message is safe to show). */
  const addReservation = useCallback(async (data) => {
    const { reservation } = await api.post('/reservations', data);
    setReservations((prev) => [reservation, ...prev]);
    return reservation;
  }, []);

  /** Saves changes to my booking. Resolves with the updated reservation; rejects with an ApiError. */
  const updateReservation = useCallback(async (id, data) => {
    const { reservation } = await api.put(`/reservations/${id}`, data);
    setReservations((prev) => prev.map((r) => (r.id === id ? reservation : r)));
    return reservation;
  }, []);

  /** Resolves { ok: true } or { ok: false, error }. */
  const cancelReservation = useCallback(async (id) => {
    try {
      const { reservation } = await api.patch(`/reservations/${id}/cancel`);
      setReservations((prev) => prev.map((r) => (r.id === id ? reservation : r)));
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }, []);

  const value = useMemo(
    () => ({ reservations, loading, addReservation, updateReservation, cancelReservation, refresh }),
    [reservations, loading, addReservation, updateReservation, cancelReservation, refresh]
  );
  return <ReservationContext.Provider value={value}>{children}</ReservationContext.Provider>;
}

export function useReservations() {
  const ctx = useContext(ReservationContext);
  if (!ctx) throw new Error('useReservations must be used inside <ReservationProvider>');
  return ctx;
}
