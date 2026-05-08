# CRM Frontend (React + Vite)

A modern React frontend for the CRM application built with Vite. This README explains how to set up, run, build, and configure the project (including Keycloak authentication and environment variables).

**Project**: Lightweight SPA using React 18, Vite, Keycloak for auth, Axios for API requests, and React Query for data fetching.

**Quick links**
- Source: [src](src)
- Keycloak integration: [src/auth/keycloak.js](src/auth/keycloak.js#L1)
- API client: [src/services/api.js](src/services/api.js#L1)

---

## Prerequisites

- Node.js 18+ (recommended) or latest LTS
- npm (or Yarn/pnpm) — `npm` examples are shown below
- A running backend API reachable from the frontend
- A Keycloak instance (self-hosted or managed) for authentication

---

## Install

Clone the repo and install dependencies:

```bash
git clone <repo-url>
cd crm-frontend-new
npm install
```

---

## Environment variables

This project uses Vite. Environment variables exposed to client code must be prefixed with `VITE_`.

Create a `.env` (or `.env.local`) in the project root with the values below (do NOT commit `.env` containing secrets):

```env
# .env (example)
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_KEYCLOAK_URL=https://auth.example.com/auth
VITE_KEYCLOAK_REALM=unified-crm
VITE_KEYCLOAK_CLIENT=crm-frontend

# Optional fallback for older setups (not recommended for new apps)
# REACT_APP_API_BASE_URL=http://localhost:8000/api/v1
```

What each variable means:
- `VITE_API_BASE_URL` — Base URL for backend API calls. Example: `https://api.my-crm.com/api/v1`.
- `VITE_KEYCLOAK_URL` — Keycloak server base URL (the `auth` root). Example: `https://auth.example.com/auth`.
- `VITE_KEYCLOAK_REALM` — Keycloak realm name (e.g., `unified-crm`). If not provided, the app defaults to `unified-crm`.
- `VITE_KEYCLOAK_CLIENT` — Keycloak client id used by the frontend. Default in code: `crm-frontend`.

Where to get these values:
- Keycloak URL: from your Keycloak admin console or your infra team.
- Realm: created in Keycloak admin console (e.g., `unified-crm`).
- Client ID: create or inspect an existing client in the realm.

Keycloak client configuration (recommended for SPA):
- Client protocol: `openid-connect`
- Access Type: `public` (or follow your security policy — if using confidential client, backend must handle tokens)
- Standard Flow: enabled (Authorization Code with PKCE is recommended for SPAs)
- Valid Redirect URIs: `http://localhost:3000/*` (and your production origin)
- Web Origins: `*` or explicit origins like `http://localhost:3000`
- If the app uses silent SSO, ensure `silent-check-sso.html` is accessible and added to valid redirect URIs or web origins.

Note: The app contains logic to dynamically resolve the realm for subdomains via the backend endpoint `/auth/realm-config` — see [src/auth/keycloak.js](src/auth/keycloak.js#L1).

---

## Available scripts

The `package.json` includes the following scripts:

```bash
npm run dev     # Run Vite dev server (default port 3000)
npm run build   # Build production assets
npm run preview # Serve production build locally for testing
```

Vite server configuration is set to run on port `3000` in `vite.config.js`.

---

## Run (development)

1. Ensure `.env` exists with required variables.
2. Start dev server:

```bash
npm run dev
```

Open your browser at `http://localhost:3000`.

---

## Build & Preview (production)

```bash
npm run build
npm run preview
```

The preview command serves the built files locally so you can verify before deploying.

---

## Important files & architecture notes

- `src/auth/keycloak.js` — Keycloak singleton and realm resolution logic. The file will read `VITE_KEYCLOAK_*` variables and optionally call the backend for tenant-to-realm mapping.
- `src/services/api.js` — Axios instance using `VITE_API_BASE_URL`. It attaches live Keycloak tokens to requests and centralizes error handling.
- `public/silent-check-sso.html` — (if present) used for silent SSO checks by Keycloak.
- UI components live under `src/components` and feature pages are under `src/pages`.

Links:
- Keycloak helper: [src/auth/keycloak.js](src/auth/keycloak.js#L1)
- API client: [src/services/api.js](src/services/api.js#L1)

---

## Troubleshooting

- 401s / redirects: Ensure Keycloak client `Valid Redirect URIs` and `Web Origins` include your frontend host.
- Token not attached: Confirm Keycloak is initializing and `VITE_KEYCLOAK_URL`, `VITE_KEYCLOAK_REALM`, and `VITE_KEYCLOAK_CLIENT` are correct.
- CORS errors: Make sure backend (`VITE_API_BASE_URL`) allows requests from frontend origin and sends appropriate CORS headers.
- Cannot reach server: Verify `VITE_API_BASE_URL` is reachable and not blocked by firewall.

Debugging tips:
- Enable dev logs by running with `NODE_ENV=development` (Vite sets this automatically in dev). The project uses `console.error` guarded by `process.env.NODE_ENV === 'development'` in `src/utils/errorParser.js`.

---

## Best practices

- Never commit `.env` or secrets to version control. Use environment-specific `.env.*` files or a secrets manager in CI/CD.
- Use Authorization Code with PKCE for SPAs in Keycloak when possible.
- Keep `VITE_` prefixed env vars for any client-side configuration.
- For production, serve the built assets from a CDN or static host and keep API and auth servers behind HTTPS.

---

## Deployment notes

- When deploying, set environment variables in your host (Netlify, Vercel, Docker, or your server) — do not bake secrets into the build artifacts.
- Ensure `VITE_API_BASE_URL` points to the production API and `VITE_KEYCLOAK_URL` points to your production Keycloak.

---

## Backend integration

This frontend expects a companion backend service that implements the Unified CRM API and Keycloak/realm-resolution endpoints. For smooth integration:

- Point `VITE_API_BASE_URL` at the backend API base (example: `https://api.example.com/api/v1`).
- The backend must expose `/api/v1/auth/realm-config` for subdomain → realm resolution (used by `src/auth/keycloak.js`).
- Ensure the backend's `FRONTEND_URL` or equivalent includes your frontend origin so invite links and redirects work (e.g., `http://localhost:3000` for local dev).
- Coordinate Keycloak settings: the backend will typically require `KEYCLOAK_ADMIN_CLIENT_ID` and `KEYCLOAK_ADMIN_CLIENT_SECRET` while the frontend uses `VITE_KEYCLOAK_CLIENT`.

Reference the backend README for full backend setup (DB, Infisical, migrations, and webhook configuration). If the backend lives in a sibling repo, link to its README (example):

- Backend README: ../backend/README.md  (or replace with your backend repo URL)

Quick verification after both services are running:

```bash
# backend health
curl ${VITE_API_BASE_URL:-http://localhost:8000}/health

# frontend dev
npm run dev
```


## Contributing

Feel free to open issues and PRs. Keep UI changes isolated to components, follow existing style, and include tests for non-trivial logic.

---

If you'd like, I can:
- Add a `README` section that documents how to run the frontend against a fake API for local development.
- Create a `.env.example` file with the sample variables.

---

Generated by project maintainer tooling.
# Unified CRM Frontend

React + Vite frontend for the Unified CRM Ticket System with multi-tenant support, role-based access control, and Keycloak OIDC authentication.

## Prerequisites

- Node 18+
- npm 9+
- Keycloak server instance
- Backend API server running

## Setup

```bash
npm install
npm run dev
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

| Variable | Required | Description | Example |
|---|---|---|---|
| `VITE_API_BASE_URL` | Yes | Backend API base URL | `http://localhost:8000` |
| `VITE_KEYCLOAK_URL` | Yes | Keycloak server URL | `http://localhost:8080` |
| `VITE_KEYCLOAK_REALM` | No | Keycloak realm name | `unified-crm` (default) |
| `VITE_KEYCLOAK_CLIENT` | No | Keycloak client ID | `crm-frontend` (default) |

**Note:** No `.env.example` file is committed; ensure you create `.env` manually before running the application.

## Authentication Flow

1. User visits `/login`
2. Frontend redirects to Keycloak login (OIDC + PKCE)
3. Keycloak authenticates user and returns JWT
4. Frontend stores JWT and user info in localStorage
5. User is redirected to dashboard based on role (admin/agent/superadmin)
6. JWT automatically refreshed on expiry via AuthContext

## Routes

### Public Routes
| Path | Description |
|---|---|
| `/login` | Keycloak login redirect |
| `/auth/callback` | OIDC callback handler |
| `/invite/:inviteToken` | Agent/Admin invite acceptance page |

### Protected Routes (Role-Based)
| Path | Description | Roles |
|---|---|---|
| `/admin/*` | Admin dashboard & management | Admin, Superadmin |
| `/agent/*` | Agent dashboard & tickets | Agent, Admin |
| `/superadmin/*` | Platform & tenant management | Superadmin only |

## Project Structure

```
src/
├── auth/               # Keycloak configuration & OIDC setup
├── components/         # Shared UI components (modals, tables, filters, charts)
├── context/            # Global auth state & token refresh
├── layouts/            # Layout shells (AdminLayout, AgentLayout, SuperAdminLayout)
├── pages/              # Route pages organized by role
│   ├── auth/           # Login, callback, invite
│   ├── admin/          # Tickets, customers, agents, dashboard, settings
│   ├── agent/          # Dashboard, my tickets, profile
│   └── superadmin/     # Tenants, admins, dashboard, settings
├── services/           # API layer (ticketService, agentService, etc.)
│   └── api.js          # Axios instance with auth interceptor
├── utils/              # Helpers (formatters, normalizers, role permissions)
├── constants/          # Shared constants & options
└── styles/             # Global CSS
```

## Authentication & Authorization

- **Keycloak OIDC:** Primary authentication mechanism with PKCE flow
- **JWT Tokens:** Stored in localStorage; automatically refreshed on expiry
- **Multi-Tenant:** Realm-per-tenant strategy; admin users can manage multiple tenants
- **Role-Based Access:** SuperAdmin → Admin → Agent hierarchy; routes protected via ProtectedRoute component

## Data Layer

- **React Query:** TanStack React Query for server state management, automatic caching, and background refetching
- **Axios:** HTTP client with built-in auth token interceptor and error normalization
- **Service Layer:** Dedicated services (ticketService, agentService, superAdminService, etc.) abstract all API contracts

## Development

```bash
npm run dev          # Start Vite dev server (http://localhost:5173)
npm run build        # Build for production
npm run preview      # Preview production build

```

## Key Features

- **Multi-Tenant:** Support for multiple Keycloak realms; organizations isolated by realm
- **Role-Based Permissions:** Admin and Agent roles with different feature access and field visibility
- **Ticket Management:** Create, edit, comment on tickets with multi-source CRM sync (EspoCRM, Zammad, etc.)
- **Agent Management:** Invite agents, manage profiles, assign tickets
- **Dashboard:** Role-specific KPI cards and charts powered by Recharts
- **Real-Time Sync:** CRM sync on page load + 30s polling for ticket changes

## Notes

- This is a frontend-only project; no Python dependencies required
- Old auth flow (Google OAuth) has been replaced with Keycloak OIDC
- Keycloak realm can be resolved dynamically from subdomain or environment variable
- Agent invitations generate unique tokens; recipients can accept invites via `/invite/:token`
```
