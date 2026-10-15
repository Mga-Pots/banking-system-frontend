import { TOKEN_KEY } from './axios'
import { users } from '../mocks/users'

export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

const MOCK_DELAY_MS = 400

// Resolves with { success: true, data } after a short delay.
export const mockResponse = (data, delay = MOCK_DELAY_MS) =>
  new Promise((resolve) => setTimeout(() => resolve({ success: true, data }), delay))

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

// Removes the token before a user object is returned from a mock.
export const withoutToken = ({ token: _token, ...user }) => user
