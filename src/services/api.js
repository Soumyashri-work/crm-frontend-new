/**
 * src/services/api.js  — Enhanced with validation error parsing
 *
 * Changes:
 * - Request interceptor attaches live Keycloak token
 * - Response interceptor now uses centralized error parsing
 * - Validation errors (422) are handled with field-level error extraction
 * - Better error normalization for forms and components
 */

import axios from 'axios';
import { getKeycloak } from '../auth/keycloak';
import { logError } from '../utils/errorParser';

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
// Response interceptor — normalize errors + handle 401 (session expired)
// ---------------------------------------------------------------------------
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response) {
      const { status, data } = error.response;

      // Session expired — redirect to Keycloak login
      if (status === 401) {
        logError(error, 'API 401 - Session Expired');
        try {
          const kc = await getKeycloak();
          if (kc) { kc.login(); return; }
        } catch { /* ignore */ }
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }

      // Extract error details based on error type
      let detail = data?.detail;
      let message = data?.message;
      
      if (typeof detail === 'string') {
        message = detail;
      } else if (typeof message !== 'string') {
        message = detail && typeof detail === 'object'
          ? detail.message ?? JSON.stringify(detail)
          : `Error ${status}`;
      }

      // Log error for debugging
      logError(error, `API ${status} - ${message}`);

      // Create error object that preserves response structure for components
      const err = new Error(message);
      err.status = status;
      err.response = error.response;
      err.data = data;
      
      return Promise.reject(err);
    }

    if (error.request) {
      const err = new Error('Cannot reach the server. Check your connection or try again later.');
      logError(error, 'API Network Error');
      return Promise.reject(err);
    }

    return Promise.reject(error);
  },
);

export default api;