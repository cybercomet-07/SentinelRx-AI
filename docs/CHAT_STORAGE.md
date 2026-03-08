# AI Chat Storage - Database Tables

## Overview

Chat data is stored in **3 separate tables** for different purposes. When a user logs out and logs in again, their chat history remains in their account (linked by `user_id`).

---

## Table Mapping

| Table | AI Agent | Purpose |
|-------|----------|---------|
| **`chat_sessions`** | Combined (both) | Full conversation for "YOUR CHATS" sidebar. Stores `user_id`, `title`, `messages` (JSONB array of user + assistant messages). |
| **`general_talk_chat_history`** | **SentinelRX-AI** (symptom) | Each user message + AI response for symptom/health advice. Used when user asks about fever, headache, cold, etc. |
| **`order_medicine_ai_chat_history`** | **Order Agent** | Each user message + AI response for orders, stock inquiry. Used when user says "order paracetamol", "do you have X", etc. |

---

## Flow

1. **User sends message** → Routed to SentinelRX-AI (symptom) or Order Agent (order).
2. **Agent responds** → Saved to its table (`general_talk_chat_history` or `order_medicine_ai_chat_history`) with `chat_session_id` linking to the session.
3. **Frontend** → PATCHes `chat_sessions` with updated `messages` for the combined view in the sidebar.

---

## Logout/Login Persistence

- All tables use `user_id` (foreign key to `users.id`).
- When user logs out and logs in again with the same account, `GET /ai-chat/sessions` returns their sessions (filtered by `current_user.id`).
- Chat history is **persistent** and tied to the user's account.

---

## Verification

Run the verification script to test DB storage and logout/login persistence:

```powershell
cd backend
py scripts/verify_ai_chat.py
```
