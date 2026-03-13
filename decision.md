# Architecture Decision Records (ADR)

Decisions made during SentinelRx-AI development.

---

## ADR-1: JWT over Firebase Auth

**Context:** Need user authentication for user and admin roles.

**Decision:** Use JWT (JSON Web Tokens) with a secret key stored in `.env`.

**Rationale:** Simpler setup, no external Firebase dependency, full control over tokens and expiry. Backend validates JWT on each request.

---

## ADR-2: PostgreSQL over SQLite

**Context:** Database for users, medicines, orders, prescriptions.

**Decision:** Use PostgreSQL via SQLAlchemy.

**Rationale:** Production-ready, supports concurrent writes, better for scaling. SQLite was used in early prototypes.

---

## ADR-3: Groq + Cohere for AI

**Context:** Need LLMs for order extraction and symptom-based recommendations.

**Decision:** Groq for Order Agent (fast inference), Cohere for SentinelRX-AI symptom agent.

**Rationale:** Groq offers low-latency responses for order flow. Cohere provides strong multilingual and reasoning capabilities for medical suggestions.

---

## ADR-4: Brevo for Email

**Context:** Order confirmation emails with PDF invoices.

**Decision:** Use Brevo (Sendinblue) for transactional email.

**Rationale:** Reliable delivery, simple API, supports attachments. ReportLab generates PDF invoices server-side.

---

## ADR-5: Quick Start as Post-Login Landing

**Context:** User onboarding after login.

**Decision:** Redirect to `/user/quick-start` instead of dashboard. Quick Start shows a roadmap of features (Symptoms Tips, Browse Medicines, Order History, etc.).

**Rationale:** New users benefit from a guided overview before diving into chat or medicines. Dashboard remains available at `/user/dashboard`.

---

## ADR-6: Two AI Agents Side-by-Side

**Context:** Chat UI design.

**Decision:** Show Order Agent and SentinelRX-AI side-by-side in one chat page.

**Rationale:** Users can switch between ordering by name and getting symptom-based recommendations without leaving the page.

---

## ADR-7: Web Speech API for Voice

**Context:** Voice input and TTS for chat.

**Decision:** Use browser Web Speech API (SpeechRecognition, SpeechSynthesis).


