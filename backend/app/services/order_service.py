import re
import uuid
from collections import defaultdict

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.cart import Cart
from app.models.medicine import Medicine
from app.models.order import Order, OrderStatus
from app.models.order_item import OrderItem
from app.models.user import User
from app.schemas.order import OrderItemRead, OrderRead
from app.services.geocoding_service import geocode_address
from app.services.notification_service import notify_order_created, notify_order_status_changed, notify_admins_new_order
from app.invoice.invoice_service import try_send_order_confirmation_email


STATUS_TRANSITIONS: dict[OrderStatus, set[OrderStatus]] = {
    OrderStatus.PENDING: {OrderStatus.CONFIRMED, OrderStatus.CANCELLED},
    OrderStatus.CONFIRMED: {OrderStatus.OUT_FOR_DELIVERY, OrderStatus.CANCELLED},
    OrderStatus.OUT_FOR_DELIVERY: {OrderStatus.DELIVERED},
    OrderStatus.DELIVERED: set(),
    OrderStatus.CANCELLED: set(),
}


def _build_order_read(db: Session, order: Order) -> OrderRead:
    rows = (
        db.query(OrderItem, Medicine)
        .join(Medicine, Medicine.id == OrderItem.medicine_id)
        .filter(OrderItem.order_id == order.id)
        .order_by(OrderItem.id.asc())
        .all()
    )
    items = [
        OrderItemRead(
            id=item.id,
            medicine_id=item.medicine_id,
            medicine_name=medicine.name,
            quantity=item.quantity,
            unit_price=item.price,
            line_total=round(item.price * item.quantity, 2),
        )
        for item, medicine in rows
    ]
    user = db.query(User).filter(User.id == order.user_id).first()
    name = order.user_name or (user.name if user else None)
    email = user.email if user else None
    return OrderRead(
        id=order.id,
        user_id=order.user_id,
        user_name=name,
        user_email=email,
        user={"name": name, "email": email} if (name or email) else None,
        total_amount=order.total_amount,
        status=order.status,
        created_at=order.created_at,
        updated_at=order.updated_at,
        items=items,
        delivery_address=order.delivery_address,
        delivery_latitude=order.delivery_latitude,
        delivery_longitude=order.delivery_longitude,
        address_source=order.address_source,
    )


def _build_order_list(db: Session, orders: list[Order]) -> list[OrderRead]:
    if not orders:
        return []

    order_ids = [order.id for order in orders]
    user_ids = list({o.user_id for o in orders})
    users = {u.id: u for u in db.query(User).filter(User.id.in_(user_ids)).all()}

    rows = (
        db.query(OrderItem, Medicine)
        .join(Medicine, Medicine.id == OrderItem.medicine_id)
        .filter(OrderItem.order_id.in_(order_ids))
        .all()
    )
    grouped: dict[uuid.UUID, list[OrderItemRead]] = defaultdict(list)
    for item, medicine in rows:
        grouped[item.order_id].append(
            OrderItemRead(
                id=item.id,
                medicine_id=item.medicine_id,
                medicine_name=medicine.name,
                quantity=item.quantity,
                unit_price=item.price,
                line_total=round(item.price * item.quantity, 2),
            )
        )

    result = []
    for order in orders:
        u = users.get(order.user_id)
        if not u and hasattr(order, "user") and order.user:
            u = order.user
        name = order.user_name or (u.name if u else None)
        email = u.email if u else None
        result.append(OrderRead(
            id=order.id,
            user_id=order.user_id,
            user_name=name,
            user_email=email,
            user={"name": name, "email": email} if (name or email) else None,
            total_amount=order.total_amount,
            status=order.status,
            created_at=order.created_at,
            updated_at=order.updated_at,
            items=grouped.get(order.id, []),
            delivery_address=order.delivery_address,
            delivery_latitude=order.delivery_latitude,
            delivery_longitude=order.delivery_longitude,
            address_source=order.address_source,
        ))
    return result


def create_order_from_cart(
    db: Session,
    user: User,
    delivery_address: str | None = None,
    delivery_latitude: float | None = None,
    delivery_longitude: float | None = None,
    address_source: str | None = None,
) -> OrderRead:
    cart_items = db.query(Cart).filter(Cart.user_id == user.id).all()
    if not cart_items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cart is empty")

    medicine_ids = [item.medicine_id for item in cart_items]
    medicines = (
        db.query(Medicine)
        .filter(Medicine.id.in_(medicine_ids))
        .with_for_update()
        .all()
    )
    medicine_map = {medicine.id: medicine for medicine in medicines}

    for cart_item in cart_items:
        medicine = medicine_map.get(cart_item.medicine_id)
        if not medicine:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medicine not found in cart")
        if cart_item.quantity > medicine.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for {medicine.name}. Available: {medicine.quantity}",
            )

    # Resolve lat/lng: use provided coords, else parse "Location: lat, lng" from address, else geocode
    lat, lng = delivery_latitude, delivery_longitude
    if (lat is None or lng is None) and delivery_address:
        m = re.search(r"Location:\s*([+-]?\d+\.?\d*)\s*,\s*([+-]?\d+\.?\d*)", delivery_address.strip(), re.I)
        if m:
            try:
                lat, lng = float(m.group(1)), float(m.group(2))
            except (ValueError, TypeError):
                lat, lng = geocode_address(delivery_address)
        else:
            lat, lng = geocode_address(delivery_address)

    order = Order(
        user_id=user.id,
        user_name=user.name,
        total_amount=0.0,
        status=OrderStatus.PENDING,
        delivery_address=delivery_address,
        delivery_latitude=lat or delivery_latitude,
        delivery_longitude=lng or delivery_longitude,
        address_source=address_source,
    )
    db.add(order)
    db.flush()

    total_amount = 0.0
    for cart_item in cart_items:
        medicine = medicine_map[cart_item.medicine_id]
        line_total = medicine.price * cart_item.quantity
        total_amount += line_total

        db.add(
            OrderItem(
                order_id=order.id,
                medicine_id=medicine.id,
                quantity=cart_item.quantity,
                price=medicine.price,
            )
        )
        medicine.quantity -= cart_item.quantity

    order.total_amount = round(total_amount, 2)
    db.query(Cart).filter(Cart.user_id == user.id).delete()
    notify_order_created(db, user_id=user.id, order_id=order.id, total_amount=order.total_amount)
    notify_admins_new_order(db, order_id=order.id, customer_name=user.name, total_amount=order.total_amount, source="manual")
    db.commit()
    db.refresh(order)

    try_send_order_confirmation_email(db, order.id)

    return _build_order_read(db, order)


