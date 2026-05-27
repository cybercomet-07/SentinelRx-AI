# SentinelRx AI — Full Project Explainer

> Read this once and you'll understand exactly what SentinelRx AI is, how it works, and why every technical decision was made.

---

## What Is SentinelRx AI?

SentinelRx AI is a **multi-role digital healthcare platform** — think of it as combining an online pharmacy, a hospital management system, a doctor appointment app, and an NGO coordination tool — all under one roof, powered by AI.

Instead of having five different apps for five different types of users, SentinelRx gives everyone a single login page with a role selector. You pick your role, log in, and land on a dashboard built specifically for you.

**The five roles:**

| Role | What they do on the platform |
|------|------------------------------|
| **Patient** | Order medicines via AI chat or browse catalog, book doctor appointments, track orders, manage prescriptions |
| **Doctor** | Manage appointments, view patient history, issue digital prescriptions |
| **Hospital Admin** | Manage hospital beds, patient admissions, OPD visits, billing |
| **NGO** | Track beneficiaries, schedule blood camps, manage donation drives |
| **Super Admin** | Oversee the entire platform — medicines, orders, users, analytics |

---

## The Big Picture — How It All Connects

```
User (Browser)
      │
      │  HTTPS
      ▼
React SPA (Frontend — Vite + React 18)
      │
      │  REST API calls with JWT Bearer token
      ▼
FastAPI Backend (Python)
      │
      ├──► PostgreSQL Database (via SQLAlchemy ORM)
      │
      ├──► Groq API        (AI Order Agent — LLaMA 3.3 70B)
      ├──► Cohere API      (AI Symptom Agent — Command R+)
      ├──► Brevo           (Transactional emails + PDF invoices)
      ├──► Twilio          (Automated phone call reminders)
      └──► Cloudinary      (Prescription image uploads)
```

Every user action on the frontend triggers an API call to the FastAPI backend. The backend validates the user's JWT token, checks their role, queries the database, optionally calls an external service (AI / email / etc.), and returns a response. The frontend renders it.

---

## Layer 1 — Frontend (React + Vite)

**Tech:** React 18, React Router, Tailwind CSS, Axios, i18next, Chart.js, Leaflet, Framer Motion

The frontend is a **Single Page Application (SPA)**. React Router handles all navigation on the client side — no full page reloads. Every "page" is just a React component that fetches data from the backend.

### Role-Based Routing

When a user logs in, the backend returns a JWT token that includes their `role`. The frontend stores this in `localStorage` and an `AuthContext`. React Router then restricts access to role-specific routes:

```
/user/*      → Patient portal only
/admin/*     → Super Admin only
/doctor/*    → Doctor only
/hospital/*  → Hospital Admin only
/ngo/*       → NGO only
```

If a Patient tries to access `/admin/dashboard`, they are redirected to their own dashboard. This protection exists both on the frontend (routing guards) and the backend (role middleware).

### State Management

- **Auth state** → `AuthContext` (React Context), persisted to `localStorage`
- **Cart state** → `CartContext` (React Context), synced with the database
- **Page data** → Local `useState` + `useEffect` in each component
- **No Redux** — the app is simple enough that Context + local state is sufficient

### Internationalization

The app supports **English, Hindi, and Marathi** using `react-i18next`. Translation files live in `frontend/src/locales/`. Language preference is saved to the user's profile in the database and applied automatically on login.

---

## Layer 2 — Backend (FastAPI + Python)

**Tech:** FastAPI, SQLAlchemy ORM, Pydantic, Alembic, python-jose (JWT), bcrypt

FastAPI is an async Python web framework that automatically generates interactive API docs at `/docs`. Every route is typed using Pydantic schemas — this means request validation, response serialization, and documentation happen automatically.

### How a Typical API Request Flows

```
1. Frontend sends:
   GET /api/v1/hospital/beds
   Headers: { Authorization: "Bearer eyJhbGc..." }

2. FastAPI middleware:
   → Extracts token from header
   → Decodes JWT → gets user_id + role
   → Loads User from database
   → Calls require_roles(HOSPITAL_ADMIN)
   → If role doesn't match → 403 Forbidden

3. Route handler runs:
   → Queries hospital_beds WHERE hospital_admin_id = user.id
   → Returns list of beds as JSON

4. Frontend receives JSON → renders the beds table
```

