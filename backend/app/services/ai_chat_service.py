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
from app.models.user import User
from app.models.chat_history import GeneralTalkChatHistory, OrderMedicineAiChatHistory

from app.services.notification_service import notify_order_created, notify_admins_new_order
from app.invoice.invoice_service import try_send_order_confirmation_email

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


# Stock/inventory inquiry - user asking about OUR pharmacy's availability (not "how to stock at home")
_STOCK_INQUIRY_PHRASES = re.compile(
    r"\b(do you have|can you have|you have|you got|got any|"
    r"in stock|inventory|available|what medicine|any medicine|"
    r"what do you have|what's in stock|medicine in stock|have in stock|"
    r"that in stock|it in stock|have that|have it)\b",
    re.IGNORECASE,
)
# Exclude: "how to stock" = personal advice, not our inventory
_STOCK_INQUIRY_EXCLUDE = re.compile(r"how to (stock|have|keep)", re.IGNORECASE)

# Question/info phrases - treat as general chat (medical suggestions, health Q&A) -> GROQ
_QUESTION_PHRASES = re.compile(
    r"\b(what is|tell me about|how does|explain|information about|details about|"
    r"suggest|recommend|advice|advise|symptoms|treatment|cure|benefits|"
    r"side effects|dosage|when to use|how to use|can i take|should i|"
    r"need to know|want to know|help with|question about|"
    r"what tablet|what medicine|which tablet|which medicine|"
    r"fever|headache|cold|cough|pain|stomach|allergy)\b",
    re.IGNORECASE,
)


