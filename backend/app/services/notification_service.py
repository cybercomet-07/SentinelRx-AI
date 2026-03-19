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

# Order notification translations: en, hi, mr
_ORDER_PLACED = {
    "en": ("Order placed successfully", "Your order {order_id} has been placed. Total amount: {total_amount}."),
    "hi": ("ऑर्डर सफलतापूर्वक दिया गया", "आपका ऑर्डर {order_id} दिया गया। कुल राशि: {total_amount}।"),
    "mr": ("ऑर्डर यशस्वीरित्या दिला", "तुमचा ऑर्डर {order_id} दिला गेला। एकूण रक्कम: {total_amount}।"),
}
_ORDER_STATUS_UPDATED = {
    "en": ("Order status updated", "Order {order_id} is now {status}."),
    "hi": ("ऑर्डर स्थिति अपडेट", "ऑर्डर {order_id} अब {status} है।"),
    "mr": ("ऑर्डर स्थिती अपडेट", "ऑर्डर {order_id} आता {status} आहे।"),
}
_STATUS_LABELS = {
    "en": {"PENDING": "PENDING", "CONFIRMED": "CONFIRMED", "OUT_FOR_DELIVERY": "OUT FOR DELIVERY", "DELIVERED": "DELIVERED", "CANCELLED": "CANCELLED"},
    "hi": {"PENDING": "लंबित", "CONFIRMED": "पुष्ट", "OUT_FOR_DELIVERY": "डिलीवरी के लिए निकला", "DELIVERED": "डिलीवर", "CANCELLED": "रद्द"},
    "mr": {"PENDING": "प्रलंबित", "CONFIRMED": "पुष्टी", "OUT_FOR_DELIVERY": "डिलिव्हरीसाठी बाहेर", "DELIVERED": "डिलिव्हर", "CANCELLED": "रद्द"},
}


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
    user = db.query(User).filter(User.id == user_id).first()
    lang = (user.preferred_language or "en") if user else "en"
    lang = "en" if lang not in _ORDER_PLACED else lang
    total_str = f"{float(total_amount):.2f}"
    title, msg_tpl = _ORDER_PLACED[lang]
    message = msg_tpl.format(order_id=order_id, total_amount=total_str)
    create_notification(db, user_id=user_id, title=title, message=message, typ=NotificationType.ORDER)


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
            typ=NotificationType.SYSTEM,
        )


def notify_order_status_changed(
    db: Session,
    *,
    user_id: uuid.UUID,
    order_id: uuid.UUID,
    new_status: OrderStatus,
) -> None:
    user = db.query(User).filter(User.id == user_id).first()
    lang = (user.preferred_language or "en") if user else "en"
    lang = "en" if lang not in _ORDER_STATUS_UPDATED else lang
    status_label = _STATUS_LABELS.get(lang, _STATUS_LABELS["en"]).get(new_status.value, new_status.value)
    title, msg_tpl = _ORDER_STATUS_UPDATED[lang]
    message = msg_tpl.format(order_id=order_id, status=status_label)
    create_notification(db, user_id=user_id, title=title, message=message, typ=NotificationType.ORDER)


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


def list_notifications_for_user(db: Session, user: User, page: int, limit: int, jwt_role=None) -> NotificationListResponse:
    query = db.query(Notification).filter(Notification.user_id == user.id)
    # When logged in as User, hide admin-only notification types (new order alerts, low stock, expiry)
    if jwt_role is not None and str(jwt_role.value if hasattr(jwt_role, 'value') else jwt_role).upper() == "USER":
        query = query.filter(Notification.typ.in_([NotificationType.ORDER, NotificationType.REFILL, NotificationType.SYSTEM])
        ).filter(~Notification.title.in_(["New order received", "Low stock alert", "Medicine expiring soon"]))
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
