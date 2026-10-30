import api from './axios'
import { USE_MOCK, mockResponse, mockError, withoutToken, getMockUser, logMock } from './helpers'
import { users } from '../mocks/users'
import { notifications } from '../mocks/notifications'
import { auditLogs } from '../mocks/auditLogs'

// Admin = IT and people: create and close staff accounts, see the user list (read-only),
// and read-only review of the audit and notification logs. No money data at all.
// Banking operations live in ./staff.js. See CLAUDE.md for the rules.

// The admin user list only gets identity and access fields (data minimization).
const IDENTITY_FIELDS = ['_id', 'name', 'email', 'contactNumber', 'role', 'status', 'isVerified', 'createdAt', 'updatedAt']
const identityOnly = (user) => Object.fromEntries(IDENTITY_FIELDS.filter((f) => f in user).map((f) => [f, user[f]]))

// The admin notification log is metadata only: the message can contain amounts.
const notificationMeta = ({ _id, recipient, type, isRead, createdAt }) => ({ _id, recipient, type, isRead, createdAt })

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
    logMock('staff.create', 'User', id)
    return mockResponse(identityOnly(staff))
  }
  return (await api.post('/admin/staff', { name, email, password })).data
}

// The real backend's admin endpoints send `id` (not `_id`), people as objects
// ({ id, name, email, role }) and actions like "STAFF_CREATED". These turn that into
// the shape the pages (and the mocks) use. Either shape works.
const idOf = (v) => (v && typeof v === 'object' ? String(v._id ?? v.id) : v)
const personOf = (v) =>
  v && typeof v === 'object' ? { _id: idOf(v), name: v.name, email: v.email, role: v.role } : null

const ACTION_NAMES = {
  STAFF_CREATED: 'staff.create',
  STAFF_STATUS_UPDATED: 'user.status_update',
  CUSTOMER_VERIFIED: 'user.verify',
  ACCOUNT_FROZEN: 'account.status_update',
  ACCOUNT_UNFROZEN: 'account.status_update',
  ACCOUNT_CLOSED: 'account.status_update',
  TRANSACTION_APPROVED: 'transaction.status_update',
  TRANSACTION_REJECTED: 'transaction.status_update',
}

const fromBackendUser = (u) => ({ ...u, _id: idOf(u) })
const fromBackendLog = (log) => ({
  _id: idOf(log),
  actor: idOf(log.actor),
  actorInfo: personOf(log.actor),
  actorRole: log.actorRole ?? log.actor?.role,
  action: ACTION_NAMES[log.action] ?? log.action,
  targetType: log.targetType,
  targetId: idOf(log.targetId),
  // A transaction's reference number (TXN-...), when the backend includes it
  reference: log.metadata?.referenceNumber ?? null,
  // The customer an account or transaction belongs to, when the backend includes it
  customer: idOf(log.metadata?.customer) ?? null,
  customerInfo: log.metadata?.customer ? { ...personOf(log.metadata.customer), role: 'customer' } : null,
  outcome: log.outcome,
  createdAt: log.createdAt,
})
// Metadata only: the message is dropped even if the backend sends it.
const fromBackendNotification = (n) => ({
  _id: idOf(n),
  recipient: idOf(n.recipient),
  recipientInfo: personOf(n.recipient),
  type: n.type,
  isRead: n.isRead,
  createdAt: n.createdAt,
})
const mapData = (res, fn) => ({ ...res, data: (res.data ?? []).map(fn) })

export const getUsers = async () => {
  if (USE_MOCK) return mockResponse(users.map((u) => identityOnly(withoutToken(u))))
  return mapData((await api.get('/admin/users', { params: { limit: 100 } })).data, fromBackendUser)
}

export const getUserById = async (id) => {
  if (USE_MOCK) {
    const user = users.find((u) => u._id === id)
    return user ? mockResponse(identityOnly(user)) : mockError('User not found')
  }
  return (await api.get(`/admin/users/${id}`)).data
}

// Close a staff account: PATCH /admin/staff/:id/status with { status: "closed" } only.
// Disable / re-enable is gone; customers are closed by staff via their bank account.
export const updateUserStatus = async (id, status) => {
  if (USE_MOCK) {
    const user = users.find((u) => u._id === id)
    if (!user) return mockError('User not found')
    if (id === getMockUser()?._id) return mockError('You can’t change your own account status')
    if (status !== 'closed') return mockError('Admins can only close staff accounts')
    if (user.role !== 'staff') return mockError('Only staff accounts can be closed here')
    if (user.status === 'closed') return mockError('This account is already closed')
    user.status = status
    user.updatedAt = new Date().toISOString()
    logMock('user.status_update', 'User', id)
    return mockResponse(identityOnly(user))
  }
  return (await api.patch(`/admin/staff/${id}/status`, { status })).data
}

export const getAuditLogs = async () => {
  if (USE_MOCK) return mockResponse(auditLogs.map((l) => ({ ...l })))
  return mapData((await api.get('/admin/audit-logs', { params: { limit: 100 } })).data, fromBackendLog)
}

export const getNotificationLogs = async () => {
  if (USE_MOCK) return mockResponse(notifications.map(notificationMeta))
  return mapData((await api.get('/admin/notifications', { params: { limit: 100 } })).data, fromBackendNotification)
}
