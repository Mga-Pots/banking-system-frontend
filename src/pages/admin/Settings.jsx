import ProfileDetails from '../../components/ProfileDetails'

// An admin's own profile. Read-only: editing details (PATCH /users/me) is for customers
// only. Notification preferences aren't here because only customers receive notifications.
export default function AdminSettings() {
  return (
    <div className="max-w-xl">
      <ProfileDetails />
    </div>
  )
}
