import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { MessageSquare, ShoppingBag, History, Bell, Package } from 'lucide-react'
import { Link } from 'react-router-dom'
import { refillAlertService } from '../../services/refillAlertService'
import { orderService } from '../../services/orderService'
import StatusBadge from '../../components/orders/StatusBadge'

const QUICK_ACTIONS = [
  { to: '/user/chat', icon: MessageSquare, label: 'AI Chat', descKey: 'chat', color: 'from-mint-400 to-mint-600' },
  { to: '/user/medicines', icon: ShoppingBag, label: 'Browse Medicines', descKey: 'medicines', color: 'from-blue-400 to-blue-600' },
  { to: '/user/orders', icon: History, label: 'Order History', descKey: 'orders', color: 'from-purple-400 to-purple-600' },
  { to: '/user/notifications', icon: Bell, label: 'Notifications', descKey: 'refill', color: 'from-orange-400 to-orange-500' },
]

const DESC_MAP = {
  chat: 'Order via voice or text',
  medicines: 'View full catalogue',
  orders: 'Track your orders',
  refill: (count) => `${count} refill alert${count !== 1 ? 's' : ''}`,
}

export default function Dashboard() {
  const { user } = useAuth()
  const [refillCount, setRefillCount] = useState(0)
  const [recentOrders, setRecentOrders] = useState([])

  useEffect(() => {
    refillAlertService.getAll().then((res) => {
      const items = res.data?.items ?? []
      setRefillCount(Array.isArray(items) ? items.length : 0)
    }).catch(() => setRefillCount(0))
  }, [])

  useEffect(() => {
    orderService.getMyOrders().then((res) => {
      const items = res.data?.items ?? []
      setRecentOrders(Array.isArray(items) ? items.slice(0, 3) : [])
    }).catch(() => setRecentOrders([]))
  }, [])

  return (
    <div className="p-6 space-y-6">
      {/* Welcome banner */}
      <div className="relative bg-gradient-to-r from-mint-500 to-sage-500 rounded-2xl p-6 overflow-hidden">
        <div className="absolute top-[-20px] right-[-20px] w-32 h-32 rounded-full bg-white/10" />
        <div className="absolute bottom-[-30px] right-24 w-24 h-24 rounded-full bg-white/10" />
        <div className="relative">
          <p className="text-white/80 text-sm mb-1">Good day,</p>
          <h2 className="font-display text-2xl font-bold text-white">{user?.name || 'User'} 👋</h2>
          <p className="text-white/80 text-sm mt-1">
            You have {refillCount} medicine{refillCount !== 1 ? 's' : ''} due for refill.
          </p>
          <Link to="/user/notifications" className="mt-3 inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
            View Refill Alerts →
          </Link>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {QUICK_ACTIONS.map(({ to, icon: Icon, label, descKey, color }) => {
          const desc = typeof DESC_MAP[descKey] === 'function' ? DESC_MAP[descKey](refillCount) : DESC_MAP[descKey]
          return (
            <Link key={to} to={to} className="bg-white border border-gray-100 rounded-2xl p-4 card-lift shadow-soft group">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3 shadow-sm`}>
                <Icon size={18} className="text-white" />
              </div>
              <p className="font-semibold text-gray-900 text-sm">{label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
            </Link>
          )
        })}
      </div>

      {/* Recent Orders */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Package size={16} className="text-mint-600" />
            <h3 className="font-display font-semibold text-gray-900">Recent Orders</h3>
          </div>
          <Link to="/user/orders" className="text-xs text-mint-600 hover:underline font-medium">View all →</Link>
        </div>
        <div className="space-y-3">
          {recentOrders.length === 0 ? (
            <p className="text-sm text-gray-400 py-4">No orders yet.</p>
          ) : (
            recentOrders.map((order) => (
              <div key={order.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <div className="w-9 h-9 rounded-xl bg-mint-50 flex items-center justify-center shrink-0">
                  <ShoppingBag size={15} className="text-mint-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {order.items?.map((i) => `${i.medicine_name} ×${i.quantity}`).join(', ') ?? 'Order'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(order.created_at).toLocaleDateString()} · #{order.id}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-mint-700">₹{order.total_amount ?? order.total}</p>
                  <StatusBadge status={order.status} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
