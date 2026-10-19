// Tiny fetch wrapper for the Aurelia API.
// In development Vite proxies /api to the Express server (see vite.config.js). To talk to an API on another
// origin, set VITE_API_URL (e.g. https://api.example.com) when building.
const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '') + '/api';
const TOKEN_KEY = 'aurelia_token';

export class ApiError extends Error {
  constructor(message, status, fields = {}) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

// "Remember me" keeps the token in localStorage; otherwise it lives in sessionStorage (cleared when the tab closes).
const read = (store) => { try { return store.getItem(TOKEN_KEY); } catch { return null; } };
const write = (store, v) => { try { store.setItem(TOKEN_KEY, v); } catch { /* storage unavailable */ } };
const drop = (store) => { try { store.removeItem(TOKEN_KEY); } catch { /* ignore */ } };

let memoryToken = null; // fallback when web storage is unavailable
export const getToken = () => memoryToken || read(localStorage) || read(sessionStorage);
export const setToken = (token, persist = false) => {
  memoryToken = token;
  drop(localStorage);
  drop(sessionStorage);
  write(persist ? localStorage : sessionStorage, token);
};
export const clearToken = () => {
  memoryToken = null;
  drop(localStorage);
  drop(sessionStorage);
};

async function request(method, path, body) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch {
    throw new ApiError('Cannot reach the server. Please check your connection and try again.', 0);
  }

  let data = null;
  try { data = await res.json(); } catch { /* empty body */ }

  if (!res.ok) {
    // A rejected token means the session ended (expired, account deactivated, ...): tell the app to sign out.
    if (res.status === 401 && token) window.dispatchEvent(new CustomEvent('aurelia:auth-expired'));
    // No JSON body on a 5xx means the dev proxy could not reach the API (server not running).
    const unreachable = !data && res.status >= 500;
    throw new ApiError(
      data?.error || (unreachable ? 'The server is not running. Start it with "npm run server" and try again.' : 'Something went wrong. Please try again.'),
      res.status, data?.fields || {}
    );
  }
  return data;
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body = {}) => request('POST', path, body),
  put: (path, body) => request('PUT', path, body),
  patch: (path, body = {}) => request('PATCH', path, body),
  delete: (path) => request('DELETE', path),
};
