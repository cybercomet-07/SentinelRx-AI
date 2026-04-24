# SentinelRx AI — Complete Healthcare & Pharmacy Platform

> **An AI-powered, multi-role healthcare ecosystem** connecting patients, doctors, hospitals, NGOs, and administrators in one intelligent platform.

---

## 🎯 What is SentinelRx AI?

SentinelRx AI is a **complete digital healthcare solution** that brings together:
- **Pharmacy e-commerce** with AI-powered ordering
- **Doctor-patient appointment system**
- **Hospital management** (beds, admissions, billing, visits)
- **NGO operations** (beneficiaries, blood camps, donation drives)
- **Super Admin tools** for platform oversight

Think of it as **"If Amazon Pharmacy met Hospital Management Software with NGO coordination"** — all powered by AI chat.

---

## 👥 Who Uses This Platform?

### 1. **Patients** — Order medicines, chat with AI, manage health

**Use Case:** Rajesh has a headache and needs medicine quickly.

**His Journey:**
1. Opens SentinelRx AI → Logs in as Patient
2. Goes to **AI Chat** → Types: *"I need 2 Paracetamol tablets"*
3. **AI Order Agent** understands:
   - Medicine: Paracetamol
   - Quantity: 2
   - Checks stock → Available
4. Shows order preview with price
5. Rajesh confirms → Order placed!
6. Receives **email confirmation** with PDF invoice
7. Tracks order in **Order History**
8. Gets **smart refill reminder** 5 days before running out

**Features Patients Get:**
- 🤖 **AI Chat** — Order by voice/text, get symptom-based medicine suggestions
- 🛒 **Browse Medicines** — Search, filter, add to cart
- 📦 **Order History** — Track all orders with status updates
- 🔔 **Refill Alerts** — Automated reminders before you run out
- 📄 **Prescriptions** — Upload and manage prescriptions
- 📞 **Call Reminders** — Schedule automated Twilio calls for medicine reminders
- 🌐 **Multilingual** — English, Hindi, Marathi support

---

### 2. **Doctors** — Manage patients, appointments, issue prescriptions

**Use Case:** Dr. Sharma sees 20 patients daily and needs organized appointment management.

**Her Journey:**
1. Logs in → **Doctor Dashboard** shows today's appointments
2. Sees appointment from Priya (10:30 AM, Fever)
3. Clicks appointment → Reviews symptoms
4. After consultation → **Issues Digital Prescription**
5. Updates appointment status to "COMPLETED"
6. Views **Patients List** to see medical history
7. Gets notified when new appointment is booked

**Features Doctors Get:**
- 📅 **Appointment Management** — View, confirm, complete, cancel
- 👥 **Patient Records** — Full history of visits and symptoms
- 💊 **Prescription Writer** — Issue digital prescriptions linked to appointments
- 🔔 **Notifications** — New appointments, cancellations
- 📊 **Dashboard Stats** — Today's appointments, total patients, ratings

---

### 3. **Hospital Admins** — Manage hospital operations

**Use Case:** Sunrise Hospital needs to track 50 beds, patient admissions, and billing.

**Admin Journey:**
1. Logs in → **Hospital Dashboard** shows:
   - 50 total beds, 32 occupied, 18 available
   - 32 current patients
   - 15 pending bills
2. **Bed Management:**
   - Views beds by ward (ICU, General, Private)
   - Updates bed status (Available/Occupied/Maintenance)
   - Assigns beds to new admissions
3. **Admissions:**
   - Admits new patient → Assigns bed automatically
   - Tracks diagnosis, treatment, billing
   - Discharges patient → Bed marked available
4. **Patient Visits (OPD):**
   - Records daily visits with diagnosis
   - Schedules follow-ups
   - Links to government schemes (Ayushman Bharat, etc.)
5. **Hospital Medicines:**
   - Maintains separate medicine inventory
   - Low stock alerts
6. **Billing:**
   - Creates bills with QR code for payment
   - Tracks pending/paid status
   - Links to government health schemes

**Features Hospital Admins Get:**
- 🏥 **Bed Management** — Real-time bed availability tracking
- 📋 **Admissions** — Full patient admission lifecycle
- 🩺 **OPD Visits** — Track outpatient visits and follow-ups
- 💊 **Medicine Inventory** — Hospital-specific stock management
- 💰 **Billing System** — QR payments, scheme integration
- 📊 **Dashboard** — Occupancy rate, bed stats, revenue

---

### 4. **NGOs** — Manage community health programs

**Use Case:** Seva NGO runs blood camps and supports 500 beneficiaries.

**NGO Journey:**
1. **Beneficiary Management:**
   - Adds 500+ beneficiaries with health details
   - Tracks government scheme eligibility
   - Filters by health conditions
