import api from './axios'
import { USE_MOCK, mockResponse, mockError, getMockUser, notifyMock } from './helpers'
import { accounts } from '../mocks/accounts'
import { transactions } from '../mocks/transactions'
import { accountEnding } from '../utils/formatAccountNumber'
import { formatPeso } from '../utils/formatPeso'
import { pesosToCentavos } from '../utils/parseAmount'
import { needsApproval } from '../utils/transferRules'

// Amounts are integers in centavos.
const isValidAmount = (amount) => Number.isInteger(amount) && amount > 0

// Same as the backend: account numbers are compared without spaces.
const normalizeAccountNumber = (value) => String(value ?? '').replace(/\s/g, '')

const HELD_REASON = 'Held for staff review'

// History page size the backend uses when no limit is given.
const DEFAULT_LIMIT = 8

const getMyMockAccount = () => {
  const user = getMockUser()
  return accounts.find((a) => a.owner === user?._id)
}

// Mock reference number like TXN-20261016-0412 (date + 4 random digits)
const newReferenceNumber = (date) => {
  const day = date.toISOString().slice(0, 10).replace(/-/g, '')
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0')
  return `TXN-${day}-${random}`
}

// Customer responses carry the accounts as { _id, accountNumber } (assumed backend
// shape, to be confirmed), so the UI can show account numbers. The mock store keeps
// plain ids; this converts on the way out.
const accountRef = (id) => {
  if (!id) return null
  return { _id: id, accountNumber: accounts.find((a) => a._id === id)?.accountNumber }
}

const populate = (tx) => ({
  ...tx,
  sourceAccount: accountRef(tx.sourceAccount),
  destinationAccount: accountRef(tx.destinationAccount),
})

const newTransaction = (fields) => {
  const now = new Date()
  return {
    _id: `t${now.getTime()}`,
    referenceNumber: newReferenceNumber(now),
    performedBy: getMockUser()?._id,
    status: 'completed',
    flagReason: null,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    ...fields,
  }
}

// What a customer can see: everything they sent, their cash ins, and incoming
// transfers only once they're completed (the backend hides pending incoming ones).
const isVisibleTo = (tx, account) => {
  if (!account) return false
  if (tx.sourceAccount === account._id) return true
  if (tx.destinationAccount !== account._id) return false
  return tx.transactionType === 'cash_in' || tx.status === 'completed'
}

// Adds simulated funds to the customer's own account.
export const cashIn = async ({ amount }) => {
  if (USE_MOCK) {
    if (!isValidAmount(amount)) return mockError('Amount must be a positive whole number of centavos')
    const account = getMyMockAccount()
    if (!account) return mockError('Account not found')
    if (account.status !== 'active') return mockError('Account is not active')
    account.balance += amount
    const tx = newTransaction({
      transactionType: 'cash_in',
      amount,
      sourceAccount: null,
      destinationAccount: account._id,
    })
    transactions.unshift(tx)
    return mockResponse(populate(tx))
  }
  return (await api.post('/transactions/cash-in', { amount })).data
}

