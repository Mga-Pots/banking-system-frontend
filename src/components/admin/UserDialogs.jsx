import CreateStaffModal from './CreateStaffModal'
import ResetPasswordModal from './ResetPasswordModal'
import UserStatusModal from './UserStatusModal'

const statusMessages = {
  disabled: (name) => `${name}’s account is disabled. They’ve been logged out.`,
  active: (name) => `${name}’s account is back on.`,
  closed: (name) => `${name}’s account is closed permanently.`,
}

// The dialogs behind the Users and Staff pages. `dialog` is { type, user } or null;
// `done(message)` closes it, shows a toast, and reloads.
export default function UserDialogs({ dialog, onClose, done }) {
  if (!dialog) return null
  if (dialog.type === 'staff') {
    return <CreateStaffModal onClose={onClose} onCreated={(s) => done(`Staff account created for ${s.name}.`)} />
  }
  if (dialog.type === 'reset') {
    return (
      <ResetPasswordModal
        user={dialog.user}
        onClose={onClose}
        onDone={(u) => done(`${u.name} must set a new password at their next login.`)}
      />
    )
  }
  if (['disable', 'enable', 'close'].includes(dialog.type)) {
    return (
      <UserStatusModal
        user={dialog.user}
        action={dialog.type}
        onClose={onClose}
        onSaved={(u, status) => done(statusMessages[status](u.name))}
      />
    )
  }
  return null
}
