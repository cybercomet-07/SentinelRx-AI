"""
Clean all test/transactional data and seed fresh demo data for all roles.
Run: py scripts/reset_and_seed.py
"""
import sys
import uuid
from pathlib import Path
from datetime import date, datetime, timedelta

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.db.session import SessionLocal
from app.models.user import User, UserRole
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.prescription import Prescription, PrescriptionMedicine
from app.models.notification import Notification
from app.models.chat_session import ChatSession
from app.models.chat_history import OrderMedicineAiChatHistory, GeneralTalkChatHistory, SymptomSuggestionChatHistory
from app.models.refill_alert import RefillAlert
from app.models.contact_message import ContactMessage
from app.models.doctor_profile import DoctorProfile
from app.models.appointment import Appointment
from app.models.hospital import HospitalBed, HospitalAdmission
from app.models.ngo import NGOBeneficiary, NGOBloodCamp, NGODonationDrive


def clean_test_data(db):
    print("\n[1/2] Cleaning transactional test data...")
    db.query(OrderItem).delete()
    db.query(Order).delete()
    db.query(PrescriptionMedicine).delete()
    db.query(Prescription).delete()
    db.query(Notification).delete()
    db.query(OrderMedicineAiChatHistory).delete()
    db.query(GeneralTalkChatHistory).delete()
    db.query(SymptomSuggestionChatHistory).delete()
    db.query(ChatSession).delete()
    db.query(RefillAlert).delete()
    db.query(ContactMessage).delete()
    # Also clean new tables in case of re-seeding
    db.query(Appointment).delete()
    db.query(HospitalAdmission).delete()
    db.query(HospitalBed).delete()
    db.query(NGOBeneficiary).delete()
    db.query(NGOBloodCamp).delete()
    db.query(NGODonationDrive).delete()
    db.query(DoctorProfile).delete()
    db.commit()
    print("  ✅ All transactional data cleared")


