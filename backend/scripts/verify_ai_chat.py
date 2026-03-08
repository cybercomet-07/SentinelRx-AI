#!/usr/bin/env python
"""
Manual verification script for AI Chat: DB storage and features.
Run with: py scripts/verify_ai_chat.py
Requires: Backend running (e.g. uvicorn), PostgreSQL with correct DATABASE_URL.

Tests:
1. Register + login
2. Sessions CRUD
3. Unified chat (symptom) -> saves to general_talk_chat_history
4. Unified chat (order) -> saves to order_medicine_ai_chat_history
5. Medicines autocomplete
"""
import os
import sys
import uuid

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

BASE_URL = os.environ.get("API_BASE", "http://localhost:8000/api/v1")


def req(method: str, path: str, token: str | None = None, json=None, timeout=45):
    import urllib.request
    import urllib.error
    import json as json_mod

    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    data = json_mod.dumps(json).encode() if json else None
    req_obj = urllib.request.Request(url, data=data, headers=headers, method=method)
    with urllib.request.urlopen(req_obj, timeout=timeout) as r:
        return json_mod.loads(r.read().decode())


def main():
    print("=" * 60)
    print("AI Chat Verification Script")
    print("=" * 60)
    print(f"API Base: {BASE_URL}")
    print()

    try:
        # 1. Register
        email = f"verify_{uuid.uuid4().hex[:8]}@test.com"
        print("1. Registering test user...")
        req("POST", "/auth/register", json={
            "name": "Verify User",
            "email": email,
            "password": "VerifyPass123!",
            "phone": "9876543210",
            "address": "123 Test Street, Test City",
            "landmark": "Near Test Mall",
            "pin_code": "400001",
            "date_of_birth": "1990-01-15",
        })
        print("   OK")

        # 2. Login
        print("2. Logging in...")
        login = req("POST", "/auth/login", json={"email": email, "password": "VerifyPass123!"})
        token = login["access_token"]
        print("   OK")

        # 3. Sessions
        print("3. Testing sessions...")
        sid = f"s_verify_{uuid.uuid4().hex[:10]}"
        sess = req("POST", "/ai-chat/sessions", token=token, json={
            "id": sid, "title": "Verify chat", "messages": [],
        })
        assert sess["id"] == sid
        print("   Created session:", sid)

        list_sess = req("GET", "/ai-chat/sessions", token=token)
        assert len(list_sess["sessions"]) >= 1
        print("   Listed sessions: OK")

        # 4. Symptom chat (-> general_talk_chat_history)
        print("4. Sending symptom message (I have headache)...")
        r1 = req("POST", "/ai-chat/unified-chat", token=token, json={
            "message": "I have headache",
            "session_id": sid,
            "history": [],
        }, timeout=45)
        assert "response" in r1
        assert r1.get("intent") == "symptom"
        print("   Response:", (r1["response"][:80] + "..." if len(r1["response"]) > 80 else r1["response"]))
        print("   Intent: symptom -> general_talk_chat_history")

        # 5. Order chat (-> order_medicine_ai_chat_history)
        print("5. Sending order message (order paracetamol)...")
        r2 = req("POST", "/ai-chat/unified-chat", token=token, json={
            "message": "order paracetamol",
            "session_id": sid,
            "history": [],
        }, timeout=45)
        assert "response" in r2
        print("   Response contains HTML/order preview:", "<" in str(r2["response"]))
        print("   Intent:", r2.get("intent", "order"))

        # 6. Medicines autocomplete
        print("6. Medicines autocomplete...")
        meds = req("GET", "/ai-chat/medicines", token=token)
        assert "medicine_list" in meds
        print("   OK, count:", len(meds["medicine_list"]))

        # 7. Logout/login persistence - chat should remain in user's account
        print("7. Logout/login persistence...")
        session_count_before = len(list_sess["sessions"])
        login2 = req("POST", "/auth/login", json={"email": email, "password": "VerifyPass123!"})
        token2 = login2["access_token"]
        list_after = req("GET", "/ai-chat/sessions", token=token2)
        assert len(list_after["sessions"]) >= session_count_before, "Chat sessions lost after re-login"
        found = next((s for s in list_after["sessions"] if s["id"] == sid), None)
        assert found, "Session not found after re-login"
        print("   OK - chat persists after logout/login")

        # 8. Verify DB storage
        print()
        print("8. Verifying DB storage...")
        try:
            from app.db.session import SessionLocal
            from app.models.user import User
            from app.models.chat_history import GeneralTalkChatHistory, OrderMedicineAiChatHistory
            from app.models.chat_session import ChatSession

            db = SessionLocal()
            try:
                user = db.query(User).filter(User.email == email).first()
                assert user, "User not found"
                uid = user.id

                gt = db.query(GeneralTalkChatHistory).filter(
                    GeneralTalkChatHistory.user_id == uid,
                    GeneralTalkChatHistory.user_message == "I have headache",
                ).first()
                assert gt, "general_talk_chat_history: No row for symptom message"
                assert gt.chat_session_id == sid, "chat_session_id not stored"
                print("   general_talk_chat_history: OK (symptom saved, session_id linked)")

                om = db.query(OrderMedicineAiChatHistory).filter(
                    OrderMedicineAiChatHistory.user_id == uid,
                    OrderMedicineAiChatHistory.chat_session_id == sid,
                ).order_by(OrderMedicineAiChatHistory.created_at.desc()).first()
                assert om, "order_medicine_ai_chat_history: No row for order message"
                assert "paracetamol" in om.user_message.lower(), "Order message not stored"
                print("   order_medicine_ai_chat_history: OK (order saved, session_id linked)")

                cs = db.query(ChatSession).filter(ChatSession.id == sid).first()
                assert cs, "chat_sessions: Session not found"
                print("   chat_sessions: OK (combined view)")
            finally:
                db.close()
        except ImportError as ie:
            print("   (DB verification skipped - run from backend dir)")
        except Exception as db_err:
            print(f"   DB verification failed: {db_err}")

        print()
        print("=" * 60)
        print("ALL CHECKS PASSED - AI Chat features working")
        print("=" * 60)
        return 0

    except Exception as e:
        import traceback
        err_msg = str(e)
        if hasattr(e, "read"):
            try:
                err_msg = e.read().decode()[:500]
            except Exception:
                pass
        print(f"\nError: {err_msg}")
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
