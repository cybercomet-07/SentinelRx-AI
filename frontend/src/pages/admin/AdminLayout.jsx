import { Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Sidebar from '../../components/layout/Sidebar'
import Header from '../../components/layout/Header'

const TITLE_KEYS = {
  '/admin/dashboard': 'admin.dashboard',
  '/admin/medicines': 'admin.medicineManagement',
  '/admin/orders': 'admin.ordersManagement',
  '/admin/prescriptions': 'admin.prescriptionManagement',
  '/admin/notifications': 'nav.notifications',
  '/admin/map': 'sidebar.deliveryMap',
  '/admin/users': 'admin.userManagement',
  '/admin/profile': 'nav.profile',
}

export default function AdminLayout() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const titleKey = TITLE_KEYS[pathname]
  const title = titleKey ? t(titleKey) : t('admin.admin')

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