### Code Organization

```
backend/app/
├── api/v1/endpoints/
│   ├── auth.py          # Login, register, JWT refresh
│   ├── medicines.py     # Medicine catalog CRUD
│   ├── orders.py        # Order management
│   ├── cart.py          # Shopping cart
│   ├── ai_chat.py       # AI agents (order + symptom)
│   ├── admin.py         # Super Admin APIs
│   ├── doctor/          # Appointments, prescriptions
│   ├── hospital/        # Beds, admissions, billing, OPD
│   ├── ngo/             # Beneficiaries, blood camps, donations
│   └── patient/         # Patient-side appointment booking
├── models/              # SQLAlchemy DB models (one per table)
├── services/            # Business logic (AI, email, PDF)
└── core/                # Config (.env loading), security (JWT)
```

**The pattern is always:** Route → Service → Model (DB). Routes handle HTTP concerns (request parsing, response formatting). Services handle business logic. Models represent database tables.

---

## Layer 3 — Database (PostgreSQL + SQLAlchemy + Alembic)

**Tech:** PostgreSQL, SQLAlchemy ORM, Alembic migrations

### The Users Table — The Core of Everything

All five roles share a single `users` table with a `role` column (enum):

```
users
├── id (UUID primary key)
├── name
├── email (unique)
├── password_hash (bcrypt)
├── role  →  USER | ADMIN | DOCTOR | HOSPITAL_ADMIN | NGO
├── is_active
├── phone, address, landmark, pin_code
└── preferred_language
```

Every other table references `users.id` as a foreign key. This is how data isolation works — a Hospital Admin's beds are linked to their `user.id`, so they can never see another hospital's data.

### Database Schema by Domain

**Pharmacy (Patient):**
```
medicines → orders → order_items
cart → (checkout) → orders
prescriptions
refill_alerts, notifications
```

**Doctor:**
```
doctor_appointments (doctor_id + patient_id from users)
prescriptions (linked to appointments)
doctor_patients (patient history per doctor)
```

**Hospital:**
```
hospital_beds (hospital_admin_id)
hospital_admissions (bed_id + hospital_admin_id)
hospital_bills (linked to admissions)
patient_visits (OPD visits)
hospital_medicines (separate inventory per hospital)
```

**NGO:**
```
ngo_beneficiaries (ngo_id)
blood_camps (ngo_id)
donation_drives (ngo_id)
```

**AI Chat History:**
```
order_medicine_ai_chat_history
symptom_suggestion_chat_history
general_talk_chat_history
```

### Migrations

Database schema changes are managed by **Alembic**. Every table change (add column, new table) generates a versioned migration file. Running `alembic upgrade head` applies all pending migrations in order. This means the database schema is version-controlled just like the code.

---

## The AI Pipeline — How the Chat Agents Work

This is the most unique part of the project. There are two distinct AI agents available inside the Patient's chat interface.

### Agent 1 — Order Agent (Groq + LLaMA 3.3 70B)

**Purpose:** Let patients order medicines using plain conversational text (or voice).

**Pipeline:**

```
Patient types: "I need 2 Paracetamol and a Cough Syrup"
                        │
                        ▼
         POST /api/v1/ai_chat/chat
                        │
                        ▼
         Backend sends to Groq API:
         System prompt: "You are a pharmacy assistant.
                         Extract medicine names and quantities
                         from user messages. Return JSON."
         User message: "I need 2 Paracetamol and a Cough Syrup"
                        │
                        ▼
         Groq returns structured JSON:
         [
           { "medicine": "Paracetamol", "quantity": 2 },
           { "medicine": "Cough Syrup", "quantity": 1 }
         ]
                        │
                        ▼
         Backend checks DB:
         → Does "Paracetamol" exist in medicines table? ✓
         → Stock available (50 units)? ✓
         → Does "Cough Syrup" exist? ✓
         → Stock available (30 units)? ✓
                        │
                        ▼
         Returns order preview to frontend:
         {
           "medicines": [
             {"name": "Paracetamol", "qty": 2, "price": 40},
             {"name": "Cough Syrup", "qty": 1, "price": 85}
           ],
           "total": 125,
           "status": "preview"
         }
                        │
                        ▼
         Patient sees the preview and clicks "Confirm"
                        │
                        ▼
         POST /api/v1/ai_chat/confirm_order
                        │
                        ▼
         Backend:
         → Creates Order record (status: PENDING)
         → Creates OrderItem records
         → Decrements stock (Paracetamol: 50→48, Cough Syrup: 30→29)
         → Generates PDF invoice (ReportLab)
         → Sends email via Brevo with PDF attached
         → Returns { order_id, message: "Order placed!" }
```