def list_orders_for_user(db: Session, user: User, page: int, limit: int) -> tuple[list[OrderRead], int]:
    query = db.query(Order).filter(Order.user_id == user.id)
    total = query.count()
    orders = query.order_by(Order.created_at.desc()).offset((page - 1) * limit).limit(limit).all()
    return _build_order_list(db, orders), total


def _build_order_list_with_users(
    db: Session, orders_with_users: list[tuple[Order, User | None]]
) -> list[OrderRead]:
    if not orders_with_users:
        return []
    orders = [o for o, _ in orders_with_users]
    user_by_order = {o.id: u for o, u in orders_with_users}
    order_ids = [o.id for o in orders]
    rows = (
        db.query(OrderItem, Medicine)
        .join(Medicine, Medicine.id == OrderItem.medicine_id)
        .filter(OrderItem.order_id.in_(order_ids))
        .all()
    )
    grouped: dict[uuid.UUID, list[OrderItemRead]] = defaultdict(list)
    for item, medicine in rows:
        grouped[item.order_id].append(
            OrderItemRead(
                id=item.id,
                medicine_id=item.medicine_id,
                medicine_name=medicine.name,
                quantity=item.quantity,
                unit_price=item.price,
                line_total=round(item.price * item.quantity, 2),
            )
        )
    result = []
    for order in orders:
        u = user_by_order.get(order.id)
        # Prefer order.user_name (stored in DB) for new orders; fall back to joined User for old orders
        name = order.user_name or (u.name if u else None)
        email = u.email if u else None
        result.append(OrderRead(
            id=order.id,
            user_id=order.user_id,
            user_name=name,
            user_email=email,
            user={"name": name, "email": email} if (name or email) else None,
            total_amount=order.total_amount,
            status=order.status,
            created_at=order.created_at,
            updated_at=order.updated_at,
            items=grouped.get(order.id, []),
            delivery_address=order.delivery_address,
            delivery_latitude=order.delivery_latitude,
            delivery_longitude=order.delivery_longitude,
            address_source=order.address_source,
        ))
    return result


def list_all_orders(
    db: Session, page: int, limit: int, status_filter: str | None = None
) -> tuple[list[OrderRead], int]:
    query = db.query(Order)
    if status_filter:
        try:
            query = query.filter(Order.status == OrderStatus(status_filter))
        except ValueError:
            pass
    total = query.count()
    orders = query.order_by(Order.created_at.desc()).offset((page - 1) * limit).limit(limit).all()
    user_ids = list({o.user_id for o in orders})
    users = {u.id: u for u in db.query(User).filter(User.id.in_(user_ids)).all()}
    orders_with_users = [(o, users.get(o.user_id)) for o in orders]
    return _build_order_list_with_users(db, orders_with_users), total


def get_order_or_404(db: Session, order_id: uuid.UUID) -> Order:
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return order


def cancel_order_for_user(db: Session, order: Order, user: User) -> OrderRead:
    """Cancel order and restore stock. User must own the order."""
    if order.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your order")
    if order.status in (OrderStatus.CANCELLED, OrderStatus.DELIVERED, OrderStatus.OUT_FOR_DELIVERY):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel order in {order.status.value} status",
        )
    # Restore stock
    for item in db.query(OrderItem).filter(OrderItem.order_id == order.id).all():
        med = db.query(Medicine).filter(Medicine.id == item.medicine_id).with_for_update().first()
        if med:
            med.quantity += item.quantity
    order.status = OrderStatus.CANCELLED
    notify_order_status_changed(db, user_id=order.user_id, order_id=order.id, new_status=OrderStatus.CANCELLED)
    db.commit()
    db.refresh(order)
    return _build_order_read(db, order)


def update_order_status(db: Session, order: Order, new_status: OrderStatus) -> OrderRead:
    if new_status == order.status:
        return _build_order_read(db, order)

    allowed = STATUS_TRANSITIONS[order.status]
    if new_status not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status transition: {order.status.value} -> {new_status.value}",
        )

    order.status = new_status
    notify_order_status_changed(db, user_id=order.user_id, order_id=order.id, new_status=new_status)
    db.commit()
    db.refresh(order)
    return _build_order_read(db, order)
