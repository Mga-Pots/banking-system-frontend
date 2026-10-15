// Mock users, one per role (plus a second customer as a transfer target).
// Any password is accepted in mock mode.
// status: "active" | "deactivated" | "disabled" | "closed"
export const users = [
  {
    id: 'u1',
    name: 'Juan Dela Cruz',
    email: 'customer@bank.test',
    contactNumber: '09171234567',
    role: 'customer',
    status: 'active',
    verified: true,
    notificationPreferences: { email: true, sms: false },
    token: 'mock-token-customer',
  },
  {
    id: 'u2',
    name: 'Maria Santos',
    email: 'staff@bank.test',
    contactNumber: '09181234567',
    role: 'staff',
    status: 'active',
    verified: true,
    notificationPreferences: { email: true, sms: false },
    token: 'mock-token-staff',
  },
  {
    id: 'u3',
    name: 'Admin Reyes',
    email: 'admin@bank.test',
    contactNumber: '09191234567',
    role: 'admin',
    status: 'active',
    verified: true,
    notificationPreferences: { email: true, sms: false },
    token: 'mock-token-admin',
  },
  {
    id: 'u4',
    name: 'Pedro Garcia',
    email: 'customer2@bank.test',
    contactNumber: '09201234567',
    role: 'customer',
    status: 'active',
    verified: false,
    notificationPreferences: { email: true, sms: false },
    token: 'mock-token-customer2',
  },
]
