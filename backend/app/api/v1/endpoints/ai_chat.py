"""
AI Chat endpoints - Agentic chatbot integration.
Text + voice ordering, medicine autocomplete, order processing, chat sessions.
"""
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps.auth import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.models.chat_session import ChatSession
from app.services.ai_chat_service import (
    chat,
    get_medicines_for_autocomplete,
    process_order_from_chat,
)
from app.services.symptom_chat_service import symptom_chat
from app.services.order_service import cancel_order_for_user, get_order_or_404

router = APIRouter(prefix="/ai-chat", tags=["AI Chat"])


# --- Chat Sessions (ChatGPT-style history) ---

@router.get("/sessions")
def list_chat_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all chat sessions for the current user."""
    sessions = (
        db.query(ChatSession)
        .filter(ChatSession.user_id == current_user.id)
        .order_by(ChatSession.updated_at.desc())
        .all()
    )
    return JSONResponse(
        content={
            "sessions": [
                {
                    "id": s.id,
                    "title": s.title,
                    "messages": s.messages,
                    "createdAt": s.created_at.isoformat() if s.created_at else None,
                    "updatedAt": s.updated_at.isoformat() if s.updated_at else None,
                }
                for s in sessions
            ]
        }
    )


class CreateSessionRequest(BaseModel):
    id: str
    title: str = "New chat"
    messages: list = []


@router.post("/sessions")
def create_chat_session(
    data: CreateSessionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new chat session."""
    existing = db.query(ChatSession).filter(
        ChatSession.id == data.id,
        ChatSession.user_id == current_user.id,
    ).first()
    if existing:
        return JSONResponse(
            content={
                "id": existing.id,
                "title": existing.title,
                "messages": existing.messages,
                "createdAt": existing.created_at.isoformat() if existing.created_at else None,
                "updatedAt": existing.updated_at.isoformat() if existing.updated_at else None,
            }
        )
    session = ChatSession(
        id=data.id,
        user_id=current_user.id,
        title=data.title or "New chat",
        messages=data.messages or [],
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return JSONResponse(
        content={
            "id": session.id,
            "title": session.title,
            "messages": session.messages,
            "createdAt": session.created_at.isoformat() if session.created_at else None,
            "updatedAt": session.updated_at.isoformat() if session.updated_at else None,
        }
    )


class UpdateSessionRequest(BaseModel):
    title: str | None = None
    messages: list | None = None


@router.patch("/sessions/{session_id}")
def update_chat_session(
    session_id: str,
    data: UpdateSessionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a chat session (title and/or messages)."""
    session = (
        db.query(ChatSession)
        .filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if data.title is not None:
        session.title = data.title
    if data.messages is not None:
        session.messages = data.messages
    db.commit()
    db.refresh(session)
    return JSONResponse(
        content={
            "id": session.id,
            "title": session.title,
            "messages": session.messages,
            "createdAt": session.created_at.isoformat() if session.created_at else None,
            "updatedAt": session.updated_at.isoformat() if session.updated_at else None,
        }
    )


@router.delete("/sessions/{session_id}")
def delete_chat_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a chat session."""
    session = (
        db.query(ChatSession)
        .filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    db.delete(session)
    db.commit()
    return JSONResponse(content={"status": "deleted", "id": session_id})


# --- Chat ---

class ChatRequest(BaseModel):
    message: str
    lang: str | None = None  # e.g. hi-IN, en-IN - for AI to respond in user's language


@router.post("/chat")
def ai_chat(
    data: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Chat with AI - order medicines by text or get health answers."""
    result = chat(db, data.message.strip(), current_user.id, response_lang=data.lang)
    return JSONResponse(content=result)


class SymptomChatRequest(BaseModel):
    message: str
    lang: str | None = None  # e.g. hi-IN - for AI to respond in user's language


class HistoryItem(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class UnifiedChatRequest(BaseModel):
    message: str
    lang: str | None = None
    history: list[HistoryItem] | None = None
    session_id: str | None = None  # Links agent logs to chat session for combined view


@router.post("/unified-chat")
def unified_chat_endpoint(
    data: UnifiedChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Single chat endpoint. Routes to SentinelRX-AI (Cohere) for symptoms, Order Agent (Groq) for orders.
    Stores in separate tables (general_talk_chat_history, order_medicine_ai_chat_history) linked by session_id.
    """
    from app.services.unified_chat_service import unified_chat
    try:
        history = [{"role": h.role, "content": h.content} for h in (data.history or [])]
        result = unified_chat(
            db,
            data.message.strip(),
            user_id=current_user.id,
            user_email=current_user.email,
            response_lang=data.lang,
            history=history,
            session_id=data.session_id,
        )
        return JSONResponse(content=result)
    except Exception as e:
        import logging
        logging.exception("unified-chat failed")
        return JSONResponse(
            status_code=500,
            content={
                "response": f"Sorry, something went wrong. Please try again. (Error: {str(e)[:80]})",
                "intent": "error",
            },
        )


@router.post("/symptom-chat")
def symptom_chat_endpoint(
    data: SymptomChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """SentinelRX-AI: symptom-based medicine recommendation using Cohere. Recommends only from DB inventory."""
    try:
        result = symptom_chat(
            db,
            data.message.strip(),
            user_id=current_user.id,
            user_email=current_user.email,
            response_lang=data.lang,
        )
        return JSONResponse(content={"response": result})
    except Exception as e:
        import logging
        logging.exception("symptom-chat failed")
        return JSONResponse(
            status_code=500,
            content={"detail": str(e)[:200], "response": f"Sorry, something went wrong. Please try again. (Error: {str(e)[:80]})"},
        )


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
    payment_method: str = "cod"  # cod | upi
    payment_receipt_url: str | None = None  # Cloudinary URL for UPI transaction screenshot


@router.post("/process-order")
def process_order(
    payload: ProcessOrderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Process order confirm/cancel from chat. Accepts JSON payload."""
    try:
        pm = (payload.payment_method or "cod").strip().lower()
        if pm not in ("cod", "upi"):
            pm = "cod"
        form_data = {
            "order_id": payload.order_id.strip(),
            "action": payload.action.strip().lower(),
            "items": [{"medicine_name": i.medicine_name, "quantity": i.quantity} for i in payload.items],
            "delivery_address": payload.delivery_address,
            "delivery_latitude": payload.delivery_latitude,
            "delivery_longitude": payload.delivery_longitude,
            "address_source": payload.address_source,
            "payment_method": pm,
            "payment_receipt_url": payload.payment_receipt_url,
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
