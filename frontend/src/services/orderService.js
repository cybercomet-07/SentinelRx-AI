import api from './api'
import { cartService } from './cartService'

export const orderService = {
  /** Create order from backend cart. */
  createFromCart: () => api.post('/orders/create-from-cart'),

  /** Place order: syncs items to backend cart, then creates order. Items: [{ medicine_id, quantity }] or [{ id, qty }] */
  placeOrder: async (items) => {
    for (const it of items) {
      const mid = it.medicine_id ?? it.id
      const qty = it.quantity ?? it.qty
      await cartService.addItem(mid, qty)
    }
    return api.post('/orders/create-from-cart')
  },
  getMyOrders: (params) => api.get('/orders/my', { params }),
  getAll: (params) => api.get('/orders', { params }),
  updateStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
}
