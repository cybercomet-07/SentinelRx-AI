import api from './api'

export const patientService = {
  listDoctors:        (params)     => api.get('/patient/doctors', { params }),
  getDoctorDetail:    (doctorId)   => api.get(`/patient/doctors/${doctorId}`),
  bookAppointment:    (data)       => api.post('/patient/appointments', data),
  listAppointments:   ()           => api.get('/patient/appointments'),
  cancelAppointment:  (id)         => api.delete(`/patient/appointments/${id}`),
}
