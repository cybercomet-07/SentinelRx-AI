import api from './api'

export const hospitalService = {
  getStats:          ()             => api.get('/hospital/stats'),
  getBeds:           (params)       => api.get('/hospital/beds', { params }),
  createBed:         (data)         => api.post('/hospital/beds', data),
  updateBed:         (id, data)     => api.put(`/hospital/beds/${id}`, data),
  getAdmissions:     (params)       => api.get('/hospital/admissions', { params }),
  createAdmission:   (data)         => api.post('/hospital/admissions', data),
  updateAdmission:   (id, data)     => api.put(`/hospital/admissions/${id}`, data),
  getInventory:      (params)       => api.get('/hospital/inventory', { params }),
}
