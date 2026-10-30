import ProfileDetails from '../../components/ProfileDetails'

// A staff member's own profile. Read-only: editing details (PATCH /users/me) is for
// customers only. Notification preferences aren't here because only customers receive
// notifications.
export default function StaffSettings() {
  return (
    <div className="max-w-xl">
      <ProfileDetails />
    </div>
  )
}