2. **Blood Camps:**
   - Schedules upcoming camps (date, location, target units)
   - Tracks units collected vs target
   - Updates camp status (Upcoming → Ongoing → Completed)
3. **Donation Drives:**
   - Creates fundraising drives
   - Tracks donations and progress percentage
   - Shows amount raised vs target

**Features NGOs Get:**
- 👥 **Beneficiary Database** — Health records, scheme eligibility
- 🩸 **Blood Camp Management** — Schedule, track collections
- 🎁 **Donation Drives** — Fundraising tracking
- 📊 **Dashboard** — Total beneficiaries, units collected, funds raised

---

### 5. **Super Admin** — Platform oversight and analytics

**Use Case:** Platform admin monitors system health, inventory, and user activity.

**Admin Journey:**
1. **System Overview Dashboard:**
   - 1,200 total patients
   - 45 doctors
   - 12 hospitals
   - 8 NGOs
2. **Medicine Management:**
   - CRUD operations on medicine catalog
   - Low stock warnings
   - Price updates
3. **Order Management:**
   - Views all orders across platform
   - Updates order status
   - Delivery map showing order locations
4. **User Management:**
   - Views all users with roles
   - Search and filter
5. **Analytics:**
   - Revenue charts
   - Top-selling medicines
   - Order trends

**Features Super Admin Gets:**
- 📊 **System Dashboard** — Cross-platform analytics
- 💊 **Medicine Catalog** — Master inventory management
- 📦 **All Orders** — Platform-wide order monitoring
- 🗺️ **Delivery Map** — Geographic order tracking
- 👥 **User Management** — View all users by role
- 📈 **Analytics** — Revenue, trends, insights

---

## 🔄 Complete User Workflow Examples

### Workflow 1: Patient Orders Medicine via AI Chat

```
1. Patient opens app → Navigates to "AI Chat"
2. Selects "Order Agent"
3. Types: "I need Paracetamol and Cough Syrup"
   (OR speaks using voice input)
4. AI extracts:
   - Medicine 1: Paracetamol (assumes 1 quantity)
   - Medicine 2: Cough Syrup (assumes 1 quantity)
5. Backend checks stock → Both available
6. AI shows order preview:
   "Order Summary:
   - Paracetamol × 1 = ₹20
   - Cough Syrup × 1 = ₹85
   Total: ₹105"
7. Patient confirms
8. Backend:
   - Creates order in database
   - Updates medicine stock (-1 each)
   - Generates PDF invoice (ReportLab)
   - Sends email via Brevo with PDF attached
9. Patient sees "Order placed!" + Order ID
10. Order appears in Order History with status "PENDING"
11. Admin updates status to "CONFIRMED" → "OUT FOR DELIVERY" → "DELIVERED"
12. 5 days before refill due → Email reminder sent
```

---

### Workflow 2: Doctor Issues Prescription After Appointment

```
1. Patient books appointment from "Find Doctor" page
2. Doctor sees appointment in dashboard
3. Doctor clicks appointment → Reviews symptoms
4. After consultation, clicks "Issue Prescription"
5. Enters:
   - Medicines: "Paracetamol 500mg, 2 times daily"
   - Notes: "Take after meals for 3 days"
6. Submits → Prescription saved to database
7. Patient sees prescription in "My Prescriptions"
8. Patient can order prescribed medicines from chat/catalog
```

---

### Workflow 3: Hospital Admits Patient

```
1. Patient arrives at emergency
2. Hospital admin logs in → "Admissions" → "Admit Patient"
3. Enters:
   - Patient Name: Amit Kumar
   - Age: 45, Gender: Male
   - Diagnosis: Dengue
   - Admit Date: Today
4. Selects available bed from dropdown (e.g., "G-015, General Ward")
5. Confirms admission
6. System:
   - Creates admission record
   - Marks bed as "OCCUPIED"
   - Initializes bill at ₹0
7. Admin adds charges over stay
8. When patient recovers → "Discharge" button
9. System:
   - Marks admission as "DISCHARGED"
   - Marks bed as "AVAILABLE"
   - Finalizes bill
10. Admin generates final bill with QR code for payment
```

---

## 🏗️ Technical Architecture

### Frontend (React + Vite)
```
frontend/src/
├── pages/
│   ├── user/          # Patient portal (Chat, Orders, Medicines, etc.)
│   ├── admin/         # Super Admin portal
│   ├── doctor/        # Doctor portal (Appointments, Patients)
│   ├── hospital/      # Hospital Admin portal (Beds, Admissions, Billing)
│   ├── ngo/           # NGO portal (Beneficiaries, Camps, Donations)
│   ├── Login.jsx      # Universal login with role selector
│   └── Landing.jsx    # Public homepage
├── services/          # Axios API calls
├── context/           # Auth, Cart state
└── components/        # Reusable UI
```

