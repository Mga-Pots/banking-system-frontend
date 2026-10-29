# Flagged transfers and the document check

For the backend pair. The frontend is built and works against the mock layer; this is what
the real backend needs so the same flow works with `VITE_USE_MOCK=false`.

File references are to `banking-system-backend` as of 2026-10-29.

## The flow

1. A customer transfers **₱50,000 or more**, so the transfer is held: `status: "pending"`,
   `flagReason: "Held for staff review"`. The sender is charged now; the recipient is not
   credited yet. The customer is notified that it's being held. **This already works.**
2. Staff open it and either approve it, reject it, or **flag** it.
3. Flagging starts a **document check**: no money moves, the transfer becomes `flagged`,
   and the customer is told to send a document.
4. The customer attaches a document that shows the transfer is theirs, usually a photo of
   a valid ID. **Uploading is simulated and stays in the frontend**: the dialog attaches a
   sample file and only its *name* is sent, so there is no file to receive or store. See
   "No file handling" below.
5. Staff see the document and approve or reject the transfer. **A flagged transfer can
   only be approved once the document is in.** Rejecting stays available throughout, so a
   sender who never answers can't leave the transfer stuck.

A flagged transfer **cannot** be cancelled by the customer, only by staff. It is under
review, so the customer must not be able to make it go away.

## 1. Bug: a flagged transfer can't be approved or rejected

`src/controllers/transactionController.js`, in `updateStaffTransactionStatus`:

- **Line 905** `if (txn.status !== "pending")` rejects anything that isn't pending, so
  approving or rejecting a `flagged` transfer answers
  `400 "Only pending transfers can be updated"`. Step 5 above is impossible today.
- The two `findOneAndUpdate` filters (around **lines 926 and 966**) also pin
  `status: "pending"`, so they need the same change or they throw
  `"Transfer has already been reviewed"`.

Both should accept `pending` **or** `flagged`, e.g. `{ $in: ["pending", "flagged"] }`.

## 2. Bug: anything can be flagged

The `if (status === "flagged")` branch at **line 891** returns before the
`transactionType !== "transfer"` and status checks below it. A cash in, or an already
`completed` transfer, can be flagged. Flagging should be allowed only on a **transfer**
that is currently **pending**, which is what the frontend offers.

## 3. Flagging sends no notification

That branch saves and returns without calling `createNotification`. The customer is never
told, so they can't act. It should send one, and it should say what to do:

```
Your transfer of ₱50,000.00 needs an ID check before it can go through. Open it to send a valid ID.
```

`type: "transaction"`, with `relatedTransaction` set, like the others.

This is deliberately different from the hold notification the transfer endpoint already
sends ("…is being held for review."), because only this one asks the customer to do
something.

## 4. New: the `verification` field on Transaction

Add to `src/models/Transaction.js`:

```js
verification: {
  status: { type: String, enum: ["requested", "submitted"], default: undefined },
  requestedAt: { type: Date, default: null },
  submittedAt: { type: Date, default: null },
  documentName: { type: String, default: null },  // a file name to show staff, nothing more
},
```

Absent (or `null`) on every transfer that was never flagged. Flagging sets
`{ status: "requested", requestedAt: now, submittedAt: null, documentName: null }`.

Include it in the responses from `formatStaffTransaction` and the customer transaction
responses, so both sides can show the state.

Until it is sent, the frontend reads a flagged transfer with no `verification` as "asked
for, nothing back yet", which is why staff currently only get a **Reject** button on the
transfers your backend flags.

In mock mode nothing is stored at all, so the whole flow demos with the backend untouched.

The field is **not** cleared when the transfer is approved or rejected: it stays as the
record of the check.

## 5. New: `POST /transactions/:id/verification`

Customer only, the sender only.

**Body:** `{ documentName }`, a short string. Plain JSON — **no file is uploaded**, so
there is no multipart parsing, no `multer`, and nothing to store on disk. Treat the name as
untrusted text: trim it, cap it (120 characters is plenty), and keep it out of anywhere
it could be read as a path.

**Rules:**

- 404 if the transaction isn't theirs.
- 400 `"Only the sender can send an ID for this transfer"` if they're not the sender.
- 400 `"This transfer is not waiting for an ID check"` unless `status === "flagged"`.
- 400 `"An ID has already been sent for this transfer"` unless
  `verification.status === "requested"`.

**On success:** set `verification.status = "submitted"`, `verification.submittedAt` and
`verification.documentName`, then return the updated transaction, shaped like the other
customer transaction responses. The staff screens show the name, so it must come back.

### No file handling

Real uploads were deliberately left out. Storing files needs middleware, disk space and
access rules none of which exist here, and the project simulates money anyway, so it
simulates the document too. The customer's dialog says so plainly, and the sample file
name lives in one constant in `VerifyTransferModal.jsx`. If real uploads are ever wanted,
only that component and this endpoint's body change: the states, the gating and both
review screens stay as they are.

No money moves and the status stays `flagged`. Staff see it in their "Needs review" tab
either way; the frontend doesn't expect a staff notification.

## 6. Unrelated, worth fixing: full account numbers in notifications

The transfer notifications use `formatAccountNumber(...)`, which puts the recipient's
**full 12-digit account number** in the message text. Notification messages are shown as
plain text and may be read by anyone with the customer's screen open. CLAUDE.md now says a
message must never contain a full account number; use `account ending 1234` instead. The
frontend mock already does this.

## What the frontend already does

All of it is behind the mock layer, so it's ready for the real endpoints:

- `src/api/transactions.js` → `submitTransferVerification(id, documentName)`, posting plain JSON
- `src/api/staff.js` → flagging sets `verification` and sends the new notification
- `src/components/customer/VerifyTransferModal.jsx` → the customer's upload dialog, and the sample file name
- `src/components/customer/TransactionDetailsModal.jsx` → the "Send a document" panel
- `src/components/staff/ReviewTransactionModal.jsx` → shows staff the document name, or that it is still missing
