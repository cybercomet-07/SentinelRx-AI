import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { notificationService } from '../../services/notificationService'

function fetchUnreadCount(setCount) {
  notificationService.getAll()
    .then(r => {
      const items = r.data?.items ?? r.data ?? []
      const list = Array.isArray(items) ? items : []
      setCount(list.filter(n => !(n.read ?? n.is_read)).length)
    })
    .catch(() => {})
}

export default function NotificationBell() {
  const [count, setCount] = useState(0)
  const location = useLocation()
  const { isAdmin } = useAuth()
  const notificationsPath = isAdmin ? '/admin/notifications' : '/user/notifications'

  useEffect(() => {
    fetchUnreadCount(setCount)
  }, [])

  // Refetch when user visits notifications page (they get marked as read there)
  useEffect(() => {
    if (location.pathname === '/user/notifications' || location.pathname === '/admin/notifications') {
      fetchUnreadCount(setCount)
    }
  }, [location.pathname])

  // Listen for updates when notifications are marked as read
  useEffect(() => {
    const handler = () => fetchUnreadCount(setCount)
    window.addEventListener('notifications-updated', handler)
    return () => window.removeEventListener('notifications-updated', handler)
  }, [])

  // Poll for new notifications (e.g. new orders) when admin is on dashboard
  useEffect(() => {
    if (!isAdmin) return
    const interval = setInterval(() => fetchUnreadCount(setCount), 30000)
    return () => clearInterval(interval)
  }, [isAdmin])

  return (
    <Link
      to={notificationsPath}
      className="relative p-2.5 hover:bg-slate-100 rounded-xl transition-colors duration-200 inline-flex items-center justify-center cursor-pointer group"
      aria-label="Notifications"
    >
      <Bell size={20} className="text-slate-600 group-hover:text-slate-900" strokeWidth={2} />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
          {count}
        </span>
      )}
    </Link>
  )
}
