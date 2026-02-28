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


# ----- Root -----
def test_root_returns_links(client: TestClient):
    r = client.get("/")
    assert r.status_code == 200
    data = r.json()
    assert "docs" in data
    assert "health" in data
