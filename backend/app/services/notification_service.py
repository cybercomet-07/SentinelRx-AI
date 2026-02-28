import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

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
