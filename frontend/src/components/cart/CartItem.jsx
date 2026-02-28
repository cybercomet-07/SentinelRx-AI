import { Minus, Plus, Trash2 } from 'lucide-react'
import { useCart } from '../../hooks/useCart'

export default function CartItem({ item }) {
  const { updateQty, removeItem } = useCart()
  const name = item.name ?? item.medicine_name
  const price = item.price ?? item.medicine_price ?? 0
  const qty = item.qty ?? item.quantity ?? 0

  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
        <p className="text-xs text-mint-700 font-semibold">₹{price}</p>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => updateQty(item.id, qty - 1)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
          <Minus size={13} />
        </button>
        <span className="text-sm font-medium w-6 text-center">{qty}</span>
        <button onClick={() => updateQty(item.id, qty + 1)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
          <Plus size={13} />
        </button>
      </div>
      <p className="text-sm font-semibold text-gray-900 w-14 text-right">₹{price * qty}</p>
      <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600 transition-colors">
        <Trash2 size={14} />
      </button>
    </div>
  )
}