The entire conversation history is saved to `order_medicine_ai_chat_history` so patients can scroll back through their past interactions.

---

### Agent 2 — Symptom Agent (Cohere + Command R+)

**Purpose:** Recommend medicines based on what the patient is feeling.

**Pipeline:**

```
Patient types: "I have a bad headache and slight fever"
                        │
                        ▼
         POST /api/v1/ai_chat/symptom-chat
                        │
                        ▼
         Backend fetches current medicine catalog from DB
         (so Cohere knows what's actually in stock)
                        │
                        ▼
         Sends to Cohere API:
         System prompt: "You are a pharmacy assistant.
                         Given the user's symptoms and the
                         available medicines, recommend the
                         most suitable ones with explanations."
         Context: Available medicines list
         User message: "I have a bad headache and slight fever"
                        │
                        ▼
         Cohere returns:
         "Based on your symptoms, I recommend:
          1. Paracetamol 500mg — effective for headache and fever
          2. Ibuprofen 400mg — anti-inflammatory, reduces fever
          Please consult a doctor if symptoms persist."
                        │
                        ▼
         Returned to patient with disclaimer
         Conversation saved to symptom_suggestion_chat_history
```

**Key difference:** The Order Agent uses Groq (faster, structured extraction). The Symptom Agent uses Cohere (better at reasoning and medical context). They are intentionally different models for different jobs.

---

## Authentication Pipeline — JWT Flow

```
1. User visits /login → selects role → enters email + password

2. POST /api/v1/auth/login
   Body: { email, password, selected_role }

3. Backend:
   a. Finds user by email in DB
   b. Verifies password against bcrypt hash
   c. Checks is_active = true
   d. Auto-corrects demo account roles (prevents drift)
   e. Generates JWT:
      Payload: { sub: user_id, email, role, type: "access", exp: +30min }
      Signed with JWT_SECRET_KEY (from .env)
   f. Generates refresh token (exp: +7 days)
   g. Returns: { access_token, refresh_token, user: {...} }

4. Frontend:
   a. Stores access_token in localStorage
   b. Calls GET /auth/me with Bearer token
   c. Gets full user profile
   d. Sets role in AuthContext
   e. Redirects to /[role]/dashboard

5. Every subsequent API call:
   Headers: { Authorization: "Bearer <access_token>" }

6. When token expires:
   POST /auth/refresh with refresh_token
   → Get new access_token (no re-login needed)
```

Passwords are never stored in plain text — only `bcrypt` hashes. JWTs are stateless — the backend doesn't store sessions, it just validates the token's signature on every request.

---

## Email + PDF Pipeline

Every order confirmation triggers this pipeline:

```
Order confirmed (via cart checkout OR AI chat confirm)
        │
        ▼
order_service.py runs:

Step 1 — Generate PDF (ReportLab)
  → Creates in-memory PDF with:
     - SentinelRx AI logo + header
     - Order ID, date, patient name
     - Itemized medicine list with quantities and prices
     - Grand total
     - Delivery address
  → Returns PDF as bytes

Step 2 — Send Email (Brevo API)
  → Recipient: patient's email
  → Subject: "Order Confirmed — #ORDER_ID"
  → HTML body: Branded template with order summary
  → Attachment: invoice.pdf (the ReportLab bytes)
  → Brevo delivers to inbox

Patient receives email with PDF invoice attached
```

Brevo (formerly Sendinblue) is used instead of raw SMTP because it provides delivery tracking, template management, and doesn't require managing an email server.

