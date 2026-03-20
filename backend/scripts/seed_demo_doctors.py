"""
Seed 10 demo doctor accounts (one per specialization shown in Find a Doctor page).
Also updates the existing Dr. Ayush Sharma profile to General Physician.
Run with:
  $env:DATABASE_URL="<neon_url>" ; py scripts/seed_demo_doctors.py
"""
import os, sys, uuid
from datetime import datetime
import psycopg
import bcrypt

PG_URL = os.environ.get("DATABASE_URL", "").replace("postgresql+psycopg://", "postgresql://")
if not PG_URL:
    print("ERROR: DATABASE_URL not set"); sys.exit(1)

DOCTORS = [
    {
        "name": "Dr. Ayush Sharma",
        "email": "doctor@sentinelrx.ai",        # existing demo account — update profile
        "password": None,                        # skip — already exists
        "specialization": "General Physician",
        "license_no": "MH-12345",
        "hospital_name": "City Medical Center",
        "hospital_address": "Near Civil Hospital, Nashik - 422001",
        "fee": 300.0, "exp": 5, "rating": 4.5, "reviews": 12,
        "bio": "Experienced general physician with 5 years in primary care and preventive medicine.",
        "languages": "English,Hindi",
        "days": "Mon,Tue,Wed,Thu,Fri",
        "available": True,
    },
    {
        "name": "Dr. Priya Mehta",
        "email": "dr.cardiologist@sentinelrx.ai",
        "password": "Doctor@123",
        "specialization": "Cardiologist",
        "license_no": "MH-22301",
        "hospital_name": "Heart Care Hospital",
        "hospital_address": "Baner Road, Pune - 411045",
        "fee": 700.0, "exp": 10, "rating": 4.8, "reviews": 48,
        "bio": "Specialist in interventional cardiology and heart failure management with 10 years of experience.",
        "languages": "English,Hindi,Marathi",
        "days": "Mon,Wed,Fri,Sat",
        "available": True,
    },
    {
        "name": "Dr. Sneha Kapoor",
        "email": "dr.dermatologist@sentinelrx.ai",
        "password": "Doctor@123",
        "specialization": "Dermatologist",
        "license_no": "DL-33412",
        "hospital_name": "Skin & Care Clinic",
        "hospital_address": "Koregaon Park, Pune - 411001",
        "fee": 500.0, "exp": 7, "rating": 4.6, "reviews": 35,
        "bio": "Dermatologist specializing in acne, pigmentation, skin allergies, and cosmetic dermatology.",
        "languages": "English,Hindi",
        "days": "Tue,Thu,Sat",
        "available": True,
    },
    {
        "name": "Dr. Rajesh Nair",
        "email": "dr.pediatrician@sentinelrx.ai",
        "password": "Doctor@123",
        "specialization": "Pediatrician",
        "license_no": "KL-44523",
        "hospital_name": "Kids Health Centre",
        "hospital_address": "MG Road, Nashik - 422001",
        "fee": 400.0, "exp": 8, "rating": 4.7, "reviews": 62,
        "bio": "Caring pediatrician with expertise in child nutrition, vaccinations, and developmental pediatrics.",
        "languages": "English,Hindi,Malayalam",
        "days": "Mon,Tue,Wed,Thu,Fri",
        "available": True,
    },
    {
        "name": "Dr. Vikram Singh",
        "email": "dr.orthopedic@sentinelrx.ai",
        "password": "Doctor@123",
        "specialization": "Orthopedic",
        "license_no": "UP-55634",
        "hospital_name": "Bone & Joint Clinic",
        "hospital_address": "Hadapsar, Pune - 411028",
        "fee": 600.0, "exp": 12, "rating": 4.9, "reviews": 73,
        "bio": "Senior orthopedic surgeon specializing in joint replacement, sports injuries, and spine surgery.",
        "languages": "English,Hindi",
        "days": "Mon,Wed,Thu,Sat",
        "available": True,
    },
    {
        "name": "Dr. Anita Desai",
        "email": "dr.neurologist@sentinelrx.ai",
        "password": "Doctor@123",
        "specialization": "Neurologist",
        "license_no": "GJ-66745",
        "hospital_name": "NeuroLife Hospital",
        "hospital_address": "Navrangpura, Ahmedabad - 380009",
        "fee": 800.0, "exp": 15, "rating": 4.8, "reviews": 55,
        "bio": "Neurologist with expertise in epilepsy, stroke, migraine, and neurodegenerative diseases.",
        "languages": "English,Hindi,Gujarati",
        "days": "Tue,Thu,Fri,Sat",
        "available": True,
    },
    {
        "name": "Dr. Meena Joshi",
        "email": "dr.gynecologist@sentinelrx.ai",
        "password": "Doctor@123",
        "specialization": "Gynecologist",
        "license_no": "MH-77856",
        "hospital_name": "Women Wellness Centre",
        "hospital_address": "Deccan Gymkhana, Pune - 411004",
        "fee": 550.0, "exp": 9, "rating": 4.7, "reviews": 89,
        "bio": "Gynecologist and obstetrician specializing in high-risk pregnancy, PCOS, and laparoscopic surgeries.",
        "languages": "English,Hindi,Marathi",
        "days": "Mon,Tue,Thu,Fri",
        "available": True,
    },
    {
        "name": "Dr. Suresh Pillai",
        "email": "dr.ophthalmologist@sentinelrx.ai",
        "password": "Doctor@123",
        "specialization": "Ophthalmologist",
        "license_no": "KL-88967",
        "hospital_name": "Clear Vision Eye Care",
        "hospital_address": "Pimpri, Pune - 411017",
        "fee": 450.0, "exp": 11, "rating": 4.6, "reviews": 41,
        "bio": "Ophthalmologist specializing in cataract surgery, LASIK, retinal disorders, and glaucoma management.",
        "languages": "English,Hindi,Malayalam",
        "days": "Mon,Wed,Fri",
        "available": True,
    },
    {
        "name": "Dr. Farhan Khan",
        "email": "dr.ent@sentinelrx.ai",
        "password": "Doctor@123",
        "specialization": "ENT",
        "license_no": "MH-99078",
        "hospital_name": "ENT Speciality Clinic",
        "hospital_address": "Camp Area, Pune - 411001",
        "fee": 400.0, "exp": 6, "rating": 4.5, "reviews": 28,
        "bio": "ENT specialist with expertise in sinusitis, hearing disorders, tonsil surgeries, and voice disorders.",
        "languages": "English,Hindi,Urdu",
        "days": "Tue,Wed,Thu,Sat",
        "available": True,
    },
    {
        "name": "Dr. Lakshmi Rao",
        "email": "dr.psychiatrist@sentinelrx.ai",
        "password": "Doctor@123",
        "specialization": "Psychiatrist",
        "license_no": "AP-10189",
        "hospital_name": "Mind & Soul Wellness",
        "hospital_address": "Viman Nagar, Pune - 411014",
        "fee": 600.0, "exp": 8, "rating": 4.7, "reviews": 34,
        "bio": "Psychiatrist specializing in anxiety, depression, OCD, bipolar disorder, and addiction counselling.",
        "languages": "English,Hindi,Telugu",
        "days": "Mon,Tue,Thu,Fri,Sat",
        "available": True,
    },
]

