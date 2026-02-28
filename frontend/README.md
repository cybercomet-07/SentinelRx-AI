# 🏥 SentinelRx AI – Pharmacy Platform

## Project Summary

Full-stack pharmacy platform with AI-powered ordering, admin management, and real-time notifications.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js + Vite + TailwindCSS |
| AI Layer | LangChain + OpenRouter |
| Backend | FastAPI |
| Auth | Firebase Auth (optional) / JWT |
| Database | SQLite + CSV |
| Automation | n8n (webhooks, notifications) |
| Observability | Langfuse |
| Charts | Chart.js + react-chartjs-2 |
| Voice Input | Web Speech API |

---

## Directory Structure

```
frontend/
├── src/
│   ├── app/router.jsx              # All protected routes
│   ├── pages/
│   │   ├── Login.jsx               # Single form with User/Admin role toggle
│   │   ├── user/                   # User-facing pages
│   │   └── admin/                  # Admin-facing pages
│   ├── components/
│   │   ├── layout/                 # Sidebar, Header, ProtectedRoute
│   │   ├── chat/                   # ChatShell, MessageBubble, VoiceButton, OrderSuggestionCard
│   │   ├── medicines/              # MedicineGrid, MedicineCard, AddToCartButton
│   │   ├── cart/                   # CartDrawer, CartItem, OrderSummary
│   │   ├── orders/                 # OrderHistoryTable, StatusBadge
│   │   ├── notifications/          # NotificationBell, AlertPanel, RefillAlertCard
│   │   ├── admin/                  # InventoryTable, AddMedicineModal, EditMedicineModal, OrdersTable, DashboardStats, RevenueChart, LowStockBadge
│   │   └── ui/                     # Loader, Modal, ErrorBanner
│   ├── services/                   # All API service functions (axios)
│   ├── hooks/                      # useAuth, useVoice, useCart, usePagination
│   ├── context/                    # AuthContext, CartContext
│   └── utils/                      # constants, errorHandler, languageDetect
```

---

## Features Implemented (Frontend)

### User Side
- ✅ Login page with User/Admin role toggle (single form)
- ✅ AI Chatbot with text + voice (Web Speech API)
- ✅ Order preview card (Confirm/Cancel) inside chat
- ✅ Manual medicine browsing with search + category filter
- ✅ Add to cart + CartDrawer with quantity management
- ✅ Order placement from cart
- ✅ Order history table with status badges
- ✅ Notification panel (general + refill alerts)
- ✅ Refill alert cards with quick reorder
- ✅ Protected routing (users can't access admin)

### Admin Side
- ✅ Admin dashboard with stats (users, orders, revenue, low stock)
- ✅ Monthly revenue chart (Chart.js)
- ✅ Top medicines ranking
- ✅ Medicine management: add, edit, delete
- ✅ Low stock warning banner
- ✅ Orders management with filter by status
- ✅ Inline order status update (dropdown)
- ✅ User management table

---

## Backend APIs Required

> All endpoints are called via `src/services/`. Below is what the backend must implement.

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login with email, password, role → returns `{ user, token }` |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Get current user info |

### Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat/message` | `{ message, history }` → intent detection, returns `{ type, message }` or `{ type: "order_preview", order: {...} }` |
| POST | `/api/chat/orders/:id/confirm` | Confirm pending order (reduce stock, set status=confirmed) |
| POST | `/api/chat/orders/:id/cancel` | Cancel pending order |

### Medicines
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/medicines` | List all with `?search=&category=` |
| GET | `/api/medicines/:id` | Get single |
| GET | `/api/medicines/search?q=` | Search |
| POST | `/api/admin/medicines` | Create (admin only) |
| PUT | `/api/admin/medicines/:id` | Update (admin only) |
| DELETE | `/api/admin/medicines/:id` | Delete (admin only) |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/orders` | Place order `{ items: [{medicine_id, quantity}] }` |
| GET | `/api/orders/me` | Current user's orders |
| GET | `/api/admin/orders` | All orders with `?status=` filter (admin) |
| PATCH | `/api/admin/orders/:id/status` | Update delivery status (admin) |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | Get all notifications for user |
| PATCH | `/api/notifications/:id/read` | Mark as read |
| GET | `/api/notifications/refill` | Get refill alerts based on order history |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/dashboard` | Stats: total_users, total_orders, total_revenue, low_stock_count, monthly_data[], top_medicines[] |
| GET | `/api/admin/users` | All users |
| GET | `/api/admin/medicines/low-stock` | Medicines below threshold |

---

## Chat Message Response Format

```json
// General AI response
{ "type": "chat", "message": "string" }

// Order preview (when medicine found + stock available)
{
  "type": "order_preview",
  "order": {
    "order_id": "12345",
    "medicine_name": "Paracetamol",
    "quantity": 2,
    "price": 20,
    "subtotal": 40
  }
}

// Error cases
{ "type": "chat", "message": "Medicine not found. Please check the name." }
{ "type": "chat", "message": "This medicine is out of stock." }
{ "type": "chat", "message": "Only 5 units available." }
```

---

## Setup

```bash
cd frontend
npm install
npm run dev
```

Set env variable:
```
VITE_API_URL=http://localhost:8000/api
```

---

## UI Design

- **Theme**: Light, clean, organic — soft mint/sage palette
- **Fonts**: Playfair Display (headings) + DM Sans (body)
- **No 3D/neon** — professional, clinical feel
- **Responsive** layout with sticky sidebar
- Role-based routing (users → `/user/*`, admins → `/admin/*`)
