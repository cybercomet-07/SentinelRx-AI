"""Admin endpoints matching frontend expectations."""
import logging
from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps.auth import require_roles
from app.db.session import get_db
from app.models.medicine import Medicine
from app.models.order import Order, OrderStatus
from app.models.user import User, UserRole
from app.models.appointment import Appointment
from app.models.prescription import Prescription
from app.models.hospital import HospitalBed, HospitalAdmission, HospitalMedicine, PatientVisit, HospitalBill, BedStatus, AdmissionStatus
from app.models.ngo import NGOBeneficiary, NGOBloodCamp, NGODonationDrive
from app.services.analytics_service import get_analytics_summary
from app.services.notification_service import notify_expiring_medicines_to_admins

router = APIRouter(prefix="/admin", tags=["Admin"])
logger = logging.getLogger(__name__)


@router.get("/dashboard")
def get_admin_dashboard(
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Dashboard stats in frontend format (total_users, total_orders, total_revenue, low_stock_count, expiring_medicines_count, top_medicines)."""
    try:
        notify_expiring_medicines_to_admins(db, days_ahead=7)
        summary = get_analytics_summary(db)
    except Exception as e:
        logger.exception("Dashboard analytics failed")
        raise HTTPException(status_code=500, detail=str(e)) from e
    top_medicines = [
        {"id": str(m.medicine_id), "name": m.medicine_name, "orders": m.units_sold}
        for m in summary.top_medicines
    ]
    monthly_data = [{"month": m.month, "orders": m.orders, "revenue": m.revenue} for m in summary.monthly_data]
    return {
        "total_users": summary.total_users,
        "total_orders": summary.total_orders,
        "total_revenue": summary.total_revenue,
        "low_stock_count": summary.low_stock_medicines_count,
        "expiring_medicines_count": summary.expiring_medicines_count,
        "monthly_data": monthly_data,
        "top_medicines": top_medicines,
    }


@router.get("/chart-data")
def get_admin_chart_data(
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Chart data: daily revenue and orders for current month from DB."""
    summary = get_analytics_summary(db)
    return {
        "monthly_data": [{"month": m.month, "orders": m.orders, "revenue": m.revenue} for m in summary.monthly_data],
    }


@router.get("/users")
def list_admin_users(
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """List all users for admin."""
    users = db.query(User).order_by(User.created_at.desc()).all()
    return [
        {
            "id": str(u.id),
            "name": u.name,
            "email": u.email,
            "role": u.role.value,
            "active": u.is_active,
        }
        for u in users
    ]


@router.get("/orders/map")
def list_orders_for_map(
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Orders with delivery location for map pins. Excludes cancelled."""
    orders = (
        db.query(Order)
        .filter(
            Order.delivery_latitude.isnot(None),
            Order.delivery_longitude.isnot(None),
            Order.status != OrderStatus.CANCELLED,
        )
        .order_by(Order.created_at.desc())
        .limit(200)
        .all()
    )
    return [
        {
            "id": str(o.id),
            "user_name": o.user_name,
            "total_amount": o.total_amount,
            "status": o.status.value,
            "delivery_address": o.delivery_address,
            "delivery_latitude": o.delivery_latitude,
            "delivery_longitude": o.delivery_longitude,
            "address_source": o.address_source,
        }
        for o in orders
    ]


@router.get("/medicines/expiring-soon")
def list_expiring_medicines(
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """List medicines expiring within the next 7 days."""
    expiry_cutoff = date.today() + timedelta(days=7)
    items = (
        db.query(Medicine)
        .filter(
            Medicine.expiry_date.isnot(None),
            Medicine.expiry_date <= expiry_cutoff,
            Medicine.expiry_date >= date.today(),
        )
        .order_by(Medicine.expiry_date.asc())
        .all()
    )
    return [
        {
            "id": str(m.id),
            "name": m.name,
            "quantity": m.quantity,
            "expiry_date": m.expiry_date.isoformat() if m.expiry_date else None,
            "manufacturing_date": m.manufacturing_date.isoformat() if m.manufacturing_date else None,
        }
        for m in items
    ]


@router.get("/super-stats")
def get_super_admin_stats(
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Universal CEO/Super-admin dashboard stats — aggregates all system data."""
    # ── Pharmacy ──────────────────────────────────────────────────────────────
    total_users       = db.query(User).filter(User.role == UserRole.USER).count()
    total_doctors     = db.query(User).filter(User.role == UserRole.DOCTOR).count()
    total_hospitals   = db.query(User).filter(User.role == UserRole.HOSPITAL_ADMIN).count()
    total_ngos        = db.query(User).filter(User.role == UserRole.NGO).count()
    total_orders      = db.query(Order).count()
    pending_orders    = db.query(Order).filter(Order.status == OrderStatus.PENDING).count()
    total_revenue     = db.query(Order).with_entities(
        func.sum(Order.total_amount)
    ).scalar() or 0.0
    total_medicines   = db.query(Medicine).count()
    low_stock_meds    = db.query(Medicine).filter(Medicine.quantity <= Medicine.low_stock_threshold).count()
    total_prescriptions = db.query(Prescription).count()

    # ── Appointments ──────────────────────────────────────────────────────────
    total_appointments  = db.query(Appointment).count()
    pending_appts       = db.query(Appointment).filter(Appointment.status == "PENDING").count()
    confirmed_appts     = db.query(Appointment).filter(Appointment.status == "CONFIRMED").count()

    # ── Hospital ──────────────────────────────────────────────────────────────
    total_beds          = db.query(HospitalBed).count()
    available_beds      = db.query(HospitalBed).filter(HospitalBed.status == BedStatus.AVAILABLE).count()
    occupied_beds       = db.query(HospitalBed).filter(HospitalBed.status == BedStatus.OCCUPIED).count()
    total_admissions    = db.query(HospitalAdmission).count()
    active_admissions   = db.query(HospitalAdmission).filter(
        HospitalAdmission.status == AdmissionStatus.ADMITTED).count()
    total_visits        = db.query(PatientVisit).count()
    hospital_meds       = db.query(HospitalMedicine).count()
    total_bills         = db.query(HospitalBill).count()
    billing_revenue     = db.query(HospitalBill).with_entities(
        func.sum(HospitalBill.amount_paid)
    ).scalar() or 0.0
    pending_bills       = db.query(HospitalBill).filter(HospitalBill.payment_status == "PENDING").count()

    # ── NGO ───────────────────────────────────────────────────────────────────
    total_beneficiaries   = db.query(NGOBeneficiary).count()
    scheme_eligible       = db.query(NGOBeneficiary).filter(NGOBeneficiary.scheme_eligible == True).count()
    total_blood_camps     = db.query(NGOBloodCamp).count()
    units_collected       = db.query(NGOBloodCamp).with_entities(
        func.sum(NGOBloodCamp.collected_units)
    ).scalar() or 0
    total_drives          = db.query(NGODonationDrive).count()
    ngo_donations_raised  = db.query(NGODonationDrive).with_entities(
        func.sum(NGODonationDrive.raised_amount)
    ).scalar() or 0.0

    # ── Recent activity: last 5 orders ────────────────────────────────────────
    recent_orders = db.query(Order).order_by(Order.created_at.desc()).limit(5).all()
    recent_orders_list = [
        {"id": str(o.id)[:8], "user": o.user_name, "amount": o.total_amount,
         "status": o.status.value, "date": str(o.created_at)[:10]}
        for o in recent_orders
    ]

    # ── Recent admissions ─────────────────────────────────────────────────────
    recent_admissions = db.query(HospitalAdmission).order_by(
        HospitalAdmission.admit_date.desc()).limit(5).all()
    recent_admissions_list = [
        {"id": str(a.id)[:8], "patient": a.patient_name, "ward": a.ward or "—",
         "status": a.status.value if a.status else "—", "date": str(a.admit_date)}
        for a in recent_admissions
    ]

    return {
        "pharmacy": {
            "total_users": total_users,
            "total_orders": total_orders,
            "pending_orders": pending_orders,
            "total_revenue": round(float(total_revenue), 2),
            "total_medicines": total_medicines,
            "low_stock_count": low_stock_meds,
            "total_prescriptions": total_prescriptions,
        },
        "doctors": {
            "total_doctors": total_doctors,
            "total_appointments": total_appointments,
            "pending_appointments": pending_appts,
            "confirmed_appointments": confirmed_appts,
        },
        "hospital": {
            "total_hospitals": total_hospitals,
            "total_beds": total_beds,
            "available_beds": available_beds,
            "occupied_beds": occupied_beds,
            "total_admissions": total_admissions,
            "active_admissions": active_admissions,
            "total_visits": total_visits,
            "hospital_medicines": hospital_meds,
            "total_bills": total_bills,
            "billing_revenue": round(float(billing_revenue), 2),
            "pending_bills": pending_bills,
        },
        "ngo": {
            "total_ngos": total_ngos,
            "total_beneficiaries": total_beneficiaries,
            "scheme_eligible": scheme_eligible,
            "total_blood_camps": total_blood_camps,
            "units_collected": int(units_collected),
            "total_donation_drives": total_drives,
            "ngo_donations_raised": round(float(ngo_donations_raised), 2),
        },
        "recent_orders": recent_orders_list,
        "recent_admissions": recent_admissions_list,
    }


@router.get("/medicines/low-stock")
def list_low_stock_medicines(
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """List medicines at or below low_stock_threshold."""
    items = (
        db.query(Medicine)
        .filter(Medicine.quantity <= Medicine.low_stock_threshold)
        .order_by(Medicine.quantity.asc())
        .all()
    )
    return [
        {
            "id": str(m.id),
            "name": m.name,
            "quantity": m.quantity,
            "low_stock_threshold": m.low_stock_threshold,
        }
        for m in items
    ]