def hash_pw(pw):
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt(rounds=12)).decode()

with psycopg.connect(PG_URL) as conn:
    conn.autocommit = False

    with conn.cursor() as cur:
        for d in DOCTORS:
            # ── Get or create user ──────────────────────────────────────────
            cur.execute("SELECT id FROM users WHERE email = %s", (d["email"],))
            row = cur.fetchone()

            if row:
                user_id = str(row[0])
                print(f"  User exists : {d['email']}")
            else:
                user_id = str(uuid.uuid4())
                pw_hash = hash_pw(d["password"])
                cur.execute("""
                    INSERT INTO users
                        (id, name, email, password_hash, role, is_active, created_at, preferred_language)
                    VALUES
                        (%s::UUID, %s, %s, %s, 'DOCTOR'::user_role, true, %s, 'en')
                """, (user_id, d["name"], d["email"], pw_hash, datetime.utcnow()))
                print(f"  User created: {d['email']}")

            # ── Upsert doctor_profile ───────────────────────────────────────
            cur.execute("SELECT id FROM doctor_profiles WHERE user_id = %s::UUID", (user_id,))
            prof = cur.fetchone()

            if prof:
                cur.execute("""
                    UPDATE doctor_profiles SET
                        specialization=%s, license_no=%s, hospital_name=%s, hospital_address=%s,
                        consultation_fee=%s, experience_years=%s, bio=%s, languages=%s,
                        available_days=%s, is_available=%s, rating=%s, total_reviews=%s,
                        updated_at=%s
                    WHERE user_id = %s::UUID
                """, (
                    d["specialization"], d["license_no"], d["hospital_name"], d["hospital_address"],
                    d["fee"], d["exp"], d["bio"], d["languages"],
                    d["days"], d["available"], d["rating"], d["reviews"],
                    datetime.utcnow(), user_id
                ))
                print(f"    Profile updated: {d['specialization']}")
            else:
                cur.execute("""
                    INSERT INTO doctor_profiles
                        (id, user_id, specialization, license_no, hospital_name, hospital_address,
                         consultation_fee, experience_years, bio, languages, available_days,
                         slot_duration_minutes, is_available, rating, total_reviews, created_at, updated_at)
                    VALUES
                        (%s::UUID, %s::UUID, %s, %s, %s, %s, %s, %s, %s, %s, %s, 30, %s, %s, %s, %s, %s)
                """, (
                    str(uuid.uuid4()), user_id,
                    d["specialization"], d["license_no"], d["hospital_name"], d["hospital_address"],
                    d["fee"], d["exp"], d["bio"], d["languages"], d["days"],
                    d["available"], d["rating"], d["reviews"],
                    datetime.utcnow(), datetime.utcnow()
                ))
                print(f"    Profile created: {d['specialization']}")

        conn.commit()

print()
print("=" * 55)
print("  All 10 demo doctors seeded on Neon DB")
print("=" * 55)
print()
print("  Specializations available:")
for d in DOCTORS:
    mark = "(existing account)" if d["password"] is None else ""
    print(f"    {d['specialization']:<25} {d['name']} {mark}")
print()
print("  All new doctor logins use password: Doctor@123")
