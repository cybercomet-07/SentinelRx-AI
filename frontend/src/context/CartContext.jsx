import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { useAuthContext } from './AuthContext'
import { cartService } from '../services/cartService'

const CartContext = createContext(null)

/** Map backend cart item to unified frontend shape */
function mapCartItem(item) {
  return {
    id: item.id,
    medicine_id: item.medicine_id,
    name: item.medicine_name ?? item.name,
    price: item.medicine_price ?? item.price,
    qty: item.quantity ?? item.qty,
  }
}

export function CartProvider({ children }) {
  const { user } = useAuthContext()
  const [items, setItems] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const fetchCart = useCallback(async () => {
    // Cart is only available for patients (USER role). Skip for all other roles to avoid 403s.
    if (!user || user?.role !== 'user') return
    try {
      const res = await cartService.getCart()
      const data = res.data
      const list = data?.items ?? []
      setItems(list.map(mapCartItem))
    } catch {
      setItems([])
    }
  }, [user])

  useEffect(() => {
    if (user) {
      fetchCart()
    } else {
      setItems([])
    }
  }, [user, fetchCart])

  const isPatient = user?.role === 'user'

  const addItem = async (medicine, qty = 1) => {
    const medicineId = medicine?.medicine_id ?? medicine?.id
    if (!medicineId) return

    if (user && isPatient) {
      try {
        await cartService.addItem(medicineId, qty)
        toast.success('Added to cart')
        await fetchCart()
      } catch {
        toast.error('Failed to add to cart')
      }
    } else {
      setItems(prev => {
        const exists = prev.find(i => (i.medicine_id ?? i.id) === medicineId)
        if (exists) {
          toast.success('Quantity updated')
          return prev.map(i =>
            (i.medicine_id ?? i.id) === medicineId ? { ...i, qty: i.qty + qty } : i
          )
        }
        toast.success('Added to cart')
        return [...prev, { id: `temp-${medicineId}`, medicine_id: medicineId, name: medicine.name ?? medicine.medicine_name, price: medicine.price ?? medicine.medicine_price, qty }]
      })
    }
  }

  const removeItem = async (id) => {
    if (user && isPatient) {
      try {
        await cartService.removeItem(id)
        toast.success('Removed from cart')
        await fetchCart()
      } catch {
        toast.error('Failed to remove item')
      }
    } else {
      setItems(prev => prev.filter(i => i.id !== id))
    }
  }

  const updateQty = async (id, qty) => {
    if (qty <= 0) {
      await removeItem(id)
      return
    }
    const item = items.find(i => i.id === id)
    if (!item) return

    if (user && isPatient) {
      try {
        await cartService.removeItem(id)
        await cartService.addItem(item.medicine_id ?? item.id, qty)
        toast.success('Quantity updated')
        await fetchCart()
      } catch {
        toast.error('Failed to update quantity')
      }
    } else {
      setItems(prev => prev.map(i => (i.id === id ? { ...i, qty } : i)))
    }
  }

  const clearCart = () => setItems([])

  const total = items.reduce((s, i) => s + (i.price ?? 0) * (i.qty ?? 0), 0)
  const count = items.reduce((s, i) => s + (i.qty ?? 0), 0)

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQty,
        clearCart,
        total,
        count,
        open,
        setOpen,
        loading,
        fetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCartContext = () => useContext(CartContext)
