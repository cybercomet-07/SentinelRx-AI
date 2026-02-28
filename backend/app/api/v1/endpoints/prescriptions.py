from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps.auth import require_roles
from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.prescription import PrescriptionCreate, PrescriptionRead
from app.services.prescription_service import create_prescription, get_prescription

router = APIRouter(prefix="/prescriptions", tags=["Prescriptions"])


@router.post("", response_model=PrescriptionRead, status_code=status.HTTP_201_CREATED)
def create_prescription_endpoint(
    payload: PrescriptionCreate,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_roles(UserRole.USER, UserRole.ADMIN)),
):
    return create_prescription(db, payload)


@router.get("/{prescription_id}", response_model=PrescriptionRead)
def get_prescription_endpoint(
    prescription_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_roles(UserRole.USER, UserRole.ADMIN)),
):
    prescription = get_prescription(db, prescription_id)
    if not prescription:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prescription not found")
    return prescription
