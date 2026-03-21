"""
Seed 27 beds for each hospital admin. Runs on backend startup.
Ensures hospital admins have 27 available beds for the dashboard.
"""
import uuid

from app.db.session import SessionLocal
from app.models.user import User, UserRole
from app.models.hospital import HospitalBed, BedType, BedStatus


def seed_hospital_beds() -> None:
    """Add 27 beds per hospital admin if they have fewer than 28."""
    db = SessionLocal()
    try:
        hospital_admins = db.query(User).filter(User.role == UserRole.HOSPITAL_ADMIN).all()
        if not hospital_admins:
            return

        for admin in hospital_admins:
            existing = db.query(HospitalBed).filter(HospitalBed.hospital_admin_id == admin.id).count()
            if existing >= 28:
                continue

            to_add = 27
            start_num = existing + 1
            added = 0
            for i in range(to_add):
                bed_num = f"G-{start_num + i:03d}"
                if db.query(HospitalBed).filter(
                    HospitalBed.hospital_admin_id == admin.id,
                    HospitalBed.bed_number == bed_num,
                ).first():
                    continue
                bed = HospitalBed(
                    id=uuid.uuid4(),
                    hospital_admin_id=admin.id,
                    bed_number=bed_num,
                    ward="General Ward",
                    bed_type=BedType.GENERAL,
                    status=BedStatus.AVAILABLE,
                    floor=1,
                )
                db.add(bed)
                added += 1
            if added:
                db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
