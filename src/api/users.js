import api from './axios'
import { USE_MOCK, mockResponse, mockError, getMockUser, withoutToken } from './helpers'

// Customer profile endpoints (/users/me/...).

export const updateMe = async ({ name, email, contactNumber }) => {
  if (USE_MOCK) {
    const user = getMockUser()
    if (!user) return mockError('Not authenticated')
    Object.assign(user, { name, email, contactNumber })
    return mockResponse(withoutToken(user))
  }
  return (await api.patch('/users/me', { name, email, contactNumber })).data
}

export const changePassword = async ({ currentPassword, newPassword }) => {
  if (USE_MOCK) return mockResponse(null)
  return (await api.patch('/users/me/password', { currentPassword, newPassword })).data
}

export const updateNotificationPreferences = async (preferences) => {
  if (USE_MOCK) {
    const user = getMockUser()
    if (!user) return mockError('Not authenticated')
    user.notificationPreferences = { ...user.notificationPreferences, ...preferences }
    return mockResponse(withoutToken(user))
  }
  return (await api.patch('/users/me/notification-preferences', preferences)).data
}

export const deactivateMe = async () => {
  if (USE_MOCK) {
    const user = getMockUser()
    if (!user) return mockError('Not authenticated')
    user.status = 'deactivated'
    return mockResponse(withoutToken(user))
  }
  return (await api.patch('/users/me/deactivate')).data
}
