import { useState } from 'react'
import { Outlet, useLocation, NavLink, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useTranslation } from 'react-i18next'
import { Menu, X, Building2, LayoutDashboard, Users, BedDouble, Pill, Receipt, Bell, Settings, LogOut } from 'lucide-react'
import clsx from 'clsx'
import LanguageSwitcher from '../../components/ui/LanguageSwitcher'
import NotificationBell from '../../components/notifications/NotificationBell'

const NAV_KEYS = [
  { to: '/hospital/dashboard',     icon: LayoutDashboard, key: 'hospital.dashboard' },
  { to: '/hospital/patients',      icon: Users,           key: 'hospital.admissions' },
  { to: '/hospital/beds',          icon: BedDouble,       key: 'hospital.beds' },
  { to: '/hospital/inventory',     icon: Pill,            key: 'hospital.inventory' },
  { to: '/hospital/billing',       icon: Receipt,         key: 'hospital.billing' },
  { to: '/hospital/notifications', icon: Bell,            key: 'hospital.notifications' },
  { to: '/hospital/profile',       icon: Settings,        key: 'hospital.profile' },
]

const TITLE_KEYS = {
  '/hospital/dashboard':     'hospital.dashboard',
  '/hospital/patients':      'hospital.admissions',
  '/hospital/beds':          'hospital.beds',
  '/hospital/inventory':     'hospital.inventory',
  '/hospital/billing':       'hospital.billing',
  '/hospital/notifications': 'hospital.notifications',
  '/hospital/profile':       'hospital.profile',
}

export default function HospitalLayout() {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()
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
              <p className="text-xs text-orange-500 font-medium">{t('hospital.portal')}</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1 rounded-lg text-slate-400"><X size={18} /></button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV_KEYS.map(({ to, icon: Icon, key }) => (
            <NavLink key={to} to={to} onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => clsx(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                isActive ? 'bg-orange-50 text-orange-700 border border-orange-100' : 'text-slate-600 hover:bg-slate-50 border border-transparent'
              )}
            >
              <Icon size={18} strokeWidth={2} />{t(key)}
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
              <p className="text-xs text-orange-500 font-medium">{t('hospital.portal')}</p>
            </div>
          </Link>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors">
            <LogOut size={16} strokeWidth={2} />{t('common.signOut')}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-16 bg-white/95 backdrop-blur-lg border-b border-orange-100 sticky top-0 z-30 flex items-center px-4 md:px-6 gap-3 shadow-sm">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100"><Menu size={20} /></button>
          <h1 className="font-semibold text-slate-900 text-base md:text-lg flex-1 truncate">{t(TITLE_KEYS[pathname] || 'hospital.portal')}</h1>
          <LanguageSwitcher className="mr-1" />
          <NotificationBell />
        </header>
        <main className="flex-1 overflow-auto"><Outlet /></main>
      </div>
    </div>
  )
}
