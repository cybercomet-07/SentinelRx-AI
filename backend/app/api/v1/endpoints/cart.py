import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps.auth import require_roles
from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.cart import CartAddRequest, CartReadResponse
from app.services.cart_service import add_to_cart, delete_cart_item, get_user_cart

router = APIRouter(prefix="/cart", tags=["Cart"])


@router.post("/add", status_code=status.HTTP_201_CREATED)
def add_to_cart_endpoint(
    payload: CartAddRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.USER, UserRole.ADMIN)),
):
    item = add_to_cart(db, current_user, payload.medicine_id, payload.quantity)
    return {
        "message": "Medicine added to cart",
        "item_id": str(item.id),
        "medicine_id": str(item.medicine_id),
        "quantity": item.quantity,
    }


@router.get("", response_model=CartReadResponse)
def get_cart_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.USER, UserRole.ADMIN)),
):
    return get_user_cart(db, current_user)


@router.delete("/{item_id}")
def delete_cart_item_endpoint(
    item_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.USER, UserRole.ADMIN)),
):
    delete_cart_item(db, current_user, item_id)
    return {"message": "Cart item removed"}
