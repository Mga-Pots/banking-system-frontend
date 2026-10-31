import api from './axios'
import { USE_MOCK, mockResponse, mockMessage, mockError, getMockUser } from './helpers'
import { notifications } from '../mocks/notifications'
import { scenario } from '../mocks/scenario'

// Same as the backend: newest first, 50 per page by default, 100 at most.
const DEFAULT_LIMIT = 50
const MAX_LIMIT = 100

const myMockNotifications = () => {
  const user = getMockUser()
  return notifications.filter((n) => n.recipient === user?._id)
}

const removeFromMock = (predicate) => {
  for (let i = notifications.length - 1; i >= 0; i--) {
    if (predicate(notifications[i])) notifications.splice(i, 1)
  }
}

// ?scenario=error makes every notifications call fail, so the error state can be seen.
const failsInMock = (message) => scenario === 'error' && mockError(message)

// Returns { success, data: [notifications] }: a plain array, no totals. `page` and
// `limit` work like the backend's; a full page means there may be more.
export const getMyNotifications = async ({ page = 1, limit = DEFAULT_LIMIT } = {}) => {
  if (USE_MOCK) {
    const failure = failsInMock('Unable to fetch notifications')
    if (failure) return failure
    const size = Math.min(MAX_LIMIT, Math.max(1, limit))
    const start = (Math.max(1, page) - 1) * size
    const mine = myMockNotifications().sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    return mockResponse(mine.slice(start, start + size).map((n) => ({ ...n })))
  }
  return (await api.get('/notifications', { params: { page, limit } })).data
}

// Returns the updated notification as `data`.
export const markAsRead = async (id) => {
  if (USE_MOCK) {
    const failure = failsInMock('Unable to update notification')
    if (failure) return failure
    const note = myMockNotifications().find((n) => n._id === id)
    if (!note) return mockError('Notification not found')
    note.isRead = true
    note.updatedAt = new Date().toISOString()
    return mockResponse({ ...note })
  }
  return (await api.patch(`/notifications/${id}/read`)).data
}

// Mark all, delete and clear answer with a `message` only, no `data`.
export const markAllAsRead = async () => {
  if (USE_MOCK) {
    const failure = failsInMock('Unable to mark all notifications as read')
    if (failure) return failure
    myMockNotifications().forEach((n) => {
      n.isRead = true
    })
    return mockMessage('All notifications marked as read')
  }
  return (await api.patch('/notifications/read-all')).data
}

export const deleteNotification = async (id) => {
  if (USE_MOCK) {
    const failure = failsInMock('Unable to delete notification')
    if (failure) return failure
    const note = myMockNotifications().find((n) => n._id === id)
    if (!note) return mockError('Notification not found')
    removeFromMock((n) => n._id === id)
    return mockMessage('Notification deleted')
  }
  return (await api.delete(`/notifications/${id}`)).data
}

export const clearNotifications = async () => {
  if (USE_MOCK) {
    const failure = failsInMock('Unable to clear notifications')
    if (failure) return failure
    const user = getMockUser()
    removeFromMock((n) => n.recipient === user?._id)
    return mockMessage('Notifications cleared')
  }
  return (await api.delete('/notifications')).data
}
