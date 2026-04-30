"""
Seed one demo account for each role.
Run: py scripts/seed_demo_roles.py
Credentials will be printed to console.
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.user import User, UserRole
from sqlalchemy import func

DEMO_USERS = [
    {
        "name": "Parth (Patient)",
        "email": "patient@sentinelrx.ai",
        "password": "Patient@123",
        "role": UserRole.USER,
        "phone": "9000000001",
        "address": "123 Patient Street, Pune",
        "landmark": "Near City Hospital",
        "pin_code": "411001",
    },
    {
        "name": "Super Admin",
        "email": "admin@sentinelrx.ai",
        "password": "Admin@123",
        "role": UserRole.ADMIN,
        "phone": "9000000002",
        "address": "SentinelRx HQ, Mumbai",
        "landmark": "BKC Tower",
        "pin_code": "400051",
    },
    {
        "name": "Dr. Ayush Sharma",
        "email": "doctor@sentinelrx.ai",
        "password": "Doctor@123",
        "role": UserRole.DOCTOR,
        "phone": "9000000003",
        "address": "City Medical Center, Nashik",
        "landmark": "Near Civil Hospital",
        "pin_code": "422001",
    },
    {
        "name": "Sunrise Hospital Admin",
        "email": "hospital@sentinelrx.ai",
        "password": "Hospital@123",
        "role": UserRole.HOSPITAL_ADMIN,
        "phone": "9000000004",
        "address": "Sunrise Hospital, Aurangabad",
        "landmark": "MIDC Road",
        "pin_code": "431001",
    },
    {
        "name": "Seva NGO",
        "email": "ngo@sentinelrx.ai",
        "password": "NGO@1234",
        "role": UserRole.NGO,
        "phone": "9000000005",
        "address": "Seva Bhavan, Nagpur",
        "landmark": "Gandhi Chowk",
        "pin_code": "440001",
    },
]


def main():
    db = SessionLocal()
    try:
        print("\n" + "="*55)
        print("  DEMO LOGIN CREDENTIALS")
        print("="*55)
        for u in DEMO_USERS:
            existing = db.query(User).filter(func.lower(User.email) == u["email"].lower()).first()
            if existing:
                existing.role = u["role"]
                existing.password_hash = hash_password(u["password"])
                db.commit()
                status = "Updated"
            else:
                db.add(User(
                    name=u["name"],
                    email=u["email"],
                    password_hash=hash_password(u["password"]),
                    role=u["role"],
                    is_active=True,
                    phone=u["phone"],
                    address=u["address"],
                    landmark=u["landmark"],
                    pin_code=u["pin_code"],
                ))
                db.commit()
                status = "Created"

            role_label = u["role"].value.replace("_", " ").title()
            print(f"\n  [{role_label}] {status}")
            print(f"  Email    : {u['email']}")
            print(f"  Password : {u['password']}")
        print("\n" + "="*55 + "\n")
    finally:
        db.close()


if __name__ == "__main__":
    main()
