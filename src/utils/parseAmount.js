// Turns what a customer typed ("1,234.5") into integer centavos (123450).
// Returns null when it isn't a valid peso amount. No floats: split on the point.
export const pesosToCentavos = (text) => {
  const clean = String(text ?? '').replace(/[,\s₱]/g, '')
  if (!/^\d{1,9}(\.\d{1,2})?$/.test(clean)) return null
  const [whole, fraction = ''] = clean.split('.')
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'))
}

// Keeps only digits and one decimal point, with at most two decimals.
export const sanitizeAmountInput = (raw) => {
  const [whole, ...rest] = String(raw).replace(/[^\d.]/g, '').split('.')
  return rest.length ? `${whole}.${rest.join('').slice(0, 2)}` : whole
}

export const INSUFFICIENT_BALANCE = 'Your balance is insufficient.'

// True when what was typed is a valid amount above `available` (centavos), so the pages
// can say so while the customer types. An empty or half-typed field ("12.") is never over.
export const exceedsBalance = (text, available) => {
  const clean = String(text ?? '').replace(/[,\s₱]/g, '').replace(/\.$/, '')
  if (clean === '') return false
  const centavos = pesosToCentavos(clean)
  if (centavos !== null) return centavos > available
  // Too many digits for pesosToCentavos to read: more than any balance.
  return /^\d{10,}(\.\d{1,2})?$/.test(clean)
}
