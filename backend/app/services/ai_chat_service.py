"""
AI Chat Service - Agentic Chatbot logic converted from MongoDB to SQL.
Supports: text chat, voice orders, medicine search, order processing.
"""
import html
import json
import re
import uuid
from datetime import datetime
from typing import Any

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.medicine import Medicine
from app.models.order import Order, OrderStatus
from app.models.order_item import OrderItem
from app.models.chat_history import ChatHistory

from app.services.notification_service import notify_order_created

MAX_QUANTITY_LIMIT = 10
CONFIDENCE_THRESHOLD = 0.6


def _split_by_and(message: str) -> list[str]:
    """Split message into medicine segments. E.g. 'Panthenol 2 and Vividrin 1'."""
    return re.split(r"\band\b|,", message.lower())


def _extract_quantity(text: str) -> int | None:
    """Extract order quantity from text."""
    text_lower = text.lower()
    patterns = [
        r"(\d+)\s*(pack|packs|bottle|bottles|strip|strips)",
        r"(order|buy|need|want)\s*(\d+)",
    ]
    for pattern in patterns:
        match = re.search(pattern, text_lower)
        if match:
            nums = [g for g in match.groups() if g and g.isdigit()]
            if nums:
                return int(nums[0])
    cleaned = re.sub(r"\d+\s*(mg|g|ml|mcg|ie|i\.e\.)", "", text_lower)
    num_match = re.search(r"\b\d+\b", cleaned)
    return int(num_match.group()) if num_match else None


def _sql_medicine_search(db: Session, query: str, limit: int = 10) -> list[Medicine]:
    """SQL-based medicine search by name (ILIKE). Replaces MongoDB products_collection."""
    if not query or len(query.strip()) < 2:
        return []
    term = f"%{query.strip().lower()}%"
    return (
        db.query(Medicine)
        .filter(Medicine.name.ilike(term), Medicine.quantity > 0)
        .limit(limit)
        .all()
    )


# Question/info phrases - treat as general chat (medical suggestions, health Q&A) -> GROQ
_QUESTION_PHRASES = re.compile(
    r"\b(what is|tell me about|how does|explain|information about|details about|"
    r"suggest|recommend|advice|advise|symptoms|treatment|cure|benefits|"
    r"side effects|dosage|when to use|how to use|can i take|should i|"
    r"need to know|want to know|help with|question about)\b",
    re.IGNORECASE,
)


def _predict_intent(message: str) -> tuple[str, float]:
    """Rule-based intent detection. Order vs general chat (medical suggestions, Q&A)."""
    lower = message.lower().strip()
    # Medical questions, suggestions, advice -> GROQ general chat
    if _QUESTION_PHRASES.search(lower):
        return "general_chat", 0.5
    # Explicit order keywords + likely ordering (not asking) -> order flow
    if any(x in lower for x in ["order", "buy", "purchase", "give me", "send me", "get me"]):
        return "order_medicine", 1.0
    # "need X" / "want X" - could be order or question; default general, override if we find medicine
    if any(x in lower for x in ["need", "want"]) and len(lower.split()) <= 6:
        return "order_medicine", 0.7
    return "general_chat", 0.5


# Common medicine typos -> correct spelling for search (incl. voice: "parasetamol")
_TYPO_CORRECTIONS = [
    ("parasetamol", "paracetamol"),
    ("paracitemol", "paracetamol"),
    ("paracetemol", "paracetamol"),
    ("tablates", "tablets"),
    ("tablete", "tablets"),
    ("vitamind", "vitamin d"),
]

# Form words to strip - "vitamin b tablet" -> "vitamin b" to match "Vitamin B complex ratiopharm"
_FORM_WORDS = re.compile(
    r"\b(tablet|tablets|capsule|capsules|drops|drop|mg|g|ml|mcg|iu|ie|i\.e\.)\b",
    re.IGNORECASE,
)

# Order keywords to strip before medicine search (e.g. "order 2 paracetamol" -> "paracetamol")
_ORDER_KEYWORDS = re.compile(
    r"\b(order|buy|purchase|need|want|give\s+me|send\s+me|get\s+me|i\s+need|i\s+want)\b",
    re.IGNORECASE,
)


