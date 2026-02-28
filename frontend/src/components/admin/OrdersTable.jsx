import StatusBadge from '../orders/StatusBadge'
import { ORDER_STATUS } from '../../utils/constants'
import { orderService } from '../../services/orderService'
import toast from 'react-hot-toast'

export default function OrdersTable({ orders, onRefresh }) {
  const handleStatusChange = async (id, status) => {
    try {
      await orderService.updateStatus(id, status)
      toast.success('Status updated')
      onRefresh?.()
    } catch { toast.error('Failed to update status') }
  }

  if (!orders?.length) return <div className="text-center py-16 text-gray-400">No orders found.</div>

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-soft">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            {['Order ID', 'User', 'Medicines', 'Total', 'Status', 'Update'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {orders.map(o => (
            <tr key={o.id} className="hover:bg-gray-50/50 transition-colors">
              <td className="px-4 py-3 font-mono text-xs text-gray-400">#{o.id}</td>
              <td className="px-4 py-3 text-gray-800">{o.user_name || o.user_email}</td>
              <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{o.items?.map(i => i.medicine_name).join(', ')}</td>
              <td className="px-4 py-3 font-semibold text-mint-700">₹{o.total}</td>
              <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
              <td className="px-4 py-3">
                <select
                  value={o.status}
                  onChange={e => handleStatusChange(o.id, e.target.value)}
                  className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-mint-300 bg-white"
                >
                  {Object.entries(ORDER_STATUS).map(([v, { label }]) => (
                    <option key={v} value={v}>{label}</option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
