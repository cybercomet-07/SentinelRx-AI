import { Users, ShoppingBag, TrendingUp, AlertTriangle } from 'lucide-react'

const STATS = [
  { key: 'total_users', label: 'Total Users', icon: Users, color: 'bg-blue-50 text-blue-600' },
  { key: 'total_orders', label: 'Total Orders', icon: ShoppingBag, color: 'bg-mint-50 text-mint-600' },
  { key: 'total_revenue', label: 'Revenue', icon: TrendingUp, color: 'bg-green-50 text-green-600', prefix: '₹' },
  { key: 'low_stock_count', label: 'Low Stock', icon: AlertTriangle, color: 'bg-orange-50 text-orange-600' },
]

export default function DashboardStats({ stats }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {STATS.map(({ key, label, icon: Icon, color, prefix = '' }) => (
        <div key={key} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-soft">
          <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
            <Icon size={18} />
          </div>
          <p className="text-2xl font-display font-bold text-gray-900">{prefix}{stats?.[key] ?? '—'}</p>
          <p className="text-xs text-gray-500 mt-1">{label}</p>
        </div>
      ))}
    </div>
  )
}