def _hybrid_search_sql(db: Session, segment: str) -> tuple[str | None, int | None, float]:
    """
    Search DB for ANY medicine by name. Returns (medicine_name, quantity, score).
    Works for all medicines in DB — user can order any tablet/medicine we have in stock.
    """
    segment = segment.strip()
    if not segment:
        return None, None, 0.0

    qty = _extract_quantity(segment)
    # Remove numbers and order keywords to get medicine name
    search_text = re.sub(r"\b\d+\b", "", segment)
    search_text = _ORDER_KEYWORDS.sub("", search_text)
    search_text = re.sub(r"\s+", " ", search_text).strip()
    # Fix common typos (e.g. paracitemol -> paracetamol, tablete -> tablets)
    for typo, correct in _TYPO_CORRECTIONS:
        search_text = re.sub(re.escape(typo), correct, search_text, flags=re.IGNORECASE)
    search_text = re.sub(r"\s+", " ", search_text).strip()
    if not search_text or len(search_text) < 2:
        return None, qty or 1, 0.0

    # Try: full phrase -> phrase without form words -> each significant word
    medicines = _sql_medicine_search(db, search_text, limit=5)
    if not medicines:
        search_no_form = _FORM_WORDS.sub("", search_text)
        search_no_form = re.sub(r"\s+", " ", search_no_form).strip()
        if search_no_form and len(search_no_form) >= 2:
            medicines = _sql_medicine_search(db, search_no_form, limit=5)
    if not medicines:
        words = [w for w in search_text.split() if len(w) >= 2]
        for word in words:
            medicines = _sql_medicine_search(db, word, limit=5)
            if medicines:
                break

    if not medicines:
        return None, None, 0.0

    # Pick best match: prefer medicine whose name contains more of the search terms
    search_words = set(search_text.lower().split())
    search_words.discard("")  # type: ignore
    if len(search_words) > 1:
        best = max(
            medicines,
            key=lambda m: sum(1 for w in search_words if w in m.name.lower()),
        )
        med = best
    else:
        med = medicines[0]
    name_lower = med.name.lower()
    search_lower = search_text.lower()
    score = 1.0 if search_lower in name_lower or name_lower in search_lower else 0.8
    # Also accept if any search word is in medicine name (e.g. "paracetamol" in "Paracetamol 500mg")
    if score < CONFIDENCE_THRESHOLD:
        for word in search_text.lower().split():
            if len(word) >= 2 and word in name_lower:
                score = 0.85
                break
    if score < CONFIDENCE_THRESHOLD:
        return None, None, 0.0
    return med.name, qty or 1, score


def _sanitize_field_name(name: str) -> str:
    return re.sub(r"[^a-zA-Z0-9_]", "_", name)


def _normalize_entities(entities: list[dict]) -> list[dict]:
    """Merge duplicate medicines and cap quantities."""
    merged: dict[str, int] = {}
    for item in entities:
        name = item.get("medicine_name")
        if not name:
            continue
        try:
            qty = int(item.get("quantity", 1))
        except (TypeError, ValueError):
            qty = 1
        qty = max(1, min(qty, MAX_QUANTITY_LIMIT))
        merged[name] = merged.get(name, 0) + qty
    return [{"medicine_name": k, "quantity": v} for k, v in merged.items()]


def get_medicines_for_autocomplete(db: Session) -> list[dict]:
    """Return medicine list for frontend autocomplete. Replaces MongoDB products_collection."""
    medicines = db.query(Medicine).filter(Medicine.quantity > 0).all()
    return [{"product_name": m.name, "id": str(m.id)} for m in medicines]


