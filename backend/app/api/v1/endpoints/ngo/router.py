from datetime import date
from typing import Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps.auth import require_roles
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.ngo import NGOBeneficiary, NGOBloodCamp, NGODonationDrive

router = APIRouter(prefix="/ngo", tags=["NGO"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class BeneficiaryCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    health_condition: Optional[str] = None
    scheme_eligible: bool = False
    scheme_names: Optional[str] = None


class BloodCampCreate(BaseModel):
    title: str
    date: str
    location: str
    target_units: int = 50
    volunteers: int = 0
    notes: Optional[str] = None


class BloodCampUpdate(BaseModel):
    status: Optional[str] = None
    collected_units: Optional[int] = None
    volunteers: Optional[int] = None
    notes: Optional[str] = None


class DonationDriveCreate(BaseModel):
    title: str
    description: Optional[str] = None
    start_date: str
    end_date: Optional[str] = None
    target_amount: float = 0.0


class DonationDriveUpdate(BaseModel):
    status: Optional[str] = None
    raised_amount: Optional[float] = None
    description: Optional[str] = None


# ── Helpers ───────────────────────────────────────────────────────────────────

def _ben_dict(b: NGOBeneficiary) -> dict:
    return {
        "id": str(b.id), "name": b.name, "phone": b.phone, "address": b.address,
        "age": b.age, "gender": b.gender, "health_condition": b.health_condition,
        "scheme_eligible": b.scheme_eligible, "scheme_names": b.scheme_names,
        "status": b.status, "created_at": str(b.created_at),
    }


def _camp_dict(c: NGOBloodCamp) -> dict:
    pct = round((c.collected_units / c.target_units * 100) if c.target_units else 0, 1)
    return {
        "id": str(c.id), "title": c.title, "date": str(c.date),
        "location": c.location, "target_units": c.target_units,
        "collected_units": c.collected_units, "volunteers": c.volunteers,
        "status": c.status, "notes": c.notes, "progress_pct": pct,
        "created_at": str(c.created_at),
    }


def _drive_dict(d: NGODonationDrive) -> dict:
    pct = round((d.raised_amount / d.target_amount * 100) if d.target_amount else 0, 1)
    return {
        "id": str(d.id), "title": d.title, "description": d.description,
        "start_date": str(d.start_date),
        "end_date": str(d.end_date) if d.end_date else None,
        "target_amount": d.target_amount, "raised_amount": d.raised_amount,
        "status": d.status, "progress_pct": pct, "created_at": str(d.created_at),
    }


# ── Stats ─────────────────────────────────────────────────────────────────────

@router.get("/stats")
def ngo_stats(
    current_user: User = Depends(require_roles(UserRole.NGO)),
    db: Session = Depends(get_db),
):
    beneficiaries = db.query(NGOBeneficiary).filter(NGOBeneficiary.ngo_id == current_user.id).count()
    scheme_eligible = db.query(NGOBeneficiary).filter(
        NGOBeneficiary.ngo_id == current_user.id, NGOBeneficiary.scheme_eligible == True
    ).count()
    blood_camps = db.query(NGOBloodCamp).filter(NGOBloodCamp.ngo_id == current_user.id).count()
    units_collected = db.query(NGOBloodCamp).filter(NGOBloodCamp.ngo_id == current_user.id).all()
    total_units = sum(c.collected_units for c in units_collected)
    drives = db.query(NGODonationDrive).filter(NGODonationDrive.ngo_id == current_user.id).all()
    total_raised = sum(d.raised_amount for d in drives)
    return {
        "total_beneficiaries": beneficiaries, "scheme_eligible": scheme_eligible,
        "blood_camps": blood_camps, "units_collected": total_units,
        "donation_drives": len(drives), "total_raised": total_raised,
    }


# ── Beneficiaries ─────────────────────────────────────────────────────────────

@router.get("/beneficiaries")
def list_beneficiaries(
    search: Optional[str] = None,
    status: Optional[str] = None,
    current_user: User = Depends(require_roles(UserRole.NGO)),
    db: Session = Depends(get_db),
):
    q = db.query(NGOBeneficiary).filter(NGOBeneficiary.ngo_id == current_user.id)
    if search:
        q = q.filter(NGOBeneficiary.name.ilike(f"%{search}%"))
    if status:
        q = q.filter(NGOBeneficiary.status == status.upper())
    items = q.order_by(NGOBeneficiary.created_at.desc()).all()
    return {"items": [_ben_dict(b) for b in items], "total": len(items)}


@router.post("/beneficiaries")
def create_beneficiary(
    data: BeneficiaryCreate,
    current_user: User = Depends(require_roles(UserRole.NGO)),
    db: Session = Depends(get_db),
):
    b = NGOBeneficiary(id=uuid.uuid4(), ngo_id=current_user.id, status="ACTIVE", **data.dict())
    db.add(b)
    db.commit()
    db.refresh(b)
    return _ben_dict(b)


@router.delete("/beneficiaries/{ben_id}")
def delete_beneficiary(
    ben_id: str,
    current_user: User = Depends(require_roles(UserRole.NGO)),
    db: Session = Depends(get_db),
):
    b = db.query(NGOBeneficiary).filter(NGOBeneficiary.id == ben_id, NGOBeneficiary.ngo_id == current_user.id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Beneficiary not found")
    db.delete(b)
    db.commit()
    return {"message": "Deleted"}


# ── Blood Camps ───────────────────────────────────────────────────────────────

@router.get("/blood-camps")
def list_blood_camps(
    current_user: User = Depends(require_roles(UserRole.NGO)),
    db: Session = Depends(get_db),
):
    camps = db.query(NGOBloodCamp).filter(NGOBloodCamp.ngo_id == current_user.id).order_by(NGOBloodCamp.date.desc()).all()
    return {"items": [_camp_dict(c) for c in camps], "total": len(camps)}


@router.post("/blood-camps")
def create_blood_camp(
    data: BloodCampCreate,
    current_user: User = Depends(require_roles(UserRole.NGO)),
    db: Session = Depends(get_db),
):
    camp = NGOBloodCamp(
        id=uuid.uuid4(), ngo_id=current_user.id,
        title=data.title, date=date.fromisoformat(data.date),
        location=data.location, target_units=data.target_units,
        volunteers=data.volunteers, notes=data.notes, status="UPCOMING",
    )
    db.add(camp)
    db.commit()
    db.refresh(camp)
    return _camp_dict(camp)


@router.put("/blood-camps/{camp_id}")
def update_blood_camp(
    camp_id: str,
    data: BloodCampUpdate,
    current_user: User = Depends(require_roles(UserRole.NGO)),
    db: Session = Depends(get_db),
):
    camp = db.query(NGOBloodCamp).filter(NGOBloodCamp.id == camp_id, NGOBloodCamp.ngo_id == current_user.id).first()
    if not camp:
        raise HTTPException(status_code=404, detail="Camp not found")
    for k, v in data.dict(exclude_none=True).items():
        if k == "status":
            v = v.upper()
        setattr(camp, k, v)
    db.commit()
    return _camp_dict(camp)


# ── Donation Drives ───────────────────────────────────────────────────────────

@router.get("/donations")
def list_donation_drives(
    current_user: User = Depends(require_roles(UserRole.NGO)),
    db: Session = Depends(get_db),
):
    drives = db.query(NGODonationDrive).filter(NGODonationDrive.ngo_id == current_user.id).order_by(NGODonationDrive.created_at.desc()).all()
    return {"items": [_drive_dict(d) for d in drives], "total": len(drives)}


@router.post("/donations")
def create_donation_drive(
    data: DonationDriveCreate,
    current_user: User = Depends(require_roles(UserRole.NGO)),
    db: Session = Depends(get_db),
):
    drive = NGODonationDrive(
        id=uuid.uuid4(), ngo_id=current_user.id,
        title=data.title, description=data.description,
        start_date=date.fromisoformat(data.start_date),
        end_date=date.fromisoformat(data.end_date) if data.end_date else None,
        target_amount=data.target_amount, raised_amount=0.0, status="UPCOMING",
    )
    db.add(drive)
    db.commit()
    db.refresh(drive)
    return _drive_dict(drive)


@router.put("/donations/{drive_id}")
def update_donation_drive(
    drive_id: str,
    data: DonationDriveUpdate,
    current_user: User = Depends(require_roles(UserRole.NGO)),
    db: Session = Depends(get_db),
):
    drive = db.query(NGODonationDrive).filter(NGODonationDrive.id == drive_id, NGODonationDrive.ngo_id == current_user.id).first()
    if not drive:
        raise HTTPException(status_code=404, detail="Drive not found")
    for k, v in data.dict(exclude_none=True).items():
        if k == "status":
            v = v.upper()
        setattr(drive, k, v)
    db.commit()
    return _drive_dict(drive)
