import api from './api'

export const hospitalService = {
  // Existing
  getStats:          ()             => api.get('/hospital/stats'),
  getBeds:           (params)       => api.get('/hospital/beds', { params }),
  createBed:         (data)         => api.post('/hospital/beds', data),
  updateBed:         (id, data)     => api.put(`/hospital/beds/${id}`, data),
  getAdmissions:     (params)       => api.get('/hospital/admissions', { params }),
  createAdmission:   (data)         => api.post('/hospital/admissions', data),
  updateAdmission:   (id, data)     => api.put(`/hospital/admissions/${id}`, data),
  getInventory:      (params)       => api.get('/hospital/inventory', { params }),

  // Hospital Medicine Management
  getMedicines:      (params)       => api.get('/hospital/medicines', { params }),
  createMedicine:    (data)         => api.post('/hospital/medicines', data),
  updateMedicine:    (id, data)     => api.put(`/hospital/medicines/${id}`, data),
  deleteMedicine:    (id)           => api.delete(`/hospital/medicines/${id}`),

  // Patient Visits (OPD)
  getVisits:         (params)       => api.get('/hospital/visits', { params }),
  createVisit:       (data)         => api.post('/hospital/visits', data),
  updateVisit:       (id, data)     => api.put(`/hospital/visits/${id}`, data),
  deleteVisit:       (id)           => api.delete(`/hospital/visits/${id}`),

  // Billing
  getBills:          (params)       => api.get('/hospital/bills', { params }),
  createBill:        (formData)     => api.post('/hospital/bills', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateBill:        (id, data)     => api.put(`/hospital/bills/${id}`, data),
  deleteBill:        (id)           => api.delete(`/hospital/bills/${id}`),
}