---

## Hospital Management Pipeline

A complete lifecycle from bed to discharge:

```
SETUP: Beds are pre-seeded (27 beds per hospital, split across ICU/General/Private wards)

ADMISSION:
Patient arrives → Hospital Admin logs in
        │
        ▼
POST /api/v1/hospital/admissions
Body: { bed_id, patient_name, age, gender, diagnosis, admit_date }
        │
        ▼
Backend:
  → Creates HospitalAdmission record (status: ADMITTED)
  → Finds HospitalBed by bed_id
  → Updates bed.status: AVAILABLE → OCCUPIED
  → Returns admission record

Dashboard now shows: occupied beds +1, available beds -1

DISCHARGE:
Admin clicks "Discharge" button
        │
        ▼
PUT /api/v1/hospital/admissions/{id}
Body: { status: "DISCHARGED" }
        │
        ▼
Backend:
  → Sets admission.discharge_date = today
  → Sets admission.status = DISCHARGED
  → Finds linked bed → Sets bed.status = AVAILABLE
  → Returns updated admission

Billing:
  → Admin generates final bill
  → QR code for payment (linked to Cloudinary image)
  → Bill status tracked: PENDING → PAID
```

Data isolation: `hospital_admin_id` is stamped on every bed and admission, so Sunrise Hospital can never see General Hospital's data.

---

## NGO Management Pipeline

```
Beneficiary Management:
  POST /ngo/beneficiaries → Add person with health conditions, govt scheme eligibility
  GET  /ngo/beneficiaries → Filter by condition, scheme, location

Blood Camp Lifecycle:
  Create camp (date, location, target units)
    → Status: UPCOMING
  Update during camp (units collected so far)
    → Status: ONGOING
  Camp ends
    → Status: COMPLETED
  Dashboard shows: total units collected vs target

Donation Drive:
  Create drive (target amount, description)
  Record donations → Track amount raised vs target
  Progress percentage shown on dashboard
```

---

## Deployment Architecture

```
Developer pushes to GitHub main branch
        │
        ├──► Vercel auto-deploys frontend
        │    (builds React app, serves as static SPA + CDN)
        │
        └──► Render auto-deploys backend
             (runs FastAPI with uvicorn, runs Alembic migrations on startup)
                      │
                      └──► Neon PostgreSQL (serverless, always-on)
```

**Environment separation:**
- `VITE_API_URL` on Vercel points to the Render backend URL
- `CORS_ORIGINS` on Render allows only the Vercel frontend URL
- All secrets (DB password, API keys, JWT secret) are in environment variables — never in code

**Cold starts:** Render's free tier sleeps after inactivity. First request after sleep takes ~30-60 seconds. Paid tiers remove this.

---

## Security Model

| Concern | How It's Handled |
|---------|-----------------|
| Passwords | bcrypt hashing (never stored plain) |
| Auth tokens | JWT signed with secret key, 30-min expiry |
| Role enforcement | Both frontend routing guards AND backend `require_roles()` middleware |
| Data isolation | Every DB query filters by the logged-in user's ID |
| Input validation | Pydantic schemas reject malformed requests before they reach business logic |
| SQL injection | SQLAlchemy ORM parameterizes all queries automatically |
| CORS | Backend only accepts requests from the configured frontend origin |
| Secrets | All API keys in `.env` files, never committed to git |

---

## Tech Stack — Summary

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend framework | React 18 + Vite | Fast dev with HMR, small production builds |
| Styling | Tailwind CSS | Utility-first, consistent design system |
| Routing | React Router v6 | Declarative, role-based route protection |
| HTTP client | Axios | Interceptors for automatic JWT header injection |
| Backend framework | FastAPI | Async Python, auto-generates API docs, fast |
| Database ORM | SQLAlchemy | Type-safe queries, relationship management |
| Migrations | Alembic | Version-controlled schema changes |
| Auth | JWT (python-jose) + bcrypt | Stateless, secure, industry standard |
| AI (orders) | Groq + LLaMA 3.3 70B | Fast inference for structured extraction |
| AI (symptoms) | Cohere Command R+ | Strong medical reasoning capability |
| Email | Brevo | Transactional email with delivery tracking |
| PDF | ReportLab | Pure Python PDF generation, no external dependency |
| Phone calls | Twilio | Programmable voice API for reminders |
| Image storage | Cloudinary | CDN-backed image hosting for prescriptions |
| Hosting (frontend) | Vercel | Zero-config React deployment |
| Hosting (backend) | Render | Managed Python hosting with auto-deploy |
| Database hosting | Neon | Serverless PostgreSQL, scales to zero |

