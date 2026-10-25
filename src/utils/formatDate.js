const timeFormat = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' })
const dayFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })
const longFormat = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
const dateTimeFormat = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' })

// "Today, 8:12 AM" for today, otherwise "Oct 15, 6:40 PM".
export const formatTransactionDate = (iso) => {
  const date = new Date(iso)
  const time = timeFormat.format(date)
  return date.toDateString() === new Date().toDateString()
    ? `Today, ${time}`
    : `${dayFormat.format(date)}, ${time}`
}

// "September 20, 2026"
export const formatLongDate = (iso) => longFormat.format(new Date(iso))

// "Oct 15, 2026, 6:40 PM"
export const formatDateTime = (iso) => dateTimeFormat.format(new Date(iso))
