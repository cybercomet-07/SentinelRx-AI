"""Check appointment enums and seed a demo doctor profile."""
import os, sys, uuid
import psycopg
from datetime import datetime

RAW_URL = os.environ.get("DATABASE_URL", "")
PG_URL = RAW_URL.replace("postgresql+psycopg://", "postgresql://")
if not PG_URL:
    print("ERROR: DATABASE_URL not set"); sys.exit(1)

with psycopg.connect(PG_URL) as conn:
    with conn.cursor() as cur:

        # 1. Check appointment_status enum
        cur.execute("""
            SELECT enumlabel FROM pg_enum e
            JOIN pg_type t ON e.enumtypid = t.oid
            WHERE t.typname = 'appointmentstatus'
            ORDER BY enumsortorder
        """)
        rows = cur.fetchall()
        print("appointmentstatus enum in DB:", [r[0] for r in rows] if rows else "NOT A DB ENUM (Python only)")

        # 2. Check appointmenttype enum
        cur.execute("""
            SELECT enumlabel FROM pg_enum e
            JOIN pg_type t ON e.enumtypid = t.oid
            WHERE t.typname = 'appointmenttype'
            ORDER BY enumsortorder
        """)
        rows2 = cur.fetchall()
        print("appointmenttype enum in DB:", [r[0] for r in rows2] if rows2 else "NOT A DB ENUM (Python only)")

        # 3. Check appointments table columns
        cur.execute("""
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = 'appointments'
            ORDER BY ordinal_position
        """)
        print("\nappointments table columns:")
        for col, dtype in cur.fetchall():
            print(f"  {col:<30} {dtype}")

        # 4. Check if demo doctor already has a doctor_profile
        cur.execute("SELECT id FROM users WHERE email = 'doctor@sentinelrx.ai'")
        doc_row = cur.fetchone()
        if doc_row:
            doc_user_id = doc_row[0]
            cur.execute("SELECT id FROM doctor_profiles WHERE user_id = %s", (doc_user_id,))
            prof = cur.fetchone()
            print(f"\ndoctor_profile for demo doctor: {'EXISTS' if prof else 'MISSING'}")
        else:
            print("\nDemo doctor user not found")
            doc_user_id = None

    # 5. Seed demo doctor profile if missing
    if doc_user_id:
        conn.autocommit = False
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM doctor_profiles WHERE user_id = %s", (str(doc_user_id),))
            if not cur.fetchone():
                cur.execute("""
                    INSERT INTO doctor_profiles
                        (id, user_id, specialization, license_no, hospital_name, hospital_address,
                         consultation_fee, experience_years, bio, languages, available_days,
                         slot_duration_minutes, is_available, rating, total_reviews, created_at, updated_at)
                    VALUES
                        (%s::UUID, %s::UUID, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    str(uuid.uuid4()), str(doc_user_id),
                    "General Medicine", "MH-12345",
                    "City Medical Center", "Near Civil Hospital, Nashik - 422001",
                    300.0, 5,
                    "Experienced general physician with 5 years in primary care and preventive medicine.",
                    "English,Hindi", "Mon,Tue,Wed,Thu,Fri",
                    30, True, 4.5, 12,
                    datetime.utcnow(), datetime.utcnow()
                ))
                conn.commit()
                print("  -> Demo doctor profile CREATED")
            else:
                print("  -> Already exists, skipped")

print("\nDone.")
