from datetime import date
from typing import Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps.auth import get_current_user, require_roles
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.hospital import HospitalBed, HospitalAdmission, HospitalMedicine, PatientVisit, HospitalBill
from app.models.medicine import Medicine
from app.services.cloudinary_service import upload_image

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
            "price": m.price, "stock": m.quantity, "expiry_date": str(m.expiry_date) if m.expiry_date else None,
            "requires_prescription": getattr(m, 'requires_prescription', False),
        } for m in medicines],
        "total": len(medicines)
    }


# ─────────────────────────────────────────────────────────────────────────────
# HOSPITAL MEDICINE MANAGEMENT
# ─────────────────────────────────────────────────────────────────────────────

class HospMedCreate(BaseModel):
    name: str
    category: Optional[str] = None
    quantity: int = 0
    unit: str = "tablets"
    price: float = 0.0
    expiry_date: Optional[str] = None
    manufacturer: Optional[str] = None
    reorder_level: int = 10
    notes: Optional[str] = None


class HospMedUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    quantity: Optional[int] = None
    unit: Optional[str] = None
    price: Optional[float] = None
    expiry_date: Optional[str] = None
    manufacturer: Optional[str] = None
    reorder_level: Optional[int] = None
    notes: Optional[str] = None


def _med_dict(m: HospitalMedicine) -> dict:
    return {
        "id": str(m.id), "name": m.name, "category": m.category,
        "quantity": m.quantity, "unit": m.unit, "price": m.price,
        "expiry_date": str(m.expiry_date) if m.expiry_date else None,
        "manufacturer": m.manufacturer, "reorder_level": m.reorder_level,
        "notes": m.notes, "created_at": str(m.created_at),
        "low_stock": m.quantity <= m.reorder_level,
    }


@router.get("/medicines")
def list_hosp_medicines(
    search: Optional[str] = None,
    current_user: User = Depends(require_roles(UserRole.HOSPITAL_ADMIN)),
    db: Session = Depends(get_db),
):
    q = db.query(HospitalMedicine).filter(HospitalMedicine.hospital_admin_id == current_user.id)
    if search:
        q = q.filter(HospitalMedicine.name.ilike(f"%{search}%"))
    items = q.order_by(HospitalMedicine.name).all()
    return {"items": [_med_dict(m) for m in items], "total": len(items)}


@router.post("/medicines")
def create_hosp_medicine(
    data: HospMedCreate,
    current_user: User = Depends(require_roles(UserRole.HOSPITAL_ADMIN)),
    db: Session = Depends(get_db),
):
    med = HospitalMedicine(
        id=uuid.uuid4(), hospital_admin_id=current_user.id,
        name=data.name, category=data.category,
        quantity=data.quantity, unit=data.unit, price=data.price,
        expiry_date=date.fromisoformat(data.expiry_date) if data.expiry_date else None,
        manufacturer=data.manufacturer, reorder_level=data.reorder_level, notes=data.notes,
    )
    db.add(med)
    db.commit()
    db.refresh(med)
    return _med_dict(med)


@router.put("/medicines/{med_id}")
def update_hosp_medicine(
    med_id: str,
    data: HospMedUpdate,
    current_user: User = Depends(require_roles(UserRole.HOSPITAL_ADMIN)),
    db: Session = Depends(get_db),
):
    med = db.query(HospitalMedicine).filter(
        HospitalMedicine.id == med_id, HospitalMedicine.hospital_admin_id == current_user.id
    ).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medicine not found")
    update_data = data.dict(exclude_none=True)
    if "expiry_date" in update_data:
        update_data["expiry_date"] = date.fromisoformat(update_data["expiry_date"]) if update_data["expiry_date"] else None
    for k, v in update_data.items():
        setattr(med, k, v)
    db.commit()
    return _med_dict(med)


@router.delete("/medicines/{med_id}")
def delete_hosp_medicine(
    med_id: str,
    current_user: User = Depends(require_roles(UserRole.HOSPITAL_ADMIN)),
    db: Session = Depends(get_db),
):
    med = db.query(HospitalMedicine).filter(
        HospitalMedicine.id == med_id, HospitalMedicine.hospital_admin_id == current_user.id
    ).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medicine not found")
    db.delete(med)
    db.commit()
    return {"success": True}


