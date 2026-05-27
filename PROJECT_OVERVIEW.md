# SentinelRx AI — Project Overview

AI-powered multi-role healthcare platform connecting patients, doctors, hospitals, NGOs, and platform administrators in one unified system.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, React Router v6 |
| Backend | FastAPI, SQLAlchemy ORM, Pydantic, Alembic |
| Database | PostgreSQL (Neon in production) |
| Auth | JWT (python-jose) + bcrypt |
| AI — Orders | Groq (LLaMA 3.3 70B) |
| AI — Symptoms | Cohere (Command R+) |
| Email + PDF | Brevo + ReportLab |
| Phone Calls | Twilio (optional) |
| Image Storage | Cloudinary (optional) |
| Hosting | Vercel (frontend) + Render (backend) |

---

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Patient | patient@sentinelrx.ai | Patient@123 |
| Super Admin | admin@sentinelrx.ai | Admin@123 |
| Doctor | doctor@sentinelrx.ai | Doctor@123 |
| Hospital Admin | hospital@sentinelrx.ai | Hospital@123 |
| NGO | ngo@sentinelrx.ai | NGO@1234 |

Seed with: `python scripts/seed_demo_roles.py` + `python scripts/seed_medicines.py`

---

## Frontend Routes

### Public
| Path | Page |
|------|------|
| `/` | Landing page |
| `/login` | Universal login with role selector |

### Patient (`/user/*`)
| Path | Page |
|------|------|
| `/user/quick-start` | Onboarding roadmap (default after login) |
| `/user/dashboard` | Patient dashboard |
| `/user/chat` | AI Chat — Order Agent + Symptom Agent |
| `/user/medicines` | Browse & search medicine catalog |
| `/user/cart` | Shopping cart |
| `/user/orders` | Order history |
| `/user/notifications` | Refill alerts + notifications |
| `/user/prescriptions` | Upload & manage prescriptions |
| `/user/find-doctor` | Browse available doctors |
| `/user/appointments` | My booked appointments |
| `/user/govt-schemes` | Government health scheme info |
| `/user/contact` | Contact us |

### Doctor (`/doctor/*`)
| Path | Page |
|------|------|
| `/doctor/dashboard` | Doctor dashboard — stats & today's queue |
| `/doctor/appointments` | All appointments with status management |
| `/doctor/patients` | Patient records & history |
| `/doctor/prescriptions` | Issued prescriptions |
| `/doctor/notifications` | Appointment notifications |
| `/doctor/profile` | Doctor profile & specialization |

### Hospital Admin (`/hospital/*`)
| Path | Page |
|------|------|
| `/hospital/dashboard` | Bed stats, occupancy, revenue |
| `/hospital/beds` | Bed management by ward |
| `/hospital/admissions` | Patient admission & discharge lifecycle |
| `/hospital/visits` | OPD visit records |
| `/hospital/medicines` | Hospital medicine inventory (CRUD) |
| `/hospital/inventory` | Read-only inventory view |
| `/hospital/billing` | Bills — create, track, mark paid |
| `/hospital/notifications` | Hospital notifications |

### NGO (`/ngo/*`)
| Path | Page |
|------|------|
| `/ngo/dashboard` | Beneficiary count, units collected, funds raised |
| `/ngo/beneficiaries` | Beneficiary database with health records |
| `/ngo/blood-camps` | Blood camp scheduling & unit tracking |
| `/ngo/donations` | Donation drive management |
| `/ngo/notifications` | NGO notifications |

### Super Admin (`/admin/*`)
| Path | Page |
|------|------|
| `/admin/dashboard` | System-wide analytics overview |
| `/admin/pharmacy-dashboard` | Pharmacy-specific analytics & revenue |
| `/admin/medicines` | Master medicine catalog CRUD |
| `/admin/orders` | All orders across the platform |
| `/admin/map` | Delivery map — geographic order tracking |
| `/admin/users` | All users with role filter |

---

## API Endpoints (Base: `/api/v1`)

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login → returns JWT tokens |
| POST | `/auth/refresh` | Refresh access token |
| GET | `/auth/me` | Get current user profile |

### AI Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/ai-chat/unified-chat` | Send message to Order Agent (Groq) |
| POST | `/ai-chat/order/{id}/action` | Confirm or cancel an order preview |
| POST | `/ai-chat/process-order` | Direct order processing |
| GET | `/ai-chat/medicines` | Get medicines list for chat context |