def generate_order_preview(db: Session, entities: list[dict], user_id: str) -> str:
    """Generate order preview HTML with confirm/cancel buttons. SQL-based."""
    entities = _normalize_entities(entities)
    if not entities:
        return '<div style="padding:20px;background:#fee2e2;border-radius:12px;">No valid medicines detected.</div>'

    preview_items: list[dict] = []
    for item in entities:
        med = db.query(Medicine).filter(Medicine.name == item["medicine_name"]).first()
        if not med or med.quantity <= 0:
            continue
        qty = max(1, min(item["quantity"], med.quantity))
        preview_items.append({
            "medicine_name": med.name,
            "quantity": qty,
            "price": float(med.price),
            "stock": med.quantity,
        })

    if not preview_items:
        return '<div style="padding:20px;background:#fef3c7;border-radius:12px;">Selected medicines are currently not available.</div>'

    order_id = str(uuid.uuid4())
    order_payload = json.dumps({
        "order_id": order_id,
        "items": [{"medicine_name": p["medicine_name"], "quantity": p["quantity"]} for p in preview_items],
    })
    order_payload_escaped = html.escape(order_payload)
    html_parts = [
        '<div style="max-width:100%;padding:24px;background:#f8fafc;border-radius:16px;border:1px solid #e2e8f0;box-shadow:0 1px 3px rgba(15,23,42,0.06);">',
        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">',
        '<span style="font-size:20px;">📄</span>',
        '<h2 style="margin:0;font-size:16px;font-weight:700;color:#0f172a;">Order Preview</h2>',
        '</div>',
        f'<p style="margin:0 0 16px;font-size:12px;color:#64748b;font-family:monospace;">Order ID: {order_id}</p>',
        f'<form method="POST" action="/api/v1/ai-chat/process-order" id="orderForm" data-order="{order_payload_escaped}">',
        f'<input type="hidden" name="order_id" value="{order_id}">',
    ]

    for item in preview_items:
        safe_name = html.escape(item["medicine_name"])
        safe_id = _sanitize_field_name(item["medicine_name"])
        html_parts.append(f"""
        <div style="padding:16px;margin-bottom:12px;border-radius:12px;background:#ffffff;border:1px solid #e2e8f0;">
            <div style="font-size:15px;font-weight:600;margin-bottom:8px;color:#0f172a;">{safe_name}</div>
            <div style="font-size:13px;color:#64748b;margin-bottom:10px;">Price: ₹ {round(item['price'],2)} | Stock: {item['stock']}</div>
            <div style="display:flex;align-items:center;gap:10px;">
                <input type="number" name="quantity_{safe_id}" value="{item['quantity']}" min="1" max="{item['stock']}"
                    style="width:80px;height:38px;text-align:center;border-radius:8px;border:1px solid #cbd5e1;font-size:14px;background:#fff;">
                <input type="hidden" name="medicine_{safe_id}" value="{safe_name}">
            </div>
        </div>
        """)

    html_parts.append("""
    <div style="margin-top:20px;padding-top:16px;border-top:1px solid #e2e8f0;">
        <div style="display:flex;gap:12px;flex-wrap:wrap;" id="buttonContainer">
            <button type="submit" name="action" value="confirm" style="flex:1;min-width:120px;padding:12px 16px;background:#2563eb;color:white;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;">✅ Confirm Order</button>
            <button type="submit" name="action" value="cancel" style="flex:1;min-width:120px;padding:12px 16px;background:#64748b;color:white;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;">❌ Cancel Order</button>
        </div>
    </div>
    </form>
    </div>
    """)
    return "".join(html_parts)


def process_order_from_chat(
    db: Session, form_data: dict, user_id: uuid.UUID
) -> dict[str, Any]:
    """
    Process order confirm/cancel from chat. Expects form_data with order_id, action, and items.
    items: [{"medicine_name": str, "quantity": int}]
    """
    order_id_str = str(form_data.get("order_id", "")).strip()
    if not order_id_str:
        return {"status": "error", "order_id": None, "message": "Invalid order request.", "items": []}

    action = str(form_data.get("action", "")).strip().lower()
    if action not in ["confirm", "cancel"]:
        return {"status": "error", "order_id": order_id_str, "message": "Invalid action.", "items": []}

    if action == "cancel":
        return {
            "status": "cancelled",
            "order_id": order_id_str,
            "items": [],
            "total": 0,
            "message": "Order cancelled successfully.",
        }

    # Confirm: build order_items from payload
    raw_items = form_data.get("items") or []
    order_items: list[dict] = []
    total_bill = 0.0

    for item in raw_items:
        medicine_name = str(item.get("medicine_name") or "").strip()
        if not medicine_name:
            continue
        try:
            quantity = int(item.get("quantity", 1))
        except (TypeError, ValueError):
            quantity = 1
        quantity = max(1, min(quantity, MAX_QUANTITY_LIMIT))

        med = db.query(Medicine).filter(Medicine.name == medicine_name).with_for_update().first()
        if not med or med.quantity <= 0:
            continue
        quantity = min(quantity, med.quantity)

        med.quantity -= quantity
        subtotal = quantity * float(med.price)
        total_bill += subtotal
        order_items.append({
            "medicine_name": medicine_name,
            "quantity": quantity,
            "price": float(med.price),
            "subtotal": round(subtotal, 2),
        })

    if not order_items:
        return {
            "status": "error",
            "order_id": order_id_str,
            "message": "No valid items available or stock changed.",
            "items": [],
        }

    try:
        order = Order(
            user_id=user_id,
            total_amount=round(total_bill, 2),
            status=OrderStatus.CONFIRMED,
        )
        db.add(order)
        db.flush()

        for oi in order_items:
            med = db.query(Medicine).filter(Medicine.name == oi["medicine_name"]).first()
            if med:
                db.add(
                    OrderItem(
                        order_id=order.id,
                        medicine_id=med.id,
                        quantity=oi["quantity"],
                        price=oi["price"],
                    )
                )

        notify_order_created(db, user_id=user_id, order_id=order.id, total_amount=order.total_amount)
        db.commit()
        db.refresh(order)

        return {
            "status": "confirmed",
            "order_id": str(order.id),
            "items": order_items,
            "total": round(total_bill, 2),
            "message": "Order confirmed successfully.",
        }
    except Exception:
        db.rollback()
        raise


