"""
Inspect the Neon cloud DB: list all tables, enum values, and row counts.
Run with:  $env:DATABASE_URL="<neon_url>" ; py scripts/inspect_neon_db.py
"""
import os, sys
import psycopg

RAW_URL = os.environ.get("DATABASE_URL", "")
PG_URL = RAW_URL.replace("postgresql+psycopg://", "postgresql://")
if not PG_URL:
    print("ERROR: DATABASE_URL not set"); sys.exit(1)

with psycopg.connect(PG_URL) as conn:
    with conn.cursor() as cur:

        # ── All tables ────────────────────────────────────────────────────
        cur.execute("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename")
        tables = [r[0] for r in cur.fetchall()]
        print("=" * 50)
        print("  TABLES IN NEON DB")
        print("=" * 50)
        for t in tables:
            print(f"  - {t}")

        # ── Enum values ───────────────────────────────────────────────────
        cur.execute("""
            SELECT t.typname, enumlabel
            FROM pg_enum e
            JOIN pg_type t ON e.enumtypid = t.oid
            WHERE t.typname IN ('user_role','order_status','appointment_status','notification_type')
            ORDER BY t.typname, enumsortorder
        """)
        rows = cur.fetchall()
        print()
        print("=" * 50)
        print("  ENUM VALUES")
        print("=" * 50)
        current_type = None
        for type_name, label in rows:
            if type_name != current_type:
                current_type = type_name
                print(f"  [{type_name}]")
            print(f"    - {label}")

        # ── Row counts ────────────────────────────────────────────────────
        key_tables = [
            "users", "doctor_profiles", "appointments", "doctor_prescriptions",
            "hospital_beds", "hospital_admissions", "ngo_beneficiaries",
            "ngo_blood_camps", "ngo_donations", "notifications",
            "medicines", "orders", "cart_items", "contact_messages",
        ]
        print()
        print("=" * 50)
        print("  ROW COUNTS")
        print("=" * 50)
        for tbl in key_tables:
            if tbl in tables:
                cur.execute(f"SELECT COUNT(*) FROM {tbl}")
                count = cur.fetchone()[0]
                print(f"  {tbl:<30} {count:>5} rows")
            else:
                print(f"  {tbl:<30}  *** TABLE NOT FOUND ***")

print()
print("Inspection complete.")
