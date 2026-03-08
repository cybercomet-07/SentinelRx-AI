"""
Integration tests for all API modules.
Requires PostgreSQL with DATABASE_URL set. Uses unique emails to avoid conflicts.
"""
import uuid

import pytest
from fastapi.testclient import TestClient

from app.db.session import SessionLocal
from app.models.user import User, UserRole
from app.core.security import hash_password


def _get_client() -> TestClient:
    from app.main import app
    return TestClient(app)


@pytest.fixture
def client() -> TestClient:
    return _get_client()


@pytest.fixture
def user_token(client: TestClient) -> str:
    """Register and login as USER, return access token."""
    email = f"testuser_{uuid.uuid4().hex[:8]}@example.com"
    client.post(
        "/api/v1/auth/register",
        json={"name": "Test User", "email": email, "password": "TestPass123!"},
    )
    r = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "TestPass123!"},
    )
    assert r.status_code == 200
    return r.json()["access_token"]


@pytest.fixture
def admin_token(client: TestClient) -> str:
    """Create ADMIN user in DB, login, return access token."""
    email = f"admin_{uuid.uuid4().hex[:8]}@example.com"
    db = SessionLocal()
    try:
        admin = User(
            name="Admin User",
            email=email,
            password_hash=hash_password("AdminPass123!"),
            role=UserRole.ADMIN,
            is_active=True,
        )
        db.add(admin)
        db.commit()
    finally:
        db.close()
    r = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "AdminPass123!"},
    )
    assert r.status_code == 200
    return r.json()["access_token"]


def _headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


# ----- Auth -----
def test_register_and_login(client: TestClient):
    email = f"newuser_{uuid.uuid4().hex[:8]}@example.com"
    r = client.post(
        "/api/v1/auth/register",
        json={"name": "New User", "email": email, "password": "SecurePass123!"},
    )
    assert r.status_code == 200
    data = r.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

    r2 = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "SecurePass123!"},
    )
    assert r2.status_code == 200
    assert "access_token" in r2.json()


def test_auth_me(client: TestClient, user_token: str):
    r = client.get("/api/v1/auth/me", headers=_headers(user_token))
    assert r.status_code == 200
    data = r.json()
    assert "email" in data
    assert data["role"] == "USER"


def test_refresh_token(client: TestClient, user_token: str):
    # Login gives us refresh_token; we need it
    email = f"refresh_{uuid.uuid4().hex[:8]}@example.com"
    reg = client.post(
        "/api/v1/auth/register",
        json={"name": "Refresh User", "email": email, "password": "RefreshPass123!"},
    )
    refresh = reg.json()["refresh_token"]
    r = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh})
    assert r.status_code == 200
    assert "access_token" in r.json()


# ----- Medicines -----
def test_medicines_list(client: TestClient, user_token: str):
    r = client.get("/api/v1/medicines", headers=_headers(user_token))
    assert r.status_code == 200
    data = r.json()
    assert "items" in data
    assert "total" in data


def test_medicines_admin_create_and_list(client: TestClient, admin_token: str, user_token: str):
    name = f"Test Medicine {uuid.uuid4().hex[:8]}"
    r = client.post(
        "/api/v1/medicines",
        headers=_headers(admin_token),
        json={
            "name": name,
            "description": "For testing",
            "price": 10.5,
            "quantity": 100,
            "category": "General",
        },
    )
    assert r.status_code in (200, 201)
    med = r.json()
    med_id = med["id"]

    r2 = client.get(
        "/api/v1/medicines",
        headers=_headers(user_token),
        params={"q": name},
    )
    assert r2.status_code == 200
    items = r2.json()["items"]
    ids = [str(m["id"]) for m in items]
    assert str(med_id) in ids, f"Created medicine {med_id} not in search results"

    r3 = client.get(f"/api/v1/medicines/{med_id}", headers=_headers(user_token))
    assert r3.status_code == 200
    assert r3.json()["name"] == name


# ----- Cart -----
def test_cart_add_get_delete(client: TestClient, user_token: str, admin_token: str):
    # Create medicine as admin (unique name)
    name = f"Cart Test Med {uuid.uuid4().hex[:8]}"
    cr = client.post(
        "/api/v1/medicines",
        headers=_headers(admin_token),
        json={
            "name": name,
            "price": 5.0,
            "quantity": 50,
            "category": "General",
        },
    )
    assert cr.status_code in (200, 201)
    med_id = cr.json()["id"]

    # Add to cart
    ar = client.post(
        "/api/v1/cart/add",
        headers=_headers(user_token),
        json={"medicine_id": med_id, "quantity": 2},
    )
    assert ar.status_code == 201

    # Get cart
    gr = client.get("/api/v1/cart", headers=_headers(user_token))
    assert gr.status_code == 200
    items = gr.json()["items"]
    assert len(items) >= 1
    item_id = items[0]["id"]

    # Delete from cart
    dr = client.delete(f"/api/v1/cart/{item_id}", headers=_headers(user_token))
    assert dr.status_code == 200


