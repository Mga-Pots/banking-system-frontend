import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar'

export default function StaffLayout() {
  return (
    <div>
      <Navbar title="Banking System - Staff" />
      <main>
        <Outlet />
      </main>
    </div>
  )
}
