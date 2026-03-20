"""
One-time script: Add DOCTOR, HOSPITAL_ADMIN, NGO to the user_role enum on Neon,
then seed all 5 demo accounts.
Run with:
  $env:DATABASE_URL="<neon_url>" ; py scripts/fix_neon_enums.py
"""
import os, uuid, sys
from datetime import datetime
import psycopg
import bcrypt

RAW_URL = os.environ.get("DATABASE_URL", "")
# psycopg3 needs plain postgresql:// (not +psycopg)
PG_URL = RAW_URL.replace("postgresql+psycopg://", "postgresql://")

if not PG_URL:
    print("ERROR: DATABASE_URL not set"); sys.exit(1)

print("Connecting to Neon...")

DEMO_USERS = [
    {"name": "Parth (Patient)",       "email": "patient@sentinelrx.ai",  "password": "Patient@123",  "role": "USER"},
    {"name": "Admin User",             "email": "admin@sentinelrx.ai",    "password": "Admin@123",    "role": "ADMIN"},
    {"name": "Dr. Ayush Sharma",       "email": "doctor@sentinelrx.ai",   "password": "Doctor@123",   "role": "DOCTOR"},
    {"name": "Hospital Admin",         "email": "hospital@sentinelrx.ai", "password": "Hospital@123", "role": "HOSPITAL_ADMIN"},
    {"name": "NGO Coordinator",        "email": "ngo@sentinelrx.ai",      "password": "NGO@1234",     "role": "NGO"},
]

with psycopg.connect(PG_URL) as conn:
    conn.autocommit = True
    with conn.cursor() as cur:

        # ── Step 1: Check & add missing enum values ────────────────────────
        cur.execute("""
            SELECT enumlabel FROM pg_enum e
            JOIN pg_type t ON e.enumtypid = t.oid
            WHERE t.typname = 'user_role'
            ORDER BY enumsortorder
        """)
        existing = [r[0] for r in cur.fetchall()]
        print(f"Existing user_role enum values: {existing}")

        for val in ["DOCTOR", "HOSPITAL_ADMIN", "NGO"]:
            if val not in existing:
                cur.execute(f"ALTER TYPE user_role ADD VALUE IF NOT EXISTS '{val}'")
                print(f"  ✓ Added enum value: {val}")
            else:
                print(f"  - Already exists: {val}")

        print()

    # ── Step 2: Seed / upsert demo users ──────────────────────────────────
    # Re-open cursor WITHOUT autocommit for DML
    conn.autocommit = False
    with conn.cursor() as cur:
        for u in DEMO_USERS:
            pw_hash = bcrypt.hashpw(u["password"].encode(), bcrypt.gensalt(rounds=12)).decode()

            # Check if user exists
            cur.execute("SELECT id FROM users WHERE email = %s", (u["email"],))
            row = cur.fetchone()

            if row:
                cur.execute(
                    "UPDATE users SET password_hash=%s, role=%s::user_role, is_active=true WHERE email=%s",
                    (pw_hash, u["role"], u["email"])
                )
                print(f"  Updated: {u['email']}  [{u['role']}]")
            else:
                uid = uuid.uuid4()
                cur.execute("""
                    INSERT INTO users (id, name, email, password_hash, role, is_active, created_at, preferred_language)
                    VALUES (%s::UUID, %s, %s, %s, %s::user_role, true, %s, 'en')
                """, (str(uid), u["name"], u["email"], pw_hash, u["role"], datetime.utcnow()))
                print(f"  Created: {u['email']}  [{u['role']}]")

        conn.commit()

print()
print("=" * 52)
print("  ALL DONE — Demo accounts ready on Neon cloud")
print("=" * 52)
print()
print("  patient@sentinelrx.ai   /  Patient@123")
print("  doctor@sentinelrx.ai    /  Doctor@123")
print("  hospital@sentinelrx.ai  /  Hospital@123")
print("  ngo@sentinelrx.ai       /  NGO@1234")
print("  admin@sentinelrx.ai     /  Admin@123")
print("=" * 52)
