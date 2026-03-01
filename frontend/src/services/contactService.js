import api from './api'

export const contactService = {
  create: (data) => api.post('/contact', data),
  list: (page = 1, limit = 20) => api.get('/contact', { params: { page, limit } }),
}
