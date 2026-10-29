import ProfileDetails from '../../components/ProfileDetails'

// A staff member's own profile. Read-only: the backend has no endpoint to change a name,
// email, contact number or password. Notification preferences aren't here because only
// customers receive notifications.
export default function StaffSettings() {
  return (
    <div className="max-w-xl">
      <ProfileDetails />
    </div>
  )
}