// Sends funds to another account by its 12-digit account number.
// Transfers under APPROVAL_THRESHOLD complete right away. At or above it (or with
// holdForReview: true) the transfer stays pending: the sender is charged now, and the
// recipient is credited only when the bank approves it. The real backend decides this
// itself; the mock mirrors it.
// `note` is the sender's reason, asked for when the transfer needs approval (assumed field,
// to be confirmed with the backend). It is only sent when it isn't empty.
export const transfer = async ({ recipientAccountNumber, amount, note = '', holdForReview = false }) => {
  if (USE_MOCK) {
    if (!isValidAmount(amount)) return mockError('Amount must be a positive whole number of centavos')
    const from = getMyMockAccount()
    if (!from) return mockError('Account not found')
    const to = accounts.find((a) => a.accountNumber === normalizeAccountNumber(recipientAccountNumber))
    if (!to) return mockError('Destination account not found')
    if (to._id === from._id) return mockError('Cannot transfer to your own account')
    if (from.status !== 'active' || to.status !== 'active') {
      return mockError('Both accounts must be active')
    }
    if (from.balance < amount) return mockError('Insufficient balance')
    const held = holdForReview || needsApproval(amount)
    from.balance -= amount
    if (!held) to.balance += amount
    const tx = newTransaction({
      transactionType: 'transfer',
      amount,
      sourceAccount: from._id,
      destinationAccount: to._id,
      ...(held && { status: 'pending', flagReason: HELD_REASON }),
      ...(note.trim() && { note: note.trim() }),
    })
    transactions.unshift(tx)
    notifyMock(
      getMockUser()?._id,
      'transaction',
      held
        ? `Your transfer of ${formatPeso(amount)} to ${accountEnding(to.accountNumber)} is being held for review.`
        : `Your transfer of ${formatPeso(amount)} to ${accountEnding(to.accountNumber)} was completed.`,
      tx._id,
    )
    return mockResponse(populate(tx))
  }
  const body = { recipientAccountNumber: normalizeAccountNumber(recipientAccountNumber), amount }
  if (holdForReview) body.holdForReview = true
  if (note.trim()) body.note = note.trim()
  return (await api.post('/transactions/transfer', body)).data
}

// Does a typed search term match this mock transaction? It looks at the reference
// number, either account number, and the amount ("500", "1,250.50" or "₱500").
const matchesSearch = (tx, term) => {
  const needle = term.trim().toLowerCase()
  if (!needle) return true
  const digits = needle.replace(/[\s-]/g, '')
  const accountNumbers = [tx.sourceAccount, tx.destinationAccount].map((id) => accountRef(id)?.accountNumber ?? '')
  return (
    tx.referenceNumber.toLowerCase().includes(needle) ||
    (digits !== '' && accountNumbers.some((number) => number.includes(digits))) ||
    pesosToCentavos(needle) === tx.amount
  )
}

// The time window a date filter means, as { start, end } (start included, end not;
// either can be missing). Presets: "7d", "30d", "month", "3m". "custom" uses `from`
// and `to` as "YYYY-MM-DD" days, both included.
const dateRange = ({ period, from, to }) => {
  const now = new Date()
  const day = (y, m, d) => new Date(y, m, d)
  const today = day(now.getFullYear(), now.getMonth(), now.getDate())
  const daysBack = (n) => day(today.getFullYear(), today.getMonth(), today.getDate() - n)
  const parse = (iso) => (/^\d{4}-\d{2}-\d{2}$/.test(iso ?? '') ? new Date(`${iso}T00:00:00`) : null)

  if (period === '7d') return { start: daysBack(6) }
  if (period === '30d') return { start: daysBack(29) }
  if (period === 'month') return { start: day(now.getFullYear(), now.getMonth(), 1) }
  if (period === '3m') return { start: day(now.getFullYear(), now.getMonth() - 2, 1) }
  if (period === 'custom') {
    const end = parse(to)
    return { start: parse(from) ?? undefined, end: end ? day(end.getFullYear(), end.getMonth(), end.getDate() + 1) : undefined }
  }
  return {}
}

