import { ShoppingCart } from 'lucide-react'
import { useCart } from '../../hooks/useCart'
import { useAuth } from '../../hooks/useAuth'
import NotificationBell from '../notifications/NotificationBell'

export default function Header({ title }) {
  const { count, setOpen } = useCart()
  const { isAdmin } = useAuth()

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-30 flex items-center px-6 gap-4">
      <h1 className="font-display font-semibold text-gray-900 text-lg flex-1">{title}</h1>
      <div className="flex items-center gap-2">
        <NotificationBell />
        {!isAdmin && (
          <button
            onClick={() => setOpen(true)}
            className="relative p-2.5 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ShoppingCart size={20} className="text-gray-600" />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-mint-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                {count}
              </span>
            )}
          </button>
        )}
      </div>
    </header>
  )
}
