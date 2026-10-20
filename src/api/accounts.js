import api from './axios'
import { USE_MOCK, mockResponse, mockError, getMockUser } from './helpers'
import { accounts } from '../mocks/accounts'

const getMyMockAccount = () => {
  const user = getMockUser()
  return accounts.find((a) => a.owner === user?._id)
}

export const getMyAccount = async () => {
  if (USE_MOCK) {
    const account = getMyMockAccount()
    return account ? mockResponse({ ...account }) : mockError('Account not found')
  }
  return (await api.get('/accounts/me')).data
}

export const getMyBalance = async () => {
  if (USE_MOCK) {
    const account = getMyMockAccount()
    if (!account) return mockError('Account not found')
    const { accountNumber, balance, status } = account
    return mockResponse({ accountNumber, balance, status })
  }
  return (await api.get('/accounts/me/balance')).data
}

export const getAccountById = async (id) => {
  if (USE_MOCK) {
    // Customers can only open their own account; staff and admins can open any
    const user = getMockUser()
    const account = accounts.find((a) => a._id === id)
    if (!account || (user?.role === 'customer' && account.owner !== user._id)) {
      return mockError('Account not found')
    }
    return mockResponse({ ...account })
  }
  return (await api.get(`/accounts/${id}`)).data
}