### Prescriptions & Symptoms
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/prescriptions` | Create prescription with image |
| GET | `/prescriptions/{id}` | Get prescription |
| POST | `/prescriptions/symptom-recommendation` | Symptom → medicine suggestions (Cohere) |

### Medicines
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/medicines` | List / search medicine catalog |
| GET | `/medicines/{id}` | Get medicine detail |
| POST | `/medicines` | Create medicine (Admin) |
| PATCH | `/medicines/{id}` | Update medicine (Admin) |
| DELETE | `/medicines/{id}` | Delete medicine (Admin) |

### Cart & Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/cart` | Get cart items |
| POST | `/cart/add` | Add item to cart |
| DELETE | `/cart/{item_id}` | Remove cart item |
| POST | `/orders/create-from-cart` | Checkout → creates order + sends email |
| GET | `/orders/my` | Patient's order history |
| GET | `/orders` | All orders (Admin) |
| PATCH | `/orders/{id}/status` | Update order status (Admin) |

### Notifications & Refill Alerts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/notifications` | Get notifications |
| PATCH | `/notifications/{id}/read` | Mark as read |
| GET | `/refill-alerts` | List refill alerts |
| POST | `/refill-alerts` | Create refill alert |
| PATCH | `/refill-alerts/{id}/complete` | Complete alert |
| DELETE | `/refill-alerts/{id}` | Delete alert |

### Doctor
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/doctor/appointments` | List doctor's appointments |
| PUT | `/doctor/appointments/{id}` | Update appointment status |
| GET | `/doctor/patients` | List patients |
| POST | `/doctor/prescriptions` | Issue prescription |
| GET | `/doctor/profile` | Get doctor profile |
| PUT | `/doctor/profile` | Update doctor profile |

### Patient Appointments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/patient/doctors` | List available doctors |
| POST | `/patient/appointments` | Book appointment |
| GET | `/patient/appointments` | Patient's appointment history |

### Hospital
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/hospital/beds` | List beds by ward |
| POST | `/hospital/beds` | Add a bed |
| PATCH | `/hospital/beds/{id}` | Update bed status |
| GET | `/hospital/admissions` | List admissions |
| POST | `/hospital/admissions` | Admit patient |
| PUT | `/hospital/admissions/{id}` | Update / discharge patient |
| GET | `/hospital/visits` | OPD visits |
| POST | `/hospital/visits` | Record visit |
| GET | `/hospital/medicines` | Hospital medicine inventory |
| POST | `/hospital/medicines` | Add medicine to inventory |
| GET | `/hospital/bills` | List bills |
| POST | `/hospital/bills` | Create bill |
| PATCH | `/hospital/bills/{id}` | Update bill status |
| GET | `/hospital/dashboard` | Stats summary |

### NGO
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/ngo/beneficiaries` | List beneficiaries |
| POST | `/ngo/beneficiaries` | Add beneficiary |
| PUT | `/ngo/beneficiaries/{id}` | Update beneficiary |
| DELETE | `/ngo/beneficiaries/{id}` | Remove beneficiary |
| GET | `/ngo/blood-camps` | List blood camps |
| POST | `/ngo/blood-camps` | Create blood camp |
| PUT | `/ngo/blood-camps/{id}` | Update camp |
| GET | `/ngo/donations` | List donation drives |
| POST | `/ngo/donations` | Create drive |
| PUT | `/ngo/donations/{id}` | Update drive |
| GET | `/ngo/dashboard` | NGO stats summary |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/dashboard` | Platform-wide stats |
| GET | `/admin/chart-data` | Revenue chart data |
| GET | `/admin/orders/map` | Orders with delivery coordinates |
| GET | `/admin/users` | All users |

---

## Seed Scripts

| Script | Purpose |
|--------|---------|
| `seed_demo_roles.py` | Creates all 5 demo accounts (run first) |
| `seed_medicines.py` | Populates medicine catalog |
| `seed_medicine_indications.py` | Adds symptom indications to medicines |
| `seed_demo_doctors.py` | Creates doctor profile + sample appointments |
| `seed_hospital_beds.py` | Seeds 27 beds for hospital admin demo |

---

## Key Integrations

| Service | Purpose | Required? |
|---------|---------|-----------|
| Groq | AI order extraction (LLaMA 3.3 70B) | Yes |
| Cohere | Symptom recommendations (Command R+) | Yes |
| Brevo | Transactional email + PDF invoice | Yes |
| Twilio | Automated phone call reminders | Optional |
| Cloudinary | Prescription/QR image uploads | Optional |
| PostgreSQL | Primary database | Required |
