// Use relative URL in dev so Vite proxy forwards to backend (avoids CORS)
const base = import.meta.env.VITE_API_URL || ''
export const API_BASE = base ? (base.endsWith('/api/v1') ? base : `${base.replace(/\/$/, '')}/api/v1`) : '/api/v1'

// Keys must match backend OrderStatus enum (PENDING, CONFIRMED, etc.)
export const ORDER_STATUS = {
  PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700' },
  CONFIRMED: { label: 'Confirmed', color: 'bg-blue-100 text-blue-700' },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', color: 'bg-purple-100 text-purple-700' },
  DELIVERED: { label: 'Delivered', color: 'bg-green-100 text-green-700' },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-700' },
}

// Valid status transitions (must match backend order_service.STATUS_TRANSITIONS)
export const STATUS_TRANSITIONS = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['OUT_FOR_DELIVERY', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
}

export const LOW_STOCK_THRESHOLD = 10
