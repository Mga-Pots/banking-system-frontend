import api from './axios'
import { USE_MOCK, mockResponse, mockError, getMockUser } from './helpers'
import { getMyTransactions } from './transactions'
import { accounts } from '../mocks/accounts'
import { transactions } from '../mocks/transactions'
import { users } from '../mocks/users'
import { initialsOf, maskedName } from '../utils/names'

const getMyMockAccount = () => {
  const user = getMockUser()
  return accounts.find((a) => a.owner === user?._id)
}

// Same as the backend: account numbers are compared without spaces.
const normalizeAccountNumber = (value) => String(value ?? '').replace(/\s/g, '')

export const getMyAccount = async () => {
  if (USE_MOCK) {
    const account = getMyMockAccount()
    return account ? mockResponse({ ...account }) : mockError('Account not found')
  }
  return (await api.get('/accounts/me')).data
}

export const getMyBalance = async () => {
  if (USE_MOCK) {
    const account = getMyMockAccount()
    if (!account) return mockError('Account not found')
    const { accountNumber, balance, status } = account
    return mockResponse({ accountNumber, balance, status })
  }
  return (await api.get('/accounts/me/balance')).data
}

export const getAccountById = async (id) => {
  if (USE_MOCK) {
    // Customers can only open their own account; staff and admins can open any
    const user = getMockUser()
    const account = accounts.find((a) => a._id === id)
    if (!account || (user?.role === 'customer' && account.owner !== user._id)) {
      return mockError('Account not found')
    }
    return mockResponse({ ...account })
  }
  return (await api.get(`/accounts/${id}`)).data
}

// Checks a transfer recipient before sending. Returns { accountNumber, displayName, initials }.
// The backend returns initials and a masked name; these exact field names are assumed
// and still to be confirmed.
export const lookupAccount = async (accountNumber) => {
  const digits = normalizeAccountNumber(accountNumber)
  if (USE_MOCK) {
    if (!/^\d{12}$/.test(digits)) return mockError('Account number must be 12 digits')
    const account = accounts.find((a) => a.accountNumber === digits)
    if (!account) return mockError('Account not found')
    if (account._id === getMyMockAccount()?._id) {
      return mockError('You cannot transfer to your own account')
    }
    if (account.status !== 'active') return mockError('This account cannot receive transfers')
    const owner = users.find((u) => u._id === account.owner)
    return mockResponse({
      accountNumber: account.accountNumber,
      displayName: maskedName(owner?.name),
      initials: initialsOf(owner?.name),
    })
  }
  return (await api.get(`/accounts/lookup/${digits}`)).data
}

// The accounts this customer sent money to most recently (newest first, no repeats).
// Each one is { accountNumber, displayName, initials }.
export const getRecentRecipients = async (limit = 3) => {
  if (USE_MOCK) {
    const mine = getMyMockAccount()
    const sent = transactions
      .filter(
        (t) =>
          t.transactionType === 'transfer' &&
          t.sourceAccount === mine?._id &&
          ['completed', 'pending'].includes(t.status),
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

    const recipients = []
    const seen = new Set()
    for (const t of sent) {
      if (seen.has(t.destinationAccount)) continue
      seen.add(t.destinationAccount)
      const account = accounts.find((a) => a._id === t.destinationAccount)
      if (account?.status !== 'active') continue
      const owner = users.find((u) => u._id === account.owner)
      recipients.push({
        accountNumber: account.accountNumber,
        displayName: maskedName(owner?.name),
        initials: initialsOf(owner?.name),
      })
      if (recipients.length === limit) break
    }
    return mockResponse(recipients)
  }

  // The backend has no recipients endpoint, so build the list from the history
  // (needs populated accounts) and look each one up for its initials.
  const myAccountId = (await getMyAccount()).data._id
  const { transactions: history } = (await getMyTransactions({ type: 'transfer', limit: 20 })).data
  const numbers = []
  for (const t of history) {
    const sentByMe = t.sourceAccount?._id === myAccountId
    const number = t.destinationAccount?.accountNumber
    if (sentByMe && number && ['completed', 'pending'].includes(t.status) && !numbers.includes(number)) {
      numbers.push(number)
    }
  }
  const lookups = await Promise.allSettled(numbers.slice(0, limit * 2).map(lookupAccount))
  const recipients = lookups
    .filter((result) => result.status === 'fulfilled')
    .map((result) => result.value.data)
    .slice(0, limit)
  return { success: true, data: recipients }
}
