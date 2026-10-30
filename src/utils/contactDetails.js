// Shared checks for the details a customer types in: Register and the profile form.
// The backend runs the same checks; these just catch mistakes before sending.

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Accepts 917 123 4567, 09171234567, or +63 917 123 4567 and returns
// the 10-digit local part (9171234567)
export function toLocalMobile(mobile) {
  const digits = mobile.replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('63')) return digits.slice(2)
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1)
  return digits
}

// A typed mobile number is usable when it's a 10-digit local number starting with 9.
export const isValidMobile = (mobile) => {
  const local = toLocalMobile(mobile)
  return local.length === 10 && local.startsWith('9')
}

// The stored form, the one the backend saves: 09171234567. Empty stays empty.
export const toStoredMobile = (mobile) => (mobile.trim() ? `0${toLocalMobile(mobile)}` : '')

// For display: 09171234567 -> 0917 123 4567. Anything unexpected is shown as is.
export const formatMobile = (stored) => {
  const digits = (stored ?? '').replace(/\D/g, '')
  return digits.length === 11 ? `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}` : stored
}
