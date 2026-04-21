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
