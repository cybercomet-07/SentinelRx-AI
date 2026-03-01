import api from './api'

export const adminService = {
  getDashboardStats: () => api.get('/admin/dashboard'),
  getChartData: () => api.get('/admin/chart-data'),
  getUsers: () => api.get('/admin/users'),
  getOrdersForMap: () => api.get('/admin/orders/map'),
  getLowStockAlerts: () => api.get('/admin/medicines/low-stock'),
  getExpiringMedicines: () => api.get('/admin/medicines/expiring-soon'),
}
