import api from './axios'
import { USE_MOCK, mockResponse, mockError, getMockUser, withoutToken } from './helpers'
import { users } from '../mocks/users'
import { accounts } from '../mocks/accounts'

// The backend stores emails lowercased and trimmed.
const normalizeEmail = (email) => email.toLowerCase().trim()

export const login = async ({ email, password }) => {
  if (USE_MOCK) {
    const user = users.find((u) => u.email === normalizeEmail(email))
    if (!user) return mockError('Invalid email or password')
    if (user.status !== 'active') return mockError('This account is not active')
    return mockResponse({ user: withoutToken(user), token: user.token })
  }
  return (await api.post('/auth/login', { email, password })).data
}

// Registration is for customers only; one bank account is created automatically.
// contactNumber is optional: leave it out (undefined) when the user didn't enter one.
export const register = async ({ name, email, password, contactNumber }) => {
  if (USE_MOCK) {
    const normalized = normalizeEmail(email)
    const taken = users.some(
      (u) => u.email === normalized || (contactNumber && u.contactNumber === contactNumber),
    )
    if (taken) return mockError('Email or contact number already used')
    const now = new Date().toISOString()
    const id = `u${Date.now()}`
    const user = {
      _id: id,
      name: name.trim(),
      email: normalized,
      ...(contactNumber && { contactNumber }),
      role: 'customer',
      status: 'active',
      isVerified: false,
      notificationPreferences: { email: true, sms: false },
      createdAt: now,
      updatedAt: now,
      token: `mock-token-${id}`,
    }
    users.push(user)
    const suffix = String(Date.now())
    accounts.push({
      _id: `a${id}`,
      accountNumber: `1001-${suffix.slice(-8, -4)}-${suffix.slice(-4)}`,
      owner: id,
      balance: 0,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    })
    return mockResponse({ user: withoutToken(user), token: user.token })
  }
  return (await api.post('/auth/register', { name, email, password, contactNumber })).data
}

// The client clears the token itself; this just tells the backend.
// The token is passed explicitly because callers clear localStorage right after.
export const logout = async (token) => {
  if (USE_MOCK) return mockResponse(null, 0)
  const headers = token ? { Authorization: `Bearer ${token}` } : {}
  return (await api.post('/auth/logout', null, { headers })).data
}

export const getMe = async () => {
  if (USE_MOCK) {
    const user = getMockUser()
    return user ? mockResponse(withoutToken(user)) : mockError('Not authenticated')
  }
  return (await api.get('/auth/me')).data
}
