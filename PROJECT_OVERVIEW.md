# SentinelRx-AI — Full Project Overview

AI-powered pharmacy platform with medicine ordering, symptom-based recommendations, order confirmation emails with PDF invoices, and admin management.

---

## Quick Start

| Command | Description |
|---------|-------------|
| `.\run-backend.ps1` or `run-backend.bat` | Backend → http://localhost:8000 |
| `.\run-frontend.ps1` or `run-frontend.bat` | Frontend → http://localhost:3005 |
| `run-all.bat` | Start both servers |

**Environment:** Copy `backend/.env.example` to `backend/.env`, set `DATABASE_URL`, `GROQ_API_KEY`, `COHERE_API_KEY`, `BREVO_API_KEY`.

**Demo users:** `user@sentinelrx.ai` / `User1234` | `admin@example.com` / `AdminPass123!`

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, Tailwind CSS, React Router |
| Backend | FastAPI, SQLAlchemy, Pydantic |
| Database | PostgreSQL |
| AI | Groq (Order Agent), Cohere (SentinelRX-AI symptom agent) |
| Email | Brevo (order confirmation + invoice PDF) |
| PDF | ReportLab (invoice generation) |

---

## Features

### User
- **Auth** — Login, JWT, role-based routing
- **Dashboard** — Refill count, recent orders, quick actions
- **AI Chat** — Two agents side-by-side:
  - **Order Agent** — Order medicines by name (voice & text), delivery address, cart flow
  - **SentinelRX-AI** — Symptom-based medicine recommendations from inventory
- **Browse Medicines** — Search, add to cart
- **Cart** — DB-persisted, checkout with delivery address
- **Order History** — Paginated list
- **Refill Alerts** — Create, complete, delete
- **Notifications** — Paginated list
- **Prescriptions** — Create with image upload

### Admin
- **Dashboard** — Stats, revenue chart, top medicines
- **Medicines** — CRUD, low-stock banner
- **Orders** — Filter by status, pagination, update status, delivery map
- **Users** — List with search
- **Delivery Map** — Orders with delivery pins

### Order Confirmation
- PDF invoice generation (ReportLab)
- Email via Brevo with invoice attachment
- Sent on cart checkout and AI chat order confirm

---

## Routes

| Path | Page | Role |
|------|------|------|
| `/` | Landing | Public |
| `/login` | Login | Public |
| `/user/dashboard` | User Dashboard | User |
| `/user/chat` | AI Chat (Order Agent + SentinelRX-AI) | User |
| `/user/medicines` | Browse Medicines | User |
| `/user/orders` | Order History | User |
| `/user/notifications` | Refill Alerts + Notifications | User |
| `/user/prescriptions` | Prescriptions | User |
| `/admin/dashboard` | Admin Dashboard | Admin |
| `/admin/medicines` | Medicine Inventory | Admin |
| `/admin/orders` | All Orders | Admin |
| `/admin/map` | Delivery Map | Admin |
| `/admin/users` | User List | Admin |

---

## API Endpoints (Base: `/api/v1`)

| Module | Endpoints |
|--------|-----------|
| **Auth** | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `GET /auth/me` |
| **Health** | `GET /health` |
| **AI Chat** | `GET /ai-chat/medicines`, `POST /ai-chat/chat`, `POST /ai-chat/process-order`, `POST /ai-chat/symptom-chat` |
| **Medicines** | `GET /medicines`, `GET /medicines/{id}`, `POST /medicines`, `PATCH /medicines/{id}`, `DELETE /medicines/{id}` |
| **Cart** | `GET /cart`, `POST /cart/add`, `DELETE /cart/{item_id}` |
| **Orders** | `POST /orders/create-from-cart`, `GET /orders/my`, `GET /orders` (admin), `PATCH /orders/{id}/status` |
| **Notifications** | `GET /notifications`, `PATCH /notifications/{id}/read` |
| **Refill Alerts** | `GET /refill-alerts`, `POST /refill-alerts`, `PATCH /refill-alerts/{id}/complete`, `DELETE /refill-alerts/{id}` |
| **Prescriptions** | `POST /prescriptions`, `GET /prescriptions/{id}` |
| **Admin** | `GET /admin/dashboard`, `GET /admin/chart-data`, `GET /admin/orders/map` |

---

## Project Structure

```
SentinelRx-AI/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── api/v1/endpoints/    # health, auth, ai_chat, admin, medicines, cart, orders, etc.
│   │   ├── core/               # config, security, exceptions
│   │   ├── db/                  # session, base
│   │   ├── models/             # User, Order, Medicine, Cart, etc.
│   │   ├── schemas/             # Pydantic schemas
│   │   ├── services/           # order_service, ai_chat_service, symptom_chat_service, etc.
│   │   └── invoice/            # invoice.py (PDF), invoice_service.py (email)
│   ├── alembic/                # Migrations
│   ├── scripts/                # seed_medicines, create_admin, etc.
│   └── tests/
├── frontend/
│   └── src/
│       ├── pages/              # Landing, Login, user/*, admin/*
│       ├── components/         # chat, medicines, cart, orders, admin
│       ├── services/           # api, authService, orderService, etc.
│       └── context/            # AuthContext, CartContext
├── run-backend.ps1 / .bat
├── run-frontend.ps1 / .bat
└── run-all.bat
```

---

## Environment Variables

**Backend (`.env`):**
- `DATABASE_URL` — PostgreSQL connection string
- `GROQ_API_KEY` — Order Agent (Groq)
- `COHERE_API_KEY` — SentinelRX-AI symptom agent
- `BREVO_API_KEY` — Order confirmation email
- `JWT_SECRET_KEY`, `JWT_ALGORITHM`

**Frontend (`.env`):**
- `VITE_API_URL` — Backend base URL (e.g. `http://127.0.0.1:8000`)

---

## Scripts

| Script | Purpose |
|--------|---------|
| `run-seed-medicines.bat` | Seed medicines from CSV |
| `backend/scripts/create_admin.py` | Create admin user |
| `backend/scripts/seed_demo_users.py` | Seed demo users |
