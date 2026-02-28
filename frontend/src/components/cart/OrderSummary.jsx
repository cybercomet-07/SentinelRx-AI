import { useCart } from '../../hooks/useCart'

export default function OrderSummary() {
  const { total } = useCart()
  const delivery = 30
  const grandTotal = total + delivery

  return (
    <div className="bg-mint-50 rounded-xl p-4 space-y-2 text-sm">
      <div className="flex justify-between text-gray-600">
        <span>Subtotal</span>
        <span>₹{total}</span>
      </div>
      <div className="flex justify-between text-gray-600">
        <span>Delivery</span>
        <span>₹{delivery}</span>
      </div>
      <div className="flex justify-between font-semibold text-gray-900 pt-2 border-t border-mint-200">
        <span>Total</span>
        <span className="text-mint-700">₹{grandTotal}</span>
      </div>
    </div>
  )
}
