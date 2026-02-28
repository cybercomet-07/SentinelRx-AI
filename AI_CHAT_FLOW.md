# AI Chat — Clean Flow (No Hardcoding)

> All data comes from the database. No mock data in chat flow.

---

## 1. High-Level Flow

```
User Input (text/voice)
        │
        ▼
┌───────────────────┐
│  POST /ai-chat/chat │
│  { message }       │
└─────────┬─────────┘
          │
          ▼
┌─────────────────────────────────────┐
│  Intent Detection                    │
│  • order_medicine (order, buy, need) │
│  • general_chat (what is, suggest…)  │
└─────────┬───────────────────────────┘
          │
    ┌─────┴─────┐
    │           │
    ▼           ▼
ORDER         GENERAL
FLOW          CHAT FLOW
    │           │
    ▼           ▼
Medicine      GROQ LLM
Search (DB)   (health Q&A)
    │           │
    ▼           │
Order         │
Preview       │
(HTML form)   │
    │           │
    └─────┬─────┘
          ▼
    Response to User
```

---

## 2. Data Sources (All from DB)

| Data | Source | Endpoint |
|------|--------|----------|
| Medicines (autocomplete) | `Medicine` table | `GET /ai-chat/medicines` |
| Medicine search (order) | `Medicine` table (ILIKE) | Inside `POST /ai-chat/chat` |
| Order creation | `Order`, `OrderItem` | `POST /ai-chat/process-order` |
| Order cancel | `Order` | `POST /ai-chat/order/{id}/action` |
| Chat history | `ChatHistory` | Logged inside chat service |

---

## 3. Step-by-Step Flow

### 3.1 Page Load

1. User opens Chat page.
2. Frontend calls `GET /ai-chat/medicines` → backend returns medicines list from DB.
3. Frontend stores list for autocomplete (typing suggestions).

### 3.2 User Sends Message

1. User types or speaks (e.g. "order 2 Paracetamol" or "what is fever?").
2. Frontend calls `POST /ai-chat/chat` with `{ message }`.

### 3.3 Backend Intent + Response

**Intent:** `order_medicine` or `general_chat`

**If order_medicine:**
- Search DB for medicine names (SQL ILIKE, no hardcoding).
- Match: "paracetamol" → DB medicines.
- If found: build order preview HTML with confirm/cancel.
- If not found: try LLM to extract medicine names; search DB again.
- Return HTML preview or "medicine not found".

**If general_chat:**
- Send message to GROQ LLM.
- Return AI response (health advice, symptoms, etc.).

### 3.4 User Confirms/Cancels Order

1. User clicks "Confirm Order" or "Cancel" in preview.
2. Form submits to `POST /ai-chat/process-order`.
3. Backend: confirm → create Order + OrderItems, update stock, notify.
4. Backend: cancel → return cancelled status.
5. Frontend shows result.

### 3.5 Cancel Confirmed Order

1. User clicks "Cancel Order" in chat.
2. Frontend calls `POST /ai-chat/order/{id}/action` with `{ action: "cancel" }`.
3. Backend cancels order.

---

## 4. API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/ai-chat/medicines` | Medicine list for autocomplete |
| POST | `/api/v1/ai-chat/chat` | Chat message → response |
| POST | `/api/v1/ai-chat/process-order` | Confirm/cancel order from preview |
| POST | `/api/v1/ai-chat/order/{id}/action` | Cancel confirmed order |

---

## 5. Config Required

- **Backend:** `GROQ_API_KEY` in `.env` for general chat (health Q&A).
- **Optional:** Without GROQ, order flow still works; general chat returns "AI not configured".

---

## 6. Summary

| Aspect | Implementation |
|--------|----------------|
| **Medicine data** | From DB |
| **Order flow** | DB → Order, OrderItem |
| **General chat** | GROQ LLM |
| **Hardcoding** | None in chat flow |
