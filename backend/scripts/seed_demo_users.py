"""Create demo users for testing. Run from backend dir: python scripts/seed_demo_users.py"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.user import User, UserRole

DEMO_USERS = [
    {"email": "admin@example.com", "password": "AdminPass123!", "name": "Admin User", "role": UserRole.ADMIN},
    {"email": "user@sentinelrx.ai", "password": "User1234", "name": "Demo User", "role": UserRole.USER},
]


def main() -> None:
    db = SessionLocal()
    try:
        for u in DEMO_USERS:
            existing = db.query(User).filter(User.email == u["email"]).first()
            if existing:
                print(f"User exists: {u['email']}")
            else:
                db.add(
                    User(
                        name=u["name"],
                        email=u["email"],
                        password_hash=hash_password(u["password"]),
                        role=u["role"],
                        is_active=True,
                    )
                )
                db.commit()
                print(f"Created: {u['email']} / {u['password']} ({u['role'].value})")
    finally:
        db.close()


if __name__ == "__main__":
    main()
