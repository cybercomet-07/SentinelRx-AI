import { CheckCircle, XCircle, Package } from 'lucide-react'

export default function OrderSuggestionCard({ order, onConfirm, onCancel, confirmed }) {
  const statusColors = {
    confirmed: 'bg-green-50 border-green-200',
    cancelled: 'bg-red-50 border-red-200',
    pending: 'bg-white border-gray-200',
  }
  const status = confirmed === true ? 'confirmed' : confirmed === false ? 'cancelled' : 'pending'

  return (
    <div className={`border rounded-2xl p-4 w-72 shadow-soft ${statusColors[status]}`}>
      <div className="flex items-center gap-2 mb-3">
        <Package size={16} className="text-mint-600" />
        <p className="text-sm font-semibold text-gray-800">Order Preview</p>
        <span className="ml-auto text-xs text-gray-400 font-mono">#{order.order_id}</span>
      </div>

      <div className="space-y-1.5 mb-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">{order.medicine_name}</span>
          <span className="font-medium">₹{order.price}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-500">
          <span>Qty × {order.quantity}</span>
          <span className="font-semibold text-gray-800">₹{order.subtotal}</span>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-3 mb-4">
        <div className="flex justify-between text-sm font-semibold">
          <span>Total</span>
          <span className="text-mint-700">₹{order.subtotal}</span>
        </div>
      </div>

      {status === 'pending' && (
        <div className="flex gap-2">
          <button
            onClick={onConfirm}
            className="flex-1 flex items-center justify-center gap-1.5 bg-mint-500 hover:bg-mint-600 text-white text-sm py-2.5 rounded-xl font-medium transition-colors"
          >
            <CheckCircle size={15} />
            Confirm
          </button>
          <button
            onClick={onCancel}
            className="flex-1 flex items-center justify-center gap-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm py-2.5 rounded-xl font-medium transition-colors"
          >
            <XCircle size={15} />
            Cancel
          </button>
        </div>
      )}

      {status === 'confirmed' && (
        <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
          <CheckCircle size={16} />
          Order Confirmed!
        </div>
      )}

      {status === 'cancelled' && (
        <div className="flex items-center gap-2 text-red-500 text-sm font-medium">
          <XCircle size={16} />
          Order Cancelled
        </div>
      )}
    </div>
  )
}
