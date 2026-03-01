import api from './api'

export const prescriptionService = {
  uploadImage: (base64DataUrl) =>
    api.post('/prescriptions/upload-image', { image: base64DataUrl }),

  create: (payload) =>
    api.post('/prescriptions', {
      patient_name: payload.patient_name,
      doctor_name: payload.doctor_name || null,
      prescription_text: payload.prescription_text,
      image_url: payload.image_url || null,
      extra_data: payload.extra_data || null,
    }),

  getMy: () => api.get('/prescriptions/my'),
  getOne: (id) => api.get(`/prescriptions/${id}`),

  getSymptomRecommendation: (message, lang = null) =>
    api.post('/prescriptions/symptom-recommendation', { message, ...(lang && { lang }) }),

  // Admin
  adminList: () => api.get('/admin/prescriptions'),
  adminGet: (id) => api.get(`/admin/prescriptions/${id}`),
  adminUpdate: (id, payload) => api.patch(`/admin/prescriptions/${id}`, payload),
}
