import { useState } from 'react'
import { Outlet, useLocation, NavLink, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Menu, X, Building2, LayoutDashboard, Users, BedDouble, Pill, Receipt, Bell, Settings, LogOut } from 'lucide-react'
import clsx from 'clsx'

const NAV = [
  { to: '/hospital/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/hospital/patients',   icon: Users,           label: 'Patients' },
  { to: '/hospital/beds',       icon: BedDouble,       label: 'Bed Management' },
  { to: '/hospital/inventory',  icon: Pill,            label: 'Medicine Inventory' },
  { to: '/hospital/billing',    icon: Receipt,         label: 'Billing' },
  { to: '/hospital/notifications', icon: Bell,         label: 'Notifications' },
  { to: '/hospital/profile',    icon: Settings,        label: 'Settings' },
]

const TITLES = {
  '/hospital/dashboard':     'Hospital Dashboard',
  '/hospital/patients':      'Patient Management',
  '/hospital/beds':          'Bed Management',
  '/hospital/inventory':     'Medicine Inventory',
  '/hospital/billing':       'Billing',
  '/hospital/notifications': 'Notifications',
  '/hospital/profile':       'Settings',
}

export default function HospitalLayout() {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="flex h-screen overflow-hidden bg-orange-50/30">
      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={clsx(
        'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-orange-100 flex flex-col shadow-sm transition-transform duration-300',
        'md:relative md:translate-x-0 md:z-auto md:flex md:shrink-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="p-6 border-b border-orange-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-sm">
              <Building2 size={20} className="text-white" strokeWidth={2} />
            </div>
            <div>
              <p className="font-semibold text-slate-900 text-base leading-tight">SentinelRx AI</p>
              <p className="text-xs text-orange-500 font-medium">Hospital Admin</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1 rounded-lg text-slate-400"><X size={18} /></button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => clsx(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                isActive ? 'bg-orange-50 text-orange-700 border border-orange-100' : 'text-slate-600 hover:bg-slate-50 border border-transparent'
              )}
            >
              <Icon size={18} strokeWidth={2} />{label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <Link to="/hospital/profile" onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 mb-2 rounded-xl bg-orange-50 border border-orange-100 hover:bg-orange-100 transition-colors">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-sm font-semibold">
              {user?.name?.[0]?.toUpperCase() || 'H'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{user?.name || 'Hospital Admin'}</p>
              <p className="text-xs text-orange-500 font-medium">Hospital Admin</p>
            </div>
          </Link>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors">
            <LogOut size={16} strokeWidth={2} />Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-16 bg-white/95 backdrop-blur-lg border-b border-orange-100 sticky top-0 z-30 flex items-center px-4 md:px-6 gap-3 shadow-sm">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100"><Menu size={20} /></button>
          <h1 className="font-semibold text-slate-900 text-base md:text-lg flex-1 truncate">{TITLES[pathname] || 'Hospital Portal'}</h1>
          <Bell size={20} className="text-slate-500 cursor-pointer hover:text-orange-600" />
        </header>
        <main className="flex-1 overflow-auto"><Outlet /></main>
      </div>
    </div>
  )
}
