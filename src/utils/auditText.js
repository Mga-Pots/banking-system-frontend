// How audit-log actions read in the admin pages. Admins never see money, so a
// transaction or bank account is described by the last characters of its id only.
// Every entry reads the same way: verb + what it was done to + the target.
const verbs = {
  'staff.create': 'created staff account',
  'user.status_update': 'closed staff account',
  'user.password_reset': 'reset the password of',
  'user.verify': 'verified customer',
  'account.status_update': 'updated bank account',
  'transaction.status_update': 'reviewed transaction',
}

export const ACTION_LABELS = {
  'staff.create': 'Staff created',
  'user.status_update': 'Staff closed',
  'user.verify': 'Customer verified',
  'account.status_update': 'Account updated',
  'transaction.status_update': 'Transaction reviewed',
}

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
  return { actor, customer, actorRole: actorUser?.role ?? log.actorRole, verb: verbs[log.action] ?? log.action, target }
}
