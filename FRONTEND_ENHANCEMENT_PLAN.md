# SentinelRx-AI: Frontend Enhancement Plan

> Analysis date: February 2026  
> Purpose: Align frontend with backend, add missing features, and document gaps.

---

## 1. Project Structure Overview

```
SentinelRx-AI/
├── backend/                    # FastAPI, PostgreSQL, SQLAlchemy
│   ├── app/
│   │   ├── main.py
│   │   ├── core/               # config, exceptions, security
│   │   ├── db/                 # session, base
│   │   ├── models/             # user, medicine, cart, order, notification, prescription, refill_alert
│   │   ├── schemas/            # Pydantic schemas
│   │   ├── services/           # Business logic
│   │   └── api/v1/endpoints/   # 10 endpoint modules
│   ├── alembic/
│   └── tests/
│
├── frontend/                   # React, Vite, Tailwind
│   ├── src/
│   │   ├── app/router.jsx      # Routes
│   │   ├── pages/              # 12 pages (Landing, Login, user/*, admin/*)
│   │   ├── components/         # layout, ui, cart, chat, medicines, orders, notifications, admin
│   │   ├── services/           # 7 API services
│   │   ├── context/            # AuthContext, CartContext
│   │   ├── hooks/
│   │   └── utils/
│   └── package.json
│
├── FRONTEND_BACKEND_OVERVIEW.md
├── FRONTEND_ENHANCEMENT_PLAN.md  # This file
├── STEP_BY_STEP.md
└── README.md
```

---

## 2. Backend vs Frontend Feature Matrix

| Backend Feature | Endpoints | Frontend Status | Gap |
|-----------------|-----------|-----------------|-----|
| **Health** | `GET /health` | Not used | None (optional) |
| **Auth** | register, login, refresh, google, me | ✅ Login, Register, me | Aligned |
| **Admin** | dashboard, users, low-stock | ✅ AdminDashboard, AdminUsers | Aligned |
| **Analytics** | `GET /analytics/summary` | Not used | AdminDashboard could use |
| **Medicines** | CRUD + stock | ✅ ManualOrderPage, AdminMedicines | Aligned |
| **Cart** | GET, POST add, DELETE | ❌ CartContext only (React state) | **Cart not persisted** |
| **Orders** | create-from-cart, my, list, status | ✅ OrderHistoryPage, AdminOrders, placeOrder | Aligned |
| **Notifications** | list, mark read | ✅ NotificationsPage | Aligned |
| **Prescriptions** | POST, GET /{id} | ❌ No page or service | **Missing frontend** |
| **Refill Alerts** | POST, GET, PATCH complete, DELETE | ⚠️ Read-only in NotificationsPage | **No create/complete/delete UI** |
| **Chat/AI** | None | ChatPage exists | **Backend missing** |

---

## 3. Gap Analysis

### 3.1 Frontend Features Without Backend Support

| Feature | Frontend | Backend | Action |
|---------|----------|---------|--------|
| **Chat / AI** | `ChatPage.jsx`, `chatService.js` calls `/chat/message`, `/chat/orders/{id}/confirm`, `/chat/orders/{id}/cancel` | No chat endpoints | **Option A:** Add backend chat API (LLM integration) <br> **Option B:** Keep mock-only, add "Coming soon" banner |
| **Voice ordering** | `useVoice.js`, `VoiceButton.jsx` | None | Same as Chat – mock until backend ready |

### 3.2 Backend Features Without Full Frontend Support

| Feature | Backend | Frontend Gap | Action |
|---------|---------|--------------|--------|
| **Cart** | `GET /cart`, `POST /cart/add`, `DELETE /cart/{item_id}` | `CartContext` uses React state only; `cartService` exists but not wired | Integrate `cartService` with `CartContext`; sync on load, add, remove |
| **Refill Alerts** | Full CRUD | Only `getRefillAlerts()` in NotificationsPage; no create, complete, delete | Add `refillAlertService`, create form, complete/delete actions in UI |
| **Prescriptions** | `POST /prescriptions`, `GET /prescriptions/{id}` | No service, no page | Add `prescriptionService`, Prescriptions page (create + view) |
| **Analytics** | `GET /analytics/summary` | Not used | Optional: use in AdminDashboard for richer stats |

### 3.3 Response Format Mismatches (Already Handled)

| Endpoint | Backend Field | Frontend Handling |
|----------|---------------|-------------------|
| Orders | `total_amount` | Mapped to `total` in OrderHistoryPage, AdminOrders |
| Orders list | `{ items, total, page, limit }` | Uses `r.data.items` |
| Notifications | `is_read` | Mapped to `read` |
| Refill alerts | `{ items, total, page, limit }` | NotificationsPage uses `r.data.items ?? r.data` |

