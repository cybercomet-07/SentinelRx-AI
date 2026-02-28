from sqlalchemy.orm import Session

from app.models.prescription import Prescription
from app.schemas.prescription import PrescriptionCreate


def create_prescription(db: Session, payload: PrescriptionCreate) -> Prescription:
    prescription = Prescription(
        patient_name=payload.patient_name,
        doctor_name=payload.doctor_name,
        prescription_text=payload.prescription_text,
        extra_data=payload.extra_data,
    )
    db.add(prescription)
    db.commit()
    db.refresh(prescription)
    return prescription


def get_prescription(db: Session, prescription_id: int) -> Prescription | None:
    return db.query(Prescription).filter(Prescription.id == prescription_id).first()
