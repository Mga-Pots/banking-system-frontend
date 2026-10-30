import NotificationPreferences from "../../components/customer/NotificationPreferences";
import ProfileDetails from "../../components/ProfileDetails";

// Profile & settings. The details card lets the customer edit their name, email and
// mobile (PATCH /users/me); changing the password and deactivating aren't built yet.
export default function Settings() {
  return (
    <div>
      <div className="flex max-w-xl flex-col gap-6">
        <ProfileDetails />
        <NotificationPreferences />
      </div>
    </div>
  );
}
