import { ShoppingCart, Package } from 'lucide-react'
import { useCart } from '../../hooks/useCart'
import LowStockBadge from '../admin/LowStockBadge'

export default function MedicineCard({ medicine }) {
  const { addItem } = useCart()

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-soft card-lift">
      {/* Image */}
      <div className="w-full h-32 bg-gradient-to-br from-mint-50 to-sage-100 rounded-xl flex items-center justify-center mb-4">
        {medicine.image_url
          ? <img src={medicine.image_url} alt={medicine.name} className="h-24 w-24 object-contain" />
          : <Package size={36} className="text-mint-300" />
        }
      </div>

      {/* Info */}
      <div className="mb-3">
        <h3 className="font-semibold text-gray-900 text-sm leading-tight">{medicine.name}</h3>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {medicine.product_id && (
            <span className="text-xs text-gray-500">ID: {medicine.product_id}</span>
          )}
          {medicine.pin && (
            <span className="text-xs text-gray-500">PIN: {medicine.pin}</span>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-0.5">{medicine.category}</p>
        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{medicine.description}</p>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="font-bold text-mint-700 text-base">₹{medicine.price}</p>
          <LowStockBadge qty={medicine.quantity} />
        </div>
        <button
          onClick={() => addItem(medicine)}
          disabled={medicine.quantity === 0}
          className="flex items-center gap-1.5 bg-mint-500 hover:bg-mint-600 disabled:opacity-40 text-white text-xs font-medium px-3 py-2 rounded-xl transition-colors"
        >
          <ShoppingCart size={13} />
          Add
        </button>
      </div>
    </div>
  )
}