# ─────────────────────────────────────────────────────────────────────────────
# PATIENT VISITS (OPD)
# ─────────────────────────────────────────────────────────────────────────────

class VisitCreate(BaseModel):
    patient_name: str
    patient_phone: Optional[str] = None
    patient_age: Optional[int] = None
    patient_gender: Optional[str] = None
    visit_date: str
    diagnosis: Optional[str] = None
    treatment: Optional[str] = None
    prescription_notes: Optional[str] = None
    next_visit_date: Optional[str] = None
    next_visit_notes: Optional[str] = None
    govt_scheme: Optional[str] = None
    status: str = "VISITED"


class VisitUpdate(BaseModel):
    patient_name: Optional[str] = None
    patient_phone: Optional[str] = None
    patient_age: Optional[int] = None
    patient_gender: Optional[str] = None
    visit_date: Optional[str] = None
    diagnosis: Optional[str] = None
    treatment: Optional[str] = None
    prescription_notes: Optional[str] = None
    next_visit_date: Optional[str] = None
    next_visit_notes: Optional[str] = None
    govt_scheme: Optional[str] = None
    status: Optional[str] = None


def _visit_dict(v: PatientVisit) -> dict:
    return {
        "id": str(v.id), "patient_name": v.patient_name, "patient_phone": v.patient_phone,
        "patient_age": v.patient_age, "patient_gender": v.patient_gender,
        "visit_date": str(v.visit_date), "diagnosis": v.diagnosis,
        "treatment": v.treatment, "prescription_notes": v.prescription_notes,
        "next_visit_date": str(v.next_visit_date) if v.next_visit_date else None,
        "next_visit_notes": v.next_visit_notes, "govt_scheme": v.govt_scheme,
        "status": v.status, "created_at": str(v.created_at),
    }


@router.get("/visits")
def list_visits(
    search: Optional[str] = None,
    upcoming: Optional[bool] = None,
    current_user: User = Depends(require_roles(UserRole.HOSPITAL_ADMIN)),
    db: Session = Depends(get_db),
):
    q = db.query(PatientVisit).filter(PatientVisit.hospital_admin_id == current_user.id)
    if search:
        q = q.filter(PatientVisit.patient_name.ilike(f"%{search}%"))
    if upcoming:
        today = date.today()
        q = q.filter(PatientVisit.next_visit_date != None, PatientVisit.next_visit_date >= today)
    visits = q.order_by(PatientVisit.visit_date.desc()).all()
    return {"items": [_visit_dict(v) for v in visits], "total": len(visits)}


@router.post("/visits")
def create_visit(
    data: VisitCreate,
    current_user: User = Depends(require_roles(UserRole.HOSPITAL_ADMIN)),
    db: Session = Depends(get_db),
):
    visit = PatientVisit(
        id=uuid.uuid4(), hospital_admin_id=current_user.id,
        patient_name=data.patient_name, patient_phone=data.patient_phone,
        patient_age=data.patient_age, patient_gender=data.patient_gender,
        visit_date=date.fromisoformat(data.visit_date),
        diagnosis=data.diagnosis, treatment=data.treatment,
        prescription_notes=data.prescription_notes,
        next_visit_date=date.fromisoformat(data.next_visit_date) if data.next_visit_date else None,
        next_visit_notes=data.next_visit_notes,
        govt_scheme=data.govt_scheme, status=data.status,
    )
    db.add(visit)
    db.commit()
    db.refresh(visit)
    return _visit_dict(visit)


@router.put("/visits/{visit_id}")
def update_visit(
    visit_id: str,
    data: VisitUpdate,
    current_user: User = Depends(require_roles(UserRole.HOSPITAL_ADMIN)),
    db: Session = Depends(get_db),
):
    visit = db.query(PatientVisit).filter(
        PatientVisit.id == visit_id, PatientVisit.hospital_admin_id == current_user.id
    ).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")
    update_data = data.dict(exclude_none=True)
    for date_field in ("visit_date", "next_visit_date"):
        if date_field in update_data and update_data[date_field]:
            update_data[date_field] = date.fromisoformat(update_data[date_field])
    for k, v in update_data.items():
        setattr(visit, k, v)
    db.commit()
    return _visit_dict(visit)


