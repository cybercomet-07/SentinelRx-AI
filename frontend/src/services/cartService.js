import api from './api'

export const cartService = {
  getCart: () => api.get('/cart'),
  addItem: (medicine_id, quantity = 1) => api.post('/cart/add', { medicine_id, quantity }),
  removeItem: (item_id) => api.delete(`/cart/${item_id}`),
}
