import ChangePassword from '../../components/ChangePassword'
import ProfileDetails from '../../components/ProfileDetails'

// An admin's own profile. The details are read-only (editing them, PATCH /users/me, is for
// customers only), but admins can change their password. Notification preferences aren't
// here because only customers receive notifications.
export default function AdminSettings() {
  return (
    <div className="flex max-w-xl flex-col gap-6">
      <ProfileDetails />
      <ChangePassword />
    </div>
  )
}
