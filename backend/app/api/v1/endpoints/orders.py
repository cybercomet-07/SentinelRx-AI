import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps.auth import require_roles
from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.order import OrderListResponse, OrderRead, OrderStatusUpdateRequest
from app.services.order_service import (
    create_order_from_cart,
    get_order_or_404,
    list_all_orders,
    list_orders_for_user,
    update_order_status,
)

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post("/create-from-cart", response_model=OrderRead, status_code=status.HTTP_201_CREATED)
def create_order_from_cart_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.USER)),
):
    return create_order_from_cart(db, current_user)


@router.get("/my", response_model=OrderListResponse)
def list_my_orders_endpoint(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.USER)),
):
    items, total = list_orders_for_user(db, current_user, page=page, limit=limit)
    return OrderListResponse(items=items, total=total, page=page, limit=limit)


@router.get("", response_model=OrderListResponse)
def list_all_orders_endpoint(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    status: str | None = Query(default=None),
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    items, total = list_all_orders(db, page=page, limit=limit, status_filter=status)
    return OrderListResponse(items=items, total=total, page=page, limit=limit)


@router.patch("/{order_id}/status", response_model=OrderRead)
def update_order_status_endpoint(
    order_id: uuid.UUID,
    payload: OrderStatusUpdateRequest,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    order = get_order_or_404(db, order_id)
    return update_order_status(db, order, payload.status)
