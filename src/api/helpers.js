import { TOKEN_KEY } from './axios'
import { users } from '../mocks/users'
import { notifications } from '../mocks/notifications'
import { auditLogs } from '../mocks/auditLogs'

export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

const MOCK_DELAY_MS = 400

// Resolves with { success: true, data } after a short delay.
export const mockResponse = (data, delay = MOCK_DELAY_MS) =>
  new Promise((resolve) => setTimeout(() => resolve({ success: true, data }), delay))

// Resolves with { success: true, message } and no data, like the backend's mark-all,
// delete and clear responses.
export const mockMessage = (message, delay = MOCK_DELAY_MS) =>
  new Promise((resolve) => setTimeout(() => resolve({ success: true, message }), delay))

// Rejects like a failed axios call: err.response.data is { success: false, message }.
export const mockError = (message, delay = MOCK_DELAY_MS) =>
  new Promise((_, reject) =>
    setTimeout(() => {
      const err = new Error(message)
      err.response = { data: { success: false, message } }
      reject(err)
    }, delay),
  )

// The mock "session": the user whose token is currently stored.
export const getMockUser = () => {
  const token = localStorage.getItem(TOKEN_KEY)
  return users.find((u) => u.token === token) ?? null
}

// Mock only: unique ids for the records a mock creates (notifications, audit entries).
let mockSeq = 0
export const nextMockId = (prefix) => `${prefix}${Date.now()}-${++mockSeq}`

// Mock only: gives `recipient` a notification, newest first, the way the backend does.
export const notifyMock = (recipient, type, message, relatedTransaction = null) => {
  const createdAt = new Date().toISOString()
  notifications.unshift({
    _id: nextMockId('n'),
    recipient,
    type,
    message,
    relatedTransaction,
    isRead: false,
    createdAt,
    updatedAt: createdAt,
  })
}

// Removes the token before a user object is returned from a mock.
export const withoutToken = ({ token: _token, ...user }) => user

// Mock version of the backend's logAction(): every admin or staff change adds an
// audit entry. The action names match the backend's (see CLAUDE.md).
export const logMock = (action, targetType, targetId) =>
  auditLogs.push({
    _id: `l${Date.now()}`,
    actor: getMockUser()?._id ?? null,
    action,
    targetType,
    targetId,
    createdAt: new Date().toISOString(),
  })
