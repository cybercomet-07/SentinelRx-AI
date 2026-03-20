import api from './api'

export const doctorService = {
  getStats:       ()           => api.get('/doctor/stats'),
  getProfile:     ()           => api.get('/doctor/profile'),
  updateProfile:  (data)       => api.put('/doctor/profile', data),
  getAppointments:(params)     => api.get('/doctor/appointments', { params }),
  updateAppointment:(id, data) => api.put(`/doctor/appointments/${id}`, data),
  getPatients:    ()           => api.get('/doctor/patients'),
}
