/**
 * src/services/api.js  — UPDATED for Keycloak
 *
 * One change: the request interceptor now reads the live Keycloak token
 * instead of the static localStorage value.
 *
 * Falls back to localStorage 'access_token' so existing code that sets it
 * manually still works during transition.
 *
 * All other config (base URL, timeout, error normalisation) is unchanged.
 */

import axios from 'axios';
import { getKeycloak } from '../auth/keycloak';

const BASE_URL =
  import.meta.env?.VITE_API_BASE_URL ||
  (typeof process !== 'undefined' ? process.env?.REACT_APP_API_BASE_URL : undefined) ||
  'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ---------------------------------------------------------------------------
// Request interceptor — attach live Keycloak token
// ---------------------------------------------------------------------------
api.interceptors.request.use(
  async (config) => {
    try {
      // Try to get a fresh token from the Keycloak singleton
      const kc = await getKeycloak();
      if (kc && kc.authenticated) {
        // Refresh if expiring within 30 seconds
        await kc.updateToken(30).catch(() => {});
        if (kc.token) {
          config.headers.Authorization = `Bearer ${kc.token}`;
          return config;
        }
      }
    } catch {
      // Keycloak not yet initialised — fall through to localStorage
    }

    // Fallback: static token (supports legacy manual login during transition)
    const stored = localStorage.getItem('access_token');
    if (stored) {
      config.headers.Authorization = `Bearer ${stored}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// ---------------------------------------------------------------------------
// Response interceptor — normalise errors + handle 401 (session expired)
// ---------------------------------------------------------------------------
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response) {
      const { status, data } = error.response;

      // Session expired — redirect to Keycloak login
      if (status === 401) {
        try {
          const kc = await getKeycloak();
          if (kc) { kc.login(); return; }
        } catch { /* ignore */ }
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }

      const message = data?.message || data?.detail || `Error ${status}`;
      const err = new Error(message);
      err.status = status;
      err.data = data?.data ?? null;
      return Promise.reject(err);
    }

    if (error.request) {
      return Promise.reject(
        new Error('Cannot reach the server. Check your connection or try again later.'),
      );
    }

    return Promise.reject(error);
  },
);

export default api;