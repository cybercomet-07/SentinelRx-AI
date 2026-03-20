import { useState } from 'react'
import { Outlet, useLocation, NavLink, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useTranslation } from 'react-i18next'
import { Menu, X, Stethoscope, LayoutDashboard, CalendarDays, Users, FileText, Bell, Settings, LogOut } from 'lucide-react'
import clsx from 'clsx'
import LanguageSwitcher from '../../components/ui/LanguageSwitcher'

const NAV_KEYS = [
  { to: '/doctor/dashboard',     icon: LayoutDashboard, key: 'doctor.dashboard' },
  { to: '/doctor/appointments',  icon: CalendarDays,    key: 'doctor.appointments' },
  { to: '/doctor/patients',      icon: Users,           key: 'doctor.patients' },
  { to: '/doctor/prescriptions', icon: FileText,        key: 'doctor.prescriptions' },
  { to: '/doctor/notifications', icon: Bell,            key: 'doctor.notifications' },
  { to: '/doctor/profile',       icon: Settings,        key: 'doctor.profile' },
]

const TITLE_KEYS = {
  '/doctor/dashboard':     'doctor.dashboard',
  '/doctor/appointments':  'doctor.appointments',
  '/doctor/patients':      'doctor.patients',
  '/doctor/prescriptions': 'doctor.prescriptions',
  '/doctor/notifications': 'doctor.notifications',
  '/doctor/profile':       'doctor.profile',
}

export default function DoctorLayout() {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="flex h-screen overflow-hidden bg-blue-50/30">
      {/* Mobile backdrop */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={clsx(
        'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-blue-100 flex flex-col shadow-sm transition-transform duration-300',
        'md:relative md:translate-x-0 md:z-auto md:flex md:shrink-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="p-6 border-b border-blue-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
              <Stethoscope size={20} className="text-white" strokeWidth={2} />
            </div>
            <div>
              <p className="font-semibold text-slate-900 text-base leading-tight">SentinelRx AI</p>
              <p className="text-xs text-blue-500 font-medium">{t('doctor.portal')}</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1 rounded-lg text-slate-400"><X size={18} /></button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV_KEYS.map(({ to, icon: Icon, key }) => (
            <NavLink key={to} to={to} onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => clsx(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                isActive ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'text-slate-600 hover:bg-slate-50 border border-transparent'
              )}
            >
              <Icon size={18} strokeWidth={2} />{t(key)}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <Link to="/doctor/profile" onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 mb-2 rounded-xl bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-semibold">
              {user?.name?.[0]?.toUpperCase() || 'D'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{user?.name || 'Doctor'}</p>
              <p className="text-xs text-blue-500 font-medium">{t('doctor.portal')}</p>
            </div>
          </Link>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors">
            <LogOut size={16} strokeWidth={2} />{t('common.signOut')}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-16 bg-white/95 backdrop-blur-lg border-b border-blue-100 sticky top-0 z-30 flex items-center px-4 md:px-6 gap-3 shadow-sm">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100">
            <Menu size={20} />
          </button>
          <h1 className="font-semibold text-slate-900 text-base md:text-lg flex-1 truncate">{t(TITLE_KEYS[pathname] || 'doctor.portal')}</h1>
          <LanguageSwitcher className="mr-1" />
          <Bell size={20} className="text-slate-500 cursor-pointer hover:text-blue-600" />
        </header>
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
