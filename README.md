# Unified CRM Frontend

React + Vite frontend for the Unified CRM Ticket System.

## Setup

```bash
npm install
cp .env.example .env
# Fill in VITE_API_BASE_URL and VITE_GOOGLE_CLIENT_ID in .env
npm run dev
```

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Backend base URL (e.g. `http://localhost:8000`) |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Client ID (display only) |

## Auth Flow

1. User visits `/login` → clicks "Continue with Google"
2. Frontend redirects to `GET /auth/login` (backend)
3. Backend redirects user through Google OAuth
4. Google redirects back to backend callback
5. Backend redirects to `GET /auth/callback?token=<JWT>&user=<encoded-json>`
6. Frontend saves token + user to localStorage, redirects to dashboard

## Routes

| Path | Description | Auth |
|---|---|---|
| `/login` | Google Sign-In page | Public |
| `/auth/callback` | OAuth callback handler | Public |
| `/admin/*` | Admin dashboard & management | Admin only |
| `/agent/*` | Agent dashboard & tickets | Agent + Admin |

## Project Structure

```
src/
├── components/     # Shared UI components
├── context/        # Auth context
├── layouts/        # Admin & Agent layouts (sidebar + navbar)
├── pages/          # Route pages
│   ├── auth/       # Login, Callback
│   ├── admin/      # Dashboard, Tickets, Accounts, Customers, Users, Settings
│   └── agent/      # Dashboard, MyTickets, Profile
├── services/       # API service modules (axios)
├── utils/          # Helpers (date format, badge classes, etc.)
└── styles/         # Global CSS
```
