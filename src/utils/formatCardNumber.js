// Card numbers are 16 digits with no spaces. Show them in groups of four:
// "4521883012774096" -> "4521 8830 1277 4096".
export const formatCardNumber = (value) =>
  String(value ?? '')
    .replace(/\D/g, '')
    .replace(/(\d{4})(?=\d)/g, '$1 ')

// What shows until the details are unlocked: only the last four digits.
export const maskedCardNumber = (lastFour) => `•••• •••• •••• ${lastFour}`