# ----- Orders -----
def test_orders_create_from_cart(client: TestClient, user_token: str, admin_token: str):
    # Create medicine and add to cart (unique name)
    name = f"Order Test Med {uuid.uuid4().hex[:8]}"
    cr = client.post(
        "/api/v1/medicines",
        headers=_headers(admin_token),
        json={
            "name": name,
            "price": 15.0,
            "quantity": 20,
            "category": "General",
        },
    )
    assert cr.status_code in (200, 201)
    med_id = cr.json()["id"]

    client.post(
        "/api/v1/cart/add",
        headers=_headers(user_token),
        json={"medicine_id": med_id, "quantity": 1},
    )

    r = client.post("/api/v1/orders/create-from-cart", headers=_headers(user_token))
    assert r.status_code in (200, 201)
    data = r.json()
    assert "id" in data
    assert data["total_amount"] == 15.0
    assert "items" in data

    r2 = client.get("/api/v1/orders/my", headers=_headers(user_token))
    assert r2.status_code == 200
    assert r2.json()["total"] >= 1


# ----- Notifications -----
def test_notifications_list(client: TestClient, user_token: str):
    r = client.get("/api/v1/notifications", headers=_headers(user_token))
    assert r.status_code == 200
    data = r.json()
    assert "items" in data
    assert "total" in data


# ----- Prescriptions -----
def test_prescriptions_create_and_get(client: TestClient, user_token: str):
    r = client.post(
        "/api/v1/prescriptions",
        headers=_headers(user_token),
        json={
            "patient_name": "John Doe",
            "doctor_name": "Dr. Smith",
            "prescription_text": "Take 2 tablets daily",
            "extra_data": None,
        },
    )
    assert r.status_code == 201
    pres = r.json()
    pres_id = pres["id"]

    r2 = client.get(f"/api/v1/prescriptions/{pres_id}", headers=_headers(user_token))
    assert r2.status_code == 200
    assert r2.json()["patient_name"] == "John Doe"


# ----- Refill Alerts -----
def test_refill_alerts_crud(client: TestClient, user_token: str, admin_token: str):
    # Create medicine first (unique name)
    name = f"Refill Test Med {uuid.uuid4().hex[:8]}"
    cr = client.post(
        "/api/v1/medicines",
        headers=_headers(admin_token),
        json={
            "name": name,
            "price": 8.0,
            "quantity": 30,
            "category": "General",
        },
    )
    assert cr.status_code in (200, 201)
    med_id = cr.json()["id"]

    r = client.post(
        "/api/v1/refill-alerts",
        headers=_headers(user_token),
        json={
            "medicine_id": med_id,
            "last_purchase_date": "2025-02-01",
            "suggested_refill_date": "2025-03-01",
        },
    )
    assert r.status_code == 201
    alert = r.json()
    alert_id = alert["id"]
    assert alert["medicine_name"] == name
    assert "is_due" in alert

    r2 = client.get("/api/v1/refill-alerts", headers=_headers(user_token))
    assert r2.status_code == 200
    assert r2.json()["total"] >= 1

    r3 = client.patch(
        f"/api/v1/refill-alerts/{alert_id}/complete",
        headers=_headers(user_token),
    )
    assert r3.status_code == 200
    assert r3.json()["is_completed"] is True

    r4 = client.delete(f"/api/v1/refill-alerts/{alert_id}", headers=_headers(user_token))
    assert r4.status_code == 204


# ----- Analytics (Admin only) -----
def test_analytics_admin_only(client: TestClient, user_token: str, admin_token: str):
    r_user = client.get("/api/v1/analytics/summary", headers=_headers(user_token))
    assert r_user.status_code == 403

    r_admin = client.get("/api/v1/analytics/summary", headers=_headers(admin_token))
    assert r_admin.status_code == 200
    data = r_admin.json()
    assert "total_orders" in data
    assert "total_revenue" in data
    assert "total_users" in data
    assert "low_stock_medicines_count" in data
    assert "orders_by_status" in data
    assert "top_medicines" in data


