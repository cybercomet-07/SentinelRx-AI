from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.deps.auth import require_roles
from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.prescription import PrescriptionCreate, PrescriptionRead, PrescriptionAdminUpdate
from app.services.prescription_service import create_prescription, get_prescription, list_prescriptions, admin_update_prescription
from app.services.cloudinary_service import upload_prescription_image
from app.services.symptom_recommendation_service import get_symptom_recommendation

router = APIRouter(prefix="/prescriptions", tags=["Prescriptions"])
admin_router = APIRouter(prefix="/admin/prescriptions", tags=["Admin Prescriptions"])


class SymptomRecommendRequest(BaseModel):
    message: str = Field(..., min_length=3, max_length=500, description="User symptom description (e.g. 'I have fever but no prescription')")
    lang: str | None = None  # e.g. hi-IN - for AI to respond in user's language


@router.post("/symptom-recommendation")
def symptom_recommendation_endpoint(
    payload: SymptomRecommendRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.USER, UserRole.ADMIN)),
):
    """Get medicine recommendations for symptoms when user has no prescription. Uses AI + medicine index."""
    response = get_symptom_recommendation(
        db,
        payload.message,
        user_id=current_user.id,
        user_email=current_user.email,
        response_lang=payload.lang,
    )
    return {"recommendation": response}


class UploadImageRequest(BaseModel):
    image: str  # base64 data URL (data:image/...;base64,...)


@router.post("/upload-image")
def upload_prescription_image_endpoint(
    payload: UploadImageRequest,
    _current_user: User = Depends(require_roles(UserRole.USER, UserRole.ADMIN)),
):
    """Upload prescription image to Cloudinary. Returns URL for use in create."""
    result = upload_prescription_image(payload.image)
    if not result:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Image upload failed. Check Cloudinary config.")
    return {"url": result.get("secure_url", result.get("url", ""))}


@router.post("", response_model=PrescriptionRead, status_code=status.HTTP_201_CREATED)
def create_prescription_endpoint(
    payload: PrescriptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.USER, UserRole.ADMIN)),
):
    prescription = create_prescription(db, payload, current_user.id)
    return PrescriptionRead.from_prescription(prescription)


@router.get("/my")
def list_my_prescriptions(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.USER, UserRole.ADMIN)),
):
    """List current user's prescriptions."""
    prescriptions = list_prescriptions(db, user_id=current_user.id)
    return [PrescriptionRead.from_prescription(p) for p in prescriptions]


@router.get("/{prescription_id}", response_model=PrescriptionRead)
def get_prescription_endpoint(
    prescription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.USER, UserRole.ADMIN)),
):
    prescription = get_prescription(db, prescription_id)
    if not prescription:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prescription not found")
    if current_user.role != UserRole.ADMIN and prescription.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your prescription")
    return PrescriptionRead.from_prescription(prescription)


# --- Admin prescription endpoints ---

@admin_router.get("")
def admin_list_prescriptions(
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """List all prescriptions for admin."""
    prescriptions = list_prescriptions(db, user_id=None)
    return [PrescriptionRead.from_prescription(p) for p in prescriptions]


@admin_router.get("/{prescription_id}")
def admin_get_prescription(
    prescription_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    prescription = get_prescription(db, prescription_id)
    if not prescription:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prescription not found")
    return PrescriptionRead.from_prescription(prescription)


@admin_router.patch("/{prescription_id}")
def admin_update_prescription_endpoint(
    prescription_id: int,
    payload: PrescriptionAdminUpdate,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    prescription = admin_update_prescription(db, prescription_id, payload)
    if not prescription:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prescription not found")
    return PrescriptionRead.from_prescription(prescription)
