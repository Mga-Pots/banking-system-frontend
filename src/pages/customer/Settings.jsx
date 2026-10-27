import NotificationPreferences from "../../components/customer/NotificationPreferences";

// Profile & settings. Only the notification preferences are here so far; the profile
// details and password sections are still to be built.
export default function Settings() {
  return (
    <div>
      <div className="max-w-xl">
        <NotificationPreferences />
      </div>
    </div>
  );
}
