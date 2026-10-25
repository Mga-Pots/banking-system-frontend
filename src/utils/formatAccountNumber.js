// Account numbers are 12 digits with no spaces. Show them in groups of four:
// "001234567890" -> "0012 3456 7890". Also works on partly typed numbers.
export const formatAccountNumber = (value) =>
  String(value ?? '')
    .replace(/\D/g, '')
    .replace(/(\d{4})(?=\d)/g, '$1 ')

export const lastFour = (value) => String(value ?? '').replace(/\D/g, '').slice(-4)
