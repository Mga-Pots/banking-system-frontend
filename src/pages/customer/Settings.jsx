import NotificationPreferences from "../../components/customer/NotificationPreferences";
import ProfileDetails from "../../components/ProfileDetails";

// Profile & settings. Read-only: the backend has no endpoint to change a name, email,
// contact number or password, and none to deactivate an account.
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
