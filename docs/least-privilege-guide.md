# Least-Privilege Alignment Guide

Banking System · Group 7, C3A · October 28, 2026

This guide splits the **admin** and **staff** roles so that neither can do the other's job. It's a plan for the whole team. Nothing in it has been built yet.

## How to use this guide

1. **Everyone:** read [The principle](#the-principle) and the [Permission matrix](#permission-matrix).
2. **Everyone:** settle the four [Open decisions](#open-decisions). Each has a recommended answer, so you can just agree or pick the other option.
3. **Then each pair** works through its own part of the [Checklist](#checklist):
   - **Backend pair:** [API changes](#api-changes), [Transaction review rules](#transaction-review-rules), [Notification messages](#notification-messages) and [Backend guardrails](#backend-guardrails).
   - **Frontend pair:** [Frontend changes](#frontend-changes).
4. When something changes, update this file and the frontend `CLAUDE.md` so both repos stay in sync.

The "Before" columns describe the backend's `dev` branch as of October 28, 2026.

### Changes from v1

- Staff can now **approve** held transfers, not only flag or cancel them.
- **Roles can no longer be changed.** Admin creates staff accounts, and removes access by changing a user's status.
- The endpoint table covers the review and freeze routes the backend already has.
- The middleware section uses the backend's existing `protect` and `authorize`.
- New sections: transaction review rules, notification messages, and known limits.
- New open decision: password resets for staff accounts.
- **Closing a customer is a staff action.** Staff close the bank account, and that closes the customer's user too. Admin only closes staff users. Disabling and re-enabling users is dropped to keep the scope small.
- Checklist items already done in the code are ticked.

---

## The principle

Admin manages the platform and the people on it. Staff run the banking operations. Neither role can do the other's job.

Right now, every staff endpoint is also open to admin, so admin can do everything staff can. This guide removes that overlap. It follows two principles:

- **Least privilege:** each role gets only what its job needs.
- **Separation of duties:** no single role can both grant access and move money.

The three roles:

- **Admin:** IT and platform work. Creating and closing staff accounts, credential recovery and audit review.
- **Staff:** bank officers. The customer's whole life cycle: verification, bank accounts (including closing them), and transactions.
- **Customer:** unchanged.

Why it matters: a compromised admin account can't touch funds, and a staff member can't give themselves more access.

## Permission matrix

The biggest change is that admin loses every money-related action and every view of money data. Staff lose nothing they need.

| Action | Admin | Staff | Customer |
| --- | --- | --- | --- |
| Create staff accounts | Yes | No | No |
| Close a staff account permanently | Yes | No | No |
| Reset a user's password (see open decision 4) | Yes | No | No |
| View user list | All users, identity and access fields only | Customers only, with bank account info | No |
| Verify a customer | No | Yes | No |
| View all bank accounts | No | Yes | Own only |
| Freeze or reactivate a bank account (the customer can still log in, but no money moves) | No | Yes | No |
| Close a bank account (closes the customer's login too) | No | Yes | No |
| View all transactions | No | Yes | Own only |
| Approve a held transfer | No | Yes | No |
| Flag or cancel a transaction | No | Yes | Cancel own pending only |
| Cash-in and transfer | No | No | Yes |
| View audit logs | Yes, read-only | No | No |
| View notification logs for all users | Metadata only, no message text | No | Own only |
| Edit or delete audit logs | No | No | No |

Admin keeps oversight through the audit log. Every staff action is recorded there, so admin can review what staff did without being able to do it.

**Roles are fixed when an account is created.**

- Customers sign up through registration.
- Admin creates staff accounts with `POST /admin/staff`.
- Admin accounts come from the seed script.

No one can change a role afterwards. To remove someone's staff access, admin closes their account. If a customer is hired as staff, they get a separate staff account with a work email, and their customer account stays as it is.

**Who closes what.**

- **A customer** is closed by **staff**, by closing their bank account (see [Closing a customer](#closing-a-customer)). Each customer has exactly one bank account, so closing it closes their user too. Staff verify customers when they join, so staff also close them when they leave.
- **A staff account** is closed permanently by **admin**.
- **Nobody disables or re-enables users.** That feature is dropped to keep the scope small. The only temporary lock is a **freeze**, by staff, on a bank account: the customer can still log in and see their account, but they can't cash in, send or receive money until staff reactivate it.
- A customer's own deactivation (`PATCH /users/me/deactivate`) is separate and unchanged.

The user statuses in use are therefore `active`, `deactivated` (by the customer) and `closed`. `disabled` is no longer set by anything.

## Data visibility

Each endpoint returns only the fields that role's job needs (data minimization). No endpoint ever returns `passwordHash`.

| Endpoint | Fields returned | Fields left out |
| --- | --- | --- |
| Admin user list and detail | name, email, contactNumber, role, status, isVerified, createdAt, updatedAt | balance, account number, transactions, notificationPreferences, passwordHash |
| Admin notification log | recipient, type, isRead, createdAt | message (it can contain amounts), relatedTransaction |
| Staff customer list | name, email, contactNumber, status, isVerified, plus the bank account's accountNumber and account status | balance, staff and admin users, role, notificationPreferences, passwordHash |
| Staff customer detail | Everything in the list, plus the bank account's balance | staff and admin users, role, notificationPreferences, passwordHash |
| Customer own profile | Everything about themselves except passwordHash | Other users' data |

The balance is on the detail view only, because verifying a customer or freezing an account from the list doesn't need it.

In the backend, select fields explicitly instead of returning whole documents:

```js
User.find().select("name email contactNumber role status isVerified createdAt updatedAt");
```

For the staff customer list, filter with `{ role: "customer" }` and join each user's BankAccount through the `owner` field.

## API changes

The operational endpoints move to a new staff-only `/api/staff/*`, and `/api/admin/*` becomes admin-only. The auth, customer profile and notification endpoints don't change.

**Built** means the route exists in the backend's `dev` branch. **Planned** means it's in the docs but not built yet.

| Change | Before | After | Access |
| --- | --- | --- | --- |
| Moved | GET /admin/users, customers only (planned) | GET /staff/customers | Staff |
| Moved | GET /admin/users/:id, customers only (planned) | GET /staff/customers/:id | Staff |
| Moved | PATCH /admin/users/:id/verify (planned) | PATCH /staff/customers/:id/verify | Staff |
| Moved | GET /admin/accounts (planned) | GET /staff/accounts | Staff |
| Replaced | PATCH /accounts/:id/freeze and /unfreeze (built, staff and admin) | PATCH /staff/accounts/:id/status with `{ status, reason }` (freeze, reactivate or close) | Staff |
| Moved | GET /admin/transactions (built, staff and admin) | GET /staff/transactions | Staff |
| Moved | PATCH /admin/transactions/:id/status (built, staff and admin) | PATCH /staff/transactions/:id/status with `{ status, reason }` | Staff |
| Removed | PATCH /transactions/:id/approve and /reject (built, staff and admin) | Use PATCH /staff/transactions/:id/status | None |
| Removed | GET /transactions/review/pending (built, staff and admin) | Use GET /staff/transactions?status=pending | None |
| Removed | PATCH /admin/users/:id/role (planned) | None: roles are fixed at creation | None |
| Narrowed | GET /admin/users and /admin/users/:id (planned, admin and staff) | Same paths, identity and access fields only | Admin |
| Narrowed | GET /admin/notifications (built) | Same path, metadata only, no message | Admin |
| Kept | POST /admin/staff | Unchanged | Admin |
| Narrowed | PATCH /admin/users/:id/status (planned) | Only `{ status: "closed" }`, and only for staff users | Admin |
| Kept | GET /admin/audit-logs | Unchanged | Admin |
| New | None | PATCH /admin/users/:id/reset-password | Admin |
| Updated | GET /accounts/:id (built: customer, staff, admin) | Owner or staff; admin not allowed | Owner, staff |
| Updated | GET /transactions/:id (built: customer, staff, admin) | Owner or staff; admin not allowed | Owner, staff |

**Freezing:**

- `PATCH /staff/accounts/:id/status` takes `{ status: "frozen" | "active" | "closed", reason }`.
- `reason` is required when freezing, as the current freeze route already requires.
- A `closed` account can't be frozen or reactivated.

### Closing a customer

Staff close a customer with `PATCH /staff/accounts/:id/status` and `{ status: "closed", reason }`. Closing means the bank account will never be used again, so nothing may be left in it or on its way.

The backend refuses unless **all** of these are true:

- The balance is exactly ₱0.00. There's no cash-out, so the customer moves any money out with a transfer first.
- No transfer is `pending` or `flagged` in **either** direction: none sent from this account, and none held on its way in. (An incoming held transfer would otherwise be approved into a closed account.)
- A `reason` is given.
- The account isn't already `closed`. A frozen account can be closed if it meets the rules above.

When it succeeds, in one session:

- The bank account's `status` becomes `closed`, and the owner's user `status` becomes `closed`. They can't log in, and any existing token is rejected.
- Both are permanent. Nothing can reopen them, and all their transactions stay on record.
- The customer gets an `account` notification. The audit log gets an `account.status_update` entry.
- The customer's email stays taken (emails are unique and the closed user is kept), so they can't register again with it.

The frontend asks staff to type the account number to confirm, because this can't be undone.

**Reset password:**

- Sets a temporary password and marks the user `mustChangePassword: true`. The user must set a new password at their next login.
- Writes an AuditLog entry.
- Sends the user a `security` notification.
- The response never contains the old or new password hash.
- How the temporary password reaches the user, and whether admin can reset staff passwords, is open decision 4.

## Transaction review rules

Staff review held and flagged transfers through `PATCH /staff/transactions/:id/status`. The request body field is `reason`, and the backend saves it as `flagReason`.

| Action | Body | Allowed from | Effect |
| --- | --- | --- | --- |
| Approve | `{ status: "completed", reason? }` | `pending` or `flagged` transfer | Credit the recipient. Notify the sender and the recipient. |
| Cancel | `{ status: "cancelled", reason? }` | `pending` or `flagged` transfer | Refund the sender. Notify the sender. |
| Flag | `{ status: "flagged", reason }` | `pending` transfer only | No money moves. Notify the sender that the transfer is under review. |

- Today the backend only approves or cancels `pending` transfers, but flags anything. A flagged transfer therefore can't be approved or cancelled, and the sender's money stays held. These rules fix that.
- `failed` is for system errors. Staff use `cancelled`.
- Cash-ins and finished transactions (`completed`, `cancelled`, `failed`) can't be reviewed.

## Notification messages

Notification messages never contain a full account number. Write "account ending 1234" instead.

These backend messages currently show the full number:

- the approve messages in `transactionController.js`
- the freeze and unfreeze messages in `accountController.js`

## Backend guardrails

Check roles in middleware on every route. Hiding a button on the frontend is not security.

The backend already has the middleware: `protect` and `authorize(...roles)` in `src/middleware/auth.js`. Don't add a second one. Mount the routers with it:

```js
// app.js
import { protect, authorize } from "./middleware/auth.js";

app.use("/api/admin", protect, authorize("admin"), adminRoutes);
app.use("/api/staff", protect, authorize("staff"), staffRoutes);
```

Every backend route must follow these rules:

1. Admin can only close **staff** users, and can't close themselves. `PATCH /admin/users/:id/status` accepts only `closed`, refuses customers and admins, and returns 403 if `req.user._id` matches `:id`.
2. No endpoint changes a user's role. Registration always creates a `customer`, `POST /admin/staff` always creates `staff`, and admin accounts come from the seed script (`src/seed/createAdmin.js`), never through the API.
3. A user whose status isn't `active` can't log in, and their existing token is rejected. **Already done:** `protect` checks `status` on every request.
4. Audit logs are append-only. No update or delete endpoint exists for anyone.
5. These actions each write an AuditLog entry, with these action names (the frontend already expects them):

   | Action | `action` |
   | --- | --- |
   | Create staff | `staff.create` |
   | Close a staff account | `user.status_update` |
   | Reset password | `user.password_reset` |
   | Verify customer | `user.verify` |
   | Freeze, reactivate or close an account | `account.status_update` |
   | Approve, flag or cancel a transaction | `transaction.status_update` |

   No AuditLog model or helper exists yet. Add one helper, `logAction(actor, action, targetType, targetId)`, and call it inside each action, in the same session as the change.
6. `/accounts/:id` and `/transactions/:id` allow the request only if the requester owns the record or is staff. Everyone else gets 403.
7. A frozen or closed bank account can't send or receive transfers or cash-ins.
8. Never return `passwordHash`. Set `select: false` on it in the User schema.
9. Only staff close a customer, and only through `PATCH /staff/accounts/:id/status` with the rules in [Closing a customer](#closing-a-customer).

## Frontend changes

The admin and staff areas stop sharing pages. Each layout shows only its own role's tools.

| Area | Pages |
| --- | --- |
| `/admin/*` (AdminLayout) | Overview (users, staff and audit activity, no money data), Users (list and detail, no balances, with Reset password; Close permanently for staff users only, no other status actions), Create staff, Audit logs, Notification logs (metadata only) |
| `/staff/*` (StaffLayout) | Overview, Customers (list, and detail with the bank account), Verify customer, Accounts (freeze, reactivate or close), Transactions (approve, flag or cancel) |
| `/customer/*` | Unchanged |

- `ProtectedRoute` already allows exactly one role per area. Admin can't open `/staff/*`, and staff can't open `/admin/*`. No change needed.
- Split `src/api/admin.js` into `admin.js` and `staff.js` to match the new paths.
- Split the mocks the same way. Admin mock users have no balance or account number fields. Staff mock customers include them.
- Rebuild the admin overview (`src/pages/admin/Dashboard.jsx`). Today it loads every transaction and account, shows amounts, and opens the verify and review modals. Removing buttons isn't enough.
- Remove Accounts and Transactions from the admin sidebar (`src/components/admin/Sidebar.jsx`) and from the admin routes in `src/App.jsx`.
- Move `VerifyCustomerModal` and `ReviewTransactionModal` to the staff pages only.
- Remove the change-role UI (see the checklist).

## Known limits

These are accepted on purpose. Be ready to explain them if the panel asks.

- **Admin can create a staff account for themselves.** An admin could create a staff account under another email and use it to move money. The audit log records every `staff.create`, so this is detected, not prevented. Preventing it would need a second person to approve new staff accounts, which is out of scope.
- **Audit review happens after the fact.** Admin can see what staff did, but can't stop it while it happens.
- **There's no way to lock a customer's login.** Disabling users was dropped. If a customer's password is stolen, staff **freeze** the bank account so no money can move, and the password is reset (see open decision 4). The thief can still log in and see the balance until the password changes.

## Open decisions

The team needs to answer these before updating the proposal. Each has a recommendation.

1. **Global banking configuration.** The Roles section says admin maintains it, but nothing implements it.
   - Option A: add a `Settings` model (for example, the transfer approval threshold and a max cash-in amount) with `GET` and `PATCH /admin/settings`.
   - Option B: remove that phrase from the admin role description.
   - **Recommended: B.** The ₱50,000 approval threshold stays fixed in code.
2. **Support tickets.** No ticket system exists.
   - Option A: keep it out of scope and add this line to the proposal: "Customer support requests are handled outside the system; resulting actions are performed through admin/staff tools and recorded in the audit log."
   - Option B: add a `SupportTicket` model that routes each ticket by category. Account access and technical tickets go to admin; transaction and account tickets go to staff. This adds about six endpoints and three pages. Locked-out customers would need a public form, or that case stays offline.
   - **Recommended: A.**
3. **Admin reading transactions.** This guide gives admin no transaction access. If the team wants admin to help debug transaction issues, the only acceptable middle ground is read-only access without amounts or account numbers.
   - **Recommended: no access.** Admin reviews staff actions through the audit log.
4. **Password resets for staff accounts.** If admin can reset a staff member's password, admin knows the temporary password and can log in as that staff member to move money. That breaks the separation of duties. There's also no email system, so the temporary password has no automatic way to reach the user.
   - Option A: admin can reset **customer** passwords only. A staff password is reset with the seed script by a team member with server access, and the reset is logged.
   - Option B: admin can reset anyone. The user must change the password at their next login and gets a `security` notification. Accept the risk and add it to Known limits.
   - **Recommended: A.** For delivery, admin sees the temporary password once and gives it to the customer in person.

Whatever you decide, update the Roles section of the proposal to match the endpoints. A panel will ask where the admin does each duty listed there.

## Checklist

Settle the open decisions first. Then each pair works through its own list.

### Whole team

- [ ] Decide open decisions 1 to 4
- [ ] Update the proposal: the Roles section (remove "change user roles"), the endpoint tables, the reset-password endpoint and the known limits
- [ ] Update the frontend `CLAUDE.md`: the role table (admin no longer has "everything staff can view" or "change user roles"), the endpoint list, and the transaction review rules

### Backend pair

- [ ] Mount `/api/admin` and `/api/staff` with the existing `protect` and `authorize`
- [ ] Move the operational endpoints to `/staff/*`, and remove the old freeze, approve, reject and review routes
- [ ] Build the planned endpoints: customers, verify, accounts, and the admin user list
- [ ] Apply the transaction review rules (approve and cancel from `pending` or `flagged`; flag from `pending` only)
- [ ] Limit the admin user endpoints to identity and access fields, and the admin notification log to metadata
- [ ] Add `PATCH /admin/users/:id/reset-password`, following open decision 4
- [ ] Don't build `PATCH /admin/users/:id/role`, and block admins from changing their own status
- [ ] Add closing to `PATCH /staff/accounts/:id/status` following [Closing a customer](#closing-a-customer) (zero balance, nothing pending or flagged either way, reason required; closes the user too), and make `PATCH /admin/users/:id/status` refuse `closed` for customers
- [ ] Add the AuditLog model and `logAction`, and call it for every action listed above
- [ ] Mask account numbers in notification messages ("account ending 1234")
- [ ] Set `select: false` on `passwordHash`
- [ ] Update the Postman collection with the new paths and 403 tests (admin on `/staff/*`, staff on `/admin/*`)
- [x] Check user status on every authenticated request (`protect` already does this)
- [x] Seed script for the first admin account (`src/seed/createAdmin.js`)

### Frontend pair

- [ ] Split `api/admin.js` into `admin.js` and `staff.js`
- [ ] Split the admin and staff mocks, and remove financial fields from the admin mocks
- [ ] Rebuild the admin overview without transactions, accounts or amounts
- [ ] Remove Accounts and Transactions from the admin sidebar and routes
- [x] Build the staff pages: Customers, Verify, Accounts (freeze, reactivate or close), Transactions (approve, flag or cancel) (on `feat/staff-pages`)
- [ ] On admin Users, offer Close permanently for staff users only, and remove Disable and Turn back on (from `ManageMenu.jsx`, `UserStatusModal.jsx` and `UserDialogs.jsx`)
- [ ] Add the Reset password action to the admin user detail page
- [ ] Show the admin notification log without message text
- [ ] Remove the change-role UI: `ChangeRoleModal.jsx`, the role action in `ManageMenu.jsx` and `pages/admin/Users.jsx`, `updateUserRole()` in `src/api/admin.js`, and `user.role_update` in the admin overview's activity wording
- [x] `ProtectedRoute` allows exactly one role per area (already done)