---

## Demo Accounts (After Seeding)

Run `python scripts/seed_demo_roles.py` from the `backend/` folder to create:

| Role | Email | Password |
|------|-------|----------|
| Patient | patient@sentinelrx.ai | Patient@123 |
| Super Admin | admin@sentinelrx.ai | Admin@123 |
| Doctor | doctor@sentinelrx.ai | Doctor@123 |
| Hospital Admin | hospital@sentinelrx.ai | Hospital@123 |
| NGO | ngo@sentinelrx.ai | NGO@1234 |

Each account is seeded with realistic demo data — beds, appointments, beneficiaries, medicines — so every dashboard shows real-looking information immediately.

---

## Running the Project Locally

```powershell
# 1. Backend
cd backend
.\.venv\Scripts\activate
pip install -r requirements.txt
# Set DATABASE_URL, GROQ_API_KEY, COHERE_API_KEY, BREVO_API_KEY in .env
alembic upgrade head
python scripts/seed_demo_roles.py
python scripts/seed_medicines.py
uvicorn app.main:app --reload
# → http://localhost:8000
# → http://localhost:8000/docs  (interactive API docs)

# 2. Frontend (new terminal)
cd frontend
npm install
# Set VITE_API_URL=http://localhost:8000 in .env
npm run dev
# → http://localhost:3005
```

---

## How Everything Ties Together — One Complete Example

**Scenario: Parth (Patient) orders Paracetamol via AI chat**

```
1. Parth opens http://localhost:3005
   → React loads, checks localStorage for token
   → No token → redirects to /login

2. Parth selects "Patient" role, enters patient@sentinelrx.ai / Patient@123
   → Frontend: POST /auth/login
   → Backend: validates credentials → returns JWT
   → Frontend: stores JWT → calls /auth/me → sets AuthContext
   → React Router: redirects to /user/dashboard

3. Parth navigates to "AI Chat" → selects "Order Agent"
   → Page loads chat history from DB (empty for new session)

4. Parth types: "I need 2 Paracetamol"
   → Frontend: POST /ai_chat/chat  { message: "I need 2 Paracetamol" }
   → Backend: sends to Groq → gets [{medicine: "Paracetamol", qty: 2}]
   → Backend: queries DB for Paracetamol → found, 50 in stock, ₹20 each
   → Backend: returns preview { total: 40, status: "preview" }
   → Frontend: displays order card with Confirm button

5. Parth clicks "Confirm"
   → Frontend: POST /ai_chat/confirm_order  { preview_data }
   → Backend:
       • Creates Order (status: PENDING, total: ₹40)
       • Creates OrderItem (medicine_id, qty: 2, price: ₹20 each)
       • Updates medicine stock: 50 → 48
       • Generates PDF invoice using ReportLab
       • Sends email via Brevo with PDF attached
   → Returns { order_id: "abc-123", message: "Order placed!" }
   → Frontend: shows success toast "Order placed!"

6. Parth goes to /user/orders
   → GET /orders/my → returns [{ order_id: "abc-123", status: "PENDING", total: 40 }]
   → Order shows in history

7. Admin logs in → /admin/orders → sees Parth's order
   → Updates status to "CONFIRMED" → "OUT FOR DELIVERY" → "DELIVERED"
   → Parth sees status update in real-time on next refresh

8. 5 days before Parth's refill is due:
   → Backend scheduled job sends reminder email via Brevo
```

---

**SentinelRx AI is built on a simple principle:** one backend API, one database, five different frontend experiences — all secured by role-based JWT authentication. Every feature, from AI chat to hospital bed management, follows the same pattern: React component → Axios call → FastAPI route → SQLAlchemy query → JSON response → rendered UI.
