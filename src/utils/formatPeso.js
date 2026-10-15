const pesoFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
})

// Takes an integer amount in centavos, returns e.g. "₱1,234.56".
export const formatPeso = (centavos) => pesoFormatter.format((centavos ?? 0) / 100)
