import { formatPeso } from './formatPeso'

// Transfers below this amount go through right away. At or above it, the bank must
// approve the transfer before it goes through. In centavos (₱50,000.00 = 5000000).
// ASSUMPTION to confirm with the backend: the amount, and that exactly ₱50,000 needs approval.
export const APPROVAL_THRESHOLD = 5000000
export const APPROVAL_THRESHOLD_TEXT = formatPeso(APPROVAL_THRESHOLD).replace(/\.00$/, '')

export const needsApproval = (centavos) => centavos >= APPROVAL_THRESHOLD
