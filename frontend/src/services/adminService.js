import api from './api'

export const adminService = {
  getDashboardStats: () => api.get('/admin/dashboard'),
  getUsers: () => api.get('/admin/users'),
  getLowStockAlerts: () => api.get('/admin/medicines/low-stock'),
}
