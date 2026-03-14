import api from './api'
import { cartService } from './cartService'

export const orderService = {
  /** Create order from backend cart. Pass delivery { delivery_address, delivery_latitude, delivery_longitude, address_source } and payment_method (cod | upi). */
  createFromCart: (delivery, paymentMethod = 'cod') => {
    const d = delivery && typeof delivery === 'object' ? delivery : {}
    const body = {
      delivery_address: d.delivery_address ?? null,
      delivery_latitude: typeof d.delivery_latitude === 'number' ? d.delivery_latitude : null,
      delivery_longitude: typeof d.delivery_longitude === 'number' ? d.delivery_longitude : null,
      address_source: d.address_source ?? null,
      payment_method: paymentMethod === 'upi' ? 'upi' : 'cod',
    }
    return api.post('/orders/create-from-cart', body)
  },

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
  updateStatus: (id, status) => api.patch(`/orders/${id}/status`, { status: (status || '').toUpperCase() }),
}
