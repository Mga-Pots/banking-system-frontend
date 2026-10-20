import api from './axios'
import { USE_MOCK, mockResponse, mockError, withoutToken } from './helpers'
import { users } from '../mocks/users'
import { accounts } from '../mocks/accounts'
import { transactions } from '../mocks/transactions'
import { notifications } from '../mocks/notifications'
import { auditLogs } from '../mocks/auditLogs'

const USER_STATUSES = ['active', 'deactivated', 'disabled', 'closed']
const ACCOUNT_STATUSES = ['active', 'frozen', 'closed']
const TRANSACTION_STATUSES = ['pending', 'completed', 'failed', 'cancelled', 'flagged']
const ROLES = ['customer', 'staff', 'admin']

// Looks up `id` in `list`, checks `value` is allowed, sets `field`, and returns the updated copy.
const setMockField = (list, id, field, value, allowed, label) => {
  const item = list.find((x) => x._id === id)
  if (!item) return mockError(`${label} not found`)
  if (!allowed.includes(value)) return mockError(`Invalid ${field}`)
  item[field] = value
  return mockResponse(item.token === undefined ? { ...item } : withoutToken(item))
}

// admin only
export const createStaff = async ({ name, email, password }) => {
  if (USE_MOCK) {
    const normalized = email.toLowerCase().trim()
    if (users.some((u) => u.email === normalized)) return mockError('Email already used')
    const now = new Date().toISOString()
    const id = `u${Date.now()}`
    // No contactNumber: it's optional, and staff accounts are created without one
    const staff = {
      _id: id,
      name: name.trim(),
      email: normalized,
      role: 'staff',
      status: 'active',
      isVerified: true,
      notificationPreferences: { email: true, sms: false },
      createdAt: now,
      updatedAt: now,
      token: `mock-token-${id}`,
    }
    users.push(staff)
    return mockResponse(withoutToken(staff))
  }
  return (await api.post('/admin/staff', { name, email, password })).data
}

// admin, staff
export const getUsers = async () => {
  if (USE_MOCK) return mockResponse(users.map(withoutToken))
  return (await api.get('/admin/users')).data
}

// admin, staff
export const getUserById = async (id) => {
  if (USE_MOCK) {
    const user = users.find((u) => u._id === id)
    return user ? mockResponse(withoutToken(user)) : mockError('User not found')
  }
  return (await api.get(`/admin/users/${id}`)).data
}

// admin
export const updateUserStatus = async (id, status) => {
  if (USE_MOCK) return setMockField(users, id, 'status', status, USER_STATUSES, 'User')
  return (await api.patch(`/admin/users/${id}/status`, { status })).data
}

// admin
export const updateUserRole = async (id, role) => {
  if (USE_MOCK) return setMockField(users, id, 'role', role, ROLES, 'User')
  return (await api.patch(`/admin/users/${id}/role`, { role })).data
}

// admin, staff
export const verifyUser = async (id) => {
  if (USE_MOCK) return setMockField(users, id, 'isVerified', true, [true], 'User')
  return (await api.patch(`/admin/users/${id}/verify`)).data
}

// admin, staff
export const getAccounts = async () => {
  if (USE_MOCK) return mockResponse(accounts.map((a) => ({ ...a })))
  return (await api.get('/admin/accounts')).data
}

// admin, staff (freeze / reactivate)
export const updateAccountStatus = async (id, status) => {
  if (USE_MOCK) return setMockField(accounts, id, 'status', status, ACCOUNT_STATUSES, 'Account')
  return (await api.patch(`/admin/accounts/${id}/status`, { status })).data
}

// admin, staff
export const getAllTransactions = async () => {
  if (USE_MOCK) return mockResponse(transactions.map((t) => ({ ...t })))
  return (await api.get('/admin/transactions')).data
}

// admin, staff (flag or cancel)
export const updateTransactionStatus = async (id, status) => {
  if (USE_MOCK) {
    return setMockField(transactions, id, 'status', status, TRANSACTION_STATUSES, 'Transaction')
  }
  return (await api.patch(`/admin/transactions/${id}/status`, { status })).data
}

// admin
export const getAuditLogs = async () => {
  if (USE_MOCK) return mockResponse(auditLogs.map((l) => ({ ...l })))
  return (await api.get('/admin/audit-logs')).data
}

// admin
export const getNotificationLogs = async () => {
  if (USE_MOCK) return mockResponse(notifications.map((n) => ({ ...n })))
  return (await api.get('/admin/notifications')).data
}
