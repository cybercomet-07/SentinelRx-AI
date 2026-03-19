import api from './api'

export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (email, password, selectedRole) => api.post('/auth/login', { email, password, selected_role: selectedRole }),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/me', data),
}