def _predict_intent(message: str) -> tuple[str, float]:
    """Rule-based intent detection. Order vs stock inquiry vs general chat."""
    lower = message.lower().strip()
    # Stock/inventory inquiry -> check DB and return actual stock (exclude "how to stock" = personal advice)
    if _STOCK_INQUIRY_PHRASES.search(lower) and not _STOCK_INQUIRY_EXCLUDE.search(lower):
        return "stock_inquiry", 0.95
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
        from app.services.geocoding_service import geocode_address

        customer = db.query(User).filter(User.id == user_id).first()
        customer_name = customer.name if customer else "Customer"
        addr = form_data.get("delivery_address")
        lat = form_data.get("delivery_latitude")
        lng = form_data.get("delivery_longitude")
        # Resolve lat/lng: use provided, else parse "Location: lat, lng" from address, else geocode
        if addr and (lat is None or lng is None):
            m = re.search(r"Location:\s*([+-]?\d+\.?\d*)\s*,\s*([+-]?\d+\.?\d*)", str(addr).strip(), re.I)
            if m:
                try:
                    lat, lng = float(m.group(1)), float(m.group(2))
                except (ValueError, TypeError):
                    geocoded_lat, geocoded_lng = geocode_address(addr)
                    lat, lng = lat or geocoded_lat, lng or geocoded_lng
            else:
                geocoded_lat, geocoded_lng = geocode_address(addr)
                lat, lng = lat or geocoded_lat, lng or geocoded_lng
        order = Order(
            user_id=user_id,
            user_name=customer_name,
            total_amount=round(total_bill, 2),
            status=OrderStatus.CONFIRMED,
            delivery_address=addr,
            delivery_latitude=lat,
            delivery_longitude=lng,
            address_source=form_data.get("address_source"),
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
        notify_admins_new_order(
            db,
            order_id=order.id,
            customer_name=customer_name,
            total_amount=order.total_amount,
            source="ai_chat",
        )
        db.commit()
        db.refresh(order)

        try_send_order_confirmation_email(db, order.id)

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


def _handle_stock_inquiry(db: Session, message: str) -> str:
    """
    Handle stock/inventory questions. Fetches from DB and returns actual stock info.
    - "Do you have paracetamol in stock?" -> search for paracetamol, return if found
    - "What medicine do you have?" / "Any medicine in stock?" -> list all in-stock medicines
    """
    lower = message.lower().strip()
    # Try to extract a specific medicine name (e.g. "do you have paracetamol in stock?")
    # Remove common phrases to get potential medicine name
    search_text = re.sub(
        r"\b(do you have|can you have|is there|any|in stock|available|medicine|medicines|tablet|tablets|the)\b",
        "",
        lower,
        flags=re.IGNORECASE,
    )
    search_text = re.sub(r"\s+", " ", search_text).strip()
    search_text = search_text.strip("?.,! ")

    medicines_in_stock = (
        db.query(Medicine)
        .filter(Medicine.quantity > 0)
        .order_by(Medicine.name)
        .limit(100)
        .all()
    )

    if not medicines_in_stock:
        return "We currently have no medicines in stock. Please check back later or browse our catalog."

    # If user seems to ask about a specific medicine, search for it
    if search_text and len(search_text) >= 2:
        matched = _sql_medicine_search(db, search_text, limit=5)
        if matched:
            parts = []
            for m in matched[:5]:
                parts.append(f"• {m.name} — ₹{m.price}, {m.quantity} units in stock")
            return (
                f"Yes! We have the following in stock:\n\n"
                + "\n".join(parts)
                + "\n\nYou can order any of these by typing the medicine name. Consult a pharmacist for dosage advice."
            )

    # General "what do you have" / "any medicine in stock" -> list all (or sample)
    total = len(medicines_in_stock)
    show_limit = min(25, total)
    lines = []
    for m in medicines_in_stock[:show_limit]:
        lines.append(f"• {m.name} — ₹{m.price} ({m.quantity} in stock)")
    response = (
        f"Yes! We have {total} medicine(s) in stock. Here are some:\n\n"
        + "\n".join(lines)
    )
    if total > show_limit:
        response += f"\n\n...and {total - show_limit} more. Type a medicine name to search or say 'order [name]' to place an order."
    else:
        response += "\n\nYou can order any of these by typing the medicine name. Consult a pharmacist for personalized advice."
    return response


def _get_inventory_for_llm(db: Session, limit: int = 80) -> str:
    """Get medicine inventory as a formatted string for LLM context. Includes stock quantity."""
    medicines = (
        db.query(Medicine)
        .filter(Medicine.quantity > 0)
        .order_by(Medicine.name)
        .limit(limit)
        .all()
    )
    if not medicines:
        return "(No medicines in stock)"
    lines = []
    for m in medicines:
        desc = ""
        if m.description:
            desc = f" - {m.description[:80]}..." if len(m.description) > 80 else f" - {m.description}"
        cat = f" [{m.category}]" if m.category else ""
        lines.append(f"- {m.name}{cat} | Price: ₹{m.price} | In stock: {m.quantity} units{desc}")
    return "\n".join(lines)


LANG_NAMES = {
    "hi-IN": "Hindi", "mr-IN": "Marathi", "ta-IN": "Tamil", "te-IN": "Telugu",
    "bn-IN": "Bengali", "kn-IN": "Kannada", "ml-IN": "Malayalam", "pa-IN": "Punjabi",
    "gu-IN": "Gujarati", "ur-IN": "Urdu", "en-IN": "English", "en-US": "English", "en-GB": "English",
}


def invoke_llm(db: Session, message: str, response_lang: str | None = None) -> str:
    """
    Invoke GROQ for general chat: medical suggestions, health questions, general advice.
    IMPORTANT: For medicine suggestions (e.g. fever, headache), ONLY recommend from our inventory.
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
        inventory = _get_inventory_for_llm(db)
        lang_instruction = ""
        if response_lang and response_lang in LANG_NAMES:
            lang_instruction = f"\nIMPORTANT: Respond ONLY in {LANG_NAMES[response_lang]}. The user is speaking in {LANG_NAMES[response_lang]}.\n"
        prompt = f"""You are an AI Pharmaceutical Assistant for a pharmacy. Provide helpful, clear answers.{lang_instruction}

CRITICAL RULES FOR MEDICINE SUGGESTIONS:
1. ONLY recommend medicines from our inventory below. Every medicine listed is IN STOCK.
2. When suggesting a medicine, you MUST confirm: "We have [medicine name] in stock" and mention the price (₹) and units available.
3. Do NOT suggest any medicine not in this list. If no suitable medicine is in our inventory, say "We don't have a specific medicine for that in stock right now. Please browse our medicines or consult a pharmacist."

Our medicine inventory (name | price | stock - all are available):
{inventory}

For medical questions: explain symptoms, treatments, when to see a doctor.
For medicine suggestions: pick from the inventory above. ALWAYS say we have it in stock, the price, and units available.
For general health: give practical, responsible advice.
Always add a brief disclaimer: "Consult a pharmacist or doctor for personalized advice."

User message:
{message}

Your response (ONLY suggest from our inventory; always confirm stock availability and price):"""
        response = llm.invoke(prompt)
        return response.content if hasattr(response, "content") else str(response)
    except Exception as e:
        return f"AI temporarily unavailable: {str(e)}"


def chat(
    db: Session, message: str, user_id: uuid.UUID | None, response_lang: str | None = None
) -> dict[str, Any]:
    """
    Main chat handler. Intent + medicine detection + order preview or LLM.
    Logs to order_medicine_ai_chat_history or general_talk_chat_history based on intent.
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

    if predicted_intent == "stock_inquiry":
        final_response = _handle_stock_inquiry(db, message)
    elif predicted_intent == "order_medicine":
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
        # General chat: LLM for medical suggestions, symptoms, etc.
        final_response = invoke_llm(db, message, response_lang)

    # Log to appropriate chat history table based on intent
    try:
        from app.models.user import User
        user = db.query(User).filter(User.id == uid).first()
        user_email = user.email if user else None
        ai_resp = {
            "response": final_response[:500] if isinstance(final_response, str) else "[HTML]",
            "intent": predicted_intent,
            "confidence": confidence,
        }
        if predicted_intent == "general_chat":
            db.add(
                GeneralTalkChatHistory(
                    user_id=uid,
                    user_email=user_email,
                    user_message=message,
                    ai_response=ai_resp,
                )
            )
        else:
            # order_medicine, stock_inquiry, etc.
            db.add(
                OrderMedicineAiChatHistory(
                    user_id=uid,
                    user_email=user_email,
                    user_message=message,
                    ai_response=ai_resp,
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
