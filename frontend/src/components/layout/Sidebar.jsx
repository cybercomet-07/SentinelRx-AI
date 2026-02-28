import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import {
  MessageSquare, ShoppingBag, History, Bell, FileText, LayoutDashboard,
  Pill, ClipboardList, Users, LogOut, Activity
} from 'lucide-react'
import clsx from 'clsx'

const userLinks = [
  { to: '/user/chat', icon: MessageSquare, label: 'AI Chat' },
  { to: '/user/medicines', icon: ShoppingBag, label: 'Browse Medicines' },
  { to: '/user/orders', icon: History, label: 'Order History' },
  { to: '/user/notifications', icon: Bell, label: 'Notifications' },
  { to: '/user/prescriptions', icon: FileText, label: 'Prescriptions' },
]

const adminLinks = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/medicines', icon: Pill, label: 'Medicines' },
  { to: '/admin/orders', icon: ClipboardList, label: 'Orders' },
  { to: '/admin/users', icon: Users, label: 'Users' },
]

export default function Sidebar() {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const links = isAdmin ? adminLinks : userLinks

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <aside className="w-60 h-screen bg-white border-r border-gray-100 flex flex-col shadow-soft sticky top-0">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-mint-400 to-mint-600 rounded-xl flex items-center justify-center shadow-sm">
            <Activity size={18} className="text-white" />
          </div>
          <div>
            <p className="font-display font-semibold text-gray-900 leading-none">SentinelRx AI</p>
            <p className="text-xs text-gray-400 mt-0.5">{isAdmin ? 'Admin Panel' : 'Pharmacy'}</p>
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
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
              isActive
                ? 'bg-mint-50 text-mint-700 shadow-sm'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
            )}
          >
            <Icon size={17} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User info */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sage-300 to-mint-400 flex items-center justify-center text-white text-xs font-semibold">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
