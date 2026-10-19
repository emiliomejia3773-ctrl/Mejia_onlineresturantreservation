import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, clearToken, getToken, setToken } from '../api';

// Real authentication: the API issues a JWT at login; it is kept in localStorage and sent with every request.
// One login serves all three account types. `user` is a customer; `staffSession` is an admin or staff member.
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // customer
  const [staffSession, setStaffSession] = useState(null); // { type: 'admin' | 'staff', name, email, title, staffId? }
  const [ready, setReady] = useState(!getToken()); // false while a saved session is being checked

  const clear = useCallback(() => {
    clearToken();
    setUser(null);
    setStaffSession(null);
  }, []);

  const apply = useCallback((data) => {
    if (data.kind === 'customer') {
      setStaffSession(null);
      setUser(data.user);
    } else {
      setUser(null);
      setStaffSession(data.session);
    }
  }, []);

  // Restore a saved session on page load.
  useEffect(() => {
    if (!getToken()) return undefined;
    let cancelled = false;
    api.get('/auth/me')
      .then((data) => { if (!cancelled) apply(data); })
      .catch((err) => { if (!cancelled && err.status === 401) clear(); })
      .finally(() => { if (!cancelled) setReady(true); });
    return () => { cancelled = true; };
  }, [apply, clear]);

  // The API said our token is no longer good.
  useEffect(() => {
    window.addEventListener('aurelia:auth-expired', clear);
    return () => window.removeEventListener('aurelia:auth-expired', clear);
  }, [clear]);

  const login = useCallback(async (email, password, remember = false) => {
    try {
      const data = await api.post('/auth/login', { email: email.trim(), password });
      setToken(data.token, remember);
      apply(data);
      return { ok: true, kind: data.kind };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }, [apply]);

  const register = useCallback(async ({ name, email, phone, password }) => {
    try {
      await api.post('/auth/register', { name, email, phone, password });
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message, fields: err.fields };
    }
  }, []);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      // A newly hired staff member is no longer forced to change the temporary password.
      setStaffSession((s) => (s ? { ...s, mustChangePassword: false } : s));
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }, []);

  const value = useMemo(
    () => ({ user, staffSession, ready, login, register, changePassword, logout: clear }),
    [user, staffSession, ready, login, register, changePassword, clear]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
