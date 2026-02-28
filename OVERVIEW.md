# SentinelRx-AI — Project Overview

## Run Commands

| Command | Description |
|--------|-------------|
| `.\run-backend.ps1` | Start backend (http://localhost:8000) |
| `.\run-frontend.ps1` | Start frontend (http://localhost:5173) |
| `run-backend.bat` | Start backend (Windows CMD) |
| `run-frontend.bat` | Start frontend (Windows CMD) |

**Run both** in separate terminals. Backend first, then frontend.

---

## Routes

| Path | Page | Role |
|------|------|------|
| `/` | Landing | Public |
| `/login` | Login | Public |
| `/user/dashboard` | User Dashboard | User |
| `/user/chat` | AI Chat | User |
| `/user/medicines` | Browse Medicines | User |
| `/user/orders` | Order History | User |
| `/user/notifications` | Refill Alerts + Notifications | User |
| `/user/prescriptions` | Prescriptions | User |
| `/admin/dashboard` | Admin Dashboard | Admin |
| `/admin/medicines` | Medicine Inventory | Admin |
| `/admin/orders` | All Orders | Admin |
| `/admin/users` | User List | Admin |

---

## Features

### User
- **Auth** — Login, JWT, role-based access
- **Dashboard** — Refill count, recent orders, quick actions
- **Browse Medicines** — Search, category filter, add to cart (product_id, pin, description)
- **Cart** — Persisted in DB, sync on add/remove
- **Checkout** — Place order from cart
- **Order History** — Paginated list
- **Refill Alerts** — Create, complete, delete
- **Notifications** — Paginated list
- **Prescriptions** — Create with image upload, view by ID
- **AI Chat** — Mock AI (order, stock, health Q&A)

### Admin
- **Dashboard** — Stats, revenue chart, top medicines
- **Medicines** — CRUD, low-stock banner
- **Orders** — Filter by status, pagination, update status
- **Users** — List with search

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React, Vite, Tailwind |
| Backend | FastAPI, SQLAlchemy |
| Database | PostgreSQL |
| API Base | http://127.0.0.1:8000/api/v1 |

---

## Demo Users

- **User:** user@sentinelrx.ai / User1234
- **Admin:** admin@example.com / AdminPass123!
