import ProfileDetails from '../../components/ProfileDetails'

// An admin's own profile. Read-only: the backend has no endpoint to change a name, email,
// contact number or password. Notification preferences aren't here because only customers
// receive notifications.
export default function AdminSettings() {
  return (
    <div className="max-w-xl">
      <ProfileDetails />
    </div>
  )
}
