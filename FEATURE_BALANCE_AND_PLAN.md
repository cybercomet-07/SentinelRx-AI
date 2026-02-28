# SentinelRx-AI: Frontend–Backend Feature Balance & Execution Plan

> Status as of current implementation

---

## 1. Feature Balance Matrix

| Feature | Backend | Frontend | Status | Notes |
|---------|---------|----------|--------|------|
| **Auth Login** | ✅ POST /auth/login | ✅ Login.jsx | **FULL** | JWT, role-based |
| **Auth Register** | ✅ POST /auth/register | ✅ Login.jsx | **FULL** | Sign-up form |
| **Auth Me** | ✅ GET /auth/me | ✅ AuthContext | **FULL** | On load |
| **Auth Refresh** | ✅ POST /auth/refresh | ❌ Not used | **PARTIAL** | Backend ready, frontend doesn't refresh token |
| **Auth Google** | ✅ POST /auth/google | ❌ No UI | **PARTIAL** | Backend ready |
| **Health** | ✅ GET /health | ✅ Login.jsx | **FULL** | Backend status check |
| **Admin Dashboard** | ✅ GET /admin/dashboard | ✅ AdminDashboard | **FULL** | Stats, chart, top medicines |
| **Admin Users** | ✅ GET /admin/users | ✅ AdminUsers | **FULL** | List, search |
| **Admin Low-Stock** | ✅ GET /admin/medicines/low-stock | ❌ Not used | **PARTIAL** | AdminMedicines uses client-side filter |
| **Medicines CRUD** | ✅ Full CRUD | ✅ ManualOrderPage, AdminMedicines | **FULL** | Browse, add, edit, delete |
| **Medicine Stock** | ✅ PATCH /medicines/{id}/stock | ❌ Not used | **PARTIAL** | Admin uses full update |
| **Cart** | ✅ GET, POST add, DELETE | ✅ CartContext | **FULL** | Persisted, sync |
| **Orders** | ✅ create-from-cart, my, list, status | ✅ CartDrawer, OrderHistory, AdminOrders | **FULL** | Pagination, filter |
| **Notifications** | ✅ GET, PATCH /read | ✅ NotificationsPage | **PARTIAL** | List works; markRead not in UI |
| **Refill Alerts** | ✅ Full CRUD | ✅ NotificationsPage | **FULL** | Create, complete, delete |
| **Prescriptions** | ✅ POST, GET /{id} | ✅ PrescriptionsPage | **FULL** | Create, view by ID |
| **Analytics** | ✅ GET /analytics/summary | ❌ Not used | **PARTIAL** | Admin dashboard uses /admin/dashboard |
| **Chat** | ❌ No endpoints | ✅ ChatPage (mock) | **PARTIAL** | Mock AI only |

---

## 2. Fully Executed (Tested & Working)

| Feature | Frontend | Backend | Verification |
|---------|----------|---------|--------------|
| Auth (login, register, me) | Login.jsx, AuthContext | /auth/* | JWT, protected routes |
| Cart | CartContext, CartDrawer | /cart | Sync on add/remove, survives refresh |
| Checkout | CartDrawer | /orders/create-from-cart | Syncs cart → order |
| Browse Medicines | ManualOrderPage | /medicines | Search, category, product_id, pin |
| Admin Medicines | AdminMedicines | /medicines | CRUD, low-stock banner |
| Order History | OrderHistoryPage | /orders/my | Pagination |
| Admin Orders | AdminOrders | /orders | Filter, pagination, status update |
| Refill Alerts | NotificationsPage | /refill-alerts | Create, complete, delete |
| Notifications List | NotificationsPage | /notifications | Pagination |
| Prescriptions | PrescriptionsPage | /prescriptions | Create (with image), view by ID |
| Admin Dashboard | AdminDashboard | /admin/dashboard | Stats, chart |
| Admin Users | AdminUsers | /admin/users | List |

---

## 3. Partially Executed (Gaps)

| Feature | What Works | What's Missing | Action |
|---------|------------|---------------|--------|
| **Auth Refresh** | Backend endpoint | Frontend doesn't refresh token before expiry | Add token refresh interceptor |
| **Auth Google** | Backend endpoint | No Google login button | Add Google OAuth UI or skip |
| **Admin Low-Stock** | Backend endpoint | Frontend uses client-side filter from medicines list | Use getLowStockAlerts for dashboard badge |
| **Medicine Stock** | Backend PATCH /stock | Admin uses full medicine update | Optional: dedicated stock update UI |
| **Notifications markRead** | Backend + service | No "Mark as read" in UI | Add mark-read button in notifications list |
| **Analytics** | GET /analytics/summary | Not used | Optional: use for richer admin stats |
| **Chat** | Mock AI, order via chat | No backend | Add "AI in development" banner; future: LLM backend |

---

## 4. Backend Features Without Frontend

| Backend | Frontend | Priority |
|---------|----------|----------|
| POST /auth/refresh | ❌ | Medium – token refresh |
| POST /auth/google | ❌ | Low – optional |

---

## 5. Frontend Features Without Full Backend

| Frontend | Backend | Priority |
|----------|---------|----------|
| Chat (AI) | ❌ No /chat/message | Future – LLM integration |
| Prescriptions list | ❌ No GET /prescriptions | Medium – add backend list |

---

## 6. Further Execution Plan

### Phase A: Quick Wins (1–2 days)

| Task | Action | Files |
|------|--------|-------|
| A1 | Add "Mark as read" for notifications | NotificationsPage.jsx |
| A2 | Add "AI Chat in development" banner on ChatPage | ChatPage.jsx |
| A3 | Add token refresh before expiry (optional) | api.js, AuthContext |

### Phase B: Medium Priority (2–3 days)

| Task | Action | Files |
|------|--------|-------|
| B1 | Backend: Add GET /prescriptions (list), optional user_id filter | prescriptions.py, prescription_service |
| B2 | Frontend: Prescriptions list + "My prescriptions" | PrescriptionsPage.jsx |
| B3 | Use getLowStockAlerts in Admin Dashboard | AdminDashboard.jsx | 

### Phase C: Future (Backend AI)

| Task | Action |
|------|--------|
| C1 | Add POST /chat/message with LLM (OpenAI/OpenRouter) |
| C2 | Add POST /chat/orders/{id}/confirm, cancel |
| C3 | Wire ChatShell to real backend when available |

### Phase D: Optional Polish

| Task | Action |
|------|--------|
| D1 | Google OAuth UI |

---

## 7. Summary Table

| Category | Count |
|----------|-------|
| **Fully executed** | 12 features |
| **Partially executed** | 7 features |
| **Backend-only (unused)** | 2 (refresh, google) |
| **Frontend-only (no backend)** | 1 (Chat AI) |

---

## 8. Recommended Next Steps

1. **Phase A** – Quick wins: mark-read UI, chat banner.
2. **Phase B** – Prescriptions list: backend + frontend.
3. **Phase C** – Chat backend when LLM is available.
