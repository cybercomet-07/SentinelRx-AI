# Step-by-Step: Run Frontend + Backend Together

Follow these steps **in order**.

---

## STEP 1: Open First Terminal (Backend)

1. Open **PowerShell** or **Command Prompt**
2. Go to your project folder:
   ```
   cd C:\Users\Lenovo\OneDrive\Documents\SentinelRx-AI\backend
   ```
3. Activate the Python virtual environment:
   ```
   .\.venv\Scripts\Activate.ps1
   ```
   *(You should see `(.venv)` in the prompt)*
4. Set the database URL:
   ```
   $env:DATABASE_URL="postgresql+psycopg://postgres:parth%40123@localhost:5432/sentinelrx"
   ```
5. Start the backend:
   ```
   uvicorn app.main:app --reload
   ```
6. Wait until you see: **"Application startup complete"**
7. **Leave this terminal open.** Do not close it.

---

## STEP 2: Check Backend is Running

1. Open your browser
2. Go to: **http://localhost:8000**
3. You should see a JSON message with "SentinelRx-AI Backend"
4. If you see it → Backend is working. Continue to Step 3.

---

## STEP 3: Open Second Terminal (Frontend)

1. Open a **NEW** PowerShell/Command Prompt window
2. Go to your **frontend** folder. Examples:
   - If frontend is inside project: `cd C:\Users\Lenovo\OneDrive\Documents\SentinelRx-AI\frontend`
   - If frontend is elsewhere: `cd C:\path\to\your\frontend`
3. Install dependencies (first time only):
   ```
   npm install
   ```
4. Start the frontend:
   ```
   npm run dev
   ```
   *(Or `npm start` if using Create React App)*
5. Note the URL shown (e.g. **http://localhost:5173** or **http://localhost:3000**)
6. **Leave this terminal open.**

---

## STEP 4: Configure Frontend to Use Backend

Your frontend must know the backend URL.

**If using Vite (React):**
1. Create a file: `frontend/.env`
2. Add this line:
   ```
   VITE_API_URL=http://localhost:8000
   ```
3. Restart the frontend (Ctrl+C, then `npm run dev` again)

**If using Create React App:**
1. Create a file: `frontend/.env`
2. Add this line:
   ```
   REACT_APP_API_URL=http://localhost:8000
   ```
3. Restart the frontend

---

## STEP 5: Create Demo Users (First Time)

Run this once to create demo accounts:

```
cd C:\Users\Lenovo\OneDrive\Documents\SentinelRx-AI\backend
.\.venv\Scripts\Activate.ps1
python scripts/seed_demo_users.py
```

This creates:
- **User:** `user@sentinelrx.ai` / `User1234`
- **Admin:** `admin@example.com` / `AdminPass123!`

---

## STEP 6: Open Frontend in Browser

1. Open your browser
2. Go to the frontend URL (e.g. **http://localhost:5173** or **http://localhost:3001**)
3. You should see your app
4. Click **Demo credentials** to auto-fill, then **Sign in**
5. If login works and you see data → **Both are working together!**

**Login stuck on "Please wait..."?**
- Ensure backend is running at http://localhost:8000
- Ensure `frontend/.env` has `VITE_API_URL=http://localhost:8000`
- Run `python scripts/seed_demo_users.py` to create demo users

---

## Summary: What You Need Running

| Terminal | Command | URL |
|----------|---------|-----|
| Terminal 1 | `uvicorn app.main:app --reload` | http://localhost:8000 |
| Terminal 2 | `npm run dev` | http://localhost:5173 or 3000 |

**Both must stay open at the same time.**

---

## Where is Your Frontend?

If you don't have a `frontend` folder yet:
- Create a new React app: `npx create-react-app frontend` or `npm create vite@latest frontend -- --template react`
- Or tell me where your frontend code is located
