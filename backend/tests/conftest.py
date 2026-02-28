import os

import pytest
from fastapi.testclient import TestClient

# Use psycopg (v3) URL; override before app import so tests use it
os.environ.setdefault(
    "DATABASE_URL",
    "postgresql+psycopg://postgres:postgres@localhost:5432/sentinelrx",
)

from app.main import app


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)
