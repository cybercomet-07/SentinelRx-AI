import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from '../../components/layout/Sidebar'
import Header from '../../components/layout/Header'
import CartDrawer from '../../components/cart/CartDrawer'

const TITLES = {
  '/user/chat': 'AI Assistant',
  '/user/medicines': 'Browse Medicines',
  '/user/orders': 'Order History',
  '/user/notifications': 'Notifications',
}

export default function UserLayout() {
  const { pathname } = useLocation()
  const title = TITLES[pathname] || 'Dashboard'

  return (
    <div className="flex h-screen overflow-hidden bg-warm-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={title} />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
      <CartDrawer />
    </div>
  )
}
