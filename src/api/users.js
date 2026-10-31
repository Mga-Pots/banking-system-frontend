import api from './axios'
import { USE_MOCK, mockResponse, mockMessage, mockError, getMockUser, withoutToken } from './helpers'
import { MOCK_CARD_PASSWORD } from './accounts'
import { users } from '../mocks/users'
import { accounts } from '../mocks/accounts'
import { transactions } from '../mocks/transactions'
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

// Every role. Answers { success: true, message } with no data; the session stays valid.
// The backend also sends a "security" notification. In mock mode the current password
// is MOCK_CARD_PASSWORD (the mock login itself accepts anything).
export const changePassword = async ({ currentPassword, newPassword }) => {
  if (USE_MOCK) {
    if (!getMockUser()) return mockError('Not authenticated')
    if (!currentPassword || !newPassword) return mockError('Current and new password are required')
    if (newPassword.length < 8) return mockError('Password must be at least 8 characters')
    if (currentPassword !== MOCK_CARD_PASSWORD) return mockError('Incorrect password')
    if (newPassword === currentPassword) return mockError("Choose a password you haven't used here before")
    return mockMessage('Password updated')
  }
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

// Customers only. Refused while the balance isn't 0 or a transfer in or out is pending
// or flagged. Otherwise the user becomes "deactivated" (they can't log in) and their
// bank account is frozen. Answers with the updated user.
export const deactivateMe = async () => {
  if (USE_MOCK) {
    const user = getMockUser()
    if (!user) return mockError('Not authenticated')
    if (user.role !== 'customer') return mockError('Forbidden')
    const account = accounts.find((a) => a.owner === user._id)
    if (account && account.balance > 0) {
      return mockError('Move your remaining balance out before deactivating your account')
    }
    const held =
      account &&
      transactions.some(
        (t) =>
          [t.sourceAccount, t.destinationAccount].includes(account._id) && ['pending', 'flagged'].includes(t.status),
      )
    if (held) return mockError("You can't deactivate while a transfer is still being processed")
    if (account) account.status = 'frozen'
    user.status = 'deactivated'
    return mockResponse(withoutToken(user))
  }
  return (await api.patch('/users/me/deactivate')).data
}
