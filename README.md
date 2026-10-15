# Banking System Frontend

Frontend for the MERN banking system final project. Vite + React (JavaScript), Tailwind CSS v4, React Router, Axios.

## Setup

1. Install Node.js 20+.
2. Install dependencies: `npm install`
3. Create your env file: `cp .env.example .env` (on Windows PowerShell: `Copy-Item .env.example .env`)
4. Start the dev server: `npm run dev` and open the printed URL (usually http://localhost:5173).

Other scripts: `npm run build`, `npm run preview`, `npm run lint` (ESLint).

## Environment variables

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | Backend base URL, e.g. `http://localhost:5000/api` |
| `VITE_USE_MOCK` | `true` = every API function returns mock data from `src/mocks/`; anything else calls the real backend |

`.env` is git-ignored; `.env.example` is committed. Restart the dev server after changing `.env`.

## Mock login

With `VITE_USE_MOCK=true` any password works for these emails:

| Role | Email | Dashboard |
| --- | --- | --- |
| customer | customer@bank.test | /customer |
| staff | staff@bank.test | /staff |
| admin | admin@bank.test | /admin |

Registering creates a new customer. Mock data lives in memory and resets on page reload.

## Structure

```
src/
  api/          axios instance (adds Bearer token) + auth, accounts, users, transactions, notifications, admin
  mocks/        mock users, accounts, transactions, notifications
  context/      AuthContext (user, token, role, login, register, logout)
  components/   Navbar, ProtectedRoute
  layouts/      CustomerLayout, StaffLayout, AdminLayout
  pages/        auth/, customer/, staff/, admin/
  utils/        formatPeso
```

## Conventions

- **Money is an integer in centavos** (₱1,234.56 = `123456`). Display with `formatPeso()` from `src/utils/formatPeso.js`.
- **Transactions have two types only:** `cash_in` (simulated funds into your own account) and `transfer` (to another account number). There is no cash-out/withdrawal.
- Every API function returns `{ success: true, data }` in mock mode, and is expected to return the same shape from the real backend.
- Routes: `/login` and `/register` are public; `/customer/*`, `/staff/*`, `/admin/*` require the matching role.
- The UI is intentionally unstyled for now; Tailwind is installed and ready.
