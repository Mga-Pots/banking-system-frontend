import { scenario } from './scenario'

// Mock users, one per role (plus more customers as transfer targets).
// Any password is accepted at login in mock mode. The card-details call is stricter:
// it needs MOCK_CARD_PASSWORD from src/api/accounts.js ("Password123").
// Same shape as the backend's publicUser(): no passwordHash.
// contactNumber is optional; users without one have no contactNumber field.
// status: "active" | "deactivated" | "disabled" | "closed"
export const users = [
  {
    _id: 'u1',
    name: 'Juan Dela Cruz',
    email: 'customer@bank.test',
    contactNumber: '09171234567',
    role: 'customer',
    status: 'active',
    isVerified: true,
    notificationPreferences: { email: true, sms: false },
    createdAt: '2026-09-20T08:00:00.000Z',
    updatedAt: '2026-10-01T08:00:00.000Z',
    token: 'mock-token-customer',
  },
  {
    _id: 'u2',
    name: 'Maria Santos',
    email: 'staff@bank.test',
    contactNumber: '09181234567',
    role: 'staff',
    status: 'active',
    isVerified: true,
    notificationPreferences: { email: true, sms: false },
    createdAt: '2026-09-15T08:00:00.000Z',
    updatedAt: '2026-09-15T08:00:00.000Z',
    token: 'mock-token-staff',
  },
  {
    _id: 'u3',
    name: 'Admin Reyes',
    email: 'admin@bank.test',
    role: 'admin',
    status: 'active',
    isVerified: true,
    notificationPreferences: { email: true, sms: false },
    createdAt: '2026-09-01T08:00:00.000Z',
    updatedAt: '2026-09-01T08:00:00.000Z',
    token: 'mock-token-admin',
  },
  {
    _id: 'u4',
    name: 'Pedro Garcia',
    email: 'customer2@bank.test',
    contactNumber: '09201234567',
    role: 'customer',
    status: 'active',
    isVerified: false,
    notificationPreferences: { email: true, sms: false },
    createdAt: '2026-10-03T10:00:00.000Z',
    updatedAt: '2026-10-03T10:00:00.000Z',
    token: 'mock-token-customer2',
  },
  {
    _id: 'u5',
    name: 'Ana Reyes',
    email: 'customer3@bank.test',
    contactNumber: '09175554471',
    role: 'customer',
    status: 'active',
    isVerified: true,
    notificationPreferences: { email: true, sms: false },
    createdAt: '2026-09-25T10:00:00.000Z',
    updatedAt: '2026-09-25T10:00:00.000Z',
    token: 'mock-token-customer3',
  },
  {
    _id: 'u6',
    name: 'Luis Santos',
    email: 'customer4@bank.test',
    contactNumber: '09185553390',
    role: 'customer',
    status: 'active',
    isVerified: true,
    notificationPreferences: { email: true, sms: false },
    createdAt: '2026-09-28T10:00:00.000Z',
    updatedAt: '2026-09-28T10:00:00.000Z',
    token: 'mock-token-customer4',
  },
]

// ?scenario=new: the logged-in customer (u1) has just signed up and isn't verified yet.
if (scenario === 'new') users[0].isVerified = false