@router.delete("/visits/{visit_id}")
def delete_visit(
    visit_id: str,
    current_user: User = Depends(require_roles(UserRole.HOSPITAL_ADMIN)),
    db: Session = Depends(get_db),
):
    visit = db.query(PatientVisit).filter(
        PatientVisit.id == visit_id, PatientVisit.hospital_admin_id == current_user.id
    ).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")
    db.delete(visit)
    db.commit()
    return {"success": True}


# ─────────────────────────────────────────────────────────────────────────────
# HOSPITAL BILLING
# ─────────────────────────────────────────────────────────────────────────────

def _bill_dict(b: HospitalBill) -> dict:
    return {
        "id": str(b.id), "patient_name": b.patient_name, "patient_phone": b.patient_phone,
        "services_description": b.services_description, "total_amount": b.total_amount,
        "amount_paid": b.amount_paid, "balance": round(b.total_amount - b.amount_paid, 2),
        "payment_method": b.payment_method, "payment_status": b.payment_status,
        "qr_image_url": b.qr_image_url, "govt_scheme": b.govt_scheme,
        "bill_date": str(b.bill_date), "notes": b.notes, "created_at": str(b.created_at),
    }


@router.get("/bills")
def list_bills(
    search: Optional[str] = None,
    payment_status: Optional[str] = None,
    current_user: User = Depends(require_roles(UserRole.HOSPITAL_ADMIN)),
    db: Session = Depends(get_db),
):
    q = db.query(HospitalBill).filter(HospitalBill.hospital_admin_id == current_user.id)
    if search:
        q = q.filter(HospitalBill.patient_name.ilike(f"%{search}%"))
    if payment_status:
        q = q.filter(HospitalBill.payment_status == payment_status.upper())
    bills = q.order_by(HospitalBill.bill_date.desc()).all()
    return {"items": [_bill_dict(b) for b in bills], "total": len(bills)}


@router.post("/bills")
async def create_bill(
    patient_name: str = Form(...),
    bill_date: str = Form(...),
    patient_phone: Optional[str] = Form(None),
    services_description: Optional[str] = Form(None),
    total_amount: float = Form(0.0),
    amount_paid: float = Form(0.0),
    payment_method: str = Form("COD"),
    payment_status: str = Form("PENDING"),
    govt_scheme: Optional[str] = Form(None),
    notes: Optional[str] = Form(None),
    qr_image: Optional[UploadFile] = File(None),
    current_user: User = Depends(require_roles(UserRole.HOSPITAL_ADMIN)),
    db: Session = Depends(get_db),
):
    qr_url = None
    if qr_image and qr_image.filename:
        file_data = await qr_image.read()
        result = upload_image(file_data, folder="hospital_qr")
        if result:
            qr_url = result.get("secure_url") or result.get("url")

    bill = HospitalBill(
        id=uuid.uuid4(), hospital_admin_id=current_user.id,
        patient_name=patient_name, patient_phone=patient_phone,
        services_description=services_description,
        total_amount=total_amount, amount_paid=amount_paid,
        payment_method=payment_method.upper(),
        payment_status=payment_status.upper(),
        qr_image_url=qr_url, govt_scheme=govt_scheme,
        bill_date=date.fromisoformat(bill_date), notes=notes,
    )
    db.add(bill)
    db.commit()
    db.refresh(bill)
    return _bill_dict(bill)


@router.put("/bills/{bill_id}")
def update_bill(
    bill_id: str,
    data: dict,
    current_user: User = Depends(require_roles(UserRole.HOSPITAL_ADMIN)),
    db: Session = Depends(get_db),
):
    bill = db.query(HospitalBill).filter(
        HospitalBill.id == bill_id, HospitalBill.hospital_admin_id == current_user.id
    ).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    for k, v in data.items():
        if hasattr(bill, k) and v is not None:
            setattr(bill, k, v)
    db.commit()
    return _bill_dict(bill)


@router.delete("/bills/{bill_id}")
def delete_bill(
    bill_id: str,
    current_user: User = Depends(require_roles(UserRole.HOSPITAL_ADMIN)),
    db: Session = Depends(get_db),
):
    bill = db.query(HospitalBill).filter(
        HospitalBill.id == bill_id, HospitalBill.hospital_admin_id == current_user.id
    ).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    db.delete(bill)
    db.commit()
    return {"success": True}
