import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Sidebar from '../../components/layout/Sidebar'
import Header from '../../components/layout/Header'
import CartDrawer from '../../components/cart/CartDrawer'

const TITLE_KEYS = {
  '/user/quick-start': 'nav.quickStart',
  '/user/chat': 'nav.aiAssistant',
  '/user/medicines': 'nav.browseMedicines',
  '/user/orders': 'nav.orderHistory',
  '/user/notifications': 'nav.notifications',
  '/user/prescriptions': 'nav.prescriptions',
  '/user/profile': 'nav.profile',
  '/user/contact': 'nav.contact',
}

export default function UserLayout() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const titleKey = TITLE_KEYS[pathname]
  const title = titleKey ? t(titleKey) : t('sidebar.dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header title={title} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
      <CartDrawer />
    </div>
  )
}