def _extract_medicines_via_llm(message: str) -> list[tuple[str, int]]:
    """Use LLM to extract medicine names and quantities from order message. Returns [(name, qty), ...]."""
    try:
        from langchain_groq import ChatGroq
        settings = get_settings()
        if not settings.groq_api_key:
            return []
        llm = ChatGroq(
            model="llama-3.1-8b-instant",
            temperature=0.1,
            groq_api_key=settings.groq_api_key,
        )
        prompt = f"""Extract medicine/product names and quantities from this order message.
Return ONLY a JSON array, nothing else. Example: [{{"name":"Vitamin B complex ratiopharm","qty":2}}]
If quantity not specified, use 1. Extract the exact medicine name as the user said it (any medicine — Paracetamol, Vitamin B, Ibuprofen, Magnesium, etc.).

Message: "{message}"
JSON array:"""
        response = llm.invoke(prompt)
        text = response.content if hasattr(response, "content") else str(response)
        text = text.strip().replace("```json", "").replace("```", "").strip()
        arr = json.loads(text)
        return [(str(item.get("name", "")).strip(), int(item.get("qty", 1))) for item in arr if item.get("name")]
    except Exception:
        return []


def invoke_llm(message: str) -> str:
    """
    Invoke GROQ for general chat: medical suggestions, health questions, general advice.
    Uses GROQ API directly - answer is returned and displayed on UI.
    """
    try:
        from langchain_groq import ChatGroq
        settings = get_settings()
        if not settings.groq_api_key:
            return "AI is not configured. Please set GROQ_API_KEY in backend/.env"
        llm = ChatGroq(
            model="llama-3.1-8b-instant",
            temperature=0.5,
            groq_api_key=settings.groq_api_key,
        )
        prompt = f"""You are an AI Pharmaceutical Assistant. Provide helpful, clear answers.

For medical questions: explain symptoms, treatments, when to see a doctor.
For medicine suggestions: recommend OTC options when appropriate; for prescription drugs, advise consulting a doctor.
For general health: give practical, responsible advice.
Always add a brief disclaimer: "Consult a pharmacist or doctor for personalized advice."

User message:
{message}

Your response:"""
        response = llm.invoke(prompt)
        return response.content if hasattr(response, "content") else str(response)
    except Exception as e:
        return f"AI temporarily unavailable: {str(e)}"


def chat(
    db: Session, message: str, user_id: uuid.UUID | None
) -> dict[str, Any]:
    """
    Main chat handler. Intent + medicine detection + order preview or LLM.
    Logs to ChatHistory (SQL).
    """
    message = (message or "").strip()
    if not message:
        return {"response": "Message cannot be empty.", "intent": "unknown", "confidence": 0}

    uid = user_id or uuid.uuid4()  # anonymous fallback
    predicted_intent, confidence = _predict_intent(message)
    segments = _split_by_and(message)
    detected_entities: list[dict] = []

    for seg in segments:
        name, qty, score = _hybrid_search_sql(db, seg)
        if name and score >= CONFIDENCE_THRESHOLD:
            detected_entities.append({"medicine_name": name, "quantity": qty or 1})

    # Override to order when we found medicines AND message looks like order (not a question)
    if detected_entities and not _QUESTION_PHRASES.search(message):
        if predicted_intent == "order_medicine":
            confidence = 1.0
        elif re.search(r"\b\d+\b", message) or len(message.split()) <= 5:
            predicted_intent = "order_medicine"
            confidence = 0.9

    if predicted_intent == "order_medicine":
        if not detected_entities:
            # Fallback: use LLM to extract medicine names, then search DB
            llm_extracted = _extract_medicines_via_llm(message)
            for name, qty in llm_extracted:
                if name and len(name) >= 2:
                    meds = _sql_medicine_search(db, name, limit=1)
                    if meds:
                        detected_entities.append({"medicine_name": meds[0].name, "quantity": max(1, min(qty, MAX_QUANTITY_LIMIT))})
        if not detected_entities:
            final_response = "Medicine not found in our catalog. You can order any medicine we have in stock — try 'Browse Medicines' to see what's available, or say the exact name (e.g. order 2 Vitamin B complex ratiopharm)."
        else:
            final_response = generate_order_preview(db, detected_entities, str(uid))
    else:
        # General chat: only use LLM for non-order questions (info, symptoms, etc.)
        final_response = invoke_llm(message)

    # Log to ChatHistory (SQL)
    try:
        db.add(
            ChatHistory(
                user_id=uid,
                user_message=message,
                ai_response={
                    "response": final_response[:500] if isinstance(final_response, str) else "[HTML]",
                    "intent": predicted_intent,
                    "confidence": confidence,
                },
            )
        )
        db.commit()
    except Exception:
        db.rollback()

    return {
        "response": final_response,
        "intent": predicted_intent,
        "confidence": round(confidence * 100, 2),
    }
