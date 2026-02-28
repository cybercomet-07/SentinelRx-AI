// Use relative URL in dev so Vite proxy forwards to backend (avoids CORS)
const base = import.meta.env.VITE_API_URL || ''
export const API_BASE = base ? (base.endsWith('/api/v1') ? base : `${base.replace(/\/$/, '')}/api/v1`) : '/api/v1'

export const ORDER_STATUS = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700' },
  confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-700' },
  out_for_delivery: { label: 'Out for Delivery', color: 'bg-purple-100 text-purple-700' },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700' },
}

export const LOW_STOCK_THRESHOLD = 10
