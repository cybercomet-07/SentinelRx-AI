from datetime import date
from typing import Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps.auth import get_current_user, require_roles
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.hospital import HospitalBed, HospitalAdmission
from app.models.medicine import Medicine

router = APIRouter(prefix="/hospital", tags=["Hospital"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class BedCreate(BaseModel):
    bed_number: str
    ward: str
    bed_type: str = "General"
    floor: int = 1
    notes: Optional[str] = None


class BedStatusUpdate(BaseModel):
    status: str
    notes: Optional[str] = None


class AdmissionCreate(BaseModel):
    bed_id: Optional[str] = None
    patient_name: str
    patient_phone: Optional[str] = None
    patient_age: Optional[int] = None
    patient_gender: Optional[str] = None
    diagnosis: Optional[str] = None
    admit_date: str
    total_bill: float = 0.0
    notes: Optional[str] = None


class AdmissionUpdate(BaseModel):
    status: Optional[str] = None
    discharge_date: Optional[str] = None
    total_bill: Optional[float] = None
    notes: Optional[str] = None
    diagnosis: Optional[str] = None


# ── Helpers ───────────────────────────────────────────────────────────────────

def _bed_dict(b: HospitalBed) -> dict:
    return {
        "id": str(b.id), "bed_number": b.bed_number, "ward": b.ward,
        "bed_type": b.bed_type, "status": b.status, "floor": b.floor, "notes": b.notes,
        "created_at": str(b.created_at),
    }


def _admission_dict(a: HospitalAdmission) -> dict:
    return {
        "id": str(a.id), "bed_id": str(a.bed_id) if a.bed_id else None,
        "bed_number": a.bed.bed_number if a.bed else None,
        "patient_name": a.patient_name, "patient_phone": a.patient_phone,
        "patient_age": a.patient_age, "patient_gender": a.patient_gender,
        "diagnosis": a.diagnosis, "admit_date": str(a.admit_date),
        "discharge_date": str(a.discharge_date) if a.discharge_date else None,
        "status": a.status, "total_bill": a.total_bill, "notes": a.notes,
        "created_at": str(a.created_at),
    }


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/stats")
def hospital_stats(
    current_user: User = Depends(require_roles(UserRole.HOSPITAL_ADMIN)),
    db: Session = Depends(get_db),
):
    total_beds = db.query(HospitalBed).filter(HospitalBed.hospital_admin_id == current_user.id).count()
    available = db.query(HospitalBed).filter(
        HospitalBed.hospital_admin_id == current_user.id, HospitalBed.status == "AVAILABLE"
    ).count()
    occupied = db.query(HospitalBed).filter(
        HospitalBed.hospital_admin_id == current_user.id, HospitalBed.status == "OCCUPIED"
    ).count()
    current_patients = db.query(HospitalAdmission).filter(
        HospitalAdmission.hospital_admin_id == current_user.id,
        HospitalAdmission.status == "ADMITTED"
    ).count()
    total_admissions = db.query(HospitalAdmission).filter(
        HospitalAdmission.hospital_admin_id == current_user.id
    ).count()
    pending_bills = db.query(HospitalAdmission).filter(
        HospitalAdmission.hospital_admin_id == current_user.id,
        HospitalAdmission.status == "ADMITTED",
        HospitalAdmission.total_bill > 0
    ).count()
    return {
        "total_beds": total_beds, "available_beds": available, "occupied_beds": occupied,
        "current_patients": current_patients, "total_admissions": total_admissions,
        "pending_bills": pending_bills,
        "occupancy_rate": round((occupied / total_beds * 100) if total_beds else 0, 1),
    }


@router.get("/beds")
def list_beds(
    ward: Optional[str] = None,
    status: Optional[str] = None,
    current_user: User = Depends(require_roles(UserRole.HOSPITAL_ADMIN)),
    db: Session = Depends(get_db),
):
    q = db.query(HospitalBed).filter(HospitalBed.hospital_admin_id == current_user.id)
    if ward:
        q = q.filter(HospitalBed.ward == ward)
    if status:
        q = q.filter(HospitalBed.status == status.upper())
    beds = q.order_by(HospitalBed.ward, HospitalBed.bed_number).all()
    return {"items": [_bed_dict(b) for b in beds], "total": len(beds)}


@router.post("/beds")
def create_bed(
    data: BedCreate,
    current_user: User = Depends(require_roles(UserRole.HOSPITAL_ADMIN)),
    db: Session = Depends(get_db),
):
    bed = HospitalBed(id=uuid.uuid4(), hospital_admin_id=current_user.id, **data.dict())
    db.add(bed)
    db.commit()
    db.refresh(bed)
    return _bed_dict(bed)


@router.put("/beds/{bed_id}")
def update_bed_status(
    bed_id: str,
    data: BedStatusUpdate,
    current_user: User = Depends(require_roles(UserRole.HOSPITAL_ADMIN)),
    db: Session = Depends(get_db),
):
    bed = db.query(HospitalBed).filter(
        HospitalBed.id == bed_id, HospitalBed.hospital_admin_id == current_user.id
    ).first()
    if not bed:
        raise HTTPException(status_code=404, detail="Bed not found")
    bed.status = data.status.upper()
    if data.notes is not None:
        bed.notes = data.notes
    db.commit()
    return _bed_dict(bed)


@router.get("/admissions")
def list_admissions(
    status: Optional[str] = None,
    current_user: User = Depends(require_roles(UserRole.HOSPITAL_ADMIN)),
    db: Session = Depends(get_db),
):
    q = db.query(HospitalAdmission).filter(HospitalAdmission.hospital_admin_id == current_user.id)
    if status:
        q = q.filter(HospitalAdmission.status == status.upper())
    admissions = q.order_by(HospitalAdmission.admit_date.desc()).all()
    return {"items": [_admission_dict(a) for a in admissions], "total": len(admissions)}


@router.post("/admissions")
def create_admission(
    data: AdmissionCreate,
    current_user: User = Depends(require_roles(UserRole.HOSPITAL_ADMIN)),
    db: Session = Depends(get_db),
):
    bed_id = uuid.UUID(data.bed_id) if data.bed_id else None
    admission = HospitalAdmission(
        id=uuid.uuid4(), hospital_admin_id=current_user.id,
        bed_id=bed_id,
        patient_name=data.patient_name, patient_phone=data.patient_phone,
        patient_age=data.patient_age, patient_gender=data.patient_gender,
        diagnosis=data.diagnosis,
        admit_date=date.fromisoformat(data.admit_date),
        total_bill=data.total_bill, notes=data.notes,
        status="ADMITTED",
    )
    if bed_id:
        bed = db.query(HospitalBed).filter(HospitalBed.id == bed_id).first()
        if bed:
            bed.status = "OCCUPIED"
    db.add(admission)
    db.commit()
    db.refresh(admission)
    return _admission_dict(admission)


@router.put("/admissions/{adm_id}")
def update_admission(
    adm_id: str,
    data: AdmissionUpdate,
    current_user: User = Depends(require_roles(UserRole.HOSPITAL_ADMIN)),
    db: Session = Depends(get_db),
):
    adm = db.query(HospitalAdmission).filter(
        HospitalAdmission.id == adm_id,
        HospitalAdmission.hospital_admin_id == current_user.id
    ).first()
    if not adm:
        raise HTTPException(status_code=404, detail="Admission not found")
    update_data = data.dict(exclude_none=True)
    if "discharge_date" in update_data:
        update_data["discharge_date"] = date.fromisoformat(update_data["discharge_date"])
    if "status" in update_data:
        update_data["status"] = update_data["status"].upper()
        if update_data["status"] == "DISCHARGED" and adm.bed_id:
            bed = db.query(HospitalBed).filter(HospitalBed.id == adm.bed_id).first()
            if bed:
                bed.status = "AVAILABLE"
    for k, v in update_data.items():
        setattr(adm, k, v)
    db.commit()
    return _admission_dict(adm)


@router.get("/inventory")
def hospital_inventory(
    search: Optional[str] = None,
    current_user: User = Depends(require_roles(UserRole.HOSPITAL_ADMIN)),
    db: Session = Depends(get_db),
):
    q = db.query(Medicine)
    if search:
        q = q.filter(Medicine.name.ilike(f"%{search}%"))
    medicines = q.order_by(Medicine.name).limit(50).all()
    return {
        "items": [{
            "id": str(m.id), "name": m.name, "category": m.category,
            "price": m.price, "stock": m.stock, "expiry_date": str(m.expiry_date) if m.expiry_date else None,
            "requires_prescription": m.requires_prescription,
        } for m in medicines],
        "total": len(medicines)
    }