# ----- AI Chat: Sessions -----
def test_ai_chat_sessions_crud(client: TestClient, user_token: str):
    """Test chat sessions: list, create, update, delete."""
    # List (may be empty)
    r = client.get("/api/v1/ai-chat/sessions", headers=_headers(user_token))
    assert r.status_code == 200
    data = r.json()
    assert "sessions" in data
    initial_count = len(data["sessions"])

    # Create session
    session_id = f"s_test_{uuid.uuid4().hex[:12]}"
    r2 = client.post(
        "/api/v1/ai-chat/sessions",
        headers=_headers(user_token),
        json={"id": session_id, "title": "Test chat", "messages": []},
    )
    assert r2.status_code == 200
    sess = r2.json()
    assert sess["id"] == session_id
    assert sess["title"] == "Test chat"

    # List again - should have one more
    r3 = client.get("/api/v1/ai-chat/sessions", headers=_headers(user_token))
    assert r3.status_code == 200
    assert len(r3.json()["sessions"]) >= initial_count + 1

    # Update session
    r4 = client.patch(
        f"/api/v1/ai-chat/sessions/{session_id}",
        headers=_headers(user_token),
        json={"title": "Updated title", "messages": [{"role": "user", "content": "hi"}]},
    )
    assert r4.status_code == 200
    assert r4.json()["title"] == "Updated title"
    assert len(r4.json()["messages"]) == 1

    # Delete session
    r5 = client.delete(f"/api/v1/ai-chat/sessions/{session_id}", headers=_headers(user_token))
    assert r5.status_code == 200


# ----- AI Chat: Unified chat + DB storage -----
def test_ai_chat_unified_saves_to_db(client: TestClient, user_token: str):
    """
    Test unified-chat saves to DB in separate tables.
    - Symptom message -> general_talk_chat_history
    - Order message -> order_medicine_ai_chat_history
    """
    from app.models.chat_history import GeneralTalkChatHistory, OrderMedicineAiChatHistory
    from app.db.session import SessionLocal
    from app.models.user import User

    # Get user_id for DB query
    db = SessionLocal()
    try:
        me = client.get("/api/v1/auth/me", headers=_headers(user_token))
        assert me.status_code == 200
        email = me.json()["email"]
        user = db.query(User).filter(User.email == email).first()
        assert user is not None
        user_id = user.id

        # Count rows before
        gt_before = db.query(GeneralTalkChatHistory).filter(GeneralTalkChatHistory.user_id == user_id).count()
        om_before = db.query(OrderMedicineAiChatHistory).filter(OrderMedicineAiChatHistory.user_id == user_id).count()

        session_id = f"s_db_{uuid.uuid4().hex[:12]}"

        # 1. Symptom message -> should save to general_talk_chat_history
        r1 = client.post(
            "/api/v1/ai-chat/unified-chat",
            headers=_headers(user_token),
            json={
                "message": "I have headache",
                "session_id": session_id,
                "history": [],
            },
            timeout=30,
        )
        assert r1.status_code == 200
        data1 = r1.json()
        assert "response" in data1
        assert data1.get("intent") == "symptom"

        db.commit()
        gt_after = db.query(GeneralTalkChatHistory).filter(GeneralTalkChatHistory.user_id == user_id).count()
        assert gt_after >= gt_before + 1, "Symptom chat should save to general_talk_chat_history"

        # Verify chat_session_id is stored
        last_gt = (
            db.query(GeneralTalkChatHistory)
            .filter(GeneralTalkChatHistory.user_id == user_id)
            .order_by(GeneralTalkChatHistory.created_at.desc())
            .first()
        )
        assert last_gt is not None
        assert last_gt.chat_session_id == session_id
        assert last_gt.user_message == "I have headache"

        # 2. Order message -> should save to order_medicine_ai_chat_history
        r2 = client.post(
            "/api/v1/ai-chat/unified-chat",
            headers=_headers(user_token),
            json={
                "message": "order paracetamol",
                "session_id": session_id,
                "history": [],
            },
            timeout=30,
        )
        assert r2.status_code == 200
        data2 = r2.json()
        assert "response" in data2
        assert data2.get("intent") in ("order", "order_medicine", "stock_inquiry")

        db.commit()
        om_after = db.query(OrderMedicineAiChatHistory).filter(OrderMedicineAiChatHistory.user_id == user_id).count()
        assert om_after >= om_before + 1, "Order chat should save to order_medicine_ai_chat_history"

        last_om = (
            db.query(OrderMedicineAiChatHistory)
            .filter(OrderMedicineAiChatHistory.user_id == user_id)
            .order_by(OrderMedicineAiChatHistory.created_at.desc())
            .first()
        )
        assert last_om is not None
        assert last_om.chat_session_id == session_id
        assert "paracetamol" in last_om.user_message.lower()
    finally:
        db.close()


def test_ai_chat_medicines_autocomplete(client: TestClient, user_token: str):
    """Test medicines autocomplete for chat."""
    r = client.get("/api/v1/ai-chat/medicines", headers=_headers(user_token))
    assert r.status_code == 200
    data = r.json()
    assert "medicine_list" in data
    assert isinstance(data["medicine_list"], list)


# ----- Root -----
def test_root_returns_links(client: TestClient):
    r = client.get("/")
    assert r.status_code == 200
    data = r.json()
    assert "docs" in data
    assert "health" in data
