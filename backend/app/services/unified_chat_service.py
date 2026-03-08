"""
Unified Chat Service - Routes user messages to SentinelRX-AI (Cohere) or Order Agent (Groq).
- Symptom-based questions → symptom_chat (Cohere)
- Order medicines, stock inquiry, general order flow → chat (Groq)
"""
import re
from typing import Any
from uuid import UUID

from sqlalchemy.orm import Session

from app.services.ai_chat_service import chat
from app.services.symptom_chat_service import symptom_chat

# Symptom intent: user describing symptoms or asking for medicine recommendations for a condition
_SYMPTOM_PHRASES = re.compile(
    r"\b(i have|i'm having|i got|suffering from|"
    r"what should i (do|take|use)|which (tablet|medicine|medication)|"
    r"what (tablet|medicine|medication)|suggest (for|me)|recommend (for|me)|"
    r"advice (for|on)|medicine for|tablet for|for fever|for headache|"
    r"for cold|for cough|for pain|for allergy|for stomach|for my|"
    r"symptom|symptoms|fever|headache|cold|cough|pain|allergy|stomach)\b",
    re.IGNORECASE,
)

# Order intent: explicit ordering or medicine name (voice may drop "order")
_ORDER_PHRASES = re.compile(
    r"\b(order|buy|purchase|give me|send me|get me|i need|i want)\b",
    re.IGNORECASE,
)
# Medicine-like: "2 paracetamol", "paracetamol 500mg" - route to order when short
_MEDICINE_LIKE = re.compile(
    r"^\s*(\d+\s+)?[a-z]+\s+\d+\s*(mg|g|ml|tablets?|capsules?)|^\s*\d+\s+[a-z]+",
    re.IGNORECASE,
)


def _route_to_symptom(message: str) -> bool:
    """
    Route to SentinelRX-AI (Cohere) when user asks about symptoms or medicine recommendations.
    Route to Order Agent (Groq) when user explicitly orders or asks about stock.
    """
    lower = message.lower().strip()
    has_symptom = bool(_SYMPTOM_PHRASES.search(lower))
    has_order = bool(_ORDER_PHRASES.search(lower))

    # "order paracetamol" / "give me crocin" → order
    if has_order:
        return False

    # "2 paracetamol 500mg" / "Paracetamol 500 mg tablets" (voice drops "order") → order
    if len(lower.split()) <= 8 and (_MEDICINE_LIKE.search(lower) or any(w in lower for w in ["paracetamol", "crocin", "nurofen", "tablets", "mg", "500"])):
        return False

    # "I have fever, what medicine?" / "which tablet for fever?" → symptom
    if has_symptom:
        return True

    # Default: order agent handles stock inquiry, general chat
    return False


def unified_chat(
    db: Session,
    message: str,
    user_id: UUID | None = None,
    user_email: str | None = None,
    response_lang: str | None = None,
    history: list[dict] | None = None,
    session_id: str | None = None,
) -> dict[str, Any]:
    """
    Single entry point. Routes to symptom_chat (Cohere) or chat (Groq).
    Stores in separate tables: general_talk_chat_history (SentinelRX-AI), order_medicine_ai_chat_history (Order Agent).
    """
    message = (message or "").strip()
    if not message:
        return {"response": "Message cannot be empty.", "intent": "unknown"}

    use_symptom = _route_to_symptom(message)

    if use_symptom:
        response = symptom_chat(
            db,
            message,
            user_id=user_id,
            user_email=user_email,
            response_lang=response_lang,
            chat_session_id=session_id,
            history=history or [],
        )
        return {"response": response, "intent": "symptom"}
    else:
        result = chat(
            db,
            message,
            user_id,
            response_lang=response_lang,
            history=history or [],
            chat_session_id=session_id,
        )
        out = {
            "response": result.get("response", ""),
            "intent": result.get("intent", "order"),
            "confidence": result.get("confidence"),
        }
        if result.get("speak"):
            out["speak"] = result["speak"]
        return out
