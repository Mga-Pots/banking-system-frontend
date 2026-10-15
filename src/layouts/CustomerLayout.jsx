import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar'

export default function CustomerLayout() {
  return (
    <div>
      <Navbar title="Banking System" />
      <main>
        <Outlet />
      </main>
    </div>
  )
}
