# SentinelRx AI — Technical Architecture

Complete technical view of the multi-role healthcare platform.

---

## 🏛️ System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    USERS (Web Browsers)                      │
│  Patients · Doctors · Hospital Admins · NGOs · Super Admin  │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              FRONTEND (React SPA - Vercel)                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  React Router: Role-based pages                      │   │
│  │  - /user/*    → Patient portal                       │   │
│  │  - /admin/*   → Super Admin portal                   │   │
│  │  - /doctor/*  → Doctor portal                        │   │
│  │  - /hospital/*→ Hospital Admin portal                │   │
│  │  - /ngo/*     → NGO portal                           │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Services: Axios API calls with JWT Bearer token     │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │ REST API (Authorization: Bearer JWT)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              BACKEND (FastAPI - Render)                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  JWT Middleware: get_current_user()                  │   │
│  │  → Validates token                                   │   │
│  │  → Loads User from DB                                │   │
│  │  → require_roles() checks User.role                  │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  API Routers (FastAPI)                               │   │
│  │  /auth      → Login, register, JWT refresh           │   │
│  │  /medicines → Catalog CRUD                           │   │
│  │  /orders    → Order management                       │   │
│  │  /cart      → Shopping cart                          │   │
│  │  /ai_chat   → AI order/symptom agents                │   │
│  │  /doctor    → Appointments, prescriptions            │   │
│  │  /hospital  → Beds, admissions, billing              │   │
│  │  /ngo       → Beneficiaries, camps, donations        │   │
│  │  /patient   → Book appointments                      │   │
│  │  /admin     → System management                      │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Services Layer                                      │   │
│  │  - auth_service     → JWT generation, validation     │   │
│  │  - order_service    → Order processing               │   │
│  │  - ai_agent_service → Groq/Cohere integration        │   │
│  │  - email_service    → Brevo + PDF generation         │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │ SQLAlchemy ORM
                         ▼
┌─────────────────────────────────────────────────────────────┐
│           DATABASE (PostgreSQL - Neon/RDS)                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Core Tables:                                        │   │
│  │  • users (role: USER/ADMIN/DOCTOR/HOSPITAL_ADMIN/NGO)│  │
│  │  • medicines (catalog)                               │   │
│  │  • orders, order_items                               │   │
│  │  • cart                                              │   │
│  │  • prescriptions                                     │   │
│  │  • refill_alerts, notifications                      │   │
│  │  • call_schedules, contact_submissions               │   │
│  │                                                      │   │
│  │  Doctor Tables:                                      │   │
│  │  • doctor_appointments, doctor_patients              │   │
│  │                                                      │   │
│  │  Hospital Tables:                                    │   │
│  │  • hospital_beds, hospital_admissions                │   │
│  │  • hospital_medicines, patient_visits                │   │
│  │  • hospital_bills                                    │   │
│  │                                                      │   │
│  │  NGO Tables:                                         │   │
│  │  • ngo_beneficiaries, blood_camps, donation_drives  │   │
│  │                                                      │   │
│  │  AI Chat History Tables:                             │   │
│  │  • order_medicine_ai_chat_history                    │   │
│  │  • symptom_suggestion_chat_history                   │   │
│  │  • general_talk_chat_history                         │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

External Services:
┌──────────────┐  ┌───────────┐  ┌──────────┐  ┌────────────┐
│ Groq (AI)    │  │ Cohere    │  │ Brevo    │  │ Twilio     │
│ Order Agent  │  │ Symptoms  │  │ Email+PDF│  │ Phone Calls│
└──────────────┘  └───────────┘  └──────────┘  └────────────┘
```

---

## 🔐 Authentication & Authorization

### JWT Token Flow

**Login Process:**
```python
1. POST /auth/login
   Body: { email, password, selected_role }

2. Backend validates:
   - Email exists in DB
   - Password matches (bcrypt)
   - User is active

3. Auto-corrects demo account roles:
   hospital@sentinelrx.ai → HOSPITAL_ADMIN
   doctor@sentinelrx.ai → DOCTOR
   (prevents role drift during judging)

4. Generates JWT:
   {
     "sub": user_id,
     "email": user.email,
     "role": user.role.value,  # DB role
     "type": "access",
     "exp": now + 30 minutes
   }

5. Returns: { access_token, refresh_token }
```

**Authorization on Protected Routes:**
```python
@router.get("/hospital/beds")
def list_beds(
    current_user: User = Depends(require_roles(UserRole.HOSPITAL_ADMIN)),
    db: Session = Depends(get_db)
):
    # require_roles checks: current_user.role == HOSPITAL_ADMIN
    # If not → raises 403 Forbidden
    ...
```

---

## 🤖 AI Agent Architecture

### Two AI Agents in Chat

**1. Order Agent (Groq - LLaMA 3.3 70B)**
- **Purpose:** Extract medicine orders from natural language
- **Input:** "I need 2 Paracetamol and 1 Cough Syrup"
- **Process:**
  ```
  User message → Groq API
  → Structured extraction:
     [
       {"medicine": "Paracetamol", "quantity": 2},
       {"medicine": "Cough Syrup", "quantity": 1}
     ]
  → Check stock in DB
  → Return preview or error
  ```
- **Output:** Order preview with prices

**2. Symptom Agent (Cohere - Command R+)**
- **Purpose:** Recommend medicines based on symptoms
- **Input:** "I have headache and fever"
- **Process:**
  ```
  Symptom description → Cohere API
  → Medical knowledge reasoning
  → Matches symptoms to medicine indications in DB
  → Returns recommendations with explanations
  ```
- **Output:** List of suggested OTC medicines

---

## 📧 Email & PDF Generation

### Order Confirmation Flow
```
Order Placed
    ↓
Backend: order_service.py
    ↓
Generates PDF Invoice (ReportLab):
    - Order ID, Date
    - Medicine list with quantities & prices
    - Total amount
    - Patient details
    ↓
Sends Email via Brevo:
    - To: patient email
    - Subject: "Order Confirmation #12345"
    - Body: HTML template with order summary
    - Attachment: invoice.pdf
    ↓
Patient receives email
```

---

## 🗃️ Database Design Highlights

### Multi-Tenant by Design
Each role's data is isolated by linking to `user_id` or specific admin IDs:

**Hospital:**
```sql
hospital_beds:
  - hospital_admin_id (FK to users)
  
hospital_admissions:
  - hospital_admin_id
  - bed_id (FK to hospital_beds)
```

**Doctor:**
```sql
doctor_appointments:
  - doctor_id (FK to users where role=DOCTOR)
  - patient_id (FK to users where role=USER)
```

**NGO:**
```sql
ngo_beneficiaries:
  - ngo_id (FK to users where role=NGO)
```

This ensures:
- Hospital A cannot see Hospital B's beds
- Doctor 1 cannot see Doctor 2's appointments
- Data isolation without complex multi-tenancy

---

## 🔄 Key Data Flows

### Flow 1: Patient Browse → Cart → Checkout
```
1. GET /medicines → Browse catalog
2. POST /cart → Add item to cart (persisted in DB)
3. GET /cart → View cart items
4. POST /orders/checkout:
   Body: { address, landmark, pin_code }
   Backend:
   - Creates order + order_items
   - Clears cart
   - Updates medicine stock
   - Sends email
5. Order appears in /orders (Order History)
```

### Flow 2: Doctor Appointment → Prescription
```
1. Patient: POST /patient/appointments (book appointment)
2. Doctor: GET /doctor/appointments (see pending)
3. Doctor: PUT /doctor/appointments/{id} (status: CONFIRMED)
4. After consultation:
   POST /doctor/prescriptions
   Body: { appointment_id, medicines, prescription_text }
5. Backend:
   - Creates prescription record
   - Links to appointment
   - Updates appointment.prescription_issued = true
6. Patient: GET /prescriptions (sees prescription)
```

### Flow 3: Hospital Bed Allocation
```
1. Seed: 27 beds pre-created per hospital admin
2. Admin: GET /hospital/beds → See all beds grouped by ward
3. New patient arrives:
   POST /hospital/admissions
   Body: { bed_id, patient_name, diagnosis, ... }
4. Backend:
   - Creates admission
   - bed.status = OCCUPIED
5. Discharge:
   PUT /hospital/admissions/{id}
   Body: { status: DISCHARGED }
6. Backend:
   - Updates admission
   - bed.status = AVAILABLE
```

---

## 🛡️ Security Considerations

### Current Implementation
- ✅ JWT-based auth with secret key
- ✅ Password hashing (bcrypt)
- ✅ Role-based access control (DB role)
- ✅ CORS configured for production domains
- ✅ Environment variables for secrets
- ✅ Input validation (Pydantic)
- ✅ SQL injection protection (SQLAlchemy ORM)

### Production Recommendations
- Use strong `JWT_SECRET_KEY` (32+ chars, random)
- Enable HTTPS only (handled by Vercel/Render)
- Consider rate limiting for APIs
- Rotate API keys periodically
- Implement audit logging for admin actions

---

## 📊 Scalability & Performance

### Current State
- **Database:** PostgreSQL with indexes on email, order status
- **API:** Async FastAPI handlers
- **Frontend:** Code-split React app
- **Caching:** Browser caching via Vite build hashes

### For Scale (Future)
- Add Redis for session/cart caching
- Implement API rate limiting
- Add CDN for static assets
- Database read replicas
- Background job queue (Celery/RQ) for emails

---

## 🧩 Integration Points

| Service | Purpose | Required? |
|---------|---------|-----------|
| **Groq** | AI order extraction | Yes (for AI chat) |
| **Cohere** | Symptom recommendations | Yes (for AI chat) |
| **Brevo** | Transactional emails | Yes (order confirmations) |
| **Twilio** | Phone call reminders | Optional |
| **Cloudinary** | Image uploads | Optional |
| **PostgreSQL** | Primary database | **Required** |

---

## 🔧 Development Workflow

### Local Development Loop
```
1. Start backend: uvicorn app.main:app --reload
   → Hot reload on Python file changes
   → Access API docs at /docs

2. Start frontend: npm run dev
   → Hot reload on JSX/CSS changes
   → Vite proxy forwards /api/v1/* to backend

3. Make changes → Auto-reload → Test in browser

4. Run tests:
   Backend: pytest tests/
   Frontend: npm run build (verify no errors)

5. Commit → Push → Auto-deploy to Render + Vercel
```

---

## 📈 Monitoring & Observability

### Current Logging
- **Backend:** Python `logging` module (INFO/WARNING/ERROR)
- **Frontend:** Browser console + toast notifications
- **Errors:** Structured error responses in API

### Production Monitoring
- Render logs for backend errors
- Vercel logs for frontend builds
- Database slow query logs (if enabled)

---

## 🌍 Deployment Architecture

```
┌───────────────────────────────────────────────────────────┐
│  Users (Global) → Browser                                  │
└─────────────────────┬─────────────────────────────────────┘
                      │
          ┌───────────┴────────────┐
          ▼                        ▼
    ┌──────────┐            ┌──────────┐
    │ Vercel   │            │ Render   │
    │ (React)  │◄──REST────►│ (FastAPI)│
    │ SPA      │   API      │ Backend  │
    └──────────┘            └─────┬────┘
                                  │
                            ┌─────▼─────┐
                            │   Neon    │
                            │PostgreSQL │
                            └───────────┘
    
    External Services:
    - Groq (AI)
    - Cohere (AI)
    - Brevo (Email)
    - Twilio (Calls)
    - Cloudinary (Images)
```

**Deployment Triggers:**
- Push to `main` branch → Auto-deploy on Render + Vercel
- Migrations run automatically on Render startup
- Frontend build time: ~7-10 seconds
- Backend cold start: ~30-60 seconds

---

## 🧪 Testing Strategy

### Backend Tests (`pytest`)
```python
tests/
├── test_health.py          # Health check endpoint
├── test_error_format.py    # Error response structure
└── test_integration.py     # Full auth + AI flows
```

Coverage:
- ✅ Authentication (login, JWT)
- ✅ Order creation and stock updates
- ✅ AI chat history persistence
- ✅ Error handling formats

### Frontend Testing
- Build verification: `npm run build` must succeed
- Manual testing of user flows
- Cross-browser compatibility (Chrome, Firefox, Safari)

---

## 🚦 Error Handling Philosophy

### API Error Format (Consistent)
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": [...]
  }
}
```

### Frontend Error States
All dashboards and list pages implement:
```jsx
if (loading) return <Loader center />
if (error) return <ErrorState message="..." onRetry={load} />
```

This ensures:
- No blank/stuck pages during 403/500 errors
- Users can retry failed requests
- Clear error messages guide next steps

---

## 🔄 State Management

### Frontend State
- **Global:** React Context (Auth, Cart)
- **Local:** useState hooks in components
- **Persistence:** localStorage for token

### Backend State
- **Stateless:** Each request validates JWT independently
- **Database:** Source of truth for all data
- **No sessions:** JWT contains all auth info

---

## 📱 Responsive Design

All pages built mobile-first:
- Tailwind CSS responsive utilities (`sm:`, `md:`, `lg:`)
- Touch-friendly buttons (min 44×44px)
- Collapsible navigation on mobile
- Optimized layouts for tablets

---

## 🌐 Internationalization (i18n)

Current languages:
- **English** (en)
- **Hindi** (hi)
- **Marathi** (mr)

Implementation:
- `react-i18next` for frontend
- Translation files: `frontend/src/locales/{lang}.json`
- User preference stored in `User.preferred_language`
- Auto-switches on login

---

## 🔌 API Design Principles

1. **RESTful:** Standard HTTP verbs (GET, POST, PUT, DELETE)
2. **Versioned:** All routes under `/api/v1/`
3. **Consistent Response:**
   - Success: `{ items: [...], total: N }` or single object
   - Error: `{ error: { code, message, details } }`
4. **Authentication:** Bearer token in `Authorization` header
5. **Validation:** Pydantic schemas on all request bodies

---

## 📦 Dependencies

### Backend (Python)
```
fastapi          # Web framework
sqlalchemy       # ORM
alembic          # Migrations
pydantic         # Validation
python-jose      # JWT
bcrypt           # Password hashing
langchain-groq   # AI integration
cohere           # AI integration
reportlab        # PDF generation
brevo (sib-api)  # Email
twilio           # Phone calls (optional)
cloudinary       # Images (optional)
```

### Frontend (JavaScript)
```
react            # UI framework
react-router-dom # Routing
axios            # HTTP client
tailwindcss      # Styling
i18next          # Internationalization
chart.js         # Charts
leaflet          # Maps
lucide-react     # Icons
framer-motion    # Animations
```

---

## 🎨 Design System

**Colors:**
- **Primary:** Teal/Mint (pharmacy brand)
- **Role Colors:**
  - Patient: Teal
  - Admin: Violet
  - Doctor: Blue
  - Hospital: Orange
  - NGO: Green

**Typography:**
- Headings: Inter (font-display)
- Body: System fonts

**Components:**
- Cards with soft shadows
- Rounded corners (rounded-xl, rounded-2xl)
- Gradient banners for role branding

---

## 📖 Code Organization Philosophy

### Backend
- **Separation of Concerns:** Routes → Services → Models
- **Dependency Injection:** FastAPI `Depends()` for DB, auth
- **Type Safety:** Full Pydantic types, SQLAlchemy models typed

### Frontend
- **Component-Based:** Small, reusable components
- **Co-location:** Feature pages in role folders
- **Service Layer:** Axios abstractions per domain

---

## 🚀 Performance Optimizations

### Frontend
- Vite for fast HMR and optimized builds
- Lazy loading (could add React.lazy for routes)
- Image optimization (Cloudinary CDN)
- Code splitting (Vite automatic chunks)

### Backend
- Async FastAPI handlers
- Database query optimization (select specific columns)
- Connection pooling (SQLAlchemy default)
- Response caching (could add Redis)

---

## 🔮 Future Enhancements

Based on current codebase structure, natural next steps:

1. **Real-time Updates:** WebSocket for live order tracking
2. **Payment Gateway:** Razorpay/Stripe integration
3. **Analytics Dashboard:** More charts, export to CSV/Excel
4. **Mobile App:** React Native using same backend
5. **Video Consultations:** WebRTC for doctor calls
6. **Inventory Predictions:** ML for stock forecasting
7. **Multi-Language Expansion:** Tamil, Telugu, Bengali
8. **Offline Mode:** PWA with service workers

---

## 📚 Related Documentation

| File | What It Covers |
|------|----------------|
| `README.md` | Getting started, user workflows |
| `architecture.md` | This file — technical deep dive |
| `decision.md` | Why we made specific tech choices |
| `PROJECT_OVERVIEW.md` | Feature checklist, API routes |
| `DEPLOYMENT.md` | Production deployment steps |

---

## 🤝 Contributing to Architecture

When adding new features:
1. **New role?** → Add to `UserRole` enum, create router under `endpoints/`
2. **New table?** → Create model, generate Alembic migration
3. **New API?** → Add service layer, add tests
4. **New page?** → Add to `frontend/src/pages/{role}/`, add route in `router.jsx`

Always update this document when making architectural changes.

---

**Architecture designed for:** Scalability, maintainability, and multi-role flexibility.
