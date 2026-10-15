import api from './axios'
import { USE_MOCK, mockResponse, mockError, getMockUser } from './helpers'
import { notifications } from '../mocks/notifications'

const myMockNotifications = () => {
  const user = getMockUser()
  return notifications.filter((n) => n.userId === user?.id)
}

const removeFromMock = (predicate) => {
  for (let i = notifications.length - 1; i >= 0; i--) {
    if (predicate(notifications[i])) notifications.splice(i, 1)
  }
}

export const getMyNotifications = async () => {
  if (USE_MOCK) return mockResponse(myMockNotifications().map((n) => ({ ...n })))
  return (await api.get('/notifications')).data
}

export const markAsRead = async (id) => {
  if (USE_MOCK) {
    const note = myMockNotifications().find((n) => n.id === id)
    if (!note) return mockError('Notification not found')
    note.read = true
    return mockResponse({ ...note })
  }
  return (await api.patch(`/notifications/${id}/read`)).data
}

export const markAllAsRead = async () => {
  if (USE_MOCK) {
    myMockNotifications().forEach((n) => {
      n.read = true
    })
    return mockResponse(null)
  }
  return (await api.patch('/notifications/read-all')).data
}

export const deleteNotification = async (id) => {
  if (USE_MOCK) {
    const note = myMockNotifications().find((n) => n.id === id)
    if (!note) return mockError('Notification not found')
    removeFromMock((n) => n.id === id)
    return mockResponse(null)
  }
  return (await api.delete(`/notifications/${id}`)).data
}

export const clearNotifications = async () => {
  if (USE_MOCK) {
    const user = getMockUser()
    removeFromMock((n) => n.userId === user?.id)
    return mockResponse(null)
  }
  return (await api.delete('/notifications')).data
}
