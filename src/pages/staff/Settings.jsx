import ChangePassword from '../../components/ChangePassword'
import ProfileDetails from '../../components/ProfileDetails'

// A staff member's own profile. The details are read-only (editing them, PATCH /users/me,
// is for customers only), but staff can change their password. Notification preferences
// aren't here because only customers receive notifications.
export default function StaffSettings() {
  return (
    <div className="flex max-w-xl flex-col gap-6">
      <ProfileDetails />
      <ChangePassword />
    </div>
  )
}
