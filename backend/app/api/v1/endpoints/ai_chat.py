"""
AI Chat endpoints - Agentic chatbot integration.
Text + voice ordering, medicine autocomplete, order processing.
"""
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps.auth import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.services.ai_chat_service import (
    chat,
    get_medicines_for_autocomplete,
    process_order_from_chat,
)
from app.services.order_service import cancel_order_for_user, get_order_or_404

router = APIRouter(prefix="/ai-chat", tags=["AI Chat"])


class ChatRequest(BaseModel):
    message: str


@router.post("/chat")
def ai_chat(
    data: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Chat with AI - order medicines by text or get health answers."""
    result = chat(db, data.message.strip(), current_user.id)
    return JSONResponse(content=result)


@router.get("/medicines")
def list_medicines_autocomplete(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List medicines for autocomplete (product_name)."""
    items = get_medicines_for_autocomplete(db)
    return JSONResponse(content={"medicine_list": items})


class OrderItemInput(BaseModel):
    medicine_name: str
    quantity: int = 1


class ProcessOrderRequest(BaseModel):
    order_id: str = ""
    action: str = "confirm"
    items: list[OrderItemInput] = []
    delivery_address: str | None = None
    delivery_latitude: float | None = None
    delivery_longitude: float | None = None
    address_source: str | None = None


@router.post("/process-order")
def process_order(
    payload: ProcessOrderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Process order confirm/cancel from chat. Accepts JSON payload."""
    try:
        form_data = {
            "order_id": payload.order_id.strip(),
            "action": payload.action.strip().lower(),
            "items": [{"medicine_name": i.medicine_name, "quantity": i.quantity} for i in payload.items],
            "delivery_address": payload.delivery_address,
            "delivery_latitude": payload.delivery_latitude,
            "delivery_longitude": payload.delivery_longitude,
            "address_source": payload.address_source,
        }
        result = process_order_from_chat(db, form_data, current_user.id)
        return JSONResponse(content=result)
    except Exception as e:
        import logging
        logging.exception("process-order failed")
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "order_id": None,
                "message": str(e),
                "items": [],
            },
        )


class OrderActionRequest(BaseModel):
    action: str  # "cancel" | "edit"


@router.post("/order/{order_id}/action")
def order_action(
    order_id: uuid.UUID,
    payload: OrderActionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Cancel or edit a confirmed order from chat."""
    order = get_order_or_404(db, order_id)
    action = (payload.action or "").strip().lower()
    if action == "cancel":
        result = cancel_order_for_user(db, order, current_user)
        return JSONResponse(
            content={
                "status": "cancelled",
                "order_id": str(result.id),
                "message": "Order cancelled successfully.",
            }
        )
    if action == "edit":
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Edit order: please visit Order History to modify.",
        )
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid action")
