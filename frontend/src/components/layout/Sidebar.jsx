import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth'
import {
  MessageSquare, ShoppingBag, History, Bell, FileText, LayoutDashboard,
  Pill, ClipboardList, Users, LogOut, Activity, MapPin, Mail, Rocket, X,
  Stethoscope, CalendarDays, ShieldCheck,
} from 'lucide-react'
import clsx from 'clsx'

const userLinkKeys = [
  { to: '/user/quick-start', icon: Rocket, key: 'sidebar.quickStart' },
  { to: '/user/chat', icon: MessageSquare, key: 'sidebar.aiChat' },
  { to: '/user/medicines', icon: ShoppingBag, key: 'sidebar.browseMedicines' },
  { to: '/user/orders', icon: History, key: 'sidebar.orderHistory' },
  { to: '/user/find-doctor', icon: Stethoscope, key: 'sidebar.findDoctor' },
  { to: '/user/appointments', icon: CalendarDays, key: 'sidebar.myAppointments' },
  { to: '/user/govt-schemes', icon: ShieldCheck, key: 'sidebar.govtSchemes' },
  { to: '/user/notifications', icon: Bell, key: 'sidebar.notifications' },
  { to: '/user/prescriptions', icon: FileText, key: 'sidebar.prescriptions' },
  { to: '/user/contact', icon: Mail, key: 'sidebar.contactUs' },
]

const adminLinkKeys = [
  { to: '/admin/dashboard', icon: LayoutDashboard, key: 'sidebar.dashboard' },
  { to: '/admin/medicines', icon: Pill, key: 'sidebar.medicines' },
  { to: '/admin/orders', icon: ClipboardList, key: 'sidebar.orders' },
  { to: '/admin/prescriptions', icon: FileText, key: 'sidebar.prescriptions' },
  { to: '/admin/notifications', icon: Bell, key: 'sidebar.notifications' },
  { to: '/admin/map', icon: MapPin, key: 'sidebar.deliveryMap' },
  { to: '/admin/users', icon: Users, key: 'sidebar.users' },
  { to: '/admin/contact', icon: Mail, key: 'sidebar.contactSubmissions' },
]

export default function Sidebar({ open, onClose }) {
  const { t } = useTranslation()
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const linkKeys = isAdmin ? adminLinkKeys : userLinkKeys

  const handleLogout = () => { logout(); navigate('/login') }

  const handleNavClick = () => {
    if (onClose) onClose()
  }

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={clsx(
        'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200/80 flex flex-col shadow-soft transition-transform duration-300',
        'md:relative md:translate-x-0 md:z-auto md:flex md:shrink-0',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Logo */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-pharma">
              <Activity size={20} className="text-white" strokeWidth={2.5} />
            </div>
            <div>
              <p className="font-display font-semibold text-slate-900 leading-tight text-base">SentinelRx AI</p>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">{isAdmin ? t('common.adminPanel') : t('common.pharmacy')}</p>
            </div>
          </div>
          <button onClick={onClose} className="md:hidden p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {linkKeys.map(({ to, icon: Icon, key: labelKey }) => (
            <NavLink
              key={to}
              to={to}
              onClick={handleNavClick}
              className={({ isActive }) => clsx(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
              )}
            >
              <Icon size={18} strokeWidth={2} />
              <span>{t(labelKey)}</span>
            </NavLink>
          ))}
        </nav>

        {/* User info */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <Link
            to={isAdmin ? '/admin/profile' : '/user/profile'}
            onClick={handleNavClick}
            className="flex items-center gap-3 px-3 py-2.5 mb-2 rounded-xl bg-white border border-slate-100 hover:bg-slate-50 hover:border-slate-200 transition-colors block"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-semibold shadow-sm">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{user?.name || t('common.user')}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors duration-200"
          >
            <LogOut size={16} strokeWidth={2} />
            {t('common.signOut')}
          </button>
        </div>
      </aside>
    </>
  )
}
