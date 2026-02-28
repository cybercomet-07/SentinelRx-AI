import api from './api'

export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (email, password) => api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/me', data),
}
