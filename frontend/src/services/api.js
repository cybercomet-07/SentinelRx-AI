import axios from 'axios'
import { API_BASE } from '../utils/constants'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('sentinelrx_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res,
  err => {
    // Don't redirect on login/register 401 - let the form show the error
    const isAuthEndpoint = err.config?.url?.includes('/auth/login') || err.config?.url?.includes('/auth/register')
    if (err.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('sentinelrx_token')
      localStorage.removeItem('sentinelrx_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
