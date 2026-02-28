import StatusBadge from './StatusBadge'

export default function OrderHistoryTable({ orders }) {
  if (!orders?.length) return (
    <div className="text-center py-16 text-gray-400">No orders yet.</div>
  )

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-soft">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            {['Order ID', 'Date', 'Medicines', 'Total', 'Status'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {orders.map(order => (
            <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
              <td className="px-4 py-3 font-mono text-xs text-gray-500">#{order.id}</td>
              <td className="px-4 py-3 text-gray-600">{new Date(order.created_at).toLocaleDateString()}</td>
              <td className="px-4 py-3 text-gray-800">{order.items?.map(i => `${i.medicine_name} ×${i.quantity}`).join(', ') || '—'}</td>
              <td className="px-4 py-3 font-semibold text-mint-700">₹{order.total}</td>
              <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