### 3.4 Mock Data Usage (Should Be Replaced)

| Location | Mock Used | Replace With |
|----------|-----------|--------------|
| `Dashboard.jsx` | `MOCK_REFILL_ALERTS.length` | `refillAlertService.getRefillAlerts()` |
| `NotificationsPage.jsx` | Fallback to `MOCK_NOTIFICATIONS`, `MOCK_REFILL_ALERTS` on API error | Keep fallback for offline, but prefer API |
| `ManualOrderPage.jsx` | `MOCK_MEDICINES` fallback | Prefer `medicineService.getAll()` |
| `ChatPage.jsx` | Mock responses when chat API fails | Document as mock-only until backend |

---

## 4. Enhancement Plan (Phased)

### Phase 1: Cart Persistence (High Priority)

**Goal:** Cart survives refresh and syncs with backend.

| Task | Files | Description |
|------|-------|-------------|
| 1.1 | `CartContext.jsx` | On mount: call `cartService.getCart()`, hydrate `items` from backend |
| 1.2 | `CartContext.jsx` | On `addItem`: call `cartService.addItem(medicine_id, qty)` after state update |
| 1.3 | `CartContext.jsx` | On `removeItem`: call `cartService.removeItem(item_id)` (backend uses cart item id, not medicine id) |
| 1.4 | `CartContext.jsx` | On `clearCart`: after order, cart is cleared by backend; refetch or clear state |
| 1.5 | `CartItem.jsx`, `CartDrawer.jsx` | Ensure cart item has `id` (cart item id) for remove; medicine has `medicine_id` for add |
| 1.6 | `orderService.placeOrder` | Already syncs items to cart then `create-from-cart` – verify flow works with persisted cart |

**Backend cart response:** `GET /cart` returns cart with items; each item has `id` (cart_item_id), `medicine_id`, `quantity`, etc.

---

### Phase 2: Refill Alerts Full UI (High Priority)

**Goal:** Users can create, view, mark complete, and delete refill alerts.

| Task | Files | Description |
|------|-------|-------------|
| 2.1 | `refillAlertService.js` (new) | `create`, `getAll`, `complete`, `delete` – paths: `POST /refill-alerts`, `GET /refill-alerts`, `PATCH /refill-alerts/{id}/complete`, `DELETE /refill-alerts/{id}` |
| 2.2 | `NotificationsPage.jsx` | Replace `notificationService.getRefillAlerts` with `refillAlertService.getAll`; handle `{ items, total, page, limit }` |
| 2.3 | `AlertPanel.jsx` / `RefillAlertCard.jsx` | Add "Mark complete" and "Delete" buttons; wire to `refillAlertService.complete(id)`, `refillAlertService.delete(id)` |
| 2.4 | `NotificationsPage.jsx` or new section | Add "Create refill alert" form: medicine dropdown (from `medicineService`), `last_purchase_date`, `suggested_refill_date` |
| 2.5 | `Dashboard.jsx` | Replace `MOCK_REFILL_ALERTS.length` with real count from `refillAlertService.getAll()` |
| 2.6 | `router.jsx` | Optional: add `/user/refill-alerts` as dedicated page if NotificationsPage gets too busy |

**Backend schema (RefillAlertCreate):** `medicine_id` (UUID), `last_purchase_date`, `suggested_refill_date`

---

### Phase 3: Prescriptions (Medium Priority)

**Goal:** Users can create and view prescriptions.

| Task | Files | Description |
|------|-------|-------------|
| 3.1 | `prescriptionService.js` (new) | `create(payload)`, `getOne(id)` – `POST /prescriptions`, `GET /prescriptions/{id}` |
| 3.2 | `PrescriptionsPage.jsx` (new) | Create prescription form: `patient_name`, `doctor_name`, `prescription_text`, `extra_data` (optional) |
| 3.3 | `PrescriptionsPage.jsx` | View prescription by ID (user enters ID or we add list – see note below) |
| 3.4 | `router.jsx` | Add route `/user/prescriptions` |
| 3.5 | `UserLayout.jsx`, `Sidebar.jsx` | Add "Prescriptions" nav link |

**Backend limitation:** No `GET /prescriptions` (list). Only `GET /prescriptions/{id}`. Options:
- **A)** Add backend `GET /prescriptions?user_id=...` if we add `user_id` to prescription model
- **B)** Frontend: create form + "View by ID" input for now

---

