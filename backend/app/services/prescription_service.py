from uuid import UUID

from sqlalchemy.orm import Session, joinedload

from app.models.medicine import Medicine
from app.models.prescription import Prescription, PrescriptionMedicine
from app.schemas.prescription import PrescriptionCreate, PrescriptionAdminUpdate


def create_prescription(db: Session, payload: PrescriptionCreate, user_id: UUID) -> Prescription:
    prescription = Prescription(
        user_id=user_id,
        patient_name=payload.patient_name,
        doctor_name=payload.doctor_name,
        prescription_text=payload.prescription_text,
        image_url=payload.image_url,
        extra_data=payload.extra_data,
    )
    db.add(prescription)
    db.commit()
    db.refresh(prescription)
    return prescription


def get_prescription(db: Session, prescription_id: int) -> Prescription | None:
    return (
        db.query(Prescription)
        .options(joinedload(Prescription.recommended_medicines))
        .filter(Prescription.id == prescription_id)
        .first()
    )


def list_prescriptions(db: Session, user_id: UUID | None = None) -> list[Prescription]:
    q = db.query(Prescription).options(joinedload(Prescription.recommended_medicines))
    if user_id:
        q = q.filter(Prescription.user_id == user_id)
    return q.order_by(Prescription.created_at.desc()).all()


def admin_update_prescription(db: Session, prescription_id: int, payload: PrescriptionAdminUpdate) -> Prescription | None:
    prescription = get_prescription(db, prescription_id)
    if not prescription:
        return None
    if payload.admin_reply is not None:
        prescription.admin_reply = payload.admin_reply
    if payload.recommended_medicines is not None:
        # Replace existing recommendations
        for pm in prescription.recommended_medicines:
            db.delete(pm)
        for item in payload.recommended_medicines:
            pm = PrescriptionMedicine(
                prescription_id=prescription_id,
                medicine_id=item.medicine_id,
                quantity=max(1, item.quantity),
            )
            db.add(pm)
    db.commit()
    db.refresh(prescription)
    return prescription
