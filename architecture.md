# 🏥 AI-Powered Medicine Refill & Order Automation System
Hackathon Architecture Documentation

---

## 1️⃣ High-Level System Overview

This system enables patients to request medicine refills using chat/voice.  
An AI agent validates the order, checks stock, confirms execution, and triggers automation for warehouse simulation and notifications.

The system consists of:

- Frontend (React)
- Backend (FastAPI)
- AI Agent Layer (LangChain)
- Database (SQLite via SQLAlchemy)
- Automation (n8n)
- Observability (Langfuse)

---

## 2️⃣ Architecture Layers

### 🔹 1. USER LAYER
- Patient interacts via:
  - Chat UI
  - Voice Input
- Requests medicine refill or new order.

---

### 🔹 2. FRONTEND LAYER (React)

Responsibilities:
- Chat Interface
- Voice Input Integration
- User Dashboard
- Admin Dashboard
- Axios API communication
- Environment-based API configuration

Flow:
User → React → Backend API

---

### 🔹 3. BACKEND LAYER (FastAPI)

Core Architecture:
- FastAPI framework
- SQLAlchemy ORM
- Pydantic Schemas
- CORS Middleware
- Firebase Authentication
- Environment Variables (.env)
- Proper Error Handling

Responsibilities:
- Validate API requests
- Authenticate users
- Communicate with AI layer
- Manage database operations
- Trigger automation webhook

---

### 🔹 4. AI AGENT LAYER (LangChain)

Agents:

1. Conversation Agent
   - Understand user request
   - Extract medicine name & quantity

2. Safety Agent
   - Validate prescription rules
   - Prevent unsafe orders

3. Refill Prediction Agent
   - Predict refill need based on history

4. Execution Agent
   - Confirm final order decision
   - Send decision to backend

LLM keys stored securely via `.env`.

---

### 🔹 5. DATABASE LAYER (SQLite via SQLAlchemy)

Tables:

- Users
- Medicines
- Orders
- User_History

Why ORM?
- Prevent SQL injection
- Clean model-based DB structure
- Scalable architecture
- Industry-standard backend practice

---

### 🔹 6. AUTOMATION LAYER (n8n)

Triggered via webhook from backend.

Workflow:
- Receive confirmed order
- Simulate warehouse packing
- Update status (Packed → Shipped)
- Send notification event

Includes:
- Error handling for failed triggers
- Manual webhook testing before deployment

---

### 🔹 7. OBSERVABILITY LAYER (Langfuse)

Purpose:
- Log AI decisions
- Store reasoning traces
- Track workflow execution
- Debug AI errors

Why Important?
- Judges see transparency in AI decisions
- Helps during debugging
- Adds production maturity

---

## 3️⃣ End-to-End Workflow

1. User sends medicine request.
2. React sends API call to Backend.
3. Backend forwards request to AI Agent.
4. AI validates order.
5. Backend checks stock in DB.
6. AI confirms final decision.
7. Backend:
   - Saves order
   - Updates stock
   - Triggers n8n webhook
8. n8n simulates warehouse + notifications.
9. Order status returned to frontend.
10. AI reasoning logged in Langfuse.

---

## 4️⃣ Security & Best Practices

- Environment variables for all API keys
- No hardcoded secrets
- Pydantic request validation
- Structured error responses
- CORS configured properly
- Postman testing before integration
- Separate testing phase after each module

---

## 5️⃣ Deployment Plan

Backend:
- Render / Railway

Frontend:
- Vercel / Netlify

Automation:
- n8n Cloud

Production Steps:
- Configure environment variables
- Update API URLs
- Perform full end-to-end production testing

---


This is not just a hackathon prototype — it is a production-style architecture.
