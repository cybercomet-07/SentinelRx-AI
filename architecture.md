# SentinelRx-AI — Architecture

AI-powered pharmacy platform with medicine ordering, symptom-based recommendations, and admin management.

---

## 1. High-Level Overview

**Stack:**
- **Frontend:** React 18, Vite, Tailwind CSS
- **Backend:** FastAPI, SQLAlchemy, Pydantic
- **Database:** PostgreSQL
- **AI:** Groq (Order Agent), Cohere (SentinelRX-AI symptom agent)
- **Email:** Brevo (order confirmation + invoice PDF)
- **Auth:** JWT (no Firebase)

---

## 2. Architecture Layers

### User Layer
- Chat UI (text + voice via Web Speech API)
- Browse Medicines, Cart, Checkout
- Order History, Refill Alerts, Prescriptions
- Quick Start (onboarding roadmap)
- Contact Us

### Frontend Layer (React + Vite)
- Chat interface with two agents: Order Agent + SentinelRX-AI
- Voice input with TTS and multilingual prompts
- User and Admin dashboards
- Axios API communication
- Environment-based API URL (`VITE_API_URL`)

### Backend Layer (FastAPI)
- FastAPI, SQLAlchemy ORM, Pydantic schemas
- CORS middleware
- JWT authentication
- Environment variables (`.env`)
- Structured error handling

### AI Agent Layer
- **Order Agent (Groq):** Extract medicine names and quantities from chat, validate stock, confirm orders
- **SentinelRX-AI (Cohere):** Symptom-based medicine recommendations from inventory
- **Symptom Recommendation:** Prescription upload flow with OTC suggestions
- Multilingual support (Hindi, Marathi, Tamil, etc.)

### Database Layer (PostgreSQL)
- Users, Medicines, Orders, Order Items
- Cart, Refill Alerts, Notifications
- Prescriptions, Contact submissions
- Chat history (separate tables per agent)

### Email Layer (Brevo)
- Order confirmation emails
- PDF invoice attachment (ReportLab)
- Refill alert reminders

---

## 3. End-to-End Workflow

1. User logs in → redirected to Quick Start
2. User chats (text/voice) → Order Agent or SentinelRX-AI
3. AI extracts intent, checks stock, returns order preview
4. User confirms → Backend creates order, updates stock
5. Brevo sends confirmation email with PDF invoice
6. Order appears in Order History

---

## 4. Security & Best Practices

- Environment variables for all API keys
- No hardcoded secrets
- Pydantic request validation
- CORS configured
- JWT with role-based access (user/admin)

---

## 5. Deployment

- **Backend:** Render / Railway
- **Frontend:** Vercel / Netlify
- **Database:** Managed PostgreSQL (e.g. Supabase, Neon)
