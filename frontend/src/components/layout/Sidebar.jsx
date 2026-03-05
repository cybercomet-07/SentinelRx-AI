import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import {
  MessageSquare, ShoppingBag, History, Bell, FileText, LayoutDashboard,
  Pill, ClipboardList, Users, LogOut, Activity, MapPin, Mail, Rocket
} from 'lucide-react'
import clsx from 'clsx'

const userLinks = [
  { to: '/user/quick-start', icon: Rocket, label: 'Quick Start' },
  { to: '/user/chat', icon: MessageSquare, label: 'AI Chat' },
  { to: '/user/medicines', icon: ShoppingBag, label: 'Browse Medicines' },
  { to: '/user/orders', icon: History, label: 'Order History' },
  { to: '/user/notifications', icon: Bell, label: 'Notifications' },
  { to: '/user/prescriptions', icon: FileText, label: 'Prescriptions' },
  { to: '/user/contact', icon: Mail, label: 'Contact Us' },
]

const adminLinks = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/medicines', icon: Pill, label: 'Medicines' },
  { to: '/admin/orders', icon: ClipboardList, label: 'Orders' },
  { to: '/admin/prescriptions', icon: FileText, label: 'Prescriptions' },
  { to: '/admin/notifications', icon: Bell, label: 'Notifications' },
  { to: '/admin/map', icon: MapPin, label: 'Delivery Map' },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/contact', icon: Mail, label: 'Contact Submissions' },
]

export default function Sidebar() {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const links = isAdmin ? adminLinks : userLinks

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <aside className="w-64 h-screen bg-white border-r border-slate-200/80 flex flex-col sticky top-0 shadow-soft">
      {/* Logo */}
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-pharma">
            <Activity size={20} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <p className="font-display font-semibold text-slate-900 leading-tight text-base">SentinelRx AI</p>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">{isAdmin ? 'Admin Panel' : 'Pharmacy'}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => clsx(
              'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
              isActive
                ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
            )}
          >
            <Icon size={18} strokeWidth={2} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User info */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <Link
          to={isAdmin ? '/admin/profile' : '/user/profile'}
          className="flex items-center gap-3 px-3 py-2.5 mb-2 rounded-xl bg-white border border-slate-100 hover:bg-slate-50 hover:border-slate-200 transition-colors block"
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-semibold shadow-sm">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors duration-200"
        >
          <LogOut size={16} strokeWidth={2} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
