import api from './axios'
import { USE_MOCK, mockResponse, mockError, getMockUser, withoutToken } from './helpers'
import { users } from '../mocks/users'
import { EMAIL_PATTERN } from '../utils/contactDetails'

// Customer profile endpoints (/users/me/...).

// Customers only (staff and admins get 403). contactNumber is "09171234567" or empty;
// empty removes the saved number. Answers with the updated user, like /auth/me.
// The mock runs the backend's checks, so mock mode refuses the same things.
export const updateMe = async ({ name, email, contactNumber }) => {
  if (USE_MOCK) {
    const user = getMockUser()
    if (!user) return mockError('Not authenticated')
    if (user.role !== 'customer') return mockError('Forbidden')
    const cleanName = name.trim()
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanName || !cleanEmail) return mockError('Name and email are required')
    if (!EMAIL_PATTERN.test(cleanEmail)) return mockError('Enter a valid email address')
    if (contactNumber && !/^09\d{9}$/.test(contactNumber)) return mockError('Enter a valid Philippine mobile number')
    const taken = users.some(
      (u) =>
        u._id !== user._id &&
        u.status !== 'closed' &&
        (u.email === cleanEmail || (contactNumber && u.contactNumber === contactNumber)),
    )
    if (taken) return mockError('Email or contact number already used')
    Object.assign(user, { name: cleanName, email: cleanEmail, updatedAt: new Date().toISOString() })
    if (contactNumber) user.contactNumber = contactNumber
    else delete user.contactNumber
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
