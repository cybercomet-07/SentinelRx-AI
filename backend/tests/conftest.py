import os
from pathlib import Path

import pytest
from dotenv import load_dotenv
from fastapi.testclient import TestClient

# Load .env so DATABASE_URL and other vars are available; allow all logins for tests
_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(_env_path)
os.environ["ALLOW_ALL_LOGINS"] = "true"

from app.main import app


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)
