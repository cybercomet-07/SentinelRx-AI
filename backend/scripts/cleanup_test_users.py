"""Clean up test users, keep only Parth Kulkarni. Run from backend: python scripts/cleanup_test_users.py"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from sqlalchemy import func
from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.user import User, UserRole

KEEP_NAME = "Parth Kulkarni"
# If user doesn't exist, create with these credentials
DEFAULT_EMAIL = "parth@sentinelrx.com"
DEFAULT_PASSWORD = "Parth@123"


def main() -> None:
    db = SessionLocal()
    try:
        keeper = db.query(User).filter(func.lower(User.name) == KEEP_NAME.lower()).first()
        if not keeper:
            keeper = User(
                name=KEEP_NAME,
                email=DEFAULT_EMAIL,
                password_hash=hash_password(DEFAULT_PASSWORD),
                role=UserRole.ADMIN,
                is_active=True,
            )
            db.add(keeper)
            db.flush()
            print(f"Created user: {KEEP_NAME} ({DEFAULT_EMAIL})")

        deleted = db.query(User).filter(User.id != keeper.id).delete()
        db.commit()
        print(f"Kept: {keeper.name} ({keeper.email})")
        print(f"Deleted: {deleted} test users")
    finally:
        db.close()


if __name__ == "__main__":
    main()
