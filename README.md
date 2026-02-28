# SentinelRx-AI

AI-backed pharmaceutical prescription analysis platform with FastAPI backend and React frontend.

## Project Structure

```
SentinelRx-AI/
├── backend/     # FastAPI, PostgreSQL, SQLAlchemy
├── frontend/    # React, Vite, Tailwind
├── architecture.md
├── decision.md
├── structure.md
├── FRONTEND_BACKEND_OVERVIEW.md
└── STEP_BY_STEP.md
```

## Quick Start

### 1. Backend
```powershell
cd backend
.\.venv\Scripts\Activate.ps1
# Set DATABASE_URL in .env
uvicorn app.main:app --reload
```
→ http://localhost:8000

### 2. Frontend
```powershell
cd frontend
npm install
# Copy .env.example to .env, set VITE_API_URL=http://localhost:8000
npm run dev
```
→ http://localhost:5173

### 3. Run Both
Keep both terminals open. See `STEP_BY_STEP.md` for detailed instructions.

## Docs

- `STEP_BY_STEP.md` — How to run frontend + backend
- `FRONTEND_BACKEND_OVERVIEW.md` — API alignment, features, action plan
- `architecture.md` — System architecture
- `decision.md` — Design decisions
