import api from './axios'
import { USE_MOCK, mockResponse, mockError, getMockUser } from './helpers'
import { accounts } from '../mocks/accounts'

const getMyMockAccount = () => {
  const user = getMockUser()
  return accounts.find((a) => a.userId === user?.id)
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
    return account ? mockResponse({ balance: account.balance }) : mockError('Account not found')
  }
  return (await api.get('/accounts/me/balance')).data
}

export const getAccountById = async (id) => {
  if (USE_MOCK) {
    const account = accounts.find((a) => a.id === id)
    return account ? mockResponse({ ...account }) : mockError('Account not found')
  }
  return (await api.get(`/accounts/${id}`)).data
}