### Phase 4: Chat / AI (Future / Optional)

**Goal:** Either implement or clearly mark as mock.

| Task | Files | Description |
|------|-------|-------------|
| 4.1 | `ChatPage.jsx` | Add banner: "AI Chat is in development. Responses are simulated." |
| 4.2 | `chatService.js` | Keep; add `isMock: true` when API fails for UI to show disclaimer |
| 4.3 | Backend (future) | Add `/chat/message` endpoint with LLM integration (OpenAI, etc.) |
| 4.4 | Backend (future) | Add `/chat/orders/{id}/confirm`, `/chat/orders/{id}/cancel` if needed |

---

### Phase 5: Polish & Consistency (Low Priority) ✅ DONE

| Task | Description | Status |
|------|-------------|--------|
| 5.1 | Replace mock fallbacks with proper error states (e.g., "Unable to load. Retry.") | ✅ |
| 5.2 | Use `GET /analytics/summary` in AdminDashboard if it provides richer data | Skipped (admin/dashboard already uses analytics) |
| 5.3 | Standardize loading/error UI across pages | ✅ |
| 5.4 | Add pagination UI for orders, notifications, refill alerts where backend returns paginated data | ✅ |
| 5.5 | Ensure `medicine_id` in backend is UUID; frontend medicine objects may use `id` – verify mapping | ✅ Verified |

---

## 5. Backend Gaps (For Backend Team)

| Gap | Description | Priority |
|-----|-------------|----------|
| **Chat API** | No `/chat/message`, `/chat/orders/{id}/confirm`, `/chat/orders/{id}/cancel` | Future |
| **Prescriptions list** | No `GET /prescriptions`; only `GET /prescriptions/{id}`. Consider adding list with optional `user_id` if prescriptions are user-scoped | Medium |
| **Prescription user link** | Prescription model has no `user_id`; consider adding for user-scoped list | Medium |

---

## 6. Implementation Order Summary

| Phase | Focus | Effort | Impact |
|-------|-------|--------|--------|
| **1** | Cart persistence | Medium | High – cart survives refresh |
| **2** | Refill alerts full UI | Medium | High – complete feature |
| **3** | Prescriptions | Medium | Medium – new feature |
| **4** | Chat (mock banner / future backend) | Low / High | Low now, high later |
| **5** | Polish | Low | Medium |

---

## 7. Quick Reference: API Paths

| Service | Method | Path |
|---------|--------|------|
| auth | register | `POST /auth/register` |
| auth | login | `POST /auth/login` |
| auth | me | `GET /auth/me` |
| admin | dashboard | `GET /admin/dashboard` |
| admin | users | `GET /admin/users` |
| admin | low-stock | `GET /admin/medicines/low-stock` |
| medicine | list | `GET /medicines?q=&category=` |
| medicine | get | `GET /medicines/{id}` |
| medicine | create | `POST /medicines` |
| medicine | update | `PATCH /medicines/{id}` |
| medicine | delete | `DELETE /medicines/{id}` |
| cart | get | `GET /cart` |
| cart | add | `POST /cart/add` |
| cart | remove | `DELETE /cart/{item_id}` |
| order | create | `POST /orders/create-from-cart` |
| order | my | `GET /orders/my` |
| order | all | `GET /orders` |
| order | status | `PATCH /orders/{id}/status` |
| notification | list | `GET /notifications` |
| notification | markRead | `PATCH /notifications/{id}/read` |
| refill-alert | create | `POST /refill-alerts` |
| refill-alert | list | `GET /refill-alerts` |
| refill-alert | complete | `PATCH /refill-alerts/{id}/complete` |
| refill-alert | delete | `DELETE /refill-alerts/{id}` |
| prescription | create | `POST /prescriptions` |
| prescription | get | `GET /prescriptions/{id}` |
| chat | message | `POST /chat/message` ❌ (no backend) |
| chat | confirm | `POST /chat/orders/{id}/confirm` ❌ (no backend) |
| chat | cancel | `POST /chat/orders/{id}/cancel` ❌ (no backend) |

---

## 8. File Change Summary

| Action | Files |
|--------|-------|
| **Modify** | `CartContext.jsx`, `CartItem.jsx`, `CartDrawer.jsx`, `NotificationsPage.jsx`, `AlertPanel.jsx`, `RefillAlertCard.jsx`, `Dashboard.jsx`, `router.jsx`, `UserLayout.jsx`, `Sidebar.jsx`, `ChatPage.jsx` |
| **Create** | `refillAlertService.js`, `prescriptionService.js`, `PrescriptionsPage.jsx` |
