import api from './api'

export const callScheduleService = {
  list: () => api.get('/call-schedules'),
  create: (data) => api.post('/call-schedules', data),
  delete: (id) => api.delete(`/call-schedules/${id}`),
}
