import uuid
from datetime import date, datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.models.medicine import Medicine
from app.models.notification import Notification, NotificationType
from app.models.order import OrderStatus
from app.models.user import User, UserRole
from app.schemas.notification import NotificationListResponse, NotificationRead


def create_notification(
    db: Session,
    *,
    user_id: uuid.UUID,
    title: str,
    message: str,
    typ: NotificationType,
) -> None:
    db.add(Notification(user_id=user_id, title=title, message=message, typ=typ, is_read=False))


def notify_order_created(db: Session, *, user_id: uuid.UUID, order_id: uuid.UUID, total_amount: float) -> None:
    create_notification(
        db,
        user_id=user_id,
        title="Order placed successfully",
        message=f"Your order {order_id} has been placed. Total amount: {total_amount}.",
        typ=NotificationType.ORDER,
    )


def notify_admins_new_order(
    db: Session,
    *,
    order_id: uuid.UUID,
    customer_name: str,
    total_amount: float,
    source: str = "order",
) -> None:
    """Notify all admins when a new order is placed (AI or manual)."""
    admins = db.query(User).filter(User.role == UserRole.ADMIN, User.is_active.is_(True)).all()
    src_label = "AI chat" if source == "ai_chat" else "manual"
    total_str = f"{float(total_amount):.2f}"
    for admin in admins:
        create_notification(
            db,
            user_id=admin.id,
            title="New order received",
            message=f"Order {order_id} placed by {customer_name} via {src_label}. Total: ₹{total_str}.",
            typ=NotificationType.ORDER,
        )


def notify_order_status_changed(
    db: Session,
    *,
    user_id: uuid.UUID,
    order_id: uuid.UUID,
    new_status: OrderStatus,
) -> None:
    create_notification(
        db,
        user_id=user_id,
        title="Order status updated",
        message=f"Order {order_id} is now {new_status.value}.",
        typ=NotificationType.ORDER,
    )


def notify_expiring_medicines_to_admins(db: Session, *, days_ahead: int = 7) -> None:
    """Create notifications for admins about medicines expiring soon. Avoids duplicates within 7 days."""
    expiry_cutoff = date.today() + timedelta(days=days_ahead)
    expiring = (
        db.query(Medicine)
        .filter(
            Medicine.expiry_date.isnot(None),
            Medicine.expiry_date <= expiry_cutoff,
            Medicine.expiry_date >= date.today(),
        )
        .all()
    )
    if not expiring:
        return
    cutoff_ts = datetime.utcnow() - timedelta(days=7)
    for m in expiring:
        exists = db.execute(
            text(
                "SELECT 1 FROM medicine_expiry_notification WHERE medicine_id = :mid AND notified_at > :cutoff LIMIT 1"
            ),
            {"mid": str(m.id), "cutoff": cutoff_ts},
        ).scalar()
        if exists:
            continue
        db.execute(
            text("INSERT INTO medicine_expiry_notification (id, medicine_id, notified_at) VALUES (:uid, :mid, :now)"),
            {"uid": str(uuid.uuid4()), "mid": str(m.id), "now": datetime.utcnow()},
        )
        admins = db.query(User).filter(User.role == UserRole.ADMIN, User.is_active.is_(True)).all()
        for admin in admins:
            create_notification(
                db,
                user_id=admin.id,
                title="Medicine expiring soon",
                message=f"{m.name} expires on {m.expiry_date.isoformat()}. Current stock: {m.quantity}.",
                typ=NotificationType.EXPIRING_MEDICINE,
            )
    db.commit()


def notify_low_stock_to_admins(
    db: Session,
    *,
    medicine_name: str,
    quantity: int,
    threshold: int,
) -> None:
    admins = db.query(User).filter(User.role == UserRole.ADMIN, User.is_active.is_(True)).all()
    for admin in admins:
        create_notification(
            db,
            user_id=admin.id,
            title="Low stock alert",
            message=f"{medicine_name} stock is low ({quantity}) below threshold ({threshold}).",
            typ=NotificationType.LOW_STOCK,
        )


def list_notifications_for_user(db: Session, user: User, page: int, limit: int) -> NotificationListResponse:
    query = db.query(Notification).filter(Notification.user_id == user.id)
    total = query.count()
    rows = (
        query.order_by(Notification.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )
    items = [
        NotificationRead(
            id=row.id,
            title=row.title,
            message=row.message,
            typ=row.typ,
            is_read=row.is_read,
            created_at=row.created_at,
        )
        for row in rows
    ]
    return NotificationListResponse(items=items, total=total, page=page, limit=limit)


def mark_notification_read(db: Session, user: User, notification_id: uuid.UUID) -> NotificationRead:
    row = (
        db.query(Notification)
        .filter(Notification.id == notification_id, Notification.user_id == user.id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")

    row.is_read = True
    db.commit()
    db.refresh(row)
    return NotificationRead(
        id=row.id,
        title=row.title,
        message=row.message,
        typ=row.typ,
        is_read=row.is_read,
        created_at=row.created_at,
    )
