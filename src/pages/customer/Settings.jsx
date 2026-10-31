import NotificationPreferences from "../../components/customer/NotificationPreferences";
import DeactivateAccount from "../../components/customer/DeactivateAccount";
import ChangePassword from "../../components/ChangePassword";
import ProfileDetails from "../../components/ProfileDetails";

// Profile & settings: the customer's details (editable, PATCH /users/me), their password
// (PATCH /users/me/password), notification preferences, and, last, deactivating the
// account (PATCH /users/me/deactivate).
export default function Settings() {
  return (
    <div>
      <div className="flex max-w-xl flex-col gap-6">
        <ProfileDetails />
        <ChangePassword />
        <NotificationPreferences />
        <DeactivateAccount />
      </div>
    </div>
  );
}
