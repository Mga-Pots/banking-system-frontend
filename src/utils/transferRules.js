import { formatPeso } from './formatPeso'

// Transfers below this amount go through right away. At or above it, the bank must
// approve the transfer before it goes through. In centavos (₱50,000.00 = 5000000).
// ASSUMPTION to confirm with the backend: the amount, and that exactly ₱50,000 needs approval.
export const APPROVAL_THRESHOLD = 5000000
export const APPROVAL_THRESHOLD_TEXT = formatPeso(APPROVAL_THRESHOLD).replace(/\.00$/, '')

export const needsApproval = (centavos) => centavos >= APPROVAL_THRESHOLD

// Any transfer can carry a note from the sender. One that needs approval must have it (a
// reason, so the bank knows what it is for); below that it is optional. Free text, at most
// this long. ASSUMPTION to confirm with the backend: the field name (`note`) and that the
// transfer endpoint accepts it.
export const NOTE_MAX_LENGTH = 200
export const NOTE_REQUIRED_MESSAGE = 'Enter a reason for this transfer.'

// The note's heading is the same for the customer and for staff: "Note", and for a transfer
// that needs approval "Note (Reason for this transfer)". `noteLabel` is for showing a note,
// `noteField` is for the input, which also says that a small transfer's note is optional.
export const noteLabel = (approval) => (approval ? 'Note (Reason for this transfer)' : 'Note')

export const noteField = (approval) =>
  approval
    ? {
        label: noteLabel(true),
        placeholder: 'e.g. tuition payment',
      }
    : { label: 'Note (optional)', placeholder: 'e.g. shared lunch' }
