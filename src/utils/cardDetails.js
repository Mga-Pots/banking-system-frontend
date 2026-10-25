// DISPLAY ONLY. The backend has no card expiry or CVC, so these are derived from
// the account (the same account always shows the same values). Replace this with
// real fields if the backend adds them.
export const cardDetailsFor = (account) => {
  const opened = new Date(account.createdAt)
  const month = String(opened.getMonth() + 1).padStart(2, '0')
  const year = String((opened.getFullYear() + 5) % 100).padStart(2, '0')
  const seed = [...String(account.accountNumber)].reduce((sum, digit) => sum + (Number(digit) + 1) * 7, 0)
  return { expiry: `${month}/${year}`, cvc: String((seed * 37) % 1000).padStart(3, '0') }
}
