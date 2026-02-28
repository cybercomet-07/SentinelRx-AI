"""Create an ADMIN user for testing. Run from backend dir: python scripts/create_admin.py"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.user import User, UserRole

EMAIL = "admin@example.com"
PASSWORD = "AdminPass123!"
NAME = "Admin User"


def main() -> None:
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == EMAIL).first()
        if existing:
            if existing.role == UserRole.ADMIN:
                print(f"Admin already exists: {EMAIL}")
            else:
                existing.role = UserRole.ADMIN
                db.commit()
                print(f"Updated {EMAIL} to ADMIN")
        else:
            db.add(
                User(
                    name=NAME,
                    email=EMAIL,
                    password_hash=hash_password(PASSWORD),
                    role=UserRole.ADMIN,
                    is_active=True,
                )
            )
            db.commit()
            print(f"Created admin: {EMAIL} / {PASSWORD}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
