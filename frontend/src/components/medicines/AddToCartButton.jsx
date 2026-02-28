import { ShoppingCart } from 'lucide-react'
import { useCart } from '../../hooks/useCart'

export default function AddToCartButton({ medicine }) {
  const { addItem } = useCart()
  return (
    <button
      onClick={() => addItem(medicine)}
      disabled={medicine.quantity === 0}
      className="w-full flex items-center justify-center gap-2 bg-mint-500 hover:bg-mint-600 disabled:opacity-40 text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
    >
      <ShoppingCart size={15} />
      Add to Cart
    </button>
  )
}
