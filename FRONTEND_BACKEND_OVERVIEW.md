# SentinelRx-AI: Backend vs Frontend Feature Overview

## Backend Features (All Implemented)

| # | Feature | Endpoints | Status |
|---|---------|-----------|--------|
| 1 | **Health** | `GET /health` | ✅ |
| 2 | **Auth** | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/google`, `GET /auth/me` | ✅ |
| 3 | **Admin Dashboard** | `GET /admin/dashboard`, `GET /admin/users`, `GET /admin/medicines/low-stock` | ✅ |
| 4 | **Analytics** | `GET /analytics/summary` | ✅ |
| 5 | **Medicines** | `GET /medicines`, `GET /medicines/{id}`, `POST /medicines`, `PATCH /medicines/{id}`, `PATCH /medicines/{id}/stock`, `DELETE /medicines/{id}` | ✅ |
| 6 | **Cart** | `GET /cart`, `POST /cart/add`, `DELETE /cart/{item_id}` | ✅ |
| 7 | **Orders** | `POST /orders/create-from-cart`, `GET /orders/my`, `GET /orders` (admin), `PATCH /orders/{id}/status` | ✅ |
| 8 | **Notifications** | `GET /notifications`, `PATCH /notifications/{id}/read` | ✅ |
| 9 | **Prescriptions** | `POST /prescriptions`, `GET /prescriptions/{id}` | ✅ |
| 10 | **Refill Alerts** | `POST /refill-alerts`, `GET /refill-alerts`, `PATCH /refill-alerts/{id}/complete`, `DELETE /refill-alerts/{id}` | ✅ |

**Backend total: 10 feature modules, ~30 endpoints**

---

## Frontend Features (Current)

| # | Feature | Pages/Components | Service Used | Status |
|---|---------|-----------------|--------------|--------|
| 1 | **Auth** | Login.jsx | authService | ✅ Connected |
| 2 | **Admin Dashboard** | AdminDashboard.jsx | adminService | ✅ Connected |
| 3 | **Admin Users** | AdminUsers.jsx | adminService | ✅ Connected |
| 4 | **Admin Medicines** | AdminMedicines.jsx | medicineService | ⚠️ Path mismatch |
| 5 | **Admin Orders** | AdminOrders.jsx | orderService | ⚠️ Path mismatch |
| 6 | **User Medicines** | ManualOrderPage.jsx | medicineService | ⚠️ Param mismatch |
| 7 | **User Orders** | OrderHistoryPage.jsx | orderService | ⚠️ Path + response mismatch |
| 8 | **User Notifications** | NotificationsPage.jsx | notificationService | ⚠️ Refill path mismatch |
| 9 | **Cart + Checkout** | CartDrawer.jsx | orderService | ❌ Different flow |
| 10 | **Chat (AI)** | ChatPage.jsx | chatService | ❌ Backend has no chat API |
| 11 | **Refill Alerts** | (in NotificationsPage) | notificationService.getRefillAlerts | ❌ Wrong path |
| 12 | **Prescriptions** | — | — | ❌ No frontend page |

**Frontend total: ~8 features implemented, 5 need path fixes, 3 missing**

---

## Path & Flow Mismatches (What to Fix)

### 1. Medicine Service

| Frontend Call | Frontend Path | Backend Path | Fix |
|---------------|---------------|--------------|-----|
| getAll | `/medicines?search=&category=` | `/medicines?q=&category=` | Map `search` → `q` |
| getOne | `/medicines/{id}` | `/medicines/{id}` | ✅ Match |
| create | `POST /admin/medicines` | `POST /medicines` | Change to `POST /medicines` |
| update | `PUT /admin/medicines/{id}` | `PATCH /medicines/{id}` | Change to `PATCH /medicines/{id}` |
| delete | `DELETE /admin/medicines/{id}` | `DELETE /medicines/{id}` | Change to `DELETE /medicines/{id}` |

### 2. Order Service

| Frontend Call | Frontend Path | Backend Path | Fix |
|---------------|---------------|--------------|-----|
| getMyOrders | `GET /orders/me` | `GET /orders/my` | Change to `/orders/my` |
| getAll | `GET /admin/orders` | `GET /orders` | Change to `GET /orders` |
| updateStatus | `PATCH /admin/orders/{id}/status` | `PATCH /orders/{id}/status` | Change to `PATCH /orders/{id}/status` |
| placeOrder | `POST /orders` with `{ items }` | `POST /orders/create-from-cart` | **Different flow** – see below |

### 3. Notification Service

| Frontend Call | Frontend Path | Backend Path | Fix |
|---------------|---------------|--------------|-----|
| getAll | `GET /notifications` | `GET /notifications` | ✅ Match |
| markRead | `PATCH /notifications/{id}/read` | `PATCH /notifications/{id}/read` | ✅ Match |
| getRefillAlerts | `GET /notifications/refill` | `GET /refill-alerts` | Change to `GET /refill-alerts` |

### 4. Cart + Order Flow (Major Difference)

**Frontend current flow:**
- Cart stored in React state (CartContext)
- On checkout: `POST /orders` with `{ items: [{ medicine_id, quantity }] }`

**Backend flow:**
- Cart stored in DB via `POST /cart/add`
- On checkout: `POST /orders/create-from-cart` (reads cart from DB, creates order, clears cart)

**Options:**
- **A)** Add backend endpoint `POST /orders` that accepts items directly (simpler for frontend)
- **B)** Change frontend to use cart API: add items to `/cart/add` first, then call `/orders/create-from-cart`

### 5. Response Format Mismatches

| Endpoint | Backend Returns | Frontend Expects |
|----------|-----------------|------------------|
| GET /orders/my | `{ items, total, page, limit }` | Array of orders |
| Order object | `total_amount` | `total` |

---

## Missing Frontend Features (Backend Ready)

| Feature | Backend | Frontend | Action |
|---------|---------|----------|--------|
| **Cart API** | GET/POST/DELETE /cart | Cart in React state only | Add cartService, sync with backend |
| **Refill Alerts** | Full CRUD /refill-alerts | Only getRefillAlerts (wrong path) | Fix path, add Refill Alerts page |
| **Prescriptions** | POST, GET /prescriptions | No page | Add Prescriptions page |
| **Chat/AI** | Not implemented | ChatPage exists | Backend needs AI bridge (future) |

---

## Action Plan

### Phase 1: Fix Existing Paths (Quick Wins) ✅ DONE

1. **medicineService.js** – Fixed create/update/delete paths, map `search`→`q`
2. **orderService.js** – Fixed getMyOrders (`/my`), getAll (`/orders`), updateStatus; added cart sync for placeOrder
3. **notificationService.js** – Fixed getRefillAlerts → `/refill-alerts`
4. **cartService.js** – NEW: getCart, addItem, removeItem
5. **OrderHistoryPage, AdminOrders** – Use `r.data.items`, map `total_amount`→`total`
6. **NotificationsPage** – Map `is_read`→`read`, handle paginated response

### Phase 2: Cart + Checkout Flow

- **Option A:** Add `POST /orders` endpoint in backend that accepts `{ items }` (bypass cart)
- **Option B:** Add cartService, sync CartContext with backend cart, use `/orders/create-from-cart`

### Phase 3: Add Missing Frontend Pages

1. **Refill Alerts Page** – List, create, mark complete, delete
2. **Prescriptions Page** – Create prescription, view list
3. **Cart Service** – If Option B, integrate backend cart

### Phase 4: Chat (Future)

- Backend needs AI/LLM integration
- Frontend ChatPage can stay as mock until then

---

## Summary Table

| Area | Backend | Frontend | Gap |
|------|---------|----------|-----|
| Auth | 5 endpoints | Login, Register | ✅ Aligned |
| Admin | 3 endpoints | Dashboard, Users, Medicines, Orders | Path fixes needed |
| Medicines | 6 endpoints | List, Add, Edit, Delete | Path fixes needed |
| Orders | 4 endpoints | My orders, Admin orders | Path + flow fixes |
| Notifications | 2 endpoints | List, Mark read | ✅ + refill path fix |
| Refill Alerts | 4 endpoints | Only in notifications | New page + service |
| Cart | 3 endpoints | React state only | Integrate or add order endpoint |
| Prescriptions | 2 endpoints | None | New page |
| Chat | None | Exists | Backend AI pending |
