import CreateStaffModal from './CreateStaffModal'
import UserStatusModal from './UserStatusModal'


// The dialogs behind the Users and Staff pages. `dialog` is { type, user } or null;
// `done(message)` closes it, shows a toast, and reloads.
export default function UserDialogs({ dialog, onClose, done }) {
  if (!dialog) return null
  if (dialog.type === 'staff') {
    return <CreateStaffModal onClose={onClose} onCreated={(s) => done(`Staff account created for ${s.name}.`)} />
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
