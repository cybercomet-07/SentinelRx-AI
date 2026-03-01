import api from './api'

export const prescriptionService = {
  create: (payload) =>
    api.post('/prescriptions', {
      patient_name: payload.patient_name,
      doctor_name: payload.doctor_name || null,
      prescription_text: payload.prescription_text,
      extra_data: payload.extra_data || null,
    }),

  getOne: (id) => api.get(`/prescriptions/${id}`),

  getSymptomRecommendation: (message) =>
    api.post('/prescriptions/symptom-recommendation', { message }),
}