def seed_demo_data(db):
    print("\n[2/2] Seeding demo data for all roles...")

    # ── Get demo user IDs ──────────────────────────────────────────────────
    doctor_user = db.query(User).filter(User.email == "doctor@sentinelrx.ai").first()
    patient_user = db.query(User).filter(User.email == "patient@sentinelrx.ai").first()
    hospital_user = db.query(User).filter(User.email == "hospital@sentinelrx.ai").first()
    ngo_user = db.query(User).filter(User.email == "ngo@sentinelrx.ai").first()

    if not all([doctor_user, patient_user, hospital_user, ngo_user]):
        print("  ⚠️  Demo users not found. Run seed_demo_roles.py first.")
        return

    # ── Doctor Profile ─────────────────────────────────────────────────────
    dp = DoctorProfile(
        id=uuid.uuid4(),
        user_id=doctor_user.id,
        specialization="Cardiology",
        license_no="MH-DOC-2024-00123",
        hospital_name="City Medical Center",
        hospital_address="123 Health Avenue, Nashik, Maharashtra 422001",
        consultation_fee=500.0,
        experience_years=8,
        bio="Dr. Ayush Sharma is a senior cardiologist with 8 years of experience. Specialized in interventional cardiology and preventive heart care.",
        languages="English, Hindi, Marathi",
        available_days="Mon,Tue,Wed,Thu,Fri",
        slot_duration_minutes=30,
        is_available=True,
        rating=4.7,
        total_reviews=124,
    )
    db.add(dp)
    db.flush()
    print("  ✅ Doctor profile created")

    # ── Appointments ───────────────────────────────────────────────────────
    today = date.today()
    appointments = [
        Appointment(id=uuid.uuid4(), doctor_id=doctor_user.id, patient_id=patient_user.id,
                    appointment_date=today, time_slot="10:00 AM",
                    appointment_type="In Person", status="CONFIRMED",
                    symptoms="Chest discomfort and mild breathlessness"),
        Appointment(id=uuid.uuid4(), doctor_id=doctor_user.id, patient_id=patient_user.id,
                    appointment_date=today, time_slot="11:00 AM",
                    appointment_type="Video", status="PENDING",
                    symptoms="Follow-up for BP medication"),
        Appointment(id=uuid.uuid4(), doctor_id=doctor_user.id, patient_id=patient_user.id,
                    appointment_date=today - timedelta(days=2), time_slot="09:00 AM",
                    appointment_type="In Person", status="COMPLETED",
                    symptoms="Routine checkup", notes="BP normal, continue medication"),
        Appointment(id=uuid.uuid4(), doctor_id=doctor_user.id, patient_id=patient_user.id,
                    appointment_date=today + timedelta(days=1), time_slot="02:00 PM",
                    appointment_type="In Person", status="PENDING",
                    symptoms="Palpitations and dizziness"),
        Appointment(id=uuid.uuid4(), doctor_id=doctor_user.id, patient_id=patient_user.id,
                    appointment_date=today - timedelta(days=5), time_slot="03:30 PM",
                    appointment_type="Phone", status="CANCELLED",
                    symptoms="Headache"),
    ]
    db.add_all(appointments)
    db.flush()
    print("  ✅ 5 appointments seeded")

    # ── Hospital Beds ──────────────────────────────────────────────────────
    beds = []
    wards = [("General Ward", "General", "G"), ("ICU", "ICU", "I"), ("Private Wing", "Private", "P")]
    statuses = ["AVAILABLE", "OCCUPIED", "AVAILABLE", "OCCUPIED", "MAINTENANCE",
                "AVAILABLE", "OCCUPIED", "AVAILABLE", "AVAILABLE", "RESERVED"]

    bed_idx = 0
    for ward_name, bed_type, prefix in wards:
        count = 4 if bed_type == "ICU" else 5
        for i in range(1, count + 1):
            beds.append(HospitalBed(
                id=uuid.uuid4(),
                hospital_admin_id=hospital_user.id,
                bed_number=f"{prefix}-{i:03d}",
                ward=ward_name,
                bed_type=bed_type,
                floor=1 if bed_type != "Private" else 2,
                status=statuses[bed_idx % len(statuses)],
            ))
            bed_idx += 1
    db.add_all(beds)
    db.flush()
    print(f"  ✅ {len(beds)} hospital beds seeded")

    # ── Hospital Admissions ────────────────────────────────────────────────
    occupied_beds = [b for b in beds if b.status == "OCCUPIED"][:3]
    admissions = [
        HospitalAdmission(id=uuid.uuid4(), hospital_admin_id=hospital_user.id,
                          bed_id=occupied_beds[0].id if occupied_beds else None,
                          patient_name="Ramesh Patil", patient_phone="9876543210",
                          patient_age=54, patient_gender="Male",
                          diagnosis="Acute Myocardial Infarction",
                          admit_date=today - timedelta(days=3), status="ADMITTED", total_bill=45000),
        HospitalAdmission(id=uuid.uuid4(), hospital_admin_id=hospital_user.id,
                          bed_id=occupied_beds[1].id if len(occupied_beds) > 1 else None,
                          patient_name="Sunita Desai", patient_phone="9876543211",
                          patient_age=38, patient_gender="Female",
                          diagnosis="Post-operative recovery (Appendectomy)",
                          admit_date=today - timedelta(days=1), status="ADMITTED", total_bill=28000),
        HospitalAdmission(id=uuid.uuid4(), hospital_admin_id=hospital_user.id,
                          bed_id=None,
                          patient_name="Vijay Sharma", patient_phone="9876543212",
                          patient_age=67, patient_gender="Male",
                          diagnosis="Pneumonia",
                          admit_date=today - timedelta(days=8),
                          discharge_date=today - timedelta(days=2),
                          status="DISCHARGED", total_bill=22000),
    ]
    db.add_all(admissions)
    db.flush()
    print(f"  ✅ {len(admissions)} admissions seeded")

    # ── NGO Beneficiaries ──────────────────────────────────────────────────
    beneficiaries = [
        NGOBeneficiary(id=uuid.uuid4(), ngo_id=ngo_user.id, name="Kamla Bai",
                       phone="9800000001", address="12, Slum Area, Nagpur",
                       age=62, gender="Female", health_condition="Diabetes, Hypertension",
                       scheme_eligible=True, scheme_names="PM Jan Arogya, MJPJAY", status="ACTIVE"),
        NGOBeneficiary(id=uuid.uuid4(), ngo_id=ngo_user.id, name="Suresh Kumar",
                       phone="9800000002", address="Nagpur Rural District",
                       age=45, gender="Male", health_condition="TB",
                       scheme_eligible=True, scheme_names="National TB Programme", status="ACTIVE"),
        NGOBeneficiary(id=uuid.uuid4(), ngo_id=ngo_user.id, name="Meena Tai",
                       phone="9800000003", address="Ward 7, Nagpur",
                       age=35, gender="Female", health_condition="Malnutrition",
                       scheme_eligible=False, scheme_names=None, status="ACTIVE"),
        NGOBeneficiary(id=uuid.uuid4(), ngo_id=ngo_user.id, name="Hari Prasad",
                       phone="9800000004", address="District Hospital Road, Nagpur",
                       age=78, gender="Male", health_condition="Cataract, Arthritis",
                       scheme_eligible=True, scheme_names="MJPJAY", status="ACTIVE"),
        NGOBeneficiary(id=uuid.uuid4(), ngo_id=ngo_user.id, name="Rekha Verma",
                       phone="9800000005", address="Kamptee, Nagpur",
                       age=28, gender="Female", health_condition="Anaemia",
                       scheme_eligible=False, scheme_names=None, status="PENDING"),
    ]
    db.add_all(beneficiaries)
    db.flush()
    print(f"  ✅ {len(beneficiaries)} NGO beneficiaries seeded")

    # ── Blood Camps ────────────────────────────────────────────────────────
    blood_camps = [
        NGOBloodCamp(id=uuid.uuid4(), ngo_id=ngo_user.id,
                     title="Nagpur City Blood Donation Drive",
                     date=today + timedelta(days=7),
                     location="Gandhi Maidan, Nagpur", target_units=100,
                     collected_units=0, volunteers=15, status="UPCOMING"),
        NGOBloodCamp(id=uuid.uuid4(), ngo_id=ngo_user.id,
                     title="Kamptee Town Camp",
                     date=today - timedelta(days=10),
                     location="Kamptee Community Hall", target_units=60,
                     collected_units=58, volunteers=12, status="COMPLETED"),
        NGOBloodCamp(id=uuid.uuid4(), ngo_id=ngo_user.id,
                     title="Hingna Industrial Area Camp",
                     date=today - timedelta(days=30),
                     location="Hingna MIDC, Nagpur", target_units=80,
                     collected_units=72, volunteers=18, status="COMPLETED"),
    ]
    db.add_all(blood_camps)
    db.flush()
    print(f"  ✅ {len(blood_camps)} blood camps seeded")

    # ── Donation Drives ────────────────────────────────────────────────────
    drives = [
        NGODonationDrive(id=uuid.uuid4(), ngo_id=ngo_user.id,
                         title="Medicine for Rural Villages 2026",
                         description="Provide essential medicines to 500+ rural families across Vidarbha region.",
                         start_date=today - timedelta(days=15),
                         end_date=today + timedelta(days=45),
                         target_amount=150000, raised_amount=87500, status="ONGOING"),
        NGODonationDrive(id=uuid.uuid4(), ngo_id=ngo_user.id,
                         title="Cancer Patient Support Fund",
                         description="Support cancer patients with free chemotherapy medicines.",
                         start_date=today - timedelta(days=60),
                         end_date=today - timedelta(days=5),
                         target_amount=200000, raised_amount=200000, status="COMPLETED"),
        NGODonationDrive(id=uuid.uuid4(), ngo_id=ngo_user.id,
                         title="Monsoon Health Camp 2026",
                         description="Free health checkup and medicine distribution during monsoon.",
                         start_date=today + timedelta(days=30),
                         end_date=today + timedelta(days=90),
                         target_amount=75000, raised_amount=0, status="UPCOMING"),
    ]
    db.add_all(drives)
    db.commit()
    print(f"  ✅ {len(drives)} donation drives seeded")

    print("\n✅ All demo data seeded successfully!")


def main():
    db = SessionLocal()
    try:
        clean_test_data(db)
        seed_demo_data(db)
    finally:
        db.close()


if __name__ == "__main__":
    main()
