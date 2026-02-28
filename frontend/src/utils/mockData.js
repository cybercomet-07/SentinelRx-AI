// ─── MOCK DATA (used when backend is not connected) ────────────────────────

export const MOCK_MEDICINES = [
  { id: 1, name: 'Paracetamol 500mg', category: 'Pain Relief', price: 12, quantity: 150, description: 'Effective pain reliever and fever reducer.', image_url: null },
  { id: 2, name: 'Ibuprofen 400mg', category: 'Pain Relief', price: 25, quantity: 80, description: 'Anti-inflammatory pain reliever.', image_url: null },
  { id: 3, name: 'Amoxicillin 250mg', category: 'Antibiotics', price: 85, quantity: 6, description: 'Broad-spectrum antibiotic for bacterial infections.', image_url: null },
  { id: 4, name: 'Cetirizine 10mg', category: 'Allergy', price: 18, quantity: 200, description: 'Antihistamine for allergy relief.', image_url: null },
  { id: 5, name: 'Omeprazole 20mg', category: 'Digestive', price: 45, quantity: 0, description: 'Reduces stomach acid production.', image_url: null },
  { id: 6, name: 'Metformin 500mg', category: 'Diabetes', price: 30, quantity: 120, description: 'Controls blood sugar levels in type 2 diabetes.', image_url: null },
  { id: 7, name: 'Atorvastatin 10mg', category: 'Cardiac', price: 60, quantity: 90, description: 'Lowers cholesterol and reduces heart disease risk.', image_url: null },
  { id: 8, name: 'Azithromycin 500mg', category: 'Antibiotics', price: 110, quantity: 8, description: 'Antibiotic for respiratory tract infections.', image_url: null },
  { id: 9, name: 'Vitamin D3 1000IU', category: 'Supplements', price: 55, quantity: 300, description: 'Supports bone health and immunity.', image_url: null },
  { id: 10, name: 'Pantoprazole 40mg', category: 'Digestive', price: 38, quantity: 75, description: 'Treats gastroesophageal reflux disease.', image_url: null },
  { id: 11, name: 'Dolo 650mg', category: 'Pain Relief', price: 20, quantity: 250, description: 'Paracetamol tablet for fever and mild pain.', image_url: null },
  { id: 12, name: 'Cough Syrup 100ml', category: 'Respiratory', price: 65, quantity: 40, description: 'Soothes throat irritation and suppresses cough.', image_url: null },
]

export const MOCK_ORDERS = [
  {
    id: 'ORD-001', created_at: '2025-02-20T10:30:00Z',
    items: [{ medicine_name: 'Paracetamol 500mg', quantity: 2 }, { medicine_name: 'Vitamin D3 1000IU', quantity: 1 }],
    total: 79, status: 'delivered'
  },
  {
    id: 'ORD-002', created_at: '2025-02-22T14:15:00Z',
    items: [{ medicine_name: 'Cetirizine 10mg', quantity: 1 }],
    total: 18, status: 'out_for_delivery'
  },
  {
    id: 'ORD-003', created_at: '2025-02-25T09:00:00Z',
    items: [{ medicine_name: 'Dolo 650mg', quantity: 3 }],
    total: 60, status: 'confirmed'
  },
  {
    id: 'ORD-004', created_at: '2025-02-26T08:00:00Z',
    items: [{ medicine_name: 'Omeprazole 20mg', quantity: 1 }, { medicine_name: 'Metformin 500mg', quantity: 2 }],
    total: 105, status: 'pending'
  },
]

export const MOCK_NOTIFICATIONS = [
  { id: 1, message: '🚚 Your order ORD-002 is out for delivery. Expected today.', read: false, created_at: '2025-02-26T07:00:00Z' },
  { id: 2, message: '✅ Order ORD-001 has been delivered successfully.', read: true, created_at: '2025-02-20T18:00:00Z' },
  { id: 3, message: '⚠️ Amoxicillin 250mg is running low in stock.', read: false, created_at: '2025-02-25T12:00:00Z' },
]

export const MOCK_REFILL_ALERTS = [
  { medicine_name: 'Metformin 500mg', last_order_date: '2025-01-26T10:00:00Z', suggested_refill_date: '2025-02-26T10:00:00Z' },
  { medicine_name: 'Atorvastatin 10mg', last_order_date: '2025-01-20T10:00:00Z', suggested_refill_date: '2025-02-20T10:00:00Z' },
]

export const MOCK_DASHBOARD_STATS = {
  total_users: 142,
  total_orders: 389,
  total_revenue: 28450,
  low_stock_count: 3,
  monthly_data: [
    { month: 'Sep', revenue: 3200, orders: 41 },
    { month: 'Oct', revenue: 4100, orders: 53 },
    { month: 'Nov', revenue: 3800, orders: 48 },
    { month: 'Dec', revenue: 5200, orders: 67 },
    { month: 'Jan', revenue: 4900, orders: 62 },
    { month: 'Feb', revenue: 7250, orders: 118 },
  ],
  top_medicines: [
    { id: 1, name: 'Paracetamol 500mg', orders: 89 },
    { id: 11, name: 'Dolo 650mg', orders: 72 },
    { id: 4, name: 'Cetirizine 10mg', orders: 61 },
    { id: 9, name: 'Vitamin D3 1000IU', orders: 55 },
    { id: 6, name: 'Metformin 500mg', orders: 48 },
  ]
}

export const MOCK_USERS_LIST = [
  { id: 1, name: 'Rahul Sharma', email: 'user@sentinelrx.ai', total_orders: 4, active: true },
  { id: 3, name: 'Priya Patel', email: 'priya@email.com', total_orders: 12, active: true },
  { id: 4, name: 'Amit Singh', email: 'amit@email.com', total_orders: 7, active: true },
  { id: 5, name: 'Sneha Joshi', email: 'sneha@email.com', total_orders: 2, active: false },
  { id: 6, name: 'Rohan Mehta', email: 'rohan@email.com', total_orders: 19, active: true },
]

export const MOCK_ADMIN_ORDERS = MOCK_ORDERS.map(o => ({
  ...o,
  user_name: ['Rahul Sharma', 'Priya Patel', 'Amit Singh', 'Sneha Joshi'][Math.floor(o.id.slice(-1) % 4)],
}))
