import api from './api'

export const refillAlertService = {
  getAll: (params = {}) =>
    api.get('/refill-alerts', {
      params: { page: 1, limit: 50, include_completed: false, ...params },
    }),

  create: (payload) =>
    api.post('/refill-alerts', {
      medicine_id: payload.medicine_id,
      last_purchase_date: payload.last_purchase_date,
      suggested_refill_date: payload.suggested_refill_date,
    }),

  complete: (id) => api.patch(`/refill-alerts/${id}/complete`),

  delete: (id) => api.delete(`/refill-alerts/${id}`),
}
