import { Pencil, Trash2 } from 'lucide-react'
import LowStockBadge from './LowStockBadge'

export default function InventoryTable({ medicines, onEdit, onDelete }) {
  if (!medicines?.length) return <div className="text-center py-16 text-gray-400">No medicines yet.</div>

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-soft">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            {['ID', 'Name', 'Category', 'Price', 'Qty', 'Status', 'Actions'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {medicines.map(m => (
            <tr key={m.id} className="hover:bg-gray-50/50 transition-colors">
              <td className="px-4 py-3 font-mono text-xs text-gray-400">{m.id}</td>
              <td className="px-4 py-3 font-medium text-gray-900">{m.name}</td>
              <td className="px-4 py-3 text-gray-500">{m.category}</td>
              <td className="px-4 py-3 text-mint-700 font-semibold">₹{m.price}</td>
              <td className="px-4 py-3 text-gray-700">{m.quantity}</td>
              <td className="px-4 py-3"><LowStockBadge qty={m.quantity} /></td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <button onClick={() => onEdit(m)} className="p-1.5 hover:bg-blue-50 text-blue-500 rounded-lg transition-colors">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => onDelete(m.id)} className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
