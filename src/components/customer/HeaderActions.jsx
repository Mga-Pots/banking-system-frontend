import { useMatch } from 'react-router-dom'
import AccountMenu from '../AccountMenu'
import { circleButton } from '../ui/circleButton'
import NotificationBell from './NotificationBell'

// What customers get on the right of the top bar: the notification bell, then the account
// menu. Staff and admins just have the account menu.
export default function CustomerHeaderActions() {
  const onNotifications = Boolean(useMatch('/customer/notifications')) // the bell shows as the current page

  return (
    <div className="flex items-center gap-3">
      <NotificationBell
        active={onNotifications}
        className={`${circleButton} ${onNotifications ? 'cursor-default! bg-mint' : 'bg-white hover:bg-mint'}`}
      />
      <AccountMenu profileLabel="Profile & settings" profileHint="Details, password, notifications" />
    </div>
  )
}
