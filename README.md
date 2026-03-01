# SentinelRx-AI

AI-backed pharmacy platform with FastAPI backend and React frontend.

## Quick Start

### Option 1: Run scripts (easiest)

**Terminal 1 – Backend:**
```powershell
.\run-backend.ps1
```
or `run-backend.bat`

**Terminal 2 – Frontend:**
```powershell
.\run-frontend.ps1
```
or `run-frontend.bat`

### Option 2: Manual commands

**Backend:**
```powershell
cd backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload
```
→ http://localhost:8000

**Frontend:**
```powershell
cd frontend
npm install
npm run dev
```
→ http://localhost:3005

### Environment

- **Backend:** Set `DATABASE_URL` in `backend/.env` (or use default PostgreSQL)
- **Frontend:** Copy `frontend/.env.example` to `frontend/.env`, set `VITE_API_URL=http://127.0.0.1:8000`

### Demo users

- User: `user@sentinelrx.ai` / `User1234`
- Admin: `admin@example.com` / `AdminPass123!`

## Project Structure

```
SentinelRx-AI/
├── backend/          # FastAPI, SQLAlchemy, PostgreSQL
├── frontend/         # React, Vite, Tailwind
├── run-backend.ps1   # Start backend
├── run-frontend.ps1  # Start frontend
├── run-all.bat       # Start both servers
└── PROJECT_OVERVIEW.md  # Full project documentation
```

## Docs

- `PROJECT_OVERVIEW.md` — Full project overview, features, API, architecture
