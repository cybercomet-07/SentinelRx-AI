import api from './api'

export const medicineService = {
  getAll: (params) => {
    const { search, category, ...rest } = params || {}
    return api.get('/medicines', { params: { q: search, category, ...rest } })
  },
  getOne: (id) => api.get(`/medicines/${id}`),
  search: (q) => api.get('/medicines', { params: { q } }),

  // Admin - backend uses /medicines with PATCH
  create: (data) => api.post('/medicines', data),
  update: (id, data) => api.patch(`/medicines/${id}`, data),
  delete: (id) => api.delete(`/medicines/${id}`),
}
