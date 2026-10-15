# Banking System — Frontend

Frontend for a web-based banking system (Web Development final project, Group 7, Section C3A).
The backend is a separate repo (Node.js + Express + MongoDB). This repo is the React client only.

## Tech stack

- Vite + React (JavaScript, **not** TypeScript)
- Tailwind CSS (no other CSS or UI libraries unless the team agrees)
- React Router
- Axios

## Project status

- **The UI design is NOT final.** Keep pages and layouts minimal and unstyled: headings, placeholder text, and basic working forms. Do not add custom colors, cards, or polished layouts until the team finalizes the design.
- **The backend is not ready yet.** All API calls go through the mock layer (see below).

## Folder structure

```
src/
  api/          axios instance + one file per resource (auth, accounts, transactions, notifications, users, admin)
  mocks/        mock data used when VITE_USE_MOCK=true
  context/      AuthContext (user, token, role, login, logout)
  components/   shared components (Navbar, ProtectedRoute, etc.)
  layouts/      CustomerLayout, StaffLayout, AdminLayout
  pages/
    auth/       Login, Register
    customer/   customer pages
    staff/      staff pages
    admin/      admin pages
  utils/        helpers such as formatPeso()
```

## Rules

- **Pages never call axios directly.** They call functions in `src/api/`. Only the api files know whether data is mocked or real.
- **Mock switch:** every api function checks `import.meta.env.VITE_USE_MOCK`. If it's `"true"`, return mock data after a short delay; otherwise call the real endpoint. Mock responses must have exactly the same shape as real ones.
- **Response shape** (from the backend, and from mocks):
  - success: `{ success: true, data: ... }`
  - error: `{ success: false, message: "..." }`
- **Auth:** a JWT is stored in localStorage and sent as `Authorization: Bearer <token>`. Logout clears the token on the client.
- **Money:** all amounts are integers in **centavos** (₱150.25 = `15025`). Always display with `formatPeso()`. Never use floats for money.
- **Dates:** ISO strings from the API.
- **Environment variables** live in `.env` (gitignored). See `.env.example`:
  - `VITE_API_URL=http://localhost:5000/api`
  - `VITE_USE_MOCK=true`

## Roles and routing

- `/login` and `/register` are public. Registration is for customers only.
- `/customer/*`, `/staff/*`, and `/admin/*` are protected by `ProtectedRoute` and the user's role.
- After login, redirect to the dashboard for the user's role.

| Role | What they do |
|---|---|
| customer | View their account and balance, cash in, transfer, view transaction history, cancel own pending transactions, manage profile and notification preferences, view and clear notifications |
| staff | View customers and accounts, verify customers, view all transactions, flag or cancel suspicious transactions, freeze or reactivate accounts |
| admin | Everything staff can view, plus create staff accounts, change user roles and status, view audit logs and notification logs |

## Domain decisions

- **One bank account per customer**, created automatically on registration.
- **Transactions have only two types: `cash_in` and `transfer`.** There is **no cash-out or withdrawal** feature. Do not create functions, mock data, or UI for it.
  - `cash_in`: adds simulated funds to the customer's own account (no real money).
  - `transfer`: sends funds to another account by account number. Must check: amount > 0, sufficient balance, both accounts active, not the same account.
- **Transaction statuses:** `pending`, `completed`, `failed`, `cancelled`, `flagged`.
- **Account statuses:** `active`, `frozen`, `closed`.
- **User statuses:** `active`, `deactivated`, `disabled`, `closed`.

## Backend endpoints (base: `VITE_API_URL`)

**Auth**
- `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`

**Customer profile**
- `PATCH /users/me` (name, email, contact number)
- `PATCH /users/me/password`
- `PATCH /users/me/notification-preferences`
- `PATCH /users/me/deactivate`

**Accounts**
- `GET /accounts/me`, `GET /accounts/me/balance`, `GET /accounts/:id`

**Transactions**
- `POST /transactions/cash-in`
- `POST /transactions/transfer`
- `GET /transactions`
- `GET /transactions/:id`
- `PATCH /transactions/:id/cancel`

**Notifications**
- `GET /notifications`
- `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`
- `DELETE /notifications/:id`, `DELETE /notifications`

**Admin / staff**
- `POST /admin/staff` (admin)
- `GET /admin/users`, `GET /admin/users/:id` (admin, staff)
- `PATCH /admin/users/:id/status` (admin)
- `PATCH /admin/users/:id/role` (admin)
- `PATCH /admin/users/:id/verify` (admin, staff)
- `GET /admin/accounts`, `PATCH /admin/accounts/:id/status` (admin, staff)
- `GET /admin/transactions`, `PATCH /admin/transactions/:id/status` (admin, staff)
- `GET /admin/audit-logs`, `GET /admin/notifications` (admin)

If an endpoint or field changes, update this file and tell the backend pair, so both repos stay in sync.

## Git workflow

- `main` is protected; work on `dev`.
- Use feature branches (e.g., `feature/transfer-page`) and merge through pull requests reviewed by your frontend partner.
- Never commit `.env`.
