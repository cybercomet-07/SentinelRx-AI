"""Seed a demo doctor_profile for doctor@sentinelrx.ai so Find a Doctor page shows results."""
import os, sys, uuid
from datetime import datetime
import psycopg

PG_URL = os.environ.get("DATABASE_URL", "").replace("postgresql+psycopg://", "postgresql://")
if not PG_URL:
    print("ERROR: DATABASE_URL not set"); sys.exit(1)

with psycopg.connect(PG_URL) as conn:
    with conn.cursor() as cur:
        cur.execute("SELECT id FROM users WHERE email = 'doctor@sentinelrx.ai'")
        row = cur.fetchone()
        if not row:
            print("Demo doctor user not found. Run fix_neon_enums.py first."); sys.exit(1)
        doc_user_id = str(row[0])

        cur.execute("SELECT id FROM doctor_profiles WHERE user_id = %s::UUID", (doc_user_id,))
        if cur.fetchone():
            print("Doctor profile already exists — nothing to do.")
            sys.exit(0)

        cur.execute("""
            INSERT INTO doctor_profiles
                (id, user_id, specialization, license_no, hospital_name, hospital_address,
                 consultation_fee, experience_years, bio, languages, available_days,
                 slot_duration_minutes, is_available, rating, total_reviews, created_at, updated_at)
            VALUES
                (%s::UUID, %s::UUID, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            str(uuid.uuid4()), doc_user_id,
            "General Medicine", "MH-12345",
            "City Medical Center", "Near Civil Hospital, Nashik - 422001",
            300.0, 5,
            "Experienced general physician with 5 years in primary care and preventive medicine.",
            "English,Hindi", "Mon,Tue,Wed,Thu,Fri",
            30, True, 4.5, 12,
            datetime.utcnow(), datetime.utcnow()
        ))
        conn.commit()
        print("Demo doctor profile created successfully.")
        print("  Name        : Dr. Ayush Sharma")
        print("  Specialization: General Medicine")
        print("  Hospital    : City Medical Center, Nashik")
        print("  Fee         : ₹300")
        print("  Rating      : 4.5 / 5")
