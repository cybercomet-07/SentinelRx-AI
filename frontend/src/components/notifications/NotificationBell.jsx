import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { notificationService } from '../../services/notificationService'

export default function NotificationBell() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    notificationService.getAll()
      .then(r => {
        const items = r.data?.items ?? r.data ?? []
        const list = Array.isArray(items) ? items : []
        setCount(list.filter(n => !(n.read ?? n.is_read)).length)
      })
      .catch(() => {})
  }, [])

  return (
    <button className="relative p-2.5 hover:bg-gray-100 rounded-xl transition-colors">
      <Bell size={20} className="text-gray-600" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-400 text-white text-xs rounded-full flex items-center justify-center font-medium">
          {count}
        </span>
      )}
    </button>
  )
}
