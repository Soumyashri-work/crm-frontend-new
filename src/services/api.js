/**
 * services/api.js
 *
 * Axios instance pre-configured to talk to the UnifiedCRM backend.
 *
 * Base URL is read from the environment variable:
 *   VITE_API_BASE_URL  (Vite)
 *   REACT_APP_API_BASE_URL  (Create React App)
 *
 * If neither is set, falls back to http://localhost:8000/api/v1
 *
 * Setup:
 *   1. Create a .env file in your frontend root
 *   2. Add: VITE_API_BASE_URL=http://localhost:8000/api/v1
 *   3. Import this file wherever you need to call the backend
 */

import axios from 'axios';

// ---------------------------------------------------------------------------
// Base URL — reads from .env, falls back to local backend
// ---------------------------------------------------------------------------
const BASE_URL =
  import.meta.env?.VITE_API_BASE_URL ||        // Vite
  (typeof process !== 'undefined' ? process.env?.REACT_APP_API_BASE_URL : undefined) || // CRA (guarded)
  'http://localhost:8000/api/v1';

// ---------------------------------------------------------------------------
// Axios instance
// ---------------------------------------------------------------------------
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,                               // 30s — syncs can be slow
  headers: {
    'Content-Type': 'application/json',
    'Accept':       'application/json',
  },
});

// ---------------------------------------------------------------------------
// Request interceptor
// Attach JWT token from localStorage if present (ready for auth later)
// ---------------------------------------------------------------------------
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ---------------------------------------------------------------------------
// Response interceptor
// Normalises errors so callers always get a clean Error object
// ---------------------------------------------------------------------------
api.interceptors.response.use(
  (response) => response,

  (error) => {
    if (error.response) {
      // Server responded with a non-2xx status
      const body    = error.response.data;
      const message = body?.message || body?.detail || `Error ${error.response.status}`;
      const err     = new Error(message);
      err.status    = error.response.status;
      err.data      = body?.data ?? null;
      return Promise.reject(err);
    }

    if (error.request) {
      // Request was made but no response — backend down or network issue
      return Promise.reject(
        new Error('Cannot reach the server. Check your connection or try again later.')
      );
    }

    // Something else went wrong building the request
    return Promise.reject(error);
  },
);

export default api;