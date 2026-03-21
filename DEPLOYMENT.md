# Deployment Checklist

## Vercel (Frontend)

**Required:** Set `VITE_API_URL` in Environment Variables:
- **Value:** `https://sentinelrx-ai.onrender.com/api/v1`
- **Environments:** Production, Preview

Without this, the frontend cannot reach the backend and features will fail.

## Render (Backend)

Ensure these env vars are set:
- `DATABASE_URL` - Neon/PostgreSQL connection string
- `JWT_SECRET_KEY` - Long random string
- `CORS_ORIGINS` - Includes `https://sentinelrx-ai.vercel.app`
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_NUMBER` - For call reminders (optional)

Migrations run automatically at startup (`alembic upgrade head`).
