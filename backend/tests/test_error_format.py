def test_http_exception_returns_consistent_error_format(client):
    # Protected endpoint without token returns 401 via our handler
    response = client.get("/api/v1/medicines")
    assert response.status_code == 401
    data = response.json()
    assert "error" in data
    assert "code" in data["error"]
    assert "message" in data["error"]


def test_validation_error_returns_consistent_format(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "not-an-email", "password": "short"},
    )
    assert response.status_code == 422
    data = response.json()
    assert "error" in data
    assert data["error"]["code"] == "VALIDATION_ERROR"
    assert "message" in data["error"]
