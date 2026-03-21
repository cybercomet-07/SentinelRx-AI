import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { Bell, CheckCheck } from 'lucide-react'
import { notificationService } from '../../services/notificationService'
import Loader from '../../components/ui/Loader'
import ErrorState from '../../components/ui/ErrorState'

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function DoctorNotificationsPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const load = () => {
    setError(false)
    setLoading(true)
    notificationService.getAll()
      .then(r => setItems(r.data.items || []))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  if (loading && items.length === 0) return <Loader center />
  if (error && items.length === 0) return <ErrorState message="Unable to load notifications." onRetry={load} />

  const markRead = async (id) => {
    try {
      await notificationService.markRead(id)
      setItems(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
      window.dispatchEvent(new Event('notifications-updated'))
    } catch { /* silent */ }
  }

  const markAll = async () => {
    const unread = items.filter(n => !n.is_read)
    await Promise.all(unread.map(n => notificationService.markRead(n.id)))
    setItems(prev => prev.map(n => ({ ...n, is_read: true })))
    window.dispatchEvent(new Event('notifications-updated'))
    toast.success('All marked as read')
  }

  const unreadCount = items.filter(n => !n.is_read).length

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="text-slate-500 text-sm">{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAll} className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium">
            <CheckCheck size={15} /> Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
          <Bell size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(n => (
            <div
              key={n.id}
              onClick={() => !n.is_read && markRead(n.id)}
              className={`flex gap-3 p-4 rounded-2xl border cursor-pointer transition-colors ${
                n.is_read ? 'bg-white border-slate-200' : 'bg-blue-50 border-blue-100 hover:bg-blue-100/50'
              }`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${n.is_read ? 'bg-slate-100' : 'bg-blue-100'}`}>
                <Bell size={16} className={n.is_read ? 'text-slate-500' : 'text-blue-600'} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${n.is_read ? 'text-slate-700' : 'text-slate-900'}`}>{n.title}</p>
                <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">{n.message}</p>
                <p className="text-xs text-slate-400 mt-1">{timeAgo(n.created_at)}</p>
              </div>
              {!n.is_read && (
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
