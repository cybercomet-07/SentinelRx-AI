"""Admin endpoints matching frontend expectations."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps.auth import require_roles
from app.db.session import get_db
from app.models.medicine import Medicine
from app.models.user import User, UserRole
from app.services.analytics_service import get_analytics_summary

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/dashboard")
def get_admin_dashboard(
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Dashboard stats in frontend format (total_users, total_orders, total_revenue, low_stock_count, top_medicines)."""
    summary = get_analytics_summary(db)
    top_medicines = [
        {"id": str(m.medicine_id), "name": m.medicine_name, "orders": m.units_sold}
        for m in summary.top_medicines
    ]
    return {
        "total_users": summary.total_users,
        "total_orders": summary.total_orders,
        "total_revenue": summary.total_revenue,
        "low_stock_count": summary.low_stock_medicines_count,
        "monthly_data": [],  # Backend doesn't track monthly yet
        "top_medicines": top_medicines,
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
