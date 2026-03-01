from datetime import date, datetime, timedelta

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.medicine import Medicine
from app.models.order import Order, OrderStatus
from app.models.order_item import OrderItem
from app.models.user import User
from app.schemas.analytics import AnalyticsSummary, MonthlyDataItem, OrdersByStatusItem, TopMedicineItem

MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']


def _get_daily_data(db: Session) -> list:
    """Aggregate revenue and orders by day for current month (excludes cancelled)."""
    from sqlalchemy import text
    import calendar
    now = datetime.utcnow()
    year, month = now.year, now.month
    days_in_month = calendar.monthrange(year, month)[1]
    ref_date = datetime(year, month, 1)
    rows = db.execute(text("""
        SELECT date_trunc('day', created_at)::date AS day,
               count(id)::int AS orders,
               coalesce(sum(total_amount), 0)::float AS revenue
        FROM orders
        WHERE status IN ('PENDING','CONFIRMED','OUT_FOR_DELIVERY','DELIVERED')
          AND date_trunc('month', created_at) = date_trunc('month', CAST(:ref_date AS timestamp))
        GROUP BY date_trunc('day', created_at)::date
        ORDER BY day
    """), {"ref_date": ref_date}).fetchall()
    data_by_day = {}
    for r in rows:
        dt = r[0]
        day = dt.day if hasattr(dt, 'day') else int(str(dt).split('-')[-1])
        data_by_day[day] = (int(r[1]), round(float(r[2]), 2))
    result = []
    for d in range(1, days_in_month + 1):
        ords, rev = data_by_day.get(d, (0, 0.0))
        result.append(MonthlyDataItem(month=str(d), orders=ords, revenue=rev))
    return result


def get_analytics_summary(db: Session) -> AnalyticsSummary:
    total_orders = db.query(func.count(Order.id)).scalar() or 0
    total_revenue = db.query(func.coalesce(func.sum(Order.total_amount), 0.0)).scalar() or 0.0
    total_users = db.query(func.count(User.id)).scalar() or 0
    low_stock = (
        db.query(Medicine).filter(Medicine.quantity <= Medicine.low_stock_threshold).count()
    )
    expiry_cutoff = date.today() + timedelta(days=7)
    expiring = (
        db.query(Medicine)
        .filter(
            Medicine.expiry_date.isnot(None),
            Medicine.expiry_date <= expiry_cutoff,
            Medicine.expiry_date >= date.today(),
        )
        .count()
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

    monthly_data = _get_daily_data(db)
    return AnalyticsSummary(
        total_orders=total_orders,
        total_revenue=round(float(total_revenue), 2),
        total_users=total_users,
        low_stock_medicines_count=low_stock,
        expiring_medicines_count=expiring,
        orders_by_status=orders_by_status,
        top_medicines=top_medicines,
        monthly_data=monthly_data,
    )
