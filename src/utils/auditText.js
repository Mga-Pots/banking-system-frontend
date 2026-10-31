// How audit-log actions read in the admin pages. Admins never see money, so a
// transaction or bank account is described by the last characters of its id only.
// Every entry reads the same way: verb + what it was done to + the target.
// One entry per action: [verb in a sentence, sentence-case label for filters].
const ACTIONS = {
  'staff.create': ['created staff account', 'Staff created'],
  'user.status_update': ['closed staff account', 'Staff closed'],
  'user.verify': ['verified customer', 'Customer verified'],
  'customer.status_update': ['updated the status of customer', 'Customer status updated'],
  'account.freeze': ['froze bank account', 'Account frozen'],
  // "Reactivated" matches the staff Reactivate button (the backend calls it "unfrozen")
  'account.reactivate': ['reactivated bank account', 'Account reactivated'],
  'account.close': ['closed bank account', 'Account closed'],
  'account.status_update': ['updated bank account', 'Account updated'],
  'transaction.approve': ['approved transfer', 'Transfer approved'],
  'transaction.reject': ['rejected transfer', 'Transfer rejected'],
  'transaction.flag': ['flagged transfer', 'Transfer flagged'],
  'transaction.status_update': ['reviewed transaction', 'Transaction reviewed'],
  'user.password_reset': ['reset the password of', 'Password reset'],
}

// Anything new from the backend still reads in plain sentence case: "SOME_ACTION" -> "Some action".
const plainWords = (action) => String(action ?? '').replace(/[_.\s]+/g, ' ').trim().toLowerCase()
const sentenceCase = (text) => text.charAt(0).toUpperCase() + text.slice(1)

export const actionLabel = (action) => ACTIONS[action]?.[1] ?? sentenceCase(plainWords(action))
const verbFor = (action) => ACTIONS[action]?.[0] ?? plainWords(action)

export const TYPE_LABELS = { User: 'User', BankAccount: 'Account', Transaction: 'Transaction' }

// Access-related actions (admin work), as opposed to banking actions (staff work).
export const ACCESS_ACTIONS = ['staff.create', 'user.status_update']

// Names come from the user list. If it didn't load, the actor shows as "Unknown user".
export const describeLog = (log, userById, meId) => {
  const actorUser = userById[log.actor]
  const actor = log.actor === meId ? 'You' : (actorUser?.name ?? 'Unknown user')
  let target
  if (log.targetType === 'User') target = userById[log.targetId]?.name ?? 'unknown user'
  // Bank accounts and transactions are masked like card numbers: last 4 characters only.
  // (A transaction uses its reference number instead if the backend ever sends it.)
  else if (log.targetType === 'Transaction' && log.reference) target = log.reference
  else target = `•••• ${String(log.targetId).slice(-4)}`
  // For accounts and transactions: the customer it affected, if the entry says
  const customer = log.customer ? (userById[log.customer]?.name ?? null) : null
  return { actor, customer, actorRole: actorUser?.role ?? log.actorRole, verb: verbFor(log.action), target }
}
