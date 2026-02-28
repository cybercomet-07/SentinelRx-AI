import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.cart import Cart
from app.models.medicine import Medicine
from app.models.user import User
from app.schemas.cart import CartItemRead, CartReadResponse


def add_to_cart(db: Session, user: User, medicine_id: uuid.UUID, quantity: int) -> Cart:
    medicine = db.query(Medicine).filter(Medicine.id == medicine_id).first()
    if not medicine:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medicine not found")

    existing_item = (
        db.query(Cart)
        .filter(Cart.user_id == user.id, Cart.medicine_id == medicine_id)
        .first()
    )

    requested_total = quantity + (existing_item.quantity if existing_item else 0)
    if requested_total > medicine.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient stock. Available: {medicine.quantity}",
        )

    if existing_item:
        existing_item.quantity = requested_total
        db.commit()
        db.refresh(existing_item)
        return existing_item

    new_item = Cart(user_id=user.id, medicine_id=medicine_id, quantity=quantity)
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item


def get_user_cart(db: Session, user: User) -> CartReadResponse:
    rows = (
        db.query(Cart, Medicine)
        .join(Medicine, Cart.medicine_id == Medicine.id)
        .filter(Cart.user_id == user.id)
        .order_by(Cart.id.asc())
        .all()
    )

    items: list[CartItemRead] = []
    total_items = 0
    total_amount = 0.0
    for cart, medicine in rows:
        line_total = medicine.price * cart.quantity
        total_items += cart.quantity
        total_amount += line_total
        items.append(
            CartItemRead(
                id=cart.id,
                medicine_id=medicine.id,
                medicine_name=medicine.name,
                medicine_price=medicine.price,
                quantity=cart.quantity,
                line_total=line_total,
            )
        )

    return CartReadResponse(items=items, total_items=total_items, total_amount=round(total_amount, 2))


def delete_cart_item(db: Session, user: User, item_id: uuid.UUID) -> None:
    item = db.query(Cart).filter(Cart.id == item_id, Cart.user_id == user.id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart item not found")
    db.delete(item)
    db.commit()
