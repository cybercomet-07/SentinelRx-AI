"""Admin endpoints matching frontend expectations."""
import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps.auth import require_roles
from app.db.session import get_db
from app.models.medicine import Medicine
from app.models.order import Order, OrderStatus
from app.models.user import User, UserRole
from app.services.analytics_service import get_analytics_summary

router = APIRouter(prefix="/admin", tags=["Admin"])
logger = logging.getLogger(__name__)


@router.get("/dashboard")
def get_admin_dashboard(
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Dashboard stats in frontend format (total_users, total_orders, total_revenue, low_stock_count, top_medicines)."""
    try:
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
