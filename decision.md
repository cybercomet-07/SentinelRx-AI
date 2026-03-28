# Architecture Decision Records (ADR)

Decisions for **SentinelRx-AI** (current codebase). Update this file when you change auth, hosting, or data stores.

---

## ADR-1: JWT authentication (no Firebase)

**Context:** Need authenticated sessions for web clients and role-specific APIs.

**Decision:** Issue JWT access + refresh tokens server-side; validate with a shared secret (`JWT_SECRET_KEY`). No Firebase.

**Rationale:** Simple to deploy, full control, works well with FastAPI dependencies. Tokens carry user id; role comes from DB.

---

## ADR-2: PostgreSQL as primary database

**Context:** Users, orders, medicines, hospital/NGO entities, migrations.

**Decision:** PostgreSQL via SQLAlchemy; Alembic for migrations.

**Rationale:** Production-grade concurrency and tooling; aligns with managed DB on Render/Neon.

---

## ADR-3: Groq + Cohere for AI features

**Context:** Order extraction / chat agent and symptom-based recommendations.

**Decision:** Groq for fast order-style flows; Cohere for richer symptom / recommendation flows.

**Rationale:** Team already integrated both; Groq latency fits interactive chat.

---

## ADR-4: Brevo for transactional email

**Context:** Order confirmations and PDF invoices.

**Decision:** Brevo API + ReportLab-generated PDFs attached where implemented.

**Rationale:** Reliable transactional email without running an SMTP server.

---

## ADR-5: Multi-role product model

**Context:** One product serves patients, platform admin, doctors, hospitals, NGOs.

**Decision:** Single `users` table with `UserRole` enum; separate API routers per domain (`admin`, `doctor`, `hospital`, `ngo`, `patient`).

**Rationale:** One identity store; clear route boundaries; frontend role selector + protected routes.

---

## ADR-6: Authorize API access using database role

**Context:** Login UI lets users pick a “portal” role; JWT may also carry a role claim for display.

**Decision:** `require_roles(...)` checks **`current_user.role` from the database**, not only the JWT display role.

**Rationale:** Prevents 403 drift when DB role and selected UI role disagree; demo/judging accounts stay consistent after seeding.

---

## ADR-7: Quick Start as default patient landing

**Context:** Post-login experience for end users.

**Decision:** Patient flow often lands on `/user/quick-start` (onboarding-style) with dashboard and other routes available from navigation.

**Rationale:** Guided first run; reduces confusion before chat and ordering.

---

## ADR-8: Two AI agents in one chat experience

**Context:** Users both “order by name” and “ask by symptoms.”

**Decision:** Combined chat UX with distinct agent behavior (implementation in unified chat components + `ai_chat` API).

**Rationale:** Single page avoids context switching for users.

---

## ADR-9: Web Speech API for voice (browser)

**Context:** Voice input/output without native apps.

**Decision:** Browser Web Speech API where enabled.

**Rationale:** No extra service for basic voice; works for demos in supported browsers.

---

## ADR-10: Frontend API base via `VITE_API_URL`

**Context:** Local dev uses Vite proxy; production must hit deployed backend.

**Decision:** `VITE_API_URL` drives Axios `baseURL` (see `frontend/src/utils/constants.js`).

**Rationale:** One build for all environments; avoids hardcoding production URLs.

---

## How to add a new ADR

Use the same sections: **Context**, **Decision**, **Rationale**, and link the PR or issue if applicable.
