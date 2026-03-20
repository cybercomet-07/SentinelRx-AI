from datetime import date
from typing import Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps.auth import get_current_user, require_roles
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.doctor_profile import DoctorProfile
from app.models.appointment import Appointment, AppointmentStatus, AppointmentType
from app.models.notification import Notification, NotificationType

router = APIRouter(prefix="/patient", tags=["Patient"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class BookAppointmentRequest(BaseModel):
    doctor_id: str
    appointment_date: str          # "YYYY-MM-DD"
    time_slot: str                 # e.g. "10:00 AM"
    appointment_type: Optional[str] = "In Person"
    symptoms: Optional[str] = None


# ── Helpers ───────────────────────────────────────────────────────────────────

def _doctor_card(p: DoctorProfile, user: User) -> dict:
    return {
        "doctor_id": str(user.id),
        "profile_id": str(p.id),
        "name": user.name,
        "email": user.email,
        "phone": user.phone,
        "specialization": p.specialization or "General Physician",
        "hospital_name": p.hospital_name,
        "hospital_address": p.hospital_address,
        "consultation_fee": p.consultation_fee,
        "experience_years": p.experience_years,
        "bio": p.bio,
        "languages": p.languages,
        "available_days": p.available_days,
        "slot_duration_minutes": p.slot_duration_minutes,
        "is_available": p.is_available,
        "rating": p.rating,
        "total_reviews": p.total_reviews,
    }


def _appt_card(a: Appointment, db: Session) -> dict:
    doctor = db.query(User).filter(User.id == a.doctor_id).first()
    profile = db.query(DoctorProfile).filter(DoctorProfile.user_id == a.doctor_id).first()
    return {
        "id": str(a.id),
        "doctor_id": str(a.doctor_id),
        "doctor_name": doctor.name if doctor else "Unknown",
        "doctor_phone": doctor.phone if doctor else "",
        "specialization": profile.specialization if profile else "General Physician",
        "hospital_name": profile.hospital_name if profile else "",
        "appointment_date": str(a.appointment_date),
        "time_slot": a.time_slot,
        "appointment_type": a.appointment_type,
        "status": a.status,
        "symptoms": a.symptoms,
        "notes": a.notes,
        "prescription_issued": a.prescription_issued,
        "created_at": str(a.created_at),
    }


def _push_notification(db: Session, user_id, title: str, message: str):
    notif = Notification(
        id=uuid.uuid4(),
        user_id=user_id,
        title=title,
        message=message,
        typ=NotificationType.SYSTEM,
    )
    db.add(notif)


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/doctors")
def list_doctors(
    specialization: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all doctors with active profiles. Accessible by any logged-in user."""
    q = db.query(DoctorProfile, User).join(User, DoctorProfile.user_id == User.id).filter(
        User.role == UserRole.DOCTOR
    )
    profiles = q.all()
    result = []
    for profile, user in profiles:
        card = _doctor_card(profile, user)
        if specialization and specialization.lower() not in (card["specialization"] or "").lower():
            continue
        if search:
            s = search.lower()
            if not any(s in (card.get(f) or "").lower() for f in ["name", "specialization", "hospital_name"]):
                continue
        result.append(card)
    return {"items": result, "total": len(result)}


@router.get("/doctors/{doctor_id}")
def get_doctor_detail(
    doctor_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doctor = db.query(User).filter(User.id == doctor_id, User.role == UserRole.DOCTOR).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    profile = db.query(DoctorProfile).filter(DoctorProfile.user_id == doctor.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Doctor profile not set up yet")
    return _doctor_card(profile, doctor)


@router.post("/appointments")
def book_appointment(
    data: BookAppointmentRequest,
    current_user: User = Depends(require_roles(UserRole.USER)),
    db: Session = Depends(get_db),
):
    doctor = db.query(User).filter(User.id == data.doctor_id, User.role == UserRole.DOCTOR).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    appt_type = AppointmentType.IN_PERSON
    if data.appointment_type == "Video":
        appt_type = AppointmentType.VIDEO
    elif data.appointment_type == "Phone":
        appt_type = AppointmentType.PHONE

    appt = Appointment(
        id=uuid.uuid4(),
        doctor_id=uuid.UUID(data.doctor_id),
        patient_id=current_user.id,
        appointment_date=date.fromisoformat(data.appointment_date),
        time_slot=data.time_slot,
        appointment_type=appt_type,
        status=AppointmentStatus.PENDING,
        symptoms=data.symptoms,
    )
    db.add(appt)

    # Notify doctor
    _push_notification(
        db, doctor.id,
        "New Appointment Request",
        f"{current_user.name} has requested an appointment on {data.appointment_date} at {data.time_slot}."
        + (f" Symptoms: {data.symptoms}" if data.symptoms else ""),
    )

    db.commit()
    db.refresh(appt)
    return _appt_card(appt, db)


@router.get("/appointments")
def list_my_appointments(
    current_user: User = Depends(require_roles(UserRole.USER)),
    db: Session = Depends(get_db),
):
    items = (
        db.query(Appointment)
        .filter(Appointment.patient_id == current_user.id)
        .order_by(Appointment.appointment_date.desc(), Appointment.time_slot)
        .all()
    )
    return {"items": [_appt_card(a, db) for a in items], "total": len(items)}


@router.delete("/appointments/{appt_id}")
def cancel_appointment(
    appt_id: str,
    current_user: User = Depends(require_roles(UserRole.USER)),
    db: Session = Depends(get_db),
):
    appt = db.query(Appointment).filter(
        Appointment.id == appt_id,
        Appointment.patient_id == current_user.id,
    ).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    if appt.status in ("COMPLETED", "CANCELLED"):
        raise HTTPException(status_code=400, detail="Cannot cancel a completed or already cancelled appointment")
    appt.status = AppointmentStatus.CANCELLED

    # Notify doctor
    doctor = db.query(User).filter(User.id == appt.doctor_id).first()
    if doctor:
        _push_notification(
            db, doctor.id,
            "Appointment Cancelled",
            f"{current_user.name} cancelled their appointment on {appt.appointment_date} at {appt.time_slot}.",
        )

    db.commit()
    return {"message": "Appointment cancelled"}
