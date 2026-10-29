import CreateStaffModal from './CreateStaffModal'
import ResetPasswordModal from './ResetPasswordModal'
import UserStatusModal from './UserStatusModal'


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
  if (dialog.type === 'close') {
    return (
      <UserStatusModal
        user={dialog.user}
        action="close"
        onClose={onClose}
        onSaved={(u) => done(`${u.name}’s staff account is closed.`)}
      />
    )
  }
  return null
}
