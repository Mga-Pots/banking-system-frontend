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

export const getUsers = async () => {
  if (USE_MOCK) return mockResponse(users.map((u) => identityOnly(withoutToken(u))))
  return (await api.get('/admin/users')).data
}

export const getUserById = async (id) => {
  if (USE_MOCK) {
    const user = users.find((u) => u._id === id)
    return user ? mockResponse(identityOnly(user)) : mockError('User not found')
  }
  return (await api.get(`/admin/users/${id}`)).data
}

// Close a staff account: PATCH /admin/users/:id/status with { status: "closed" } only.
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
  return (await api.patch(`/admin/users/${id}/status`, { status })).data
}

export const getAuditLogs = async () => {
  if (USE_MOCK) return mockResponse(auditLogs.map((l) => ({ ...l })))
  return (await api.get('/admin/audit-logs')).data
}

export const getNotificationLogs = async () => {
  if (USE_MOCK) return mockResponse(notifications.map(notificationMeta))
  return (await api.get('/admin/notifications')).data
}
