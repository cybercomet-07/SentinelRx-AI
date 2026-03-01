import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from '../../components/layout/Sidebar'
import Header from '../../components/layout/Header'

const TITLES = {
  '/admin/dashboard': 'Dashboard',
  '/admin/medicines': 'Medicine Management',
  '/admin/orders': 'Orders Management',
  '/admin/prescriptions': 'Prescription Management',
  '/admin/notifications': 'Notifications',
  '/admin/map': 'Delivery Map',
  '/admin/users': 'User Management',
  '/admin/profile': 'Profile',
}

export default function AdminLayout() {
  const { pathname } = useLocation()
  const title = TITLES[pathname] || 'Admin'

  return (
    <div className="flex h-screen overflow-hidden bg-warm-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={title} />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
