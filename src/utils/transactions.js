import { maskAccountNumber } from './formatAccountNumber'

// In customer responses, sourceAccount and destinationAccount are populated as
// { _id, accountNumber } (assumed; still to be confirmed with the backend).
// These two helpers are the only place that knows that, so a different shape
// only needs a change here.
export const accountIdOf = (account) => (account && typeof account === 'object' ? account._id : account)
export const accountNumberOf = (account) =>
  account && typeof account === 'object' ? (account.accountNumber ?? null) : null

// Money that didn't move: shown without a sign and struck through.
export const isInactive = (tx) => tx.status === 'failed' || tx.status === 'cancelled'

// How a transaction reads from the logged-in customer's side. `names` maps an
// account number to a person's masked name ("Pedro G."), when we know one.
// `maskedTitle` is what to show instead when "hide details" is on: the same as
// `title`, except that a title holding an account number only keeps its last four.
export const describeTransaction = (tx, myAccountId, names = {}) => {
  if (tx.transactionType === 'cash_in') return { direction: 'in', title: 'Cash in', maskedTitle: 'Cash in' }

  const incoming = accountIdOf(tx.destinationAccount) === myAccountId
  const other = accountNumberOf(incoming ? tx.sourceAccount : tx.destinationAccount)
  const label = incoming ? 'From' : 'To'
  const fallback = incoming ? 'Transfer received' : 'Transfer sent'
  const who = other ? (names[other] ?? maskAccountNumber(other)) : null
  const title = who ? `${label} ${who}` : fallback
  const maskedTitle = title
  return { direction: incoming ? 'in' : 'out', title, maskedTitle }
}