**Key Libraries:**
- React 18 + React Router
- Tailwind CSS for styling
- Axios for API calls
- i18next for multilingual support
- Leaflet for maps
- Chart.js for analytics

---

### Backend (FastAPI + PostgreSQL)
```
backend/app/
├── api/v1/endpoints/
│   ├── auth.py         # Login, register, JWT
│   ├── admin.py        # Admin CRUD operations
│   ├── medicines.py    # Medicine catalog
│   ├── orders.py       # Order management
│   ├── cart.py         # Shopping cart
│   ├── ai_chat.py      # AI order/symptom chat
│   ├── doctor/         # Doctor appointments, prescriptions
│   ├── hospital/       # Hospital beds, admissions, billing
│   ├── ngo/            # NGO beneficiaries, camps, donations
│   └── patient/        # Patient appointment booking
├── models/             # SQLAlchemy database models
├── services/           # Business logic (AI, email, etc.)
└── core/               # Config, security (JWT)
```

**Key Technologies:**
- FastAPI for REST API
- SQLAlchemy ORM + PostgreSQL
- JWT authentication (python-jose)
- Alembic for migrations
- Pydantic for validation

---

### AI & Integrations

1. **AI Chat (Groq + Cohere):**
   - **Order Agent (Groq):** Extracts medicine names/quantities from natural language
   - **Symptom Agent (Cohere):** Suggests medicines based on symptoms
   
2. **Email (Brevo):**
   - Order confirmations
   - PDF invoices (generated with ReportLab)
   - Refill reminders

3. **Phone Calls (Twilio):**
   - Automated refill reminder calls
   - User-scheduled medication reminders

4. **Image Upload (Cloudinary):**
   - Prescription images
   - Payment QR codes

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL database

### Step 1: Clone & Setup Environment

```bash
git clone https://github.com/cybercomet-07/SentinelRx-AI.git
cd SentinelRx-AI
```

### Step 2: Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Copy environment template
copy .env.example .env  # Windows
# cp .env.example .env  # Mac/Linux

# Edit .env and add:
# DATABASE_URL=postgresql://user:pass@localhost:5432/sentinelrx
# JWT_SECRET_KEY=your-super-secret-key-min-32-chars
# GROQ_API_KEY=your-groq-key
# COHERE_API_KEY=your-cohere-key
# BREVO_API_KEY=your-brevo-key
# (Optional: TWILIO, CLOUDINARY keys)

# Run migrations
alembic upgrade head

# Seed demo data
python scripts/seed_demo_roles.py
python scripts/seed_medicines.py

# Start backend
uvicorn app.main:app --reload
```

Backend runs at **http://localhost:8000**  
API docs at **http://localhost:8000/docs**

---

### Step 3: Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment template
copy .env.example .env  # Windows
# cp .env.example .env  # Mac/Linux

# Edit .env:
# VITE_API_URL=http://localhost:8000

# Start frontend
npm run dev
```

Frontend runs at **http://localhost:3005** (or port shown in terminal)

---

## 🔐 Demo Accounts (After Seed)

| Role | Email | Password | Access |
|------|-------|----------|--------|
| **Patient** | patient@sentinelrx.ai | Patient@123 | Pharmacy, orders, chat |
| **Super Admin** | admin@sentinelrx.ai | Admin@123 | Platform oversight |
| **Doctor** | doctor@sentinelrx.ai | Doctor@123 | Appointments, prescriptions |
| **Hospital Admin** | hospital@sentinelrx.ai | Hospital@123 | Beds, admissions, billing |
| **NGO** | ngo@sentinelrx.ai | NGO@1234 | Beneficiaries, camps, drives |

**Login Flow:**
1. Go to `/login`
2. Select role from dropdown
3. Enter email + password
4. System validates DB role matches selection
5. Redirects to role-specific dashboard

---

## 📁 Project Structure

