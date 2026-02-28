import api from './api'

export const chatService = {
  sendMessage: (message, history = []) =>
    api.post('/chat/message', { message, history }),

  confirmOrder: (orderId) =>
    api.post(`/chat/orders/${orderId}/confirm`),

  cancelOrder: (orderId) =>
    api.post(`/chat/orders/${orderId}/cancel`),
}
