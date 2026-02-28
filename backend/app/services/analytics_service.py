from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.medicine import Medicine
from app.models.order import Order, OrderStatus
from app.models.order_item import OrderItem
from app.models.user import User
from app.schemas.analytics import AnalyticsSummary, OrdersByStatusItem, TopMedicineItem


def get_analytics_summary(db: Session) -> AnalyticsSummary:
    total_orders = db.query(func.count(Order.id)).scalar() or 0
    total_revenue = db.query(func.coalesce(func.sum(Order.total_amount), 0.0)).scalar() or 0.0
    total_users = db.query(func.count(User.id)).scalar() or 0
    low_stock = (
        db.query(Medicine).filter(Medicine.quantity <= Medicine.low_stock_threshold).count()
    )

    status_counts = (
        db.query(Order.status, func.count(Order.id))
        .group_by(Order.status)
        .all()
    )
    status_map = {s: c for s, c in status_counts}
    orders_by_status = [
        OrdersByStatusItem(status=status, count=status_map.get(status, 0))
        for status in OrderStatus
    ]

    top_rows = (
        db.query(
            OrderItem.medicine_id,
            func.sum(OrderItem.quantity).label("units"),
            func.sum(OrderItem.quantity * OrderItem.price).label("revenue"),
        )
        .group_by(OrderItem.medicine_id)
        .order_by(func.sum(OrderItem.quantity * OrderItem.price).desc())
        .limit(10)
        .all()
    )
    medicine_ids = [r.medicine_id for r in top_rows]
    medicines = db.query(Medicine).filter(Medicine.id.in_(medicine_ids)).all()
    medicine_map = {m.id: m for m in medicines}
    top_medicines = [
        TopMedicineItem(
            medicine_id=r.medicine_id,
            medicine_name=(medicine_map[r.medicine_id].name if r.medicine_id in medicine_map else "Unknown"),
            units_sold=int(r.units),
            revenue=round(float(r.revenue), 2),
        )
        for r in top_rows
    ]

    return AnalyticsSummary(
        total_orders=total_orders,
        total_revenue=round(float(total_revenue), 2),
        total_users=total_users,
        low_stock_medicines_count=low_stock,
        orders_by_status=orders_by_status,
        top_medicines=top_medicines,
    )
