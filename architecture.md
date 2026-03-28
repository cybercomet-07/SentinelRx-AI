
---

## `architecture.md` (or `arch.md` — same content)

```markdown
# SentinelRx-AI — Architecture

End-to-end view of the current codebase: multi-role healthcare + pharmacy platform.

---

## 1. High-level overview

**Clients:** Single-page app (React) talks to a **FastAPI** backend over HTTPS. The API uses **JWT** in the `Authorization: Bearer` header. **Role-based access** is enforced per route using the authenticated user’s **role in the database** (`User.role`: `USER`, `ADMIN`, `DOCTOR`, `HOSPITAL_ADMIN`, `NGO`).

**Major domains:**

- **Pharmacy / patient:** medicines, cart, orders, prescriptions, refill alerts, notifications, AI chat (order + symptom flows).
- **Admin:** medicines, orders, users, maps, analytics, contact messages, prescriptions oversight.
- **Doctor:** appointments, patients, prescriptions.
- **Hospital:** beds, admissions, visits, hospital medicines, billing, inventory views.
- **NGO:** beneficiaries, blood camps, donation drives.
- **Patient (appointments):** book/find doctors (patient router).

---

## 2. Stack

| Concern | Choice |
|---------|--------|
| UI | React 18, Vite, Tailwind, React Router |
| API | FastAPI, Pydantic v2, Uvicorn |
| ORM / DB | SQLAlchemy 2.x, PostgreSQL |
| Migrations | Alembic |
| Auth | JWT (`python-jose`), bcrypt passwords |
| HTTP client | Axios (`frontend/src/services/api.js`) |
| AI | Groq (LangChain), Cohere |
| Email | Brevo + ReportLab PDFs |
| Optional | Twilio (scheduled calls), Cloudinary (images) |

---

## 3. Request flow

1. User opens SPA (e.g. Vercel). Static assets load; API calls go to `VITE_API_URL` + `/api/v1/...` (see `frontend/src/utils/constants.js`).
2. Login → `POST /api/v1/auth/login` → returns `access_token` + `refresh_token`; client stores token and calls `GET /api/v1/auth/me` for profile.
3. Protected routes use `Depends(require_roles(...))` in FastAPI; the current user is loaded from JWT `sub` (user id) and **authorized by `User.role` in PostgreSQL**.
4. CORS: configured in `backend/app/main.py` for local dev and production origins (e.g. `*.vercel.app`).

---

## 4. Backend layout

- **`app/main.py`** — FastAPI app, CORS, lifespan (startup seeds / tasks as configured).
- **`app/api/v1/router.py`** — Mounts routers: `auth`, `admin`, `medicines`, `orders`, `cart`, `notifications`, `prescriptions`, `refill_alerts`, `call_schedules`, `contact`, `doctor`, `hospital`, `ngo`, `patient`, `ai_chat`, `analytics`, `health`.
- **`app/api/deps/auth.py`** — `get_current_user`, `require_roles`.
- **`app/services/`** — Auth, orders, AI, notifications, etc.
- **`alembic/`** — Schema migrations; production may run `alembic upgrade head` at deploy.

---

## 5. Frontend layout

- **`src/pages/`** — Route screens by area: `user/`, `admin/`, `doctor/`, `hospital/`, `ngo/`, `shared/`, `Login.jsx`, `Landing.jsx`.
- **`src/services/`** — Axios modules per domain (`api.js` attaches Bearer token).
- **`src/context/`** — Auth, cart, etc.
- **i18n** — `i18next` for EN/HI/MR (and extensible).

---

## 6. AI & chat

- **Unified chat shell** combines order and symptom flows; backend `ai_chat` endpoints persist history where implemented.
- **Groq** — structured extraction / order agent style flows.
- **Cohere** — symptom and recommendation style flows.

Exact prompts and models live under `backend/app/services/` and related modules.

---

## 7. Deployment (typical)

| Component | Platform | Notes |
|-----------|----------|--------|
| Frontend | Vercel | Set `VITE_API_URL` to full API base including `/api/v1` if your `constants.js` expects that pattern |
| Backend | Render (or similar) | `DATABASE_URL`, `JWT_SECRET_KEY`, `CORS_ORIGINS`, secrets for AI/email |
| DB | Neon / RDS / Supabase | PostgreSQL connection string |

See **`DEPLOYMENT.md`** for the exact Vercel env value and Render checklist.

---

## 8. Security notes

- Secrets only via environment variables; do not commit `.env`.
- JWT secret must be strong in production.
- Rate-limiting and WAF are platform-level (Vercel/Render) unless added in app.

---

## 9. Related docs

- `README.md` — Quick start and repo map  
- `decision.md` — ADRs  
- `PROJECT_OVERVIEW.md` — Longer route/feature list  
