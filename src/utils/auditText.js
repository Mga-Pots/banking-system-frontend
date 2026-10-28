// How audit-log actions read in the admin pages. Admins never see money, so a
// transaction or bank account is described by the last digits of its id only.
const verbs = {
  'staff.create': 'created a staff account for',
  'user.status_update': 'changed the access status of',
  'user.password_reset': 'reset the password of',
  'user.verify': 'verified customer',
  'account.status_update': 'changed the status of bank account',
  'transaction.status_update': 'reviewed transaction',
}

export const ACTION_LABELS = {
  'staff.create': 'Staff created',
  'user.status_update': 'Access status',
  'user.password_reset': 'Password reset',
  'user.verify': 'Customer verified',
  'account.status_update': 'Account status',
  'transaction.status_update': 'Transaction review',
}

export const TYPE_LABELS = { User: 'User', BankAccount: 'Account', Transaction: 'Transaction' }

// Access-related actions (admin work), as opposed to banking actions (staff work).
export const ACCESS_ACTIONS = ['staff.create', 'user.status_update', 'user.password_reset']

export const describeLog = (log, userById, meId) => {
  const actorUser = userById[log.actor]
  const actor = log.actor === meId ? 'You' : (actorUser?.name ?? 'Someone')
  let target
  if (log.targetType === 'User') target = userById[log.targetId]?.name ?? 'a user'
  else target = `#${String(log.targetId).slice(-6)}`
  return { actor, actorRole: actorUser?.role, verb: verbs[log.action] ?? log.action, target }
}
