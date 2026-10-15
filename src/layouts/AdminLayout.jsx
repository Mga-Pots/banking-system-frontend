import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar'

export default function AdminLayout() {
  return (
    <div>
      <Navbar title="Banking System - Admin" />
      <main>
        <Outlet />
      </main>
    </div>
  )
}