// Customer history. Filters: status, type ("cash_in" | "transfer"), search, a date
// period, page, limit.
// search is sent as a `search` query param; the name and what it matches (reference,
// account number, amount) are assumed, to be confirmed with the backend.
// The date filter is sent as `period` ("7d" | "30d" | "month" | "3m" | "custom") plus
// `from` and `to` ("YYYY-MM-DD") for a custom range. Those names and values are
// assumed, to be confirmed with the backend (it supports `days`/`period`).
// Returns { transactions, pagination, counts, summary }. `counts` follow every filter
// except status (so tabs can show their totals); `summary` is always this month's.
export const getMyTransactions = async ({
  status,
  type,
  search,
  period,
  from,
  to,
  page = 1,
  limit = DEFAULT_LIMIT,
} = {}) => {
  if (USE_MOCK) {
    const account = getMyMockAccount()
    const mine = transactions.filter((t) => isVisibleTo(t, account))

    // The rows that match every filter except status, so the status counts show what
    // each filter tab would give with the other filters applied.
    const { start: since, end: until } = dateRange({ period, from, to })
    const matching = mine
      .filter((t) => !type || t.transactionType === type)
      .filter((t) => !search || matchesSearch(t, search))
      .filter((t) => (!since || new Date(t.createdAt) >= since) && (!until || new Date(t.createdAt) < until))

    const counts = { all: matching.length, completed: 0, pending: 0, failed: 0, cancelled: 0, flagged: 0 }
    matching.forEach((t) => {
      counts[t.status] += 1
    })

    // summary: completed transactions in the current calendar month (to be confirmed)
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)
    const summary = { moneyInThisMonth: 0, moneyOutThisMonth: 0 }
    mine
      .filter((t) => t.status === 'completed' && new Date(t.createdAt) >= monthStart)
      .forEach((t) => {
        if (t.destinationAccount === account._id) summary.moneyInThisMonth += t.amount
        else summary.moneyOutThisMonth += t.amount
      })

    const filtered = matching
      .filter((t) => !status || t.status === status)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    const total = filtered.length
    const start = (page - 1) * limit
    return mockResponse({
      transactions: filtered.slice(start, start + limit).map(populate),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      counts,
      summary,
    })
  }
  const params = {
    page,
    limit,
    ...(status && { status }),
    ...(type && { type }),
    ...(search && { search }),
    ...(period && { period }),
    ...(period === 'custom' && from && { from }),
    ...(period === 'custom' && to && { to }),
  }
  return (await api.get('/transactions', { params })).data
}

export const getTransactionById = async (id) => {
  if (USE_MOCK) {
    const tx = transactions.find((t) => t._id === id)
    if (!tx || !isVisibleTo(tx, getMyMockAccount())) return mockError('Transaction not found')
    return mockResponse(populate(tx))
  }
  return (await api.get(`/transactions/${id}`)).data
}

// The sender's side of a document check on a flagged transfer: they send something that
// shows the transfer is theirs, usually a photo of a valid ID. Only the sender can send
// it, only while the transfer is flagged, and only once.
// Uploading is simulated: no file is stored anywhere, only the name travels, which is all
// the staff screens show. That keeps this to one plain JSON endpoint on the backend.
// ASSUMPTION to confirm with the backend: the endpoint, the field name and the
// `verification` shape (see docs/flagged-transfer-verification.md).
export const submitTransferVerification = async (id, documentName) => {
  if (USE_MOCK) {
    const account = getMyMockAccount()
    const tx = transactions.find((t) => t._id === id)
    if (!tx || !isVisibleTo(tx, account)) return mockError('Transaction not found')
    if (tx.transactionType !== 'transfer' || tx.sourceAccount !== account._id) {
      return mockError('Only the sender can send a document for this transfer')
    }
    if (tx.status !== 'flagged') return mockError('This transfer is not waiting for a document check')
    if (tx.verification?.status !== 'requested') {
      return mockError('A document has already been sent for this transfer')
    }
    if (!documentName) return mockError('Attach a document to send')
    const submittedAt = new Date().toISOString()
    tx.verification = { ...tx.verification, status: 'submitted', submittedAt, documentName }
    tx.updatedAt = submittedAt
    return mockResponse(populate(tx))
  }
  return (await api.post(`/transactions/${id}/verification`, { documentName })).data
}

// Only the sender can cancel, only a pending transfer, and the amount is refunded.
export const cancelTransaction = async (id) => {
  if (USE_MOCK) {
    const account = getMyMockAccount()
    const tx = transactions.find((t) => t._id === id)
    if (!tx || !isVisibleTo(tx, account)) return mockError('Transaction not found')
    if (tx.transactionType !== 'transfer' || tx.sourceAccount !== account._id) {
      return mockError('Only the sender can cancel this transfer')
    }
    if (tx.status !== 'pending') return mockError('Only pending transactions can be cancelled')
    account.balance += tx.amount
    tx.status = 'cancelled'
    tx.updatedAt = new Date().toISOString()
    return mockResponse(populate(tx))
  }
  return (await api.patch(`/transactions/${id}/cancel`)).data
}
