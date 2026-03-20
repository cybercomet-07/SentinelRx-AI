from datetime import date
from typing import Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps.auth import get_current_user, require_roles
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.doctor_profile import DoctorProfile
from app.models.appointment import Appointment

router = APIRouter(prefix="/doctor", tags=["Doctor"])


# ── Schemas ──────────────────────────────────────────────────────────────────

class DoctorProfileUpdate(BaseModel):
    specialization: Optional[str] = None
    license_no: Optional[str] = None
    hospital_name: Optional[str] = None
    hospital_address: Optional[str] = None
    consultation_fee: Optional[float] = None
    experience_years: Optional[int] = None
    bio: Optional[str] = None
    languages: Optional[str] = None
    available_days: Optional[str] = None
    slot_duration_minutes: Optional[int] = None
    is_available: Optional[bool] = None


class AppointmentStatusUpdate(BaseModel):
    status: str
    notes: Optional[str] = None
    prescription_issued: Optional[str] = None


# ── Helpers ───────────────────────────────────────────────────────────────────

def _profile_dict(p: DoctorProfile, user: User) -> dict:
    return {
        "id": str(p.id), "user_id": str(p.user_id),
        "name": user.name, "email": user.email, "phone": user.phone,
        "specialization": p.specialization, "license_no": p.license_no,
        "hospital_name": p.hospital_name, "hospital_address": p.hospital_address,
        "consultation_fee": p.consultation_fee, "experience_years": p.experience_years,
        "bio": p.bio, "languages": p.languages, "available_days": p.available_days,
        "slot_duration_minutes": p.slot_duration_minutes, "is_available": p.is_available,
        "rating": p.rating, "total_reviews": p.total_reviews,
    }


def _appt_dict(a: Appointment, db: Session) -> dict:
    patient = db.query(User).filter(User.id == a.patient_id).first()
    return {
        "id": str(a.id),
        "patient_id": str(a.patient_id),
        "patient_name": patient.name if patient else "Unknown",
        "patient_email": patient.email if patient else "",
        "patient_phone": patient.phone if patient else "",
        "appointment_date": str(a.appointment_date),
        "time_slot": a.time_slot,
        "appointment_type": a.appointment_type,
        "status": a.status,
        "symptoms": a.symptoms,
        "notes": a.notes,
        "prescription_issued": a.prescription_issued,
        "created_at": str(a.created_at),
    }


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/profile")
def get_doctor_profile(
    current_user: User = Depends(require_roles(UserRole.DOCTOR)),
    db: Session = Depends(get_db),
):
    profile = db.query(DoctorProfile).filter(DoctorProfile.user_id == current_user.id).first()
    if not profile:
        profile = DoctorProfile(id=uuid.uuid4(), user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return _profile_dict(profile, current_user)


@router.put("/profile")
def update_doctor_profile(
    data: DoctorProfileUpdate,
    current_user: User = Depends(require_roles(UserRole.DOCTOR)),
    db: Session = Depends(get_db),
):
    profile = db.query(DoctorProfile).filter(DoctorProfile.user_id == current_user.id).first()
    if not profile:
        profile = DoctorProfile(id=uuid.uuid4(), user_id=current_user.id)
        db.add(profile)
    for k, v in data.dict(exclude_none=True).items():
        setattr(profile, k, v)
    db.commit()
    db.refresh(profile)
    return _profile_dict(profile, current_user)


@router.get("/appointments")
def list_appointments(
    status_filter: Optional[str] = None,
    current_user: User = Depends(require_roles(UserRole.DOCTOR)),
    db: Session = Depends(get_db),
):
    q = db.query(Appointment).filter(Appointment.doctor_id == current_user.id)
    if status_filter:
        q = q.filter(Appointment.status == status_filter.upper())
    appointments = q.order_by(Appointment.appointment_date.desc(), Appointment.time_slot).all()
    return {"items": [_appt_dict(a, db) for a in appointments], "total": len(appointments)}


@router.put("/appointments/{appt_id}")
def update_appointment(
    appt_id: str,
    data: AppointmentStatusUpdate,
    current_user: User = Depends(require_roles(UserRole.DOCTOR)),
    db: Session = Depends(get_db),
):
    appt = db.query(Appointment).filter(
        Appointment.id == appt_id,
        Appointment.doctor_id == current_user.id
    ).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    appt.status = data.status.upper()
    if data.notes:
        appt.notes = data.notes
    if data.prescription_issued:
        appt.prescription_issued = data.prescription_issued
    db.commit()
    return _appt_dict(appt, db)


@router.get("/patients")
def list_patients(
    current_user: User = Depends(require_roles(UserRole.DOCTOR)),
    db: Session = Depends(get_db),
):
    patient_ids = db.query(Appointment.patient_id).filter(
        Appointment.doctor_id == current_user.id
    ).distinct().all()
    ids = [r[0] for r in patient_ids]
    patients = db.query(User).filter(User.id.in_(ids)).all()
    result = []
    for p in patients:
        last_appt = db.query(Appointment).filter(
            Appointment.doctor_id == current_user.id,
            Appointment.patient_id == p.id
        ).order_by(Appointment.appointment_date.desc()).first()
        total = db.query(Appointment).filter(
            Appointment.doctor_id == current_user.id,
            Appointment.patient_id == p.id
        ).count()
        result.append({
            "id": str(p.id), "name": p.name, "email": p.email, "phone": p.phone,
            "gender": p.gender, "date_of_birth": str(p.date_of_birth) if p.date_of_birth else None,
            "total_appointments": total,
            "last_visit": str(last_appt.appointment_date) if last_appt else None,
            "last_symptoms": last_appt.symptoms if last_appt else None,
        })
    return {"items": result, "total": len(result)}


@router.get("/stats")
def doctor_stats(
    current_user: User = Depends(require_roles(UserRole.DOCTOR)),
    db: Session = Depends(get_db),
):
    today = date.today()
    today_count = db.query(Appointment).filter(
        Appointment.doctor_id == current_user.id,
        Appointment.appointment_date == today
    ).count()
    total_patients = db.query(Appointment.patient_id).filter(
        Appointment.doctor_id == current_user.id
    ).distinct().count()
    completed = db.query(Appointment).filter(
        Appointment.doctor_id == current_user.id,
        Appointment.status == "COMPLETED"
    ).count()
    pending = db.query(Appointment).filter(
        Appointment.doctor_id == current_user.id,
        Appointment.status.in_(["PENDING", "CONFIRMED"])
    ).count()
    profile = db.query(DoctorProfile).filter(DoctorProfile.user_id == current_user.id).first()
    return {
        "today_appointments": today_count,
        "total_patients": total_patients,
        "completed_appointments": completed,
        "pending_appointments": pending,
        "rating": profile.rating if profile else 0,
        "total_reviews": profile.total_reviews if profile else 0,
    }
