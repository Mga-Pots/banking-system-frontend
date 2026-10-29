import { ago, referenceFor } from "./time";
import { scenario } from "./scenario";

// transactionType: "cash_in" | "transfer". Amounts are integers in centavos.
// sourceAccount and destinationAccount are account _ids.
// cash_in has no sourceAccount (simulated funds); transfer has both.
// performedBy is the user _id.
// verification is only on a transfer that staff flagged: it tracks the document check the
// sender has to go through (see docs/flagged-transfer-verification.md).
// flagReason is null unless the transaction is flagged, or is a transfer held as
// pending for review ("Held for staff review"). A held transfer has already been
// taken from the sender but not yet given to the recipient.
// status: "pending" | "completed" | "failed" | "cancelled" | "flagged"
// Dates are relative to now (see ./time.js).
const make = (_id, when, suffix, fields) => {
  const createdAt = ago(when);
  return {
    _id,
    referenceNumber: referenceFor(createdAt, suffix),
    flagReason: null,
    ...fields,
    createdAt,
    updatedAt: createdAt,
  };
};

const transfer = { transactionType: "transfer" };
const cashIn = { transactionType: "cash_in", sourceAccount: null };

export const transactions = [
  // Incoming from Luis, completed
  make("t8", { m: 40 }, "0412", {
    ...transfer,
    amount: 250000,
    sourceAccount: "a4",
    destinationAccount: "a1",
    performedBy: "u6",
    status: "completed",
  }),
  // Held for review: the sender was charged, the recipient not yet credited
  make("t3", { d: 1, h: 3 }, "1100", {
    ...transfer,
    amount: 50000,
    sourceAccount: "a1",
    destinationAccount: "a2",
    performedBy: "u1",
    status: "pending",
    flagReason: "Held for staff review",
    note: "Down payment for a condo unit",
  }),
  make("t4", { d: 2 }, "0921", {
    ...cashIn,
    amount: 1000000,
    destinationAccount: "a1",
    performedBy: "u1",
    status: "completed",
  }),
  make("t5", { d: 4 }, "0655", {
    ...transfer,
    amount: 50000,
    sourceAccount: "a1",
    destinationAccount: "a3",
    performedBy: "u1",
    status: "failed",
  }),
  make("t6", { d: 6 }, "0310", {
    ...transfer,
    amount: 75000,
    sourceAccount: "a1",
    destinationAccount: "a2",
    performedBy: "u1",
    status: "cancelled",
  }),
  make("t2", { d: 7 }, "1430", {
    ...transfer,
    amount: 250000,
    sourceAccount: "a1",
    destinationAccount: "a2",
    performedBy: "u1",
    status: "completed",
  }),
  make("t7", { d: 12 }, "0827", {
    ...transfer,
    amount: 120000,
    sourceAccount: "a1",
    destinationAccount: "a3",
    performedBy: "u1",
    status: "completed",
  }),
  make("t9", { d: 15 }, "1544", {
    ...transfer,
    amount: 30000,
    sourceAccount: "a1",
    destinationAccount: "a2",
    performedBy: "u1",
    status: "flagged",
    flagReason: "Flagged for suspicious activity",
    verification: {
      status: "requested",
      requestedAt: ago({ d: 15 }),
      submittedAt: null,
      documentName: null,
    },
  }),
  // Flagged and the sender has already sent an ID, so staff can decide
  make("t11", { d: 2, h: 5 }, "0733", {
    ...transfer,
    amount: 6000000,
    sourceAccount: "a1",
    destinationAccount: "a3",
    performedBy: "u1",
    status: "flagged",
    flagReason: "Large transfer, ID check needed",
    note: "Payment for a second-hand car",
    verification: {
      status: "submitted",
      requestedAt: ago({ d: 2, h: 4 }),
      submittedAt: ago({ d: 1, h: 20 }),
      documentName: "national-id-front.jpg",
    },
  }),
  make("t10", { d: 20 }, "1203", {
    ...transfer,
    amount: 180000,
    sourceAccount: "a1",
    destinationAccount: "a4",
    performedBy: "u1",
    status: "completed",
  }),
  make("t1", { d: 24 }, "0915", {
    ...cashIn,
    amount: 1000000,
    destinationAccount: "a1",
    performedBy: "u1",
    status: "completed",
  }),
];

// Every mock transaction involves the logged-in customer, so a new customer has none.
if (scenario === "new") transactions.splice(0, transactions.length);
