# Step-by-Step: Run SentinelRx-AI

---

## Quick Run (2 terminals)

**Terminal 1:**
```powershell
cd C:\Users\Lenovo\OneDrive\Documents\SentinelRx-AI
.\run-backend.ps1
```

**Terminal 2:**
```powershell
cd C:\Users\Lenovo\OneDrive\Documents\SentinelRx-AI
.\run-frontend.ps1
```

---

## Manual Run

### 1. Backend

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
$env:DATABASE_URL="postgresql+psycopg://postgres:postgres@localhost:5432/sentinelrx"
uvicorn app.main:app --reload
```

→ http://localhost:8000

### 2. Frontend

```powershell
cd frontend
npm install
npm run dev
```

→ http://localhost:5173

### 3. Frontend .env

Create `frontend/.env`:
```
VITE_API_URL=http://127.0.0.1:8000
```

---

## Demo Login

- **User:** user@sentinelrx.ai / User1234
- **Admin:** admin@example.com / AdminPass123!
