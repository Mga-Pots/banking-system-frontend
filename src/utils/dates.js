const DAY_MS = 24 * 60 * 60 * 1000
const dayLabel = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })
const timeLabel = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' })

export const isToday = (iso) => new Date(iso).toDateString() === new Date().toDateString()
export const withinDays = (iso, days) => Date.now() - new Date(iso).getTime() < days * DAY_MS
export const timeOf = (iso) => timeLabel.format(new Date(iso))

// "Today", "Yesterday", or "Oct 23"
export const dayOf = (iso) => {
  const d = new Date(iso)
  if (isToday(iso)) return 'Today'
  if (d.toDateString() === new Date(Date.now() - DAY_MS).toDateString()) return 'Yesterday'
  return dayLabel.format(d)
}

// Groups items (already sorted newest first) into [{ day, items }].
export const groupByDay = (items, dateOf = (x) => x.createdAt) => {
  const groups = []
  for (const item of items) {
    const day = dayOf(dateOf(item))
    if (groups.at(-1)?.day !== day) groups.push({ day, items: [] })
    groups.at(-1).items.push(item)
  }
  return groups
}