```
SentinelRx-AI/
│
├── backend/                      # FastAPI Backend
│   ├── app/
│   │   ├── api/v1/endpoints/    # API routes by feature
│   │   ├── models/              # SQLAlchemy models
│   │   ├── services/            # Business logic
│   │   ├── core/                # Config, security
│   │   └── db/                  # Database session, seeds
│   ├── alembic/                 # Database migrations
│   ├── tests/                   # Pytest tests
│   ├── scripts/                 # Seed scripts
│   ├── requirements.txt         # Python dependencies
│   └── .env.example             # Environment template
│
├── frontend/                     # React Frontend
│   ├── src/
│   │   ├── pages/               # All route pages
│   │   │   ├── user/           # Patient portal
│   │   │   ├── admin/          # Admin portal
│   │   │   ├── doctor/         # Doctor portal
│   │   │   ├── hospital/       # Hospital portal
│   │   │   └── ngo/            # NGO portal
│   │   ├── components/          # Reusable components
│   │   ├── services/            # API calls
│   │   ├── context/             # React context (Auth, Cart)
│   │   └── utils/               # Helpers
│   ├── package.json
│   └── .env.example
│
├── docs/                         # Documentation
├── README.md                     # This file
├── architecture.md               # Technical architecture
├── decision.md                   # Architecture decisions
├── DEPLOYMENT.md                 # Deployment guide
└── PROJECT_OVERVIEW.md           # Extended feature docs
```

---

## 🔧 How It Works Under the Hood

### Authentication Flow
```
1. User submits login (email, password, selected_role)
2. Backend validates credentials
3. If email is demo account (e.g., hospital@sentinelrx.ai):
   - Auto-corrects DB role if drifted (self-heal)
4. Generates JWT access + refresh tokens
   - Token contains: user_id (sub), email, role
5. Returns tokens to frontend
6. Frontend stores token in localStorage
7. Calls /auth/me to get full user profile
8. Sets role in AuthContext
9. Redirects to role-specific dashboard
10. All API calls include: Authorization: Bearer <token>
11. Backend validates token → Loads user from DB
12. Checks user.role against route permissions
13. Returns data or 403 Forbidden
```

---

### AI Chat Order Flow
```
User Input: "I need 3 Paracetamol"
    ↓
Frontend sends to: POST /ai_chat/order
    ↓
Backend extracts intent using Groq:
    - Action: order_medicines
    - Medicine: Paracetamol
    - Quantity: 3
    ↓
Checks database:
    - Medicine exists? ✓
    - Stock available? ✓ (50 in stock)
    ↓
Returns order preview:
    {
      "medicines": [{"name": "Paracetamol", "qty": 3, "price": 60}],
      "total": 60,
      "status": "preview"
    }
    ↓
User confirms
    ↓
Backend: POST /ai_chat/confirm_order
    ↓
Creates order:
    - Order record (total: 60, status: PENDING)
    - OrderItems (3 × Paracetamol)
    - Updates stock (50 → 47)
    ↓
Generates PDF invoice (ReportLab)
    ↓
Sends email via Brevo with PDF attached
    ↓
Returns: {"order_id": "abc-123", "message": "Order placed!"}
```

---

### Hospital Bed Management Flow
```
Admission:
1. Admin selects available bed (G-015)
2. Backend creates HospitalAdmission record:
   - Links to bed_id
   - Patient details
   - Status: ADMITTED
3. Updates bed status: AVAILABLE → OCCUPIED
4. Admission appears in dashboard

Discharge:
1. Admin clicks "Discharge" on admission
2. Backend:
   - Sets discharge_date = today
   - Updates admission.status = DISCHARGED
   - Finds linked bed → Sets bed.status = AVAILABLE
3. Bed appears in "Available Beds" list
```

---

## 🌐 Deployment

### Production Stack
- **Frontend:** Vercel
- **Backend:** Render
- **Database:** Neon PostgreSQL

### Environment Variables (Critical)

**Vercel (Frontend):**
```
VITE_API_URL=https://sentinelrx-ai.onrender.com
```

**Render (Backend):**
```
DATABASE_URL=postgresql://...
JWT_SECRET_KEY=min-32-char-secret
CORS_ORIGINS=https://sentinelrx-ai.vercel.app
GROQ_API_KEY=...
COHERE_API_KEY=...
BREVO_API_KEY=...
```

See **DEPLOYMENT.md** for complete deployment guide.

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| **README.md** (this file) | Complete walkthrough for newcomers |
| **architecture.md** | Technical architecture, layers, data flow |
| **decision.md** | Why we chose JWT, PostgreSQL, Groq, etc. |
| **PROJECT_OVERVIEW.md** | Feature list, API routes, extended reference |
| **DEPLOYMENT.md** | Production deployment checklist |

---

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest tests/ -v

# Frontend build test
cd frontend
npm run build
```

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

---

## 📧 Support

For questions or issues:
- Email: ainpharmacyofficial@gmail.com
- GitHub Issues: [Create Issue](https://github.com/cybercomet-07/SentinelRx-AI/issues)

---

## 📄 License

This project is part of a hackathon submission. Check repository for license details.

---

**Built with ❤️ by Team SentinelRx**

*Making healthcare accessible through AI-powered technology*
