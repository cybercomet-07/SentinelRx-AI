Here is ready-to-paste Markdown for the three files. The repo uses architecture.md at the root; if you prefer arch.md, use the same content under that filename.

README.md
# SentinelRx-AI
AI-backed healthcare platform: pharmacy ordering, AI chat, prescriptions, refill alerts, and role-specific portals (Patient, Super Admin, Doctor, Hospital Admin, NGO).
## Stack
| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite 5, Tailwind CSS, React Router, Axios, i18next |
| Backend | FastAPI, SQLAlchemy, Pydantic, Alembic |
| Database | PostgreSQL |
| Auth | JWT (Bearer), role stored on user record |
| AI | Groq (order agent), Cohere (symptom / recommendations) |
| Email | Brevo (transactional + PDF invoices via ReportLab) |
| Optional | Twilio (calls), Cloudinary (uploads) |
## Quick start (local)
### Option A — helper scripts (Windows)
**Terminal 1 — backend**
```powershell
.\run-backend.ps1
or run-backend.bat

Terminal 2 — frontend

.\run-frontend.ps1
or run-frontend.bat

Or use run-all.bat to start both.

Option B — manual
Backend (from repo root):

cd backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload
→ API: http://localhost:8000 · OpenAPI: http://localhost:8000/docs

Frontend:

cd frontend
npm install
npm run dev
→ App (see frontend/vite.config.js for port, often 3005).

Environment
Backend: copy backend/.env.example → backend/.env and set at least DATABASE_URL, JWT_SECRET_KEY, and any AI/email keys you use (GROQ_API_KEY, COHERE_API_KEY, BREVO_API_KEY, etc.).
Frontend: copy frontend/.env.example → frontend/.env and set:
Local: VITE_API_URL=http://127.0.0.1:8000
Production: your deployed API base (see DEPLOYMENT.md).
Demo / judging accounts
Seed scripts define fixed test users (see backend/scripts/seed_demo_roles.py). Typical emails:

Role	Email (example)	Notes
Patient	patient@sentinelrx.ai	Pharmacy / user flows
Super Admin	admin@sentinelrx.ai	Admin + system tools
Doctor	doctor@sentinelrx.ai	Doctor portal
Hospital Admin	hospital@sentinelrx.ai	Hospital portal
NGO	ngo@sentinelrx.ai	NGO portal
Passwords are printed when you run the seed script. Login uses a role selector on the login page; authorization on protected APIs is enforced using the database role for the user.

Project layout
SentinelRx-AI/
├── backend/                 # FastAPI app, Alembic, tests
│   ├── app/
│   │   ├── api/v1/          # Routers: auth, admin, doctor, hospital, ngo, patient, …
│   │   ├── core/            # Config, security
│   │   ├── models/          # SQLAlchemy models
│   │   └── services/        # Business logic
│   ├── alembic/             # Migrations
│   └── tests/
├── frontend/                # Vite + React SPA
├── architecture.md          # System architecture
├── decision.md              # Architecture decision records
├── DEPLOYMENT.md            # Vercel / Render checklist
├── PROJECT_OVERVIEW.md      # Extended feature / route reference
└── run-*.ps1 / run-*.bat    # Local dev helpers
Docs
File	Purpose
PROJECT_OVERVIEW.md	Features, routes, deeper reference
architecture.md	Layers, data flow, deployment picture
decision.md	ADRs (why JWT, PostgreSQL, etc.)
DEPLOYMENT.md	VITE_API_URL, Render env, CORS
Scripts
Backend tests: from backend/: py -m pytest tests/ -q
Frontend build: from frontend/: npm run build
