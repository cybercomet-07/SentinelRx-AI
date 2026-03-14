import StatusBadge from '../orders/StatusBadge'
import { ORDER_STATUS, STATUS_TRANSITIONS } from '../../utils/constants'
import { orderService } from '../../services/orderService'
import toast from 'react-hot-toast'

export default function OrdersTable({ orders, onRefresh }) {
  const handleStatusChange = async (id, status) => {
    try {
      await orderService.updateStatus(id, status)
      toast.success('Status updated')
      onRefresh?.()
    } catch (err) {
      const d = err.response?.data?.detail
      const msg = Array.isArray(d) ? d.map(e => e.msg || e).join(', ') : (typeof d === 'string' ? d : err.message) || 'Failed to update status'
      toast.error(msg)
    }
  }

  const getStatusOptions = (currentStatus) => {
    const current = (currentStatus || '').toUpperCase()
    const allowed = STATUS_TRANSITIONS[current] || []
    const options = [current, ...allowed.filter(s => s !== current)]
    return options
  }

  if (!orders?.length) return <div className="text-center py-16 text-gray-400">No orders found.</div>

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-soft">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            {['Order ID', 'User', 'Address', 'Medicines', 'Total', 'Payment', 'Receipt', 'Status', 'Update'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {orders.map(o => (
            <tr key={o.id} className="hover:bg-gray-50/50 transition-colors">
              <td className="px-4 py-3 font-mono text-xs text-gray-400">#{String(o.id).slice(0, 8)}…</td>
              <td className="px-4 py-3 text-gray-800">
                <span className="font-medium">{(o.user_name || o.userName || o.user?.name || o.customer_name || '').trim() || '—'}</span>
                {(o.user_email ?? o.user?.email) && <span className="block text-xs text-gray-500">{o.user_email ?? o.user?.email}</span>}
              </td>
              <td className="px-4 py-3 text-gray-600 max-w-[180px]" title={o.delivery_address || ''}>
                <span className="line-clamp-2 text-xs">{(o.delivery_address || '—').slice(0, 50)}{(o.delivery_address?.length > 50 ? '…' : '')}</span>
              </td>
              <td className="px-4 py-3 text-gray-600 max-w-[280px]" title={o.items?.map(i => `${i.medicine_name} (×${i.quantity})`).join(', ')}>
                <span className="line-clamp-2">{o.items?.map(i => `${i.medicine_name} ×${i.quantity}`).join(', ') || '—'}</span>
              </td>
              <td className="px-4 py-3 font-semibold text-mint-700">₹{o.total_amount ?? o.total ?? 0}</td>
              <td className="px-4 py-3 text-gray-600 text-xs">{(o.payment_method === 'upi' ? 'UPI' : o.payment_method === 'cod' ? 'COD' : o.payment_method) || '—'}</td>
              <td className="px-4 py-3">
                {o.payment_method === 'upi' && o.payment_receipt_url ? (
                  <a href={o.payment_receipt_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-mint-600 hover:text-mint-700 text-xs font-medium" title="View transaction screenshot">
                    <img src={o.payment_receipt_url} alt="Receipt" className="w-10 h-10 rounded-lg object-cover border border-gray-200 hover:ring-2 hover:ring-mint-300 cursor-pointer" />
                  </a>
                ) : (
                  <span className="text-gray-400 text-xs">—</span>
                )}
              </td>
              <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
              <td className="px-4 py-3">
                <select
                  value={o.status}
                  onChange={e => handleStatusChange(o.id, e.target.value)}
                  className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-mint-300 bg-white"
                >
                  {getStatusOptions(o.status).map(v => (
                    <option key={v} value={v}>{ORDER_STATUS[v]?.label ?? v}</option>
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
