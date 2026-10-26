# Banking System — Frontend

Frontend for a web-based banking system (Web Development final project, Group 7, Section C3A).
The backend is a separate repo (Node.js + Express + MongoDB). This repo is the React client only.

## Tech stack

- Vite + React (JavaScript, **not** TypeScript)
- Tailwind CSS (no other CSS or UI libraries unless the team agrees)
- React Router
- Axios

## Project status

- **The customer UI design is approved.** The team signed off on the customer dashboard mockup (sidebar nav, balance card, account card, monthly money in/out, recent transactions, quick transfer). Build customer pages to match it, using the design tokens in `src/index.css` (add new colors there as tokens, not raw hex in components) and the shared components in `src/components/ui/`. Staff and admin pages stay minimal and unstyled until their designs are approved.
- **The backend is not ready yet.** All API calls go through the mock layer (see below).

## Folder structure

```
src/
  api/          axios instance + one file per resource (auth, accounts, transactions, notifications, users, admin)
  mocks/        mock data used when VITE_USE_MOCK=true
  context/      AuthContext (user, token, role, login, logout), PrivacyContext (hide balance and account details)
  components/   shared components (Navbar, ProtectedRoute, etc.)
    ui/         reusable pieces: Button, Card, Input, Modal, Toast, StatusBadge, Amount, Sensitive, Skeleton, icons
    customer/   customer dashboard pieces (Sidebar, Header, AccountCard, TransactionRow, QuickTransfer, ...)
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
- **Mock scenarios:** with `VITE_USE_MOCK=true`, open any page with `?scenario=frozen` (frozen account) or `?scenario=new` (brand-new customer) to see those states. `?scenario=default` turns it off.
- **Voice:** English is the main language. Light Taglish touches go only in warm moments (greeting, success messages, empty states, a few labels like "Net ngayong buwan"), with `lang="fil"` on the Filipino words. Errors, frozen or held states, and anything about money rules stay in plain English. Have a Filipino speaker check new strings.
- **Page titles:** each customer page's title lives in `src/components/customer/pageTitles.js` and shows in the header's left slot (the overview shows the greeting there instead). Pages don't draw their own big heading; when you add a customer page, add its title to that file.
- **Private values:** wrap balances, account numbers and totals in `<Sensitive>` so the dashboard's "hide details" eye button covers them all.
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

| Role     | What they do                                                                                                                                                                            |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| customer | View their account and balance, cash in, transfer, view transaction history, cancel own pending transactions, manage profile and notification preferences, view and clear notifications |
| staff    | View customers and accounts, verify customers, view all transactions, flag or cancel suspicious transactions, freeze or reactivate accounts                                             |
| admin    | Everything staff can view, plus create staff accounts, change user roles and status, view audit logs and notification logs                                                              |

## Domain decisions

- **One bank account per customer**, created automatically on registration.
- **Transactions have only two types: `cash_in` and `transfer`.** There is **no cash-out or withdrawal** feature. Do not create functions, mock data, or UI for it.
  - `cash_in`: adds simulated funds to the customer's own account (no real money).
  - `transfer`: sends funds to another account by account number. Must check: amount > 0, sufficient balance, both accounts active, not the same account.
  - Transfers complete immediately unless held for review (`holdForReview: true`, or at/above a backend limit that is still being confirmed). A held transfer is `pending` with `flagReason: "Held for staff review"`: the sender is already charged, the recipient isn't credited yet.
  - Only the sender can cancel, and only a `pending` transfer; the amount is refunded to the sender.
  - Customers don't see incoming transfers until they're `completed`.
- **Transaction statuses:** `pending`, `completed`, `failed`, `cancelled`, `flagged`.
- **Account statuses:** `active`, `frozen`, `closed`.
- **User statuses:** `active`, `deactivated` (by the customer), `disabled` or `closed` (by an admin).
- **Cancelled transactions are never deleted.** They stay on record with status `cancelled`.

## Data shapes (from the backend's Mongoose schemas)

Mock data must use these exact field names. IDs are strings (`_id`); dates are ISO strings; amounts and balances are integers in centavos.

- **User:** `_id`, `name`, `email`, `contactNumber` (optional; omitted when not set, never sent as `""`), `role` (`customer` | `staff` | `admin`), `status`, `isVerified` (boolean), `notificationPreferences` (`{ email: true, sms: false }`), `createdAt`, `updatedAt`. Never expose `passwordHash`.
- **BankAccount:** `_id`, `accountNumber` (12 digits, no spaces; format only for display), `owner` (user `_id`), `balance`, `status` (`active` | `frozen` | `closed`), `createdAt`, `updatedAt`.
- **Transaction:** `_id`, `referenceNumber`, `transactionType` (`cash_in` | `transfer`), `amount`, `sourceAccount` (empty for `cash_in`), `destinationAccount` (customer responses carry each account as `{ _id, accountNumber }`; this is an **assumption to confirm with the backend**, handled only in `src/utils/transactions.js`), `performedBy` (user `_id`), `status`, `flagReason` (`null` unless flagged or held for review), `createdAt`, `updatedAt`.
- **Notification:** `_id`, `recipient` (user `_id`), `type` (`transaction` | `account` | `security` | `system`), `message`, `relatedTransaction` (optional), `isRead` (boolean), `createdAt`.
- **AuditLog:** `_id`, `actor` (user `_id`), `action`, `targetType` (`User` | `BankAccount` | `Transaction`), `targetId`, `createdAt`.

## Backend endpoints (base: `VITE_API_URL`)

**Auth**

- `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`

**Customer profile**

- `PATCH /users/me` (name, email, contact number)
- `PATCH /users/me/password`
- `PATCH /users/me/notification-preferences`
- `PATCH /users/me/deactivate`

**Accounts**

- `GET /accounts/me`
- `GET /accounts/me/balance` → `{ accountNumber, balance, status }`
- `GET /accounts/lookup/:accountNumber` (checks a transfer recipient; assumed response `{ accountNumber, displayName, initials }`, to be confirmed)
- `GET /accounts/:id` (customers: own account only)

**Transactions**

- `POST /transactions/cash-in`
- `POST /transactions/transfer` with `{ recipientAccountNumber, amount, holdForReview? }`
- `GET /transactions` with `?status=&type=&page=&limit=` (also `search`, `days`/`period`; values to be confirmed) → `data: { transactions, pagination: { page, limit, total, totalPages }, counts: { all, completed, pending, failed, cancelled, flagged }, summary: { moneyInThisMonth, moneyOutThisMonth } }`
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
