// Account numbers are 12 digits with no spaces. Show them in groups of four:
// "001234567890" -> "0012 3456 7890". Also works on partly typed numbers.
export const formatAccountNumber = (value) =>
  String(value ?? '')
    .replace(/\D/g, '')
    .replace(/(\d{4})(?=\d)/g, '$1 ')

export const lastFour = (value) => String(value ?? '').replace(/\D/g, '').slice(-4)

// How other people's accounts are shown, the way banks do: only the last four digits.
// "001234567890" -> "•••• 7890". For text a screen reader reads, use accountEnding().
export const maskAccountNumber = (value) => `•••• ${lastFour(value)}`

// "account ending 7890": what to say aloud instead of the bullet characters.
export const accountEnding = (value) => `account ending ${lastFour(value)}`
