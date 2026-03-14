import logging
import uuid

from fastapi import APIRouter, Body, Depends, Query, Request, status
from sqlalchemy.orm import Session

from app.api.deps.auth import require_roles
from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.order import DeliveryAddressInput, OrderListResponse, OrderRead, OrderStatusUpdateRequest
from app.services.order_service import (
    create_order_from_cart,
    get_order_or_404,
    list_all_orders,
    list_orders_for_user,
    update_order_status,
)

router = APIRouter(prefix="/orders", tags=["Orders"])
logger = logging.getLogger(__name__)


@router.post("/create-from-cart", response_model=OrderRead, status_code=status.HTTP_201_CREATED)
async def create_order_from_cart_endpoint(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.USER)),
):
    try:
        body = await request.json() if request.headers.get("content-type", "").startswith("application/json") else {}
    except Exception:
        body = {}
    lat = body.get("delivery_latitude")
    lng = body.get("delivery_longitude")
    if lat is not None and not isinstance(lat, (int, float)):
        try:
            lat = float(lat)
        except (TypeError, ValueError):
            lat = None
    if lng is not None and not isinstance(lng, (int, float)):
        try:
            lng = float(lng)
        except (TypeError, ValueError):
            lng = None
    payment_method = (body.get("payment_method") or "cod").strip().lower()
    if payment_method not in ("cod", "upi"):
        payment_method = "cod"

    payload = DeliveryAddressInput(
        delivery_address=body.get("delivery_address") or None,
        delivery_latitude=lat,
        delivery_longitude=lng,
        address_source=body.get("address_source") or None,
        payment_method=payment_method,
    )
    logger.debug("create-from-cart payload: addr=%s lat=%s lng=%s source=%s payment=%s",
                 payload.delivery_address, payload.delivery_latitude, payload.delivery_longitude,
                 payload.address_source, payload.payment_method)
    return create_order_from_cart(
        db,
        current_user,
        delivery_address=payload.delivery_address,
        delivery_latitude=payload.delivery_latitude,
        delivery_longitude=payload.delivery_longitude,
        address_source=payload.address_source,
        payment_method=payload.payment_method or "cod",
    )


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
