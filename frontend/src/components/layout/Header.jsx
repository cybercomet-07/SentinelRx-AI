import { ShoppingCart } from 'lucide-react'
import { useCart } from '../../hooks/useCart'
import { useAuth } from '../../hooks/useAuth'
import NotificationBell from '../notifications/NotificationBell'

export default function Header({ title }) {
  const { count, setOpen } = useCart()
  const { isAdmin } = useAuth()

  return (
    <header className="h-16 bg-white/95 backdrop-blur-lg border-b border-slate-200/80 sticky top-0 z-30 flex items-center px-6 gap-4 shadow-sm">
      <h1 className="font-display font-semibold text-slate-900 text-lg flex-1 tracking-tight">{title}</h1>
      <div className="flex items-center gap-1">
        <NotificationBell />
        {!isAdmin && (
          <button
            onClick={() => setOpen(true)}
            className="relative p-2.5 hover:bg-slate-100 rounded-xl transition-colors duration-200"
          >
            <ShoppingCart size={20} className="text-slate-600" strokeWidth={2} />
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center font-semibold">
                {count}
              </span>
            )}
          </button>
        )}
      </div>
    </header>
  )
}
