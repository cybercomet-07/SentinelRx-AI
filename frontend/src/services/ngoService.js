import api from './api'

export const ngoService = {
  getStats:            ()           => api.get('/ngo/stats'),
  getBeneficiaries:    (params)     => api.get('/ngo/beneficiaries', { params }),
  createBeneficiary:   (data)       => api.post('/ngo/beneficiaries', data),
  deleteBeneficiary:   (id)         => api.delete(`/ngo/beneficiaries/${id}`),
  getBloodCamps:       ()           => api.get('/ngo/blood-camps'),
  createBloodCamp:     (data)       => api.post('/ngo/blood-camps', data),
  updateBloodCamp:     (id, data)   => api.put(`/ngo/blood-camps/${id}`, data),
  getDonations:        ()           => api.get('/ngo/donations'),
  createDonation:      (data)       => api.post('/ngo/donations', data),
  updateDonation:      (id, data)   => api.put(`/ngo/donations/${id}`, data),
}
